"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogRouter = void 0;
const express_1 = require("express");
const client_1 = require("../generated/prisma/client");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../middleware/asyncHandler");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../utils/schemas");
const auditlogs_controller_1 = require("../controllers/auditlogs.controller");
exports.auditLogRouter = (0, express_1.Router)();
exports.auditLogRouter.get("/", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN, client_1.UserRole.HOD), (0, asyncHandler_1.asyncHandler)(auditlogs_controller_1.auditLogController.list));
exports.auditLogRouter.post("/", auth_1.requireAuth, (0, validate_1.validateBody)(schemas_1.createAuditLogSchema), (0, asyncHandler_1.asyncHandler)(auditlogs_controller_1.auditLogController.create));
//# sourceMappingURL=auditLogs.js.map