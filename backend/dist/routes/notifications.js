"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notification_controller_1 = require("../controllers/notification.controller");
exports.notificationRouter = (0, express_1.Router)();
exports.notificationRouter.use(auth_1.requireAuth);
exports.notificationRouter.get("/me", notification_controller_1.notificationController.myMessages);
exports.notificationRouter.patch("/:id/read", notification_controller_1.notificationController.markRead);
//# sourceMappingURL=notifications.js.map