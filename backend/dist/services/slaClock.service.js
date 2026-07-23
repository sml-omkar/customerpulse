"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeSlaClockUpdate = computeSlaClockUpdate;
exports.computeAgentTurnOverTimeSeconds = computeAgentTurnOverTimeSeconds;
exports.computeTicketTurnOverTimeSeconds = computeTicketTurnOverTimeSeconds;
const client_1 = require("../generated/prisma/client");
const time_1 = require("../utils/time");
const SLA_PAUSED_STATUSES = [client_1.TicketStatus.ON_HOLD, client_1.TicketStatus.RESOLVED];
const AGENT_TAT_PAUSED_STATUSES = [client_1.TicketStatus.ON_HOLD, client_1.TicketStatus.RESOLVED];
const TICKET_TAT_PAUSED_STATUSES = [client_1.TicketStatus.RESOLVED];
function pauseWindowUpdate(wasPaused, willBePaused, startedAt, totalMinutes, now) {
    if (wasPaused && !willBePaused) {
        const pausedMinutes = startedAt ? (0, time_1.diffInMinutes)(startedAt, now) : 0;
        return { startedAt: null, totalMinutes: totalMinutes + pausedMinutes };
    }
    if (!wasPaused && willBePaused) {
        return { startedAt: now, totalMinutes };
    }
    return null;
}
function computeSlaClockUpdate(previous, nextStatus, now = new Date()) {
    const data = {};
    const wasSlaPaused = SLA_PAUSED_STATUSES.includes(previous.status);
    const willBeSlaPaused = SLA_PAUSED_STATUSES.includes(nextStatus);
    if (!wasSlaPaused && willBeSlaPaused) {
        data.slaRemainingMinutes = previous.slaDeadline ? (0, time_1.diffInMinutes)(now, previous.slaDeadline) : null;
        data.slaDeadline = null;
    }
    else if (wasSlaPaused && !willBeSlaPaused) {
        data.slaDeadline = previous.slaRemainingMinutes != null ? (0, time_1.addMinutes)(now, previous.slaRemainingMinutes) : previous.slaDeadline;
        data.slaRemainingMinutes = null;
    }
    const wasAgentPaused = AGENT_TAT_PAUSED_STATUSES.includes(previous.status);
    const willBeAgentPaused = AGENT_TAT_PAUSED_STATUSES.includes(nextStatus);
    const agentWindow = pauseWindowUpdate(wasAgentPaused, willBeAgentPaused, previous.holdStartedAt, previous.totalHoldMinutes, now);
    if (agentWindow) {
        data.holdStartedAt = agentWindow.startedAt;
        data.totalHoldMinutes = agentWindow.totalMinutes;
    }
    const wasTicketPaused = TICKET_TAT_PAUSED_STATUSES.includes(previous.status);
    const willBeTicketPaused = TICKET_TAT_PAUSED_STATUSES.includes(nextStatus);
    const ticketWindow = pauseWindowUpdate(wasTicketPaused, willBeTicketPaused, previous.resolvedStartedAt, previous.totalResolvedMinutes, now);
    if (ticketWindow) {
        data.resolvedStartedAt = ticketWindow.startedAt;
        data.totalResolvedMinutes = ticketWindow.totalMinutes;
    }
    return data;
}
function computeAgentTurnOverTimeSeconds(ticket, now = new Date()) {
    const ongoingPausedMinutes = AGENT_TAT_PAUSED_STATUSES.includes(ticket.status) && ticket.holdStartedAt ? (0, time_1.diffInMinutes)(ticket.holdStartedAt, now) : 0;
    const totalPausedSeconds = (ticket.totalHoldMinutes + ongoingPausedMinutes) * 60;
    return Math.max(0, (0, time_1.diffInSeconds)(ticket.dateOfOccurance, now) - totalPausedSeconds);
}
function computeTicketTurnOverTimeSeconds(ticket, now = new Date()) {
    const ongoingPausedMinutes = TICKET_TAT_PAUSED_STATUSES.includes(ticket.status) && ticket.resolvedStartedAt ? (0, time_1.diffInMinutes)(ticket.resolvedStartedAt, now) : 0;
    const totalPausedSeconds = (ticket.totalResolvedMinutes + ongoingPausedMinutes) * 60;
    return Math.max(0, (0, time_1.diffInSeconds)(ticket.dateOfOccurance, now) - totalPausedSeconds);
}
//# sourceMappingURL=slaClock.service.js.map