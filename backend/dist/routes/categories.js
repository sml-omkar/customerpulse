"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRouter = void 0;
const express_1 = require("express");
const client_1 = require("../generated/prisma/client");
const auth_1 = require("../middleware/auth");
const ticketCategory_controller_1 = require("../controllers/ticketCategory.controller");
const categoryAgent_controller_1 = require("../controllers/categoryAgent.controller");
const asyncHandler_1 = require("../middleware/asyncHandler");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../utils/schemas");
exports.categoryRouter = (0, express_1.Router)();
exports.categoryRouter.patch("/:id", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN, client_1.UserRole.HOD), (0, asyncHandler_1.asyncHandler)(ticketCategory_controller_1.ticketCategoryController.update));
exports.categoryRouter.delete("/:id", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), (0, asyncHandler_1.asyncHandler)(ticketCategory_controller_1.ticketCategoryController.delete));
exports.categoryRouter.get("/:categoryId/agents", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN, client_1.UserRole.HOD), (0, asyncHandler_1.asyncHandler)(categoryAgent_controller_1.categoryAgentController.list));
exports.categoryRouter.post("/:categoryId/agents", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN, client_1.UserRole.HOD), (0, validate_1.validateBody)(schemas_1.categoryAgentSchema), (0, asyncHandler_1.asyncHandler)(categoryAgent_controller_1.categoryAgentController.assign));
exports.categoryRouter.delete("/:categoryId/agents/:userId", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN, client_1.UserRole.HOD), (0, asyncHandler_1.asyncHandler)(categoryAgent_controller_1.categoryAgentController.unassign));
//# sourceMappingURL=categories.js.map