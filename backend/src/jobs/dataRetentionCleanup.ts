import { lt, and, isNotNull } from "drizzle-orm";
import { db } from "../utils/database";
import { logger } from "../utils/logger";
import { viewSessions, analyticsSummary, emailCaptures } from "../models/schema";
import { deleteFromS3 } from "../services/storage";
import { files } from "../models/schema";

/**
 * Data Retention Cleanup Job
 * Automatically deletes expired data based on GDPR retention policies
 * 
 * Retention periods:
 * - Analytics data: 26 months (Google Analytics default)
 * - Session data: 30 days (configurable per plan)
 * - Email captures: 12 months
 * - Orphaned files: 90 days after user deletion
 */

interface CleanupStats {
  sessionsDeleted: number;
  analyticsDeleted: number;
  emailCapturesDeleted: number;
  orphanedFilesDeleted: number;
  errors: string[];
}

export async function runDataRetentionCleanup(): Promise<CleanupStats> {
  const stats: CleanupStats = {
    sessionsDeleted: 0,
    analyticsDeleted: 0,
    emailCapturesDeleted: 0,
    orphanedFilesDeleted: 0,
    errors: [],
  };

  const startTime = Date.now();
  logger.info("Starting data retention cleanup job");

  try {
    // 1. Clean up expired view sessions (30 days)
    await cleanupExpiredSessions(stats);

    // 2. Clean up expired analytics data (26 months)
    await cleanupExpiredAnalytics(stats);

    // 3. Clean up expired email captures (12 months)
    await cleanupExpiredEmailCaptures(stats);

    // 4. Clean up orphaned files (90 days after user deletion)
    await cleanupOrphanedFiles(stats);

    const duration = Date.now() - startTime;
    logger.info("Data retention cleanup completed", {
      duration: `${duration}ms`,
      stats,
    });

    return stats;
  } catch (error) {
    logger.error("Data retention cleanup failed", { error });
    stats.errors.push(error instanceof Error ? error.message : String(error));
    return stats;
  }
}

/**
 * Clean up expired view sessions
 * Delete sessions older than 30 days
 */
async function cleanupExpiredSessions(stats: CleanupStats): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete sessions with expired retention dates
    const expiredSessions = await db
      .delete(viewSessions)
      .where(
        and(
          isNotNull(viewSessions.dataRetentionDate),
          lt(viewSessions.dataRetentionDate, new Date())
        )
      )
      .returning();

    // Also delete sessions older than 30 days (fallback)
    const oldSessions = await db
      .delete(viewSessions)
      .where(lt(viewSessions.startedAt, thirtyDaysAgo))
      .returning();

    const totalDeleted = expiredSessions.length + oldSessions.length;
    stats.sessionsDeleted = totalDeleted;

    if (totalDeleted > 0) {
      logger.info("Cleaned up expired view sessions", {
        expiredByRetentionDate: expiredSessions.length,
        expiredByAge: oldSessions.length,
        totalDeleted,
      });
    }
  } catch (error) {
    logger.error("Failed to cleanup expired sessions", { error });
    stats.errors.push(`Session cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Clean up expired analytics data
 * Delete analytics older than 26 months (Google Analytics default)
 */
async function cleanupExpiredAnalytics(stats: CleanupStats): Promise<void> {
  try {
    const twentySixMonthsAgo = new Date();
    twentySixMonthsAgo.setMonth(twentySixMonthsAgo.getMonth() - 26);

    const deletedAnalytics = await db
      .delete(analyticsSummary)
      .where(lt(analyticsSummary.createdAt, twentySixMonthsAgo))
      .returning();

    stats.analyticsDeleted = deletedAnalytics.length;

    if (deletedAnalytics.length > 0) {
      logger.info("Cleaned up expired analytics data", {
        deletedCount: deletedAnalytics.length,
        cutoffDate: twentySixMonthsAgo.toISOString(),
      });
    }
  } catch (error) {
    logger.error("Failed to cleanup expired analytics", { error });
    stats.errors.push(`Analytics cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Clean up expired email captures
 * Delete email captures older than 12 months
 */
async function cleanupExpiredEmailCaptures(stats: CleanupStats): Promise<void> {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const deletedCaptures = await db
      .delete(emailCaptures)
      .where(lt(emailCaptures.capturedAt, twelveMonthsAgo))
      .returning();

    stats.emailCapturesDeleted = deletedCaptures.length;

    if (deletedCaptures.length > 0) {
      logger.info("Cleaned up expired email captures", {
        deletedCount: deletedCaptures.length,
        cutoffDate: twelveMonthsAgo.toISOString(),
      });
    }
  } catch (error) {
    logger.error("Failed to cleanup expired email captures", { error });
    stats.errors.push(`Email captures cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Clean up orphaned files
 * Delete files that belong to deleted users (older than 90 days)
 */
async function cleanupOrphanedFiles(stats: CleanupStats): Promise<void> {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find orphaned files (files without a valid user)
    const orphanedFiles = await db
      .select({
        id: files.id,
        storageKey: files.storageKey,
        filename: files.filename,
        createdAt: files.createdAt,
      })
      .from(files)
      .leftJoin(require("../models/schema").users, require("../models/schema").users.id.eq(files.userId))
      .where(
        and(
          require("../models/schema").users.id.isNull(),
          lt(files.createdAt, ninetyDaysAgo)
        )
      );

    if (orphanedFiles.length === 0) {
      return;
    }

    // Delete files from S3 storage
    const s3DeletionPromises = orphanedFiles.map((file): Promise<void | null> =>
      deleteFromS3(file.storageKey).catch((error: unknown): null => {
        logger.warn("Failed to delete orphaned file from S3", {
          fileId: file.id,
          storageKey: file.storageKey,
          error,
        });
        return null;
      })
    );

    await Promise.all(s3DeletionPromises);

    // Delete orphaned files from database
    const fileIds = orphanedFiles.map((f): number => f.id);
    const deletedFiles = await db
      .delete(files)
      .where(require("drizzle-orm").inArray(files.id, fileIds))
      .returning();

    stats.orphanedFilesDeleted = deletedFiles.length;

    logger.info("Cleaned up orphaned files", {
      totalFound: orphanedFiles.length,
      deletedFromDatabase: deletedFiles.length,
      cutoffDate: ninetyDaysAgo.toISOString(),
    });
  } catch (error) {
    logger.error("Failed to cleanup orphaned files", { error });
    stats.errors.push(`Orphaned files cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Schedule the cleanup job to run daily
 * This should be called from a cron job or scheduler
 */
export function scheduleDataRetentionCleanup(): void {
  // Run cleanup every day at 2 AM
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(2, 0, 0, 0);
  
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const timeUntilNextRun = nextRun.getTime() - now.getTime();

  setTimeout(async () => {
    await runDataRetentionCleanup();
    // Schedule next run
    scheduleDataRetentionCleanup();
  }, timeUntilNextRun);

  logger.info("Scheduled next data retention cleanup", {
    nextRun: nextRun.toISOString(),
    timeUntilNextRun: `${Math.round(timeUntilNextRun / 1000 / 60)} minutes`,
  });
}

// Export for manual execution
export default runDataRetentionCleanup;

