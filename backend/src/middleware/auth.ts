import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/express';
import { config } from '../config';
import { CustomError } from './errorHandler';
import { db } from '../utils/database';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: number;
        clerkId: string;
        email: string;
        firstName?: string;
        lastName?: string;
        plan: string;
        storageUsed: number;
        filesCount: number;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new CustomError('Authentication token required', 401);
    }

    // Verify token with Clerk
    const payload = await clerkClient.verifyToken(token);

    if (!payload.sub) {
      throw new CustomError('Invalid token', 401);
    }

    req.userId = payload.sub;

    // Get user from database
    const userRecord = await db.select()
      .from(users)
      .where(eq(users.clerkId, payload.sub))
      .limit(1);

    if (userRecord.length === 0) {
      // Create user if doesn't exist (first time login)
      const email = payload.email as string;
      const firstName = payload.firstName as string;
      const lastName = payload.lastName as string;

      const newUser = await db.insert(users)
        .values({
          clerkId: payload.sub,
          email,
          firstName,
          lastName,
          plan: 'free',
        })
        .returning();

      req.user = newUser[0];
      logger.info(`Created new user: ${email}`);
    } else {
      req.user = userRecord[0];
    }

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(new CustomError('Authentication failed', 401));
  }
};

// Optional authentication - for routes that work with or without auth
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
              const payload = await clerkClient.verifyToken(token);

      if (payload.sub) {
        req.userId = payload.sub;

        const userRecord = await db.select()
          .from(users)
          .where(eq(users.clerkId, payload.sub))
          .limit(1);

        if (userRecord.length > 0) {
          req.user = userRecord[0];
        }
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on auth errors
    logger.debug('Optional auth failed:', error);
    next();
  }
};

// Check if user has a specific plan
export const requirePlan = (requiredPlan: 'free' | 'pro' | 'team') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError('Authentication required', 401));
    }

    const planHierarchy = { free: 0, pro: 1, team: 2 };
    const userPlanLevel = planHierarchy[req.user.plan as keyof typeof planHierarchy];
    const requiredPlanLevel = planHierarchy[requiredPlan];

    if (userPlanLevel < requiredPlanLevel) {
      return next(new CustomError(`${requiredPlan} plan required`, 403));
    }

    next();
  };
};