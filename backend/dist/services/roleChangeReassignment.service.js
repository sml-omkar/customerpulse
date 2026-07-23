"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleChangeReassignmentService = void 0;
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
exports.roleChangeReassignmentService = {
    async handleAgentTicketReassignment(params) {
        const { movedUserId, movedUserFullName, movedUserEmail, oldDepartmentId, reason, newRole, newDepartmentId = null, performedById, } = params;
        if (!oldDepartmentId)
            return null;
        const openTickets = await database_1.prisma.ticket.findMany({
            where: { assigneeId: movedUserId, status: { in: OPEN_STATUSES } },
            select: { id: true, ticketNumber: true, title: true },
        });
        if (openTickets.length === 0)
            return null;
        const otherAgentCount = await database_1.prisma.user.count({
            where: {
                role: client_1.UserRole.AGENT,
                isActive: true,
                agentsdepartmentId: oldDepartmentId,
                id: { not: movedUserId },
            },
        });
        const reassigned = [];
        const unassigned = [];
        for (const ticket of openTickets) {
            let handled = false;
            if (otherAgentCount > 0) {
                const best = await assignment_service_1.assignmentService.findBestAgent(ticket.id, { excludeAgentId: movedUserId });
                if (best) {
                    await assignment_service_1.assignmentService.autoAssign(ticket.id, performedById, { excludeAgentId: movedUserId });
                    reassigned.push({ ticketNumber: ticket.ticketNumber, title: ticket.title, newAssigneeName: best.agent.fullName });
                    handled = true;
                }
            }
            if (!handled) {
                await database_1.prisma.ticket.update({
                    where: { id: ticket.id },
                    data: { assigneeId: null, assignedById: null, assignmentMethod: null, assignedAt: null },
                });
                unassigned.push({ ticketNumber: ticket.ticketNumber, title: ticket.title });
            }
        }
        const summary = { reassigned, unassigned };
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
    async notifyMovedUser(params) {
        const { movedUserId, movedUserFullName, movedUserEmail, reason, newRole, summary, performedById } = params;
        const { reassigned, unassigned } = summary;
        const changeDescription = reason === "ROLE_CHANGE" ? `your role has been changed to ${newRole}` : `you've been moved to a different department`;
        const lines = [];
        if (reassigned.length > 0) {
            lines.push(`${reassigned.length} ticket(s) that were assigned to you have been auto-assigned to other agents in your former department: ` +
                reassigned.map((t) => `${t.ticketNumber} -> ${t.newAssigneeName}`).join(", "));
        }
        if (unassigned.length > 0) {
            lines.push(`${unassigned.length} ticket(s) that were assigned to you have been left unassigned since there are no agents left in your former department to pick them up: ` +
                unassigned.map((t) => t.ticketNumber).join(", "));
        }
        const message = `Since ${changeDescription}, here's what happened to your former tickets. ${lines.join(" ")}`;
        await database_1.prisma.adminMessage.create({
            data: {
                userId: movedUserId,
                fromAdminId: performedById,
                message,
            },
        });
        await (0, mailer_1.sendMail)({
            to: movedUserEmail,
            subject: reason === "ROLE_CHANGE"
                ? `Your role has changed to ${newRole} - ticket handover summary`
                : `You've been moved to a new department - ticket handover summary`,
            html: layout(reason === "ROLE_CHANGE" ? `You're now a ${newRole}` : `You've changed departments`, `
        <p>Hi ${movedUserFullName},</p>
        <p>Since ${changeDescription}, you no longer work the tickets in your former department directly. Here's what happened to the tickets that were assigned to you:</p>
        ${reassigned.length > 0
                ? `<p><b>Auto-assigned to other agents:</b></p>${ticketList(reassigned.map((t) => ({ ticketNumber: t.ticketNumber, title: `${t.title} (now with ${t.newAssigneeName})` })))}`
                : ""}
        ${unassigned.length > 0 ? `<p><b>Left unassigned (no agents available in the department):</b></p>${ticketList(unassigned)}` : ""}
      `),
        });
    },
    async notifyDepartmentHod(params) {
        const { oldDepartmentId, movedUserFullName, reason, newRole, summary, performedById } = params;
        const { reassigned, unassigned } = summary;
        const department = await database_1.prisma.department.findUnique({
            where: { id: oldDepartmentId },
            include: { manager: { select: { id: true, fullName: true, email: true } } },
        });
        if (!department || !department.manager)
            return;
        const hod = department.manager;
        const changeDescription = reason === "ROLE_CHANGE"
            ? `${movedUserFullName}'s role was changed to ${newRole}`
            : `${movedUserFullName} was moved out of ${department.name}`;
        const lines = [];
        if (reassigned.length > 0) {
            lines.push(`${reassigned.length} ticket(s) previously assigned to ${movedUserFullName} have been auto-assigned to other agents in ${department.name}: ` +
                reassigned.map((t) => `${t.ticketNumber} -> ${t.newAssigneeName}`).join(", "));
        }
        if (unassigned.length > 0) {
            lines.push(`${unassigned.length} ticket(s) previously assigned to ${movedUserFullName} could not be auto-assigned since ${department.name} has no other agents available, and are now sitting unassigned: ` +
                unassigned.map((t) => t.ticketNumber).join(", "));
        }
        const message = `${changeDescription}. ${lines.join(" ")}`;
        await database_1.prisma.adminMessage.create({
            data: {
                userId: hod.id,
                fromAdminId: performedById,
                message,
            },
        });
        await (0, mailer_1.sendMail)({
            to: hod.email,
            subject: unassigned.length > 0
                ? `[${department.name}] Action needed: ${unassigned.length} ticket(s) left unassigned after ${movedUserFullName}'s ${reason === "ROLE_CHANGE" ? "role change" : "department transfer"}`
                : `[${department.name}] Tickets auto-reassigned after ${movedUserFullName}'s ${reason === "ROLE_CHANGE" ? "role change" : "department transfer"}`,
            html: layout(`Ticket redistribution in ${department.name}`, `
        <p>Hi ${hod.fullName},</p>
        <p>${changeDescription}, so their open tickets in <b>${department.name}</b> have been redistributed. Here's the breakdown:</p>
        ${reassigned.length > 0
                ? `<p><b>Auto-assigned to other agents in ${department.name}:</b></p>${ticketList(reassigned.map((t) => ({ ticketNumber: t.ticketNumber, title: `${t.title} (now with ${t.newAssigneeName})` })))}`
                : ""}
        ${unassigned.length > 0
                ? `<p><b>Left unassigned - ${department.name} currently has no other agents available:</b></p>${ticketList(unassigned)}<p>These will need a manual assignment, or another agent added to the department.</p>`
                : ""}
      `),
        });
    },
};
//# sourceMappingURL=Rolechangereassignment.service.js.map