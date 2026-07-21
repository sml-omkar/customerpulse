import { prisma } from "../lib/database";
import { AssignmentMethod, TicketStatus, WindCategory } from "../generated/prisma/client";
import { notificationService } from "./notification.service";
import { logStatusChange } from "./statushistory.service";
import { ASSIGNABLE_AGENT_ROLES } from "../utils/rbac";
import { AppError } from "../middleware/errorHandler";


const OPEN_STATUSES: TicketStatus[] = [ TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.ON_HOLD, TicketStatus.REOPENED];

// NOTE(added): given the ticket's client, work out which agent
// WindCategory value(s) are an acceptable match.
//   - Wind client        -> agent must be WIND or BOTH
//   - Non-Wind client    -> agent must be NON_WIND or BOTH
//   - Client not found / not resolvable -> null (no wind filtering at all,
//     agents of every wind category are equally eligible).
// `null` on an agent's own `windCategory` (i.e. never assigned one) never
// matches a resolved requirement - such an agent is only picked once we've
// fallen back to the unfiltered pool below.
function requiredWindCategories(isWindClient: boolean | null): WindCategory[] | null {
  if (isWindClient === null) return null;
  return isWindClient ? [WindCategory.WIND, WindCategory.BOTH] : [WindCategory.NON_WIND, WindCategory.BOTH];
}

function matchesWindRequirement(agentWindCategory: WindCategory | null, required: WindCategory[] | null): boolean {
  if (required === null) return true;
  if (!agentWindCategory) return false;
  return required.includes(agentWindCategory);
}

// NOTE(added): state is stored as a free-text, comma-separated string on
// both User (e.g. "Karnataka, Kerala") and Ticket (e.g. "karnataka,kerala")
// - casing/spacing aren't guaranteed to line up between the two, so both
// sides are normalised (split on comma, trimmed, lowercased) before being
// compared.
function parseStateList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

// `required` is the ticket's requested state(s), already parsed/lowercased.
// An empty `required` (ticket has no state set) means every agent matches -
// state is a preference layered on top of department+category+wind, never
// a hard requirement, so it should never wipe out an eligible pool just
// because the ticket didn't specify a state.
function matchesStateRequirement(agentState: string | null, required: string[]): boolean {
  if (required.length === 0) return true;
  const agentStates = parseStateList(agentState);
  if (agentStates.length === 0) return false;
  return agentStates.some((s) => required.includes(s));
}

