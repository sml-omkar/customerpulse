"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const client_1 = require("../generated/prisma/client");
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("../controllers/user.controller");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.get("/me", auth_1.requireAuth, user_controller_1.userController.me);
exports.userRouter.patch("/me/availability", auth_1.requireAuth, user_controller_1.userController.setMyAvailability);
exports.userRouter.get("/", auth_1.requireAuth, user_controller_1.userController.list);
exports.userRouter.get("/:id", auth_1.requireAuth, user_controller_1.userController.getById);
exports.userRouter.get("/:id/categories", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN, client_1.UserRole.HOD), user_controller_1.userController.categories);
exports.userRouter.get('/metric/:id', auth_1.requireAuth, user_controller_1.userController.metric);
exports.userRouter.patch("/:id", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN), user_controller_1.userController.update);
exports.userRouter.get("/manageddepartments/:id", auth_1.requireAuth, user_controller_1.userController.managedDepartments);
//# sourceMappingURL=users.js.map