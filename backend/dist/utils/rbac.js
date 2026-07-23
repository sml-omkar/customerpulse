"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.isRequesterOnly = exports.isStaff = exports.ASSIGNABLE_AGENT_ROLES = exports.REQUESTER_ONLY_ROLES = exports.STAFF_ROLES = exports.ADMIN_ROLES = void 0;
const client_1 = require("../generated/prisma/client");
exports.ADMIN_ROLES = [client_1.UserRole.GLOBAL_ADMIN];
exports.STAFF_ROLES = [
    client_1.UserRole.CXO,
    client_1.UserRole.HOD,
    client_1.UserRole.GLOBAL_ADMIN,
    client_1.UserRole.AGENT,
];
exports.REQUESTER_ONLY_ROLES = [
    client_1.UserRole.REQUESTER,
];
exports.ASSIGNABLE_AGENT_ROLES = [client_1.UserRole.AGENT];
const isStaff = (role) => exports.STAFF_ROLES.includes(role);
exports.isStaff = isStaff;
const isRequesterOnly = (role) => exports.REQUESTER_ONLY_ROLES.includes(role);
exports.isRequesterOnly = isRequesterOnly;
const isAdmin = (role) => exports.ADMIN_ROLES.includes(role);
exports.isAdmin = isAdmin;
//# sourceMappingURL=rbac.js.map