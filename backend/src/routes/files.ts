import { Router } from 'express';
import multer from 'multer';
import { authenticate, requirePlan } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { validateFileUpload, normalizeIp } from '../middleware/security';
import { validatePDFSecurity, validateMimeType, createUploadRateLimit } from '../middleware/fileValidation';
import { fileUploadSchema, paginationSchema } from '../utils/validation';
import { db } from '../utils/database';
import { files, users, shareLinks } from '../models/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { config } from '../config';
import { uploadToS3, deleteFromS3 } from '../services/storage';
import { fileUploads, storageQuotaRejections } from '../middleware/metrics';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { Request, Response } from 'express';
import { File, UpdateFileRequest, FilesResponse, FileResponse } from '../../../shared/types';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max (will be checked against plan limits)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new CustomError('Only PDF files are allowed', 400));
    }
  },
});

// Upload PDF file - Enhanced security
router.post('/upload', 
  createUploadRateLimit(), // Rate limiting for uploads
  authenticate, 
  upload.single('file'), 
  validateMimeType, // Validate MIME type first
  validatePDFSecurity, // Deep PDF content validation
  validateFileUpload, // Additional file validation
  validateBody(fileUploadSchema), 
  normalizeIp, 
  asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return errorResponse(res, 'No file provided', 400);
  }

  const user = req.user!;
  const file = req.file;
  const { title, description } = req.body;

  // Check plan limits
  const quotas = config.quotas[user.plan as keyof typeof config.quotas];
  
  // Check file size limit
  if (file.size > quotas.fileSize) {
    storageQuotaRejections.labels(user.plan).inc();
    return errorResponse(res, `File size exceeds plan limit of ${quotas.fileSize / 1024 / 1024}MB`, 400);
  }

  // Check storage quota
  if (user.storageUsed + file.size > quotas.storage) {
    storageQuotaRejections.labels(user.plan).inc();
    return errorResponse(res, 'Storage quota exceeded', 400);
  }

  // Check file count limit (if not unlimited)
  if (quotas.fileCount !== -1 && user.filesCount >= quotas.fileCount) {
    storageQuotaRejections.labels(user.plan).inc();
    return errorResponse(res, 'File count limit exceeded', 400);
  }

  try {
    // Generate unique filename
    const fileExtension = '.pdf';
    const filename = `${nanoid()}_${Date.now()}${fileExtension}`;
    const storageKey = `files/${user.id}/${filename}`;

    // Check if storage is enabled
    if (!config.storage.enabled) {
      return errorResponse(res, 'File storage is not configured. Please contact administrator.', 503);
    }

    // Upload to S3
    const uploadResult = await uploadToS3(storageKey, file.buffer, file.mimetype);

    // Save file record to database with security metadata
    const newFile = await db.insert(files).values({
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
      ipAddress: (req as any).normalizedIp || req.ip,
      userAgent: req.get('User-Agent'),
      fileHash: (req as any).fileHash, // From PDF validation
    }).returning();

    // Update user storage and file count
    await db.update(users)
      .set({
        storageUsed: user.storageUsed + file.size,
        filesCount: user.filesCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    fileUploads.labels('success', user.plan).inc();

    successResponse(res, { file: newFile[0] }, 'File uploaded successfully');
  } catch (error) {
    fileUploads.labels('error', user.plan).inc();
    logger.error('File upload failed', {
      userId: user.id,
      filename: file.originalname,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}));

// Get user's files
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 10;
  const offset = (page - 1) * limit;

  // Get files with calculated view counts and share links
  const userFiles = await db.select({
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
    viewCount: sql<number>`COALESCE(SUM(${shareLinks.viewCount}), 0)`,
    shareLinksCount: sql<number>`COUNT(${shareLinks.id})`,
  })
    .from(files)
    .leftJoin(shareLinks, eq(files.id, shareLinks.fileId))
    .where(eq(files.userId, req.user!.id))
    .groupBy(files.id)
    .orderBy(desc(files.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch share links for each file
  const filesWithShareLinks = await Promise.all(
    userFiles.map(async (file) => {
      const fileShareLinks = await db.select()
        .from(shareLinks)
        .where(eq(shareLinks.fileId, file.id));

      return {
        ...file,
        shareLinks: fileShareLinks,
      };
    })
  );

  // Get total count for pagination
  const totalCount = await db.select({ count: sql<number>`COUNT(*)` })
    .from(files)
    .where(eq(files.userId, req.user!.id));

  paginatedResponse(res, filesWithShareLinks, page, limit, totalCount[0]?.count || 0);
}));

// Get single file
router.get('/:id', authenticate, validateParams(z.object({ id: z.string().regex(/^\d+$/).transform(Number) })), asyncHandler(async (req: Request, res: Response) => {
  const fileId = req.params.id;

  const file = await db.select()
    .from(files)
    .where(and(
      eq(files.id, fileId),
      eq(files.userId, req.user!.id)
    ))
    .limit(1);

  if (file.length === 0) {
    return errorResponse(res, 'File not found', 404);
  }

  successResponse(res, { file: file[0] });
}));

// Update file metadata
router.patch('/:id', authenticate, validateParams(z.object({ id: z.string().regex(/^\d+$/).transform(Number) })), validateBody(z.object({
  title: z.string().max(255).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  downloadEnabled: z.boolean().optional(),
  watermarkEnabled: z.boolean().optional(),
})), asyncHandler(async (req: Request, res: Response) => {
  const fileId = req.params.id;
  const { title, description, downloadEnabled, watermarkEnabled } = req.body;

  const updatedFile = await db.update(files)
    .set({
      title,
      description,
      downloadEnabled,
      watermarkEnabled,
      updatedAt: new Date(),
    })
    .where(and(
      eq(files.id, fileId),
      eq(files.userId, req.user!.id)
    ))
    .returning();

  if (updatedFile.length === 0) {
    return errorResponse(res, 'File not found', 404);
  }

  successResponse(res, { file: updatedFile[0] }, 'File updated successfully');
}));

// Delete file
router.delete('/:id', authenticate, validateParams(z.object({ id: z.string().regex(/^\d+$/).transform(Number) })), asyncHandler(async (req: Request, res: Response) => {
  const fileId = req.params.id;

  // Get file to delete from storage
  const file = await db.select()
    .from(files)
    .where(and(
      eq(files.id, fileId),
      eq(files.userId, req.user!.id)
    ))
    .limit(1);

  if (file.length === 0) {
    return errorResponse(res, 'File not found', 404);
  }

  try {
    // Delete from S3
    if (file[0]) {
      await deleteFromS3(file[0].storageKey);
    }

    // Delete from database
    await db.delete(files)
      .where(eq(files.id, fileId));

    // Update user storage and file count
    await db.update(users)
      .set({
        storageUsed: Math.max(0, req.user!.storageUsed - (file[0]?.size || 0)),
        filesCount: Math.max(0, req.user!.filesCount - 1),
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user!.id));

    successResponse(res, null, 'File deleted successfully');
  } catch (error) {
    logger.error('Failed to delete file', {
      fileId,
      userId: req.user!.id,
      error: error instanceof Error ? error.message : String(error)
    });
    return errorResponse(res, 'Failed to delete file', 500);
  }
}));

export default router;