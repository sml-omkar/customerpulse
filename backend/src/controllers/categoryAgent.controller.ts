import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { prisma } from "../lib/database";
import { UserRole } from "../generated/prisma/client";
import { AppError } from "../middleware/errorHandler";
import { categoryReassignmentService } from "../services/categoryReassignment.service";

export const categoryAgentController = {
  // GET /categories/:categoryId/agents
  // Everyone who can see the category configuration screen can see who's
  // currently routed for it.
  async list(req: AuthedRequest, res: Response) {
    const links = await prisma.categoryAgent.findMany({
      where: { categoryId: req.params.categoryId },
      include: { agent: { select: { id: true, fullName: true, email: true, agentsdepartmentId: true } } },
    });
    res.json(links);
  },

  // POST /categories/:categoryId/agents  { userId, proficiency? }  (GLOBAL_ADMIN, HOD)
  // Body already validated against categoryAgentSchema by the
  // validateBody middleware in the route. Links an agent to this category
  // so category-first auto-assignment can route tickets to them. The
  // agent must actually work in the category's department - linking
  // someone from a different department would let findBestAgent's
  // category-match stage pick them up regardless of the department
  // scoping it otherwise enforces.
  //
  // After the link is created, any ticket in this category that's
  // currently sitting unassigned gets a fresh shot at auto-assignment,
  // since a newly-eligible agent might now be the best (or only) match for
  // it - see categoryReassignment.service.ts's handleCategoryAssignmentBackfill.
  async assign(req: AuthedRequest, res: Response) {
    const { userId, proficiency } = req.body;

    const category = await prisma.ticketCategory.findUnique({ where: { id: req.params.categoryId } });
    if (!category) throw new AppError("Category not found", 404);

    const agent = await prisma.user.findUnique({ where: { id: userId } });
    if (!agent) throw new AppError("User not found", 404);
    if (agent.role !== UserRole.AGENT) throw new AppError("Only AGENT-role users can be linked to a category", 400);
    if (agent.agentsdepartmentId !== category.departmentId) {
      throw new AppError("This agent isn't in the same department as the category and can't be linked to it", 400);
    }

    const link = await prisma.categoryAgent.upsert({
      where: { categoryId_userId: { categoryId: category.id, userId } },
      update: { ...(proficiency !== undefined && { proficiency }) },
      create: { categoryId: category.id, userId, ...(proficiency !== undefined && { proficiency }) },
    });

    const pickedUp = await categoryReassignmentService.handleCategoryAssignmentBackfill({
      categoryId: category.id,
      performedById: req.user!.id,
    });

    res.status(201).json({ ...link, backfilledTicketCount: pickedUp });
  },

  // DELETE /categories/:categoryId/agents/:userId  (GLOBAL_ADMIN, HOD)
  // Un-links an agent from this category. Any open ticket in this category
  // still assigned to them is redistributed to another eligible agent (or
  // left unassigned if none exist) - see
  // categoryReassignment.service.ts's handleCategoryUnassignment. Both the
  // agent and the department's HOD are notified with the breakdown.
  async unassign(req: AuthedRequest, res: Response) {
    const { categoryId, userId } = req.params;

    const category = await prisma.ticketCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new AppError("Category not found", 404);

    const agent = await prisma.user.findUnique({ where: { id: userId } });
    if (!agent) throw new AppError("User not found", 404);

    const existingLink = await prisma.categoryAgent.findUnique({
      where: { categoryId_userId: { categoryId, userId } },
    });
    if (!existingLink) throw new AppError("This agent isn't linked to this category", 404);

    await prisma.categoryAgent.delete({ where: { categoryId_userId: { categoryId, userId } } });

    const summary = await categoryReassignmentService.handleCategoryUnassignment({
      categoryId: category.id,
      categoryName: category.name,
      departmentId: category.departmentId,
      agentId: agent.id,
      agentFullName: agent.fullName,
      agentEmail: agent.email,
      performedById: req.user!.id,
    });

    res.json({ message: "Agent unassigned from category", ticketReassignmentSummary: summary });
  },
};
