import { and, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, lte, or, sql } from "drizzle-orm";
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
        totalDuration: sql<number>`COALESCE(SUM(${viewSessions.totalDuration}), 0)`,
        avgDuration: sql<number>`COALESCE(AVG(${viewSessions.totalDuration}), 0)`,
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
        avgDuration: sql<number>`COALESCE(AVG(${pageViews.duration}), 0)`,
        avgScrollDepth: sql<number>`COALESCE(AVG(${pageViews.scrollDepth}), 0)`,
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

// Get individual session data for detailed viewer behavior
router.get(
  "/files/:fileId/sessions",
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
          sessions: [],
        },
      });
      return;
    }

    // Get individual session data with page-level details
    const sessionData = await db
      .select({
        sessionId: viewSessions.sessionId,
        startedAt: viewSessions.startedAt,
        totalDuration: viewSessions.totalDuration,
        isUnique: viewSessions.isUnique,
        pageNumber: pageViews.pageNumber,
        pageDuration: pageViews.duration,
        pageScrollDepth: pageViews.scrollDepth,
      })
      .from(viewSessions)
      .leftJoin(pageViews, eq(viewSessions.sessionId, pageViews.sessionId))
      .where(
        and(inArray(viewSessions.shareId, shareIds), gte(viewSessions.startedAt, start)),
      )
      .orderBy(desc(viewSessions.startedAt), sql`${pageViews.pageNumber} NULLS LAST`);

    // Group sessions and their page data
    const sessionsMap = new Map();
    
    sessionData.forEach((row) => {
      if (!sessionsMap.has(row.sessionId)) {
        sessionsMap.set(row.sessionId, {
          sessionId: row.sessionId,
          startedAt: row.startedAt,
          totalDuration: row.totalDuration,
          isUnique: row.isUnique,
          pages: [],
        });
      }
      
      if (row.pageNumber) {
        sessionsMap.get(row.sessionId).pages.push({
          pageNumber: row.pageNumber,
          duration: row.pageDuration,
          scrollDepth: row.pageScrollDepth,
        });
      }
    });

    const sessions = Array.from(sessionsMap.values());

    res.json({
      success: true,
      data: {
        sessions,
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

      // Get total share links count
      const shareLinksCount = await db
        .select({
          totalShares: sql<number>`COUNT(DISTINCT ${shareLinks.id})`,
        })
        .from(files)
        .innerJoin(
          shareLinks,
          and(
            eq(files.id, shareLinks.fileId),
            eq(files.userId, userId)
          ),
        );

      const stats = {
        totalFiles: fileCount[0]?.totalFiles || 0,
        totalViews: viewStats[0]?.totalViews || 0,
        totalUniqueViews: viewStats[0]?.totalUniqueViews || 0,
        totalDuration: viewStats[0]?.totalDuration || 0,
        avgDuration: viewStats[0]?.avgDuration || 0,
        emailCaptures: emailStats[0]?.emailCaptures || 0,
        totalShares: shareLinksCount[0]?.totalShares || 0,
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
        totalShares: Number(stats?.totalShares) || 0,
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
        totalShares: 0,
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
        totalDuration: sql<number>`COALESCE(SUM(${viewSessions.totalDuration}), 0)`,
        avgDuration: sql<number>`COALESCE(AVG(${viewSessions.totalDuration}), 0)`,
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

// New aggregate endpoint for page-by-page analytics
router.get(
  "/files/:fileId/aggregate",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    const userId = req.user?.id;

    if (!fileId || isNaN(fileId)) {
      throw new CustomError("Invalid file ID", 400);
    }

    // Check cache first (include cache buster if provided)
    const cacheBuster = req.query._t as string;
    const cacheKey = `aggregate:${fileId}:${userId}:${req.query.days || 30}:${req.query.pageRange || 'all'}:${cacheBuster || 'default'}`;
    const cachedData = await getCache<string>(cacheKey);
    if (cachedData) {
      res.json(JSON.parse(cachedData));
      return;
    }

    // Verify file ownership
    const file = await db
      .select({ id: files.id, pageCount: files.pageCount })
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .limit(1);

    if (file.length === 0) {
      throw new CustomError("File not found", 404);
    }

    const totalPages = file[0].pageCount || 1;

    // Get all share IDs for this file
    const shareLinksResult = await db
      .select({ shareId: shareLinks.shareId })
      .from(shareLinks)
      .where(eq(shareLinks.fileId, fileId));

    if (shareLinksResult.length === 0) {
      res.json({
        success: true,
        data: {
          fileStats: {
            totalSessions: 0,
            uniqueSessions: 0,
            avgSessionTime: 0,
            completionRate: 0
          },
          pageStats: [],
          dropoffFunnel: []
        }
      });
      return;
    }

    const shareIds = shareLinksResult.map(sl => sl.shareId);

    // Date range filter (default: last 30 days)
    const days = parseInt(req.query.days as string) || 30;
    const start = new Date();
    start.setDate(start.getDate() - days);

    // Page range filter for optimization (default: all pages)
    const pageRange = req.query.pageRange as string;
    let pageStart = 1;
    let pageEnd = totalPages;
    
    if (pageRange) {
      const [start, end] = pageRange.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end) && start > 0 && end <= totalPages) {
        pageStart = start;
        pageEnd = end;
      }
    }

    // Get file-level statistics
    const fileStatsResult = await db
      .select({
        totalSessions: sql<number>`COUNT(*)`,
        uniqueSessions: sql<number>`COUNT(DISTINCT ${viewSessions.sessionId})`,
        avgSessionTime: sql<number>`COALESCE(AVG(${viewSessions.totalDuration}), 0)`,
        totalDuration: sql<number>`COALESCE(SUM(${viewSessions.totalDuration}), 0)`
      })
      .from(viewSessions)
      .where(and(
        inArray(viewSessions.shareId, shareIds),
        gte(viewSessions.startedAt, start)
      ));

    const fileStats = fileStatsResult[0];

    // Get page-by-page statistics with efficient aggregation and page range filtering
    const pageStatsResult = await db
      .select({
        pageNumber: pageViews.pageNumber,
        totalViews: sql<number>`COUNT(*)`,
        avgDuration: sql<number>`COALESCE(AVG(${pageViews.duration}), 0)`,
        medianDuration: sql<number>`COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${pageViews.duration}), 0)`,
        p25Duration: sql<number>`COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ${pageViews.duration}), 0)`,
        p75Duration: sql<number>`COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ${pageViews.duration}), 0)`,
        skimRate: sql<number>`COALESCE(COUNT(CASE WHEN ${pageViews.duration} < 5 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 0)`,
        completionRate: sql<number>`COALESCE(COUNT(CASE WHEN ${pageViews.scrollDepth} >= 80 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 0)`
      })
      .from(pageViews)
      .innerJoin(viewSessions, eq(pageViews.sessionId, viewSessions.sessionId))
      .where(and(
        inArray(viewSessions.shareId, shareIds),
        gte(viewSessions.startedAt, start),
        gte(pageViews.pageNumber, pageStart),
        lte(pageViews.pageNumber, pageEnd)
      ))
      .groupBy(pageViews.pageNumber)
      .orderBy(pageViews.pageNumber);

    // Calculate drop-off funnel with safety checks
    const dropoffFunnel = [];
    const totalSessions = Number(fileStats.totalSessions) || 0;
    for (let page = 1; page <= totalPages; page++) {
      const pageStat = pageStatsResult.find(p => p.pageNumber === page);
      if (pageStat && totalSessions > 0) {
        const reachPercentage = (Number(pageStat.totalViews) / totalSessions) * 100;
        dropoffFunnel.push({
          page,
          reachPercentage: Math.round(reachPercentage * 100) / 100
        });
      } else {
        dropoffFunnel.push({
          page,
          reachPercentage: 0
        });
      }
    }

    // Format page stats with additional safety checks
    const pageStats = pageStatsResult.map(stat => ({
      pageNumber: stat.pageNumber,
      totalViews: Number(stat.totalViews) || 0,
      medianDuration: Math.round(Number(stat.medianDuration) || 0),
      avgDuration: Math.round(Number(stat.avgDuration) || 0),
      p25Duration: Math.round(Number(stat.p25Duration) || 0),
      p75Duration: Math.round(Number(stat.p75Duration) || 0),
      completionRate: Math.round(Number(stat.completionRate) || 0),
      skimRate: Math.round(Number(stat.skimRate) || 0)
    }));

    const responseData = {
      success: true,
      data: {
        fileStats: {
          totalSessions: Number(fileStats.totalSessions) || 0,
          uniqueSessions: Number(fileStats.uniqueSessions) || 0,
          avgSessionTime: Math.round(Number(fileStats.avgSessionTime) || 0),
          completionRate: totalPages > 0 ? Math.round((dropoffFunnel[totalPages - 1]?.reachPercentage || 0) * 100) / 100 : 0
        },
        pageStats,
        dropoffFunnel
      }
    };

    // Cache the response for 2 minutes (shorter TTL for analytics)
    await setCache(cacheKey, JSON.stringify(responseData), 120);

    res.json(responseData);
  })
);

