import { Router } from 'express';
import multer from 'multer';
import { authenticate, requirePlan } from '../middleware/auth';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { validateFileUpload, normalizeIp } from '../middleware/security';
import { fileUploadSchema, paginationSchema } from '../utils/validation';
import { db } from '../utils/database';
import { files, users } from '../models/schema';
import { eq, and, desc } from 'drizzle-orm';
import { config } from '../config';
import { uploadToS3, deleteFromS3 } from '../services/storage';
import { fileUploads, storageQuotaRejections } from '../middleware/metrics';
import { nanoid } from 'nanoid';
import { z } from 'zod';

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

// Upload PDF file
router.post('/upload', authenticate, upload.single('file'), validateFileUpload, validateBody(fileUploadSchema), normalizeIp, asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new CustomError('No file provided', 400);
  }

  const user = req.user!;
  const file = req.file;
  const { title, description } = req.body;

  // Check plan limits
  const quotas = config.quotas[user.plan as keyof typeof config.quotas];
  
  // Check file size limit
  if (file.size > quotas.fileSize) {
    storageQuotaRejections.labels(user.plan).inc();
    throw new CustomError(`File size exceeds plan limit of ${quotas.fileSize / 1024 / 1024}MB`, 400);
  }

  // Check storage quota
  if (user.storageUsed + file.size > quotas.storage) {
    storageQuotaRejections.labels(user.plan).inc();
    throw new CustomError('Storage quota exceeded', 400);
  }

  // Check file count limit (if not unlimited)
  if (quotas.fileCount !== -1 && user.filesCount >= quotas.fileCount) {
    storageQuotaRejections.labels(user.plan).inc();
    throw new CustomError('File count limit exceeded', 400);
  }

  try {
    // Generate unique filename
    const fileExtension = '.pdf';
    const filename = `${nanoid()}_${Date.now()}${fileExtension}`;
    const storageKey = `files/${user.id}/${filename}`;

    // Upload to S3
    const uploadResult = await uploadToS3(storageKey, file.buffer, file.mimetype);

    // Save file record to database
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

    res.json({
      success: true,
      data: {
        file: newFile[0],
      },
    });
  } catch (error) {
    fileUploads.labels('error', user.plan).inc();
    throw error;
  }
}));

// Get user's files
router.get('/', authenticate, validateQuery(paginationSchema), asyncHandler(async (req, res) => {
  const { page, limit } = req.query as { page: number; limit: number };
  const offset = (page - 1) * limit;

  const userFiles = await db.select()
    .from(files)
    .where(eq(files.userId, req.user!.id))
    .orderBy(desc(files.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    success: true,
    data: {
      files: userFiles,
      pagination: {
        page,
        limit,
        hasMore: userFiles.length === limit,
      },
    },
  });
}));

// Get single file
router.get('/:id', authenticate, validateParams(z.object({ id: z.string().regex(/^\d+$/).transform(Number) })), asyncHandler(async (req, res) => {
  const fileId = req.params.id;

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

  res.json({
    success: true,
    data: {
      file: file[0],
    },
  });
}));

// Update file metadata
router.patch('/:id', authenticate, validateParams(z.object({ id: z.string().regex(/^\d+$/).transform(Number) })), validateBody(z.object({
  title: z.string().max(255).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  downloadEnabled: z.boolean().optional(),
  watermarkEnabled: z.boolean().optional(),
})), asyncHandler(async (req, res) => {
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
    throw new CustomError('File not found', 404);
  }

  res.json({
    success: true,
    data: {
      file: updatedFile[0],
    },
  });
}));

// Delete file
router.delete('/:id', authenticate, validateParams(z.object({ id: z.string().regex(/^\d+$/).transform(Number) })), asyncHandler(async (req, res) => {
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
    throw new CustomError('File not found', 404);
  }

  try {
    // Delete from S3
    await deleteFromS3(file[0].storageKey);

    // Delete from database
    await db.delete(files)
      .where(eq(files.id, fileId));

    // Update user storage and file count
    await db.update(users)
      .set({
        storageUsed: Math.max(0, req.user!.storageUsed - file[0].size),
        filesCount: Math.max(0, req.user!.filesCount - 1),
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user!.id));

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    throw new CustomError('Failed to delete file', 500);
  }
}));

export default router;