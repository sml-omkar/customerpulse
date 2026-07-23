"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketController = void 0;
const ticket_service_1 = require("../services/ticket.service");
const escalation_service_1 = require("../services/escalation.service");
const assignment_service_1 = require("../services/assignment.service");
const statushistory_service_1 = require("../services/statushistory.service");
const database_1 = require("../lib/database");
const client_1 = require("../generated/prisma/client");
const rbac_1 = require("../utils/rbac");
const pagination_1 = require("../utils/pagination");
const errorHandler_1 = require("../middleware/errorHandler");
const time_1 = require("../utils/time");
const slaClock_service_1 = require("../services/slaClock.service");
const notification_service_1 = require("../services/notification.service");
const priority_service_1 = require("../services/priority.service");
const internalPriority_service_1 = require("../services/internalPriority.service");
const TOP_MANAGEMENT_DESIGNATIONS = [client_1.Designation.CEO, client_1.Designation.COO, client_1.Designation.CXO];
const ACTIVE_SLA_STATUSES = [client_1.TicketStatus.OPEN, client_1.TicketStatus.REOPENED, client_1.TicketStatus.IN_PROGRESS];
const DEPARTMENT_SCOPED_ROLES = [client_1.UserRole.HOD, client_1.UserRole.CXO];
const BASE_SLA_MINUTES_BY_PRIORITY = {
    P1: 4 * 60,
    P2: 8 * 60,
    P3: 24 * 60,
    P4: 72 * 60,
};
async function getScopedDepartmentIds(userId, role) {
    if (role === client_1.UserRole.HOD) {
        const departments = await database_1.prisma.department.findMany({
            where: { managerId: userId },
            select: { id: true },
        });
        return departments.map((d) => d.id);
    }
    if (role === client_1.UserRole.CXO) {
        const departments = await database_1.prisma.department.findMany({
            where: { cxoId: userId },
            select: { id: true },
        });
        return departments.map((d) => d.id);
    }
    return [];
}
function parseDateBound(value, endOfDay) {
    if (typeof value !== "string" || !value)
        return undefined;
    const date = new Date(endOfDay ? `${value}T23:59:59.999` : value);
    return Number.isNaN(date.getTime()) ? undefined : date;
}
function dateRangeFilter(fromValue, toValue) {
    const gte = parseDateBound(fromValue, false);
    const lte = parseDateBound(toValue, true);
    if (!gte && !lte)
        return undefined;
    return { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
}
exports.ticketController = {
    async myTickets(req, res) {
        if (!req.params.id)
            throw new errorHandler_1.AppError("Invalid user");
        const tickets = await database_1.prisma.ticket.findMany({
            where: {
                requesterId: req.params.id,
                status: { notIn: [client_1.TicketStatus.ON_HOLD, client_1.TicketStatus.RESOLVED] }
            }, select: {
                createdAt: true,
                ticketNumber: true,
                id: true,
                internalPriority: true,
                status: true,
                clientName: true,
                department: {
                    select: {
                        name: true
                    }
                },
                assignee: {
                    select: {
                        fullName: true
                    }
                },
            }
        });
        res.json(tickets);
    },
    async resolved(req, res) {
        if (!req.params.id)
            throw new errorHandler_1.AppError("Invalid user");
        const tickets = await database_1.prisma.ticket.findMany({
            where: {
                requesterId: req.params.id,
                status: client_1.TicketStatus.RESOLVED
            }, select: {
                createdAt: true,
                ticketNumber: true,
                id: true,
                internalPriority: true,
                status: true,
                clientName: true,
                department: {
                    select: {
                        name: true
                    }
                },
                assignee: {
                    select: {
                        fullName: true
                    }
                },
            }
        });
        res.json(tickets);
    },
    async onhold(req, res) {
        if (!req.params.id)
            throw new errorHandler_1.AppError("Invalid user");
        const tickets = await database_1.prisma.ticket.findMany({
            where: {
                requesterId: req.params.id,
                status: client_1.TicketStatus.ON_HOLD
            }, select: {
                createdAt: true,
                ticketNumber: true,
                id: true,
                internalPriority: true,
                status: true,
                clientName: true,
                department: {
                    select: {
                        name: true
                    }
                },
                assignee: {
                    select: {
                        fullName: true
                    }
                },
            }
        });
        res.json(tickets);
    },
    async create(req, res) {
        const ticket = await ticket_service_1.ticketService.createTicket({
            requesterId: req.user.id,
            departmentId: req.body.departmentId,
            categoryId: req.body.categoryId,
            title: req.body.title,
            description: req.body.description,
            tags: req.body.tags,
            representative: req.body.representative,
            employeeId: req.body.employeeId,
            clientName: req.body.clientName,
            clientEmail: req.body.clientEmail,
            dateOfOccurance: req.body.dateOfOccurance,
            site: req.body.site,
            state: req.body.state,
            designation: req.body.designation,
            projectId: req.body.projectId,
        });
        res.status(201).json(ticket);
    },
    async list(req, res) {
        const role = req.user.role;
        const pagination = (0, pagination_1.parsePagination)(req);
        let scopeWhere = {};
        if ((0, rbac_1.isRequesterOnly)(role)) {
            scopeWhere = { requesterId: req.user.id };
        }
        else if (role === client_1.UserRole.AGENT) {
            scopeWhere = { OR: [{ assigneeId: req.user.id }, { requesterId: req.user.id }] };
        }
        else if (DEPARTMENT_SCOPED_ROLES.includes(role)) {
            const deptIds = await getScopedDepartmentIds(req.user.id, role);
            scopeWhere = { OR: [{ departmentId: { in: deptIds } }, { requesterId: req.user.id }] };
        }
        const filterWhere = {};
        if (req.query.departmentId)
            filterWhere.departmentId = req.query.departmentId;
        if (req.query.status)
            filterWhere.status = req.query.status;
        if (req.query.assigneeId)
            filterWhere.assigneeId = req.query.assigneeId;
        if (req.query.internalPriority)
            filterWhere.internalPriority = req.query.internalPriority;
        if (req.query.categoryId)
            filterWhere.categoryId = req.query.categoryId;
        if (req.query.projectId)
            filterWhere.projectId = req.query.projectId;
        if (req.query.clientName)
            filterWhere.clientName = req.query.clientName;
        if (req.query.state)
            filterWhere.state = req.query.state;
        const dateOfOccurance = dateRangeFilter(req.query.dateOfOccuranceFrom, req.query.dateOfOccuranceTo);
        if (dateOfOccurance)
            filterWhere.dateOfOccurance = dateOfOccurance;
        const slaDeadline = dateRangeFilter(req.query.slaDeadlineFrom, req.query.slaDeadlineTo);
        if (slaDeadline)
            filterWhere.slaDeadline = slaDeadline;
        const createdRange = dateRangeFilter(req.query.createdFrom, req.query.createdTo);
        if (createdRange)
            filterWhere.createdAt = createdRange;
        const where = Object.keys(scopeWhere).length ? { AND: [scopeWhere, filterWhere] } : filterWhere;
        const [tickets, total] = await Promise.all([
            database_1.prisma.ticket.findMany({
                where,
                include: {
                    assignee: { select: { fullName: true, email: true, supportLevel: true } },
                    requester: { select: { id: true, fullName: true, email: true, employeeId: true, role: true } },
                    department: { select: { id: true, name: true } },
                    category: { select: { id: true, name: true, defaultSlaMinutes: true, defaultPriority: true } },
                    project: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: pagination.skip,
                take: pagination.take,
            }),
            database_1.prisma.ticket.count({ where }),
        ]);
        res.json((0, pagination_1.paginatedResponse)(tickets, total, pagination));
    },
    async getAssigned(req, res) {
        const id = req.params.id;
        console.log(id);
        if (!id)
            return res.status(404).json({ error: "id provided" });
        const assignedTickets = await database_1.prisma.ticket.findMany({
            where: {
                assigneeId: id,
                status: { notIn: [client_1.TicketStatus.RESOLVED] }
            },
            select: {
                createdAt: true,
                id: true,
                ticketNumber: true,
                internalPriority: true,
                status: true,
                clientName: true,
                department: {
                    select: {
                        name: true
                    }
                },
                assignee: {
                    select: {
                        fullName: true
                    }
                },
            }
        });
        console.log(assignedTickets);
        res.json(assignedTickets);
    },
    async getBreachedTickets(req, res) {
        const id = req.params.id;
        if (!id)
            return res.status(404).json({ error: "id provided" });
        const assignedTickets = await database_1.prisma.ticket.findMany({
            where: {
                assigneeId: id,
                slaBreached: true
            },
            select: {
                id: true,
                createdAt: true,
                ticketNumber: true,
                internalPriority: true,
                status: true,
                clientName: true,
                department: {
                    select: {
                        name: true
                    }
                },
                assignee: {
                    select: {
                        fullName: true
                    }
                },
            }
        });
        res.json(assignedTickets);
    },
    async listByDepartment(req, res) {
        const { departmentId } = req.params;
        if (req.user.role === client_1.UserRole.HOD && req.user.departmentId !== departmentId) {
            throw new errorHandler_1.AppError("You can only view tickets in your own department", 403);
        }
        const tickets = await database_1.prisma.ticket.findMany({
            where: {
                departmentId,
                status: req.query.status,
                priority: req.query.priority,
            },
            include: { assignee: true, requester: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(tickets);
    },
    async listMine(req, res) {
        const tickets = await database_1.prisma.ticket.findMany({
            where: {
                requesterId: req.user.id,
                status: req.query.status,
                priority: req.query.priority,
            },
            include: { assignee: true, requester: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(tickets);
    },
    async listAssignedToMe(req, res) {
        const tickets = await database_1.prisma.ticket.findMany({
            where: {
                assigneeId: req.user.id,
                status: req.query.status,
                priority: req.query.priority,
            },
            include: { assignee: true, requester: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(tickets);
    },
    async getById(req, res) {
        const ticket = await database_1.prisma.ticket.findUniqueOrThrow({
            where: { id: req.params.id },
            include: {
                assignee: true,
                department: { select: { id: true, name: true } },
                requester: { select: { id: true, fullName: true, email: true } },
                category: true,
                keywords: { include: { keyword: true } },
                escalationHistory: { include: { escalatedBy: true, escalatedTo: true }, orderBy: { createdAt: "asc" } },
                comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
                attachments: true,
                statusHistory: { orderBy: { changedAt: "asc" } },
            },
        });
        if ((0, rbac_1.isRequesterOnly)(req.user.role)) {
            ticket.comments = ticket.comments.filter((c) => !c.isInternal);
        }
        res.json(ticket);
    },
    async update(req, res) {
        const { status, comment } = req.body;
        if (status === client_1.TicketStatus.ON_HOLD && !(typeof comment === "string" && comment.trim().length > 0)) {
            throw new errorHandler_1.AppError("A comment is required when placing a ticket on hold", 400);
        }
        if (status === client_1.TicketStatus.RESOLVED && !(typeof comment === "string" && comment.trim().length > 0)) {
            throw new errorHandler_1.AppError("A comment is required when resolving a ticket", 400);
        }
        const previous = await database_1.prisma.ticket.findUniqueOrThrow({ where: { id: req.params.id },
            select: {
                id: true,
                status: true,
                createdAt: true,
                dateOfOccurance: true,
                slaDeadline: true,
                slaRemainingMinutes: true,
                holdStartedAt: true,
                totalHoldMinutes: true,
                resolvedStartedAt: true,
                totalResolvedMinutes: true,
                assignee: true,
                category: {
                    select: {
                        defaultPriority: true,
                        defaultSlaMinutes: true
                    }
                }
            }
        });
        const now = new Date();
        const slaClockUpdate = status !== undefined && status !== previous.status
            ? (0, slaClock_service_1.computeSlaClockUpdate)(previous, status, now)
            : {};
        if (status == client_1.TicketStatus.REOPENED && previous) {
            const resumedDeadline = slaClockUpdate.slaDeadline
                ?? (previous.slaRemainingMinutes == null
                    ? (0, time_1.minutesFromNow)(previous.category?.defaultSlaMinutes ?? BASE_SLA_MINUTES_BY_PRIORITY["P3"])
                    : null);
            const ticket = await database_1.prisma.ticket.update({
                where: { id: req.params.id },
                data: {
                    ...slaClockUpdate,
                    status,
                    slaDeadline: resumedDeadline,
                    resolvedAt: null,
                    turnOverTime: (0, slaClock_service_1.computeAgentTurnOverTimeSeconds)({ ...previous, ...slaClockUpdate, status }, now),
                    ticketTurnOverTime: (0, slaClock_service_1.computeTicketTurnOverTimeSeconds)({ ...previous, ...slaClockUpdate, status }, now),
                }
            });
            if (status !== undefined && status !== previous.status) {
                await (0, statushistory_service_1.logStatusChange)({
                    ticketId: ticket.id,
                    fromStatus: previous.status,
                    toStatus: status,
                    changedById: req.user.id,
                });
            }
            if (previous.assignee) {
                await notification_service_1.notificationService.sendTicketReopened(ticket, previous.assignee);
            }
            return res.json(ticket);
        }
        else if (status == client_1.TicketStatus.RESOLVED && previous) {
            const ticket = await database_1.prisma.ticket.update({
                where: { id: req.params.id },
                data: {
                    ...slaClockUpdate,
                    status,
                    resolvedAt: now,
                    turnOverTime: (0, slaClock_service_1.computeAgentTurnOverTimeSeconds)({ ...previous, ...slaClockUpdate, status }, now),
                    ticketTurnOverTime: (0, slaClock_service_1.computeTicketTurnOverTimeSeconds)({ ...previous, ...slaClockUpdate, status }, now),
                }, select: {
                    id: true,
                    requester: true,
                    ticketNumber: true,
                    title: true
                }
            });
            if (status !== undefined && status !== previous.status) {
                await (0, statushistory_service_1.logStatusChange)({
                    ticketId: ticket.id,
                    fromStatus: previous.status,
                    toStatus: status,
                    changedById: req.user.id,
                    note: comment.trim(),
                });
                await database_1.prisma.ticketComment.create({
                    data: {
                        ticketId: ticket.id,
                        userId: req.user.id,
                        commentText: comment.trim(),
                        isInternal: false,
                    },
                });
            }
            await notification_service_1.notificationService.sendTicketResolved(ticket, ticket.requester);
            return res.json(ticket);
        }
        const ticket = await database_1.prisma.ticket.update({
            where: { id: req.params.id },
            data: {
                ...slaClockUpdate,
                status,
                ...(status !== undefined && status !== previous.status
                    ? {
                        turnOverTime: (0, slaClock_service_1.computeAgentTurnOverTimeSeconds)({ ...previous, ...slaClockUpdate, status }, now),
                        ticketTurnOverTime: (0, slaClock_service_1.computeTicketTurnOverTimeSeconds)({ ...previous, ...slaClockUpdate, status }, now),
                    }
                    : {}),
            },
        });
        if (status !== undefined && status !== previous.status) {
            await (0, statushistory_service_1.logStatusChange)({
                ticketId: ticket.id,
                fromStatus: previous.status,
                toStatus: status,
                changedById: req.user.id,
                note: typeof comment === "string" && comment.trim().length > 0 ? comment.trim() : undefined,
            });
            if (typeof comment === "string" && comment.trim().length > 0) {
                await database_1.prisma.ticketComment.create({
                    data: {
                        ticketId: ticket.id,
                        userId: req.user.id,
                        commentText: comment.trim(),
                        isInternal: false,
                    },
                });
            }
        }
        res.json(ticket);
    },
    async editTicket(req, res) {
        const { title, description, clientName, clientEmail, dateOfOccurance, site, state, designation, departmentId, categoryId, projectId, } = req.body;
        const previous = await database_1.prisma.ticket.findUniqueOrThrow({
            where: { id: req.params.id },
            select: {
                status: true,
                priority: true,
                departmentId: true,
                categoryId: true,
                projectId: true,
                clientName: true,
                designation: true,
                slaDeadline: true,
                slaRemainingMinutes: true,
                slaTotalMinutes: true,
            },
        });
        const data = {};
        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) {
                throw new errorHandler_1.AppError("Title cannot be empty", 400);
            }
            data.title = title.trim();
        }
        if (description !== undefined)
            data.description = description === null ? null : String(description);
        if (clientName !== undefined) {
            if (typeof clientName !== "string" || !clientName.trim()) {
                throw new errorHandler_1.AppError("Client name cannot be empty", 400);
            }
            data.clientName = clientName.trim();
        }
        if (clientEmail !== undefined) {
            if (typeof clientEmail !== "string" || !clientEmail.trim()) {
                throw new errorHandler_1.AppError("Client email cannot be empty", 400);
            }
            data.clientEmail = clientEmail.trim();
        }
        if (dateOfOccurance !== undefined) {
            const parsed = new Date(dateOfOccurance);
            if (Number.isNaN(parsed.getTime()))
                throw new errorHandler_1.AppError("Invalid dateOfOccurance", 400);
            data.dateOfOccurance = parsed;
        }
        if (site !== undefined) {
            if (typeof site !== "string" || !site.trim()) {
                throw new errorHandler_1.AppError("Site cannot be empty", 400);
            }
            data.site = site.trim();
        }
        if (state !== undefined)
            data.state = state;
        if (designation !== undefined)
            data.designation = designation;
        let category = null;
        let categoryFetched = false;
        if (departmentId !== undefined) {
            const department = await database_1.prisma.department.findUnique({ where: { id: departmentId } });
            if (!department)
                throw new errorHandler_1.AppError("Department not found", 400);
            data.departmentId = departmentId;
        }
        if (categoryId !== undefined) {
            categoryFetched = true;
            if (categoryId === null) {
                data.categoryId = null;
            }
            else {
                category = await database_1.prisma.ticketCategory.findUnique({ where: { id: categoryId } });
                if (!category)
                    throw new errorHandler_1.AppError("Category not found", 400);
                data.categoryId = categoryId;
            }
        }
        let project = null;
        let projectFetched = false;
        if (projectId !== undefined) {
            projectFetched = true;
            if (projectId === null) {
                data.projectId = null;
            }
            else {
                project = await database_1.prisma.project.findUnique({ where: { id: projectId } });
                if (!project)
                    throw new errorHandler_1.AppError("Project not found", 400);
                data.projectId = projectId;
            }
        }
        if (Object.keys(data).length === 0) {
            throw new errorHandler_1.AppError("No editable fields were provided", 400);
        }
        const effectiveCategoryId = categoryFetched ? categoryId : previous.categoryId;
        const effectiveProjectId = projectFetched ? projectId : previous.projectId;
        const effectiveClientName = data.clientName ?? previous.clientName;
        const effectiveDesignation = data.designation ?? previous.designation;
        if (!categoryFetched && effectiveCategoryId) {
            category = await database_1.prisma.ticketCategory.findUnique({ where: { id: effectiveCategoryId } });
        }
        if (!projectFetched && effectiveProjectId) {
            project = await database_1.prisma.project.findUnique({ where: { id: effectiveProjectId } });
        }
        const client = effectiveClientName
            ? await database_1.prisma.client.findFirst({ where: { name: effectiveClientName } })
            : null;
        const newPriority = priority_service_1.priorityService.computePriority({
            categoryDefaultPriority: category?.defaultPriority,
        });
        const internalPriorityResult = internalPriority_service_1.internalPriorityService.computeScore({
            isWorkStopping: category?.isWorkStopping ?? false,
            isSafetyViolation: category?.isSafetyViolation ?? false,
            isShutdownJob: project?.isShutdownJob ?? false,
            isReportedByTopManagement: !!effectiveDesignation && TOP_MANAGEMENT_DESIGNATIONS.includes(effectiveDesignation),
            isKeyClient: client?.isKeyClient ?? false,
        });
        data.priority = newPriority;
        data.internalPriority = internalPriorityResult.level;
        const categoryChanged = categoryFetched && effectiveCategoryId !== previous.categoryId;
        const departmentChanged = departmentId !== undefined && departmentId !== previous.departmentId;
        const needsReroute = categoryChanged || departmentChanged;
        const now = new Date();
        const previousTotalMinutes = previous.slaTotalMinutes ?? BASE_SLA_MINUTES_BY_PRIORITY[previous.priority];
        const isCurrentlyActive = ACTIVE_SLA_STATUSES.includes(previous.status);
        const previousRemainingMinutes = isCurrentlyActive
            ? (previous.slaDeadline ? (0, time_1.diffInMinutes)(now, previous.slaDeadline) : previousTotalMinutes)
            : (previous.slaRemainingMinutes ?? previousTotalMinutes);
        const consumedMinutes = Math.max(0, previousTotalMinutes - previousRemainingMinutes);
        const newTotalMinutes = category?.defaultSlaMinutes ?? BASE_SLA_MINUTES_BY_PRIORITY[newPriority];
        const newRemainingMinutes = newTotalMinutes - consumedMinutes;
        data.slaTotalMinutes = newTotalMinutes;
        if (isCurrentlyActive) {
            data.slaDeadline = (0, time_1.addMinutes)(now, newRemainingMinutes);
            data.slaBreached = newRemainingMinutes <= 0;
        }
        else {
            data.slaRemainingMinutes = newRemainingMinutes;
        }
        const ticket = await database_1.prisma.ticket.update({
            where: { id: req.params.id },
            data,
            include: {
                assignee: true,
                department: { select: { id: true, name: true } },
                requester: { select: { id: true, fullName: true, email: true } },
                category: true,
            },
        });
        await database_1.prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "TICKET_EDITED",
                entityType: "Ticket",
                entityId: ticket.id,
            },
        });
        let finalTicket = ticket;
        if (needsReroute) {
            const reassigned = await assignment_service_1.assignmentService.autoAssign(ticket.id, req.user.id);
            if (reassigned) {
                await database_1.prisma.auditLog.create({
                    data: {
                        userId: req.user.id,
                        action: "TICKET_AUTO_REROUTED",
                        entityType: "Ticket",
                        entityId: ticket.id,
                    },
                });
                finalTicket = await database_1.prisma.ticket.findUniqueOrThrow({
                    where: { id: ticket.id },
                    include: {
                        assignee: true,
                        department: { select: { id: true, name: true } },
                        requester: { select: { id: true, fullName: true, email: true } },
                        category: true,
                    },
                });
            }
        }
        res.json(finalTicket);
    },
    async updatePriority(req, res) {
        const { priority } = req.body;
        const ticket = await database_1.prisma.ticket.update({
            where: { id: req.params.id },
            data: { priority },
        });
        await database_1.prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "TICKET_PRIORITY_OVERRIDDEN",
                entityType: "Ticket",
                entityId: ticket.id,
            },
        });
        res.json(ticket);
    },
    async escalate(req, res) {
        try {
            const result = await escalation_service_1.escalationService.escalate({
                ticketId: req.params.id,
                reason: req.body.reason,
                escalatedById: req.user.id,
                toLevel: req.body.toLevel,
            });
            res.json(result);
        }
        catch (err) {
            throw new errorHandler_1.AppError(err.message, 400);
        }
    },
    async assign(req, res) {
        const ticket = await assignment_service_1.assignmentService.manualAssign(req.params.id, req.body.agentId, req.user.id);
        res.json(ticket);
    },
    async autoReassign(req, res) {
        const ticket = await assignment_service_1.assignmentService.autoAssign(req.params.id, req.user.id);
        if (!ticket)
            throw new errorHandler_1.AppError("No eligible agent available right now", 409);
        res.json(ticket);
    },
    async resolve(req, res) {
        const { comment } = req.body;
        if (!(typeof comment === "string" && comment.trim().length > 0)) {
            throw new errorHandler_1.AppError("A comment is required when resolving a ticket", 400);
        }
        const ticket = await ticket_service_1.ticketService.resolveTicket(req.params.id, req.user.id, comment.trim());
        res.json(ticket);
    },
    async listEscalations(req, res) {
        const escalations = await database_1.prisma.ticketEscalation.findMany({
            where: { ticketId: req.params.id },
            include: { escalatedBy: true, escalatedTo: true },
            orderBy: { createdAt: "asc" },
        });
        res.json(escalations);
    },
    async listStatusHistory(req, res) {
        const history = await database_1.prisma.ticketStatusHistory.findMany({
            where: { ticketId: req.params.id },
            include: { changedBy: true },
            orderBy: { changedAt: "asc" },
        });
        res.json(history);
    },
    async addKeyword(req, res) {
        const link = await database_1.prisma.ticketKeyword.upsert({
            where: { ticketId_keywordId: { ticketId: req.params.id, keywordId: req.body.keywordId } },
            update: {},
            create: { ticketId: req.params.id, keywordId: req.body.keywordId },
        });
        res.status(201).json(link);
    },
    async removeKeyword(req, res) {
        await database_1.prisma.ticketKeyword.delete({
            where: { ticketId_keywordId: { ticketId: req.params.id, keywordId: req.params.keywordId } },
        });
        res.status(204).send();
    },
};
//# sourceMappingURL=ticket.controller.js.map