// Optimized sessions endpoint with page details included
router.get(
  "/files/:fileId/sessions",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params.fileId);
    const userId = req.user?.id;

    if (!fileId || isNaN(fileId)) {
      throw new CustomError("Invalid file ID", 400);
    }

    // Check cache first
    const cacheKey = `sessions:${fileId}:${userId}:${req.query.page || 1}:${req.query.limit || 20}:${req.query.email || ''}:${req.query.device || ''}:${req.query.country || ''}:${req.query.dateFrom || ''}:${req.query.dateTo || ''}`;
    const cachedData = await getCache<string>(cacheKey);
    if (cachedData) {
      res.json(JSON.parse(cachedData));
      return;
    }

    // Verify file ownership
    const file = await db
      .select({ id: files.id, pageCount: files.pageCount })
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .limit(1);

    if (file.length === 0) {
      throw new CustomError("File not found", 404);
    }

    // Get all share IDs for this file
    const shareLinksResult = await db
      .select({ shareId: shareLinks.shareId })
      .from(shareLinks)
      .where(eq(shareLinks.fileId, fileId));

    if (shareLinksResult.length === 0) {
      const emptyResponse: any = {
        success: true,
        data: {
          sessions: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0
          },
          filters: {
            applied: {},
            available: {}
          }
        }
      };
      await setCache(cacheKey, JSON.stringify(emptyResponse), 300);
      res.json(emptyResponse);
      return;
    }

    const shareIds = shareLinksResult.map(sl => sl.shareId);

    // Parse query parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    // Parse filters
    const emailSearch = req.query.email as string;
    const device = req.query.device as string;
    const country = req.query.country as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    // Build where conditions
    const whereConditions = [inArray(viewSessions.shareId, shareIds)];

    if (emailSearch) {
      whereConditions.push(sql`${viewSessions.viewerEmail} ILIKE ${`%${emailSearch}%`}`);
    }

    if (device) {
      whereConditions.push(eq(viewSessions.device, device));
    }

    if (country) {
      whereConditions.push(eq(viewSessions.country, country));
    }

    if (dateFrom) {
      whereConditions.push(gte(viewSessions.startedAt, new Date(dateFrom)));
    }

    if (dateTo) {
      whereConditions.push(lte(viewSessions.startedAt, new Date(dateTo)));
    }

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(viewSessions)
      .where(and(...whereConditions));

    const total = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(total / limit);

    // Get paginated sessions
    const sessionsResult = await db
      .select({
        sessionId: viewSessions.sessionId,
        startedAt: viewSessions.startedAt,
        totalDuration: viewSessions.totalDuration,
        viewerEmail: viewSessions.viewerEmail,
        viewerName: viewSessions.viewerName,
        device: viewSessions.device,
        country: viewSessions.country,
        browser: viewSessions.browser,
        os: viewSessions.os,
        isUnique: viewSessions.isUnique,
        referer: viewSessions.referer
      })
      .from(viewSessions)
      .where(and(...whereConditions))
      .orderBy(desc(viewSessions.startedAt))
      .limit(limit)
      .offset(offset);

    // Get page views for each session
    const sessionIds = sessionsResult.map(s => s.sessionId);
    const pageViewsResult = await db
      .select({
        sessionId: pageViews.sessionId,
        pageNumber: pageViews.pageNumber,
        duration: pageViews.duration,
        scrollDepth: pageViews.scrollDepth,
        viewedAt: pageViews.viewedAt
      })
      .from(pageViews)
      .where(inArray(pageViews.sessionId, sessionIds))
      .orderBy(pageViews.pageNumber);

    // Group page views by session
    const pageViewsBySession = new Map<string, any[]>();
    pageViewsResult.forEach(pv => {
      if (!pageViewsBySession.has(pv.sessionId)) {
        pageViewsBySession.set(pv.sessionId, []);
      }
      pageViewsBySession.get(pv.sessionId)!.push({
        pageNumber: pv.pageNumber,
        duration: pv.duration,
        scrollDepth: pv.scrollDepth,
        viewedAt: pv.viewedAt
      });
    });

    // Format sessions with their page views
    const sessions = sessionsResult.map(session => ({
      sessionId: session.sessionId,
      startedAt: session.startedAt,
      totalDuration: session.totalDuration,
      viewerEmail: session.viewerEmail,
      viewerName: session.viewerName,
      device: session.device,
      country: session.country,
      browser: session.browser,
      os: session.os,
      isUnique: session.isUnique,
      referer: session.referer,
      pages: pageViewsBySession.get(session.sessionId) || []
    }));

    // Get available filter options
    const availableFilters = await getAvailableFilters(shareIds);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page,
          limit,
          total,
          totalPages
        },
        filters: {
          applied: {
            email: emailSearch,
            device,
            country,
            dateFrom,
            dateTo
          },
          available: availableFilters
        }
      }
    });
  })
);

// Helper function to get available filter options
async function getAvailableFilters(shareIds: string[]) {
  const [devices, countries] = await Promise.all([
    db
      .select({ device: viewSessions.device })
      .from(viewSessions)
      .where(and(
        inArray(viewSessions.shareId, shareIds),
        isNotNull(viewSessions.device)
      ))
      .groupBy(viewSessions.device)
      .orderBy(viewSessions.device),

    db
      .select({ country: viewSessions.country })
      .from(viewSessions)
      .where(and(
        inArray(viewSessions.shareId, shareIds),
        isNotNull(viewSessions.country)
      ))
      .groupBy(viewSessions.country)
      .orderBy(viewSessions.country)
  ]);

  return {
    devices: devices.map(d => d.device).filter(Boolean),
    countries: countries.map(c => c.country).filter(Boolean)
  };
}

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
