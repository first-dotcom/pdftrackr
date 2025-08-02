import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/express';
import { config } from '../config';
import { CustomError } from './errorHandler';
import { db } from '../utils/database';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { CacheService } from '../utils/redis';

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

    // Check token expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      logger.warn('Expired token used', { userId: payload.sub, ip: req.ip });
      throw new CustomError('Token expired', 401);
    }

    // Check for suspicious activity patterns
    await checkSuspiciousActivity(req, payload.sub);

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

// Check for suspicious activity patterns
const checkSuspiciousActivity = async (req: Request, userId: string) => {
  const ip = req.ip;
  const userAgent = req.get('User-Agent');
  const key = `auth_attempts:${ip}:${userId}`;
  
  try {
    // Track authentication attempts
    const attempts = await CacheService.get(key);
    const attemptCount = attempts ? parseInt(attempts) : 0;
    
    // Log unusual patterns
    if (attemptCount > 10) {
      logger.warn('High authentication frequency detected', {
        userId,
        ip,
        attempts: attemptCount,
        userAgent
      });
    }
    
    // Increment counter
    await CacheService.setex(key, 3600, (attemptCount + 1).toString()); // 1 hour TTL
    
    // Check for multiple IPs per user (potential account sharing/compromise)
    const userIpKey = `user_ips:${userId}`;
    const userIps = await CacheService.get(userIpKey);
    
    if (userIps) {
      const ips = JSON.parse(userIps);
      if (!ips.includes(ip)) {
        ips.push(ip);
        if (ips.length > 5) { // More than 5 different IPs in short time
          logger.warn('Multiple IP addresses detected for user', {
            userId,
            ips: ips.length,
            currentIp: ip
          });
        }
        await CacheService.setex(userIpKey, 86400, JSON.stringify(ips)); // 24 hours
      }
    } else {
      await CacheService.setex(userIpKey, 86400, JSON.stringify([ip]));
    }
    
  } catch (error) {
    // Don't fail auth if Redis is down, just log
    logger.error('Failed to check suspicious activity', { error, userId, ip });
  }
};