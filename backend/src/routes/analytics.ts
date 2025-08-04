import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { db } from '../utils/database';
import { 
  files, 
  shareLinks, 
  viewSessions, 
  pageViews, 
  emailCaptures, 
  analyticsSummary 
} from '../models/schema';
import { eq, and, desc, gte, sql, inArray, or, isNotNull, lt, isNull, gt } from 'drizzle-orm';
import { validateQuery } from '../middleware/validation';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';
import { Request, Response } from 'express';
import { CacheService, redis } from '../utils/redis';

const router = Router();

// Get file analytics
router.get('/files/:fileId', authenticate, asyncHandler(async (req: any, res: any) => {
  const fileId = parseInt(req.params.fileId);
  const { startDate, endDate } = req.query;

  // Verify file ownership
  const file = await db.select()
    .from(files)
    .where(and(
      eq(files.id, fileId),
      eq(files.userId, req.user!.id)
    ))
    .limit(1);

  if (file.length === 0) {
    throw new CustomError('File not found', 404);
  }

  // Date range filters
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const end = endDate ? new Date(endDate as string) : new Date();

  // Get all share links for this file
  const fileShareLinks = await db.select()
    .from(shareLinks)
    .where(eq(shareLinks.fileId, fileId));

  const shareIds = fileShareLinks.map(link => link.shareId);

  if (shareIds.length === 0) {
    return res.json({
      success: true,
      data: {
        totalViews: 0,
        uniqueViews: 0,
        totalDuration: 0,
        avgDuration: 0,
        emailCaptures: 0,
        viewsOverTime: [],
        topCountries: [],
        topDevices: [],
        topReferers: [],
        pageAnalytics: [],
      },
    });
  }

  // Basic stats
  const basicStats = await db.select({
    totalViews: sql<number>`COUNT(*)`,
    uniqueViews: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
    totalDuration: sql<number>`SUM(${viewSessions.totalDuration})`,
    avgDuration: sql<number>`AVG(${viewSessions.totalDuration})`,
  })
    .from(viewSessions)
    .where(and(
      sql`${viewSessions.shareId} = ANY(${shareIds})`,
      gte(viewSessions.startedAt, start)
    ));

  // Email captures count
  const emailCapturesCount = await db.select({
    count: sql<number>`COUNT(*)`,
  })
    .from(emailCaptures)
    .where(and(
      sql`${emailCaptures.shareId} = ANY(${shareIds})`,
      gte(emailCaptures.capturedAt, start)
    ));

  // Views over time (daily breakdown)
  const viewsOverTime = await db.select({
    date: sql<string>`DATE(${viewSessions.startedAt})`,
    views: sql<number>`COUNT(*)`,
    uniqueViews: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
  })
    .from(viewSessions)
    .where(and(
      sql`${viewSessions.shareId} = ANY(${shareIds})`,
      gte(viewSessions.startedAt, start)
    ))
    .groupBy(sql`DATE(${viewSessions.startedAt})`)
    .orderBy(sql`DATE(${viewSessions.startedAt})`);

  // Top countries
  const topCountries = await db.select({
    country: viewSessions.country,
    count: sql<number>`COUNT(*)`,
  })
    .from(viewSessions)
    .where(and(
      sql`${viewSessions.shareId} = ANY(${shareIds})`,
      gte(viewSessions.startedAt, start)
    ))
    .groupBy(viewSessions.country)
    .orderBy(desc(sql<number>`COUNT(*)`))
    .limit(10);

  // Top devices
  const topDevices = await db.select({
    device: viewSessions.device,
    count: sql<number>`COUNT(*)`,
  })
    .from(viewSessions)
    .where(and(
      sql`${viewSessions.shareId} = ANY(${shareIds})`,
      gte(viewSessions.startedAt, start)
    ))
    .groupBy(viewSessions.device)
    .orderBy(desc(sql<number>`COUNT(*)`))
    .limit(10);

  // Top referers
  const topReferers = await db.select({
    referer: viewSessions.referer,
    count: sql<number>`COUNT(*)`,
  })
    .from(viewSessions)
    .where(and(
      sql`${viewSessions.shareId} = ANY(${shareIds})`,
      gte(viewSessions.startedAt, start)
    ))
    .groupBy(viewSessions.referer)
    .orderBy(desc(sql<number>`COUNT(*)`))
    .limit(10);

  // Page-level analytics
  const pageAnalytics = await db.select({
    pageNumber: pageViews.pageNumber,
    views: sql<number>`COUNT(*)`,
    avgDuration: sql<number>`AVG(${pageViews.duration})`,
    avgScrollDepth: sql<number>`AVG(${pageViews.scrollDepth})`,
  })
    .from(pageViews)
    .innerJoin(viewSessions, eq(pageViews.sessionId, viewSessions.sessionId))
    .where(and(
      sql`${viewSessions.shareId} = ANY(${shareIds})`,
      gte(viewSessions.startedAt, start)
    ))
    .groupBy(pageViews.pageNumber)
    .orderBy(pageViews.pageNumber);

  res.json({
    success: true,
    data: {
      totalViews: basicStats[0]?.totalViews || 0,
      uniqueViews: basicStats[0]?.uniqueViews || 0,
      totalDuration: basicStats[0]?.totalDuration || 0,
      avgDuration: Math.round(basicStats[0]?.avgDuration || 0),
      emailCaptures: emailCapturesCount[0]?.count || 0,
      viewsOverTime: viewsOverTime.map(row => ({
        date: row.date,
        views: row.views,
        uniqueViews: row.uniqueViews,
      })),
      topCountries: topCountries.filter(row => row.country).map(row => ({
        country: row.country!,
        count: row.count,
      })),
      topDevices: topDevices.filter(row => row.device).map(row => ({
        device: row.device!,
        count: row.count,
      })),
      topReferers: topReferers.filter(row => row.referer).map(row => ({
        referer: row.referer!,
        count: row.count,
      })),
      pageAnalytics: pageAnalytics.map(row => ({
        pageNumber: row.pageNumber,
        views: row.views,
        avgDuration: Math.round(row.avgDuration || 0),
        avgScrollDepth: Math.round(row.avgScrollDepth || 0),
      })),
    },
  });
}));

