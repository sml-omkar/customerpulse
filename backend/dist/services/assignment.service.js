"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignmentService = void 0;
const database_1 = require("../lib/database");
const client_1 = require("../generated/prisma/client");
const notification_service_1 = require("./notification.service");
const statushistory_service_1 = require("./statushistory.service");
const rbac_1 = require("../utils/rbac");
const errorHandler_1 = require("../middleware/errorHandler");
const OPEN_STATUSES = [client_1.TicketStatus.OPEN, client_1.TicketStatus.IN_PROGRESS, client_1.TicketStatus.ON_HOLD, client_1.TicketStatus.REOPENED];
function requiredWindCategories(isWindClient) {
    if (isWindClient === null)
        return null;
    return isWindClient ? [client_1.WindCategory.WIND, client_1.WindCategory.BOTH] : [client_1.WindCategory.NON_WIND, client_1.WindCategory.BOTH];
}
function matchesWindRequirement(agentWindCategory, required) {
    if (required === null)
        return true;
    if (!agentWindCategory)
        return false;
    return required.includes(agentWindCategory);
}
function parseStateList(raw) {
    if (!raw)
        return [];
    return raw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0);
}
function matchesStateRequirement(agentState, required) {
    if (required.length === 0)
        return true;
    const agentStates = parseStateList(agentState);
    if (agentStates.length === 0)
        return false;
    return agentStates.some((s) => required.includes(s));
}
exports.assignmentService = {
    async findBestAgent(ticketId, options) {
        const excludeAgentId = options?.excludeAgentId;
        const ticket = await database_1.prisma.ticket.findUniqueOrThrow({
            where: { id: ticketId },
            include: { keywords: true },
        });
        const client = await database_1.prisma.client.findFirst({ where: { name: ticket.clientName } });
        const required = requiredWindCategories(client ? client.isWindClient : null);
        const requiredStates = parseStateList(ticket.state);
        if (ticket.categoryId) {
            console.log("Hitting ticket category");
            const categoryAgents = await database_1.prisma.categoryAgent.findMany({
                where: {
                    categoryId: ticket.categoryId,
                    agent: { agentsdepartmentId: ticket.departmentId },
                    ...(excludeAgentId ? { userId: { not: excludeAgentId } } : {}),
                },
                include: {
                    agent: {
                        include: { ticketsAssigned: { where: { status: { in: OPEN_STATUSES } }, select: { id: true } } },
                    },
                },
            });
            console.log("agents with same categories as mentioned in the ticket", categoryAgents);
            let eligible;
            if (categoryAgents.length >= 1) {
                eligible = categoryAgents
                    .map((ca) => ({ agent: ca.agent, proficiency: ca.proficiency, openCount: ca.agent.ticketsAssigned.length }));
            }
            else {
                eligible = categoryAgents
                    .filter((ca) => ticket.requesterId == ca.id)
                    .map((ca) => ({ agent: ca.agent, proficiency: ca.proficiency, openCount: ca.agent.ticketsAssigned.length }));
            }
            if (eligible.length > 0) {
                const windMatched = eligible.filter((e) => matchesWindRequirement(e.agent.windCategory, required));
                const windPool = windMatched.length > 0 ? windMatched : eligible;
                const stateMatched = windPool.filter((e) => matchesStateRequirement(e.agent.state, requiredStates));
                const pool = stateMatched.length > 0 ? stateMatched : windPool;
                pool.sort((a, b) => b.proficiency - a.proficiency || a.openCount - b.openCount);
                return { agent: pool[0].agent, method: client_1.AssignmentMethod.AUTO_CATEGORY };
            }
        }
        const candidates = await database_1.prisma.user.findMany({
            where: {
                agentsdepartmentId: ticket.departmentId,
                role: { in: rbac_1.ASSIGNABLE_AGENT_ROLES },
                ...(excludeAgentId ? { id: { not: excludeAgentId } } : {}),
            },
            include: {
                skills: true,
                ticketsAssigned: { where: { status: { in: OPEN_STATUSES } }, select: { id: true } },
            },
        });
        if (candidates.length === 0)
            return null;
        const ticketKeywordIds = new Set(ticket.keywords.map((k) => k.keywordId));
        const scored = candidates
            .filter((agent) => agent.id != ticket.requesterId)
            .map((agent) => {
            const skillScore = agent.skills
                .filter((s) => ticketKeywordIds.has(s.keywordId))
                .reduce((sum, s) => sum + s.proficiency, 0);
            const openCount = agent.ticketsAssigned.length;
            const atCapacity = openCount >= agent.maxActiveTickets;
            return { agent, skillScore, openCount, atCapacity };
        })
            .filter((c) => !c.atCapacity);
        if (scored.length === 0)
            return null;
        const windMatched = scored.filter((c) => matchesWindRequirement(c.agent.windCategory, required));
        const capacityPool = windMatched.length > 0 ? windMatched : scored;
        const stateMatchedCapacity = capacityPool.filter((c) => matchesStateRequirement(c.agent.state, requiredStates));
        const finalPool = stateMatchedCapacity.length > 0 ? stateMatchedCapacity : capacityPool;
        const hasSkillMatch = finalPool.some((c) => c.skillScore > 0);
        const pool = hasSkillMatch ? finalPool.filter((c) => c.skillScore > 0) : finalPool;
        pool.sort((a, b) => b.skillScore - a.skillScore || a.openCount - b.openCount);
        return {
            agent: pool[0].agent,
            method: hasSkillMatch ? client_1.AssignmentMethod.AUTO_KEYWORD : client_1.AssignmentMethod.AUTO_LOAD_BALANCE,
        };
    },
    async autoAssign(ticketId, assignedById, options) {
        const result = await this.findBestAgent(ticketId, options);
        if (!result) {
            return null;
        }
        const previous = await database_1.prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
        const ticket = await database_1.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                assigneeId: result.agent.id,
                assignedById: assignedById ?? null,
                assignmentMethod: result.method,
                assignedAt: new Date(),
                status: client_1.TicketStatus.OPEN,
            },
        });
        if (previous.status !== client_1.TicketStatus.OPEN) {
            await (0, statushistory_service_1.logStatusChange)({ ticketId, fromStatus: previous.status, toStatus: client_1.TicketStatus.OPEN, changedById: assignedById ?? null });
        }
        await notification_service_1.notificationService.sendTicketAssigned(ticket, result.agent);
        return ticket;
    },
    async manualAssign(ticketId, agentId, assignedById) {
        const agent = await database_1.prisma.user.findUniqueOrThrow({ where: { id: agentId } });
        const previous = await database_1.prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
        if (!agent || !previous) {
            throw new errorHandler_1.AppError('agent or ticket not found', 401);
        }
        if (previous.slaBreached || previous.escalatedToId) {
            throw new errorHandler_1.AppError("This ticket has been escalated and can only be reassigned by a department manager", 403);
        }
        const ticket = await database_1.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                assigneeId: agentId,
                assignedById,
                assignmentMethod: client_1.AssignmentMethod.MANUAL,
                assignedAt: new Date(),
                status: client_1.TicketStatus.OPEN,
            },
        });
        if (previous.status !== client_1.TicketStatus.OPEN) {
            await (0, statushistory_service_1.logStatusChange)({ ticketId, fromStatus: previous.status, toStatus: client_1.TicketStatus.OPEN, changedById: assignedById });
        }
        await notification_service_1.notificationService.sendTicketAssigned(ticket, agent);
        return ticket;
    },
};
//# sourceMappingURL=assignment.service.js.map