import { Router } from "express";
import { UserRole } from "../generated/prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateBody } from "../middleware/validate";
import { adminTicketController } from "../controllers/adminTicket.controller";
import { ADMIN_TICKET_RAISER_ROLES } from "../utils/rbac";
import { createAdminTicketSchema, resolveAdminTicketSchema } from "../utils/schemas";

export const adminTicketRouter = Router();

adminTicketRouter.use(requireAuth);

// A HOD/CXO/AGENT raising an internal request directly to the GLOBAL_ADMIN.
adminTicketRouter.post(
  "/",
  requireRole(...ADMIN_TICKET_RAISER_ROLES),
  validateBody(createAdminTicketSchema),
  asyncHandler(adminTicketController.create)
);

// The current user's own raised requests (any role that can raise one).
adminTicketRouter.get("/mine", asyncHandler(adminTicketController.listMine));

// Every request raised company-wide - GLOBAL_ADMIN only.
adminTicketRouter.get("/", requireRole(UserRole.GLOBAL_ADMIN), asyncHandler(adminTicketController.list));

adminTicketRouter.get("/:id", asyncHandler(adminTicketController.getById));

adminTicketRouter.patch(
  "/:id",
  requireRole(UserRole.GLOBAL_ADMIN),
  validateBody(resolveAdminTicketSchema),
  asyncHandler(adminTicketController.resolve)
);
