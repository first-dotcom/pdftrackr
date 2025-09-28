import bcrypt from "bcryptjs";
import { and, desc, eq, sql, gte, isNull } from "drizzle-orm";
import { Router } from "express";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { authenticate, optionalAuth } from "../middleware/auth";
import { CustomError, asyncHandler } from "../middleware/errorHandler";
import { pdfViews } from "../middleware/metrics";
import { normalizeIp } from "../middleware/security";
import { validateBody } from "../middleware/validation";
import { emailCaptures, files, pageViews, shareLinks, viewSessions } from "../models/schema";
import { auditService } from "../services/auditService";
import { globalAnalyticsService } from "../services/globalAnalyticsService";
import {
  getFileMetadata,
  getSignedDownloadUrl,
  getSignedViewUrl,
  streamFromS3,
} from "../services/storage";
import { db } from "../utils/database";
import { getCountryFromIP, hashIPAddress } from "../utils/privacy";
import { deleteCache, getCache, getSession, setCache, setSession } from "../utils/redis";
import { logger } from "../utils/logger";
import {
  createShareLinkSchema,
  shareAccessSchema,
  trackPageViewSchema,
  updateShareLinkSchema,
} from "../utils/validation";
import { invalidateUserDashboardCache, invalidateFileAnalyticsCache } from "./analytics";

const router: Router = Router();

// Create share link
router.post(
  "/",
  authenticate,
  validateBody(createShareLinkSchema),
  asyncHandler(async (req, res) => {
    const {
      fileId,
      title,
      description,
      password,
      emailGatingEnabled,
      downloadEnabled,
      watermarkEnabled,
      expiresAt,
      maxViews,
    } = req.body;

    // Verify file ownership
    if (!req.user?.id) {
      throw new CustomError("User not authenticated", 401);
    }

    const file = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, req.user.id)))
      .limit(1);

    if (file.length === 0) {
      throw new CustomError("File not found", 404);
    }

    // Check share link quota (optimized)
    const userPlan = req.user.plan as keyof typeof config.quotas;
    const quotas = config.quotas[userPlan];

    if (quotas.shareLinks !== -1) {
      // Use COUNT query instead of fetching all records
      const shareLinkCount = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(shareLinks)
        .where(eq(shareLinks.fileId, fileId));

      if ((shareLinkCount[0]?.count || 0) >= quotas.shareLinks) {
        throw new CustomError(
          `Share link quota exceeded. Maximum ${quotas.shareLinks} share links allowed for ${userPlan} plan.`,
          403,
        );
      }
    }

    // Generate unique share ID
    const shareId = nanoid(12);

    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

    // Use transaction for share link creation
    const newShareLink = await db.transaction(async (tx) => {
      const result = await tx
        .insert(shareLinks)
        .values({
          fileId,
          shareId,
          title,
          description,
          password: hashedPassword,
          emailGatingEnabled: emailGatingEnabled || false,
          downloadEnabled: downloadEnabled !== false, // default true
          watermarkEnabled: watermarkEnabled || false,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          maxViews: maxViews || null,
        })
        .returning();

      return result[0];
    });

    // Update global analytics with new share link
    try {
      await globalAnalyticsService.incrementShares();
    } catch (error) {
      logger.warn("Failed to update global analytics for share link creation", { error });
    }

    // ✅ FIXED: Invalidate caches ONLY after successful database transaction
    await invalidateUserDashboardCache(req.user?.id);
    await deleteCache(`user_profile:${req.user?.id}`);

    res.json({
      success: true,
      data: {
        shareLink: newShareLink,
        url: `${config.app.url}/view/${shareId}`,
      },
    });
  }),
);

// Get share links for a file
router.get(
  "/file/:fileId",
  authenticate,
  asyncHandler(async (req, res) => {
    const fileId = parseInt(req.params.fileId || "0");

    // Verify file ownership
    if (!req.user?.id) {
      throw new CustomError("User not authenticated", 401);
    }

    const file = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, req.user.id)))
      .limit(1);

    if (file.length === 0) {
      throw new CustomError("File not found", 404);
    }

    const links = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.fileId, fileId))
      .orderBy(desc(shareLinks.createdAt));

    res.json({
      success: true,
      data: {
        shareLinks: links,
      },
    });
  }),
);

