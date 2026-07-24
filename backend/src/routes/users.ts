import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { userController } from "../controllers/user.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const userRouter = Router();

userRouter.get("/me", requireAuth, asyncHandler(userController.me));
userRouter.patch("/me/availability", requireAuth, asyncHandler(userController.setMyAvailability));

userRouter.get("/", requireAuth, asyncHandler(userController.list));
  
userRouter.get("/:id", requireAuth, asyncHandler(userController.getById));

// Categories this AGENT is currently routed for - backs the Staff
// Directory "edit" modal's category checklist (see categoryAgentController
// for the assign/unassign endpoints these get diffed against).
userRouter.get("/:id/categories", requireAuth, requireRole(UserRole.GLOBAL_ADMIN, UserRole.HOD), asyncHandler(userController.categories));

userRouter.get('/metric/:id',requireAuth,userController.metric)

userRouter.patch("/:id", requireAuth, requireRole(UserRole.GLOBAL_ADMIN), asyncHandler(userController.update));

// Soft-deletes a staff account (redistributes their open tickets if
// they're an AGENT - see user.controller.ts's remove() for details).
userRouter.delete("/:id", requireAuth, requireRole(UserRole.GLOBAL_ADMIN), asyncHandler(userController.remove));

userRouter.get("/manageddepartments/:id",requireAuth,asyncHandler(userController.managedDepartments))
