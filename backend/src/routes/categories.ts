import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { ticketCategoryController } from "../controllers/ticketCategory.controller";
import { categoryAgentController } from "../controllers/categoryAgent.controller";
import { ticketController } from "../controllers/ticket.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateBody } from "../middleware/validate";
import { categoryAgentSchema } from "../utils/schemas";

export const categoryRouter = Router();

categoryRouter.patch(
  "/:id",
  requireAuth,
  requireRole(UserRole.GLOBAL_ADMIN, UserRole.HOD),
  asyncHandler(ticketCategoryController.update)
);

categoryRouter.delete(
  "/:id",
  requireAuth,
  requireRole(UserRole.GLOBAL_ADMIN),
  asyncHandler(ticketCategoryController.delete)
)

// Agent <-> category routing links. Assigning/unassigning here is what
// category-first auto-assignment (assignment.service.ts findBestAgent
// stage 1) reads from - see categoryReassignment.service.ts for what
// happens to open tickets when a link changes.
categoryRouter.get(
  "/:categoryId/agents",
  requireAuth,
  requireRole(UserRole.GLOBAL_ADMIN, UserRole.HOD),
  asyncHandler(categoryAgentController.list)
);

categoryRouter.post(
  "/:categoryId/agents",
  requireAuth,
  requireRole(UserRole.GLOBAL_ADMIN, UserRole.HOD),
  validateBody(categoryAgentSchema),
  asyncHandler(categoryAgentController.assign)
);

categoryRouter.delete(
  "/:categoryId/agents/:userId",
  requireAuth,
  requireRole(UserRole.GLOBAL_ADMIN, UserRole.HOD),
  asyncHandler(categoryAgentController.unassign)
);
