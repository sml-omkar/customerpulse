import { TicketStatus } from "../generated/prisma/client";
import { addMinutes, diffInMinutes, diffInSeconds } from "../utils/time";

// A ticket isn't "actively being worked" while ON_HOLD or RESOLVED (the
// latter may still get reopened). The SLA deadline pauses for this same
// set of statuses. While paused, the SLA deadline is cleared (so the sweep
// cron leaves it alone) and whatever time was left gets banked in
// slaRemainingMinutes; coming back to an active status resumes the
// deadline from that banked remainder instead of granting a fresh window.
const SLA_PAUSED_STATUSES: TicketStatus[] = [TicketStatus.ON_HOLD, TicketStatus.RESOLVED];

// Agent TAT (turnOverTime) pauses for the same set of statuses as the SLA
// deadline - it measures time an agent is actually able to work the
// ticket, so both being on hold and being resolved-but-maybe-reopened stop
// its clock. holdStartedAt marks when the current pause began and
// totalHoldMinutes accumulates completed pause windows.
const AGENT_TAT_PAUSED_STATUSES: TicketStatus[] = [TicketStatus.ON_HOLD, TicketStatus.RESOLVED];

// Ticket TAT (ticketTurnOverTime) is deliberately narrower: it keeps
// ticking through ON_HOLD (a hold doesn't stop the clock on the ticket
// itself, only on the agent working it) and only pauses once the ticket is
// actually RESOLVED, resuming from wherever it left off if reopened.
// resolvedStartedAt/totalResolvedMinutes track that RESOLVED-only window.
const TICKET_TAT_PAUSED_STATUSES: TicketStatus[] = [TicketStatus.RESOLVED];

export type TicketClockFields = {
  status: TicketStatus;
  createdAt: Date;
  dateOfOccurance: Date;
  slaDeadline: Date | null;
  slaRemainingMinutes: number | null;
  holdStartedAt: Date | null;
  totalHoldMinutes: number;
  resolvedStartedAt: Date | null;
  totalResolvedMinutes: number;
};

export type SlaClockUpdate = {
  slaDeadline?: Date | null;
  slaRemainingMinutes?: number | null;
  holdStartedAt?: Date | null;
  totalHoldMinutes?: number;
  resolvedStartedAt?: Date | null;
  totalResolvedMinutes?: number;
};

// Generic helper: given whether a pause-tracked window was/will-be active
// for some status boundary, returns the field updates needed to open,
// leave-running, or close that window. Used for both the Agent TAT window
// (holdStartedAt/totalHoldMinutes) and the Ticket TAT window
// (resolvedStartedAt/totalResolvedMinutes) below - they key off different
// status sets but the open/close mechanics are identical.
function pauseWindowUpdate(wasPaused: boolean, willBePaused: boolean, startedAt: Date | null, totalMinutes: number, now: Date) {
  if (wasPaused && !willBePaused) {
    const pausedMinutes = startedAt ? diffInMinutes(startedAt, now) : 0;
    return { startedAt: null as Date | null, totalMinutes: totalMinutes + pausedMinutes };
  }
  if (!wasPaused && willBePaused) {
    return { startedAt: now, totalMinutes };
  }
  // Both paused (window stays open, untouched) or both active (nothing to do).
  return null;
}

/**
 * Given a ticket's current clock state and the status it's moving to,
 * returns the fields that need updating on the Ticket row: the SLA
 * deadline pause/resume, the Agent TAT pause window, and the Ticket TAT
 * pause window. All three key off status boundary crossings, but each
 * against its own set of "paused" statuses.
 */
