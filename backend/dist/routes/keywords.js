"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keywordRouter = void 0;
const express_1 = require("express");
const client_1 = require("../generated/prisma/client");
const auth_1 = require("../middleware/auth");
const keyword_controller_1 = require("../controllers/keyword.controller");
exports.keywordRouter = (0, express_1.Router)();
const ADMIN_ROLES = [client_1.UserRole.GLOBAL_ADMIN];
exports.keywordRouter.post("/", auth_1.requireAuth, (0, auth_1.requireRole)(...ADMIN_ROLES), keyword_controller_1.keywordController.create);
exports.keywordRouter.get("/", auth_1.requireAuth, keyword_controller_1.keywordController.list);
exports.keywordRouter.post("/agents/:userId/skills", auth_1.requireAuth, (0, auth_1.requireRole)(...ADMIN_ROLES), keyword_controller_1.keywordController.assignSkills);
exports.keywordRouter.delete("/agents/:userId/skills/:keywordId", auth_1.requireAuth, (0, auth_1.requireRole)(...ADMIN_ROLES), keyword_controller_1.keywordController.removeSkill);
exports.keywordRouter.get("/departments/:departmentId/suggestions", auth_1.requireAuth, (0, auth_1.requireRole)(...ADMIN_ROLES), keyword_controller_1.keywordController.listSuggestions);
exports.keywordRouter.post("/suggestions/:id/promote", auth_1.requireAuth, (0, auth_1.requireRole)(...ADMIN_ROLES), keyword_controller_1.keywordController.promoteSuggestion);
exports.keywordRouter.post("/suggestions/:id/reject", auth_1.requireAuth, (0, auth_1.requireRole)(...ADMIN_ROLES), keyword_controller_1.keywordController.rejectSuggestion);
exports.keywordRouter.delete("/:id", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), keyword_controller_1.keywordController.delete);
//# sourceMappingURL=keywords.js.map