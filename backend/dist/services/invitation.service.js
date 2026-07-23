"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationError = exports.invitationService = void 0;
const database_1 = require("../lib/database");
const token_1 = require("../utils/token");
const notification_service_1 = require("./notification.service");
const client_1 = require("../generated/prisma/client");
const time_1 = require("../utils/time");
const jwt_1 = require("../utils/jwt");
const zoneStateMap_1 = require("../utils/zoneStateMap");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const INVITATION_TTL_DAYS = 7;
const DEPT_ADMIN_INVITABLE_ROLES = [
    client_1.UserRole.AGENT,
    client_1.UserRole.HOD,
    client_1.UserRole.CXO,
];
class InvitationError extends Error {
}
exports.InvitationError = InvitationError;
exports.invitationService = {
    async createInvitation(params) {
        const { name, inviter, email, role, departmentId, departmentIds, supportLevel, categoryIds, zone, windCategory } = params;
        const state = (0, zoneStateMap_1.statesForZone)(zone);
        const existingUser = await database_1.prisma.user.findUnique({ where: { email } });
        if (existingUser)
            throw new InvitationError("A user with this email already exists");
        const existingPending = await database_1.prisma.invitation.findFirst({
            where: { email, status: client_1.InvitationStatus.PENDING },
        });
        if (existingPending)
            throw new InvitationError("An active invitation already exists for this email");
        const password = "12345";
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        let invitation;
        if (role == client_1.UserRole.CXO || role == client_1.UserRole.HOD) {
            invitation = await database_1.prisma.invitation.create({
                data: {
                    name,
                    email,
                    Password: passwordHash,
                    invitedById: inviter.id,
                    role,
                    state,
                    department: {
                        connect: departmentIds.map(id => ({ id }))
                    },
                    categories: {
                        connect: categoryIds.map(id => ({ id }))
                    },
                    supportLevel,
                    token: (0, token_1.generateToken)(),
                    expiresAt: (0, time_1.daysFromNow)(INVITATION_TTL_DAYS),
                },
            });
        }
        else if (role == client_1.UserRole.AGENT) {
            invitation = await database_1.prisma.invitation.create({
                data: {
                    name,
                    email,
                    Password: passwordHash,
                    invitedById: inviter.id,
                    state,
                    windCategory: windCategory ?? null,
                    role,
                    department: {
                        connect: { id: departmentId }
                    },
                    categories: {
                        connect: categoryIds.map(id => ({ id }))
                    },
                    supportLevel,
                    token: (0, token_1.generateToken)(),
                    expiresAt: (0, time_1.daysFromNow)(INVITATION_TTL_DAYS),
                },
            });
        }
        else {
            invitation = await database_1.prisma.invitation.create({
                data: {
                    name,
                    email,
                    Password: passwordHash,
                    invitedById: inviter.id,
                    role,
                    supportLevel,
                    token: (0, token_1.generateToken)(),
                    expiresAt: (0, time_1.daysFromNow)(INVITATION_TTL_DAYS),
                },
            });
        }
        await notification_service_1.notificationService.sendInvitation(email, invitation.token, role, password);
        console.log(invitation);
        return invitation;
    },
    async acceptInvitation(params) {
        const { token } = params;
        const invitation = await database_1.prisma.invitation.findUnique({
            where: { token },
            include: {
                categories: true,
                department: true
            },
        });
        if (!invitation)
            throw new InvitationError("Invalid invitation token");
        console.log(invitation);
        if (invitation.status !== client_1.InvitationStatus.PENDING) {
            throw new InvitationError(`Invitation is ${invitation.status.toLowerCase()}`);
        }
        if (invitation.expiresAt < new Date()) {
            await database_1.prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: client_1.InvitationStatus.EXPIRED },
            });
            throw new InvitationError("Invitation has expired - ask an admin to resend it");
        }
        let user;
        switch (invitation.role) {
            case "CXO":
                user = await database_1.prisma.$transaction(async (tx) => {
                    const created = await tx.user.create({
                        data: {
                            email: invitation.email,
                            fullName: invitation.name,
                            passwordHash: invitation.Password,
                            role: invitation.role,
                            coxDepartements: {
                                connect: invitation.department
                                    .filter((dept) => dept?.id != null)
                                    .map((dept) => ({
                                    id: dept.id
                                }))
                            },
                            supportLevel: invitation.supportLevel,
                            onboardedById: invitation.invitedById,
                        },
                        include: {
                            categoryAssignments: true,
                            assignedDepartment: true,
                            managedDepartments: true,
                            coxDepartements: true,
                        },
                    });
                    await tx.invitation.update({
                        where: { id: invitation.id },
                        data: {
                            status: client_1.InvitationStatus.ACCEPTED,
                        },
                    });
                    return created;
                });
                break;
            case "HOD":
                user = await database_1.prisma.$transaction(async (tx) => {
                    const created = await tx.user.create({
                        data: {
                            email: invitation.email,
                            fullName: invitation.name,
                            passwordHash: invitation.Password,
                            role: invitation.role,
                            managedDepartments: {
                                connect: invitation.department
                                    .filter((dept) => dept?.id != null)
                                    .map((dept) => ({
                                    id: dept.id
                                }))
                            },
                            supportLevel: invitation.supportLevel,
                            onboardedById: invitation.invitedById,
                        },
                        include: {
                            categoryAssignments: true,
                            assignedDepartment: true,
                            managedDepartments: true,
                            coxDepartements: true,
                        },
                    });
                    await tx.invitation.update({
                        where: { id: invitation.id },
                        data: {
                            status: client_1.InvitationStatus.ACCEPTED,
                        },
                    });
                    return created;
                });
                break;
            case "AGENT":
                const deparment = invitation.department.map(dept => dept.id);
                const deparmentId = deparment[0];
                user = await database_1.prisma.$transaction(async (tx) => {
                    const created = await tx.user.create({
                        data: {
                            email: invitation.email,
                            fullName: invitation.name,
                            passwordHash: invitation.Password,
                            role: invitation.role,
                            state: invitation.state,
                            windCategory: invitation.windCategory,
                            agentsdepartmentId: deparmentId,
                            supportLevel: invitation.supportLevel,
                            onboardedById: invitation.invitedById,
                            categoryAssignments: {
                                create: invitation.categories.map((category) => ({
                                    categoryId: category.id,
                                })),
                            },
                        },
                        include: {
                            categoryAssignments: true,
                            assignedDepartment: true,
                            managedDepartments: true,
                            coxDepartements: true,
                        },
                    });
                    await tx.invitation.update({
                        where: { id: invitation.id },
                        data: {
                            status: client_1.InvitationStatus.ACCEPTED,
                        },
                    });
                    return created;
                });
                break;
            case 'REQUESTER':
                user = await database_1.prisma.$transaction(async (tx) => {
                    const created = await tx.user.create({
                        data: {
                            email: invitation.email,
                            fullName: invitation.name,
                            passwordHash: invitation.Password,
                            role: invitation.role,
                            onboardedById: invitation.invitedById,
                        },
                        include: {
                            categoryAssignments: true,
                            assignedDepartment: true,
                            managedDepartments: true,
                            coxDepartements: true,
                        },
                    });
                    await tx.invitation.update({
                        where: { id: invitation.id },
                        data: {
                            status: client_1.InvitationStatus.ACCEPTED,
                        },
                    });
                    return created;
                });
                break;
        }
        if (!user)
            throw new InvitationError("User cannot be created");
        const authToken = (0, jwt_1.signAuthToken)({
            id: user.id,
            role: user.role,
        });
        return { user, token: authToken };
    },
    async cancelInvitation(id) {
        return database_1.prisma.invitation.update({
            where: { id },
            data: { status: client_1.InvitationStatus.CANCELLED },
        });
    },
    async resendInvitation(id) {
        const invitation = await database_1.prisma.invitation.findUniqueOrThrow({ where: { id } });
        const refreshed = await database_1.prisma.invitation.update({
            where: { id },
            data: {
                token: (0, token_1.generateToken)(),
                expiresAt: (0, time_1.daysFromNow)(INVITATION_TTL_DAYS),
                status: client_1.InvitationStatus.PENDING,
            },
        });
        await notification_service_1.notificationService.sendInvitation(refreshed.email, refreshed.token, refreshed.role, refreshed.Password);
        return refreshed;
    },
    async expireStaleInvitations() {
        const { count } = await database_1.prisma.invitation.updateMany({
            where: { status: client_1.InvitationStatus.PENDING, expiresAt: { lt: new Date() } },
            data: { status: client_1.InvitationStatus.EXPIRED },
        });
        return count;
    },
};
//# sourceMappingURL=invitation.service.js.map