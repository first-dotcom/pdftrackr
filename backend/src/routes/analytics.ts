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
import { eq, and, desc, gte, sql, inArray, or, isNotNull, lt, count, avg } from 'drizzle-orm';

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
router.get('/dashboard', authenticate, asyncHandler(async (req: any, res: any) => {
  const userId = req.user!.id;
  const { days = 30 } = req.query;
  const startDate = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

  console.log('Analytics dashboard request:', { userId, days, startDate });

  // Get user's files
  const userFiles = await db.select()
    .from(files)
    .where(eq(files.userId, userId));

  console.log('User files found:', userFiles.length);

  const fileIds = userFiles.map(f => f.id);

  console.log('File IDs:', fileIds);

  if (fileIds.length === 0) {
    console.log('No files found for user, returning empty response');
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
    .where(inArray(shareLinks.fileId, fileIds));

  console.log('Share links found:', userShareLinks.length);

  const shareIds = userShareLinks.map(link => link.shareId);

  console.log('Share links found:', userShareLinks.length);
  console.log('Share IDs:', shareIds);

  // If no share links, return empty stats
  if (shareIds.length === 0) {
    console.log('No share links found, returning empty stats');
    return res.json({
      success: true,
      data: {
        totalFiles: userFiles.length,
        totalViews: 0,
        totalUniqueViews: 0,
        totalEmailCaptures: 0,
        recentViews: [],
        topFiles: [],
      },
    });
  }

  // Dashboard stats - improved time filtering
  const dashboardStats = await db.select({
    totalViews: sql<number>`COUNT(*)`,
    uniqueViews: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
  })
    .from(viewSessions)
    .where(and(
      inArray(viewSessions.shareId, shareIds),
      or(
        gte(viewSessions.startedAt, startDate),
        gte(viewSessions.lastActiveAt, startDate)
      )
    ));

  console.log('Dashboard stats:', dashboardStats);

  // Email captures - count all email submissions, not just gated ones
  const emailCapturesCount = await db.select({
    count: sql<number>`COUNT(*)`,
  })
    .from(emailCaptures)
    .where(and(
      inArray(emailCaptures.shareId, shareIds),
      gte(emailCaptures.capturedAt, startDate)
    ));

  console.log('Email captures count:', emailCapturesCount);

  // Recent views with improved duration calculation
  const recentViews = await db.select({
    viewerEmail: viewSessions.viewerEmail,
    viewerName: viewSessions.viewerName,
    startedAt: viewSessions.startedAt,
    totalDuration: sql<number>`COALESCE((
      SELECT SUM(duration) 
      FROM page_views 
      WHERE session_id = ${viewSessions.sessionId}
    ), ${viewSessions.totalDuration})`,
    fileName: sql<string>`COALESCE(${files.title}, ${files.originalName})`,
    shareTitle: shareLinks.title,
  })
    .from(viewSessions)
    .innerJoin(shareLinks, eq(viewSessions.shareId, shareLinks.shareId))
    .innerJoin(files, eq(shareLinks.fileId, files.id))
    .where(and(
      eq(files.userId, userId),
      or(
        gte(viewSessions.startedAt, startDate),
        gte(viewSessions.lastActiveAt, startDate)
      )
    ))
    .orderBy(desc(viewSessions.startedAt))
    .limit(10);

  console.log('Recent views found:', recentViews.length);

  // Top performing files with improved metrics
  const topFiles = await db.select({
    fileId: files.id,
    fileName: sql<string>`COALESCE(${files.title}, ${files.originalName})`,
    views: sql<number>`COUNT(DISTINCT ${viewSessions.id})`,
    uniqueViews: sql<number>`SUM(CASE WHEN ${viewSessions.isUnique} THEN 1 ELSE 0 END)`,
  })
    .from(files)
    .leftJoin(shareLinks, eq(files.id, shareLinks.fileId))
    .leftJoin(viewSessions, and(
      eq(shareLinks.shareId, viewSessions.shareId),
      or(
        gte(viewSessions.startedAt, startDate),
        gte(viewSessions.lastActiveAt, startDate)
      )
    ))
    .where(eq(files.userId, userId))
    .groupBy(files.id, files.title, files.originalName)
    .orderBy(desc(sql<number>`COUNT(DISTINCT ${viewSessions.id})`))
    .limit(5);

  console.log('Top files found:', topFiles.length);

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

export default router;