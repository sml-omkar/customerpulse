"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priorityService = void 0;
const client_1 = require("../generated/prisma/client");
const ORDER = [client_1.TicketPriority.P1, client_1.TicketPriority.P2, client_1.TicketPriority.P3, client_1.TicketPriority.P4];
const rank = (p) => ORDER.indexOf(p);
const ROLE_BASE_PRIORITY = {
    GLOBAL_ADMIN: client_1.TicketPriority.P2,
    HOD: client_1.TicketPriority.P2,
    AGENT: client_1.TicketPriority.P3,
    REQUESTER: client_1.TicketPriority.P3,
    CXO: client_1.TicketPriority.P1
};
const SUPPORT_LEVEL_FLOOR = {
    L1: client_1.TicketPriority.P1,
};
function mostUrgent(...priorities) {
    return priorities.reduce((best, p) => (rank(p) < rank(best) ? p : best));
}
exports.priorityService = {
    computePriority(params) {
        const { categoryDefaultPriority } = params;
        const candidates = [];
        if (categoryDefaultPriority)
            candidates.push(categoryDefaultPriority);
        if (!categoryDefaultPriority)
            candidates.push(client_1.TicketPriority.P3);
        return mostUrgent(...candidates);
    },
    isEscalationCandidate(current, next) {
        return rank(next) < rank(current);
    },
};
//# sourceMappingURL=priority.service.js.map