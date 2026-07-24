import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { prisma } from "../lib/database";
import { AppError } from "../middleware/errorHandler";
import { generateAdminTicketNumber } from "../utils/token";
import { notificationService } from "../services/notification.service";
import { UserRole, AdminTicketStatus } from "../generated/prisma/client";
import { parsePagination, paginatedResponse } from "../utils/pagination";

// Shared include/select so the raiser and (once responded to) the
// resolving admin's name/email are always available to the frontend
// without a second round trip.
const ADMIN_TICKET_INCLUDE = {
  raisedBy: { select: { id: true, fullName: true, email: true, role: true } },
  resolvedBy: { select: { id: true, fullName: true, email: true } },
} as const;

export const adminTicketController = {
  // POST /admin-tickets  (HOD, CXO, AGENT - enforced by requireRole on the route)
  // A HOD/CXO/AGENT raising an internal request directly to whichever
  // GLOBAL_ADMIN(s) exist - no department/client/category routing, unlike
  // the client-facing Ticket flow (see ticket.controller.ts create()).
  async create(req: AuthedRequest, res: Response) {
    const { subject, description } = req.body;

    const MAX_ATTEMPTS = 3;
    let adminTicket;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        adminTicket = await prisma.adminTicket.create({
          data: {
            ticketNumber: generateAdminTicketNumber(),
            subject,
            description,
            raisedById: req.user!.id,
          },
          include: ADMIN_TICKET_INCLUDE,
        });
        break;
      } catch (err: any) {
        const isUniqueViolation = err?.code === "P2002" && err?.meta?.target?.includes("ticketNumber");
        if (!isUniqueViolation || attempt === MAX_ATTEMPTS) throw err;
      }
    }
    if (!adminTicket) throw new AppError("Failed to raise the request, please try again", 500);

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "ADMIN_TICKET_RAISED",
        entityType: "AdminTicket",
        entityId: adminTicket.id,
      },
    });

    // Notify every GLOBAL_ADMIN - there's no single "the admin" for the
    // company, so whoever holds the role should hear about it. A failed
    // email here shouldn't fail the request itself (mirrors how
    // ticketService.createTicket doesn't roll back on notify failure).
    const admins = await prisma.user.findMany({ where: { role: UserRole.GLOBAL_ADMIN, isActive: true } });
    await Promise.allSettled(
      admins.map((admin) => notificationService.sendAdminTicketRaised(adminTicket!, adminTicket!.raisedBy, admin))
    );

    res.status(201).json(adminTicket);
  },

  // GET /admin-tickets/mine - the current user's own raised requests, so a
  // HOD/CXO/AGENT can track status/response on what they've filed.
  async listMine(req: AuthedRequest, res: Response) {
    const adminTickets = await prisma.adminTicket.findMany({
      where: { raisedById: req.user!.id },
      include: ADMIN_TICKET_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    res.json(adminTickets);
  },

  // GET /admin-tickets  (GLOBAL_ADMIN only) - every request raised company-wide,
  // optionally filtered by status.
  async list(req: AuthedRequest, res: Response) {
    const pagination = parsePagination(req);
    const where = req.query.status ? { status: req.query.status as AdminTicketStatus } : {};

    const [adminTickets, total] = await Promise.all([
      prisma.adminTicket.findMany({
        where,
        include: ADMIN_TICKET_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.adminTicket.count({ where }),
    ]);

    res.json(paginatedResponse(adminTickets, total, pagination));
  },

  // GET /admin-tickets/:id
  async getById(req: AuthedRequest, res: Response) {
    const adminTicket = await prisma.adminTicket.findUnique({
      where: { id: req.params.id },
      include: ADMIN_TICKET_INCLUDE,
    });
    if (!adminTicket) throw new AppError("Request not found", 404);

    // Non-admins may only see their own request.
    if (req.user!.role !== UserRole.GLOBAL_ADMIN && adminTicket.raisedById !== req.user!.id) {
      throw new AppError("You do not have permission to view this request", 403);
    }

    res.json(adminTicket);
  },

  // PATCH /admin-tickets/:id  (GLOBAL_ADMIN only) - respond to and/or move
  // the status of a request.
  async resolve(req: AuthedRequest, res: Response) {
    const { adminResponse, status } = req.body;

    const existing = await prisma.adminTicket.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("Request not found", 404);

    const nextStatus: AdminTicketStatus =
      status ?? (adminResponse ? AdminTicketStatus.RESOLVED : existing.status);

    const adminTicket = await prisma.adminTicket.update({
      where: { id: req.params.id },
      data: {
        ...(adminResponse !== undefined ? { adminResponse } : {}),
        status: nextStatus,
        resolvedById: nextStatus === AdminTicketStatus.RESOLVED ? req.user!.id : existing.resolvedById,
        resolvedAt: nextStatus === AdminTicketStatus.RESOLVED ? new Date() : existing.resolvedAt,
      },
      include: ADMIN_TICKET_INCLUDE,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "ADMIN_TICKET_RESPONDED",
        entityType: "AdminTicket",
        entityId: adminTicket.id,
      },
    });

    await notificationService.sendAdminTicketResolved(adminTicket, adminTicket.raisedBy);

    res.json(adminTicket);
  },
};
