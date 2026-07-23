"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachmentController = void 0;
const fs_1 = __importDefault(require("fs"));
const database_1 = require("../lib/database");
const errorHandler_1 = require("../middleware/errorHandler");
const schemas_1 = require("../utils/schemas");
const rbac_1 = require("../utils/rbac");
const s3_1 = require("../lib/s3");
const DEFAULT_ATTACHMENT_COMMENT_PREFIX = "Attached: ";
function markCommentAttachmentDeleted(commentText, fileName) {
    if (commentText === `${DEFAULT_ATTACHMENT_COMMENT_PREFIX}${fileName}`) {
        return `[Attachment deleted] ${fileName}`;
    }
    return `${commentText}\n\n[Attachment deleted: ${fileName}]`;
}
exports.attachmentController = {
    async presign(req, res) {
        const { fileName, fileType, fileSize } = schemas_1.presignAttachmentSchema.parse(req.body);
        await database_1.prisma.ticket.findUniqueOrThrow({ where: { id: req.params.ticketId } });
        if (!(0, s3_1.isAllowedAttachment)(fileName, fileType)) {
            throw new errorHandler_1.AppError("Unsupported file type. Allowed: PDF, XLSX, XLS, PNG, JPG, WEBP, GIF", 400);
        }
        if (fileSize > s3_1.MAX_ATTACHMENT_SIZE_BYTES) {
            throw new errorHandler_1.AppError("File exceeds the 20MB limit", 400);
        }
        const key = (0, s3_1.buildAttachmentKey)(req.params.ticketId, fileName);
        const { uploadUrl, fileUrl } = await (0, s3_1.createPresignedUploadUrl)(key, fileType, fileSize);
        res.json({ uploadUrl, fileUrl, key, fileName });
    },
    async create(req, res) {
        const { fileName, fileUrl, commentText } = req.body;
        if (!fileName || !fileUrl) {
            throw new errorHandler_1.AppError("fileName and fileUrl are required", 400);
        }
        if (!(0, s3_1.isOwnedByOurBucket)(fileUrl)) {
            throw new errorHandler_1.AppError("fileUrl must point at an uploaded document in the configured S3 bucket", 400);
        }
        if (!(0, s3_1.isAllowedAttachment)(fileName, "")) {
            throw new errorHandler_1.AppError("Unsupported file type. Allowed: PDF, XLSX, XLS, PNG, JPG, WEBP, GIF", 400);
        }
        const attachment = await database_1.prisma.ticketAttachment.create({
            data: {
                ticketId: req.params.ticketId,
                fileName,
                fileUrl,
                uploadedBy: req.user.id,
            },
        });
        const trimmedComment = typeof commentText === "string" ? commentText.trim() : "";
        const comment = await database_1.prisma.ticketComment.create({
            data: {
                ticketId: req.params.ticketId,
                userId: req.user.id,
                commentText: trimmedComment || `${DEFAULT_ATTACHMENT_COMMENT_PREFIX}${fileName}`,
                attachmentId: attachment.id,
            },
            include: { user: true, attachment: true },
        });
        res.status(201).json({ ...attachment, comment });
    },
    async remove(req, res) {
        const attachment = await database_1.prisma.ticketAttachment.findUniqueOrThrow({
            where: { id: req.params.attachmentId },
        });
        if (attachment.ticketId !== req.params.ticketId) {
            throw new errorHandler_1.AppError("Attachment does not belong to this ticket", 400);
        }
        if (attachment.uploadedBy !== req.user.id && !(0, rbac_1.isStaff)(req.user.role)) {
            throw new errorHandler_1.AppError("You do not have permission to remove this attachment", 403);
        }
        const linkedComments = await database_1.prisma.ticketComment.findMany({
            where: { attachmentId: attachment.id },
        });
        await Promise.all(linkedComments.map((c) => database_1.prisma.ticketComment.update({
            where: { id: c.id },
            data: { commentText: markCommentAttachmentDeleted(c.commentText, attachment.fileName) },
        })));
        await database_1.prisma.ticketAttachment.delete({ where: { id: attachment.id } });
        const key = (0, s3_1.keyFromLocalFileUrl)(attachment.fileUrl);
        if (key) {
            fs_1.default.unlink((0, s3_1.resolveLocalAttachmentPath)(key), () => { });
        }
        res.status(204).send();
    },
    async list(req, res) {
        const attachments = await database_1.prisma.ticketAttachment.findMany({
            where: { ticketId: req.params.ticketId },
            include: { uploader: true },
            orderBy: { createdAt: "asc" },
        });
        res.json(attachments);
    },
};
//# sourceMappingURL=attachment.controller.js.map