import { sendMail } from "../lib/mailer";
import type { Ticket, User, TicketEscalation, AdminTicket } from "../generated/prisma/client";

import {config} from "dotenv"
config()


function layout(title: string, bodyHtml: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
      <h2 style="color:#111827">${title}</h2>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="font-size:12px;color:#9ca3af">This is an automated message from the customer pules application.</p>
    </div>
  `;
}

export const notificationService = {
  async sendPasswordResetOtp(email: string, otp: string) {
    await sendMail({
      to: email,
      subject: `Your password reset code`,
      html: layout("Reset your password", `
        <p>We received a request to reset the password for this account.</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:16px 0">${otp}</p>
        <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      `),
    });
  },

  async sendInvitation(email: string, token: string, role: string,password:string) {
    const link = `https://customerpulse.sanghvimovers.com?token=${token}`;
    await sendMail({
      to: email,
      subject: `You've been invited to join Sanghvi`,
      html: layout("You're invited", `
        <p>You have been invited to join <b>Sanghvi</b> as <b>${role}</b>.</p>
        <p>You're password is pre set as ${password}</p>
        <p><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Accept Invitation</a></p>
        <p>This link expires in 7 days.</p>
      `),
    });
  },

  async sendTicketCreated(ticket: Ticket, requester: User) {
    await sendMail({
      to: requester.email,
      subject: `[${ticket.ticketNumber}] Ticket received: ${ticket.title}`,
      html: layout("Ticket received", `
        <p>Hi ${requester.fullName},</p>
        <p>We've logged your ticket <b>${ticket.ticketNumber}</b> - "${ticket.title}".</p>
        <p>Priority: <b>${ticket.priority}</b></p>
        <p>We'll notify you as it progresses.</p>
      `),
    });
  },

  async sendTicketAssigned(ticket: Ticket, assignee: User) {
    await sendMail({
      to: assignee.email,
      subject: `[${ticket.ticketNumber}] New ticket assigned to you: ${ticket.title}`,
      html: layout("New assignment", `
        <p>Hi ${assignee.fullName},</p>
        <p>Ticket <b>${ticket.ticketNumber}</b> - "${ticket.title}" </p>
        ${ticket.slaDeadline ? `<p>SLA deadline: <b>${ticket.slaDeadline.toISOString()}</b></p>` : ""}
        
      `),
    });
  },

  async sendTicketEscalated(ticket: Ticket, escalation: TicketEscalation, cxo: {fullName: string,email:string}) {
    // send this to the cxo

    console.log(cxo.email)
    await sendMail({
      to: cxo.email,
      subject: `[${ticket.ticketNumber}] has been escalated.`,
      html: layout(`Ticket ${ticket.id} has been escalated`, `
        <p>Hi ${cxo.fullName},</p>
        <p>Ticket <b>${ticket.ticketNumber}</b> has been escalated.</p>
        <p>Reason: ${escalation.reason}</p>
      `),
    });
  },

  async sendSlaBreachWarning(ticket: Ticket, managerorcxoDetails: {email: string,departmentName: string,assigneeName: string}) {
    await sendMail({
      to: managerorcxoDetails.email,
      subject: `⚠ SLA breach: [${ticket.ticketNumber}] ${ticket.title}`,
      html: layout("SLA breached", `
        <p>Ticket <b>${ticket.ticketNumber}</b> under the department <b>${managerorcxoDetails.departmentName}</b> has breached its SLA deadline (${ticket.slaDeadline?.toISOString()}).</p>
        <p>This ticket is currently assigned to ${managerorcxoDetails.assigneeName}</p>
      `),
    });
  },

  async sendCommentAdded(ticket: Ticket, recipient: User, commenter: User, commentText: string) {
    await sendMail({
      to: recipient.email,
      subject: `[${ticket.ticketNumber}] New comment: ${ticket.title}`,
      html: layout("New comment added", `
        <p>Hi ${recipient.fullName},</p>
        <p>${commenter.fullName} added a new comment on ticket <b>${ticket.ticketNumber}</b> - "${ticket.title}".</p>
        <blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #e5e7eb;color:#374151">${commentText}</blockquote>
       
      `),
    });
  },

  async sendTicketResolved(ticket: Ticket, requester: User) {
    await sendMail({
      to: requester.email,
      subject: `[${ticket.ticketNumber}] Resolved: ${ticket.title}`,
      html: layout("Your ticket was resolved", `
        <p>Hi ${requester.fullName},</p>
        <p>Ticket <b>${ticket.ticketNumber}</b> has been marked resolved. Reply if you need it reopened.</p>
      `),
    });
  },

  // NOTE(added): fired once per GLOBAL_ADMIN when a HOD/CXO/AGENT raises
  // an AdminTicket - call once per admin recipient (mirrors sendTicketAssigned's
  // one-recipient-per-call shape).
  async sendAdminTicketRaised(adminTicket: AdminTicket, raisedBy: { fullName: string; role: string }, admin: User) {
    await sendMail({
      to: admin.email,
      subject: `[${adminTicket.ticketNumber}] New request from ${raisedBy.fullName}: ${adminTicket.subject}`,
      html: layout("New request raised to admin", `
        <p>Hi ${admin.fullName},</p>
        <p>${raisedBy.fullName} (${raisedBy.role}) raised a new request <b>${adminTicket.ticketNumber}</b> - "${adminTicket.subject}".</p>
        <blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #e5e7eb;color:#374151">${adminTicket.description}</blockquote>
      `),
    });
  },

  async sendAdminTicketResolved(adminTicket: AdminTicket, raisedBy: { fullName: string; email: string }) {
    await sendMail({
      to: raisedBy.email,
      subject: `[${adminTicket.ticketNumber}] Update on your request: ${adminTicket.subject}`,
      html: layout("Your request has an update", `
        <p>Hi ${raisedBy.fullName},</p>
        <p>Your request <b>${adminTicket.ticketNumber}</b> - "${adminTicket.subject}" is now marked <b>${adminTicket.status}</b>.</p>
        ${adminTicket.adminResponse ? `<blockquote style="margin:12px 0;padding:8px 12px;border-left:3px solid #e5e7eb;color:#374151">${adminTicket.adminResponse}</blockquote>` : ""}
      `),
    });
  },

  async sendTicketReopened(ticket: Ticket, assignee: User) {
    await sendMail({
      to: assignee.email,
      subject: `[${ticket.ticketNumber}] Ticket reopened: ${ticket.title}`,
      html: layout("Ticket reopened", `
        <p>Hi ${assignee.fullName},</p>
        <p>Ticket <b>${ticket.ticketNumber}</b> - "${ticket.title}" has been reopened and is back on your queue.</p>
        ${ticket.slaDeadline ? `<p>SLA deadline: <b>${ticket.slaDeadline.toISOString()}</b></p>` : ""}
      `),
    });
  },
};
