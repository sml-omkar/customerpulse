import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { prisma } from "../lib/database";
import { TicketStatus, UserRole } from "../generated/prisma/enums";
import { AppError } from "../middleware/errorHandler";
import { roleChangeReassignmentService } from "../services/roleChangeReassignment.service";

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
  //   - AGENT -> HOD/CXO is more involved on the ticket side: the promoted
  //     user stops working tickets themselves, so every ticket still open
  //     in their *old agent department* (agentsdepartmentId - unrelated to
  //     headDepartmentId above) is either auto-assigned to another agent
  //     in that department (if one exists) or left unassigned (if the
  //     department has no other agents). Either way the promoted user is
  //     notified with the full breakdown. See
  //     roleChangeReassignment.service.ts for the details.
  async update(req: AuthedRequest, res: Response) {
    const { role, departmentId, headDepartmentId, supportLevel, isActive, isAvailableForAssignment, maxActiveTickets } = req.body;

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError("User not found", 404);

    if (departmentId) {
      const department = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!department) throw new AppError("Department not found", 404);
    }

    const finalRole: UserRole = role !== undefined ? role : existing.role;

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

    if (headDepartmentId) {
      const headDepartment = await prisma.department.findUnique({ where: { id: headDepartmentId } });
      if (!headDepartment) throw new AppError("Department not found", 404);
    }

    // Snapshot before the role actually flips - we need the *old agent*
    // department to know who the ticket redistribution pool is, and the
    // reassignment must run against the *new* role (so the promoted user
    // is excluded from their own former candidate pool).
    const isAgentPromotedToExecRole =
      existing.role === UserRole.AGENT &&
      (finalRole === UserRole.HOD || finalRole === UserRole.CXO) &&
      existing.agentsdepartmentId;
    const oldAgentDepartmentId = existing.agentsdepartmentId;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role !== undefined && { role }),
        agentsdepartmentId: departmentId || null,
        ...(supportLevel !== undefined && { supportLevel: supportLevel || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(isAvailableForAssignment !== undefined && { isAvailableForAssignment: Boolean(isAvailableForAssignment) }),
        ...(maxActiveTickets !== undefined && { maxActiveTickets: Number(maxActiveTickets) }),
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
    if (isAgentPromotedToExecRole) {
      ticketReassignmentSummary = await roleChangeReassignmentService.handleAgentPromotedAway({
        promotedUserId: user.id,
        promotedUserFullName: user.fullName,
        promotedUserEmail: user.email,
        oldDepartmentId: oldAgentDepartmentId,
        newRole: user.role,
        performedById: req.user!.id,
      });
    }

    res.json({ ...user, departmentId: user.agentsdepartmentId, headDepartmentId: finalHeadDepartmentId, ticketReassignmentSummary });
  },
};
