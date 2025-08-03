import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { db } from '../utils/database';
import { users, files } from '../models/schema';
import { eq, sql } from 'drizzle-orm';
import { config } from '../config';
import { planUpgrades } from '../middleware/metrics';

const router = Router();

// Get user profile with usage stats
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const user = req.user!;

  // Get current usage stats
  const usage = await db.select({
    filesCount: sql<number>`COUNT(${files.id})`,
    storageUsed: sql<number>`SUM(${files.size})`,
  })
    .from(files)
    .where(eq(files.userId, user.id));

  const quotas = config.quotas[user.plan as keyof typeof config.quotas];

  res.json({
    success: true,
    data: {
      user: {
        ...user,
        filesCount: usage[0]?.filesCount || 0,
        storageUsed: usage[0]?.storageUsed || 0,
      },
      quotas: {
        storage: quotas.storage,
        fileCount: quotas.fileCount,
        fileSize: quotas.fileSize,
      },
      usage: {
        storagePercent: ((usage[0]?.storageUsed || 0) / quotas.storage) * 100,
        filesPercent: quotas.fileCount === -1 ? 0 : ((usage[0]?.filesCount || 0) / quotas.fileCount) * 100,
      },
    },
  });
}));

// Update user plan
router.patch('/plan', authenticate, asyncHandler(async (req, res) => {
  const { plan } = req.body;
  const currentPlan = req.user!.plan;

  if (!['free', 'pro', 'team'].includes(plan)) {
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
  planUpgrades.labels(currentPlan, plan).inc();

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
    totalFiles: sql<number>`COUNT(*)`,
    totalSize: sql<number>`SUM(${files.size})`,
  })
    .from(files)
    .where(eq(files.userId, userId));

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