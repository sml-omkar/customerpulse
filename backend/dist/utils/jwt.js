"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAuthToken = signAuthToken;
exports.verifyAuthToken = verifyAuthToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const EXPIRES_IN = "12h";
function signAuthToken(payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || "its-me", { expiresIn: "6h" });
}
function verifyAuthToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "its-me");
}
//# sourceMappingURL=jwt.js.map