import type { Request, Response, NextFunction } from 'express';
import { resolveAuthenticatedUser } from './auth.ts';
import type { UserProfile } from '../shared/types.ts';

declare global {
  namespace Express {
    interface Request {
      authUser?: UserProfile;
    }
  }
}

export async function verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await resolveAuthenticatedUser(req, res);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: Valid authentication required.' });
      return;
    }
    req.authUser = user;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
  }
}

export function verifyCustomer(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  if (req.authUser.role !== 'customer') {
    res.status(403).json({ error: 'Forbidden: Customer access required.' });
    return;
  }
  next();
}

export function verifyTechnician(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  if (req.authUser.role !== 'technician') {
    res.status(403).json({ error: 'Forbidden: Technician access required.' });
    return;
  }
  next();
}

export function verifyAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  if (req.authUser.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin access required.' });
    return;
  }
  next();
}
