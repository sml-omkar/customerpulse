"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = exports.securityHeaders = void 0;
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
exports.securityHeaders = (0, helmet_1.default)();
const allowedOrigins = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim());
exports.corsMiddleware = (0, cors_1.default)({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
});
//# sourceMappingURL=security.js.map