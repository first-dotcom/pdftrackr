import { and, eq, or } from "drizzle-orm";
import { auditLogs } from "../models/schema";
import { db } from "../utils/database";
import { logger } from "../utils/logger";

export interface AuditLogData {
  event: string;
  fileId?: string;
  shareId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  email?: string;
  success?: boolean;
  scanResult?: "clean" | "infected" | "failed";
  threats?: string[];
  scanners?: string[];
  fileSize?: number;
  filename?: string;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  async logEvent(data: AuditLogData) {
    try {
      const logEntry = await db
        .insert(auditLogs)
        .values({
          event: data.event,
          fileId: data.fileId || null,
          shareId: data.shareId || null,
          userId: data.userId || null,
          ipAddress: data.ip || null,
          userAgent: data.userAgent || null,
          email: data.email || null,
          success: data.success ?? null,
          scanResult: data.scanResult || null,
          threats: data.threats || [],
          scanners: data.scanners || [],
          metadata: data.metadata || {},
          timestamp: new Date(),
        })
        .returning();

      logger.info(
        `Audit log created: ${data.event} for ${data.fileId || data.shareId || "unknown"}`,
      );
      return logEntry;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to create audit log: ${errorMessage}`, { data });
      // Don't throw - audit logging should never break the main flow
      return null;
    }
  }

  async logFileUpload(data: {
    fileId: string;
    userId: string;
    ip: string;
    userAgent: string;
    fileSize: number;
    filename: string;
  }) {
    return this.logEvent({
      event: "file_upload",
      ...data,
    });
  }

  async logVirusScan(data: {
    fileId: string;
    isClean: boolean;
    threats?: string[];
    scanners: string[];
    error?: string;
  }) {
    return this.logEvent({
      event: "virus_scan",
      fileId: data.fileId,
      scanResult: data.isClean ? "clean" : data.error ? "failed" : "infected",
      threats: data.threats,
      scanners: data.scanners,
      metadata: data.error ? { error: data.error } : {},
    });
  }

  async logPDFAccess(data: {
    shareId: string;
    fileId?: string;
    ip: string;
    userAgent: string;
    email?: string;
    success: boolean;
    error?: string;
  }) {
    return this.logEvent({
      event: "pdf_access",
      shareId: data.shareId,
      fileId: data.fileId,
      ip: data.ip,
      userAgent: data.userAgent,
      email: data.email,
      success: data.success,
      metadata: data.error ? { error: data.error } : {},
    });
  }

  async logShareLinkCreated(data: {
    shareId: string;
    fileId: string;
    userId: string;
    expiresAt: Date;
    passwordProtected: boolean;
    emailGated: boolean;
  }) {
    return this.logEvent({
      event: "share_link_created",
      shareId: data.shareId,
      fileId: data.fileId,
      userId: data.userId,
      metadata: {
        expiresAt: data.expiresAt,
        passwordProtected: data.passwordProtected,
        emailGated: data.emailGated,
      },
    });
  }

  async logSuspiciousActivity(data: {
    shareId?: string;
    fileId?: string;
    ip: string;
    activityType: string;
    details: string;
  }) {
    return this.logEvent({
      event: "suspicious_activity",
      shareId: data.shareId,
      fileId: data.fileId,
      ip: data.ip,
      success: false,
      metadata: {
        activityType: data.activityType,
        details: data.details,
      },
    });
  }

  // Analytics queries
  async getFileAnalytics(fileId: string) {
    try {
      const logs = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            or(
              eq(auditLogs.fileId, fileId),
              // TODO: Add shareId lookup logic if needed
            ),
            eq(auditLogs.event, "pdf_access"),
            eq(auditLogs.success, true),
          ),
        )
        .orderBy(auditLogs.timestamp);

      const uniqueIPs = new Set(logs.map((log) => log.ipAddress).filter(Boolean));
      const totalViews = logs.length;
      const lastViewed = logs[0]?.timestamp;

      return {
        totalViews,
        uniqueViewers: uniqueIPs.size,
        lastViewed,
        recentViews: logs.slice(0, 10).map((log) => ({
          timestamp: log.timestamp,
          ip: log.ipAddress,
          email: log.email,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get file analytics: ${errorMessage}`);
      return null;
    }
  }

  async getSecuritySummary(fileId: string) {
    try {
      const suspiciousLogs = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            or(eq(auditLogs.fileId, fileId), eq(auditLogs.event, "suspicious_activity")),
            eq(auditLogs.success, false),
          ),
        )
        .orderBy(auditLogs.timestamp)
        .limit(10);

      const scanLogs = await db
        .select()
        .from(auditLogs)
        .where(and(eq(auditLogs.fileId, fileId), eq(auditLogs.event, "virus_scan")))
        .orderBy(auditLogs.timestamp)
        .limit(1);

      return {
        suspiciousActivity: suspiciousLogs.length,
        lastScan: scanLogs[0],
        recentSuspiciousActivity: suspiciousLogs.map((log) => ({
          timestamp: log.timestamp,
          ip: log.ipAddress,
          details: log.metadata,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get security summary: ${errorMessage}`);
      return null;
    }
  }
}

export const auditService = new AuditService();
