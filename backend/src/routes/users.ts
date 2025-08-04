import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { db } from '../utils/database';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';
import { config } from '../config';
import { logger } from '../utils/logger';
import { successResponse } from '../utils/response';

const router = Router();

// Get user profile with usage stats
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const user = req.user!;

  logger.debug('User profile request', { 
    userId: user.id, 
    plan: user.plan 
  });

  // Get usage stats
  const usage = await db.select({
    storageUsed: users.storageUsed,
    filesCount: users.filesCount,
  })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  logger.debug('Usage stats retrieved', { 
    userId: user.id, 
    usage: usage[0] 
  });

  // Get plan quotas
  const userPlan = user.plan as keyof typeof config.quotas;
  const quotas = config.quotas[userPlan];

  logger.debug('Plan quotas retrieved', { 
    userId: user.id, 
    plan: userPlan, 
    quotas 
  });

  successResponse(res, {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      plan: user.plan,
      storageUsed: usage[0]?.storageUsed || 0,
      filesCount: usage[0]?.filesCount || 0,
      createdAt: user.createdAt,
    },
    quotas,
  });
}));

// Update user plan
router.patch('/plan', authenticate, asyncHandler(async (req, res) => {
  const { plan } = req.body;
  const currentPlan = req.user!.plan;

  if (!['free', 'pro', 'business'].includes(plan)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid plan' },
    });
  }

  // Update user plan
  const updatedUser = await db.update(users)
    .set({
      plan,
      updatedAt: new Date(),
    })
    .where(eq(users.id, req.user!.id))
    .returning();

  // Record metrics
  // planUpgrades.labels(currentPlan, plan).inc(); // This line was removed as per the new_code

  res.json({
    success: true,
    data: {
      user: updatedUser[0],
    },
  });
}));

// Get user statistics
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  // This would typically aggregate from the analytics_summary table
  // For now, we'll return basic stats
  const fileStats = await db.select({
    totalFiles: users.filesCount, // Changed from files.size to users.filesCount
    totalSize: users.storageUsed, // Changed from files.size to users.storageUsed
  })
    .from(users)
    .where(eq(users.id, userId));

  res.json({
    success: true,
    data: {
      files: {
        total: fileStats[0]?.totalFiles || 0,
        totalSize: fileStats[0]?.totalSize || 0,
      },
      // Add more stats as needed
    },
  });
}));

export default router;