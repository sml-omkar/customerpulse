"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryReassignmentService = void 0;
const database_1 = require("../lib/database");
const client_1 = require("../generated/prisma/client");
const assignment_service_1 = require("./assignment.service");
const mailer_1 = require("../lib/mailer");
const OPEN_STATUSES = [
    client_1.TicketStatus.OPEN,
    client_1.TicketStatus.IN_PROGRESS,
    client_1.TicketStatus.ON_HOLD,
    client_1.TicketStatus.REOPENED,
];
function layout(title, bodyHtml) {
    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h2 style="color:#111827">${title}</h2>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="font-size:12px;color:#9ca3af">This is an automated message from the Helpdesk system.</p>
    </div>
  `;
}
function ticketList(tickets) {
    return `<ul>${tickets.map((t) => `<li><b>${t.ticketNumber}</b> - ${t.title}</li>`).join("")}</ul>`;
}
exports.categoryReassignmentService = {
    async handleCategoryUnassignment(params) {
        const { categoryId, categoryName, departmentId, agentId, agentFullName, agentEmail, performedById } = params;
        const openTickets = await database_1.prisma.ticket.findMany({
            where: { categoryId, assigneeId: agentId, status: { in: OPEN_STATUSES } },
            select: { id: true, ticketNumber: true, title: true },
        });
        if (openTickets.length === 0)
            return null;
        const reassigned = [];
        const unassigned = [];
        for (const ticket of openTickets) {
            const best = await assignment_service_1.assignmentService.findBestAgent(ticket.id, { excludeAgentId: agentId });
            if (best) {
                await assignment_service_1.assignmentService.autoAssign(ticket.id, performedById, { excludeAgentId: agentId });
                reassigned.push({ ticketNumber: ticket.ticketNumber, title: ticket.title, newAssigneeName: best.agent.fullName });
            }
            else {
                await database_1.prisma.ticket.update({
                    where: { id: ticket.id },
                    data: { assigneeId: null, assignedById: null, assignmentMethod: null, assignedAt: null },
                });
                unassigned.push({ ticketNumber: ticket.ticketNumber, title: ticket.title });
            }
        }
        const summary = { reassigned, unassigned };
        await this.notifyAgent({ agentId, agentFullName, agentEmail, categoryName, summary, performedById });
        await this.notifyDepartmentHod({ departmentId, categoryName, agentFullName, summary, performedById });
        return summary;
    },
    async handleCategoryAssignmentBackfill(params) {
        const { categoryId, performedById } = params;
        const unassignedTickets = await database_1.prisma.ticket.findMany({
            where: { categoryId, assigneeId: null, status: { in: [client_1.TicketStatus.OPEN, client_1.TicketStatus.REOPENED] } },
            select: { id: true },
        });
        let pickedUp = 0;
        for (const ticket of unassignedTickets) {
            const result = await assignment_service_1.assignmentService.autoAssign(ticket.id, performedById);
            if (result)
                pickedUp += 1;
        }
        return pickedUp;
    },
    async notifyAgent(params) {
        const { agentId, agentFullName, agentEmail, categoryName, summary, performedById } = params;
        const { reassigned, unassigned } = summary;
        const lines = [];
        if (reassigned.length > 0) {
            lines.push(`${reassigned.length} ticket(s) of yours in "${categoryName}" have been auto-assigned to other agents: ` +
                reassigned.map((t) => `${t.ticketNumber} -> ${t.newAssigneeName}`).join(", "));
        }
        if (unassigned.length > 0) {
            lines.push(`${unassigned.length} ticket(s) of yours in "${categoryName}" have been left unassigned since no other agent is available for that category: ` +
                unassigned.map((t) => t.ticketNumber).join(", "));
        }
        const message = `You've been unassigned from the "${categoryName}" category. ${lines.join(" ")}`;
        await database_1.prisma.adminMessage.create({
            data: { userId: agentId, fromAdminId: performedById, message },
        });
        await (0, mailer_1.sendMail)({
            to: agentEmail,
            subject: `You've been unassigned from "${categoryName}" - ticket handover summary`,
            html: layout(`Removed from ${categoryName}`, `
        <p>Hi ${agentFullName},</p>
        <p>You've been unassigned from the <b>${categoryName}</b> category. Here's what happened to your open tickets in that category:</p>
        ${reassigned.length > 0
                ? `<p><b>Auto-assigned to other agents:</b></p>${ticketList(reassigned.map((t) => ({ ticketNumber: t.ticketNumber, title: `${t.title} (now with ${t.newAssigneeName})` })))}`
                : ""}
        ${unassigned.length > 0 ? `<p><b>Left unassigned (no other agent available for this category):</b></p>${ticketList(unassigned)}` : ""}
      `),
        });
    },
    async notifyDepartmentHod(params) {
        const { departmentId, categoryName, agentFullName, summary, performedById } = params;
        const { reassigned, unassigned } = summary;
        const department = await database_1.prisma.department.findUnique({
            where: { id: departmentId },
            include: { manager: { select: { id: true, fullName: true, email: true } } },
        });
        if (!department || !department.manager)
            return;
        const hod = department.manager;
        const lines = [];
        if (reassigned.length > 0) {
            lines.push(`${reassigned.length} ticket(s) previously assigned to ${agentFullName} in "${categoryName}" have been auto-assigned to other agents in ${department.name}: ` +
                reassigned.map((t) => `${t.ticketNumber} -> ${t.newAssigneeName}`).join(", "));
        }
        if (unassigned.length > 0) {
            lines.push(`${unassigned.length} ticket(s) previously assigned to ${agentFullName} in "${categoryName}" could not be auto-assigned and are now sitting unassigned: ` +
                unassigned.map((t) => t.ticketNumber).join(", "));
        }
        const message = `${agentFullName} was unassigned from "${categoryName}". ${lines.join(" ")}`;
        await database_1.prisma.adminMessage.create({
            data: { userId: hod.id, fromAdminId: performedById, message },
        });
        await (0, mailer_1.sendMail)({
            to: hod.email,
            subject: unassigned.length > 0
                ? `[${department.name}] Action needed: ${unassigned.length} ticket(s) left unassigned after "${categoryName}" reassignment`
                : `[${department.name}] Tickets auto-reassigned after "${categoryName}" reassignment`,
            html: layout(`Category reassignment in ${department.name}`, `
        <p>Hi ${hod.fullName},</p>
        <p>${agentFullName} was unassigned from the <b>${categoryName}</b> category, so their open tickets in it have been redistributed. Here's the breakdown:</p>
        ${reassigned.length > 0
                ? `<p><b>Auto-assigned to other agents:</b></p>${ticketList(reassigned.map((t) => ({ ticketNumber: t.ticketNumber, title: `${t.title} (now with ${t.newAssigneeName})` })))}`
                : ""}
        ${unassigned.length > 0
                ? `<p><b>Left unassigned - no other agent is available for "${categoryName}" in ${department.name}:</b></p>${ticketList(unassigned)}<p>These will need a manual assignment, or another agent linked to this category.</p>`
                : ""}
      `),
        });
    },
};
//# sourceMappingURL=categoryReassignment.service.js.map