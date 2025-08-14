import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { CustomError, asyncHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const router: Router = Router();

// Temporarily disable all plan upgrades
router.post(
  "/plan",
  authenticate,
  asyncHandler(async (_req, _res) => {
    throw new CustomError(
      "Plan upgrades are temporarily disabled. Premium plans coming soon!",
      503,
    );
  }),
);

// Get available plans
router.get("/plans", async (req, res) => {
  try {
    const plans = {
      available: ["free", "starter", "pro", "business"] as const,
      coming_soon: [] as const,
      current_plan: "free" as const, // This will be updated based on user's actual plan
    };

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    logger.error("Failed to get plans:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get plans",
    });
  }
});

export default router;
