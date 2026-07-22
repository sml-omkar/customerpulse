import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { prisma } from "../lib/database";
import { isStaff } from "../utils/rbac";
import { AppError } from "../middleware/errorHandler";
import { TicketStatus } from "../generated/prisma/client";
import { notificationService } from "../services/notification.service";

const CLOSED_STATUSES: TicketStatus[] = [TicketStatus.RESOLVED];

export const commentController = {
  // POST /tickets/:ticketId/comments  { commentText, isInternal }
  // isInternal can only be set true by staff - a requester's own comment
  // is always visible to them, so it's forced to false for non-staff.
  // Comments are closed once a ticket is RESOLVED or CLOSED - reopen the
  // ticket (staff/admin PATCH status) if further discussion is needed.
  async create(req: AuthedRequest, res: Response) {
    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { id: req.params.ticketId },
      include: { requester: true, assignee: true },
    });
    if (CLOSED_STATUSES.includes(ticket.status)) {
      throw new AppError("This ticket is resolved/closed - reopen it before adding new comments", 400);
    }

    const isInternal = Boolean(req.body.isInternal) && isStaff(req.user!.role);
    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: req.params.ticketId,
        userId: req.user!.id,
        commentText: req.body.commentText,
        isInternal,
      },
      include: { user: true, attachment: true },
    });
    res.status(201).json(comment);

    // Notify the other party that a comment was added. Internal comments
    // are staff-only and never surfaced to the requester, so they're
    // excluded from the requester notification. The commenter themself
    // is never notified about their own comment.
    const recipients: (typeof ticket.requester)[] = [];
    if (!isInternal && ticket.requester.id !== req.user!.id) {
      recipients.push(ticket.requester);
    }
    if (ticket.assignee && ticket.assignee.id !== req.user!.id) {
      recipients.push(ticket.assignee);
    }

    await Promise.all(
      recipients.map((recipient) =>
        notificationService.sendCommentAdded(ticket, recipient, comment.user, comment.commentText)
      )
    ).catch((err) => {
      console.error("Failed to send comment notification:", err);
    });
  },

  // GET /tickets/:ticketId/comments
  async list(req: AuthedRequest, res: Response) {
    const staff = isStaff(req.user!.role);
    
    const comments = await prisma.ticketComment.findMany({
      where: { ticketId: req.params.ticketId, ...(staff ? {} : { isInternal: false }) },
      include: { user: true, attachment: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(comments);
  },
};
