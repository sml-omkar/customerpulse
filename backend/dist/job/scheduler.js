"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduledJobs = startScheduledJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const escalation_service_1 = require("../services/escalation.service");
const invitation_service_1 = require("../services/invitation.service");
function startScheduledJobs() {
    node_cron_1.default.schedule("*/5 * * * *", async () => {
        try {
            const results = await escalation_service_1.escalationService.runSlaSweep();
            if (results.length)
                console.log(`[sla-sweep] auto-escalated ${results.length} ticket(s)`);
        }
        catch (err) {
            console.error("[sla-sweep] failed:", err);
        }
    });
    node_cron_1.default.schedule("0 * * * *", async () => {
        try {
            const count = await invitation_service_1.invitationService.expireStaleInvitations();
            if (count)
                console.log(`[invitations] expired ${count} stale invitation(s)`);
        }
        catch (err) {
            console.error("[invitation-expiry] failed:", err);
        }
    });
    console.log("Scheduled jobs started: SLA sweep (5m), invitation expiry (1h)");
}
//# sourceMappingURL=scheduler.js.map