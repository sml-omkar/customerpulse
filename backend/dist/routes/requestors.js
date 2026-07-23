"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestorRouter = void 0;
const express_1 = require("express");
const client_1 = require("../generated/prisma/client");
const auth_1 = require("../middleware/auth");
const requestor_controller_1 = require("../controllers/requestor.controller");
exports.requestorRouter = (0, express_1.Router)();
exports.requestorRouter.use(auth_1.requireAuth, (0, auth_1.requireRole)(client_1.UserRole.GLOBAL_ADMIN));
exports.requestorRouter.get("/", requestor_controller_1.requestorController.list);
exports.requestorRouter.post("/bulk-invite", requestor_controller_1.requestorController.bulkInvite);
exports.requestorRouter.post("/:id/approve", requestor_controller_1.requestorController.approve);
exports.requestorRouter.post("/:id/reject", requestor_controller_1.requestorController.reject);
exports.requestorRouter.post("/:id/block", requestor_controller_1.requestorController.block);
exports.requestorRouter.post("/:id/unblock", requestor_controller_1.requestorController.unblock);
exports.requestorRouter.delete("/:id", requestor_controller_1.requestorController.remove);
exports.requestorRouter.post("/:id/message", requestor_controller_1.requestorController.sendMessage);
//# sourceMappingURL=requestors.js.map