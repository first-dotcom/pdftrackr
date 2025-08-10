import { and, desc, eq, or } from "drizzle-orm";
import { auditLogs, viewSessions, pageViews } from "../models/schema";
import { db } from "../utils/database";
import { logger } from "../utils/logger";
import { geolocationService } from "./geolocation";

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
      // 🌍 ENRICH WITH GEOLOCATION DATA
      const enrichedMetadata = data.ip 
        ? await geolocationService.enrichAuditLogWithLocation(data.ip, data.metadata || {})
        : (data.metadata || {});

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
          metadata: enrichedMetadata,
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

  // 📊 NEW HIGH-VALUE ANALYTICS EVENTS
  async logPageView(data: {
    shareId: string;
    fileId?: string;
    ip: string;
    userAgent: string;
    email?: string;
    page: number;
    totalPages: number;
  }) {
    const readingDepth = Math.round((data.page / data.totalPages) * 100);
    
    return this.logEvent({
      event: "page_view",
      shareId: data.shareId,
      fileId: data.fileId,
      ip: data.ip,
      userAgent: data.userAgent,
      email: data.email,
      success: true,
      metadata: {
        page: data.page,
        totalPages: data.totalPages,
        readingDepth,
        isCompletion: readingDepth >= 100,
      },
    });
  }

  async logSessionEnd(data: {
    shareId: string;
    fileId?: string;
    ip: string;
    userAgent: string;
    email?: string;
    durationSeconds: number;
    pagesViewed: number;
    totalPages: number;
    maxPageReached: number;
  }) {
    const completionRate = Math.round((data.maxPageReached / data.totalPages) * 100);
    const engagementScore = this.calculateEngagementScore(
      data.durationSeconds, 
      data.maxPageReached, 
      data.totalPages
    );

    return this.logEvent({
      event: "session_end",
      shareId: data.shareId,
      fileId: data.fileId,
      ip: data.ip,
      userAgent: data.userAgent,
      email: data.email,
      success: true,
      metadata: {
        durationSeconds: data.durationSeconds,
        durationMinutes: Math.round(data.durationSeconds / 60),
        pagesViewed: data.pagesViewed,
        totalPages: data.totalPages,
        maxPageReached: data.maxPageReached,
        completionRate,
        engagementScore,
        readingSpeed: data.durationSeconds > 0 ? Math.round(data.pagesViewed / (data.durationSeconds / 60)) : 0, // pages per minute
      },
    });
  }

  async logReturnVisit(data: {
    shareId: string;
    fileId?: string;
    ip: string;
    userAgent: string;
    email?: string;
    totalVisits: number;
    daysSinceFirst: number;
  }) {
    return this.logEvent({
      event: "return_visit",
      shareId: data.shareId,
      fileId: data.fileId,
      ip: data.ip,
      userAgent: data.userAgent,
      email: data.email,
      success: true,
      metadata: {
        totalVisits: data.totalVisits,
        daysSinceFirst: data.daysSinceFirst,
        visitorType: data.totalVisits === 1 ? "new" : data.totalVisits < 5 ? "returning" : "frequent",
      },
    });
  }

  // 🧮 ENGAGEMENT CALCULATION
  private calculateEngagementScore(
    durationSeconds: number, 
    maxPageReached: number, 
    totalPages: number
  ): number {
    const completionWeight = (maxPageReached / totalPages) * 50;
    const timeWeight = Math.min(durationSeconds / 180, 1) * 30; // 3 minutes = good engagement
    const depthWeight = maxPageReached > 1 ? 20 : 0;
    
    return Math.round(completionWeight + timeWeight + depthWeight);
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

  // 📊 HIGH-IMPACT BUSINESS ANALYTICS - Fixed to use viewSessions for consistency
  async getDocumentEngagementStats(shareId: string) {
    try {
      // Use viewSessions for consistent analytics calculation (same as dashboard)
      const sessions = await db
        .select({
          id: viewSessions.id,
          sessionId: viewSessions.sessionId,
          totalDuration: viewSessions.totalDuration,
          isUnique: viewSessions.isUnique,
          startedAt: viewSessions.startedAt,
        })
        .from(viewSessions)
        .where(eq(viewSessions.shareId, shareId))
        .orderBy(desc(viewSessions.startedAt));

      // Get page views for completion rate calculation
      const pageViewsData = await db
        .select({
          sessionId: pageViews.sessionId,
          pageNumber: pageViews.pageNumber,
          duration: pageViews.duration,
        })
        .from(pageViews)
        .innerJoin(viewSessions, eq(pageViews.sessionId, viewSessions.sessionId))
        .where(eq(viewSessions.shareId, shareId));

      // Calculate metrics using same logic as dashboard
      const totalViews = sessions.length;
      const uniqueViewers = sessions.filter(s => s.isUnique).length;
      
      const avgSessionDuration = sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0) / sessions.length)
        : 0;

      // Calculate completion rate based on page views
      const sessionPageCounts = new Map<string, number>();
      pageViewsData.forEach((pv: any) => {
        sessionPageCounts.set(pv.sessionId, Math.max(sessionPageCounts.get(pv.sessionId) || 0, pv.pageNumber));
      });

      const completionRate = sessions.length > 0
        ? Math.round((Array.from(sessionPageCounts.values()).filter(maxPage => maxPage >= 3).length / sessions.length) * 100)
        : 0;

      return {
        shareId,
        totalViews,
        uniqueViewers,
        avgReadingDepth: 0, // Deprecated - not used in UI
        avgSessionDuration,
        completionRate,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get document engagement stats: ${errorMessage}`);
      return null;
    }
  }

  async getUserEngagementProfile(email: string) {
    try {
      const userLogs = await db.select()
        .from(auditLogs)
        .where(eq(auditLogs.email, email))
        .orderBy(auditLogs.timestamp);

      const documentsViewed = new Set(userLogs.map(log => log.shareId)).size;
      const totalViews = userLogs.filter(log => log.event === 'pdf_access').length;
      const sessionEndLogs = userLogs.filter(log => log.event === 'session_end');
      const avgEngagement = sessionEndLogs.length > 0
        ? sessionEndLogs.reduce((sum, log) => {
            const engagement = (log.metadata as any)?.engagementScore;
            return sum + (typeof engagement === 'number' ? engagement : 0);
          }, 0) / sessionEndLogs.length
        : 0;

      const firstVisit = userLogs[0]?.timestamp;
      const lastVisit = userLogs[userLogs.length - 1]?.timestamp;

      return {
        email,
        documentsViewed,
        totalViews,
        avgEngagement: Math.round(avgEngagement),
        firstVisit,
        lastVisit,
        loyaltyScore: this.calculateLoyaltyScore(totalViews, documentsViewed, firstVisit),
        preferredReadingTimes: this.getPreferredReadingTimes(userLogs),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to get user engagement profile: ${errorMessage}`);
      return null;
    }
  }

  // Removed complex getTopPerformingDocuments method

  // 🔧 HELPER METHODS
  private calculatePeakReadingTime(logs: any[]): string {
    const hours = logs.reduce((acc, log) => {
      const hour = new Date(log.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHour = Object.entries(hours).reduce((a, b) => {
      const hourA = parseInt(a[0]);
      const hourB = parseInt(b[0]);
      return (hours[hourA] || 0) > (hours[hourB] || 0) ? a : b;
    })[0];
    return `${peakHour}:00`;
  }

  private calculateEngagementTrend(sessions: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (sessions.length < 2) return 'stable';
    
    const recent = sessions.slice(-5).reduce((sum, s) => sum + (s.metadata?.engagementScore || 0), 0) / 5;
    const older = sessions.slice(0, -5).reduce((sum, s) => sum + (s.metadata?.engagementScore || 0), 0) / Math.max(1, sessions.length - 5);
    
    if (recent > older * 1.1) return 'increasing';
    if (recent < older * 0.9) return 'decreasing';
    return 'stable';
  }

  private getTopPages(pageViews: any[]): number[] {
    const pageCounts = pageViews.reduce((acc, view) => {
      const page = (view.metadata as any)?.page || 1;
      const pageNum = typeof page === 'number' ? page : 1;
      acc[pageNum] = (acc[pageNum] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(pageCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([page]) => parseInt(page));
  }

  private getDeviceBreakdown(logs: any[]): { mobile: number; desktop: number; tablet: number } {
    return logs.reduce((acc, log) => {
      const ua = log.userAgent?.toLowerCase() || '';
      if (ua.includes('mobile')) acc.mobile++;
      else if (ua.includes('tablet')) acc.tablet++;
      else acc.desktop++;
      return acc;
    }, { mobile: 0, desktop: 0, tablet: 0 });
  }

  private calculateLoyaltyScore(totalViews: number, documentsViewed: number, firstVisit?: Date): number {
    if (!firstVisit) return 0;
    
    const daysSinceFirst = Math.floor((Date.now() - firstVisit.getTime()) / (1000 * 60 * 60 * 24));
    const frequency = totalViews / Math.max(1, daysSinceFirst);
    const diversity = documentsViewed / Math.max(1, totalViews);
    
    return Math.round((frequency * 50) + (diversity * 30) + (Math.min(daysSinceFirst / 30, 1) * 20));
  }

  private getPreferredReadingTimes(logs: any[]): number[] {
    const hours = logs.reduce((acc, log) => {
      const hour = new Date(log.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(hours)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  // Removed complex geographic analytics methods
}

export const auditService = new AuditService();
