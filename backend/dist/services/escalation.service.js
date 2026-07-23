"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escalationService = void 0;
const database_1 = require("../lib/database");
const client_1 = require("../generated/prisma/client");
const notification_service_1 = require("./notification.service");
const LEVEL_ORDER = [client_1.SupportLevel.L1, client_1.SupportLevel.L2];
function nextLevel(current) {
    const idx = current ? LEVEL_ORDER.indexOf(current) : -1;
    return LEVEL_ORDER[Math.min(idx + 1, LEVEL_ORDER.length - 1)];
}
exports.escalationService = {
    async escalate(params) {
        const { ticketId, reason, escalatedById, isAutomatic = false } = params;
        const ticket = await database_1.prisma.ticket.findUniqueOrThrow({
            where: { id: ticketId },
            include: { keywords: true },
        });
        const [escalation, updatedTicket] = await database_1.prisma.$transaction([
            database_1.prisma.ticketEscalation.create({
                data: {
                    ticketId,
                    fromLevel: 'L1',
                    toLevel: 'L1',
                    escalatedById,
                    escalatedToId: ticket.assigneeId,
                    reason,
                    isAutomatic,
                },
            }),
            database_1.prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    supportLevel: 'L1',
                    assigneeId: ticket.assigneeId,
                    escalatedToId: ticket.assigneeId,
                    escalatedAt: new Date(),
                    escalationReason: reason,
                    status: client_1.TicketStatus.IN_PROGRESS,
                },
            }),
        ]);
        const cxo = await database_1.prisma.department.findFirst({
            where: {
                id: ticket.departmentId,
            },
            select: {
                cxo: {
                    select: {
                        email: true,
                        fullName: true
                    }
                }
            }
        });
        await notification_service_1.notificationService.sendTicketEscalated(updatedTicket, escalation, cxo?.cxo);
        return { escalation, ticket: updatedTicket };
    },
    async runSlaSweep() {
        const breached = await database_1.prisma.ticket.findMany({
            where: {
                slaDeadline: { lt: new Date() },
                slaBreached: false,
                status: { notIn: [client_1.TicketStatus.RESOLVED, client_1.TicketStatus.ON_HOLD] },
            },
        });
        console.log(breached);
        const results = [];
        for (const ticket of breached) {
            const breachedTicket = await database_1.prisma.ticket.update({
                where: { id: ticket.id },
                data: { slaBreached: true },
                select: { assignee: { select: { fullName: true } } }
            });
            try {
                const managerAndCxo = await database_1.prisma.department.findFirst({
                    where: { id: ticket.departmentId },
                    select: {
                        name: true,
                        manager: { select: { email: true, fullName: true } },
                        cxo: { select: { email: true, fullName: true } }
                    }
                });
                if (!managerAndCxo || !managerAndCxo.cxo?.email || !managerAndCxo.manager?.email || !breachedTicket.assignee?.fullName) {
                    results.push("Manager and CXO doesn't exists for this department");
                    return results;
                }
                await notification_service_1.notificationService.sendSlaBreachWarning(ticket, { email: managerAndCxo.manager.email, departmentName: managerAndCxo.name, assigneeName: breachedTicket.assignee?.fullName });
                results.push(`Notification has been sent to ${managerAndCxo.manager.fullName}`);
            }
            catch (err) {
                console.error(`[sla-sweep] could not auto-escalate ticket ${ticket.ticketNumber}:`, err);
            }
        }
        return results;
    },
};
function bumpPriority(p) {
    const order = [
        client_1.InternalPriorityLevel.CRITICAL,
        client_1.InternalPriorityLevel.HIGH,
        client_1.InternalPriorityLevel.MEDIUM,
        client_1.InternalPriorityLevel.LOW,
    ];
    const idx = order.indexOf(p);
    return order[Math.max(idx - 1, 0)];
}
//# sourceMappingURL=escalation.service.js.map