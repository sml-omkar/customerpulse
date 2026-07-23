"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationController = void 0;
const invitation_service_1 = require("../services/invitation.service");
const database_1 = require("../lib/database");
exports.invitationController = {
    async create(req, res) {
        try {
            const inviter = req.user;
            if (inviter == undefined || !inviter || inviter == null) {
                return res.status(401).json({ message: "no inviter found" });
            }
            const invitation = await invitation_service_1.invitationService.createInvitation({
                inviter: {
                    id: inviter.id,
                    role: inviter.role,
                },
                email: req.body.email,
                role: req.body.role,
                name: req.body.name,
                zone: req.body.zone,
                windCategory: req.body.role === "AGENT" ? (req.body.windCategory || null) : null,
                departmentId: req.body.departmentId,
                departmentIds: req.body.departmentIds,
                categoryIds: req.body.categoryIds,
                supportLevel: req.body.supportLevel,
            });
            res.status(201).json({
                message: "Successfully send invite"
            });
        }
        catch (error) {
            console.log(error);
            return res.status(401).json(error.message);
        }
    },
    async bulkCreate(req, res) {
        const inviter = req.user;
        if (!inviter) {
            return res.status(401).json({ message: "no inviter found" });
        }
        const { role, requestors, zone, windCategory, departmentId, departmentIds, categoryIds, supportLevel, } = req.body;
        if (!role) {
            return res.status(400).json({ message: "role is required" });
        }
        if (!Array.isArray(requestors) || requestors.length === 0) {
            return res.status(400).json({ message: "No rows were provided" });
        }
        const isExecutiveRole = role === "HOD" || role === "CXO";
        const isAgentRole = role === "AGENT";
        let validDepartmentIds = null;
        if (isExecutiveRole || isAgentRole) {
            const allIds = new Set();
            if (isExecutiveRole && Array.isArray(departmentIds))
                departmentIds.forEach((id) => typeof id === "string" && allIds.add(id));
            if (isAgentRole && typeof departmentId === "string" && departmentId)
                allIds.add(departmentId);
            for (const raw of requestors) {
                if (isExecutiveRole && Array.isArray(raw?.departmentIds)) {
                    raw.departmentIds.forEach((id) => {
                        if (typeof id === "string")
                            allIds.add(id);
                    });
                }
                if (isAgentRole && typeof raw?.departmentId === "string" && raw.departmentId) {
                    allIds.add(raw.departmentId);
                }
            }
            const found = await database_1.prisma.department.findMany({
                where: { id: { in: Array.from(allIds) } },
                select: { id: true },
            });
            validDepartmentIds = new Set(found.map((d) => d.id));
        }
        const created = [];
        const skipped = [];
        const seenInFile = new Set();
        for (const raw of requestors) {
            const name = typeof raw?.name === "string" ? raw.name.trim() : "";
            const email = typeof raw?.email === "string" ? raw.email.trim().toLowerCase() : "";
            if (!name || !email) {
                skipped.push({ name, email, reason: "Missing name or email" });
                continue;
            }
            if (seenInFile.has(email)) {
                skipped.push({ name, email, reason: "Duplicate row in uploaded file" });
                continue;
            }
            seenInFile.add(email);
            const rowDepartmentIds = isExecutiveRole
                ? (Array.isArray(raw?.departmentIds) && raw.departmentIds.length > 0
                    ? raw.departmentIds.filter((id) => typeof id === "string")
                    : (Array.isArray(departmentIds) ? departmentIds : []))
                : [];
            if (isExecutiveRole) {
                if (rowDepartmentIds.length === 0) {
                    skipped.push({ name, email, reason: "No department assigned to this row" });
                    continue;
                }
                const invalidIds = rowDepartmentIds.filter((id) => !validDepartmentIds.has(id));
                if (invalidIds.length > 0) {
                    skipped.push({ name, email, reason: "One or more assigned departments no longer exist" });
                    continue;
                }
            }
            const rowDepartmentId = isAgentRole
                ? (typeof raw?.departmentId === "string" && raw.departmentId ? raw.departmentId : (departmentId || ""))
                : (departmentId || "");
            const rowCategoryIds = isAgentRole
                ? (Array.isArray(raw?.categoryIds) && raw.categoryIds.length > 0
                    ? raw.categoryIds.filter((id) => typeof id === "string")
                    : (Array.isArray(categoryIds) ? categoryIds : []))
                : (categoryIds || []);
            const rowZone = isAgentRole
                ? (typeof raw?.zone === "string" && raw.zone ? raw.zone : (zone || ""))
                : (role === "AGENT" ? (zone || "") : "");
            const rowWindCategory = isAgentRole
                ? (raw?.windCategory || windCategory || null)
                : (role === "AGENT" ? (windCategory || null) : null);
            if (isAgentRole) {
                if (!rowDepartmentId) {
                    skipped.push({ name, email, reason: "No department assigned to this row" });
                    continue;
                }
                if (!validDepartmentIds.has(rowDepartmentId)) {
                    skipped.push({ name, email, reason: "Assigned department no longer exists" });
                    continue;
                }
                if (!rowWindCategory) {
                    skipped.push({ name, email, reason: "No wind category assigned to this row" });
                    continue;
                }
                if (rowCategoryIds.length === 0) {
                    skipped.push({ name, email, reason: "No category assigned to this row" });
                    continue;
                }
            }
            try {
                await invitation_service_1.invitationService.createInvitation({
                    inviter: { id: inviter.id, role: inviter.role },
                    email,
                    role,
                    name,
                    zone: rowZone,
                    windCategory: rowWindCategory,
                    departmentId: rowDepartmentId,
                    departmentIds: isExecutiveRole ? rowDepartmentIds : [],
                    categoryIds: rowCategoryIds,
                    supportLevel,
                });
                created.push(email);
            }
            catch (err) {
                const reason = err instanceof invitation_service_1.InvitationError ? err.message : (err?.message || "Could not invite this row");
                skipped.push({ name, email, reason });
            }
        }
        return res.status(200).json({
            totalRows: requestors.length,
            createdCount: created.length,
            skippedCount: skipped.length,
            created,
            skipped,
        });
    },
    async accept(req, res) {
        const { user, token } = await invitation_service_1.invitationService.acceptInvitation({
            token: req.body.token,
            fullName: req.body.fullName,
            password: req.body.password,
        });
        res.status(201).json({
            token,
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, departments: [...user.managedDepartments.map(dept => dept.id), ...user.coxDepartements.map(dept => dept.id), user.assignedDepartment?.id] },
        });
    },
    async list(req, res) {
        const invitations = await database_1.prisma.invitation.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                role: true,
                email: true,
                status: true,
                department: {
                    select: {
                        name: true
                    }
                }
            }
        });
        res.json(invitations);
    },
    async resend(req, res) {
        const invitation = await invitation_service_1.invitationService.resendInvitation(req.params.id);
        res.json(invitation);
    },
    async cancel(req, res) {
        const invitation = await invitation_service_1.invitationService.cancelInvitation(req.params.id);
        res.json(invitation);
    },
};
//# sourceMappingURL=invitation.controller.js.map