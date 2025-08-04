import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { validateBody, validateParams } from '../middleware/validation';
import { normalizeIp, createRateLimit } from '../middleware/security';
import { createShareLinkSchema, updateShareLinkSchema, shareAccessSchema, trackPageViewSchema } from '../utils/validation';
import { db } from '../utils/database';
import { files, shareLinks, viewSessions, pageViews, emailCaptures } from '../models/schema';
import { hashIPAddress, getCountryFromIP } from '../utils/privacy';
import { eq, and, desc, lt, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getSignedDownloadUrl } from '../services/storage';
import { pdfViews } from '../middleware/metrics';
import { CacheService } from '../utils/redis';
import { z } from 'zod';
import { config } from '../config';
import { invalidateUserDashboardCache } from './analytics';

const router = Router();

// Create share link
router.post('/', authenticate, validateBody(createShareLinkSchema), asyncHandler(async (req, res) => {
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

  // Generate unique share ID
  const shareId = nanoid(12);

  // Hash password if provided
  const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

  const newShareLink = await db.insert(shareLinks).values({
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
  }).returning();

  // Invalidate dashboard cache for this user
  await invalidateUserDashboardCache(req.user!.id);

  res.json({
    success: true,
    data: {
      shareLink: newShareLink[0],
      url: `${config.frontend.url}/view/${shareId}`,
    },
  });
}));

// Get share links for a file
router.get('/file/:fileId', authenticate, asyncHandler(async (req, res) => {
  const fileId = parseInt(req.params.fileId);

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

  const links = await db.select()
    .from(shareLinks)
    .where(eq(shareLinks.fileId, fileId))
    .orderBy(desc(shareLinks.createdAt));

  res.json({
    success: true,
    data: {
      shareLinks: links,
    },
  });
}));

