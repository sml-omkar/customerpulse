import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { managerDashboardController } from "../controllers/managerDashboard.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const managerDashboardRouter = Router();


managerDashboardRouter.get(
  "/team",
  requireAuth,
  requireRole(UserRole.HOD),
  asyncHandler(managerDashboardController.getTeam)
);

managerDashboardRouter.get(
  "/tickets",
  requireAuth,
  requireRole(UserRole.HOD),
  asyncHandler(managerDashboardController.getDepartmentTickets)
);

managerDashboardRouter.get(
  "/user/:userId/tickets",
  requireAuth,
  requireRole(UserRole.HOD),
  asyncHandler(managerDashboardController.getUserTickets)
);

managerDashboardRouter.post(
  "/reassign",
  requireAuth,
  requireRole(UserRole.HOD),
  asyncHandler(managerDashboardController.reassignTicket)
);

managerDashboardRouter.post(
  "/set-manager",
  requireAuth,
  requireRole(UserRole.GLOBAL_ADMIN),
  asyncHandler(managerDashboardController.setDepartmentManager)
);

