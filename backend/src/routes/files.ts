import { and, desc, eq, gt, gte, inArray, isNull, or, sql } from "drizzle-orm";
import { Router } from "express";
import type { Request, Response } from "express";

interface RequestWithExtensions extends Request {
  normalizedIp?: string;
  fileHash?: string;
}
import multer from "multer";
import { nanoid } from "nanoid";
import { z } from "zod";

import { config } from "../config";
import { authenticate } from "../middleware/auth";
import { CustomError, asyncHandler } from "../middleware/errorHandler";
import {
  createUploadRateLimit,
  validateMimeType,
  validatePDFSecurity,
} from "../middleware/fileValidation";
import { fileUploads, storageQuotaRejections } from "../middleware/metrics";
import { normalizeIp, validateFileUpload } from "../middleware/security";
import { validateBody, validateParams, validateQuery } from "../middleware/validation";
import { files, shareLinks, users, viewSessions } from "../models/schema";
import { deleteFromS3, uploadToS3 } from "../services/storage";
import { db } from "../utils/database";
import { logger } from "../utils/logger";
import { deleteCache } from "../utils/redis";
import { errorResponse, paginatedResponse, successResponse } from "../utils/response";
import {
  fileUploadSchema,
  getNumericId,
  getQueryParams,
  getUserData,
  getUserId,
} from "../utils/validation";
import { invalidateUserDashboardCache } from "./analytics";
import { getFileSizeLimit } from "../../../shared/types";

const router: Router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: getFileSizeLimit("business"), // Use business plan limit as max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new CustomError("Only PDF files are allowed", 400));
    }
  },
});

// Upload PDF file - Enhanced security
router.post(
  "/upload",
  createUploadRateLimit(), // Rate limiting for uploads
  authenticate,
  upload.single("file"),
  validateMimeType, // Validate MIME type first
  validatePDFSecurity, // Deep PDF content validation
  validateFileUpload, // Additional file validation
  validateBody(fileUploadSchema),
  normalizeIp,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return errorResponse(res, "No file provided", 400);
    }

    if (!req.user) {
      return errorResponse(res, "User not authenticated", 401);
    }
    const user = req.user;
    const file = req.file;
    const { title, description } = req.body;

    // Check plan limits
    const quotas = config.quotas[user.plan as keyof typeof config.quotas];

    // Check file size limit
    if (file.size > quotas.fileSize) {
      storageQuotaRejections.labels(user.plan).inc();
      return errorResponse(
        res,
        `File size exceeds plan limit of ${quotas.fileSize / 1024 / 1024}MB`,
        400,
      );
    }

    // Check storage quota
    if (user.storageUsed + file.size > quotas.storage) {
      storageQuotaRejections.labels(user.plan).inc();
      return errorResponse(res, "Storage quota exceeded", 400);
    }

    // Check file count limit (if not unlimited)
    if (quotas.fileCount !== -1 && user.filesCount >= quotas.fileCount) {
      storageQuotaRejections.labels(user.plan).inc();
      return errorResponse(res, "File count limit exceeded", 400);
    }

    try {
      // Generate unique filename
      const fileExtension = ".pdf";
      const filename = `${nanoid()}_${Date.now()}${fileExtension}`;
      const storageKey = `files/${user.id}/${filename}`;

      // Check if storage is enabled
      if (!config.storage.enabled) {
        return errorResponse(
          res,
          "File storage is not configured. Please contact administrator.",
          503,
        );
      }

      // Upload to S3
      const uploadResult = await uploadToS3(storageKey, file.buffer, file.mimetype);

      // Save file record to database with security metadata
      const newFile = await db
        .insert(files)
        .values({
          userId: user.id,
          filename,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          storageKey,
          storageUrl: uploadResult.url,
          title: title || file.originalname,
          description,
          // Add security tracking
          ipAddress: (req as RequestWithExtensions).normalizedIp || req.ip || null,
          userAgent: req.get("User-Agent") || null,
          fileHash: (req as RequestWithExtensions).fileHash || null, // From PDF validation
        })
        .returning();

      // Update user storage and file count
      await db
        .update(users)
        .set({
          storageUsed: user.storageUsed + file.size,
          filesCount: user.filesCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      fileUploads.labels("success", user.plan).inc();

      // Invalidate caches for this user
      await invalidateUserDashboardCache(user.id);
      await deleteCache(`user_profile:${user.id}`);

      successResponse(res, { file: newFile[0] }, "File uploaded successfully");
    } catch (error) {
      fileUploads.labels("error", user.plan).inc();
      logger.error("File upload failed", {
        userId: user.id,
        filename: file.originalname,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }),
);

// Get user's files
router.get(
  "/",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    logger.info("Query:", req.query);
    
    try {
      const { page, limit } = getQueryParams(req);
      const offset = (page - 1) * limit;

    // Get files with calculated view counts and share links
    const userFiles = await db
      .select({
        id: files.id,
        userId: files.userId,
        filename: files.filename,
        originalName: files.originalName,
        size: files.size,
        mimeType: files.mimeType,
        storageKey: files.storageKey,
        storageUrl: files.storageUrl,
        title: files.title,
        description: files.description,
        isPublic: files.isPublic,
        downloadEnabled: files.downloadEnabled,
        watermarkEnabled: files.watermarkEnabled,
        password: files.password,
        ipAddress: files.ipAddress,
        userAgent: files.userAgent,
        fileHash: files.fileHash,
        scanStatus: files.scanStatus,
        securityFlags: files.securityFlags,
        createdAt: files.createdAt,
        updatedAt: files.updatedAt,
        // Use actual view sessions count to match dashboard calculation
        viewCount: sql<number>`COUNT(${viewSessions.id})`,
        shareLinksCount: sql<number>`COUNT(${shareLinks.id})`,
      })
      .from(files)
      .leftJoin(
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
      .leftJoin(viewSessions, eq(shareLinks.shareId, viewSessions.shareId))
      .where(eq(files.userId, req.user?.id))
      .groupBy(files.id)
      .orderBy(desc(files.createdAt))
      .limit(limit)
      .offset(offset);

    // Efficiently fetch all share links for these files in one query
    const fileIds = userFiles.map(f => f.id);
    const allShareLinks = fileIds.length > 0 ? await db
      .select()
      .from(shareLinks)
      .where(inArray(shareLinks.fileId, fileIds))
      : [];

    // Group share links by file ID
    const shareLinksMap = new Map<number, any[]>();
    allShareLinks.forEach(link => {
      const fileId = link.fileId;
      if (!shareLinksMap.has(fileId)) {
        shareLinksMap.set(fileId, []);
      }
      shareLinksMap.get(fileId)!.push(link);
    });

    // Attach share links to files
    const filesWithShareLinks = userFiles.map(file => ({
      ...file,
      shareLinks: shareLinksMap.get(file.id) || [],
    }));

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(files)
      .where(eq(files.userId, req.user?.id));

    paginatedResponse(res, filesWithShareLinks, page, limit, totalCount[0]?.count || 0);
    } catch (error) {
      if (error instanceof Error) {
        return errorResponse(res, error.message, 400);
      }
      return errorResponse(res, "Invalid query parameters", 400);
    }
  }),
);

// Get single file
router.get(
  "/:id",
  authenticate,
  validateParams(z.object({ id: z.string().regex(/^\d+$/).transform(Number) })),
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params["id"], 10);

    const file = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, req.user?.id)))
      .limit(1);

    if (file.length === 0) {
      return errorResponse(res, "File not found", 404);
    }

    successResponse(res, { file: file[0] });
  }),
);

