import { prisma } from "../lib/database";
import { TicketStatus } from "../generated/prisma/client";
import { assignmentService } from "./assignment.service";
import { sendMail } from "../lib/mailer";

// Same "still being worked" set used elsewhere - a RESOLVED ticket doesn't
// need reassignment.
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

export interface CategoryUnassignmentSummary {
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

export const categoryReassignmentService = {
  /**
   * Called from categoryAgentController.unassign, right after a
   * CategoryAgent link is deleted (an admin/HOD un-mapping an agent from a
   * category they can no longer be routed for). The agent may still work
   * plenty of *other* tickets, so this only touches tickets that are BOTH:
   *   - currently assigned to this agent, AND
   *   - in the category that was just taken away from them.
   *
   * For each such open ticket:
   *   - if another agent is still linked to this category in the
   *     department (or, failing that, the usual keyword/load-balance
   *     fallback finds someone else in the department), it's routed there
   *     exactly like a brand new ticket - the just-unlinked agent is
   *     explicitly excluded from the candidate pool so it can't just land
   *     right back on them via the fallback stages.
   *   - if nobody else is eligible, the ticket is unassigned rather than
   *     left on an agent who's no longer supposed to handle that category.
   *
   * Both the agent and the HOD of the category's department are notified
   * (in-app + email) with the full breakdown, same pattern as
   * roleChangeReassignment.service.ts.
   */
  async handleCategoryUnassignment(params: {
    categoryId: string;
    categoryName: string;
    departmentId: string;
    agentId: string;
    agentFullName: string;
    agentEmail: string;
    performedById: string;
  }): Promise<CategoryUnassignmentSummary | null> {
    const { categoryId, categoryName, departmentId, agentId, agentFullName, agentEmail, performedById } = params;

    const openTickets = await prisma.ticket.findMany({
      where: { categoryId, assigneeId: agentId, status: { in: OPEN_STATUSES } },
      select: { id: true, ticketNumber: true, title: true },
    });

    if (openTickets.length === 0) return null;

    const reassigned: (TicketRef & { newAssigneeName: string })[] = [];
    const unassigned: TicketRef[] = [];

    for (const ticket of openTickets) {
      // excludeAgentId guarantees the agent we just unlinked can't be
      // re-picked by the keyword/load-balance fallback stages, which don't
      // otherwise know anything about the CategoryAgent link that was just
      // removed.
      const best = await assignmentService.findBestAgent(ticket.id, { excludeAgentId: agentId });

      if (best) {
        await assignmentService.autoAssign(ticket.id, performedById, { excludeAgentId: agentId });
        reassigned.push({ ticketNumber: ticket.ticketNumber, title: ticket.title, newAssigneeName: best.agent.fullName });
      } else {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { assigneeId: null, assignedById: null, assignmentMethod: null, assignedAt: null },
        });
        unassigned.push({ ticketNumber: ticket.ticketNumber, title: ticket.title });
      }
    }

    const summary: CategoryUnassignmentSummary = { reassigned, unassigned };

    await this.notifyAgent({ agentId, agentFullName, agentEmail, categoryName, summary, performedById });
    await this.notifyDepartmentHod({ departmentId, categoryName, agentFullName, summary, performedById });

