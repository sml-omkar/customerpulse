"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentController = void 0;
const database_1 = require("../lib/database");
const rbac_1 = require("../utils/rbac");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("../generated/prisma/client");
const notification_service_1 = require("../services/notification.service");
const CLOSED_STATUSES = [client_1.TicketStatus.RESOLVED];
exports.commentController = {
    async create(req, res) {
        const ticket = await database_1.prisma.ticket.findUniqueOrThrow({
            where: { id: req.params.ticketId },
            include: { requester: true, assignee: true },
        });
        if (CLOSED_STATUSES.includes(ticket.status)) {
            throw new errorHandler_1.AppError("This ticket is resolved/closed - reopen it before adding new comments", 400);
        }
        const isInternal = Boolean(req.body.isInternal) && (0, rbac_1.isStaff)(req.user.role);
        const comment = await database_1.prisma.ticketComment.create({
            data: {
                ticketId: req.params.ticketId,
                userId: req.user.id,
                commentText: req.body.commentText,
                isInternal,
            },
            include: { user: true, attachment: true },
        });
        res.status(201).json(comment);
        const recipients = [];
        if (!isInternal && ticket.requester.id !== req.user.id) {
            recipients.push(ticket.requester);
        }
        if (ticket.assignee && ticket.assignee.id !== req.user.id) {
            recipients.push(ticket.assignee);
        }
        await Promise.all(recipients.map((recipient) => notification_service_1.notificationService.sendCommentAdded(ticket, recipient, comment.user, comment.commentText))).catch((err) => {
            console.error("Failed to send comment notification:", err);
        });
    },
    async list(req, res) {
        const staff = (0, rbac_1.isStaff)(req.user.role);
        const comments = await database_1.prisma.ticketComment.findMany({
            where: { ticketId: req.params.ticketId, ...(staff ? {} : { isInternal: false }) },
            include: { user: true, attachment: true },
            orderBy: { createdAt: "asc" },
        });
        res.json(comments);
    },
};
//# sourceMappingURL=comment.controller.js.map