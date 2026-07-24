import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { requestorController } from "../controllers/requestor.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const requestorRouter = Router();

requestorRouter.use(requireAuth, requireRole(UserRole.GLOBAL_ADMIN));

requestorRouter.get("/", asyncHandler(requestorController.list));
requestorRouter.post("/bulk-invite", asyncHandler(requestorController.bulkInvite));
requestorRouter.post("/:id/approve", asyncHandler(requestorController.approve));
requestorRouter.post("/:id/reject", asyncHandler(requestorController.reject));
requestorRouter.post("/:id/block", asyncHandler(requestorController.block));
requestorRouter.post("/:id/unblock", asyncHandler(requestorController.unblock));
requestorRouter.delete("/:id", asyncHandler(requestorController.remove));
requestorRouter.post("/:id/message", asyncHandler(requestorController.sendMessage));
