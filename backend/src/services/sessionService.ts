import { and, eq, lt, sql } from "drizzle-orm";
import { viewSessions } from "../models/schema";
import { db } from "../utils/database";
import { logger } from "../utils/logger";

export class SessionService {
  /**
   * Auto-close inactive sessions
   * Sessions are considered inactive after 30 minutes of no activity
   */
  static async closeInactiveSessions() {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      // Close inactive sessions (don't recalculate duration - let session end tracking handle it)
      const result = await db
        .update(viewSessions)
        .set({
          isActive: false,
        })
        .where(
          and(
            eq(viewSessions.isActive, true),
            lt(viewSessions.lastActiveAt, thirtyMinutesAgo)
          )
        )
        .returning({ sessionId: viewSessions.sessionId });

      if (result.length > 0) {
        logger.info(`Auto-closed ${result.length} inactive sessions`);
      }

      return result.length;
    } catch (error) {
      logger.error("Failed to close inactive sessions:", error);
      return 0;
    }
  }

  /**
   * Update session activity
   */
  static async updateSessionActivity(sessionId: string) {
    try {
      await db
        .update(viewSessions)
        .set({
          lastActiveAt: new Date(),
          isActive: true,
        })
        .where(eq(viewSessions.sessionId, sessionId));

      return true;
    } catch (error) {
      logger.error("Failed to update session activity:", error);
      return false;
    }
  }

  /**
   * Close a specific session
   */
  static async closeSession(sessionId: string, durationMs?: number) {
    try {
      const updateData: any = {
        isActive: false,
      };

      // Only set total_duration if explicitly provided (from session end tracking)
      if (durationMs !== undefined) {
        updateData.totalDuration = durationMs; // Store in milliseconds
      }
      // Don't calculate duration from lastActiveAt - let session end tracking handle it

      await db
        .update(viewSessions)
        .set(updateData)
        .where(eq(viewSessions.sessionId, sessionId));

      return true;
    } catch (error) {
      logger.error("Failed to close session:", error);
      return false;
    }
  }
}
