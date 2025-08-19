import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { authenticate } from "../middleware/auth";
import { createRateLimit } from "../middleware/security";
import { users, files, viewSessions, waitlist } from "../models/schema";
import { db } from "../utils/database";
import { logger } from "../utils/logger";
import { CustomError } from "../middleware/errorHandler";
import { S3Client, ListObjectsV2Command, GetBucketLocationCommand } from "@aws-sdk/client-s3";
import { config } from "../config";

const router: Router = Router();

// Admin middleware - check if user is admin (return 404 to avoid enumeration)
const requireAdmin = (req: any, _res: any, next: any) => {
  if (!req.user?.isAdmin) {
    return next(new CustomError("Not found", 404));
  }
  next();
};

// Rate limit for all admin routes
const adminRateLimit = createRateLimit(60 * 1000, 30, "Too many admin requests");

// GET /api/admin/stats - Get overall statistics
router.get("/stats", adminRateLimit, authenticate, requireAdmin, async (req, res, next) => {
  try {
    // Get basic counts
    const [usersCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
    const [filesCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(files);
    const [viewsCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(viewSessions);
    const [waitlistCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(waitlist);
    
    // Get total storage used from database
    const [storageResult] = await db.select({ 
      totalStorage: sql<number>`SUM(${users.storageUsed})` 
    }).from(users);
    
    const storageUsed = storageResult.totalStorage || 0;

    // Get DigitalOcean Spaces usage
    let doSpacesUsage = 0;
    if (config.storage.enabled) {
      try {
        const s3Client = new S3Client({
          endpoint: config.storage.endpoint,
          region: config.storage.region,
          credentials: {
            accessKeyId: config.storage.accessKeyId,
            secretAccessKey: config.storage.secretAccessKey,
          },
        });

        // List all objects to calculate total size
        let totalSize = 0;
        let continuationToken: string | undefined;

        do {
          const command = new ListObjectsV2Command({
            Bucket: config.storage.bucket,
            ContinuationToken: continuationToken,
          });

          const response = await s3Client.send(command);
          
          if (response.Contents) {
            totalSize += response.Contents.reduce((acc, obj) => acc + (obj.Size || 0), 0);
          }
          
          continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        doSpacesUsage = totalSize;
      } catch (error) {
        logger.error("Failed to get DigitalOcean Spaces usage", { error });
        // Don't fail the request, just set to 0
        doSpacesUsage = 0;
      }
    }

    res.json({
      success: true,
      data: {
        totalUsers: usersCount.count,
        totalFiles: filesCount.count,
        totalViews: viewsCount.count,
        totalWaitlist: waitlistCount.count,
        storageUsed,
        doSpacesUsage,
        storageLimit: config.storage.limitBytes ?? null,
      },
    });
  } catch (error) {
    logger.error("Failed to get admin stats", { error });
    next(new CustomError("Failed to get admin statistics", 500));
  }
});

// GET /api/admin/users - Get all users with their stats
router.get("/users", adminRateLimit, authenticate, requireAdmin, async (req, res, next) => {
  try {
    // Efficient query to get users with their total views in a single query
    // Using LEFT JOIN to get all users even if they have no views
    const usersWithViews = await db
      .select({
        id: users.id,
        email: users.email,
        plan: users.plan,
        createdAt: users.createdAt,
        filesCount: users.filesCount,
        storageUsed: users.storageUsed,
        totalViews: sql<number>`COALESCE(COUNT(${viewSessions.id}), 0)`.as('totalViews'),
      })
      .from(users)
      .leftJoin(
        viewSessions,
        sql`${viewSessions.shareId} IN (
          SELECT ${sql.raw('share_links.share_id')} 
          FROM ${sql.raw('share_links')} 
          WHERE ${sql.raw('share_links.file_id')} IN (
            SELECT ${sql.raw('files.id')} 
            FROM ${sql.raw('files')} 
            WHERE ${sql.raw('files.user_id')} = ${users.id}
          )
        )`
      )
      .groupBy(users.id, users.email, users.plan, users.createdAt, users.filesCount, users.storageUsed)
      .orderBy(users.createdAt);

    res.json({
      success: true,
      data: usersWithViews,
    });
  } catch (error) {
    logger.error("Failed to get admin users", { error });
    next(new CustomError("Failed to get users list", 500));
  }
});

// GET /api/admin/waitlist - Get all waitlist entries
router.get("/waitlist", adminRateLimit, authenticate, requireAdmin, async (req, res, next) => {
  try {
    const waitlistEntries = await db
      .select({
        id: waitlist.id,
        email: waitlist.email,
        plan: waitlist.plan,
        source: waitlist.source,
        createdAt: waitlist.createdAt,
      })
      .from(waitlist)
      .orderBy(waitlist.createdAt);

    res.json({
      success: true,
      data: waitlistEntries,
    });
  } catch (error) {
    logger.error("Failed to get admin waitlist", { error });
    next(new CustomError("Failed to get waitlist", 500));
  }
});

export default router;
