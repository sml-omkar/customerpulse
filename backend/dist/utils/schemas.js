"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLogSchema = exports.categoryAgentSchema = exports.clientSchema = exports.createCommentSchema = exports.createTicketCategorySchema = exports.updateUserSchema = exports.promoteSuggestionSchema = exports.createKeywordSchema = exports.assignTicketSchema = exports.escalateTicketSchema = exports.updateTicketPrioritySchema = exports.updateTicketSchema = exports.createTicketSchema = exports.acceptInvitationSchema = exports.resetPasswordSchema = exports.verifyPasswordResetOtpSchema = exports.requestPasswordResetSchema = exports.loginSchema = exports.createInvitationSchema = exports.presignAttachmentSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("../generated/prisma/client");
exports.presignAttachmentSchema = zod_1.z.object({
    fileName: zod_1.z.string().min(1).max(300),
    fileType: zod_1.z.string().min(1).max(150),
    fileSize: zod_1.z.coerce
        .number()
        .int()
        .positive()
        .max(20 * 1024 * 1024, "File exceeds the 20MB limit"),
});
exports.createInvitationSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    role: zod_1.z.nativeEnum(client_1.UserRole),
    departmentId: zod_1.z.string().uuid().optional(),
    supportLevel: zod_1.z.nativeEnum(client_1.SupportLevel).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.requestPasswordResetSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.verifyPasswordResetOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    otp: zod_1.z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be 6 digits"),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    otp: zod_1.z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be 6 digits"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
});
exports.acceptInvitationSchema = zod_1.z.object({
    token: zod_1.z.string().min(32),
    fullName: zod_1.z.string().min(1).max(200),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
});
exports.createTicketSchema = zod_1.z.object({
    departmentId: zod_1.z.string().uuid(),
    categoryId: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().min(1).max(300),
    description: zod_1.z.string().max(10_000).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    representative: zod_1.z.string().max(200).optional(),
    employeeId: zod_1.z.string().max(50).optional(),
    clientName: zod_1.z.string().min(1).max(200),
    clientEmail: zod_1.z.string().email(),
    dateOfOccurance: zod_1.z.coerce.date(),
    site: zod_1.z.string().min(1).max(200),
    state: zod_1.z.string().min(1).max(100),
    designation: zod_1.z.nativeEnum(client_1.Designation).optional(),
    projectId: zod_1.z.string().uuid().optional(),
});
exports.updateTicketSchema = zod_1.z
    .object({
    title: zod_1.z.string().min(1).max(300).optional(),
    description: zod_1.z.string().max(10_000).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    status: zod_1.z.nativeEnum(client_1.TicketStatus).optional(),
    comment: zod_1.z.string().min(1).max(5000).optional(),
})
    .refine((data) => data.status !== client_1.TicketStatus.ON_HOLD || (data.comment && data.comment.trim().length > 0), { message: "A comment is required when placing a ticket on hold", path: ["comment"] });
exports.updateTicketPrioritySchema = zod_1.z.object({
    priority: zod_1.z.nativeEnum(client_1.TicketPriority),
});
exports.escalateTicketSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1).max(2000),
    toLevel: zod_1.z.nativeEnum(client_1.SupportLevel).optional(),
});
exports.assignTicketSchema = zod_1.z.object({
    agentId: zod_1.z.string().uuid(),
});
exports.createKeywordSchema = zod_1.z.object({
    departmentId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    synonyms: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.promoteSuggestionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    synonyms: zod_1.z.array(zod_1.z.string()).optional(),
    grantToUserIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
exports.updateUserSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1).max(200).optional(),
    role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
    departmentId: zod_1.z.string().uuid().nullable().optional(),
    managerId: zod_1.z.string().uuid().nullable().optional(),
    supportLevel: zod_1.z.nativeEnum(client_1.SupportLevel).nullable().optional(),
    isActive: zod_1.z.boolean().optional(),
    isAvailableForAssignment: zod_1.z.boolean().optional(),
    maxActiveTickets: zod_1.z.number().int().min(1).max(200).optional(),
});
exports.createTicketCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(150),
    defaultSlaMinutes: zod_1.z.number().int().positive().optional(),
    defaultPriority: zod_1.z.nativeEnum(client_1.TicketPriority).optional(),
    minSupportLevel: zod_1.z.nativeEnum(client_1.SupportLevel).optional(),
});
exports.createCommentSchema = zod_1.z.object({
    commentText: zod_1.z.string().min(1).max(5000),
    isInternal: zod_1.z.boolean().optional(),
});
exports.clientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
});
exports.categoryAgentSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    proficiency: zod_1.z.number().int().min(1).max(10).optional(),
});
exports.createAuditLogSchema = zod_1.z.object({
    action: zod_1.z.string().min(1).max(100),
    entityType: zod_1.z.string().min(1).max(50),
    entityId: zod_1.z.string().optional(),
});
//# sourceMappingURL=schemas.js.map