"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketService = void 0;
const database_1 = require("../lib/database");
const token_1 = require("../utils/token");
const priority_service_1 = require("./priority.service");
const internalPriority_service_1 = require("./internalPriority.service");
const keyword_service_1 = require("./keyword.service");
const assignment_service_1 = require("./assignment.service");
const notification_service_1 = require("./notification.service");
const statushistory_service_1 = require("./statushistory.service");
const client_1 = require("../generated/prisma/client");
const time_1 = require("../utils/time");
const TOP_MANAGEMENT_DESIGNATIONS = [client_1.Designation.CEO, client_1.Designation.COO, client_1.Designation.CXO];
const BASE_SLA_MINUTES_BY_PRIORITY = {
    P1: 4 * 60,
    P2: 8 * 60,
    P3: 24 * 60,
    P4: 72 * 60,
};
exports.ticketService = {
    async createTicketWithUniqueNumber(data) {
        const MAX_ATTEMPTS = 3;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                return await database_1.prisma.ticket.create({
                    data: { ...data, ticketNumber: (0, token_1.generateTicketNumber)() },
                });
            }
            catch (err) {
                const isUniqueViolation = err?.code === "P2002" && err?.meta?.target?.includes("ticketNumber");
                if (!isUniqueViolation || attempt === MAX_ATTEMPTS)
                    throw err;
            }
        }
        throw new Error("Failed to generate a unique ticket number");
    },
    async createTicket(params) {
        const { requesterId, departmentId, categoryId, title, description, tags = [], representative, employeeId, clientName, clientEmail, dateOfOccurance, site, state, designation, projectId, } = params;
        const requester = await database_1.prisma.user.findUniqueOrThrow({ where: { id: requesterId } });
        const category = categoryId
            ? await database_1.prisma.ticketCategory.findUnique({ where: { id: categoryId } })
            : null;
        const priority = priority_service_1.priorityService.computePriority({
            categoryDefaultPriority: category?.defaultPriority,
        });
        const baseSlaMinutes = category?.defaultSlaMinutes ?? BASE_SLA_MINUTES_BY_PRIORITY[priority];
        const slaDeadline = (0, time_1.minutesFromNow)(baseSlaMinutes);
        const project = projectId ? await database_1.prisma.project.findUnique({ where: { id: projectId } }) : null;
        const client = await database_1.prisma.client.findFirst({ where: { name: clientName } });
        const internalPriorityResult = internalPriority_service_1.internalPriorityService.computeScore({
            isWorkStopping: category?.isWorkStopping ?? false,
            isSafetyViolation: category?.isSafetyViolation ?? false,
            isShutdownJob: project?.isShutdownJob ?? false,
            isReportedByTopManagement: !!designation && TOP_MANAGEMENT_DESIGNATIONS.includes(designation),
            isKeyClient: client?.isKeyClient ?? false,
        });
        const ticket = await this.createTicketWithUniqueNumber({
            title,
            description,
            requesterId,
            departmentId,
            categoryId: category?.id,
            representative,
            employeeId,
            clientName,
            clientEmail,
            dateOfOccurance: new Date(dateOfOccurance),
            site,
            state,
            designation,
            projectId,
            priority,
            internalPriority: internalPriorityResult.level,
            slaDeadline,
            slaTotalMinutes: baseSlaMinutes,
        });
        await (0, statushistory_service_1.logStatusChange)({ ticketId: ticket.id, fromStatus: null, toStatus: client_1.TicketStatus.OPEN, changedById: requesterId });
        await keyword_service_1.keywordService.extractAndLinkKeywords({
            ticketId: ticket.id,
            departmentId,
            text: `${title} ${description ?? ""}`,
        });
        await notification_service_1.notificationService.sendTicketCreated(ticket, requester);
        await assignment_service_1.assignmentService.autoAssign(ticket.id);
        return database_1.prisma.ticket.findUniqueOrThrow({
            where: { id: ticket.id },
            include: { keywords: { include: { keyword: true } }, assignee: true },
        });
    },
    async resolveTicket(ticketId, resolvedById, comment) {
        const previous = await database_1.prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
        const ticket = await database_1.prisma.ticket.update({
            where: { id: ticketId },
            data: { status: client_1.TicketStatus.RESOLVED, resolvedAt: new Date() },
            include: { requester: true },
        });
        await (0, statushistory_service_1.logStatusChange)({
            ticketId,
            fromStatus: previous.status,
            toStatus: client_1.TicketStatus.RESOLVED,
            changedById: resolvedById,
            note: comment,
        });
        await database_1.prisma.ticketComment.create({
            data: {
                ticketId,
                userId: resolvedById,
                commentText: comment,
                isInternal: false,
            },
        });
        await notification_service_1.notificationService.sendTicketResolved(ticket, ticket.requester);
        return ticket;
    },
};
//# sourceMappingURL=ticket.service.js.map