// Get share link info (public endpoint with optional auth)
router.get('/:shareId', optionalAuth, asyncHandler(async (req, res) => {
  const { shareId } = req.params;

  const shareLink = await db.select({
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
    throw new CustomError('Share link not found', 404);
  }

  const link = shareLink[0];

  // Check if link is active
  if (!link.isActive) {
    throw new CustomError('Share link is disabled', 403);
  }

  // Check if link has expired
  if (link.expiresAt && new Date() > link.expiresAt) {
    throw new CustomError('Share link has expired', 403);
  }

  // Check if max views reached
  if (link.maxViews && link.viewCount >= link.maxViews) {
    throw new CustomError('Share link view limit reached', 403);
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
}));

// Access share link (authenticate with password if required)  
router.post('/:shareId/access', createRateLimit(15 * 60 * 1000, 20, 'Too many access attempts'), validateBody(shareAccessSchema), normalizeIp, asyncHandler(async (req, res) => {
  const { shareId } = req.params;
  const { password, email, name } = req.body;

  const shareLink = await db.select()
    .from(shareLinks)
    .innerJoin(files, eq(shareLinks.fileId, files.id))
    .where(eq(shareLinks.shareId, shareId))
    .limit(1);

  if (shareLink.length === 0) {
    throw new CustomError('Share link not found', 404);
  }

  const link = shareLink[0];

  // Check if link is active and not expired
  if (!link.share_links.isActive) {
    throw new CustomError('Share link is disabled', 403);
  }

  if (link.share_links.expiresAt && new Date() > link.share_links.expiresAt) {
    throw new CustomError('Share link has expired', 403);
  }

  if (link.share_links.maxViews && link.share_links.viewCount >= link.share_links.maxViews) {
    throw new CustomError('Share link view limit reached', 403);
  }

  // Check password if required
  if (link.share_links.password) {
    if (!password || !await bcrypt.compare(password, link.share_links.password)) {
      throw new CustomError('Invalid password', 401);
    }
  }

  // Check email gating
  if (link.share_links.emailGatingEnabled && !email) {
    throw new CustomError('Email required to access this file', 400);
  }

  // Create session ID
  const sessionId = uuidv4();
  
  // Get viewer info with GDPR compliance
  const ipHash = hashIPAddress(req.ip!);
  const ipCountry = getCountryFromIP(req.ip!);
  
  const viewerInfo = {
    email: email || null,
    name: name || null,
    ipAddressHash: ipHash,
    ipAddressCountry: ipCountry,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
  };

  // Check if this is a unique view (same IP hash + email in last 24 hours)
  const recentSessions = await db.select()
    .from(viewSessions)
    .where(and(
      eq(viewSessions.shareId, shareId),
      eq(viewSessions.ipAddressHash, ipHash),
      viewerInfo.email ? eq(viewSessions.viewerEmail, viewerInfo.email) : undefined
    ))
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
  await db.update(shareLinks)
    .set({
      viewCount: link.share_links.viewCount + 1,
      uniqueViewCount: isUnique 
        ? (link.share_links.uniqueViewCount || 0) + 1 
        : (link.share_links.uniqueViewCount || 0),
      updatedAt: new Date(),
    })
    .where(eq(shareLinks.id, link.share_links.id));

  // Store email capture if provided
  if (email) {
    await db.insert(emailCaptures).values({
      shareId,
      email,
      name,
      ipAddress: req.ip, // Keep original IP for email captures as it's not personal data
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
    });
  }

  // Record metrics
  pdfViews.labels(link.files.id.toString(), isUnique.toString()).inc();

  // Generate signed URL for PDF access
  const signedUrl = await getSignedDownloadUrl(link.files.storageKey, 3600); // 1 hour

  // Cache session info for analytics tracking
  await CacheService.setSession(sessionId, {
    shareId,
    fileId: link.files.id,
    viewerInfo,
    accessedAt: new Date(),
  }, 86400); // 24 hours

  // Invalidate dashboard cache for the file owner
  await invalidateUserDashboardCache(link.files.userId);

  res.json({
    success: true,
    data: {
      sessionId,
      fileUrl: signedUrl,
      file: {
        id: link.files.id,
        filename: link.files.filename,
        originalName: link.files.originalName,
        title: link.files.title,
        size: link.files.size,
      },
      downloadEnabled: link.share_links.downloadEnabled,
      watermarkEnabled: link.share_links.watermarkEnabled,
    },
  });
}));

// Track page view
router.post('/:shareId/track', createRateLimit(60 * 1000, 100, 'Too many tracking requests'), validateBody(trackPageViewSchema), asyncHandler(async (req, res) => {
  const { shareId } = req.params;
  const { sessionId, pageNumber, duration, scrollDepth } = req.body;

  // Verify session exists
  const session = await CacheService.getSession(sessionId);
  if (!session) {
    throw new CustomError('Invalid session', 401);
  }

  // Record page view
  await db.insert(pageViews).values({
    sessionId,
    pageNumber,
    duration: duration || 0,
    scrollDepth: scrollDepth || 0,
  });

  // Update session last active time
  await db.update(viewSessions)
    .set({
      lastActiveAt: new Date(),
      totalDuration: duration || 0,
    })
    .where(eq(viewSessions.sessionId, sessionId));

  res.json({
    success: true,
    message: 'Page view tracked',
  });
}));

// Update share link
router.patch('/:shareId', authenticate, validateBody(updateShareLinkSchema), asyncHandler(async (req, res) => {
  const { shareId } = req.params;
  const updates = req.body;

  // Verify ownership through file
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

  // Hash password if provided
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 12);
  }

  const updatedLink = await db.update(shareLinks)
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
}));

// Delete share link
router.delete('/:shareId', authenticate, asyncHandler(async (req, res) => {
  const { shareId } = req.params;

  // Verify ownership through file
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

  await db.delete(shareLinks)
    .where(eq(shareLinks.shareId, shareId));

  res.json({
    success: true,
    message: 'Share link deleted successfully',
  });
}));

export default router;