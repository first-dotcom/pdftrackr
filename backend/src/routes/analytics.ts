import { and, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { CustomError, asyncHandler } from "../middleware/errorHandler";
import { validateQuery } from "../middleware/validation";
import {
  analyticsSummary,
  emailCaptures,
  files,
  pageViews,
  shareLinks,
  viewSessions,
} from "../models/schema";
import { db } from "../utils/database";
import { logger } from "../utils/logger";
import { deleteCache, getCache, getCacheKeys, setCache } from "../utils/redis";
import { successResponse } from "../utils/response";

const router: Router = Router();

// Get file analytics
router.get(
  "/files/:fileId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.params.fileId) {
      throw new CustomError("File ID is required", 400);
    }

    const fileId = parseInt(req.params.fileId);
    const { startDate, endDate } = req.query;

    if (!req.user?.id) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    // Verify file ownership
    const file = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, req.user.id)))
      .limit(1);

    if (file.length === 0) {
      throw new CustomError("File not found", 404);
    }

    // Date range filters
    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const _end = endDate ? new Date(endDate as string) : new Date();

    // Get all share links for this file
    const fileShareLinks = await db.select().from(shareLinks).where(eq(shareLinks.fileId, fileId));

    const shareIds = fileShareLinks.map((link) => link.shareId);

    if (shareIds.length === 0) {
      res.json({
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
      return;
    }

    // Basic stats
    const basicStats = await db
      .select({
        totalViews: sql<number>`COUNT(*)`,
        uniqueViews: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
        totalDuration: sql<number>`SUM(${viewSessions.totalDuration})`,
        avgDuration: sql<number>`AVG(${viewSessions.totalDuration})`,
      })
      .from(viewSessions)
      .where(
        and(inArray(viewSessions.shareId, shareIds), gte(viewSessions.startedAt, start)),
      );

    // Email captures count
    const emailCapturesCount = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(emailCaptures)
      .where(
        and(inArray(emailCaptures.shareId, shareIds), gte(emailCaptures.capturedAt, start)),
      );

    // Views over time (daily breakdown)
    const viewsOverTime = await db
      .select({
        date: sql<string>`DATE(${viewSessions.startedAt})`,
        views: sql<number>`COUNT(*)`,
        uniqueViews: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
      })
      .from(viewSessions)
      .where(
        and(inArray(viewSessions.shareId, shareIds), gte(viewSessions.startedAt, start)),
      )
      .groupBy(sql`DATE(${viewSessions.startedAt})`)
      .orderBy(sql`DATE(${viewSessions.startedAt})`);

    // Top countries
    const topCountries = await db
      .select({
        country: viewSessions.country,
        count: sql<number>`COUNT(*)`,
      })
      .from(viewSessions)
      .where(
        and(inArray(viewSessions.shareId, shareIds), gte(viewSessions.startedAt, start)),
      )
      .groupBy(viewSessions.country)
      .orderBy(desc(sql<number>`COUNT(*)`))
      .limit(10);

    // Top devices
    const topDevices = await db
      .select({
        device: viewSessions.device,
        count: sql<number>`COUNT(*)`,
      })
      .from(viewSessions)
      .where(
        and(inArray(viewSessions.shareId, shareIds), gte(viewSessions.startedAt, start)),
      )
      .groupBy(viewSessions.device)
      .orderBy(desc(sql<number>`COUNT(*)`))
      .limit(10);

    // Top referers
    const topReferers = await db
      .select({
        referer: viewSessions.referer,
        count: sql<number>`COUNT(*)`,
      })
      .from(viewSessions)
      .where(
        and(inArray(viewSessions.shareId, shareIds), gte(viewSessions.startedAt, start)),
      )
      .groupBy(viewSessions.referer)
      .orderBy(desc(sql<number>`COUNT(*)`))
      .limit(10);

    // Page-level analytics
    const pageAnalytics = await db
      .select({
        pageNumber: pageViews.pageNumber,
        views: sql<number>`COUNT(*)`,
        avgDuration: sql<number>`AVG(${pageViews.duration})`,
        avgScrollDepth: sql<number>`AVG(${pageViews.scrollDepth})`,
      })
      .from(pageViews)
      .innerJoin(viewSessions, eq(pageViews.sessionId, viewSessions.sessionId))
      .where(
        and(inArray(viewSessions.shareId, shareIds), gte(viewSessions.startedAt, start)),
      )
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
        viewsOverTime: viewsOverTime.map((row) => ({
          date: row.date,
          views: row.views,
          uniqueViews: row.uniqueViews,
        })),
        topCountries: topCountries
          .filter((row) => row.country)
          .map((row) => ({
            country: row.country || "",
            count: row.count,
          })),
        topDevices: topDevices
          .filter((row) => row.device)
          .map((row) => ({
            device: row.device || "",
            count: row.count,
          })),
        topReferers: topReferers
          .filter((row) => row.referer)
          .map((row) => ({
            referer: row.referer || "",
            count: row.count,
          })),
        pageAnalytics: pageAnalytics.map((row) => ({
          pageNumber: row.pageNumber,
          views: row.views,
          avgDuration: Math.round(row.avgDuration || 0),
          avgScrollDepth: Math.round(row.avgScrollDepth || 0),
        })),
      },
    });
  }),
);

