"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRouter = void 0;
const express_1 = require("express");
const client_1 = require("../generated/prisma/client");
const auth_1 = require("../middleware/auth");
const project_controller_1 = require("../controllers/project.controller");
const asyncHandler_1 = require("../middleware/asyncHandler");
exports.projectRouter = (0, express_1.Router)();
exports.projectRouter.put("/:id", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), (0, asyncHandler_1.asyncHandler)(project_controller_1.projectController.updateProject));
exports.projectRouter.delete("/:id", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), (0, asyncHandler_1.asyncHandler)(project_controller_1.projectController.deleteProject));
//# sourceMappingURL=project.js.map