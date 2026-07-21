import { TicketStatus } from "../generated/prisma/client";
import { addMinutes, diffInMinutes, diffInSeconds } from "../utils/time";

// A ticket isn't "actively being worked" while ON_HOLD or RESOLVED (the
// latter may still get reopened). Both the SLA deadline and the TAT
// hold-accumulator pause for exactly this same set of statuses, so it's
// shared between the two calculations below instead of tracked twice.
// While paused, the SLA deadline is cleared (so the sweep cron leaves it
// alone) and whatever time was left gets banked in slaRemainingMinutes;
// coming back to an active status resumes the deadline from that banked
// remainder instead of granting a fresh window. Likewise, holdStartedAt
// marks when the current pause began and totalHoldMinutes accumulates
// completed pause windows - now covering RESOLVED time too, so TAT stops
// ticking while a ticket sits resolved and resumes exactly where it left
// off if the ticket is reopened.
const PAUSED_STATUSES: TicketStatus[] = [TicketStatus.ON_HOLD, TicketStatus.RESOLVED];

export type TicketClockFields = {
  status: TicketStatus;
  createdAt: Date;
  dateOfOccurance: Date;
  slaDeadline: Date | null;
  slaRemainingMinutes: number | null;
  holdStartedAt: Date | null;
  totalHoldMinutes: number;
};

export type SlaClockUpdate = {
  slaDeadline?: Date | null;
  slaRemainingMinutes?: number | null;
  holdStartedAt?: Date | null;
  totalHoldMinutes?: number;
};

/**
 * Given a ticket's current clock state and the status it's moving to,
 * returns the fields that need updating on the Ticket row. Handles two
 * things that both key off the same ON_HOLD/RESOLVED pause boundary:
 *   - the SLA deadline pause/resume
 *   - the wall-clock pause accumulator used by TAT
 */
export function computeSlaClockUpdate(
  previous: Pick<TicketClockFields, "status" | "slaDeadline" | "slaRemainingMinutes" | "holdStartedAt" | "totalHoldMinutes">,
  nextStatus: TicketStatus,
  now: Date = new Date()
): SlaClockUpdate {
  const data: SlaClockUpdate = {};

  const wasPaused = PAUSED_STATUSES.includes(previous.status);
  const willBePaused = PAUSED_STATUSES.includes(nextStatus);

  // Open / close the pause window used by TAT. Only fires on a boundary
  // crossing (active -> paused or paused -> active) - going ON_HOLD -> RESOLVED
  // or RESOLVED -> ON_HOLD stays paused throughout, so holdStartedAt is left
  // running rather than reset, and no minutes are banked mid-transition.
  if (wasPaused && !willBePaused) {
    const pausedMinutes = previous.holdStartedAt ? diffInMinutes(previous.holdStartedAt, now) : 0;
    data.totalHoldMinutes = previous.totalHoldMinutes + pausedMinutes;
    data.holdStartedAt = null;
  } else if (!wasPaused && willBePaused) {
    data.holdStartedAt = now;
  }

  if (!wasPaused && willBePaused) {
    // Entering ON_HOLD or RESOLVED: bank whatever SLA time is left (0 if
    // it had already breached) and stop the deadline from being checked.
    data.slaRemainingMinutes = previous.slaDeadline ? diffInMinutes(now, previous.slaDeadline) : null;
    data.slaDeadline = null;
  } else if (wasPaused && !willBePaused) {
    // Leaving ON_HOLD, or reopening a RESOLVED ticket: resume from the
    // banked remainder rather than starting a new SLA window.
    data.slaDeadline = previous.slaRemainingMinutes != null ? addMinutes(now, previous.slaRemainingMinutes) : previous.slaDeadline;
    data.slaRemainingMinutes = null;
  }

  return data;
}

/**
 * TAT (turnOverTime): wall-clock age of the ticket *since the issue
 * actually occurred* (dateOfOccurance) - not since it was filed in the
 * system (createdAt) - minus time spent paused (ON_HOLD or RESOLVED). A
 * resolved ticket stops accumulating TAT the moment it's resolved; if it's
 * later reopened, TAT resumes from exactly where it left off rather than
 * counting the resolved interval or restarting. Editing dateOfOccurance
 * (e.g. a global admin correcting a wrong date) naturally shifts this
 * calculation since it's still measuring from the same anchor point each
 * time - it is not "restarted"; only the accumulated paused time and the
 * current moment ever change what's subtracted/used.
 */
export function computeTurnOverTimeSeconds(ticket: Pick<TicketClockFields, "status" | "dateOfOccurance" | "holdStartedAt" | "totalHoldMinutes">, now: Date = new Date()) {
  const ongoingPausedMinutes = PAUSED_STATUSES.includes(ticket.status) && ticket.holdStartedAt ? diffInMinutes(ticket.holdStartedAt, now) : 0;
  const totalPausedSeconds = (ticket.totalHoldMinutes + ongoingPausedMinutes) * 60;
  return Math.max(0, diffInSeconds(ticket.dateOfOccurance, now) - totalPausedSeconds);
}
