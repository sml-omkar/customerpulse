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

export type ReassignmentReason = "ROLE_CHANGE" | "DEPARTMENT_TRANSFER" | "ACCOUNT_DELETED";

export interface TicketReassignmentSummary {
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
   * Called from userController.update, right after a GLOBAL_ADMIN commits
   * either of the two changes that can strand an agent's open tickets:
   *
   *   1. ROLE_CHANGE        - the user's role is flipped away from AGENT
   *                           (promoted to HOD/CXO, demoted to REQUESTER,
   *                           made a GLOBAL_ADMIN, etc). They stop working
   *                           tickets in `oldDepartmentId` entirely.
   *   2. DEPARTMENT_TRANSFER - the user stays an AGENT, but is moved out of
   *                           `oldDepartmentId` into a different department
   *                           (or off any department). They stop working
   *                           tickets that belong to their *old* department,
   *                           even though they still work tickets elsewhere.
   *
   * In both cases every ticket still open in the user's queue that belongs
   * to `oldDepartmentId` has to go somewhere:
   *
   *   - if `oldDepartmentId` still has other active agents, each ticket is
   *     routed through the normal auto-assignment logic (category match ->
   *     keyword match -> load balance) exactly like a brand new ticket, and
   *     taken off the moved user's queue.
   *   - if there are no other agents left in that department, the ticket is
   *     simply unassigned rather than left stuck on someone who can no
   *     longer act on it.
   *
   * Two parties are notified (in-app + email) with the full breakdown:
   *   - the moved/promoted user themselves, since these were their tickets
   *     a moment ago.
   *   - the HOD of `oldDepartmentId` (Department.managerId), since they now
   *     own the outcome for that department's queue - which tickets got
   *     auto-assigned to whom, and which ones are sitting unassigned and
   *     need attention. If the department currently has no HOD, this step
   *     is skipped (there's nobody to notify).
   *
   * IMPORTANT: this must run *after* the role/department change has already
   * been committed to the DB, so the moved user's own row no longer reports
   * role AGENT / agentsdepartmentId = oldDepartmentId, and is naturally
   * excluded from the auto-assignment candidate pool. As a second safety
   * net, the "other agents" query below also explicitly excludes them by id.
   */
  async handleAgentTicketReassignment(params: {
    movedUserId: string;
    movedUserFullName: string;
    movedUserEmail: string;
    oldDepartmentId: string | null;
    reason: ReassignmentReason;
    newRole: UserRole;
    newDepartmentId?: string | null;
    performedById: string;
  }): Promise<TicketReassignmentSummary | null> {
    const {
      movedUserId,
      movedUserFullName,
      movedUserEmail,
      oldDepartmentId,
      reason,
      newRole,
      newDepartmentId = null,
      performedById,
    } = params;

    if (!oldDepartmentId) return null;

    const openTickets = await prisma.ticket.findMany({
      where: { assigneeId: movedUserId, status: { in: OPEN_STATUSES } },
      select: { id: true, ticketNumber: true, title: true },
    });

    if (openTickets.length === 0) return null;

    const otherAgentCount = await prisma.user.count({
      where: {
        role: UserRole.AGENT,
        isActive: true,
        agentsdepartmentId: oldDepartmentId,
        id: { not: movedUserId },
      },
    });

    const reassigned: (TicketRef & { newAssigneeName: string })[] = [];
    const unassigned: TicketRef[] = [];

    for (const ticket of openTickets) {
      let handled = false;

      if (otherAgentCount > 0) {
        // findBestAgent only ever considers AGENT-role users in the
        // ticket's own department, and by this point the moved user's role
        // and/or agentsdepartmentId has already changed in the DB, so they
        // can't be picked again here. excludeAgentId is passed anyway as a
        // second safety net.
        const best = await assignmentService.findBestAgent(ticket.id, { excludeAgentId: movedUserId });
        if (best) {
          await assignmentService.autoAssign(ticket.id, performedById, { excludeAgentId: movedUserId });
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

    const summary: TicketReassignmentSummary = { reassigned, unassigned };

    await this.notifyMovedUser({
      movedUserId,
      movedUserFullName,
      movedUserEmail,
      reason,
      newRole,
      newDepartmentId,
      summary,
      performedById,
    });

    await this.notifyDepartmentHod({
      oldDepartmentId,
      movedUserFullName,
      reason,
      newRole,
      newDepartmentId,
      summary,
      performedById,
    });

    return summary;
  },

  async notifyMovedUser(params: {
    movedUserId: string;
    movedUserFullName: string;
    movedUserEmail: string;
    reason: ReassignmentReason;
    newRole: UserRole;
    newDepartmentId: string | null;
    summary: TicketReassignmentSummary;
    performedById: string;
  }) {
    const { movedUserId, movedUserFullName, movedUserEmail, reason, newRole, summary, performedById } = params;
    const { reassigned, unassigned } = summary;

    const changeDescription =
      reason === "ROLE_CHANGE"
        ? `your role has been changed to ${newRole}`
        : reason === "DEPARTMENT_TRANSFER"
        ? `you've been moved to a different department`
        : `your account has been deleted`;

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
    const message = `Since ${changeDescription}, here's what happened to your former tickets. ${lines.join(" ")}`;

    // In-app notification (surfaced the same way requester notifications are).
    // Skipped for ACCOUNT_DELETED - the account is deleted, there's no
    // notifications panel left for them to see it in; the email below is
    // the only record this person gets.
    if (reason !== "ACCOUNT_DELETED") {
      await prisma.adminMessage.create({
        data: {
          userId: movedUserId,
          fromAdminId: performedById,
          message,
        },
      });
    }

    // Email breakdown.
    await sendMail({
      to: movedUserEmail,
      subject:
        reason === "ROLE_CHANGE"
          ? `Your role has changed to ${newRole} - ticket handover summary`
          : reason === "DEPARTMENT_TRANSFER"
          ? `You've been moved to a new department - ticket handover summary`
          : `Your account has been deleted - ticket handover summary`,
      html: layout(
        reason === "ROLE_CHANGE"
          ? `You're now a ${newRole}`
          : reason === "DEPARTMENT_TRANSFER"
          ? `You've changed departments`
          : `Your account has been deleted`,
        `
        <p>Hi ${movedUserFullName},</p>
        <p>Since ${changeDescription}, you no longer work the tickets in your former department directly. Here's what happened to the tickets that were assigned to you:</p>
        ${
          reassigned.length > 0
            ? `<p><b>Auto-assigned to other agents:</b></p>${ticketList(
                reassigned.map((t) => ({ ticketNumber: t.ticketNumber, title: `${t.title} (now with ${t.newAssigneeName})` }))
              )}`
            : ""
        }
        ${unassigned.length > 0 ? `<p><b>Left unassigned (no agents available in the department):</b></p>${ticketList(unassigned)}` : ""}
      `
      ),
    });
  },

  /**
   * Notifies the HOD (Department.managerId) of the department the tickets
   * were redistributed *out of* - not the user's new department, if any.
   * Skips silently if that department currently has no HOD assigned.
   */
  async notifyDepartmentHod(params: {
    oldDepartmentId: string;
    movedUserFullName: string;
    reason: ReassignmentReason;
    newRole: UserRole;
    newDepartmentId: string | null;
    summary: TicketReassignmentSummary;
    performedById: string;
  }) {
    const { oldDepartmentId, movedUserFullName, reason, newRole, summary, performedById } = params;
    const { reassigned, unassigned } = summary;

    const department = await prisma.department.findUnique({
      where: { id: oldDepartmentId },
      include: { manager: { select: { id: true, fullName: true, email: true } } },
    });

    if (!department || !department.manager) return; // no HOD to notify

    const hod = department.manager;

    const changeDescription =
      reason === "ROLE_CHANGE"
        ? `${movedUserFullName}'s role was changed to ${newRole}`
        : reason === "DEPARTMENT_TRANSFER"
        ? `${movedUserFullName} was moved out of ${department.name}`
        : `${movedUserFullName}'s account was deleted`;

    const lines: string[] = [];
    if (reassigned.length > 0) {
      lines.push(
        `${reassigned.length} ticket(s) previously assigned to ${movedUserFullName} have been auto-assigned to other agents in ${department.name}: ` +
          reassigned.map((t) => `${t.ticketNumber} -> ${t.newAssigneeName}`).join(", ")
      );
    }
    if (unassigned.length > 0) {
      lines.push(
        `${unassigned.length} ticket(s) previously assigned to ${movedUserFullName} could not be auto-assigned since ${department.name} has no other agents available, and are now sitting unassigned: ` +
          unassigned.map((t) => t.ticketNumber).join(", ")
      );
    }
    const message = `${changeDescription}. ${lines.join(" ")}`;

    // In-app notification for the HOD.
    await prisma.adminMessage.create({
      data: {
        userId: hod.id,
        fromAdminId: performedById,
        message,
      },
    });

    const reasonLabel =
      reason === "ROLE_CHANGE" ? "role change" : reason === "DEPARTMENT_TRANSFER" ? "department transfer" : "account deletion";

    // Email breakdown.
    await sendMail({
      to: hod.email,
      subject:
        unassigned.length > 0
          ? `[${department.name}] Action needed: ${unassigned.length} ticket(s) left unassigned after ${movedUserFullName}'s ${reasonLabel}`
          : `[${department.name}] Tickets auto-reassigned after ${movedUserFullName}'s ${reasonLabel}`,
      html: layout(
        `Ticket redistribution in ${department.name}`,
        `
        <p>Hi ${hod.fullName},</p>
        <p>${changeDescription}, so their open tickets in <b>${department.name}</b> have been redistributed. Here's the breakdown:</p>
        ${
          reassigned.length > 0
            ? `<p><b>Auto-assigned to other agents in ${department.name}:</b></p>${ticketList(
                reassigned.map((t) => ({ ticketNumber: t.ticketNumber, title: `${t.title} (now with ${t.newAssigneeName})` }))
              )}`
            : ""
        }
        ${
          unassigned.length > 0
            ? `<p><b>Left unassigned - ${department.name} currently has no other agents available:</b></p>${ticketList(unassigned)}<p>These will need a manual assignment, or another agent added to the department.</p>`
            : ""
        }
      `
      ),
    });
  },
};
