"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSpreadsheet = exports.MAX_SPREADSHEET_SIZE_BYTES = void 0;
const multer_1 = __importDefault(require("multer"));
const errorHandler_1 = require("./errorHandler");
const storage = multer_1.default.memoryStorage();
const ALLOWED_MIME_TYPES = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream",
]);
function isAllowedSpreadsheet(fileName, mimeType) {
    const lower = fileName.toLowerCase();
    const hasAllowedExtension = lower.endsWith(".xlsx") || lower.endsWith(".xls");
    return hasAllowedExtension && ALLOWED_MIME_TYPES.has(mimeType);
}
exports.MAX_SPREADSHEET_SIZE_BYTES = 5 * 1024 * 1024;
exports.uploadSpreadsheet = (0, multer_1.default)({
    storage,
    limits: { fileSize: exports.MAX_SPREADSHEET_SIZE_BYTES },
    fileFilter: (_req, file, cb) => {
        if (!isAllowedSpreadsheet(file.originalname, file.mimetype)) {
            cb(new errorHandler_1.AppError("Unsupported file type. Please upload an .xlsx or .xls file", 400));
            return;
        }
        cb(null, true);
    },
}).single("file");
//# sourceMappingURL=upload.js.map