// Get analytics dashboard data
router.get('/dashboard', authenticate, validateQuery(z.object({
  days: z.number().int().min(1).max(365).optional().default(30),
})), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const days = parseInt(req.query['days'] as string) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  logger.debug('Analytics dashboard request', { 
    userId, 
    days, 
    startDate: startDate.toISOString() 
  });

  // Cache key based on user and time range
  const cacheKey = `dashboard:${userId}:${days}d`;
  const CACHE_TTL = 300; // 5 minutes

  try {
    // Try to get cached data first
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      logger.debug('Dashboard data served from cache', { userId, days });
      return successResponse(res, cachedData);
    }

    logger.debug('Cache miss, calculating dashboard data', { userId, days });
    // Single optimized query to get all dashboard data
    const dashboardData = await db.select({
      // File counts
      totalFiles: sql<number>`COUNT(DISTINCT ${files.id})`,
      
      // View statistics (from actual view sessions, not counters)
      totalViews: sql<number>`COUNT(${viewSessions.id})`,
      totalUniqueViews: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
      totalDuration: sql<number>`COALESCE(SUM(${viewSessions.totalDuration}), 0)`,
      avgDuration: sql<number>`COALESCE(AVG(${viewSessions.totalDuration}), 0)`,
      
      // Email captures
      emailCaptures: sql<number>`COUNT(DISTINCT ${emailCaptures.id})`,
    })
      .from(files)
      .leftJoin(shareLinks, and(
        eq(files.id, shareLinks.fileId),
        eq(shareLinks.isActive, true), // Only active share links
        or(
          isNull(shareLinks.expiresAt),
          gt(shareLinks.expiresAt, new Date()) // Not expired
        )
      ))
      .leftJoin(viewSessions, and(
        eq(shareLinks.shareId, viewSessions.shareId),
        gte(viewSessions.startedAt, startDate)
      ))
      .leftJoin(emailCaptures, and(
        eq(shareLinks.shareId, emailCaptures.shareId),
        gte(emailCaptures.capturedAt, startDate)
      ))
      .where(eq(files.userId, userId));

    const stats = dashboardData[0];

    // Get recent views (last 5)
    const recentViews = await db.select({
      id: viewSessions.id,
      shareId: viewSessions.shareId,
      viewerEmail: viewSessions.viewerEmail,
      viewerName: viewSessions.viewerName,
      country: viewSessions.country,
      city: viewSessions.city,
      device: viewSessions.device,
      browser: viewSessions.browser,
      os: viewSessions.os,
      startedAt: viewSessions.startedAt,
      totalDuration: viewSessions.totalDuration,
      isUnique: viewSessions.isUnique,
    })
      .from(viewSessions)
      .innerJoin(shareLinks, eq(viewSessions.shareId, shareLinks.shareId))
      .innerJoin(files, and(
        eq(shareLinks.fileId, files.id),
        eq(files.userId, userId)
      ))
      .where(and(
        gte(viewSessions.startedAt, startDate),
        eq(shareLinks.isActive, true),
        or(
          isNull(shareLinks.expiresAt),
          gt(shareLinks.expiresAt, new Date())
        )
      ))
      .orderBy(desc(viewSessions.startedAt))
      .limit(5);

    // Get top files by actual view count (not counter)
    const topFiles = await db.select({
      fileId: files.id,
      title: files.title,
      originalName: files.originalName,
      viewCount: sql<number>`COUNT(${viewSessions.id})`,
      uniqueViewCount: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
      totalDuration: sql<number>`COALESCE(SUM(${viewSessions.totalDuration}), 0)`,
    })
      .from(files)
      .leftJoin(shareLinks, and(
        eq(files.id, shareLinks.fileId),
        eq(shareLinks.isActive, true),
        or(
          isNull(shareLinks.expiresAt),
          gt(shareLinks.expiresAt, new Date())
        )
      ))
      .leftJoin(viewSessions, and(
        eq(shareLinks.shareId, viewSessions.shareId),
        gte(viewSessions.startedAt, startDate)
      ))
      .where(eq(files.userId, userId))
      .groupBy(files.id)
      .orderBy(desc(sql`COUNT(${viewSessions.id})`))
      .limit(5);

    // Get views by day for the last 30 days
    const viewsByDay = await db.select({
      date: sql<string>`DATE(${viewSessions.startedAt})`,
      views: sql<number>`COUNT(${viewSessions.id})`,
      uniqueViews: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
    })
      .from(viewSessions)
      .innerJoin(shareLinks, eq(viewSessions.shareId, shareLinks.shareId))
      .innerJoin(files, and(
        eq(shareLinks.fileId, files.id),
        eq(files.userId, userId)
      ))
      .where(and(
        gte(viewSessions.startedAt, startDate),
        eq(shareLinks.isActive, true),
        or(
          isNull(shareLinks.expiresAt),
          gt(shareLinks.expiresAt, new Date())
        )
      ))
      .groupBy(sql`DATE(${viewSessions.startedAt})`)
      .orderBy(sql`DATE(${viewSessions.startedAt})`);

    logger.debug('Dashboard analytics calculated', { 
      userId,
      totalFiles: stats?.totalFiles,
      totalViews: stats?.totalViews,
      totalUniqueViews: stats?.totalUniqueViews,
      recentViewsCount: recentViews.length,
      topFilesCount: topFiles.length,
      viewsByDayCount: viewsByDay.length
    });

    const responseData = {
      totalFiles: Number(stats?.totalFiles) || 0,
      totalViews: Number(stats?.totalViews) || 0,
      totalUniqueViews: Number(stats?.totalUniqueViews) || 0,
      totalDuration: Number(stats?.totalDuration) || 0,
      avgDuration: Math.round(Number(stats?.avgDuration) || 0),
      emailCaptures: Number(stats?.emailCaptures) || 0,
      recentViews,
      topFiles,
      viewsByDay,
    };

    // Cache the calculated data
    await CacheService.set(cacheKey, responseData, CACHE_TTL);
    logger.debug('Dashboard data cached', { userId, days, cacheKey });

    successResponse(res, responseData);

  } catch (error) {
    logger.error('Dashboard analytics calculation failed', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return safe fallback data
    successResponse(res, {
      totalFiles: 0,
      totalViews: 0,
      totalUniqueViews: 0,
      totalDuration: 0,
      avgDuration: 0,
      emailCaptures: 0,
      recentViews: [],
      topFiles: [],
      viewsByDay: [],
    });
  }
}));

