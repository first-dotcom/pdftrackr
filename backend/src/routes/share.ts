import bcrypt from "bcryptjs";
import { and, desc, eq, sql } from "drizzle-orm";
import { Router } from "express";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { authenticate, optionalAuth } from "../middleware/auth";
import { CustomError, asyncHandler } from "../middleware/errorHandler";
import { pdfViews } from "../middleware/metrics";
import { createRateLimit, normalizeIp } from "../middleware/security";
import { validateBody } from "../middleware/validation";
import { emailCaptures, files, pageViews, shareLinks, viewSessions } from "../models/schema";
import { getSignedDownloadUrl, streamFromS3, getFileMetadata } from "../services/storage";
import { db } from "../utils/database";
import { getCountryFromIP, hashIPAddress } from "../utils/privacy";
import { deleteCache, getSession, setSession, getCache, setCache } from "../utils/redis";
import {
  createShareLinkSchema,
  shareAccessSchema,
  trackPageViewSchema,
  updateShareLinkSchema,
} from "../utils/validation";
import { invalidateUserDashboardCache } from "./analytics";

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

    const newShareLink = await db
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

    // Invalidate caches for this user
    await invalidateUserDashboardCache(req.user?.id);
    await deleteCache(`user_profile:${req.user?.id}`);

    res.json({
      success: true,
      data: {
        shareLink: newShareLink[0],
        url: `${config.frontend.url}/view/${shareId}`,
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
    if (link.maxViews && link.viewCount >= link.maxViews) {
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
  createRateLimit(15 * 60 * 1000, 20, "Too many access attempts"),
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

    if (link.maxViews && link.viewCount >= link.maxViews) {
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
    const sessionId = uuidv4();

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
    const recentSessions = await db
      .select()
      .from(viewSessions)
      .where(
        and(
          eq(viewSessions.shareId, shareId),
          eq(viewSessions.ipAddressHash, ipHash),
          viewerInfo.email ? eq(viewSessions.viewerEmail, viewerInfo.email) : undefined,
        ),
      )
      .limit(1);

    const isUnique = recentSessions.length === 0;

    // Create view session with GDPR compliance
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
    });

    // Update view counts
    await db
      .update(shareLinks)
      .set({
        viewCount: link.viewCount + 1,
        uniqueViewCount: isUnique ? (link.uniqueViewCount || 0) + 1 : link.uniqueViewCount || 0,
        updatedAt: new Date(),
      })
      .where(eq(shareLinks.id, link.id));

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
    }

    // Record metrics
    pdfViews.labels(link.fileId.toString(), isUnique.toString()).inc();

    // Generate signed URL for PDF access
    const signedUrl = await getSignedDownloadUrl(link.file.storageKey, 3600); // 1 hour

    // Cache session info for analytics tracking
    await setSession(
      sessionId,
      {
        shareId,
        fileId: link.fileId,
        viewerInfo,
        accessedAt: new Date(),
      },
      3600, // 1 hour
    );

    // Invalidate dashboard cache for the file owner
    await invalidateUserDashboardCache(link.fileId);

    res.json({
      success: true,
      data: {
        sessionId,
        fileUrl: signedUrl,
        file: {
          id: link.fileId,
          filename: link.file.filename,
          originalName: link.file.originalName,
          title: link.file.title,
          size: link.file.size,
        },
        downloadEnabled: link.downloadEnabled,
        watermarkEnabled: link.watermarkEnabled,
      },
    });
  }),
);

// Track page view
router.post(
  "/:shareId/track",
  createRateLimit(60 * 1000, 100, "Too many tracking requests"),
  validateBody(trackPageViewSchema),
  asyncHandler(async (req, res) => {
    // const { shareId } = req.params;
    const { sessionId, pageNumber, duration, scrollDepth } = req.body;

    // Verify session exists
    const session = await getSession(sessionId);
    if (!session) {
      throw new CustomError("Invalid session", 401);
    }

    // Record page view
    await db.insert(pageViews).values({
      sessionId,
      pageNumber,
      duration: duration || 0,
      scrollDepth: scrollDepth || 0,
    });

    // Update session last active time
    await db
      .update(viewSessions)
      .set({
        lastActiveAt: new Date(),
        totalDuration: duration || 0,
      })
      .where(eq(viewSessions.sessionId, sessionId));

    res.json({
      success: true,
      message: "Page view tracked",
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

    await db.delete(shareLinks).where(eq(shareLinks.shareId, shareId));

    res.json({
      success: true,
      message: "Share link deleted successfully",
    });
  }),
);

// Secure PDF proxy endpoint - stream PDF with access validation
router.get(
  "/:shareId/view",
  createRateLimit(5 * 60 * 1000, 50, "Too many PDF view requests"),
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

    if (link.maxViews && link.viewCount >= link.maxViews) {
      throw new CustomError("Share link view limit reached", 403);
    }

    // Validate access through session or direct authentication
    let hasAccess = false;
    let viewerEmail: string | null = null;

    if (session) {
      // Check if session exists and is valid
      const sessionData = await getSession(session as string);
      if (sessionData && typeof sessionData === 'object' && 'shareId' in sessionData) {
        const sessionObj = sessionData as { shareId: string; viewerInfo?: { email?: string } };
        if (sessionObj.shareId === shareId) {
          hasAccess = true;
          viewerEmail = sessionObj.viewerInfo?.email || null;
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
          res.status(401).json({
            success: false,
            error: "Invalid password",
          });
          return;
        }
      }

      // Check email gating
      if (link.emailGatingEnabled && !email) {
        res.status(401).json({
          success: false, 
          error: "Email required to access this file",
        });
        return;
      }

      hasAccess = true;
      viewerEmail = email || null;
    }

    if (!hasAccess) {
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

    try {
      // Get file metadata and stream
      const [metadata, fileStream] = await Promise.all([
        getFileMetadata(link.file.storageKey),
        streamFromS3(link.file.storageKey)
      ]);

      // Set appropriate headers for PDF viewing
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', metadata.contentLength);
      res.setHeader('Content-Disposition', 'inline; filename="' + link.file.originalName + '"');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Security headers to prevent download/print in some browsers
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Add watermark info in custom header if enabled
      if (link.watermarkEnabled && viewerEmail) {
        res.setHeader('X-Watermark-Email', Buffer.from(viewerEmail).toString('base64'));
        res.setHeader('X-Watermark-Time', new Date().toISOString());
      }

      // Stream the PDF file directly to response
      fileStream.pipe(res);
      
      // Handle stream errors
      fileStream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: "Failed to stream file",
          });
        }
      });

    } catch (error) {
      console.error('PDF streaming error:', error);
      throw new CustomError("Failed to stream PDF", 500);
    }
  }),
);

export default router;
