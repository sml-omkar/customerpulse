"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentDashboardRouter = void 0;
const express_1 = require("express");
const client_1 = require("../generated/prisma/client");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../middleware/asyncHandler");
const agentDashboard_controller_1 = require("../controllers/agentDashboard.controller");
exports.agentDashboardRouter = (0, express_1.Router)();
exports.agentDashboardRouter.get("/analytics", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.AGENT), (0, asyncHandler_1.asyncHandler)(agentDashboard_controller_1.agentDashboardController.getAnalytics));
//# sourceMappingURL=agentDashboard.js.map