// Get share link analytics
router.get('/shares/:shareId', authenticate, asyncHandler(async (req: any, res: any) => {
  const { shareId } = req.params;

  // Verify ownership
  const shareLink = await db.select()
    .from(shareLinks)
    .innerJoin(files, eq(shareLinks.fileId, files.id))
    .where(and(
      eq(shareLinks.shareId, shareId),
      eq(files.userId, req.user!.id)
    ))
    .limit(1);

  if (shareLink.length === 0) {
    throw new CustomError('Share link not found', 404);
  }

  // Get detailed analytics for this share link
  const sessions = await db.select({
    sessionId: viewSessions.sessionId,
    viewerEmail: viewSessions.viewerEmail,
    viewerName: viewSessions.viewerName,
    startedAt: viewSessions.startedAt,
    totalDuration: viewSessions.totalDuration,
    country: viewSessions.country,
    device: viewSessions.device,
    browser: viewSessions.browser,
    referer: viewSessions.referer,
  })
    .from(viewSessions)
    .where(eq(viewSessions.shareId, shareId))
    .orderBy(desc(viewSessions.startedAt));

  res.json({
    success: true,
    data: {
      shareLink: shareLink[0]?.share_links,
      file: shareLink[0]?.files,
      sessions,
    },
  });
}));

