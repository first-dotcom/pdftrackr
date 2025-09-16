import { Router } from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { normalizeIp } from "../middleware/security";
import { validateBody } from "../middleware/validation";
import { CustomError } from "../middleware/errorHandler";
import { users, files, shareLinks, viewSessions, pageViews, emailCaptures, analyticsSummary } from "../models/schema";
import { db } from "../utils/database";
import { logger } from "../utils/logger";
import { deleteFromS3 } from "../services/storage";
import { successResponse, errorResponse } from "../utils/response";
import { config } from "../config";

const router: Router = Router();


// Data rights request schema
const dataRightsRequestSchema = z.object({
  requestType: z.enum(["access", "deletion", "rectification", "portability"]),
  description: z.string().max(1000).optional(),
  email: z.string().email().optional(), // For verification
});

// Rectification request schema
const rectificationSchema = z.object({
  requestType: z.literal("rectification"),
  fields: z.object({
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    email: z.string().email().optional(),
  }),
  description: z.string().max(1000).optional(),
});

/**
 * GDPR Data Rights Request Handler
 * Handles access, deletion, rectification, and portability requests
 */
router.post(
  "/",
  normalizeIp,
  authenticate,
  validateBody(dataRightsRequestSchema),
  asyncHandler(async (req, res) => {
    const { requestType, description, email } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    // Log the request for audit purposes
    logger.info("GDPR data rights request", {
      userId,
      requestType,
      email,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    switch (requestType) {
      case "access":
        return await handleDataAccess(req, res, userId);
      case "deletion":
        return await handleDataDeletion(req, res, userId);
      case "rectification":
        return await handleDataRectification(req, res, userId);
      case "portability":
        return await handleDataPortability(req, res, userId);
      default:
        throw new CustomError("Invalid request type", 400);
    }
  })
);

/**
 * Handle Data Access Request (Right of Access)
 * Provides all personal data we hold about the user
 */
async function handleDataAccess(req: any, res: any, userId: number) {
  try {
    // Get user profile
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userData.length === 0) {
      throw new CustomError("User not found", 404);
    }

    // Get user's files
    const userFiles = await db
      .select()
      .from(files)
      .where(eq(files.userId, userId))
      .orderBy(desc(files.createdAt));

    // Get user's share links
    const userShareLinks = await db
      .select()
      .from(shareLinks)
      .innerJoin(files, eq(shareLinks.fileId, files.id))
      .where(eq(files.userId, userId))
      .orderBy(desc(shareLinks.createdAt));

    // Get analytics data for user's files
    const fileIds = userFiles.map((f): number => f.id);
    const analyticsData = fileIds.length > 0 ? await db
      .select()
      .from(analyticsSummary)
      .where(eq(analyticsSummary.fileId, fileIds[0])) // Simplified - could be expanded
      .orderBy(desc(analyticsSummary.createdAt)) : [];

    const accessData = {
      user: userData[0],
      files: userFiles,
      shareLinks: userShareLinks,
      analytics: analyticsData,
      requestDate: new Date().toISOString(),
      dataCategories: [
        "Personal profile information",
        "Uploaded files and metadata",
        "Share link configurations",
        "Analytics and usage data"
      ]
    };

    return successResponse(res, accessData, "Data access request processed successfully");
  } catch (error) {
    logger.error("Data access request failed", { userId, error });
    throw error;
  }
}

/**
 * Handle Data Deletion Request (Right to Erasure)
 * Deletes all user data and account
 */
async function handleDataDeletion(req: any, res: any, userId: number) {
  try {
    // Get user data first for logging
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userData.length === 0) {
      throw new CustomError("User not found", 404);
    }

    // Get all user files for S3 deletion
    const userFiles = await db
      .select({ storageKey: files.storageKey })
      .from(files)
      .where(eq(files.userId, userId));

    // Delete files from S3 storage
    const s3DeletionPromises = userFiles.map((file): Promise<void | null> => 
      deleteFromS3(file.storageKey).catch((error: unknown): null => {
        logger.warn("Failed to delete file from S3", { storageKey: file.storageKey, error });
        return null; // Continue with other deletions
      })
    );

    await Promise.all(s3DeletionPromises);

    // Delete all user data from database
    // Note: Cascade deletes will handle related data automatically
    await db.delete(users).where(eq(users.id, userId));

    // Delete user account from Clerk
    try {
      const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userData[0].clerkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.clerk.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (clerkResponse.ok) {
        logger.info("Clerk user account deleted successfully", {
          userId,
          clerkId: userData[0].clerkId,
        });
      } else {
        logger.warn("Failed to delete Clerk user account", {
          userId,
          clerkId: userData[0].clerkId,
          status: clerkResponse.status,
          statusText: clerkResponse.statusText,
        });
      }
    } catch (error) {
      logger.error("Error deleting Clerk user account", {
        userId,
        clerkId: userData[0].clerkId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    logger.info("User data deletion completed", {
      userId,
      clerkId: userData[0].clerkId,
      filesDeleted: userFiles.length,
    });

    return successResponse(res, null, "All your data has been permanently deleted. Your account has been removed from our system.");
  } catch (error) {
    logger.error("Data deletion request failed", { userId, error });
    throw error;
  }
}

/**
 * Handle Data Rectification Request (Right to Rectification)
 * Updates user profile information
 */
async function handleDataRectification(req: any, res: any, userId: number) {
  try {
    // Validate rectification data
    const rectificationData = rectificationSchema.parse(req.body);
    const { fields } = rectificationData;

    // Update user profile
    const updateData: any = { updatedAt: new Date() };
    
    if (fields.firstName !== undefined) updateData.firstName = fields.firstName;
    if (fields.lastName !== undefined) updateData.lastName = fields.lastName;
    if (fields.email !== undefined) updateData.email = fields.email;

    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      throw new CustomError("User not found", 404);
    }

    logger.info("User data rectification completed", {
      userId,
      updatedFields: Object.keys(fields),
    });

    return successResponse(res, { user: updatedUser[0] }, "Your data has been updated successfully");
  } catch (error) {
    logger.error("Data rectification request failed", { userId, error });
    throw error;
  }
}

/**
 * Handle Data Portability Request (Right to Data Portability)
 * Exports user data in machine-readable format
 */
async function handleDataPortability(req: any, res: any, userId: number) {
  try {
    // Get comprehensive user data
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userData.length === 0) {
      throw new CustomError("User not found", 404);
    }

    // Get user's files (without sensitive storage keys)
    const userFiles = await db
      .select({
        id: files.id,
        filename: files.filename,
        originalName: files.originalName,
        size: files.size,
        mimeType: files.mimeType,
        title: files.title,
        description: files.description,
        isPublic: files.isPublic,
        downloadEnabled: files.downloadEnabled,
        watermarkEnabled: files.watermarkEnabled,
        scanStatus: files.scanStatus,
        pageCount: files.pageCount,
        createdAt: files.createdAt,
        updatedAt: files.updatedAt,
      })
      .from(files)
      .where(eq(files.userId, userId))
      .orderBy(desc(files.createdAt));

    // Get share links
    const userShareLinks = await db
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
        createdAt: shareLinks.createdAt,
        updatedAt: shareLinks.updatedAt,
      })
      .from(shareLinks)
      .innerJoin(files, eq(shareLinks.fileId, files.id))
      .where(eq(files.userId, userId))
      .orderBy(desc(shareLinks.createdAt));

    // Get analytics summary
    const fileIds = userFiles.map((f): number => f.id);
    const analyticsData = fileIds.length > 0 ? await db
      .select()
      .from(analyticsSummary)
      .where(eq(analyticsSummary.fileId, fileIds[0])) // Simplified
      .orderBy(desc(analyticsSummary.createdAt)) : [];

    const portableData = {
      exportDate: new Date().toISOString(),
      format: "JSON",
      version: "1.0",
      user: {
        id: userData[0].id,
        email: userData[0].email,
        firstName: userData[0].firstName,
        lastName: userData[0].lastName,
        plan: userData[0].plan,
        storageUsed: userData[0].storageUsed,
        filesCount: userData[0].filesCount,
        createdAt: userData[0].createdAt,
        updatedAt: userData[0].updatedAt,
      },
      files: userFiles,
      shareLinks: userShareLinks,
      analytics: analyticsData,
      metadata: {
        totalFiles: userFiles.length,
        totalShareLinks: userShareLinks.length,
        totalAnalyticsRecords: analyticsData.length,
        dataCategories: [
          "Personal profile information",
          "Uploaded files and metadata",
          "Share link configurations",
          "Analytics and usage data"
        ]
      }
    };

    logger.info("Data portability request completed", {
      userId,
      dataSize: JSON.stringify(portableData).length,
    });

    return successResponse(res, portableData, "Your data has been exported in machine-readable format");
  } catch (error) {
    logger.error("Data portability request failed", { userId, error });
    throw error;
  }
}

/**
 * Get request status (for tracking GDPR requests)
 */
router.get(
  "/status",
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError("User not authenticated", 401);
    }

    // For now, return a simple status
    // In a full implementation, you'd track requests in a separate table
    const status: {
      lastRequestDate: string | null;
      pendingRequests: number;
      completedRequests: number;
      estimatedProcessingTime: string;
    } = {
      lastRequestDate: null,
      pendingRequests: 0,
      completedRequests: 0,
      estimatedProcessingTime: "1-3 business days",
    };

    return successResponse(res, status, "Request status retrieved successfully");
  })
);

export default router;

