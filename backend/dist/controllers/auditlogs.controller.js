"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogController = void 0;
const database_1 = require("../lib/database");
exports.auditLogController = {
    async list(req, res) {
        const logs = await database_1.prisma.auditLog.findMany({
            where: {
                userId: req.query.userId,
                entityType: req.query.entityType,
                entityId: req.query.entityId,
            },
            include: { user: { select: { id: true, fullName: true, email: true } } },
            orderBy: { createdAt: "desc" },
            take: 200,
        });
        res.json(logs);
    },
    async create(req, res) {
        const log = await database_1.prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: req.body.action,
                entityType: req.body.entityType,
                entityId: req.body.entityId,
            },
        });
        res.status(201).json(log);
    },
};
//# sourceMappingURL=auditlogs.controller.js.map