// Get share link info (public endpoint with optional auth)
router.get(
  "/:shareId",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { shareId } = req.params;

    const shareLink = await db
      .select({
        id: shareLinks.id,
        shareId: shareLinks.shareId,
        title: shareLinks.title,
        description: shareLinks.description,
        emailGatingEnabled: shareLinks.emailGatingEnabled,
        downloadEnabled: shareLinks.downloadEnabled,
        watermarkEnabled: shareLinks.watermarkEnabled,
        expiresAt: shareLinks.expiresAt,
        maxViews: shareLinks.maxViews,
        viewCount: shareLinks.viewCount,
        isActive: shareLinks.isActive,
        password: shareLinks.password,
        file: {
          id: files.id,
          filename: files.filename,
          originalName: files.originalName,
          size: files.size,
          title: files.title,
        },
      })
      .from(shareLinks)
      .innerJoin(files, eq(shareLinks.fileId, files.id))
      .where(eq(shareLinks.shareId, shareId))
      .limit(1);

    if (shareLink.length === 0) {
      throw new CustomError("Share link not found", 404);
    }

    const link = shareLink[0];

    // Check if link is active
    if (!link.isActive) {
      throw new CustomError("Share link is disabled", 403);
    }

    // Check if link has expired
    if (link.expiresAt && new Date() > link.expiresAt) {
      throw new CustomError("Share link has expired", 403);
    }

    // Check if max views reached
    if (link.maxViews && link.viewCount > link.maxViews) {
      throw new CustomError("Share link view limit reached", 403);
    }

    // Remove sensitive data from response
    const { password, ...safeLink } = link;

    res.json({
      success: true,
      data: {
        shareLink: {
          ...safeLink,
          requiresPassword: !!password,
        },
      },
    });
  }),
);

