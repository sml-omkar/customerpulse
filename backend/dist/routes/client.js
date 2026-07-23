"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientRouter = void 0;
const express_1 = require("express");
const client_1 = require("../generated/prisma/client");
const auth_1 = require("../middleware/auth");
const client_controller_1 = require("../controllers/client.controller");
const project_controller_1 = require("../controllers/project.controller");
const asyncHandler_1 = require("../middleware/asyncHandler");
exports.clientRouter = (0, express_1.Router)();
exports.clientRouter.get("/", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(client_controller_1.clientController.getClients));
exports.clientRouter.post("/", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), (0, asyncHandler_1.asyncHandler)(client_controller_1.clientController.createClient));
exports.clientRouter.post("/import", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), (0, asyncHandler_1.asyncHandler)(client_controller_1.clientController.importClients));
exports.clientRouter.delete("/:id", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), (0, asyncHandler_1.asyncHandler)(client_controller_1.clientController.deleteClient));
exports.clientRouter.put("/:id", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), (0, asyncHandler_1.asyncHandler)(client_controller_1.clientController.updateClient));
exports.clientRouter.get("/:clientId/projects", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(project_controller_1.projectController.getProjectsForClient));
exports.clientRouter.post("/:clientId/projects", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), (0, asyncHandler_1.asyncHandler)(project_controller_1.projectController.createProject));
//# sourceMappingURL=client.js.map