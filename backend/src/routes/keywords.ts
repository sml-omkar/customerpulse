import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { keywordController } from "../controllers/keyword.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const keywordRouter = Router();
const ADMIN_ROLES = [UserRole.GLOBAL_ADMIN];

keywordRouter.post("/", requireAuth, requireRole(...ADMIN_ROLES),asyncHandler(keywordController.create));
keywordRouter.get("/", requireAuth, keywordController.list);

keywordRouter.post("/agents/:userId/skills", requireAuth, requireRole(...ADMIN_ROLES), asyncHandler(keywordController.assignSkills));
keywordRouter.delete("/agents/:userId/skills/:keywordId", requireAuth, requireRole(...ADMIN_ROLES),asyncHandler(keywordController.removeSkill));

keywordRouter.get("/departments/:departmentId/suggestions", requireAuth, requireRole(...ADMIN_ROLES),asyncHandler(keywordController.listSuggestions));
keywordRouter.post("/suggestions/:id/promote", requireAuth, requireRole(...ADMIN_ROLES),asyncHandler(keywordController.promoteSuggestion));
keywordRouter.post("/suggestions/:id/reject", requireAuth, requireRole(...ADMIN_ROLES), asyncHandler(keywordController.rejectSuggestion));
keywordRouter.delete("/:id",requireAuth,requireRole(UserRole.GLOBAL_ADMIN),asyncHandler(keywordController.delete))
