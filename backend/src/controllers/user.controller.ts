import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { prisma } from "../lib/database";
import { TicketStatus, UserRole, WindCategory } from "../generated/prisma/enums";
import { AppError } from "../middleware/errorHandler";
import { roleChangeReassignmentService } from "../services/roleChangeReassignment.service";
import { resolveZone, statesForZone } from "../utils/zoneStateMap";

// Roles that personally work tickets and can hold an `agentsdepartmentId`.
// Only AGENT today, but written this way so the reassignment trigger below
// stays correct if that ever changes.
const TICKET_WORKING_ROLES: UserRole[] = [UserRole.AGENT];

export const userController = {
  // GET /users/me
  async me(req: AuthedRequest, res: Response) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
    });
    res.json({ ...user, departmentId: user.agentsdepartmentId });
  },

  //metric ->count of opentickets,assigned tickets,sla breached,resolved,total submissions
  async metric(req: AuthedRequest, res: Response) {
  try {
    const userId = req.params.id; // or req.params.userId

    const [
      openTickets,
      assignedTickets,
      slaBreachedTickets,
      resolvedTickets,
      onhold,
    ] = await prisma.$transaction([
      prisma.ticket.count({
        where: {
          requesterId: userId,
          status: {in: [TicketStatus.OPEN,TicketStatus.IN_PROGRESS,TicketStatus.REOPENED]},
        },
      }),

      prisma.ticket.count({
        where: {
          status :{  notIn: ["RESOLVED"]},
          assigneeId: req.params.id
        },
      }),

      prisma.ticket.count({
        where: {
          assigneeId: userId,
          slaBreached: true,
        },
      }),

      prisma.ticket.count({
        where: {
          requesterId: userId,
          status: "RESOLVED",
        },
      }),

      prisma.ticket.count({
        where: {
          requesterId: userId,
          status: TicketStatus.ON_HOLD
        }
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        openTickets,
        assignedTickets,
        slaBreachedTickets,
        resolvedTickets,
        onhold,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch metrics",
    });
  }
},


  // get /manageddepartments/:id

  async managedDepartments(req:AuthedRequest,res:Response){
    const dept = await prisma.department.findMany({
      where :  {
        managerId : req.params.id
      },
      select :  {
        id : true,
        name : true
      }
    })

    res.json(dept)
  },

  // GET /users
  async list(req: AuthedRequest, res: Response) {
    const users = await prisma.user.findMany({
      where: {
        role : {notIn : [UserRole.REQUESTER]}
      },
      select: {
        id: true, fullName: true, email: true, role: true, 
        supportLevel: true, isActive: true, isAvailableForAssignment: true, maxActiveTickets: true,
        agentsdepartmentId: true,
        // NOTE(added): surfaced so the admin's Staff Directory "edit" modal
        // can show/prefill an AGENT's current Zone (derived from `state`)
        // and Wind Category alongside their role/department.
        state: true,
        windCategory: true,
        _count : {
          select : {
            ticketsAssigned : true
          }
        }
      },
    
    });
    res.json(users.map(u => ({ ...u, departmentId: u.agentsdepartmentId })));
  },

  // GET /users/:id
  // @ts-ignore
  async getById(req: AuthedRequest, res: Response) {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json({ ...user, departmentId: user.agentsdepartmentId });
  },

  // GET /users/:id/categories  (GLOBAL_ADMIN, HOD)
  // The categories this AGENT is currently routed for - lets the Staff
  // Directory "edit" modal pre-check the right boxes before the admin
  // adds/removes any. Uses the same CategoryAgent join the routing engine
  // (assignment.service.ts) and categoryAgentController read/write.
  async categories(req: AuthedRequest, res: Response) {
    const links = await prisma.categoryAgent.findMany({
      where: { userId: req.params.id },
      select: { categoryId: true, proficiency: true },
    });
    res.json(links);
  },
  // PATCH /users/me/availability  { isAvailableForAssignment }
  // Self-service toggle so an agent going on break/PTO stops receiving
  // new auto-assignments without an admin having to intervene.
  async setMyAvailability(req: AuthedRequest, res: Response) {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { isAvailableForAssignment: Boolean(req.body.isAvailableForAssignment) },
    });
    res.json(user);
  },

  // PATCH /users/:id  (GLOBAL_ADMIN only)
  // Lets an admin edit an operator's profile from the User Directory,
  // including transferring an agent to a different department when
  // teams get reorganized, and changing a user's role.
  //
  // Role-change specific behaviour (Staff Directory "edit user" flow):
  //   - HOD <-> CXO, and REQUESTER -> HOD/CXO are plain access-level swaps
  //     as far as the account itself goes.
  //   - Promoting into HOD/CXO always requires `headDepartmentId` - the
  //     department this person will now head. This is a DIFFERENT
  //     department than the one their tickets get redistributed out of
  //     (see below) - an agent from Department A can be made HOD/CXO of
  //     Department B, C, etc. If the person is already HOD/CXO somewhere
  //     and `headDepartmentId` is omitted, they keep heading whatever
  //     department they already head (e.g. a plain HOD -> CXO swap in
  //     place). Whatever department they used to head that they're no
  //     longer heading has its manager/cxo slot cleared.
  //   - A department can only have ONE HOD and ONE CXO at a time. If
  //     `headDepartmentId` already has a different HOD (when promoting to
  //     HOD) or a different CXO (when promoting to CXO), the request is
  //     rejected with a 409 - the existing HOD/CXO has to be reassigned or
  //     demoted first. This applies no matter who's being promoted (agent,
  //     requester, or anyone else).
  //   - AGENT -> HOD/CXO/REQUESTER/GLOBAL_ADMIN (any role change away from
  //     AGENT) is more involved on the ticket side: the moved user stops
  //     working tickets themselves, so every ticket still open in their
  //     *old agent department* (agentsdepartmentId - unrelated to
  //     headDepartmentId above) is either auto-assigned to another agent
  //     in that department (if one exists) or left unassigned (if the
  //     department has no other agents).
  //   - Transferring an AGENT to a *different* department (role unchanged)
  //     is handled the same way: every ticket still open in their *old*
  //     department is redistributed the same way, since they no longer
  //     work tickets there.
  //   - Either way, both the moved user AND the HOD of the old department
  //     are notified (in-app + email) with the full breakdown - which
  //     tickets got auto-assigned to whom, and which ones are sitting
  //     unassigned because the department has nobody left to pick them up.
  //     See roleChangeReassignment.service.ts for the details.
  async update(req: AuthedRequest, res: Response) {
    const { role, departmentId, headDepartmentId, supportLevel, isActive, isAvailableForAssignment, maxActiveTickets, zone, windCategory } = req.body;

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("User not found", 404);

    if (departmentId) {
      const department = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!department) throw new AppError("Department not found", 404);
    }

    const finalRole: UserRole = role !== undefined ? role : existing.role;

    // NOTE(added): Zone and Wind Category are AGENT-only routing inputs
    // (see assignment.service.ts's wind/state narrowing) - previously only
    // settable at invite time (invitation.controller.ts). This lets a
    // GLOBAL_ADMIN edit them later from the Staff Directory, same as
    // role/department. Only meaningful once the *final* role is AGENT -
    // sending either for a non-agent (or a user being moved off AGENT) is
    // rejected rather than silently ignored, since it'd otherwise look
    // like it took effect.
    if ((zone !== undefined || windCategory !== undefined) && finalRole !== UserRole.AGENT) {
      throw new AppError("zone and windCategory can only be set on AGENT-role users", 400);
    }

    let finalState = existing.state;
    if (zone !== undefined) {
      if (zone === null || zone === "") {
        finalState = null;
      } else {
        const resolved = resolveZone(zone);
        if (!resolved) throw new AppError(`Unrecognized zone: "${zone}"`, 400);
        finalState = statesForZone(resolved);
      }
    }

    let finalWindCategory = existing.windCategory;
    if (windCategory !== undefined) {
      if (windCategory === null || windCategory === "") {
        finalWindCategory = null;
      } else if (!Object.values(WindCategory).includes(windCategory)) {
        throw new AppError(`Invalid windCategory: "${windCategory}"`, 400);
      } else {
        finalWindCategory = windCategory;
      }
    }

    // NOTE(fixed): `departmentId` is only meant to update agentsdepartmentId
    // when the caller actually sends it. Previously this fell straight
    // through to `departmentId || null` unconditionally below, which meant
    // ANY profile edit that omitted departmentId (e.g. just toggling
    // isActive) silently wiped the agent's department. Now: only change it
    // when the field is present in the request body; an explicit `null`/""
    // still means "unassign from any department".
    const departmentProvided = departmentId !== undefined;
    const finalAgentDepartmentId: string | null = departmentProvided ? departmentId || null : existing.agentsdepartmentId;

    // NOTE(added): department(s) this person currently heads, if any -
    // fetched up front (regardless of role) so we know what to clean up
    // once the role/headDepartmentId actually change.
    const currentlyManagedDepartments = await prisma.department.findMany({ where: { managerId: existing.id }, select: { id: true } });
    const currentlyCxoDepartments = await prisma.department.findMany({ where: { cxoId: existing.id }, select: { id: true } });
    const currentHeadDepartmentId =
      existing.role === UserRole.HOD
        ? currentlyManagedDepartments[0]?.id ?? null
        : existing.role === UserRole.CXO
        ? currentlyCxoDepartments[0]?.id ?? null
        : null;

    // If promoting into HOD/CXO, a target department is required - either
    // explicitly given, or (for someone already HOD/CXO elsewhere) falls
    // back to the department they already head.
    const finalHeadDepartmentId: string | null = headDepartmentId || currentHeadDepartmentId || null;

    if ((finalRole === UserRole.HOD || finalRole === UserRole.CXO) && !finalHeadDepartmentId) {
      throw new AppError("headDepartmentId is required when setting a user's role to HOD or CXO", 400);
    }

    // NOTE(added): a department can only ever have ONE HOD and ONE CXO at a
    // time - Department.managerId / Department.cxoId are single-valued, not
    // lists (see migration 20260715163713_removed_the_multiple_hod_and_cxo_
    // for_a_particular_department). Promoting an agent/requester/anyone
    // else into a seat that's already held by someone else would silently
    // knock the incumbent out of their role with none of the ticket-side
    // handling that a real role change gets - so block it outright instead.
    // The admin has to explicitly move or demote the current HOD/CXO first.
    // (Fetched once against `finalHeadDepartmentId`, which covers both an
    // explicitly-given headDepartmentId and the "stay in my current seat"
    // fallback above - the latter can never conflict since it's already
    // this same user's own seat, but the existence check is a nice-to-have
    // safety net either way.)
    let headDepartment: { id: string; name: string; managerId: string | null; cxoId: string | null } | null = null;
    if (finalHeadDepartmentId) {
      headDepartment = await prisma.department.findUnique({
        where: { id: finalHeadDepartmentId },
        select: { id: true, name: true, managerId: true, cxoId: true },
      });
      if (!headDepartment) throw new AppError("Department not found", 404);
    }

    if (finalRole === UserRole.HOD && headDepartment?.managerId && headDepartment.managerId !== existing.id) {
      throw new AppError(
        `${headDepartment.name} already has an HOD. Reassign or remove the current HOD before promoting someone else into that seat.`,
        409
      );
    }
    if (finalRole === UserRole.CXO && headDepartment?.cxoId && headDepartment.cxoId !== existing.id) {
      throw new AppError(
        `${headDepartment.name} already has a CXO. Reassign or remove the current CXO before promoting someone else into that seat.`,
        409
      );
    }

    // Snapshot before the role/department actually flip - we need the *old
    // agent* department to know who the ticket redistribution pool is, and
    // the reassignment must run against the *new* role/department (so the
    // moved user is excluded from their own former candidate pool).
    //
    //   - roleChangedAwayFromAgent: they used to work tickets as an AGENT
    //     and no longer do (promoted to HOD/CXO, demoted to REQUESTER,
    //     made a GLOBAL_ADMIN - any role other than AGENT).
    //   - departmentChangedForAgent: they're still an AGENT, but their
    //     agentsdepartmentId is moving to a different value (a straight
    //     team transfer, or being pulled off a department entirely).
    // These are mutually exclusive by construction (the second requires
    // finalRole === AGENT, the first requires finalRole !== AGENT).
    const oldAgentDepartmentId = existing.agentsdepartmentId;

    const roleChangedAwayFromAgent =
      existing.role === UserRole.AGENT && !TICKET_WORKING_ROLES.includes(finalRole) && !!oldAgentDepartmentId;

    const departmentChangedForAgent =
      existing.role === UserRole.AGENT &&
      finalRole === UserRole.AGENT &&
      !!oldAgentDepartmentId &&
      departmentProvided &&
      finalAgentDepartmentId !== oldAgentDepartmentId;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role !== undefined && { role }),
        agentsdepartmentId: finalAgentDepartmentId,
        ...(supportLevel !== undefined && { supportLevel: supportLevel || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(isAvailableForAssignment !== undefined && { isAvailableForAssignment: Boolean(isAvailableForAssignment) }),
        ...(maxActiveTickets !== undefined && { maxActiveTickets: Number(maxActiveTickets) }),
        ...(zone !== undefined && { state: finalState }),
        ...(windCategory !== undefined && { windCategory: finalWindCategory }),
      },
    });

    // NOTE(added): sync Department.managerId / Department.cxoId to match
    // the (possibly new) role and (possibly new) headed department -
    // clears any department this person no longer heads, and assigns them
    // to `finalHeadDepartmentId` if the final role is HOD/CXO. This is
    // independent of `agentsdepartmentId` above, which only ever tracks
    // the department an AGENT personally works tickets in.
    for (const dept of currentlyManagedDepartments) {
      if (finalRole !== UserRole.HOD || dept.id !== finalHeadDepartmentId) {
        await prisma.department.update({ where: { id: dept.id }, data: { managerId: null } });
      }
    }
    for (const dept of currentlyCxoDepartments) {
      if (finalRole !== UserRole.CXO || dept.id !== finalHeadDepartmentId) {
        await prisma.department.update({ where: { id: dept.id }, data: { cxoId: null } });
      }
    }
    if (finalRole === UserRole.HOD && finalHeadDepartmentId) {
      await prisma.department.update({ where: { id: finalHeadDepartmentId }, data: { managerId: user.id } });
    }
    if (finalRole === UserRole.CXO && finalHeadDepartmentId) {
      await prisma.department.update({ where: { id: finalHeadDepartmentId }, data: { cxoId: user.id } });
    }

    let ticketReassignmentSummary = null;
    if (roleChangedAwayFromAgent || departmentChangedForAgent) {
      ticketReassignmentSummary = await roleChangeReassignmentService.handleAgentTicketReassignment({
        movedUserId: user.id,
        movedUserFullName: user.fullName,
        movedUserEmail: user.email,
        oldDepartmentId: oldAgentDepartmentId,
        reason: roleChangedAwayFromAgent ? "ROLE_CHANGE" : "DEPARTMENT_TRANSFER",
        newRole: user.role,
        newDepartmentId: user.agentsdepartmentId,
        performedById: req.user!.id,
      });
    }

    res.json({
      ...user,
      departmentId: user.agentsdepartmentId,
      headDepartmentId: finalHeadDepartmentId,
      zone: user.state ? resolveZone(zone) || zone : null,
      ticketReassignmentSummary,
    });
  },
};
