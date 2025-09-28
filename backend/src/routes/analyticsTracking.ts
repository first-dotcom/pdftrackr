import { eq } from "drizzle-orm";
import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { normalizeIp } from "../middleware/security";
import { pageViews, viewSessions } from "../models/schema";
import { auditService } from "../services/auditService";
import { db } from "../utils/database";
import { logger } from "../utils/logger";

const router: Router = Router();


// 📊 SESSION START TRACKING
// Sessions are now created in share.ts when accessing share links
// This endpoint is no longer needed

// 📊 PAGE VIEW TRACKING
router.post(
  "/page-view",
  normalizeIp,
  asyncHandler(async (req: Request, res: Response) => {
    let pageViewData: any;

    // Handle both regular POST data and sendBeacon Blob data
    if (req.headers["content-type"]?.includes("application/json")) {
      // Regular JSON POST request
      pageViewData = req.body;
    } else if (
      req.headers["content-type"]?.includes("text/plain") ||
      req.headers["content-type"]?.includes("application/octet-stream")
    ) {
      // sendBeacon request - data is sent as Blob
      try {
        const rawData = await new Promise<string>((resolve, reject) => {
          let data = "";
          req.on("data", (chunk) => (data += chunk));
          req.on("end", () => resolve(data));
          req.on("error", reject);
        });
        pageViewData = JSON.parse(rawData);
      } catch (error) {
        logger.error("Failed to parse sendBeacon page-view data:", error);
        res.status(400).json({
          success: false,
          error: "Invalid sendBeacon data format",
        });
        return;
      }
    } else {
      // Fallback to regular body parsing
      pageViewData = req.body;
    }

    const {
      shareId,
      email,
      page,
      totalPages,
      sessionId,
      // NEW: Enhanced tracking data
      duration,
    } = pageViewData;

    if (!shareId || !page || !totalPages) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: shareId, page, totalPages",
      });
      return;
    }

    const pageNum = parseInt(page);
    const totalPagesNum = parseInt(totalPages);
    const durationNum = duration ? Math.max(0, Math.round(Number(duration))) : 0;


    if (isNaN(pageNum) || pageNum <= 0 || pageNum > totalPagesNum) {
      logger.warn("Invalid page number", { page, totalPages, shareId });
      res.status(400).json({
        success: false,
        error: "Invalid page number",
      });
      return;
    }

    try {
      // Update file's page count if this is the first time we're seeing it
      // Don't await this to avoid blocking page view tracking
      auditService.updateFilePageCount(shareId, totalPagesNum).catch((error) => {
        logger.error("Failed to update file page count:", error);
      });

      // Store enhanced data in pageViews table if sessionId is provided
      if (sessionId) {
        try {
          await db.insert(pageViews).values({
            sessionId,
            pageNumber: pageNum,
            duration: durationNum,
            viewedAt: new Date(),
          });

        } catch (dbError) {
          logger.warn("Failed to store enhanced page view data:", dbError);
          // Continue with audit logging even if enhanced data fails
        }
      }


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
  }),
);

// 📊 SESSION END TRACKING
router.post(
  "/session-end",
  normalizeIp,
  asyncHandler(async (req: Request, res: Response) => {
    let sessionData: any;

    // Handle both regular POST data and sendBeacon Blob data
    if (req.headers["content-type"]?.includes("application/json")) {
      // Regular JSON POST request
      sessionData = req.body;
    } else if (
      req.headers["content-type"]?.includes("text/plain") ||
      req.headers["content-type"]?.includes("application/octet-stream")
    ) {
      // sendBeacon request - data is sent as Blob
      try {
        const rawData = await new Promise<string>((resolve, reject) => {
          let data = "";
          req.on("data", (chunk) => (data += chunk));
          req.on("end", () => resolve(data));
          req.on("error", reject);
        });
        sessionData = JSON.parse(rawData);
      } catch (error) {
        logger.error("Failed to parse sendBeacon data:", error);
        res.status(400).json({
          success: false,
          error: "Invalid sendBeacon data format",
        });
        return;
      }
    } else {
      // Fallback to regular body parsing
      sessionData = req.body;
    }

    const { shareId, email, sessionId, durationSeconds, pagesViewed, totalPages, maxPageReached } =
      sessionData;

    if (!shareId || durationSeconds === undefined || !maxPageReached) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: shareId, durationSeconds, maxPageReached",
      });
      return;
    }

    try {
      // Convert seconds to milliseconds for consistency
      const durationMs = parseInt(durationSeconds) * 1000;
      
      await auditService.logSessionEnd({
        shareId,
        email,
        ip: req.ip,
        userAgent: req.get("User-Agent") || "",
        durationMs: durationMs,
        pagesViewed: parseInt(pagesViewed) || 1,
        totalPages: parseInt(totalPages) || 1,
        maxPageReached: parseInt(maxPageReached),
        sessionId: sessionId,
      });

      logger.debug(
        `Session end tracked: ${shareId} - ${durationMs}ms (${durationSeconds}s), ${maxPageReached}/${totalPages} pages`,
      );

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
  }),
);

// 📊 SESSION ACTIVITY TRACKING (Heartbeat)
router.post(
  "/session-activity",
  normalizeIp,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, lastActiveAt, currentPage } = req.body;

    if (!sessionId || !lastActiveAt) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: sessionId, lastActiveAt",
      });
      return;
    }

    try {
      // Update session activity
      await db
        .update(viewSessions)
        .set({
          lastActiveAt: new Date(lastActiveAt),
          isActive: true,
        })
        .where(eq(viewSessions.sessionId, sessionId));

      logger.debug(`Session activity updated: ${sessionId} - page ${currentPage}`);

      res.json({
        success: true,
        message: "Session activity updated",
      });
    } catch (error) {
      logger.error("Failed to update session activity:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update session activity",
      });
    }
  }),
);

// 📊 RETURN VISIT TRACKING
router.post(
  "/return-visit",
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
        userAgent: req.get("User-Agent") || "",
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
  }),
);

// 📊 ANALYTICS DASHBOARD DATA
router.get(
  "/document/:shareId/stats",
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
  }),
);

// 📊 USER ENGAGEMENT PROFILE
router.get(
  "/user/:email/profile",
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
  }),
);

// Removed complex analytics endpoints - keeping only essential tracking

export default router;
