"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = void 0;
const database_1 = require("../lib/database");
exports.notificationController = {
    async myMessages(req, res) {
        const messages = await database_1.prisma.adminMessage.findMany({
            where: { userId: req.user.id },
            include: { fromAdmin: { select: { fullName: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json(messages);
    },
    async markRead(req, res) {
        const updated = await database_1.prisma.adminMessage.updateMany({
            where: { id: req.params.id, userId: req.user.id },
            data: { isRead: true },
        });
        res.json({ updated: updated.count });
    },
};
//# sourceMappingURL=notification.controller.js.map