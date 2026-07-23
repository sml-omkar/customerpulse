"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestorController = void 0;
const database_1 = require("../lib/database");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("../generated/prisma/client");
const invitation_service_1 = require("../services/invitation.service");
exports.requestorController = {
    async list(req, res) {
        const requestors = await database_1.prisma.user.findMany({
            where: { role: client_1.UserRole.REQUESTER },
            select: {
                id: true,
                fullName: true,
                email: true,
                employeeId: true,
                approvalStatus: true,
                isActive: true,
                createdAt: true,
                _count: { select: { ticketsRequested: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(requestors);
    },
    async approve(req, res) {
        const user = await database_1.prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user || user.role !== client_1.UserRole.REQUESTER) {
            throw new errorHandler_1.AppError("Requester not found", 404);
        }
        const updated = await database_1.prisma.user.update({
            where: { id: req.params.id },
            data: { approvalStatus: "APPROVED", isActive: true },
        });
        res.json(updated);
    },
    async reject(req, res) {
        const user = await database_1.prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user || user.role !== client_1.UserRole.REQUESTER) {
            throw new errorHandler_1.AppError("Requester not found", 404);
        }
        const updated = await database_1.prisma.user.update({
            where: { id: req.params.id },
            data: { approvalStatus: "REJECTED" },
        });
        res.json(updated);
    },
    async block(req, res) {
        const user = await database_1.prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user || user.role !== client_1.UserRole.REQUESTER) {
            throw new errorHandler_1.AppError("Requester not found", 404);
        }
        const updated = await database_1.prisma.user.update({
            where: { id: req.params.id },
            data: { isActive: false },
        });
        res.json(updated);
    },
    async unblock(req, res) {
        const user = await database_1.prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user || user.role !== client_1.UserRole.REQUESTER) {
            throw new errorHandler_1.AppError("Requester not found", 404);
        }
        const updated = await database_1.prisma.user.update({
            where: { id: req.params.id },
            data: { isActive: true },
        });
        res.json(updated);
    },
    async remove(req, res) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.params.id },
            include: { _count: { select: { ticketsRequested: true } } },
        });
        if (!user || user.role !== client_1.UserRole.REQUESTER) {
            throw new errorHandler_1.AppError("Requester not found", 404);
        }
        if (user._count.ticketsRequested > 0) {
            throw new errorHandler_1.AppError("This requester has existing tickets and can't be deleted. Block them instead to prevent further access.", 400);
        }
        await database_1.prisma.user.delete({ where: { id: req.params.id } });
        res.status(200).json({ message: "Requester deleted" });
    },
    async sendMessage(req, res) {
        const user = await database_1.prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user || user.role !== client_1.UserRole.REQUESTER) {
            throw new errorHandler_1.AppError("Requester not found", 404);
        }
        if (!req.body.message || !req.body.message.trim()) {
            throw new errorHandler_1.AppError("Message text is required", 400);
        }
        const adminMessage = await database_1.prisma.adminMessage.create({
            data: {
                userId: req.params.id,
                fromAdminId: req.user.id,
                message: req.body.message.trim(),
            },
        });
        res.status(201).json(adminMessage);
    },
    async bulkInvite(req, res) {
        const rows = req.body.requestors;
        if (!Array.isArray(rows) || rows.length === 0) {
            throw new errorHandler_1.AppError("No requestor rows were provided", 400);
        }
        const created = [];
        const skipped = [];
        const seenInFile = new Set();
        for (const raw of rows) {
            const name = typeof raw?.name === "string" ? raw.name.trim() : "";
            const email = typeof raw?.email === "string" ? raw.email.trim().toLowerCase() : "";
            if (!name || !email) {
                skipped.push({ name, email, reason: "Missing name or email" });
                continue;
            }
            if (seenInFile.has(email)) {
                skipped.push({ name, email, reason: "Duplicate row in uploaded file" });
                continue;
            }
            seenInFile.add(email);
            try {
                await invitation_service_1.invitationService.createInvitation({
                    inviter: { id: req.user.id, role: req.user.role },
                    email,
                    role: client_1.UserRole.REQUESTER,
                    name,
                    zone: "",
                    windCategory: null,
                    departmentId: "",
                    departmentIds: [],
                    categoryIds: [],
                    supportLevel: client_1.SupportLevel.L2,
                });
                created.push(email);
            }
            catch (err) {
                const reason = err instanceof invitation_service_1.InvitationError ? err.message : "Requestor already exists or could not be invited";
                skipped.push({ name, email, reason });
            }
        }
        res.status(200).json({
            totalRows: rows.length,
            createdCount: created.length,
            skippedCount: skipped.length,
            created,
            skipped,
        });
    },
};
//# sourceMappingURL=requestor.controller.js.map