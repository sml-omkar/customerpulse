"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const database_1 = require("../lib/database");
const enums_1 = require("../generated/prisma/enums");
const errorHandler_1 = require("../middleware/errorHandler");
const Rolechangereassignment_service_1 = require("../services/Rolechangereassignment.service");
const zoneStateMap_1 = require("../utils/zoneStateMap");
const TICKET_WORKING_ROLES = [enums_1.UserRole.AGENT];
exports.userController = {
    async me(req, res) {
        const user = await database_1.prisma.user.findUniqueOrThrow({
            where: { id: req.user.id },
        });
        res.json({ ...user, departmentId: user.agentsdepartmentId });
    },
    async metric(req, res) {
        try {
            const userId = req.params.id;
            const [openTickets, assignedTickets, slaBreachedTickets, resolvedTickets, onhold,] = await database_1.prisma.$transaction([
                database_1.prisma.ticket.count({
                    where: {
                        requesterId: userId,
                        status: { in: [enums_1.TicketStatus.OPEN, enums_1.TicketStatus.IN_PROGRESS, enums_1.TicketStatus.REOPENED] },
                    },
                }),
                database_1.prisma.ticket.count({
                    where: {
                        status: { notIn: ["RESOLVED"] },
                        assigneeId: req.params.id
                    },
                }),
                database_1.prisma.ticket.count({
                    where: {
                        assigneeId: userId,
                        slaBreached: true,
                    },
                }),
                database_1.prisma.ticket.count({
                    where: {
                        requesterId: userId,
                        status: "RESOLVED",
                    },
                }),
                database_1.prisma.ticket.count({
                    where: {
                        requesterId: userId,
                        status: enums_1.TicketStatus.ON_HOLD
                    }
                }),
            ]);
            return res.status(200).json({
                success: true,
                data: {
                    openTickets,
                    assignedTickets,
                    slaBreachedTickets,
                    resolvedTickets,
                    onhold,
                },
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch metrics",
            });
        }
    },
    async managedDepartments(req, res) {
        const dept = await database_1.prisma.department.findMany({
            where: {
                managerId: req.params.id
            },
            select: {
                id: true,
                name: true
            }
        });
        res.json(dept);
    },
    async list(req, res) {
        const users = await database_1.prisma.user.findMany({
            where: {
                role: { notIn: [enums_1.UserRole.REQUESTER] }
            },
            select: {
                id: true, fullName: true, email: true, role: true,
                supportLevel: true, isActive: true, isAvailableForAssignment: true, maxActiveTickets: true,
                agentsdepartmentId: true,
                state: true,
                windCategory: true,
                _count: {
                    select: {
                        ticketsAssigned: true
                    }
                }
            },
        });
        res.json(users.map(u => ({ ...u, departmentId: u.agentsdepartmentId })));
    },
    async getById(req, res) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.params.id },
        });
        if (!user)
            return res.status(404).json({ error: "Not found" });
        res.json({ ...user, departmentId: user.agentsdepartmentId });
    },
    async categories(req, res) {
        const links = await database_1.prisma.categoryAgent.findMany({
            where: { userId: req.params.id },
            select: { categoryId: true, proficiency: true },
        });
        res.json(links);
    },
    async setMyAvailability(req, res) {
        const user = await database_1.prisma.user.update({
            where: { id: req.user.id },
            data: { isAvailableForAssignment: Boolean(req.body.isAvailableForAssignment) },
        });
        res.json(user);
    },
    async update(req, res) {
        const { role, departmentId, headDepartmentId, supportLevel, isActive, isAvailableForAssignment, maxActiveTickets, zone, windCategory } = req.body;
        const existing = await database_1.prisma.user.findUnique({ where: { id: req.params.id } });
        if (!existing)
            throw new errorHandler_1.AppError("User not found", 404);
        if (departmentId) {
            const department = await database_1.prisma.department.findUnique({ where: { id: departmentId } });
            if (!department)
                throw new errorHandler_1.AppError("Department not found", 404);
        }
        const finalRole = role !== undefined ? role : existing.role;
        if ((zone !== undefined || windCategory !== undefined) && finalRole !== enums_1.UserRole.AGENT) {
            throw new errorHandler_1.AppError("zone and windCategory can only be set on AGENT-role users", 400);
        }
        let finalState = existing.state;
        if (zone !== undefined) {
            if (zone === null || zone === "") {
                finalState = null;
            }
            else {
                const resolved = (0, zoneStateMap_1.resolveZone)(zone);
                if (!resolved)
                    throw new errorHandler_1.AppError(`Unrecognized zone: "${zone}"`, 400);
                finalState = (0, zoneStateMap_1.statesForZone)(resolved);
            }
        }
        let finalWindCategory = existing.windCategory;
        if (windCategory !== undefined) {
            if (windCategory === null || windCategory === "") {
                finalWindCategory = null;
            }
            else if (!Object.values(enums_1.WindCategory).includes(windCategory)) {
                throw new errorHandler_1.AppError(`Invalid windCategory: "${windCategory}"`, 400);
            }
            else {
                finalWindCategory = windCategory;
            }
        }
        const departmentProvided = departmentId !== undefined;
        const finalAgentDepartmentId = departmentProvided ? departmentId || null : existing.agentsdepartmentId;
        const currentlyManagedDepartments = await database_1.prisma.department.findMany({ where: { managerId: existing.id }, select: { id: true } });
        const currentlyCxoDepartments = await database_1.prisma.department.findMany({ where: { cxoId: existing.id }, select: { id: true } });
        const currentHeadDepartmentId = existing.role === enums_1.UserRole.HOD
            ? currentlyManagedDepartments[0]?.id ?? null
            : existing.role === enums_1.UserRole.CXO
                ? currentlyCxoDepartments[0]?.id ?? null
                : null;
        const finalHeadDepartmentId = headDepartmentId || currentHeadDepartmentId || null;
        if ((finalRole === enums_1.UserRole.HOD || finalRole === enums_1.UserRole.CXO) && !finalHeadDepartmentId) {
            throw new errorHandler_1.AppError("headDepartmentId is required when setting a user's role to HOD or CXO", 400);
        }
        let headDepartment = null;
        if (finalHeadDepartmentId) {
            headDepartment = await database_1.prisma.department.findUnique({
                where: { id: finalHeadDepartmentId },
                select: { id: true, name: true, managerId: true, cxoId: true },
            });
            if (!headDepartment)
                throw new errorHandler_1.AppError("Department not found", 404);
        }
        if (finalRole === enums_1.UserRole.HOD && headDepartment?.managerId && headDepartment.managerId !== existing.id) {
            throw new errorHandler_1.AppError(`${headDepartment.name} already has an HOD. Reassign or remove the current HOD before promoting someone else into that seat.`, 409);
        }
        if (finalRole === enums_1.UserRole.CXO && headDepartment?.cxoId && headDepartment.cxoId !== existing.id) {
            throw new errorHandler_1.AppError(`${headDepartment.name} already has a CXO. Reassign or remove the current CXO before promoting someone else into that seat.`, 409);
        }
        const oldAgentDepartmentId = existing.agentsdepartmentId;
        const roleChangedAwayFromAgent = existing.role === enums_1.UserRole.AGENT && !TICKET_WORKING_ROLES.includes(finalRole) && !!oldAgentDepartmentId;
        const departmentChangedForAgent = existing.role === enums_1.UserRole.AGENT &&
            finalRole === enums_1.UserRole.AGENT &&
            !!oldAgentDepartmentId &&
            departmentProvided &&
            finalAgentDepartmentId !== oldAgentDepartmentId;
        const user = await database_1.prisma.user.update({
            where: { id: req.params.id },
            data: {
                ...(role !== undefined && { role }),
                agentsdepartmentId: finalAgentDepartmentId,
                ...(supportLevel !== undefined && { supportLevel: supportLevel || null }),
                ...(isActive !== undefined && { isActive: Boolean(isActive) }),
                ...(isAvailableForAssignment !== undefined && { isAvailableForAssignment: Boolean(isAvailableForAssignment) }),
                ...(maxActiveTickets !== undefined && { maxActiveTickets: Number(maxActiveTickets) }),
                ...(zone !== undefined && { state: finalState }),
                ...(windCategory !== undefined && { windCategory: finalWindCategory }),
            },
        });
        for (const dept of currentlyManagedDepartments) {
            if (finalRole !== enums_1.UserRole.HOD || dept.id !== finalHeadDepartmentId) {
                await database_1.prisma.department.update({ where: { id: dept.id }, data: { managerId: null } });
            }
        }
        for (const dept of currentlyCxoDepartments) {
            if (finalRole !== enums_1.UserRole.CXO || dept.id !== finalHeadDepartmentId) {
                await database_1.prisma.department.update({ where: { id: dept.id }, data: { cxoId: null } });
            }
        }
        if (finalRole === enums_1.UserRole.HOD && finalHeadDepartmentId) {
            await database_1.prisma.department.update({ where: { id: finalHeadDepartmentId }, data: { managerId: user.id } });
        }
        if (finalRole === enums_1.UserRole.CXO && finalHeadDepartmentId) {
            await database_1.prisma.department.update({ where: { id: finalHeadDepartmentId }, data: { cxoId: user.id } });
        }
        let ticketReassignmentSummary = null;
        if (roleChangedAwayFromAgent || departmentChangedForAgent) {
            ticketReassignmentSummary = await Rolechangereassignment_service_1.roleChangeReassignmentService.handleAgentTicketReassignment({
                movedUserId: user.id,
                movedUserFullName: user.fullName,
                movedUserEmail: user.email,
                oldDepartmentId: oldAgentDepartmentId,
                reason: roleChangedAwayFromAgent ? "ROLE_CHANGE" : "DEPARTMENT_TRANSFER",
                newRole: user.role,
                newDepartmentId: user.agentsdepartmentId,
                performedById: req.user.id,
            });
        }
        res.json({
            ...user,
            departmentId: user.agentsdepartmentId,
            headDepartmentId: finalHeadDepartmentId,
            zone: user.state ? (0, zoneStateMap_1.resolveZone)(zone) || zone : null,
            ticketReassignmentSummary,
        });
    },
};
//# sourceMappingURL=user.controller.js.map