// Get analytics dashboard data
router.get(
  "/dashboard",
  authenticate,
  validateQuery(
    z.object({
      days: z.number().int().min(1).max(365).optional().default(30),
    }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    logger.debug("Analytics dashboard request", {
      userId,
      days,
      startDate: startDate.toISOString(),
    });

    // Cache key based on user and time range
    const cacheKey = `dashboard:${userId}:${days}d`;
    const CACHE_TTL = 60; // 1 minute (reduced for more responsive updates)

    try {
      // Try to get cached data first
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        logger.debug("Dashboard data served from cache", { userId, days });
        return successResponse(res, cachedData);
      }

      logger.debug("Cache miss, calculating dashboard data", { userId, days });
      // Get user's active share links first
      const userShareLinks = await db
        .select({
          shareId: shareLinks.shareId,
        })
        .from(files)
        .innerJoin(
          shareLinks,
          and(
            eq(files.id, shareLinks.fileId),
            eq(shareLinks.isActive, true), // Only active share links
            or(
              isNull(shareLinks.expiresAt),
              gt(shareLinks.expiresAt, new Date()), // Not expired
            ),
          ),
        )
        .where(eq(files.userId, userId));

      const shareIds = userShareLinks.map(link => link.shareId);

      // Get file count
      const fileCount = await db
        .select({
          totalFiles: sql<number>`COUNT(DISTINCT ${files.id})`,
        })
        .from(files)
        .where(eq(files.userId, userId));

      // Get view statistics (separate query to avoid cartesian product)
      const viewStats = shareIds.length > 0 ? await db
        .select({
          totalViews: sql<number>`COUNT(${viewSessions.id})`,
          totalUniqueViews: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
          totalDuration: sql<number>`COALESCE(SUM(${viewSessions.totalDuration}), 0)`,
          avgDuration: sql<number>`COALESCE(AVG(${viewSessions.totalDuration}), 0)`,
        })
        .from(viewSessions)
        .where(
          and(
            inArray(viewSessions.shareId, shareIds),
            gte(viewSessions.startedAt, startDate)
          )
        ) : [{ totalViews: 0, totalUniqueViews: 0, totalDuration: 0, avgDuration: 0 }];

      // Get email captures (separate query to avoid cartesian product)
      const emailStats = shareIds.length > 0 ? await db
        .select({
          emailCaptures: sql<number>`COUNT(DISTINCT ${emailCaptures.id})`,
        })
        .from(emailCaptures)
        .where(
          and(
            inArray(emailCaptures.shareId, shareIds),
            gte(emailCaptures.capturedAt, startDate)
          )
        ) : [{ emailCaptures: 0 }];

      const stats = {
        totalFiles: fileCount[0]?.totalFiles || 0,
        totalViews: viewStats[0]?.totalViews || 0,
        totalUniqueViews: viewStats[0]?.totalUniqueViews || 0,
        totalDuration: viewStats[0]?.totalDuration || 0,
        avgDuration: viewStats[0]?.avgDuration || 0,
        emailCaptures: emailStats[0]?.emailCaptures || 0,
      };

      // Get recent views (last 5)
      const recentViews = await db
        .select({
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
        .innerJoin(files, and(eq(shareLinks.fileId, files.id), eq(files.userId, userId)))
        .where(
          and(
            gte(viewSessions.startedAt, startDate),
            eq(shareLinks.isActive, true),
            or(isNull(shareLinks.expiresAt), gt(shareLinks.expiresAt, new Date())),
          ),
        )
        .orderBy(desc(viewSessions.startedAt))
        .limit(5);

      // Get top files by actual view count (separate query to avoid cartesian product)
      const topFiles = shareIds.length > 0 ? await db
        .select({
          fileId: files.id,
          title: files.title,
          originalName: files.originalName,
          viewCount: sql<number>`COUNT(${viewSessions.id})`,
          uniqueViewCount: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
          totalDuration: sql<number>`COALESCE(SUM(${viewSessions.totalDuration}), 0)`,
        })
        .from(files)
        .innerJoin(
          shareLinks,
          and(
            eq(files.id, shareLinks.fileId),
            eq(shareLinks.isActive, true),
            or(isNull(shareLinks.expiresAt), gt(shareLinks.expiresAt, new Date())),
          ),
        )
        .innerJoin(
          viewSessions,
          and(eq(shareLinks.shareId, viewSessions.shareId), gte(viewSessions.startedAt, startDate)),
        )
        .where(eq(files.userId, userId))
        .groupBy(files.id)
        .orderBy(desc(sql`COUNT(${viewSessions.id})`))
        .limit(5) : [];

      // Get views by day for the last 30 days (separate query to avoid cartesian product)
      const viewsByDay = shareIds.length > 0 ? await db
        .select({
          date: sql<string>`DATE(${viewSessions.startedAt})`,
          views: sql<number>`COUNT(${viewSessions.id})`,
          uniqueViews: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
        })
        .from(viewSessions)
        .where(
          and(
            inArray(viewSessions.shareId, shareIds),
            gte(viewSessions.startedAt, startDate)
          )
        )
        .groupBy(sql`DATE(${viewSessions.startedAt})`)
        .orderBy(sql`DATE(${viewSessions.startedAt})`) : [];

      logger.debug("Dashboard analytics calculated", {
        userId,
        totalFiles: stats?.totalFiles,
        totalViews: stats?.totalViews,
        totalUniqueViews: stats?.totalUniqueViews,
        recentViewsCount: recentViews.length,
        topFilesCount: topFiles.length,
        viewsByDayCount: viewsByDay.length,
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
      await setCache(cacheKey, responseData, CACHE_TTL);
      logger.debug("Dashboard data cached", { userId, days, cacheKey });

      successResponse(res, responseData);
    } catch (error) {
      logger.error("Dashboard analytics calculation failed", {
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
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
  }),
);

// Get share link analytics
router.get(
  "/shares/:shareId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { shareId } = req.params;

    // Verify share link ownership
    const shareLink = await db
      .select()
      .from(shareLinks)
      .innerJoin(files, eq(shareLinks.fileId, files.id))
      .where(and(eq(shareLinks.shareId, shareId), eq(files.userId, req.user?.id)))
      .limit(1);

    if (shareLink.length === 0) {
      throw new CustomError("Share link not found", 404);
    }

    // Get detailed analytics for this share link
    const sessions = await db
      .select({
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
  }),
);

// Generate daily analytics summary
router.post(
  "/summary/generate",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { date } = req.body; // YYYY-MM-DD format

    if (!date) {
      throw new CustomError("Date parameter required", 400);
    }

    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    // Get user's files
    const userFiles = await db.select().from(files).where(eq(files.userId, userId));

    if (userFiles.length === 0) {
      res.json({
        success: true,
        message: "No files to summarize",
      });
      return;
    }

    const fileIds = userFiles.map((f) => f.id);

    // Get share links for user's files
    const userShareLinks = await db
      .select()
      .from(shareLinks)
      .where(inArray(shareLinks.fileId, fileIds));

    const shareIds = userShareLinks.map((link) => link.shareId);

    if (shareIds.length === 0) {
      res.json({
        success: true,
        message: "No share links to summarize",
      });
      return;
    }

    // Generate summary for each file
    for (const fileId of fileIds) {
      const fileShareIds = userShareLinks
        .filter((link) => link.fileId === fileId)
        .map((link) => link.shareId);

      if (fileShareIds.length === 0) {
        continue;
      }

      // Get daily stats for this file
      const dailyStats = await db
        .select({
          totalViews: sql<number>`COUNT(*)`,
          uniqueViews: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
          totalDuration: sql<number>`SUM(${viewSessions.totalDuration})`,
          avgDuration: sql<number>`AVG(${viewSessions.totalDuration})`,
          emailCaptures: sql<number>`COUNT(DISTINCT ${emailCaptures.id})`,
        })
        .from(viewSessions)
        .leftJoin(
          emailCaptures,
          and(
            eq(viewSessions.shareId, emailCaptures.shareId),
            gte(emailCaptures.capturedAt, startDate),
            lt(emailCaptures.capturedAt, endDate),
          ),
        )
        .where(
          and(
            inArray(viewSessions.shareId, fileShareIds),
            gte(viewSessions.startedAt, startDate),
            lt(viewSessions.startedAt, endDate),
          ),
        );

      const stats = dailyStats[0];

      // Get geographic and device data
      const geoData = await db
        .select({
          country: viewSessions.ipAddressCountry,
          count: sql<number>`COUNT(*)`,
        })
        .from(viewSessions)
        .where(
          and(
            inArray(viewSessions.shareId, fileShareIds),
            gte(viewSessions.startedAt, startDate),
            lt(viewSessions.startedAt, endDate),
            isNotNull(viewSessions.ipAddressCountry),
          ),
        )
        .groupBy(viewSessions.ipAddressCountry);

      const countries = geoData.reduce(
        (acc, row) => {
          if (row.country) {
            acc[row.country] = Number(row.count);
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      // Upsert summary
      await db
        .insert(analyticsSummary)
        .values({
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
  }),
);

// Cache invalidation helpers
export async function invalidateUserDashboardCache(userId: number): Promise<void> {
  try {
    // Get all cache keys for this user's dashboard
    const keys = await getCacheKeys(`dashboard:${userId}:*`);
    if (keys.length > 0) {
      for (const key of keys) {
        await deleteCache(key);
      }
      logger.debug("Invalidated dashboard cache for user", { userId, keysCount: keys.length });
    }
  } catch (error) {
    logger.error("Failed to invalidate user dashboard cache", { userId, error });
  }
}

export async function invalidateAllDashboardCache(): Promise<void> {
  try {
    const keys = await getCacheKeys("dashboard:*");
    if (keys.length > 0) {
      for (const key of keys) {
        await deleteCache(key);
      }
      logger.debug("Invalidated all dashboard cache", { keysCount: keys.length });
    }
  } catch (error) {
    logger.error("Failed to invalidate all dashboard cache", { error });
  }
}

export default router;