export const assignmentService = {
  /**
   * Picks the best agent for a ticket, in priority order:
   *
   *   1. CATEGORY MATCH (primary, when the ticket has a categoryId):
   *      candidates = agents explicitly linked to that category via
   *      CategoryAgent. Scored by proficiency, tie-broken by lowest
   *      current open-ticket load.
   *   2. KEYWORD MATCH (fallback, used whenever there's no category, or
   *      the category has zero linked agents): candidates = active,
   *      available agents in the department, scored by how many of the
   *      ticket's linked keywords match their declared skills
   *      (UserKeyword), weighted by proficiency.
   *   3. LOAD-BALANCE FALLBACK: if neither of the above produces a
   *      match, fall back to the least-loaded eligible agent in the
   *      department so a ticket never sits permanently unassigned just
   *      because nobody's skills/category lined up.
   *
   * WIND vs STATE narrowing (applies within both stage 1 and stage 2):
   *   We never go "state first". Within whatever base pool a stage builds
   *   (department[+category]), narrowing happens in this fixed order, each
   *   step with a "fall back if it would empty the pool" safety net so a
   *   preference never blocks assignment outright:
   *     a) department (+ category, in stage 1)
   *     b) wind/non-wind match against the ticket's client
   *     c) state match against the ticket's state (ticket.state can be a
   *        comma-separated list like "karnataka,kerala"; an agent's state
   *        can likewise be a comma-separated list - any overlap counts as
   *        a match)
   *   So if an agent in that department/category/wind pool covers the
   *   ticket's state, they're preferred. If nobody in that pool covers it,
   *   we fall back to the pool from before the state filter (i.e. still
   *   respecting department+category+wind) rather than leaving the ticket
   *   unassigned.
   *
   * All three respect maxActiveTickets - an agent at capacity is never
   * selected, regardless of how good their match score is.
   */
  async findBestAgent(ticketId: string) {
    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: { keywords: true },
    });

    // NOTE(added): resolve the ticket's client the same way ticket.service.ts
    // does at creation time (by clientName - there's no clientId FK on
    // Ticket), so we know whether this is a Wind or Non-Wind client and can
    // prefer routing to an agent whose windCategory covers it (WIND/BOTH for
    // a Wind client, NON_WIND/BOTH for a Non-Wind one). If the client can't
    // be resolved, `required` comes back null and no wind filtering happens.
    const client = await prisma.client.findFirst({ where: { name: ticket.clientName } });
    const required = requiredWindCategories(client ? client.isWindClient : null);

    // NOTE(added): the ticket's requested state(s), normalised. Empty means
    // the ticket didn't specify a state, so the state filter below is a
    // no-op wherever it's applied. See parseStateList/matchesStateRequirement.
    const requiredStates = parseStateList(ticket.state);

    // ---- 1. Category-based match (primary) ----
    if (ticket.categoryId) {
      console.log("Hitting ticket category")
      // NOTE(changed): scoped to the ticket's department up front - agents
      // linked to this category but sitting in a different department were
      // previously still being considered. Department + category is the
      // base candidate pool; wind/non-wind/both and state are applied as
      // filters on top of that pool below, not the other way round.
      const categoryAgents = await prisma.categoryAgent.findMany({
        where: { categoryId: ticket.categoryId, agent: { agentsdepartmentId: ticket.departmentId } },
        include: {
          agent: {
            include: { ticketsAssigned: { where: { status: { in: OPEN_STATUSES } }, select: { id: true } } },
          },
        },
      });

      console.log("agents with same categories as mentioned in the ticket",categoryAgents)

      let eligible 
      if (categoryAgents.length >= 1){

        // NOTE(removed): supportLevel filter dropped - agents are all L1,
        // and L2 (HOD/CXO) never get assigned tickets, so it never
        // meaningfully narrowed this pool anyway.
        eligible = categoryAgents
        .map((ca) => ({ agent: ca.agent, proficiency: ca.proficiency, openCount: ca.agent.ticketsAssigned.length }))
        
      }else {
        eligible = categoryAgents
        .filter((ca)=>ticket.requesterId == ca.id)
        .map((ca) => ({ agent: ca.agent, proficiency: ca.proficiency, openCount: ca.agent.ticketsAssigned.length }))
      }

      if (eligible.length > 0) {
        // NOTE(added): now that `eligible` is already department+category
        // scoped, narrow it down further to agents whose windCategory
        // covers this client (WIND/BOTH or NON_WIND/BOTH per `required`
        // above). If that leaves nobody, fall back to the full `eligible`
        // pool - i.e. the department+category match still wins, just
        // without the wind preference.
        const windMatched = eligible.filter((e) => matchesWindRequirement(e.agent.windCategory, required));
        const windPool = windMatched.length > 0 ? windMatched : eligible;

        // NOTE(added): last narrowing step - prefer an agent whose own
        // `state` covers the ticket's state, within the wind-matched pool.
        // If nobody in that pool covers the ticket's state, fall back to
        // the wind-matched pool itself (state is a preference layered on
        // top of department+category+wind, never a hard blocker) - this is
        // the "no agent for that state -> fall back to our implemented
        // logic" behaviour.
        const stateMatched = windPool.filter((e) => matchesStateRequirement(e.agent.state, requiredStates));
        const pool = stateMatched.length > 0 ? stateMatched : windPool;

        pool.sort((a, b) => b.proficiency - a.proficiency || a.openCount - b.openCount);
        return { agent: pool[0].agent, method: AssignmentMethod.AUTO_CATEGORY };
      }
      // No eligible category agents - fall through to keyword matching
      // below rather than returning null immediately.
    }

    // ---- 2. Keyword/skill match (fallback when no category, or category has no agents) ----
    // NOTE(removed): supportLevel filter dropped here too - same reasoning
    // as the category-match stage above.
    const candidates = await prisma.user.findMany({
      where: {
        agentsdepartmentId: ticket.departmentId,
        role: { in: ASSIGNABLE_AGENT_ROLES },
      },
      include: {
        skills: true,
        ticketsAssigned: { where: { status: { in: OPEN_STATUSES } }, select: { id: true } },
      },
    });

    if (candidates.length === 0) return null;

    const ticketKeywordIds = new Set(ticket.keywords.map((k) => k.keywordId));

    const scored = candidates
      .filter((agent) => agent.id != ticket.requesterId)
      .map((agent) => {
        const skillScore = agent.skills
          
          .filter((s) => ticketKeywordIds.has(s.keywordId))
          .reduce((sum, s) => sum + s.proficiency, 0);
        const openCount = agent.ticketsAssigned.length;
        const atCapacity = openCount >= agent.maxActiveTickets;
        return { agent, skillScore, openCount, atCapacity };
      })
      .filter((c) => !c.atCapacity);

    if (scored.length === 0) return null;

    // NOTE(added): same wind-category preference as the category-match
    // stage above - try to keep the ticket within agents whose windCategory
    // covers this client first, and only fall back to the full (unfiltered)
    // candidate pool - i.e. the pre-existing keyword/load-balance logic -
    // if that leaves nobody eligible in the department.
    const windMatched = scored.filter((c) => matchesWindRequirement(c.agent.windCategory, required));
    const capacityPool = windMatched.length > 0 ? windMatched : scored;

    // NOTE(added): state preference, same "narrow then fall back" pattern
    // as wind above, applied on top of the wind-narrowed pool - i.e.
    // department -> wind/non-wind -> state, in that order, matching the
    // routing logic used in stage 1.
    const stateMatchedCapacity = capacityPool.filter((c) => matchesStateRequirement(c.agent.state, requiredStates));
    const finalPool = stateMatchedCapacity.length > 0 ? stateMatchedCapacity : capacityPool;

    const hasSkillMatch = finalPool.some((c) => c.skillScore > 0);
    const pool = hasSkillMatch ? finalPool.filter((c) => c.skillScore > 0) : finalPool;

    // ---- 3. Load-balance fallback is just "no skill match" above, same pool ----
    pool.sort((a, b) => b.skillScore - a.skillScore || a.openCount - b.openCount);

    return {
      agent: pool[0].agent,
      method: hasSkillMatch ? AssignmentMethod.AUTO_KEYWORD : AssignmentMethod.AUTO_LOAD_BALANCE,
    };
  },

  async autoAssign(ticketId: string, assignedById?: string) {
    const result = await this.findBestAgent(ticketId);
    if (!result) {
      // Leave unassigned - it'll surface on the department's unassigned
      // queue / SLA job rather than being silently dropped.
      return null;
    }

    const previous = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assigneeId: result.agent.id,
        assignedById: assignedById ?? null,
        assignmentMethod: result.method,
        assignedAt: new Date(),
        status: TicketStatus.OPEN,
      },
    });

    if (previous.status !== TicketStatus.OPEN) {
      await logStatusChange({ ticketId, fromStatus: previous.status, toStatus: TicketStatus.OPEN, changedById: assignedById ?? null });
    }

    await notificationService.sendTicketAssigned(ticket, result.agent);
    return ticket;
  },

  async manualAssign(ticketId: string, agentId: string, assignedById: string) {
    const agent = await prisma.user.findUniqueOrThrow({ where: { id: agentId } });
    const previous = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    // find the assignee and check the number of tickets   
    if (!agent || !previous ){
      throw new AppError('agent or ticket not found',401)
    }

    if (previous.slaBreached || previous.escalatedToId) {
      throw new AppError("This ticket has been escalated and can only be reassigned by a department manager", 403);
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assigneeId: agentId,
        assignedById,
        assignmentMethod: AssignmentMethod.MANUAL,
        assignedAt: new Date(),
        status: TicketStatus.OPEN,
      },
    });

    if (previous.status !== TicketStatus.OPEN) {
      await logStatusChange({ ticketId, fromStatus: previous.status, toStatus: TicketStatus.OPEN, changedById: assignedById });
    }

    await notificationService.sendTicketAssigned(ticket, agent);
    return ticket;
  },
};
