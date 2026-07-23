"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../lib/database");
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("../middleware/errorHandler");
const token_1 = require("../utils/token");
const time_1 = require("../utils/time");
const notification_service_1 = require("./notification.service");
const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
exports.authService = {
    async login(email, password) {
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            include: {
                assignedDepartment: true,
                managedDepartments: true,
                coxDepartements: true,
            },
        });
        if (!user || !user.passwordHash) {
            throw new errorHandler_1.AppError("Invalid email or password", 401);
        }
        if (!user.isActive) {
            throw new errorHandler_1.AppError("This account has been deactivated", 403);
        }
        if (user.approvalStatus === "PENDING") {
            throw new errorHandler_1.AppError("Your registration is still pending admin approval", 403);
        }
        if (user.approvalStatus === "REJECTED") {
            throw new errorHandler_1.AppError("Your registration request was not approved", 403);
        }
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid) {
            throw new errorHandler_1.AppError("Invalid email or password", 401);
        }
        const token = (0, jwt_1.signAuthToken)({
            id: user.id,
            role: user.role,
        });
        return {
            token,
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, departments: [...user.managedDepartments.map(dept => dept.id), ...user.coxDepartements.map(dept => dept.id), user.assignedDepartment?.id] },
        };
    },
    async requestPasswordReset(email) {
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        if (user && user.passwordHash && user.isActive && user.approvalStatus === "APPROVED") {
            const otp = (0, token_1.generateOtp)();
            const otpHash = await bcryptjs_1.default.hash(otp, 10);
            await database_1.prisma.passwordResetOtp.create({
                data: {
                    email,
                    otpHash,
                    expiresAt: (0, time_1.minutesFromNow)(OTP_TTL_MINUTES),
                },
            });
            await notification_service_1.notificationService.sendPasswordResetOtp(email, otp);
        }
        return { message: "If an account exists for this email, a verification code has been sent." };
    },
    async verifyPasswordResetOtp(email, otp) {
        const record = await database_1.prisma.passwordResetOtp.findFirst({
            where: { email, consumedAt: null },
            orderBy: { createdAt: "desc" },
        });
        if (!record || record.expiresAt < new Date()) {
            throw new errorHandler_1.AppError("Invalid or expired code. Please request a new one.", 400);
        }
        if (record.attempts >= MAX_OTP_ATTEMPTS) {
            throw new errorHandler_1.AppError("Too many incorrect attempts. Please request a new code.", 429);
        }
        const valid = await bcryptjs_1.default.compare(otp, record.otpHash);
        if (!valid) {
            await database_1.prisma.passwordResetOtp.update({
                where: { id: record.id },
                data: { attempts: { increment: 1 } },
            });
            throw new errorHandler_1.AppError("Invalid or expired code. Please request a new one.", 400);
        }
        await database_1.prisma.passwordResetOtp.update({
            where: { id: record.id },
            data: { verified: true },
        });
        return { verified: true };
    },
    async resetPassword(email, otp, password) {
        const record = await database_1.prisma.passwordResetOtp.findFirst({
            where: { email, consumedAt: null, verified: true },
            orderBy: { createdAt: "desc" },
        });
        if (!record || record.expiresAt < new Date()) {
            throw new errorHandler_1.AppError("Invalid or expired code. Please request a new one.", 400);
        }
        const valid = await bcryptjs_1.default.compare(otp, record.otpHash);
        if (!valid) {
            throw new errorHandler_1.AppError("Invalid or expired code. Please request a new one.", 400);
        }
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new errorHandler_1.AppError("Invalid or expired code. Please request a new one.", 400);
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        await database_1.prisma.$transaction([
            database_1.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
            database_1.prisma.passwordResetOtp.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
        ]);
        return { message: "Password reset successfully. You can now log in with your new password." };
    },
};
//# sourceMappingURL=auth.service.js.map