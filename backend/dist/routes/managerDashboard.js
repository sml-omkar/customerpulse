"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.managerDashboardRouter = void 0;
const express_1 = require("express");
const client_1 = require("../generated/prisma/client");
const auth_1 = require("../middleware/auth");
const managerDashboard_controller_1 = require("../controllers/managerDashboard.controller");
exports.managerDashboardRouter = (0, express_1.Router)();
exports.managerDashboardRouter.get("/team", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.HOD), managerDashboard_controller_1.managerDashboardController.getTeam);
exports.managerDashboardRouter.get("/tickets", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.HOD), managerDashboard_controller_1.managerDashboardController.getDepartmentTickets);
exports.managerDashboardRouter.get("/user/:userId/tickets", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.HOD), managerDashboard_controller_1.managerDashboardController.getUserTickets);
exports.managerDashboardRouter.post("/reassign", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.HOD), managerDashboard_controller_1.managerDashboardController.reassignTicket);
exports.managerDashboardRouter.post("/set-manager", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), managerDashboard_controller_1.managerDashboardController.setDepartmentManager);
//# sourceMappingURL=managerDashboard.js.map