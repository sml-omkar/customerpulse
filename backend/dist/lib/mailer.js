"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
exports.sendMail = sendMail;
const dotenv_1 = __importDefault(require("dotenv"));
const resend_1 = require("resend");
dotenv_1.default.config();
exports.transporter = new resend_1.Resend(process.env.RESEND_API_KEY);
console.log(exports.transporter);
async function sendMail({ to, subject, html }) {
    try {
        await exports.transporter.emails.send({
            from: 'Sanghvi Movers ltd <noreply@surajweb.in>',
            to,
            subject,
            html,
        });
    }
    catch (err) {
        console.error(`[mailer] failed to send "${subject}" to ${to}:`, err);
    }
}
//# sourceMappingURL=mailer.js.map