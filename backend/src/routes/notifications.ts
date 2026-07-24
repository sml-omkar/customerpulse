import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { notificationController } from "../controllers/notification.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/me", asyncHandler(notificationController.myMessages));
notificationRouter.patch("/:id/read", asyncHandler(notificationController.markRead));