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
import { eq, and, desc, gte, count, sum, avg, sql } from 'drizzle-orm';

const router = Router();

// Get file analytics
router.get('/files/:fileId', authenticate, asyncHandler(async (req, res) => {
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
    totalViews: count(),
    uniqueViews: sum(sql<number>`CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END`),
    totalDuration: sum(viewSessions.totalDuration),
    avgDuration: avg(viewSessions.totalDuration),
  })
    .from(viewSessions)
    .where(and(
      sql`${viewSessions.shareId} = ANY(${shareIds})`,
      gte(viewSessions.startedAt, start)
    ));

  // Email captures count
  const emailCapturesCount = await db.select({
    count: count(),
  })
    .from(emailCaptures)
    .where(and(
      sql`${emailCaptures.shareId} = ANY(${shareIds})`,
      gte(emailCaptures.capturedAt, start)
    ));

  // Views over time (daily breakdown)
  const viewsOverTime = await db.select({
    date: sql<string>`DATE(${viewSessions.startedAt})`,
    views: count(),
    uniqueViews: sum(sql<number>`CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END`),
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
    count: count(),
  })
    .from(viewSessions)
    .where(and(
      sql`${viewSessions.shareId} = ANY(${shareIds})`,
      gte(viewSessions.startedAt, start)
    ))
    .groupBy(viewSessions.country)
    .orderBy(desc(count()))
    .limit(10);

  // Top devices
  const topDevices = await db.select({
    device: viewSessions.device,
    count: count(),
  })
    .from(viewSessions)
    .where(and(
      sql`${viewSessions.shareId} = ANY(${shareIds})`,
      gte(viewSessions.startedAt, start)
    ))
    .groupBy(viewSessions.device)
    .orderBy(desc(count()))
    .limit(10);

  // Top referers
  const topReferers = await db.select({
    referer: viewSessions.referer,
    count: count(),
  })
    .from(viewSessions)
    .where(and(
      sql`${viewSessions.shareId} = ANY(${shareIds})`,
      gte(viewSessions.startedAt, start)
    ))
    .groupBy(viewSessions.referer)
    .orderBy(desc(count()))
    .limit(10);

  // Page-level analytics
  const pageAnalytics = await db.select({
    pageNumber: pageViews.pageNumber,
    views: count(),
    avgDuration: avg(pageViews.duration),
    avgScrollDepth: avg(pageViews.scrollDepth),
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

// Get dashboard analytics summary
router.get('/dashboard', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { days = 30 } = req.query;
  const startDate = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

  // Get user's files
  const userFiles = await db.select()
    .from(files)
    .where(eq(files.userId, userId));

  const fileIds = userFiles.map(f => f.id);

  if (fileIds.length === 0) {
    return res.json({
      success: true,
      data: {
        totalFiles: 0,
        totalViews: 0,
        totalUniqueViews: 0,
        totalEmailCaptures: 0,
        recentViews: [],
        topFiles: [],
      },
    });
  }

  // Get share links for user's files
  const userShareLinks = await db.select()
    .from(shareLinks)
    .where(sql`${shareLinks.fileId} = ANY(${fileIds})`);

  const shareIds = userShareLinks.map(link => link.shareId);

  // Dashboard stats
  const dashboardStats = await db.select({
    totalViews: count(),
    uniqueViews: sum(sql<number>`CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END`),
  })
    .from(viewSessions)
    .where(and(
      sql`${viewSessions.shareId} = ANY(${shareIds})`,
      gte(viewSessions.startedAt, startDate)
    ));

  // Email captures
  const emailCapturesCount = await db.select({
    count: count(),
  })
    .from(emailCaptures)
    .where(and(
      sql`${emailCaptures.shareId} = ANY(${shareIds})`,
      gte(emailCaptures.capturedAt, startDate)
    ));

  // Recent views
  const recentViews = await db.select({
    viewerEmail: viewSessions.viewerEmail,
    viewerName: viewSessions.viewerName,
    startedAt: viewSessions.startedAt,
    totalDuration: viewSessions.totalDuration,
    fileName: files.title,
    shareTitle: shareLinks.title,
  })
    .from(viewSessions)
    .innerJoin(shareLinks, eq(viewSessions.shareId, shareLinks.shareId))
    .innerJoin(files, eq(shareLinks.fileId, files.id))
    .where(and(
      eq(files.userId, userId),
      gte(viewSessions.startedAt, startDate)
    ))
    .orderBy(desc(viewSessions.startedAt))
    .limit(10);

  // Top performing files
  const topFiles = await db.select({
    fileId: files.id,
    fileName: files.title,
    views: count(viewSessions.id),
    uniqueViews: sum(sql<number>`CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END`),
  })
    .from(files)
    .leftJoin(shareLinks, eq(files.id, shareLinks.fileId))
    .leftJoin(viewSessions, and(
      eq(shareLinks.shareId, viewSessions.shareId),
      gte(viewSessions.startedAt, startDate)
    ))
    .where(eq(files.userId, userId))
    .groupBy(files.id, files.title)
    .orderBy(desc(count(viewSessions.id)))
    .limit(5);

  res.json({
    success: true,
    data: {
      totalFiles: userFiles.length,
      totalViews: dashboardStats[0]?.totalViews || 0,
      totalUniqueViews: dashboardStats[0]?.uniqueViews || 0,
      totalEmailCaptures: emailCapturesCount[0]?.count || 0,
      recentViews: recentViews.map(view => ({
        viewerEmail: view.viewerEmail,
        viewerName: view.viewerName,
        startedAt: view.startedAt,
        duration: view.totalDuration,
        fileName: view.fileName,
        shareTitle: view.shareTitle,
      })),
      topFiles: topFiles.map(file => ({
        fileId: file.fileId,
        fileName: file.fileName,
        views: file.views,
        uniqueViews: file.uniqueViews,
      })),
    },
  });
}));

// Get share link analytics
router.get('/shares/:shareId', authenticate, asyncHandler(async (req, res) => {
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
      shareLink: shareLink[0].share_links,
      file: shareLink[0].files,
      sessions,
    },
  });
}));

export default router;