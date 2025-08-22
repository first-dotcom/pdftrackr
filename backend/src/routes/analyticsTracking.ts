import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { createRateLimit, normalizeIp } from "../middleware/security";
import { auditService } from "../services/auditService";
import { logger } from "../utils/logger";
import { db } from "../utils/database";
import { pageViews } from "../models/schema";

const router: Router = Router();

// Rate limiting for analytics - more generous since these are frequent
const analyticsRateLimit = createRateLimit(
  60 * 1000, // 1 minute window
  100, // 100 requests per minute per IP
  "Too many analytics requests"
);

// 📊 SESSION START TRACKING
router.post(
  "/session-start",
  analyticsRateLimit,
  normalizeIp,
  asyncHandler(async (req: Request, res: Response) => {
    const { 
      shareId, 
      email, 
      sessionId
    } = req.body;

    if (!shareId || !sessionId) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: shareId, sessionId",
      });
      return;
    }

    try {
      await auditService.logSessionStart({
        shareId,
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent') || '',
        sessionId: sessionId,
      });

      logger.debug(`Session start tracked: ${shareId} - session: ${sessionId}`);

      res.json({
        success: true,
        message: "Session start tracked",
      });
    } catch (error) {
      logger.error("Failed to track session start:", error);
      res.status(500).json({
        success: false,
        error: "Failed to track session start",
      });
    }
  })
);

// 📊 PAGE VIEW TRACKING
router.post(
  "/page-view",
  analyticsRateLimit,
  normalizeIp,
  asyncHandler(async (req: Request, res: Response) => {
    const { 
      shareId, 
      email, 
      page, 
      totalPages, 
      sessionId,
      // NEW: Enhanced tracking data
      duration,
      scrollDepth 
    } = req.body;

    if (!shareId || !page || !totalPages) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: shareId, page, totalPages",
      });
      return;
    }

    try {
      // Update file's page count if this is the first time we're seeing it
      // Don't await this to avoid blocking page view tracking
      auditService.updateFilePageCount(shareId, parseInt(totalPages))
        .catch(error => {
          logger.error('Failed to update file page count:', error);
        });

      // Store enhanced data in pageViews table if sessionId is provided
      if (sessionId) {
        try {
          await db.insert(pageViews).values({
            sessionId,
            pageNumber: parseInt(page),
            duration: duration || 0,
            scrollDepth: scrollDepth || 0,
            viewedAt: new Date(),
          });
          
          logger.debug(`Enhanced page view stored: ${shareId} page ${page} - duration: ${duration}s, scroll: ${scrollDepth}%`);
        } catch (dbError) {
          logger.warn('Failed to store enhanced page view data:', dbError);
          // Continue with audit logging even if enhanced data fails
        }
      }

      logger.debug(`Page view tracked: ${shareId} page ${page}/${totalPages}`);

      res.json({
        success: true,
        message: "Page view tracked",
      });
    } catch (error) {
      logger.error("Failed to track page view:", error);
      res.status(500).json({
        success: false,
        error: "Failed to track page view",
      });
    }
  })
);

// 📊 SESSION END TRACKING
router.post(
  "/session-end",
  analyticsRateLimit,
  normalizeIp,
  asyncHandler(async (req: Request, res: Response) => {
    const { 
      shareId, 
      email, 
      sessionId, 
      durationSeconds, 
      pagesViewed, 
      totalPages, 
      maxPageReached 
    } = req.body;

    if (!shareId || durationSeconds === undefined || !maxPageReached) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: shareId, durationSeconds, maxPageReached",
      });
      return;
    }

    try {
      await auditService.logSessionEnd({
        shareId,
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent') || '',
        durationSeconds: parseInt(durationSeconds),
        pagesViewed: parseInt(pagesViewed) || 1,
        totalPages: parseInt(totalPages) || 1,
        maxPageReached: parseInt(maxPageReached),
        sessionId: sessionId,
      });

      logger.debug(`Session end tracked: ${shareId} - ${durationSeconds}s, ${maxPageReached}/${totalPages} pages`);

      res.json({
        success: true,
        message: "Session end tracked",
      });
    } catch (error) {
      logger.error("Failed to track session end:", error);
      res.status(500).json({
        success: false,
        error: "Failed to track session end",
      });
    }
  })
);

// 📊 RETURN VISIT TRACKING
router.post(
  "/return-visit",
  analyticsRateLimit,
  normalizeIp,
  asyncHandler(async (req: Request, res: Response) => {
    const { shareId, email, totalVisits, daysSinceFirst } = req.body;

    if (!shareId || !totalVisits) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: shareId, totalVisits",
      });
      return;
    }

    try {
      await auditService.logReturnVisit({
        shareId,
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent') || '',
        totalVisits: parseInt(totalVisits),
        daysSinceFirst: parseInt(daysSinceFirst) || 0,
      });

      logger.debug(`Return visit tracked: ${shareId} - visit #${totalVisits}`);

      res.json({
        success: true,
        message: "Return visit tracked",
      });
    } catch (error) {
      logger.error("Failed to track return visit:", error);
      res.status(500).json({
        success: false,
        error: "Failed to track return visit",
      });
    }
  })
);

// 📊 ANALYTICS DASHBOARD DATA
router.get(
  "/document/:shareId/stats",
  createRateLimit(60 * 1000, 30, "Too many analytics requests"),
  normalizeIp,
  asyncHandler(async (req: Request, res: Response) => {
    const { shareId } = req.params;

    try {
      const stats = await auditService.getDocumentEngagementStats(shareId);

      if (!stats) {
        res.status(404).json({
          success: false,
          error: "Document stats not found",
        });
        return;
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Failed to get document stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get document stats",
      });
    }
  })
);

// 📊 USER ENGAGEMENT PROFILE
router.get(
  "/user/:email/profile",
  createRateLimit(60 * 1000, 20, "Too many analytics requests"),
  normalizeIp,
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.params;

    if (!email) {
      res.status(400).json({
        success: false,
        error: "Email is required",
      });
      return;
    }

    try {
      const profile = await auditService.getUserEngagementProfile(decodeURIComponent(email));

      if (!profile) {
        res.status(404).json({
          success: false,
          error: "User profile not found",
        });
        return;
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error("Failed to get user profile:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get user profile",
      });
    }
  })
);

// Removed complex analytics endpoints - keeping only essential tracking

export default router;