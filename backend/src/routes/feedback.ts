import { Router } from "express";
import { z } from "zod";
import { db } from "../utils/database";
import { feedback, users } from "../models/schema";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { logger } from "../utils/logger";
import { eq, and, gte, sql } from "drizzle-orm";

const router: Router = Router();

// Feedback submission schema
const feedbackSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000, "Message too long"),
  rating: z.number().min(1).max(5).optional(),
  category: z.enum(["bug", "feature", "general", "improvement"]).optional(),
});

// Rate limiting: 1 feedback per 5 minutes per user
const RATE_LIMIT_MINUTES = 5;

// Submit feedback
router.post(
  "/",
  authenticate,
  validateBody(feedbackSchema),
  async (req, res) => {
    try {
      const { message, rating, category } = req.body;
      const userId = req.user!.id;

      // Check rate limit - find recent feedback from this user
      const fiveMinutesAgo = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000);
      
      const recentFeedback = await db
        .select()
        .from(feedback)
        .where(
          and(
            eq(feedback.userId, userId),
            gte(feedback.createdAt, fiveMinutesAgo)
          )
        )
        .limit(1);

      if (recentFeedback.length > 0) {
        const lastFeedback = recentFeedback[0];
        const timeSinceLastFeedback = Date.now() - lastFeedback.createdAt.getTime();
        const remainingMinutes = Math.ceil((RATE_LIMIT_MINUTES * 60 * 1000 - timeSinceLastFeedback) / (60 * 1000));
        
        return res.status(429).json({
          error: "Rate limit exceeded",
          message: `You can submit feedback once every ${RATE_LIMIT_MINUTES} minutes. Please try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
          retryAfter: remainingMinutes * 60, // seconds
        });
      }

      // Insert feedback
      const [newFeedback] = await db
        .insert(feedback)
        .values({
          userId,
          message,
          rating,
          category,
        })
        .returning();

      logger.info("Feedback submitted", {
        userId,
        feedbackId: newFeedback.id,
        category,
        hasRating: !!rating,
      });

      return res.status(201).json({
        success: true,
        message: "Feedback submitted successfully",
        feedback: {
          id: newFeedback.id,
          message: newFeedback.message,
          rating: newFeedback.rating,
          category: newFeedback.category,
          createdAt: newFeedback.createdAt,
        },
      });
    } catch (error) {
      logger.error("Error submitting feedback", { error, userId: req.user?.id });
      return res.status(500).json({
        error: "Internal server error",
        message: "Failed to submit feedback",
      });
    }
  }
);

// Get user's feedback history (for display purposes)
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const userFeedback = await db
      .select({
        id: feedback.id,
        message: feedback.message,
        rating: feedback.rating,
        category: feedback.category,
        status: feedback.status,
        createdAt: feedback.createdAt,
      })
      .from(feedback)
      .where(eq(feedback.userId, userId))
      .orderBy(feedback.createdAt)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(feedback)
      .where(eq(feedback.userId, userId));

    return res.json({
      success: true,
      feedback: userFeedback,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching user feedback", { error, userId: req.user?.id });
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch feedback history",
    });
  }
});

// Get feedback rate limit status
router.get("/rate-limit", authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const fiveMinutesAgo = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000);
    
    const recentFeedback = await db
      .select()
      .from(feedback)
      .where(
        and(
          eq(feedback.userId, userId),
          gte(feedback.createdAt, fiveMinutesAgo)
        )
      )
      .limit(1);

    if (recentFeedback.length === 0) {
      return res.json({
        canSubmit: true,
        remainingTime: 0,
      });
    }

    const lastFeedback = recentFeedback[0];
    const timeSinceLastFeedback = Date.now() - lastFeedback.createdAt.getTime();
    const remainingTime = Math.max(0, RATE_LIMIT_MINUTES * 60 * 1000 - timeSinceLastFeedback);
    const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));

    return res.json({
      canSubmit: false,
      remainingTime,
      remainingMinutes,
      lastSubmitted: lastFeedback.createdAt,
    });
  } catch (error) {
    logger.error("Error checking rate limit", { error, userId: req.user?.id });
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to check rate limit",
    });
  }
});

export default router;
