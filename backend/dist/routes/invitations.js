"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationRouter = void 0;
const express_1 = require("express");
const client_1 = require("../generated/prisma/client");
const auth_1 = require("../middleware/auth");
const invitation_controller_1 = require("../controllers/invitation.controller");
const asyncHandler_1 = require("../middleware/asyncHandler");
exports.invitationRouter = (0, express_1.Router)();
exports.invitationRouter.post("/", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), (0, asyncHandler_1.asyncHandler)(invitation_controller_1.invitationController.create));
exports.invitationRouter.post("/bulk", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), invitation_controller_1.invitationController.bulkCreate);
exports.invitationRouter.post("/accept", (0, asyncHandler_1.asyncHandler)(invitation_controller_1.invitationController.accept));
exports.invitationRouter.get("/", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN, client_1.UserRole.HOD), invitation_controller_1.invitationController.list);
exports.invitationRouter.post("/:id/resend", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN, client_1.UserRole.HOD), invitation_controller_1.invitationController.resend);
exports.invitationRouter.post("/:id/cancel", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN, client_1.UserRole.HOD), invitation_controller_1.invitationController.cancel);
//# sourceMappingURL=invitations.js.map