"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logStatusChange = logStatusChange;
const database_1 = require("../lib/database");
async function logStatusChange(params) {
    const { ticketId, fromStatus, toStatus, changedById, note } = params;
    await database_1.prisma.ticketStatusHistory.create({
        data: { ticketId, fromStatus: fromStatus ?? undefined, status: toStatus, changedById: changedById ?? undefined, note },
    });
    if (changedById) {
        await database_1.prisma.auditLog.create({
            data: {
                userId: changedById,
                action: "TICKET_STATUS_CHANGED",
                entityType: "Ticket",
                entityId: ticketId,
            },
        });
    }
}
//# sourceMappingURL=statushistory.service.js.map