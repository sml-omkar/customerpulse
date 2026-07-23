"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subDepartmentRouter = void 0;
const express_1 = require("express");
const client_1 = require("../generated/prisma/client");
const auth_1 = require("../middleware/auth");
const subDepartment_controller_1 = require("../controllers/subDepartment.controller");
exports.subDepartmentRouter = (0, express_1.Router)();
exports.subDepartmentRouter.patch("/:id", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN, client_1.UserRole.HOD), subDepartment_controller_1.subDepartmentController.update);
exports.subDepartmentRouter.delete("/:id", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), subDepartment_controller_1.subDepartmentController.delete);
//# sourceMappingURL=subDepartments.js.map