// Access share link (authenticate with password if required)
router.post(
  "/:shareId/access",
  validateBody(shareAccessSchema),
  normalizeIp,
  asyncHandler(async (req: Request, res: Response) => {
    const { shareId } = req.params;
    const { password, email, name } = req.body;

    const shareLink = await db
      .select({
        id: shareLinks.id,
        shareId: shareLinks.shareId,
        title: shareLinks.title,
        description: shareLinks.description,
        emailGatingEnabled: shareLinks.emailGatingEnabled,
        downloadEnabled: shareLinks.downloadEnabled,
        watermarkEnabled: shareLinks.watermarkEnabled,
        expiresAt: shareLinks.expiresAt,
        maxViews: shareLinks.maxViews,
        viewCount: shareLinks.viewCount,
        uniqueViewCount: shareLinks.uniqueViewCount,
        isActive: shareLinks.isActive,
        password: shareLinks.password,
        fileId: shareLinks.fileId,
        file: {
          id: files.id,
          filename: files.filename,
          originalName: files.originalName,
          size: files.size,
          title: files.title,
          storageKey: files.storageKey,
        },
      })
      .from(shareLinks)
      .innerJoin(files, eq(shareLinks.fileId, files.id))
      .where(eq(shareLinks.shareId, shareId))
      .limit(1);

    if (shareLink.length === 0) {
      throw new CustomError("Share link not found", 404);
    }

    const link = shareLink[0];

    // Check if link is active and not expired
    if (!link.isActive) {
      throw new CustomError("Share link is disabled", 403);
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      throw new CustomError("Share link has expired", 403);
    }

    if (link.maxViews && link.viewCount > link.maxViews) {
      throw new CustomError("Share link view limit reached", 403);
    }

    // Check password if required
    if (link.password) {
      if (!password || !(await bcrypt.compare(password, link.password))) {
        throw new CustomError("Invalid password", 401);
      }
    }

    // Check email gating
    if (link.emailGatingEnabled && !email) {
      throw new CustomError("Email required to access this file", 400);
    }

    // Create session ID
    let sessionId = uuidv4();

    // Get viewer info with GDPR compliance
    const ipHash = hashIPAddress(req.ip || "");
    const ipCountry = getCountryFromIP(req.ip || "");

    const viewerInfo = {
      email: email || null,
      name: name || null,
      ipAddressHash: ipHash,
      ipAddressCountry: ipCountry,
      userAgent: req.get("User-Agent"),
      referer: req.get("Referer"),
    };

    // Check if this is a unique view (same IP hash + email in last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSessions = await db
      .select()
      .from(viewSessions)
      .where(
        and(
          eq(viewSessions.shareId, shareId),
          eq(viewSessions.ipAddressHash, ipHash),
          viewerInfo.email ? eq(viewSessions.viewerEmail, viewerInfo.email) : undefined,
          gte(viewSessions.startedAt, twentyFourHoursAgo), // Only check last 24 hours
        ),
      )
      .limit(1);

    const isUnique = recentSessions.length === 0;

    // Create view session with GDPR compliance
    // Use upsert to handle race conditions gracefully
    try {
      await db.insert(viewSessions).values({
        shareId,
        sessionId,
        viewerEmail: viewerInfo.email,
        viewerName: viewerInfo.name,
        ipAddressHash: viewerInfo.ipAddressHash,
        ipAddressCountry: viewerInfo.ipAddressCountry,
        userAgent: viewerInfo.userAgent,
        referer: viewerInfo.referer,
        isUnique,
        consentGiven: true, // User consented by accessing the link
        dataRetentionDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year retention
        isActive: true, // Session is active
      });
    } catch (error) {
      // Handle unique constraint violation (race condition)
      if (error instanceof Error && (
        error.message.includes('unique_session_detection') ||
        error.message.includes('duplicate key value') ||
        error.message.includes('UNIQUE constraint')
      )) {
        logger.warn('Session creation race condition detected, finding existing session', {
          shareId,
          sessionId,
          ipHash: viewerInfo.ipAddressHash.substring(0, 8),
          error: error.message
        });
        
        // Find the existing session that was created by the other request
        const existingSession = await db.select()
          .from(viewSessions)
          .where(and(
            eq(viewSessions.shareId, shareId),
            eq(viewSessions.ipAddressHash, viewerInfo.ipAddressHash),
            viewerInfo.email ? eq(viewSessions.viewerEmail, viewerInfo.email) : isNull(viewSessions.viewerEmail)
          ))
          .limit(1);
          
        if (existingSession.length > 0) {
          // Use the existing sessionId instead of the generated one
          sessionId = existingSession[0].sessionId;
          logger.info('Found existing session, using sessionId:', sessionId);
        } else {
          logger.error('Race condition detected but no existing session found');
          throw new CustomError("Failed to create or find session", 500);
        }
      } else {
        logger.error('Session creation failed:', error);
        throw error; // Re-throw other errors
      }
    }

    // Update view counts
    await db
      .update(shareLinks)
      .set({
        viewCount: link.viewCount + 1,
        uniqueViewCount: isUnique ? (link.uniqueViewCount || 0) + 1 : link.uniqueViewCount || 0,
        updatedAt: new Date(),
      })
      .where(eq(shareLinks.id, link.id));

    // Update global analytics with new view
    try {
      await globalAnalyticsService.incrementViewsWithUnique(isUnique);
    } catch (error) {
      logger.warn("Failed to update global analytics for view", { error });
    }

    // Store email capture if provided
    if (email) {
      await db.insert(emailCaptures).values({
        shareId,
        email,
        name,
        ipAddress: req.ip, // Keep original IP for email captures as it's not personal data
        userAgent: req.get("User-Agent"),
        referer: req.get("Referer"),
      });

      // Update global analytics with new email capture
      try {
        await globalAnalyticsService.incrementEmailCaptures();
      } catch (error) {
        logger.warn("Failed to update global analytics for email capture", { error });
      }
    }

    // Record metrics
    pdfViews.labels(link.fileId.toString(), isUnique.toString()).inc();

    // Cache session info for analytics tracking with permissions
    await setSession(
      sessionId,
      {
        shareId,
        fileId: link.fileId,
        viewerInfo,
        permissions: {
          downloadEnabled: link.downloadEnabled,
          watermarkEnabled: link.watermarkEnabled,
        },
        accessedAt: new Date(),
      },
      3600, // 1 hour
    );

    // ✅ FIXED: Invalidate dashboard cache ONLY after successful session creation
    await invalidateUserDashboardCache(link.fileId);

    res.json({
      success: true,
      data: {
        sessionId,
        file: {
          id: link.fileId,
          filename: link.file.filename,
          originalName: link.file.originalName,
          title: link.file.title,
          size: link.file.size,
        },
        downloadEnabled: link.downloadEnabled,
        watermarkEnabled: link.watermarkEnabled,
        expiresAt: link.expiresAt,
      },
    });
  }),
);