// Update file metadata
router.patch(
  "/:id",
  authenticate,
  validateParams(z.object({ id: z.string().regex(/^\d+$/).transform(Number) })),
  validateBody(
    z.object({
      title: z.string().max(255).trim().optional(),
      description: z.string().max(1000).trim().optional(),
      downloadEnabled: z.boolean().optional(),
      watermarkEnabled: z.boolean().optional(),
    }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params["id"], 10);
    const { title, description, downloadEnabled, watermarkEnabled } = req.body;

    const updatedFile = await db
      .update(files)
      .set({
        title,
        description,
        downloadEnabled,
        watermarkEnabled,
        updatedAt: new Date(),
      })
      .where(and(eq(files.id, fileId), eq(files.userId, req.user?.id)))
      .returning();

    if (updatedFile.length === 0) {
      return errorResponse(res, "File not found", 404);
    }

    successResponse(res, { file: updatedFile[0] }, "File updated successfully");
  }),
);

// Delete file
router.delete(
  "/:id",
  authenticate,
  validateParams(z.object({ id: z.string().regex(/^\d+$/).transform(Number) })),
  asyncHandler(async (req: Request, res: Response) => {
    const fileId = parseInt(req.params["id"], 10);

    // Get file to delete from storage
    const file = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, req.user?.id)))
      .limit(1);

    if (file.length === 0) {
      return errorResponse(res, "File not found", 404);
    }

    try {
      // Delete from S3
      if (file[0]) {
        await deleteFromS3(file[0].storageKey);
      }

      // Delete from database
      await db.delete(files).where(eq(files.id, fileId));

      // Update user storage and file count
      await db
        .update(users)
        .set({
          storageUsed: Math.max(0, req.user?.storageUsed - (file[0]?.size || 0)),
          filesCount: Math.max(0, req.user?.filesCount - 1),
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user?.id));

      // Invalidate user profile cache
      await deleteCache(`user_profile:${req.user?.id}`);

      successResponse(res, null, "File deleted successfully");
    } catch (error) {
      logger.error("Failed to delete file", {
        fileId,
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return errorResponse(res, "Failed to delete file", 500);
    }
  }),
);

export default router;
