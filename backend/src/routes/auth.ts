import { eq } from "drizzle-orm";
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { userRegistrations } from "../middleware/metrics";
import { verifyClerkWebhook } from "../middleware/security";
import { validateBody } from "../middleware/validation";
import { users } from "../models/schema";
import { db } from "../utils/database";
import { updateProfileSchema } from "../utils/validation";

const router: Router = Router();

// Get current user profile
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  }),
);

// Update user profile
router.patch(
  "/me",
  authenticate,
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const { firstName, lastName } = req.body;

    const updatedUser = await db
      .update(users)
      .set({
        firstName,
        lastName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user?.id))
      .returning();

    res.json({
      success: true,
      data: {
        user: updatedUser[0],
      },
    });
  }),
);

// Webhook endpoint for Clerk user events
router.post(
  "/webhook",
  verifyClerkWebhook,
  asyncHandler(async (req, res) => {
    const { type, data } = req.body;

    switch (type) {
      case "user.created": {
        // User created via Clerk dashboard or direct signup
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, data.id))
          .limit(1);

        if (existingUser.length === 0) {
          // Use transaction for user creation
          await db.transaction(async (tx) => {
            await tx.insert(users).values({
              clerkId: data.id,
              email: data.email_addresses[0]?.email_address,
              firstName: data.first_name,
              lastName: data.last_name,
              plan: "free",
            });
          });

          userRegistrations.labels("free").inc();
        }
        break;
      }

      case "user.updated":
        // Update user data when changed in Clerk
        await db
          .update(users)
          .set({
            email: data.email_addresses[0]?.email_address,
            firstName: data.first_name,
            lastName: data.last_name,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, data.id));
        break;

      case "user.deleted":
        // Handle user deletion
        await db.delete(users).where(eq(users.clerkId, data.id));
        break;
    }

    res.json({ success: true });
  }),
);

export default router;
