"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
const database_1 = require("../lib/database");
const errorHandler_1 = require("../middleware/errorHandler");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const enums_1 = require("../generated/prisma/enums");
exports.authController = {
    async login(req, res) {
        const result = await auth_service_1.authService.login(req.body.email, req.body.password);
        res.json(result);
    },
    async signup(req, res) {
        const checkuser = await database_1.prisma.user.findUnique({ where: { email: req.body.email } });
        if (checkuser) {
            throw new errorHandler_1.AppError("User exists already", 401);
        }
        const passwordHash = await bcryptjs_1.default.hash(req.body.password, 10);
        const user = await database_1.prisma.user.create({
            data: {
                fullName: req.body.fullName,
                email: req.body.email,
                employeeId: req.body.employeeId || undefined,
                passwordHash: passwordHash,
                role: enums_1.UserRole.REQUESTER,
                approvalStatus: "PENDING",
            },
        });
        res.status(201).json({
            message: "Registration submitted. An admin will review your account before you can sign in.",
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, approvalStatus: user.approvalStatus },
        });
    },
    async requestPasswordReset(req, res) {
        const result = await auth_service_1.authService.requestPasswordReset(req.body.email);
        res.json(result);
    },
    async verifyPasswordResetOtp(req, res) {
        const result = await auth_service_1.authService.verifyPasswordResetOtp(req.body.email, req.body.otp);
        res.json(result);
    },
    async resetPassword(req, res) {
        const result = await auth_service_1.authService.resetPassword(req.body.email, req.body.otp, req.body.password);
        res.json(result);
    },
};
//# sourceMappingURL=auth.controller.js.map