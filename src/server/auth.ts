import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { Request, Response, CookieOptions } from 'express';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import {
  findUserByEmail,
  createUser,
  createSessionRecord,
  findSessionByToken,
  deleteSessionByToken,
  getMongoDb,
  isMongoConnected,
  type StoredUser,
} from './db.ts';
import type { UserProfile, UserRole } from '../shared/types.ts';

const DEV_FALLBACK_JWT_SECRET = crypto.createHash('sha256').update(process.cwd() + '_fixmate_dev_jwt').digest('hex');

export function getJwtSecret(): string {
  return process.env.JWT_SECRET?.trim() || process.env.BETTER_AUTH_SECRET?.trim() || DEV_FALLBACK_JWT_SECRET;
}

export interface JwtClaims {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
  sessionId?: string;
}

export function signJwtToken(user: UserProfile, sessionId?: string): string {
  const payload: JwtClaims = {
    sub: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
    sessionId,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '2h' });
}

export function verifyJwtToken(token: string): JwtClaims {
  return jwt.verify(token, getJwtSecret()) as JwtClaims;
}

export function getCookieOptions(maxAgeMs: number): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: maxAgeMs,
  };
}

export function sanitizeUser(user: StoredUser): UserProfile {
  const { passwordHash: _pw, ...safe } = user;
  return safe;
}

let betterAuthInstance: any = null;

/**
 * Initializes BetterAuth with MongoDB adapter when MongoDB is connected.
 */
export function initBetterAuth(): any {
  if (!isMongoConnected()) return null;
  const db = getMongoDb();
  if (!db) return null;

  try {
    betterAuthInstance = betterAuth({
      database: mongodbAdapter(db),
      secret: getJwtSecret(),
      baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL || 'http://localhost:3000',
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 6,
      },
      user: {
        modelName: 'users',
        additionalFields: {
          role: { type: 'string', defaultValue: 'customer', input: true },
          phone: { type: 'string', defaultValue: '', input: true },
          area: { type: 'string', defaultValue: '', input: true },
          bio: { type: 'string', defaultValue: '', input: true },
        },
      },
      socialProviders:
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
          ? {
              google: {
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              },
            }
          : undefined,
    });
    return betterAuthInstance;
  } catch (err) {
    console.warn('[FixMate Auth] BetterAuth adapter init skipped:', err);
    return null;
  }
}

export function getBetterAuth() {
  return betterAuthInstance;
}

export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== 'string' || password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  return null;
}

/**
 * Server-side registration role normalization:
 * Only 'customer' or 'technician' allowed publicly. Never 'admin'.
 */
export function normalizeRegistrationRole(requestedRole: unknown): 'customer' | 'technician' {
  if (requestedRole === 'technician') return 'technician';
  return 'customer';
}

export async function registerWithEmail(input: {
  name: string;
  email: string;
  password: string;
  role?: unknown;
  phone?: string;
  area?: string;
}): Promise<{ user: UserProfile; jwtToken: string; sessionToken: string }> {
  const passwordError = validatePasswordStrength(input.password);
  if (passwordError) {
    throw new Error(passwordError);
  }
  if (!input.name || input.name.trim().length < 2) {
    throw new Error('Full name must be at least 2 characters.');
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    throw new Error('Please enter a valid email address.');
  }

  const safeRole = normalizeRegistrationRole(input.role);
  const passwordHash = await bcrypt.hash(input.password, 10);

  const created = await createUser({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash,
    role: safeRole,
    phone: input.phone || '',
    area: input.area || '',
    bio: '',
    image: '',
  });

  const safeUser = sanitizeUser(created);
  const session = await createSessionRecord(safeUser._id, safeUser.email);
  const jwtToken = signJwtToken(safeUser, session.token);

  return { user: safeUser, jwtToken, sessionToken: session.token };
}

export async function loginWithEmail(input: {
  email: string;
  password: string;
}): Promise<{ user: UserProfile; jwtToken: string; sessionToken: string }> {
  const email = input.email?.trim().toLowerCase();
  if (!email || !input.password) {
    throw new Error('Email and password are required.');
  }

  const existing = await findUserByEmail(email);
  if (!existing || !existing.passwordHash) {
    throw new Error('Invalid email or password.');
  }

  const valid = await bcrypt.compare(input.password, existing.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password.');
  }

  const safeUser = sanitizeUser(existing);
  const session = await createSessionRecord(safeUser._id, safeUser.email);
  const jwtToken = signJwtToken(safeUser, session.token);

  return { user: safeUser, jwtToken, sessionToken: session.token };
}

export function setAuthCookies(res: Response, jwtToken: string, sessionToken: string): void {
  res.cookie('fixmate_token', jwtToken, getCookieOptions(2 * 60 * 60 * 1000));
  res.cookie('fixmate_session', sessionToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('fixmate_token', { path: '/' });
  res.clearCookie('fixmate_session', { path: '/' });
}

export async function resolveAuthenticatedUser(req: Request, res?: Response): Promise<UserProfile | null> {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7).trim()
    : null;
  const jwtCookie = req.cookies?.fixmate_token as string | undefined;
  const sessionCookie = req.cookies?.fixmate_session as string | undefined;

  const candidateJwt = bearer || jwtCookie;
  if (candidateJwt) {
    try {
      const claims = verifyJwtToken(candidateJwt);
      const freshUser = await findUserByEmail(claims.email);
      if (freshUser) {
        return sanitizeUser(freshUser);
      }
    } catch {
      // Token expired or invalid; fall through to persistent session refresh
    }
  }

  if (sessionCookie) {
    const session = await findSessionByToken(sessionCookie);
    if (session) {
      const freshUser = await findUserByEmail(session.email);
      if (freshUser) {
        const safeUser = sanitizeUser(freshUser);
        // Safely refresh short-lived JWT cookie from valid persistent session
        if (res) {
          const freshJwt = signJwtToken(safeUser, session.token);
          res.cookie('fixmate_token', freshJwt, getCookieOptions(2 * 60 * 60 * 1000));
        }
        return safeUser;
      }
    }
  }

  return null;
}

export async function logoutSession(req: Request, res: Response): Promise<void> {
  const sessionCookie = req.cookies?.fixmate_session as string | undefined;
  if (sessionCookie) {
    await deleteSessionByToken(sessionCookie);
  }
  clearAuthCookies(res);
}
