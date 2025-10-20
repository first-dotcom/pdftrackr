import { eq, sql } from "drizzle-orm";
import { globalAnalytics, viewSessions, pageViews, files, shareLinks, emailCaptures } from "../models/schema";
import { db } from "../utils/database";
import { logger } from "../utils/logger";

export interface GlobalAnalyticsData {
  totalViews: number;
  totalUniqueViews: number;
  totalDuration: number;
  avgSessionDuration: number;
  totalFiles: number;
  totalShares: number;
  totalEmailCaptures: number;
}

/**
 * Global analytics service - READ-ONLY totals
 * 
 * WARNING: Never recalculate totals from live data (view_sessions, files, etc.)
 * This would decrease totals when historical data is pruned for GDPR compliance.
 * 
 * Only use increment methods to maintain lifetime totals:
 * - incrementFiles(), incrementShares(), incrementEmailCaptures()
 * - incrementViewsWithUnique(), updateDurationMetrics()
 */
export class GlobalAnalyticsService {

  /**
   * Get current global analytics data
   * Uses the same calculation logic as dashboard analytics
   */
  async getGlobalAnalytics(): Promise<GlobalAnalyticsData> {
    try {
      const result = await db
        .select()
        .from(globalAnalytics)
        .where(eq(globalAnalytics.id, 1))
        .limit(1);

      if (result.length === 0) {
        // Initialize if not exists
        await this.initializeGlobalAnalytics();
        return await this.getGlobalAnalytics();
      }

      return {
        totalViews: result[0].totalViews,
        totalUniqueViews: result[0].totalUniqueViews,
        totalDuration: result[0].totalDuration,
        avgSessionDuration: result[0].avgSessionDuration,
        totalFiles: result[0].totalFiles,
        totalShares: result[0].totalShares,
        totalEmailCaptures: result[0].totalEmailCaptures,
      };
    } catch (error) {
      logger.error("Failed to get global analytics", {
        error: error instanceof Error ? error.message : String(error),
      });
      
      // Return safe fallback data
      return {
        totalViews: 0,
        totalUniqueViews: 0,
        totalDuration: 0,
        avgSessionDuration: 0,
        totalFiles: 0,
        totalShares: 0,
        totalEmailCaptures: 0,
      };
    }
  }

  // REMOVED: calculateCurrentStats() method
  // This method was dangerous as it recalculated from live data and could decrease totals
  // when historical data is pruned for GDPR compliance. Only use increment methods.

  /**
   * Initialize global analytics table if it doesn't exist
   */
  private async initializeGlobalAnalytics(): Promise<void> {
    try {
      await db
        .insert(globalAnalytics)
        .values({
          id: 1,
          totalViews: 0,
          totalUniqueViews: 0,
          totalDuration: 0,
          avgSessionDuration: 0,
          totalFiles: 0,
          totalShares: 0,
          totalEmailCaptures: 0,
        })
        .onConflictDoNothing();

      logger.info("Global analytics table initialized");
    } catch (error) {
      logger.error("Failed to initialize global analytics", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Increment specific counters when new activity happens
   * This is more efficient than recalculating everything
   */

  async incrementFiles(count: number = 1): Promise<void> {
    try {
      await db
        .update(globalAnalytics)
        .set({
          totalFiles: sql`${globalAnalytics.totalFiles} + ${count}`,
          lastUpdated: new Date(),
        })
        .where(eq(globalAnalytics.id, 1));
    } catch (error) {
      logger.error("Failed to increment files in global analytics", { error });
    }
  }

  async incrementShares(count: number = 1): Promise<void> {
    try {
      await db
        .update(globalAnalytics)
        .set({
          totalShares: sql`${globalAnalytics.totalShares} + ${count}`,
          lastUpdated: new Date(),
        })
        .where(eq(globalAnalytics.id, 1));
    } catch (error) {
      logger.error("Failed to increment shares in global analytics", { error });
    }
  }

  async incrementEmailCaptures(count: number = 1): Promise<void> {
    try {
      await db
        .update(globalAnalytics)
        .set({
          totalEmailCaptures: sql`${globalAnalytics.totalEmailCaptures} + ${count}`,
          lastUpdated: new Date(),
        })
        .where(eq(globalAnalytics.id, 1));
    } catch (error) {
      logger.error("Failed to increment email captures in global analytics", { error });
    }
  }

  /**
   * Increment view counts when a new view happens (with unique tracking)
   * This ensures global analytics stay up-to-date in real-time
   */
  async incrementViewsWithUnique(isUnique: boolean): Promise<void> {
    try {
      await db
        .update(globalAnalytics)
        .set({
          totalViews: sql`${globalAnalytics.totalViews} + 1`,
          totalUniqueViews: isUnique ? sql`${globalAnalytics.totalUniqueViews} + 1` : sql`${globalAnalytics.totalUniqueViews}`,
          lastUpdated: new Date(),
        })
        .where(eq(globalAnalytics.id, 1));
    } catch (error) {
      logger.error("Failed to increment views in global analytics", { error });
    }
  }

  /**
   * Update duration metrics when session ends
   * This ensures avg session duration stays accurate
   */
  async updateDurationMetrics(sessionDuration: number): Promise<void> {
    try {
      // Update total duration and recalculate average
      await db
        .update(globalAnalytics)
        .set({
          totalDuration: sql`${globalAnalytics.totalDuration} + ${sessionDuration}`,
          avgSessionDuration: sql`(
            SELECT COALESCE(AVG(
              CASE 
                WHEN vs.total_duration > 0 THEN vs.total_duration
                ELSE (
                  SELECT COALESCE(SUM(CASE WHEN pv.duration > 0 THEN pv.duration ELSE 0 END), 1000)
                  FROM page_views pv WHERE pv.session_id = vs.session_id
                )
              END
            ), 0)
            FROM view_sessions vs
          )`,
          lastUpdated: new Date(),
        })
        .where(eq(globalAnalytics.id, 1));
    } catch (error) {
      logger.error("Failed to update duration metrics in global analytics", { error });
    }
  }
}

export const globalAnalyticsService = new GlobalAnalyticsService();
