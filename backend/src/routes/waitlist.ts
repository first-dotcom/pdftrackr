import { eq, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { CustomError, asyncHandler } from "../middleware/errorHandler";
import { createRateLimit, normalizeIp } from "../middleware/security";
import { validateBody } from "../middleware/validation";
import { waitlist } from "../models/schema";
import { db } from "../utils/database";
import { logger } from "../utils/logger";

const router: Router = Router();

const waitlistSchema = z.object({
  email: z.string().email().max(255),
  plan: z.enum(["pro", "business", "either"]),
  source: z.string().max(100).optional(),
});

// Join waitlist (public endpoint with rate limiting)
router.post(
  "/",
  createRateLimit(60 * 1000, 5, "Too many waitlist requests"),
  validateBody(waitlistSchema),
  normalizeIp,
  asyncHandler(async (req, res) => {
    const { email, plan, source } = req.body;

    try {
      // Check if email already exists
      const existing = await db.select().from(waitlist).where(eq(waitlist.email, email)).limit(1);

      if (existing.length > 0) {
        // Update existing entry with new plan preference
        await db
          .update(waitlist)
          .set({
            plan,
            source: source || "pricing-page",
            updatedAt: new Date(),
          })
          .where(eq(waitlist.email, email));
      } else {
        // Create new waitlist entry
        await db.insert(waitlist).values({
          email,
          plan,
          source: source || "pricing-page",
          ipAddress: req.ip || null,
          userAgent: req.get("User-Agent") || null,
          referer: req.get("Referer") || null,
        });
      }

      logger.info(`Waitlist signup: ${email} for ${plan} plan`);

      res.json({
        success: true,
        message: "Successfully joined waitlist",
      });
    } catch (error) {
      logger.error("Waitlist signup error:", error);
      throw new CustomError("Failed to join waitlist", 500);
    }
  }),
);

// Get waitlist stats (admin only - add auth later)
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const stats = await db
      .select({
        plan: waitlist.plan,
        count: sql<number>`COUNT(*)`,
      })
      .from(waitlist)
      .groupBy(waitlist.plan);

    res.json({
      success: true,
      data: stats,
    });
  }),
);

export default router;
