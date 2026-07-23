"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const database_1 = require("../lib/database");
async function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token)
        return res.status(401).json({ error: 'No token provided', code: 'NO_TOKEN' });
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "its-me");
        req.user = payload;
        const user = await database_1.prisma.user.findFirst({ where: { id: req.user?.id } });
        if (user?.isActive == false) {
            return res.status(401).json({ error: 'YOU HAVE BEEN BLOCKED', code: 'ACCOUNT_BLOCKED' });
        }
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid or expired token', code: 'SESSION_EXPIRED' });
    }
}
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            throw new errorHandler_1.AppError("Not authenticated", 401);
        }
        if (!allowedRoles.includes(req.user.role)) {
            throw new errorHandler_1.AppError("You do not have permission to perform this action", 403);
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map