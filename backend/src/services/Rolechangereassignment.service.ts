import { prisma } from "../lib/database";
import { TicketStatus, UserRole } from "../generated/prisma/client";
import { assignmentService } from "./assignment.service";
import { sendMail } from "../lib/mailer";

// Same "still being worked" set used by assignment.service - only these
// tickets need to move, a RESOLVED ticket doesn't need reassignment.
const OPEN_STATUSES: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.ON_HOLD,
  TicketStatus.REOPENED,
];

interface TicketRef {
  ticketNumber: string;
  title: string;
}

export interface PromotionReassignmentSummary {
  reassigned: (TicketRef & { newAssigneeName: string })[];
  unassigned: TicketRef[];
}

function layout(title: string, bodyHtml: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h2 style="color:#111827">${title}</h2>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="font-size:12px;color:#9ca3af">This is an automated message from the Helpdesk system.</p>
    </div>
  `;
}

function ticketList(tickets: TicketRef[]) {
  return `<ul>${tickets.map((t) => `<li><b>${t.ticketNumber}</b> - ${t.title}</li>`).join("")}</ul>`;
}

export const roleChangeReassignmentService = {
  /**
   * Called from userController.update right after a GLOBAL_ADMIN flips an
   * AGENT's role to HOD or CXO. The promoted user no longer works tickets
   * themselves, so every ticket still open in their queue has to go
   * somewhere:
   *
   *   - if the (old) department still has other active agents, each
   *     ticket is routed through the normal auto-assignment logic
   *     (category match -> keyword match -> load balance) exactly like a
   *     brand new ticket, and taken off the promoted user's queue.
   *   - if there are no other agents left in the department, the ticket
   *     is simply unassigned rather than left stuck on someone who can no
   *     longer act on it.
   *
   * The promoted user is notified either way (in-app + email) with the
   * full breakdown, since these were their tickets a moment ago.
   *
   * IMPORTANT: this must run *after* the role change has already been
   * committed to the DB, so the promoted user's own row no longer reports
   * role AGENT and is naturally excluded from the auto-assignment
   * candidate pool.
   */
  async handleAgentPromotedAway(params: {
    promotedUserId: string;
    promotedUserFullName: string;
    promotedUserEmail: string;
    oldDepartmentId: string | null;
    newRole: UserRole;
    performedById: string;
  }): Promise<PromotionReassignmentSummary | null> {
    const { promotedUserId, promotedUserFullName, promotedUserEmail, oldDepartmentId, newRole, performedById } = params;

    if (!oldDepartmentId) return null;

    const openTickets = await prisma.ticket.findMany({
      where: { assigneeId: promotedUserId, status: { in: OPEN_STATUSES } },
      select: { id: true, ticketNumber: true, title: true },
    });

    if (openTickets.length === 0) return null;

    const otherAgentCount = await prisma.user.count({
      where: {
        role: UserRole.AGENT,
        isActive: true,
        agentsdepartmentId: oldDepartmentId,
        id: { not: promotedUserId },
      },
    });

    const reassigned: (TicketRef & { newAssigneeName: string })[] = [];
    const unassigned: TicketRef[] = [];

    for (const ticket of openTickets) {
      let handled = false;

      if (otherAgentCount > 0) {
        // findBestAgent only ever considers AGENT-role users, and the
        // promoted user's role has already flipped by this point, so they
        // can't be picked again here.
        const best = await assignmentService.findBestAgent(ticket.id);
        if (best) {
          await assignmentService.autoAssign(ticket.id, performedById);
          reassigned.push({ ticketNumber: ticket.ticketNumber, title: ticket.title, newAssigneeName: best.agent.fullName });
          handled = true;
        }
      }

      if (!handled) {
        // No agents left in the department (or none could be matched) -
        // clear the assignment instead of leaving it stranded.
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { assigneeId: null, assignedById: null, assignmentMethod: null, assignedAt: null },
        });
        unassigned.push({ ticketNumber: ticket.ticketNumber, title: ticket.title });
      }
    }

    await this.notifyPromotedUser({ promotedUserId, promotedUserFullName, promotedUserEmail, newRole, reassigned, unassigned, performedById });

    return { reassigned, unassigned };
  },

  async notifyPromotedUser(params: {
    promotedUserId: string;
    promotedUserFullName: string;
    promotedUserEmail: string;
    newRole: UserRole;
    reassigned: (TicketRef & { newAssigneeName: string })[];
    unassigned: TicketRef[];
    performedById: string;
  }) {
    const { promotedUserId, promotedUserFullName, promotedUserEmail, newRole, reassigned, unassigned, performedById } = params;

    const lines: string[] = [];
    if (reassigned.length > 0) {
      lines.push(
        `${reassigned.length} ticket(s) that were assigned to you have been auto-assigned to other agents in your former department: ` +
          reassigned.map((t) => `${t.ticketNumber} -> ${t.newAssigneeName}`).join(", ")
      );
    }
    if (unassigned.length > 0) {
      lines.push(
        `${unassigned.length} ticket(s) that were assigned to you have been left unassigned since there are no agents left in your former department to pick them up: ` +
          unassigned.map((t) => t.ticketNumber).join(", ")
      );
    }
    const message = `You've been promoted to ${newRole}. ${lines.join(" ")}`;

    // In-app notification (surfaced the same way requester notifications are).
    await prisma.adminMessage.create({
      data: {
        userId: promotedUserId,
        fromAdminId: performedById,
        message,
      },
    });

    // Email breakdown.
    await sendMail({
      to: promotedUserEmail,
      subject: `Your role has changed to ${newRole} - ticket handover summary`,
      html: layout(`You're now a ${newRole}`, `
        <p>Hi ${promotedUserFullName},</p>
        <p>Your role has been changed to <b>${newRole}</b>. You no longer work tickets directly, so here's what happened to the tickets that were assigned to you:</p>
        ${reassigned.length > 0 ? `<p><b>Auto-assigned to other agents:</b></p>${ticketList(reassigned.map((t) => ({ ticketNumber: t.ticketNumber, title: `${t.title} (now with ${t.newAssigneeName})` })))}` : ""}
        ${unassigned.length > 0 ? `<p><b>Left unassigned (no agents available in the department):</b></p>${ticketList(unassigned)}` : ""}
      `),
    });
  },
};