// Update share link
router.patch(
  "/:shareId",
  authenticate,
  validateBody(updateShareLinkSchema),
  asyncHandler(async (req, res) => {
    const { shareId } = req.params;
    const updates = req.body;

    // Verify ownership through file
    const shareLink = await db
      .select()
      .from(shareLinks)
      .innerJoin(files, eq(shareLinks.fileId, files.id))
      .where(and(eq(shareLinks.shareId, shareId), eq(files.userId, req.user?.id)))
      .limit(1);

    if (shareLink.length === 0) {
      throw new CustomError("Share link not found", 404);
    }

    // Hash password if provided
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 12);
    }

    const updatedLink = await db
      .update(shareLinks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(shareLinks.shareId, shareId))
      .returning();

    res.json({
      success: true,
      data: {
        shareLink: updatedLink[0],
      },
    });
  }),
);

// Delete share link
router.delete(
  "/:shareId",
  authenticate,
  asyncHandler(async (req, res) => {
    const { shareId } = req.params;

    // Verify ownership through file and get fileId for cache invalidation
    const shareLink = await db
      .select({
        shareId: shareLinks.shareId,
        fileId: shareLinks.fileId,
        userId: files.userId,
      })
      .from(shareLinks)
      .innerJoin(files, eq(shareLinks.fileId, files.id))
      .where(and(eq(shareLinks.shareId, shareId), eq(files.userId, req.user?.id)))
      .limit(1);

    if (shareLink.length === 0) {
      throw new CustomError("Share link not found", 404);
    }

    const { fileId, userId } = shareLink[0];

    // Delete the share link
    await db.delete(shareLinks).where(eq(shareLinks.shareId, shareId));

    // Invalidate analytics caches for this file
    await invalidateFileAnalyticsCache(fileId, userId);
    
    // Also invalidate user dashboard cache
    await invalidateUserDashboardCache(userId);

    res.json({
      success: true,
      message: "Share link deleted successfully",
    });
  }),
);

// Handle CORS preflight for PDF view endpoint
router.options("/:shareId/view", (req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", req.get("Origin") || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-CSRF-Token");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
  res.status(200).end();
});