export function computeSlaClockUpdate(
  previous: Pick<TicketClockFields, "status" | "slaDeadline" | "slaRemainingMinutes" | "holdStartedAt" | "totalHoldMinutes" | "resolvedStartedAt" | "totalResolvedMinutes">,
  nextStatus: TicketStatus,
  now: Date = new Date()
): SlaClockUpdate {
  const data: SlaClockUpdate = {};

  // --- SLA deadline pause/resume (ON_HOLD or RESOLVED) ---
  const wasSlaPaused = SLA_PAUSED_STATUSES.includes(previous.status);
  const willBeSlaPaused = SLA_PAUSED_STATUSES.includes(nextStatus);

  if (!wasSlaPaused && willBeSlaPaused) {
    // Entering ON_HOLD or RESOLVED: bank whatever SLA time is left (0 if
    // it had already breached) and stop the deadline from being checked.
    data.slaRemainingMinutes = previous.slaDeadline ? diffInMinutes(now, previous.slaDeadline) : null;
    data.slaDeadline = null;
  } else if (wasSlaPaused && !willBeSlaPaused) {
    // Leaving ON_HOLD, or reopening a RESOLVED ticket: resume from the
    // banked remainder rather than starting a new SLA window.
    data.slaDeadline = previous.slaRemainingMinutes != null ? addMinutes(now, previous.slaRemainingMinutes) : previous.slaDeadline;
    data.slaRemainingMinutes = null;
  }

  // --- Agent TAT pause window (ON_HOLD or RESOLVED) ---
  const wasAgentPaused = AGENT_TAT_PAUSED_STATUSES.includes(previous.status);
  const willBeAgentPaused = AGENT_TAT_PAUSED_STATUSES.includes(nextStatus);
  const agentWindow = pauseWindowUpdate(wasAgentPaused, willBeAgentPaused, previous.holdStartedAt, previous.totalHoldMinutes, now);
  if (agentWindow) {
    data.holdStartedAt = agentWindow.startedAt;
    data.totalHoldMinutes = agentWindow.totalMinutes;
  }

  // --- Ticket TAT pause window (RESOLVED only - NOT ON_HOLD) ---
  const wasTicketPaused = TICKET_TAT_PAUSED_STATUSES.includes(previous.status);
  const willBeTicketPaused = TICKET_TAT_PAUSED_STATUSES.includes(nextStatus);
  const ticketWindow = pauseWindowUpdate(wasTicketPaused, willBeTicketPaused, previous.resolvedStartedAt, previous.totalResolvedMinutes, now);
  if (ticketWindow) {
    data.resolvedStartedAt = ticketWindow.startedAt;
    data.totalResolvedMinutes = ticketWindow.totalMinutes;
  }

  return data;
}

/**
 * Agent TAT (turnOverTime): wall-clock age of the ticket *since the issue
 * actually occurred* (dateOfOccurance) - not since it was filed in the
 * system (createdAt) - minus time spent paused (ON_HOLD or RESOLVED). It
 * stops accumulating the moment the ticket goes on hold or is resolved; if
 * later reopened / taken off hold, it resumes from exactly where it left
 * off rather than counting the paused interval or restarting. Editing
 * dateOfOccurance (e.g. a global admin correcting a wrong date) naturally
 * shifts this calculation since it's still measuring from the same anchor
 * point each time - it is not "restarted"; only the accumulated paused
 * time and the current moment ever change what's subtracted/used.
 */
export function computeAgentTurnOverTimeSeconds(ticket: Pick<TicketClockFields, "status" | "dateOfOccurance" | "holdStartedAt" | "totalHoldMinutes">, now: Date = new Date()) {
  const ongoingPausedMinutes = AGENT_TAT_PAUSED_STATUSES.includes(ticket.status) && ticket.holdStartedAt ? diffInMinutes(ticket.holdStartedAt, now) : 0;
  const totalPausedSeconds = (ticket.totalHoldMinutes + ongoingPausedMinutes) * 60;
  return Math.max(0, diffInSeconds(ticket.dateOfOccurance, now) - totalPausedSeconds);
}

/**
 * Ticket TAT (ticketTurnOverTime): same anchor and reopen-resumes-from-
 * where-it-left-off behavior as Agent TAT above, but it does NOT pause for
 * ON_HOLD - a hold only stops the agent's clock, not the ticket's. It only
 * pauses once the ticket is RESOLVED, and resumes from the banked
 * remainder if the ticket is reopened.
 */
export function computeTicketTurnOverTimeSeconds(ticket: Pick<TicketClockFields, "status" | "dateOfOccurance" | "resolvedStartedAt" | "totalResolvedMinutes">, now: Date = new Date()) {
  const ongoingPausedMinutes = TICKET_TAT_PAUSED_STATUSES.includes(ticket.status) && ticket.resolvedStartedAt ? diffInMinutes(ticket.resolvedStartedAt, now) : 0;
  const totalPausedSeconds = (ticket.totalResolvedMinutes + ongoingPausedMinutes) * 60;
  return Math.max(0, diffInSeconds(ticket.dateOfOccurance, now) - totalPausedSeconds);
}
