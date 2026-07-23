"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const client_1 = require("../generated/prisma/client");
const zod_1 = require("zod");
const multer_1 = require("multer");
const invitation_service_1 = require("../services/invitation.service");
class AppError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
function notFoundHandler(req, res) {
    res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
}
function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    if (err instanceof invitation_service_1.InvitationError) {
        return res.status(400).json({ error: err.message });
    }
    if (err instanceof zod_1.ZodError) {
        return res.status(422).json({
            error: "Validation failed",
            details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        });
    }
    if (err instanceof multer_1.MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE" ? "File exceeds the maximum upload size" : err.message;
        return res.status(400).json({ error: message });
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025")
            return res.status(404).json({ error: "Record not found" });
        if (err.code === "P2002") {
            return res.status(409).json({ error: `Unique constraint violated on: ${err.meta?.target?.join(", ")}` });
        }
        if (err.code === "P2003")
            return res.status(409).json({ error: "Related record does not exist" });
    }
    console.error("[unhandled error]", err);
    res.status(500).json({ error: "Internal server error" });
}
//# sourceMappingURL=errorHandler.js.map