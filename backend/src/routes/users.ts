import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { userController } from "../controllers/user.controller";

export const userRouter = Router();

userRouter.get("/me", requireAuth, userController.me);
userRouter.patch("/me/availability", requireAuth, userController.setMyAvailability);

userRouter.get("/", requireAuth, userController.list);
  
userRouter.get("/:id", requireAuth, userController.getById);

// Categories this AGENT is currently routed for - backs the Staff
// Directory "edit" modal's category checklist (see categoryAgentController
// for the assign/unassign endpoints these get diffed against).
userRouter.get("/:id/categories", requireAuth, requireRole(UserRole.GLOBAL_ADMIN, UserRole.HOD), userController.categories);

userRouter.get('/metric/:id',requireAuth,userController.metric)

userRouter.patch("/:id", requireAuth, requireRole(UserRole.GLOBAL_ADMIN), userController.update);

userRouter.get("/manageddepartments/:id",requireAuth,userController.managedDepartments)