// Generate daily analytics summary
router.post('/summary/generate', authenticate, asyncHandler(async (req: any, res: any) => {
  const userId = req.user!.id;
  const { date } = req.body; // YYYY-MM-DD format
  
  if (!date) {
    throw new CustomError('Date parameter required', 400);
  }

  const startDate = new Date(date);
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

  // Get user's files
  const userFiles = await db.select()
    .from(files)
    .where(eq(files.userId, userId));

  if (userFiles.length === 0) {
    return res.json({
      success: true,
      message: 'No files to summarize',
    });
  }

  const fileIds = userFiles.map(f => f.id);

  // Get share links for user's files
  const userShareLinks = await db.select()
    .from(shareLinks)
    .where(inArray(shareLinks.fileId, fileIds));

  const shareIds = userShareLinks.map(link => link.shareId);

  if (shareIds.length === 0) {
    return res.json({
      success: true,
      message: 'No share links to summarize',
    });
  }

  // Generate summary for each file
  for (const fileId of fileIds) {
    const fileShareIds = userShareLinks
      .filter(link => link.fileId === fileId)
      .map(link => link.shareId);

    if (fileShareIds.length === 0) continue;

    // Get daily stats for this file
    const dailyStats = await db.select({
      totalViews: sql<number>`COUNT(*)`,
      uniqueViews: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
      totalDuration: sql<number>`SUM(${viewSessions.totalDuration})`,
      avgDuration: sql<number>`AVG(${viewSessions.totalDuration})`,
      emailCaptures: sql<number>`COUNT(DISTINCT ${emailCaptures.id})`,
    })
      .from(viewSessions)
      .leftJoin(emailCaptures, and(
        eq(viewSessions.shareId, emailCaptures.shareId),
        gte(emailCaptures.capturedAt, startDate),
        lt(emailCaptures.capturedAt, endDate)
      ))
      .where(and(
        inArray(viewSessions.shareId, fileShareIds),
        gte(viewSessions.startedAt, startDate),
        lt(viewSessions.startedAt, endDate)
      ));

    const stats = dailyStats[0];

    // Get geographic and device data
    const geoData = await db.select({
      country: viewSessions.ipAddressCountry,
      count: sql<number>`COUNT(*)`,
    })
      .from(viewSessions)
      .where(and(
        inArray(viewSessions.shareId, fileShareIds),
        gte(viewSessions.startedAt, startDate),
        lt(viewSessions.startedAt, endDate),
        isNotNull(viewSessions.ipAddressCountry)
      ))
      .groupBy(viewSessions.ipAddressCountry);

    const countries = geoData.reduce((acc, row) => {
      acc[row.country!] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Upsert summary
    await db.insert(analyticsSummary).values({
      fileId,
      date,
      totalViews: stats?.totalViews || 0,
      uniqueViews: stats?.uniqueViews || 0,
      totalDuration: stats?.totalDuration || 0,
      avgDuration: Math.round(stats?.avgDuration || 0),
      emailCaptures: stats?.emailCaptures || 0,
      countries,
      devices: {}, // TODO: Add device tracking
      referers: {}, // TODO: Add referer tracking
    })
      .onConflictDoUpdate({
        target: [analyticsSummary.fileId, analyticsSummary.date],
        set: {
          totalViews: stats?.totalViews || 0,
          uniqueViews: stats?.uniqueViews || 0,
          totalDuration: stats?.totalDuration || 0,
          avgDuration: Math.round(stats?.avgDuration || 0),
          emailCaptures: stats?.emailCaptures || 0,
          countries,
          updatedAt: new Date(),
        },
      });
  }

  res.json({
    success: true,
    message: `Analytics summary generated for ${date}`,
  });
}));

// Cache invalidation helpers
export async function invalidateUserDashboardCache(userId: number): Promise<void> {
  try {
    // Get all cache keys for this user's dashboard
    const keys = await redis.keys(`dashboard:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(keys);
      logger.debug('Invalidated dashboard cache for user', { userId, keysCount: keys.length });
    }
  } catch (error) {
    logger.error('Failed to invalidate dashboard cache', { userId, error });
  }
}

export async function invalidateAllDashboardCache(): Promise<void> {
  try {
    const keys = await redis.keys('dashboard:*');
    if (keys.length > 0) {
      await redis.del(keys);
      logger.debug('Invalidated all dashboard cache', { keysCount: keys.length });
    }
  } catch (error) {
    logger.error('Failed to invalidate all dashboard cache', { error });
  }
}

export default router;