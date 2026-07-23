"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketCategoryController = void 0;
const database_1 = require("../lib/database");
const client_1 = require("../generated/prisma/client");
const time_1 = require("../utils/time");
const BASE_SLA_MINUTES_BY_PRIORITY = {
    P1: 4 * 60,
    P2: 8 * 60,
    P3: 24 * 60,
    P4: 72 * 60,
};
const ACTIVE_TICKET_STATUSES = [
    client_1.TicketStatus.OPEN,
    client_1.TicketStatus.REOPENED,
    client_1.TicketStatus.IN_PROGRESS,
];
function resolveConsumedMinutes(ticket, previousCategorySlaMinutes, now) {
    if (!ticket.slaDeadline)
        return 0;
    const remaining = (0, time_1.diffInMinutes)(now, ticket.slaDeadline);
    const total = ticket.slaTotalMinutes
        ?? previousCategorySlaMinutes
        ?? BASE_SLA_MINUTES_BY_PRIORITY[ticket.priority];
    return Math.max(0, total - remaining);
}
const ADMIN_ONLY_FIELD_ROLES = [client_1.UserRole.GLOBAL_ADMIN, client_1.UserRole.HOD];
function stripAdminOnlyFields(category, role) {
    if (role && ADMIN_ONLY_FIELD_ROLES.includes(role))
        return category;
    const { isWorkStopping, isSafetyViolation, ...rest } = category;
    return rest;
}
exports.ticketCategoryController = {
    async create(req, res) {
        const category = await database_1.prisma.ticketCategory.create({
            data: {
                departmentId: req.params.departmentId,
                subDepartmentId: req.body.subDepartmentId || null,
                name: req.body.name,
                defaultSlaMinutes: req.body.defaultSlaMinutes,
                defaultPriority: req.body.defaultPriority,
                isWorkStopping: !!req.body.isWorkStopping,
                isSafetyViolation: !!req.body.isSafetyViolation,
            },
        });
        res.status(201).json(category);
    },
    async list(req, res) {
        const { subDepartmentId } = req.query;
        const categories = await database_1.prisma.ticketCategory.findMany({
            where: {
                departmentId: req.params.departmentId,
                ...(subDepartmentId ? { subDepartmentId: String(subDepartmentId) } : {}),
            },
        });
        res.json(categories.map((c) => stripAdminOnlyFields(c, req.user?.role)));
    },
    async update(req, res) {
        const previousCategory = await database_1.prisma.ticketCategory.findUniqueOrThrow({
            where: { id: req.params.id },
            select: { defaultSlaMinutes: true },
        });
        const nextSlaMinutes = req.body.defaultSlaMinutes;
        const slaIsChanging = nextSlaMinutes !== undefined && nextSlaMinutes !== previousCategory.defaultSlaMinutes;
        const category = await database_1.prisma.ticketCategory.update({
            where: { id: req.params.id },
            data: {
                name: req.body.name,
                defaultSlaMinutes: req.body.defaultSlaMinutes,
                defaultPriority: req.body.defaultPriority,
                ...(req.body.subDepartmentId !== undefined
                    ? { subDepartmentId: req.body.subDepartmentId || null }
                    : {}),
                ...(req.body.isWorkStopping !== undefined
                    ? { isWorkStopping: !!req.body.isWorkStopping }
                    : {}),
                ...(req.body.isSafetyViolation !== undefined
                    ? { isSafetyViolation: !!req.body.isSafetyViolation }
                    : {}),
            },
        });
        if (slaIsChanging) {
            const now = new Date();
            const activeTickets = await database_1.prisma.ticket.findMany({
                where: {
                    categoryId: category.id,
                    status: { in: ACTIVE_TICKET_STATUSES },
                },
                select: {
                    id: true,
                    priority: true,
                    slaDeadline: true,
                    slaTotalMinutes: true,
                },
            });
            await Promise.all(activeTickets.map((ticket) => {
                const consumedMinutes = resolveConsumedMinutes(ticket, previousCategory.defaultSlaMinutes, now);
                const remainingMinutes = nextSlaMinutes - consumedMinutes;
                return database_1.prisma.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        slaDeadline: (0, time_1.addMinutes)(now, remainingMinutes),
                        slaTotalMinutes: nextSlaMinutes,
                    },
                });
            }));
        }
        res.json(category);
    },
    async delete(req, res) {
        const deleteCategory = await database_1.prisma.ticketCategory.delete({
            where: { id: req.params.id }
        });
        res.status(200).json({ message: "delete the category" });
    }
};
//# sourceMappingURL=ticketCategory.controller.js.map