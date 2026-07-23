"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.managerDashboardController = void 0;
const database_1 = require("../lib/database");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("../generated/prisma/client");
exports.managerDashboardController = {
    async getTeam(req, res) {
        const managerId = req.user.id;
        console.log(managerId);
        const { departmentId } = req.query;
        const managedDepartments = await database_1.prisma.department.findMany({
            where: { managerId },
            select: { id: true, name: true },
        });
        if (managedDepartments.length === 0) {
            throw new errorHandler_1.AppError("You are not assigned to any department", 400);
        }
        const managedDeptIds = managedDepartments.map((d) => d.id);
        if (departmentId && !managedDeptIds.includes(departmentId)) {
            throw new errorHandler_1.AppError("Department is not managed by you", 403);
        }
        const targetDeptIds = departmentId ? [departmentId] : managedDeptIds;
        const department = departmentId
            ? managedDepartments.find((d) => d.id === departmentId)
            : managedDepartments[0];
        const users = await database_1.prisma.user.findMany({
            where: {
                agentsdepartmentId: { in: targetDeptIds },
                id: { not: managerId },
                isActive: true,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isAvailableForAssignment: true,
            },
            orderBy: { fullName: "asc" },
        });
        const usersWithTickets = await Promise.all(users.map(async (u) => {
            const [activeTickets, totalRequested, openCount, inProgressCount, resolvedCount, onHoldCount, breachedCount, escalatedCount] = await Promise.all([
                database_1.prisma.ticket.count({
                    where: { assigneeId: u.id, status: { not: "RESOLVED" } },
                }),
                database_1.prisma.ticket.count({
                    where: { requesterId: u.id },
                }),
                database_1.prisma.ticket.count({
                    where: { assigneeId: u.id, status: "OPEN" },
                }),
                database_1.prisma.ticket.count({
                    where: { assigneeId: u.id, status: "IN_PROGRESS" },
                }),
                database_1.prisma.ticket.count({
                    where: { assigneeId: u.id, status: "RESOLVED" },
                }),
                database_1.prisma.ticket.count({
                    where: { assigneeId: u.id, status: "ON_HOLD" },
                }),
                database_1.prisma.ticket.count({
                    where: { assigneeId: u.id, slaBreached: true, status: { not: "RESOLVED" } },
                }),
                database_1.prisma.ticket.count({
                    where: { escalatedToId: u.id, status: { not: "RESOLVED" } },
                }),
            ]);
            return {
                id: u.id,
                fullName: u.fullName,
                email: u.email,
                role: u.role,
                isAvailableForAssignment: u.isAvailableForAssignment,
                activeTickets,
                totalRequested,
                openTickets: openCount,
                inProgressTickets: inProgressCount,
                resolvedTickets: resolvedCount,
                onHoldTickets: onHoldCount,
                breachedTickets: breachedCount,
                escalatedTickets: escalatedCount,
            };
        }));
        res.json({
            departmentId: departmentId || managedDeptIds[0],
            departmentName: departmentId
                ? department?.name || "Unknown"
                : managedDepartments.map((d) => d.name).join(", "),
            users: usersWithTickets,
        });
    },
    async getDepartmentTickets(req, res) {
        const managerId = req.user.id;
        const { departmentId, filter } = req.query;
        const managedDepartments = await database_1.prisma.department.findMany({
            where: { managerId },
            select: { id: true, name: true },
        });
        if (managedDepartments.length === 0) {
            throw new errorHandler_1.AppError("You are not assigned to any department", 400);
        }
        const managedDeptIds = managedDepartments.map((d) => d.id);
        if (departmentId && !managedDeptIds.includes(departmentId)) {
            throw new errorHandler_1.AppError("Department is not managed by you", 403);
        }
        const targetDeptIds = departmentId ? [departmentId] : managedDeptIds;
        const where = { departmentId: { in: targetDeptIds } };
        if (filter === "active") {
            where.status = { not: "RESOLVED" };
        }
        else if (filter === "resolved") {
            where.status = "RESOLVED";
        }
        else if (filter === "breached") {
            where.slaBreached = true;
            where.status = { not: "RESOLVED" };
        }
        else if (filter === "escalated") {
            where.escalatedToId = { not: null };
            where.status = { not: "RESOLVED" };
        }
        else if (filter === "onHold") {
            where.status = "ON_HOLD";
        }
        const tickets = await database_1.prisma.ticket.findMany({
            where,
            include: {
                assignee: { select: { id: true, fullName: true, email: true } },
                requester: { select: { id: true, fullName: true, email: true } },
                category: { select: { name: true } },
                department: { select: { name: true } },
                comments: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    include: { user: { select: { fullName: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({
            filter: filter || "all",
            tickets,
        });
    },
    async getUserTickets(req, res) {
        const managerId = req.user.id;
        const { userId } = req.params;
        const manager = await database_1.prisma.department.findMany({
            where: { managerId: managerId },
            select: {
                id: true
            }
        });
        const targetUser = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { agentsdepartmentId: true, fullName: true },
        });
        const managerIds = manager.map(ids => ids.id);
        if (!manager || !targetUser || !targetUser.agentsdepartmentId || !managerIds.includes(targetUser.agentsdepartmentId)) {
            throw new errorHandler_1.AppError("User is not in your department", 403);
        }
        const tickets = await database_1.prisma.ticket.findMany({
            where: {
                OR: [
                    { assigneeId: userId },
                ],
                departmentId: { in: managerIds },
            },
            include: {
                assignee: { select: { id: true, fullName: true, email: true } },
                requester: { select: { id: true, fullName: true, email: true } },
                category: { select: { name: true } },
                department: { select: { name: true } },
                comments: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    include: { user: { select: { fullName: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({
            user: { id: userId, fullName: targetUser?.fullName },
            tickets,
        });
    },
    async reassignTicket(req, res) {
        const managerId = req.user.id;
        const { ticketId, newAssigneeId } = req.body;
        if (!ticketId || !newAssigneeId) {
            throw new errorHandler_1.AppError("ticketId and newAssigneeId are required", 400);
        }
        const manager = await database_1.prisma.department.findMany({
            where: { managerId: managerId },
            select: { id: true },
        });
        const ticket = await database_1.prisma.ticket.findUnique({
            where: { id: ticketId },
            select: { departmentId: true, assigneeId: true, requesterId: true, status: true, ticketNumber: true, slaBreached: true, escalatedToId: true },
        });
        const managerIds = manager.map(ids => ids.id);
        if (!ticket)
            throw new errorHandler_1.AppError("Ticket not found", 404);
        if (!managerIds.includes(ticket.departmentId)) {
            throw new errorHandler_1.AppError("Ticket is not in your department", 403);
        }
        if (ticket.assigneeId === newAssigneeId) {
            throw new errorHandler_1.AppError("Ticket is already assigned to this user", 400);
        }
        const prevStatus = ticket.status;
        const newAssignee = await database_1.prisma.user.findUnique({
            where: { id: newAssigneeId },
            select: { agentsdepartmentId: true, isActive: true },
        });
        if (!newAssignee || !newAssignee.isActive) {
            throw new errorHandler_1.AppError("New assignee not found or inactive", 400);
        }
        if (!newAssignee.agentsdepartmentId || !managerIds.includes(newAssignee.agentsdepartmentId)) {
            throw new errorHandler_1.AppError("New assignee is not in your department", 400);
        }
        const updated = await database_1.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                assigneeId: newAssigneeId,
                assignedById: managerId,
                assignmentMethod: "MANUAL",
                assignedAt: new Date(),
            },
            include: {
                assignee: { select: { fullName: true } },
            },
        });
        await database_1.prisma.ticketStatusHistory.create({
            data: {
                ticketId,
                fromStatus: prevStatus,
                status: updated.status,
                changedById: managerId,
                changedAt: new Date(),
                note: `Reassigned by manager from ${prevStatus} to ${updated.assignee?.fullName || "another agent"}`,
            },
        });
        await database_1.prisma.auditLog.create({
            data: {
                userId: managerId,
                action: `Reassigned ticket ${updated.ticketNumber} to ${updated.assignee?.fullName || "another agent"}`,
                entityType: "Ticket",
                entityId: ticketId,
            },
        });
        res.json(updated);
    },
    async setDepartmentManager(req, res) {
        const { userId } = req.body;
        if (!userId)
            throw new errorHandler_1.AppError("userId is required", 400);
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { agentsdepartmentId: true, role: true },
        });
        if (!user)
            throw new errorHandler_1.AppError("User not found", 404);
        if (!user.agentsdepartmentId)
            throw new errorHandler_1.AppError("User must belong to a department first", 400);
        if (user.role === client_1.UserRole.HOD) {
            throw new errorHandler_1.AppError("User is already a Department Manager", 400);
        }
        const updated = await database_1.prisma.user.update({
            where: { id: userId },
            data: { role: client_1.UserRole.HOD },
        });
        await database_1.prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: `Promoted user ${updated.fullName} to Department Manager`,
                entityType: "User",
                entityId: userId,
            },
        });
        res.json(updated);
    },
};
//# sourceMappingURL=managerDashboard.controller.js.map