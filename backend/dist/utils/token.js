"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.generateOtp = generateOtp;
exports.generateRandomString = generateRandomString;
exports.generateTicketNumber = generateTicketNumber;
const crypto_1 = __importDefault(require("crypto"));
function generateToken() {
    return crypto_1.default.randomBytes(32).toString("base64url");
}
function generateOtp() {
    return crypto_1.default.randomInt(0, 1_000_000).toString().padStart(6, "0");
}
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}
function generateTicketNumber() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const datePart = `${yy}${mm}${dd}`;
    const suffix = crypto_1.default
        .randomBytes(3)
        .toString("hex")
        .toUpperCase()
        .slice(0, 4);
    return `TCK-${datePart}-${suffix}`;
}
//# sourceMappingURL=token.js.map