// Secure PDF proxy endpoint - stream PDF with access validation
router.get(
  "/:shareId/view",
  normalizeIp,
  asyncHandler(async (req: Request, res: Response) => {
    const { shareId } = req.params;
    const { session } = req.query;

    // Get share link with file info
    const shareLink = await db
      .select({
        id: shareLinks.id,
        shareId: shareLinks.shareId,
        title: shareLinks.title,
        password: shareLinks.password,
        emailGatingEnabled: shareLinks.emailGatingEnabled,
        downloadEnabled: shareLinks.downloadEnabled,
        watermarkEnabled: shareLinks.watermarkEnabled,
        expiresAt: shareLinks.expiresAt,
        maxViews: shareLinks.maxViews,
        viewCount: shareLinks.viewCount,
        isActive: shareLinks.isActive,
        fileId: shareLinks.fileId,
        file: {
          id: files.id,
          filename: files.filename,
          originalName: files.originalName,
          storageKey: files.storageKey,
          mimeType: files.mimeType,
        },
      })
      .from(shareLinks)
      .innerJoin(files, eq(shareLinks.fileId, files.id))
      .where(eq(shareLinks.shareId, shareId))
      .limit(1);

    if (shareLink.length === 0) {
      throw new CustomError("Share link not found", 404);
    }

    const link = shareLink[0];

    // Check if link is active and not expired
    if (!link.isActive) {
      throw new CustomError("Share link is disabled", 403);
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      throw new CustomError("Share link has expired", 403);
    }

    if (link.maxViews && link.viewCount > link.maxViews) {
      throw new CustomError("Share link view limit reached", 403);
    }

    // Validate access through session or direct authentication
    let hasAccess = false;
    let viewerEmail: string | null = null;
    let sessionPermissions: { downloadEnabled: boolean; watermarkEnabled: boolean } | null = null;

    if (session) {
      // Check if session exists and is valid
      const sessionData = await getSession(session as string);
      if (sessionData && typeof sessionData === "object" && "shareId" in sessionData) {
        const sessionObj = sessionData as { 
          shareId: string; 
          viewerInfo?: { email?: string };
          permissions?: { downloadEnabled: boolean; watermarkEnabled: boolean };
        };
        if (sessionObj.shareId === shareId) {
          hasAccess = true;
          viewerEmail = sessionObj.viewerInfo?.email || null;
          sessionPermissions = sessionObj.permissions || null;
        }
      }
    }

    // If no valid session, check for password/email in query params or headers
    if (!hasAccess) {
      const password = req.query.password as string;
      const email = req.query.email as string;

      // Check password if required
      if (link.password) {
        if (!password || !(await bcrypt.compare(password, link.password))) {
          // Log failed password attempt
          await auditService.logPDFAccess({
            shareId: shareId,
            fileId: link.fileId.toString(),
            ip: req.ip,
            userAgent: req.get("User-Agent") || "",
            email: email || null,
            success: false,
            error: "Invalid password",
          });

          res.status(401).json({
            success: false,
            error: "Invalid password",
          });
          return;
        }
      }

      // Check email gating
      if (link.emailGatingEnabled && !email) {
        // Log failed email gating attempt
        await auditService.logPDFAccess({
          shareId: shareId,
          fileId: link.fileId.toString(),
          ip: req.ip,
          userAgent: req.get("User-Agent") || "",
          email: null,
          success: false,
          error: "Email required",
        });

        res.status(401).json({
          success: false,
          error: "Email required to access this file",
        });
        return;
      }

      hasAccess = true;
      viewerEmail = email || null;
      // For direct access, use current link settings as permissions
      sessionPermissions = {
        downloadEnabled: link.downloadEnabled,
        watermarkEnabled: link.watermarkEnabled,
      };
    }

    if (!hasAccess) {
      // Log failed access attempt
      await auditService.logPDFAccess({
        shareId: shareId,
        fileId: link.fileId.toString(),
        ip: req.ip,
        userAgent: req.get("User-Agent") || "",
        email: viewerEmail,
        success: false,
        error: "Access denied",
      });

      res.status(401).json({
        success: false,
        error: "Access denied",
      });
      return;
    }

    // Ensure this is a PDF file
    if (link.file.mimeType !== "application/pdf") {
      throw new CustomError("Only PDF files can be viewed", 400);
    }

    // Log successful access attempt
    await auditService.logPDFAccess({
      shareId: shareId,
      fileId: link.fileId.toString(),
      ip: req.ip,
      userAgent: req.get("User-Agent") || "",
      email: viewerEmail,
      success: true,
    });

    try {
      // Use session permissions if available, otherwise fall back to current link settings
      const downloadEnabled = sessionPermissions?.downloadEnabled ?? link.downloadEnabled;
      
      // Generate a signed URL for the PDF instead of streaming
      const signedUrl = await getSignedViewUrl(link.file.storageKey, 3600, downloadEnabled);
      
      console.log("Generated signed URL for PDF viewing with downloadEnabled:", downloadEnabled);

      // Return the signed URL instead of streaming
      res.json({
        success: true,
        data: {
          pdfUrl: signedUrl,
          filename: link.file.originalName,
          contentType: "application/pdf",
          contentLength: 0, // We don't know the exact size from signed URL
          downloadEnabled: downloadEnabled,
          watermarkEnabled: sessionPermissions?.watermarkEnabled ?? link.watermarkEnabled,
        }
      });
    } catch (error) {
      console.error("PDF URL generation error:", error);
      throw new CustomError("Failed to generate PDF URL", 500);
    }
  }),
);

export default router;