    return summary;
  },

  /**
   * Called from categoryAgentController.assign, right after a new
   * CategoryAgent link is created. Opportunistic backfill in the other
   * direction: any ticket in this category that's currently sitting
   * unassigned (nobody was eligible before) gets a fresh shot at
   * auto-assignment now that a new agent is available for it. Tickets that
   * already have an assignee are left completely alone - this never steals
   * work from another agent, it only fills gaps.
   */
  async handleCategoryAssignmentBackfill(params: { categoryId: string; performedById: string }): Promise<number> {
    const { categoryId, performedById } = params;

    const unassignedTickets = await prisma.ticket.findMany({
      where: { categoryId, assigneeId: null, status: { in: [TicketStatus.OPEN, TicketStatus.REOPENED] } },
      select: { id: true },
    });

    let pickedUp = 0;
    for (const ticket of unassignedTickets) {
      // autoAssign already sends the "new ticket assigned to you" email to
      // whoever it lands on, so no extra notification needed here.
      const result = await assignmentService.autoAssign(ticket.id, performedById);
      if (result) pickedUp += 1;
    }
    return pickedUp;
  },

  async notifyAgent(params: {
    agentId: string;
    agentFullName: string;
    agentEmail: string;
    categoryName: string;
    summary: CategoryUnassignmentSummary;
    performedById: string;
  }) {
    const { agentId, agentFullName, agentEmail, categoryName, summary, performedById } = params;
    const { reassigned, unassigned } = summary;

    const lines: string[] = [];
    if (reassigned.length > 0) {
      lines.push(
        `${reassigned.length} ticket(s) of yours in "${categoryName}" have been auto-assigned to other agents: ` +
          reassigned.map((t) => `${t.ticketNumber} -> ${t.newAssigneeName}`).join(", ")
      );
    }
    if (unassigned.length > 0) {
      lines.push(
        `${unassigned.length} ticket(s) of yours in "${categoryName}" have been left unassigned since no other agent is available for that category: ` +
          unassigned.map((t) => t.ticketNumber).join(", ")
      );
    }
    const message = `You've been unassigned from the "${categoryName}" category. ${lines.join(" ")}`;

    await prisma.adminMessage.create({
      data: { userId: agentId, fromAdminId: performedById, message },
    });

    await sendMail({
      to: agentEmail,
      subject: `You've been unassigned from "${categoryName}" - ticket handover summary`,
      html: layout(
        `Removed from ${categoryName}`,
        `
        <p>Hi ${agentFullName},</p>
        <p>You've been unassigned from the <b>${categoryName}</b> category. Here's what happened to your open tickets in that category:</p>
        ${
          reassigned.length > 0
            ? `<p><b>Auto-assigned to other agents:</b></p>${ticketList(
                reassigned.map((t) => ({ ticketNumber: t.ticketNumber, title: `${t.title} (now with ${t.newAssigneeName})` }))
              )}`
            : ""
        }
        ${unassigned.length > 0 ? `<p><b>Left unassigned (no other agent available for this category):</b></p>${ticketList(unassigned)}` : ""}
      `
      ),
    });
  },

  async notifyDepartmentHod(params: {
    departmentId: string;
    categoryName: string;
    agentFullName: string;
    summary: CategoryUnassignmentSummary;
    performedById: string;
  }) {
    const { departmentId, categoryName, agentFullName, summary, performedById } = params;
    const { reassigned, unassigned } = summary;

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: { manager: { select: { id: true, fullName: true, email: true } } },
    });

    if (!department || !department.manager) return; // no HOD to notify

    const hod = department.manager;

    const lines: string[] = [];
    if (reassigned.length > 0) {
      lines.push(
        `${reassigned.length} ticket(s) previously assigned to ${agentFullName} in "${categoryName}" have been auto-assigned to other agents in ${department.name}: ` +
          reassigned.map((t) => `${t.ticketNumber} -> ${t.newAssigneeName}`).join(", ")
      );
    }
    if (unassigned.length > 0) {
      lines.push(
        `${unassigned.length} ticket(s) previously assigned to ${agentFullName} in "${categoryName}" could not be auto-assigned and are now sitting unassigned: ` +
          unassigned.map((t) => t.ticketNumber).join(", ")
      );
    }
    const message = `${agentFullName} was unassigned from "${categoryName}". ${lines.join(" ")}`;

    await prisma.adminMessage.create({
      data: { userId: hod.id, fromAdminId: performedById, message },
    });

    await sendMail({
      to: hod.email,
      subject:
        unassigned.length > 0
          ? `[${department.name}] Action needed: ${unassigned.length} ticket(s) left unassigned after "${categoryName}" reassignment`
          : `[${department.name}] Tickets auto-reassigned after "${categoryName}" reassignment`,
      html: layout(
        `Category reassignment in ${department.name}`,
        `
        <p>Hi ${hod.fullName},</p>
        <p>${agentFullName} was unassigned from the <b>${categoryName}</b> category, so their open tickets in it have been redistributed. Here's the breakdown:</p>
        ${
          reassigned.length > 0
            ? `<p><b>Auto-assigned to other agents:</b></p>${ticketList(
                reassigned.map((t) => ({ ticketNumber: t.ticketNumber, title: `${t.title} (now with ${t.newAssigneeName})` }))
              )}`
            : ""
        }
        ${
          unassigned.length > 0
            ? `<p><b>Left unassigned - no other agent is available for "${categoryName}" in ${department.name}:</b></p>${ticketList(unassigned)}<p>These will need a manual assignment, or another agent linked to this category.</p>`
            : ""
        }
      `
      ),
    });
  },
};
