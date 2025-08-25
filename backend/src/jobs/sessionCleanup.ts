import { SessionService } from "../services/sessionService";
import { logger } from "../utils/logger";

/**
 * Background job to clean up inactive sessions
 * Runs every 5 minutes
 */
export async function cleanupInactiveSessions() {
  try {
    logger.debug("Starting session cleanup job");
    
    const closedCount = await SessionService.closeInactiveSessions();
    
    if (closedCount > 0) {
      logger.info(`Session cleanup completed: ${closedCount} sessions closed`);
    } else {
      logger.debug("Session cleanup completed: no inactive sessions found");
    }
  } catch (error) {
    logger.error("Session cleanup job failed:", error);
  }
}

/**
 * Schedule the cleanup job
 * This should be called from your main application startup
 */
export function scheduleSessionCleanup() {
  // Run every 5 minutes
  const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  setInterval(cleanupInactiveSessions, CLEANUP_INTERVAL);
  
  // Run immediately on startup
  cleanupInactiveSessions();
  
  logger.info("Session cleanup job scheduled");
}
