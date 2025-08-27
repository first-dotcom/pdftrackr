import { clerkClient, verifyToken } from "@clerk/express";
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config";
import { users } from "../models/schema";
import { db } from "../utils/database";
import { logger } from "../utils/logger";
import { getCache, setCache } from "../utils/redis";
import { CustomError } from "./errorHandler";
import { UserPlan, planHierarchy } from "@/shared/types";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?:
                  | {
              id: number;
              clerkId: string;
              email: string;
              firstName: string | null;
              lastName: string | null;
              plan: UserPlan;
              storageUsed: number;
              filesCount: number;
              createdAt: Date;
              updatedAt: Date;
              isAdmin: boolean;
            }
        | undefined;
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    logger.debug("Authentication attempt", {
      hasToken: !!token,
      ip: req.ip,
    });

    if (!token) {
      throw new CustomError("Authentication token required", 401);
    }

    // Verify token with Clerk
    const payload = await verifyToken(token, {
      secretKey: config.clerk.secretKey,
    });

    logger.debug("Token verified successfully", {
      userId: payload.sub,
      ip: req.ip,
    });

    if (!payload.sub) {
      throw new CustomError("Invalid token", 401);
    }

    // Check token expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      logger.warn("Expired token used", { userId: payload.sub, ip: req.ip });
      throw new CustomError("Token expired", 401);
    }

    // Check for suspicious activity patterns
    await checkSuspiciousActivity(req, payload.sub);

    req.userId = payload.sub;

    // Get user from database
    const userRecord = await db.select().from(users).where(eq(users.clerkId, payload.sub)).limit(1);

    if (userRecord.length === 0) {
      // Create user if doesn't exist (first time login)
      // Fetch user details from Clerk API
      try {
        const clerkUser = await clerkClient.users.getUser(payload.sub);

        const email = clerkUser.emailAddresses?.[0]?.emailAddress;
        const firstName = clerkUser.firstName;
        const lastName = clerkUser.lastName;

        if (!email) {
          throw new CustomError("User email not found in Clerk", 400);
        }

        // Check if user already exists (race condition protection)
        const existingUserCheck = await db.select().from(users).where(eq(users.clerkId, payload.sub)).limit(1);
        
        if (existingUserCheck.length > 0) {
          // User was created by another request while we were fetching from Clerk
          req.user = {
            ...existingUserCheck[0],
            plan: existingUserCheck[0].plan as UserPlan,
            isAdmin: config.admin.emails.includes(existingUserCheck[0].email),
          };
          logger.info("Existing user logged in (race condition)", { email, userId: payload.sub });
        } else {
          // Create new user with transaction
          try {
            const newUser = await db.transaction(async (tx) => {
              const result = await tx
                .insert(users)
                .values({
                  clerkId: payload.sub,
                  email,
                  firstName: firstName || null,
                  lastName: lastName || null,
                  plan: "free",
                })
                .returning();

              return result[0];
            });

            req.user = {
              ...newUser,
              plan: newUser.plan as UserPlan,
              isAdmin: config.admin.emails.includes(newUser.email),
            };
            logger.info("New user created", { email, userId: payload.sub });
          } catch (dbError) {
            // Handle potential unique constraint violation (race condition)
            if (dbError instanceof Error && 
                (dbError.message.includes('unique constraint') || 
                 dbError.message.includes('duplicate key'))) {
              // User was created by another request, fetch the existing user
              const existingUser = await db.select().from(users).where(eq(users.clerkId, payload.sub)).limit(1);
              if (existingUser.length > 0) {
                req.user = {
                  ...existingUser[0],
                  plan: existingUser[0].plan as UserPlan,
                  isAdmin: config.admin.emails.includes(existingUser[0].email),
                };
                logger.info("User created by another request (race condition handled)", { email, userId: payload.sub });
              } else {
                throw new CustomError("Failed to create user account", 500);
              }
            } else {
              throw dbError;
            }
          }
        }
      } catch (clerkError) {
        logger.error("Failed to fetch user from Clerk", {
          message: clerkError instanceof Error ? clerkError.message : String(clerkError),
          stack: clerkError instanceof Error ? clerkError.stack : undefined,
          userId: payload.sub,
        });
        throw new CustomError("Failed to create user account", 500);
      }
    } else {
      const user = userRecord[0];
      if (user) {
        req.user = {
          ...user,
          plan: user.plan as UserPlan,
          isAdmin: config.admin.emails.includes(user.email),
        };
      } else {
        throw new CustomError("User not found", 404);
      }
    }

    next();
  } catch (error) {
    logger.error("Authentication error", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip,
    });
    next(new CustomError("Authentication failed", 401));
  }
};

// Optional authentication - for routes that work with or without auth
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const payload = await verifyToken(token, {
        secretKey: config.clerk.secretKey,
      });

      if (payload.sub) {
        req.userId = payload.sub;

        const userRecord = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, payload.sub))
          .limit(1);

        if (userRecord.length > 0) {
          const user = userRecord[0];
          if (user) {
            req.user = {
              ...user,
              plan: user.plan as UserPlan,
              isAdmin: config.admin.emails.includes(user.email),
            };
          }
        }
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on auth errors
    logger.debug("Optional auth failed:", error);
    next();
  }
};

// Check if user has a specific plan
export const requirePlan = (requiredPlan: UserPlan) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError("Authentication required", 401));
    }

    const userPlanLevel = planHierarchy[req.user.plan];
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
  const userAgent = req.get("User-Agent");
  const key = `auth_attempts:${ip}:${userId}`;

  try {
    // Track authentication attempts
    const attempts = await getCache<string>(key);
    const attemptCount = attempts ? parseInt(attempts) : 0;

    // Only log warnings for very high frequency (reduced from 10 to 50)
    if (attemptCount > 50) {
      logger.warn("High authentication frequency detected", {
        userId,
        ip,
        attempts: attemptCount,
        userAgent,
      });
    }

    // Increment counter with shorter TTL to reduce false positives
    await setCache(key, (attemptCount + 1).toString(), 1800); // 30 minutes TTL (reduced from 1 hour)

    // Check for multiple IPs per user (potential account sharing/compromise)
    const userIpKey = `user_ips:${userId}`;
    const userIps = await getCache<string>(userIpKey);

    if (userIps) {
      const ips = JSON.parse(userIps);
      if (!ips.includes(ip)) {
        ips.push(ip);
        if (ips.length > 5) {
          // More than 5 different IPs in short time
          logger.warn("Multiple IP addresses detected for user", {
            userId,
            ips: ips.length,
            currentIp: ip,
          });
        }
        await setCache(userIpKey, JSON.stringify(ips), 86400); // 24 hours
      }
    } else {
      await setCache(userIpKey, JSON.stringify([ip]), 86400);
    }
  } catch (error) {
    // Don't fail auth if Redis is down, just log
    logger.error("Failed to check suspicious activity", { error, userId, ip });
  }
};
