import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { invitationController } from "../controllers/invitation.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const invitationRouter = Router();

invitationRouter.post("/", requireAuth, requireRole(UserRole.GLOBAL_ADMIN), asyncHandler(invitationController.create));
invitationRouter.post("/bulk", requireAuth, requireRole(UserRole.GLOBAL_ADMIN), asyncHandler(invitationController.bulkCreate));
invitationRouter.post("/accept",asyncHandler(invitationController.accept)); // public - invitee has no account yet
invitationRouter.get("/", requireAuth, requireRole(UserRole.GLOBAL_ADMIN, UserRole.HOD), asyncHandler(invitationController.list));
invitationRouter.post("/:id/resend", requireAuth, requireRole(UserRole.GLOBAL_ADMIN, UserRole.HOD), asyncHandler(invitationController.resend));
invitationRouter.post("/:id/cancel", requireAuth, requireRole(UserRole.GLOBAL_ADMIN, UserRole.HOD), asyncHandler(invitationController.cancel));
