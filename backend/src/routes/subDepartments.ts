import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { subDepartmentController } from "../controllers/subDepartment.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const subDepartmentRouter = Router();

subDepartmentRouter.patch(
  "/:id",
  requireAuth,
  requireRole(UserRole.GLOBAL_ADMIN, UserRole.HOD),
  asyncHandler(subDepartmentController.update)
);

subDepartmentRouter.delete(
  "/:id",
  requireAuth,
  requireRole(UserRole.GLOBAL_ADMIN),
  asyncHandler(subDepartmentController.delete)
);
