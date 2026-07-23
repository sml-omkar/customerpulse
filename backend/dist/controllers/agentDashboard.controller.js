"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentDashboardController = void 0;
const database_1 = require("../lib/database");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("../generated/prisma/client");
function buildSegments(history, createdAt, currentStatus, endBoundary) {
    const timeline = history.length > 0 ? history : [{ status: currentStatus, changedAt: createdAt }];
    const totalsByStatus = new Map();
    for (let i = 0; i < timeline.length; i++) {
        const start = timeline[i].changedAt;
        const end = timeline[i + 1] ? timeline[i + 1].changedAt : endBoundary;
        const hours = Math.max(0, (end.getTime() - start.getTime()) / 3600000);
        if (hours === 0)
            continue;
        const status = timeline[i].status;
        totalsByStatus.set(status, (totalsByStatus.get(status) ?? 0) + hours);
    }
    return Array.from(totalsByStatus.entries()).map(([status, hours]) => ({
        status,
        hours: Number(hours.toFixed(2)),
    }));
}
function percentile(sorted, p) {
    if (sorted.length === 0)
        return null;
    if (sorted.length === 1)
        return sorted[0];
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi)
        return sorted[lo];
    const frac = idx - lo;
    return sorted[lo] + (sorted[hi] - sorted[lo]) * frac;
}
exports.agentDashboardController = {
    async getAnalytics(req, res) {
        const agentId = req.user.id;
        const agent = await database_1.prisma.user.findUnique({
            where: { id: agentId },
            select: {
                id: true,
                fullName: true,
                agentsdepartmentId: true,
                assignedDepartment: {
                    select: {
                        id: true,
                        name: true,
                        manager: { select: { fullName: true } },
                        _count: { select: { agents: true } },
                    },
                },
            },
        });
        if (!agent)
            throw new errorHandler_1.AppError("Agent not found", 404);
        const departmentId = agent.agentsdepartmentId;
        const [categories, tickets, deptOpenCount, deptBreachedCount, deptTotalCount, deptResolvedTats] = await Promise.all([
            departmentId
                ? database_1.prisma.ticketCategory.findMany({
                    where: { departmentId },
                    select: { id: true, name: true },
                    orderBy: { name: "asc" },
                })
                : Promise.resolve([]),
            database_1.prisma.ticket.findMany({
                where: { assigneeId: agentId },
                select: {
                    id: true,
                    ticketNumber: true,
                    title: true,
                    priority: true,
                    internalPriority: true,
                    status: true,
                    categoryId: true,
                    category: { select: { name: true } },
                    requester: { select: { fullName: true } },
                    createdAt: true,
                    dateOfOccurance: true,
                    slaDeadline: true,
                    resolvedAt: true,
                    slaBreached: true,
                    turnOverTime: true,
                    statusHistory: {
                        select: { status: true, changedAt: true },
                        orderBy: { changedAt: "asc" },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 500,
            }),
            departmentId
                ? database_1.prisma.ticket.count({ where: { departmentId, status: { not: client_1.TicketStatus.RESOLVED } } })
                : Promise.resolve(0),
            departmentId
                ? database_1.prisma.ticket.count({ where: { departmentId, slaBreached: true } })
                : Promise.resolve(0),
            departmentId ? database_1.prisma.ticket.count({ where: { departmentId } }) : Promise.resolve(0),
            departmentId
                ? database_1.prisma.ticket.findMany({
                    where: { departmentId, status: client_1.TicketStatus.RESOLVED, turnOverTime: { not: null } },
                    select: { turnOverTime: true },
                })
                : Promise.resolve([]),
        ]);
        const now = new Date();
        const ticketDTOs = tickets.map((t) => {
            const endBoundary = t.resolvedAt ?? now;
            const segments = buildSegments(t.statusHistory, t.createdAt, t.status, endBoundary);
            const tatHours = t.turnOverTime != null ? Number((t.turnOverTime / 3600).toFixed(1)) : null;
            const dueInHrs = t.slaDeadline ? Math.round((t.slaDeadline.getTime() - now.getTime()) / 3600000) : null;
            return {
                id: t.id,
                ticketNumber: t.ticketNumber,
                subject: t.title,
                requester: t.requester?.fullName ?? "Unknown",
                priority: t.priority,
                internalPriority: t.internalPriority,
                status: t.status,
                categoryId: t.categoryId,
                categoryName: t.category?.name ?? "Uncategorized",
                createdAt: t.createdAt,
                dateOfOccurance: t.dateOfOccurance,
                dueAt: t.slaDeadline,
                dueInHrs,
                resolvedAt: t.resolvedAt,
                tatHours,
                slaBreached: t.slaBreached,
                segments,
            };
        });
        const resolvedTatHours = deptResolvedTats
            .map((t) => t.turnOverTime)
            .filter((v) => v != null)
            .map((seconds) => seconds / 3600)
            .sort((a, b) => a - b);
        const departmentAvgTatHours = resolvedTatHours.length > 0
            ? Number((resolvedTatHours.reduce((s, v) => s + v, 0) / resolvedTatHours.length).toFixed(1))
            : null;
        const departmentTargetTatHours = resolvedTatHours.length >= 5 ? Number(percentile(resolvedTatHours, 25).toFixed(1)) : null;
        const agentOpenCount = ticketDTOs.filter((t) => t.status !== "RESOLVED").length;
        const departmentSnapshot = departmentId
            ? {
                departmentName: agent.assignedDepartment?.name ?? null,
                managerName: agent.assignedDepartment?.manager?.fullName ?? null,
                agentCount: agent.assignedDepartment?._count.agents ?? 0,
                openTickets: deptOpenCount,
                breachedTickets: deptBreachedCount,
                totalTickets: deptTotalCount,
                compliancePct: deptTotalCount ? Math.round(((deptTotalCount - deptBreachedCount) / deptTotalCount) * 100) : 100,
                yourOpenSharePct: deptOpenCount ? Math.round((agentOpenCount / deptOpenCount) * 100) : 0,
            }
            : null;
        res.json({
            agent: { id: agent.id, fullName: agent.fullName },
            department: agent.assignedDepartment ? { id: agent.assignedDepartment.id, name: agent.assignedDepartment.name } : null,
            departmentSnapshot,
            categories,
            tickets: ticketDTOs,
            departmentAvgTatHours,
            departmentTargetTatHours,
        });
    },
};
//# sourceMappingURL=agentDashboard.controller.js.map