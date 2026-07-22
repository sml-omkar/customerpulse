// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {UserRole,SupportLevel} from "../generated/prisma/client"
import { AppError } from "./errorHandler";
import { prisma } from '../lib/database';

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    companyId: string;
    role: UserRole;
    departmentId?: string | null;
    supportLevel?: SupportLevel | null;
  };
}
// @ts-ignore
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided', code: 'NO_TOKEN' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "its-me") as AuthedRequest['user'];
    req.user = payload;
    const user = await prisma.user.findFirst({where:{id : req.user?.id}})
    if(user?.isActive == false){
      return res.status(401).json({ error: 'YOU HAVE BEEN BLOCKED', code: 'ACCOUNT_BLOCKED' })
    }
    next();
  } catch {
    // Covers both an expired token and a malformed/tampered one - either
    // way the client's session is no longer valid, so it's tagged with a
    // dedicated code the frontend can key off to log the user out.
    res.status(401).json({ error: 'Invalid or expired token', code: 'SESSION_EXPIRED' });
  }
}


/**
 * Restricts a route to specific roles. Must run after requireAuth,
 * since it reads req.user (throws if that's not populated yet).
 *
 * Usage: requireRole(UserRole.GLOBAL_ADMIN, UserRole.DEPT_ADMIN)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      // requireAuth wasn't run, or ran and failed to attach a user -
      // treat as a wiring bug rather than silently allowing through.
      throw new AppError("Not authenticated", 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("You do not have permission to perform this action", 403);
    }
    next();
  };
}
