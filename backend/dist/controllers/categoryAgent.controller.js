"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryAgentController = void 0;
const database_1 = require("../lib/database");
const client_1 = require("../generated/prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const categoryReassignment_service_1 = require("../services/categoryReassignment.service");
exports.categoryAgentController = {
    async list(req, res) {
        const links = await database_1.prisma.categoryAgent.findMany({
            where: { categoryId: req.params.categoryId },
            include: { agent: { select: { id: true, fullName: true, email: true, agentsdepartmentId: true } } },
        });
        res.json(links);
    },
    async assign(req, res) {
        const { userId, proficiency } = req.body;
        const category = await database_1.prisma.ticketCategory.findUnique({ where: { id: req.params.categoryId } });
        if (!category)
            throw new errorHandler_1.AppError("Category not found", 404);
        const agent = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!agent)
            throw new errorHandler_1.AppError("User not found", 404);
        if (agent.role !== client_1.UserRole.AGENT)
            throw new errorHandler_1.AppError("Only AGENT-role users can be linked to a category", 400);
        if (agent.agentsdepartmentId !== category.departmentId) {
            throw new errorHandler_1.AppError("This agent isn't in the same department as the category and can't be linked to it", 400);
        }
        const link = await database_1.prisma.categoryAgent.upsert({
            where: { categoryId_userId: { categoryId: category.id, userId } },
            update: { ...(proficiency !== undefined && { proficiency }) },
            create: { categoryId: category.id, userId, ...(proficiency !== undefined && { proficiency }) },
        });
        const pickedUp = await categoryReassignment_service_1.categoryReassignmentService.handleCategoryAssignmentBackfill({
            categoryId: category.id,
            performedById: req.user.id,
        });
        res.status(201).json({ ...link, backfilledTicketCount: pickedUp });
    },
    async unassign(req, res) {
        const { categoryId, userId } = req.params;
        const category = await database_1.prisma.ticketCategory.findUnique({ where: { id: categoryId } });
        if (!category)
            throw new errorHandler_1.AppError("Category not found", 404);
        const agent = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!agent)
            throw new errorHandler_1.AppError("User not found", 404);
        const existingLink = await database_1.prisma.categoryAgent.findUnique({
            where: { categoryId_userId: { categoryId, userId } },
        });
        if (!existingLink)
            throw new errorHandler_1.AppError("This agent isn't linked to this category", 404);
        await database_1.prisma.categoryAgent.delete({ where: { categoryId_userId: { categoryId, userId } } });
        const summary = await categoryReassignment_service_1.categoryReassignmentService.handleCategoryUnassignment({
            categoryId: category.id,
            categoryName: category.name,
            departmentId: category.departmentId,
            agentId: agent.id,
            agentFullName: agent.fullName,
            agentEmail: agent.email,
            performedById: req.user.id,
        });
        res.json({ message: "Agent unassigned from category", ticketReassignmentSummary: summary });
    },
};
//# sourceMappingURL=categoryAgent.controller.js.map