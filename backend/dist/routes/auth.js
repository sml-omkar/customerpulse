"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../middleware/asyncHandler");
const validate_1 = require("../middleware/validate");
const rateLimiter_1 = require("../middleware/rateLimiter");
const schemas_1 = require("../utils/schemas");
const auth_controller_1 = require("../controllers/auth.controller");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/login", rateLimiter_1.publicTokenLimiter, (0, validate_1.validateBody)(schemas_1.loginSchema), (0, asyncHandler_1.asyncHandler)(auth_controller_1.authController.login));
exports.authRouter.post("/signup", rateLimiter_1.publicTokenLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.authController.signup));
exports.authRouter.post("/forgot-password", rateLimiter_1.publicTokenLimiter, (0, validate_1.validateBody)(schemas_1.requestPasswordResetSchema), (0, asyncHandler_1.asyncHandler)(auth_controller_1.authController.requestPasswordReset));
exports.authRouter.post("/verify-reset-otp", rateLimiter_1.publicTokenLimiter, (0, validate_1.validateBody)(schemas_1.verifyPasswordResetOtpSchema), (0, asyncHandler_1.asyncHandler)(auth_controller_1.authController.verifyPasswordResetOtp));
exports.authRouter.post("/reset-password", rateLimiter_1.publicTokenLimiter, (0, validate_1.validateBody)(schemas_1.resetPasswordSchema), (0, asyncHandler_1.asyncHandler)(auth_controller_1.authController.resetPassword));
//# sourceMappingURL=auth.js.map