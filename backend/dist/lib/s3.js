"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_ATTACHMENT_MIME_TYPES = exports.MAX_ATTACHMENT_SIZE_BYTES = void 0;
exports.isAllowedAttachment = isAllowedAttachment;
exports.buildAttachmentKey = buildAttachmentKey;
exports.getPublicFileUrl = getPublicFileUrl;
exports.isOwnedByOurBucket = isOwnedByOurBucket;
exports.createPresignedUploadUrl = createPresignedUploadUrl;
exports.resolveLocalAttachmentPath = resolveLocalAttachmentPath;
exports.keyFromLocalFileUrl = keyFromLocalFileUrl;
const crypto_1 = require("crypto");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const LOCAL_ATTACHMENTS_DIR = path_1.default.join(__dirname, "..", "..", "attachment");
const LOCAL_BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT ?? 3000}`;
exports.MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024;
exports.ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".xlsx", ".xls", ".png", ".jpg", ".jpeg", ".webp", ".gif"]);
function isAllowedAttachment(fileName, mimeType) {
    const ext = "." + (fileName.split(".").pop() || "").toLowerCase();
    return exports.ALLOWED_ATTACHMENT_MIME_TYPES.has(mimeType) || ALLOWED_EXTENSIONS.has(ext);
}
function sanitizeFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-150);
}
function buildAttachmentKey(ticketId, fileName) {
    return `attachments/${ticketId}/${(0, crypto_1.randomUUID)()}-${sanitizeFileName(fileName)}`;
}
function getPublicFileUrl(key) {
    return `${LOCAL_BASE_URL}/uploads/${key}`;
}
function isOwnedByOurBucket(fileUrl) {
    return fileUrl.startsWith(`${LOCAL_BASE_URL}/uploads/`);
}
async function createPresignedUploadUrl(key, _contentType, _contentLength) {
    const uploadUrl = `${LOCAL_BASE_URL}/uploads/${key}`;
    return { uploadUrl, fileUrl: getPublicFileUrl(key) };
}
function resolveLocalAttachmentPath(key) {
    const safeKey = path_1.default.normalize(key).replace(/^(\.\.[/\\])+/, "");
    const filePath = path_1.default.join(LOCAL_ATTACHMENTS_DIR, safeKey);
    fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
    return filePath;
}
function keyFromLocalFileUrl(fileUrl) {
    const prefix = `${LOCAL_BASE_URL}/uploads/`;
    if (!fileUrl.startsWith(prefix))
        return null;
    return fileUrl.slice(prefix.length);
}
//# sourceMappingURL=s3.js.map