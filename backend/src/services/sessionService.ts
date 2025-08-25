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
      
      // Calculate session duration and close inactive sessions
      const result = await db
        .update(viewSessions)
        .set({
          totalDuration: sql`EXTRACT(EPOCH FROM (${viewSessions.lastActiveAt} - ${viewSessions.startedAt}))::integer`,
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
  static async closeSession(sessionId: string, durationSeconds?: number) {
    try {
      const updateData: any = {
        isActive: false,
      };

      if (durationSeconds !== undefined) {
        updateData.totalDuration = durationSeconds;
      } else {
        // Calculate duration if not provided
        updateData.totalDuration = sql`EXTRACT(EPOCH FROM (${viewSessions.lastActiveAt} - ${viewSessions.startedAt}))::integer`;
      }

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
