import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { db } from '../utils/database';
import { users, files } from '../models/schema';
import { eq, and, sql } from 'drizzle-orm';
import { config } from '../config';
import { logger } from '../utils/logger';
import { successResponse } from '../utils/response';
import { CacheService } from '../utils/redis';
import { invalidateUserDashboardCache } from './analytics';

const router = Router();

// Get user profile with usage stats
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const user = req.user!;

  logger.debug('User profile request', { 
    userId: user.id, 
    plan: user.plan 
  });

  // Cache key for user profile data
  const cacheKey = `user_profile:${user.id}`;
  const CACHE_TTL = 300; // 5 minutes

  try {
    // Try to get cached data first
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      logger.debug('User profile data served from cache', { userId: user.id });
      return successResponse(res, cachedData);
    }

    logger.debug('Cache miss, calculating user profile data', { userId: user.id });

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

    const responseData = {
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
    };

    // Cache the calculated data
    await CacheService.set(cacheKey, responseData, CACHE_TTL);
    logger.debug('User profile data cached', { userId: user.id, cacheKey });

    successResponse(res, responseData);

  } catch (error) {
    logger.error('User profile calculation failed', {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return safe fallback data
    successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.plan,
        storageUsed: 0,
        filesCount: 0,
        createdAt: user.createdAt,
      },
      quotas: config.quotas[user.plan as keyof typeof config.quotas],
    });
  }
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

// Background job: Reconcile storage usage (call periodically)
router.post('/reconcile-storage', authenticate, asyncHandler(async (req, res) => {
  // This should be called by a cron job, not directly by users
  // For now, we'll add basic admin check
  if (req.user!.plan !== 'business') {
    return res.status(403).json({
      success: false,
      error: { message: 'Admin access required' },
    });
  }

  try {
    // Calculate actual storage usage from files table
    const actualUsage = await db.select({
      userId: files.userId,
      actualStorageUsed: sql<number>`COALESCE(SUM(${files.size}), 0)`,
      actualFilesCount: sql<number>`COUNT(*)`,
    })
      .from(files)
      .groupBy(files.userId);

    // Update user counters with actual values
    for (const usage of actualUsage) {
      await db.update(users)
        .set({
          storageUsed: usage.actualStorageUsed,
          filesCount: usage.actualFilesCount,
          updatedAt: new Date(),
        })
        .where(eq(users.id, usage.userId));

      // Invalidate caches for this user
      await CacheService.del(`user_profile:${usage.userId}`);
      await invalidateUserDashboardCache(usage.userId);
    }

    logger.info('Storage reconciliation completed', {
      usersUpdated: actualUsage.length,
    });

    successResponse(res, {
      usersUpdated: actualUsage.length,
      message: 'Storage usage reconciled successfully',
    });

  } catch (error) {
    logger.error('Storage reconciliation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return res.status(500).json({
      success: false,
      error: { message: 'Storage reconciliation failed' },
    });
  }
}));

export default router;