import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Users table
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    plan: varchar("plan", { length: 20 }).notNull().default("free"), // free, starter, pro, business
    storageUsed: bigint("storage_used", { mode: "number" }).notNull().default(0),
    filesCount: integer("files_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    clerkIdIdx: uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

// Files table
export const files = pgTable(
  "files",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    filename: varchar("filename", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    storageKey: varchar("storage_key", { length: 500 }).notNull(),
    storageUrl: text("storage_url").notNull(),
    title: varchar("title", { length: 255 }),
    description: text("description"),
    isPublic: boolean("is_public").notNull().default(false),
    downloadEnabled: boolean("download_enabled").notNull().default(true),
    watermarkEnabled: boolean("watermark_enabled").notNull().default(false),
    password: varchar("password", { length: 255 }), // hashed password for protected files
    // Security tracking fields
    ipAddress: varchar("ip_address", { length: 45 }), // IPv6 support
    userAgent: text("user_agent"),
    fileHash: varchar("file_hash", { length: 64 }), // SHA-256 hash
    scanStatus: varchar("scan_status", { length: 20 }).default("passed"), // passed, failed, pending
    securityFlags: json("security_flags").$type<string[]>(), // Array of security warnings
    pageCount: integer("page_count"), // Actual page count from PDF.js
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("files_user_id_idx").on(table.userId),
    createdAtIdx: index("files_created_at_idx").on(table.createdAt),
    hashIdx: index("files_hash_idx").on(table.fileHash), // For duplicate detection
    ipIdx: index("files_ip_idx").on(table.ipAddress), // For security monitoring
  }),
);

// Share links table
export const shareLinks = pgTable(
  "share_links",
  {
    id: serial("id").primaryKey(),
    fileId: integer("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    shareId: varchar("share_id", { length: 50 }).notNull().unique(), // nanoid for URL
    title: varchar("title", { length: 255 }),
    description: text("description"),
    password: varchar("password", { length: 255 }), // hashed password
    emailGatingEnabled: boolean("email_gating_enabled").notNull().default(false),
    downloadEnabled: boolean("download_enabled").notNull().default(true),
    watermarkEnabled: boolean("watermark_enabled").notNull().default(false),
    expiresAt: timestamp("expires_at"),
    maxViews: integer("max_views"),
    viewCount: integer("view_count").notNull().default(0),
    uniqueViewCount: integer("unique_view_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    shareIdIdx: uniqueIndex("share_links_share_id_idx").on(table.shareId),
    fileIdIdx: index("share_links_file_id_idx").on(table.fileId),
    expiresAtIdx: index("share_links_expires_at_idx").on(table.expiresAt),
  }),
);

// View sessions table - tracks individual viewing sessions
export const viewSessions = pgTable(
  "view_sessions",
  {
    id: serial("id").primaryKey(),
    shareId: varchar("share_id", { length: 50 })
      .notNull()
      .references(() => shareLinks.shareId, { onDelete: "cascade" }),
    sessionId: uuid("session_id").notNull(), // unique session identifier
    viewerEmail: varchar("viewer_email", { length: 255 }),
    viewerName: varchar("viewer_name", { length: 255 }),
    // GDPR-compliant IP tracking - store hashed IP instead of plain text
    ipAddressHash: varchar("ip_address_hash", { length: 64 }), // SHA-256 hash of IP
    ipAddressCountry: varchar("ip_address_country", { length: 2 }), // Country from IP (no personal data)
    userAgent: text("user_agent"),
    referer: text("referer"),
    country: varchar("country", { length: 2 }),
    city: varchar("city", { length: 100 }),
    device: varchar("device", { length: 50 }), // mobile, desktop, tablet
    browser: varchar("browser", { length: 50 }),
    os: varchar("os", { length: 50 }),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
    totalDuration: integer("total_duration").notNull().default(0), // in seconds
    isUnique: boolean("is_unique").notNull().default(true), // first time viewing this share link
    // GDPR compliance
    consentGiven: boolean("consent_given").notNull().default(false), // User consented to tracking
    dataRetentionDate: timestamp("data_retention_date"), // When this data should be deleted
    // Security tracking
    suspiciousFlags: json("suspicious_flags").$type<string[]>(), // Security warnings
    riskScore: integer("risk_score").default(0), // 0-100 risk assessment
    // Session activity tracking
    isActive: boolean("is_active").notNull().default(true), // Track if session is active
  },
  (table) => ({
    shareIdIdx: index("view_sessions_share_id_idx").on(table.shareId),
    sessionIdIdx: uniqueIndex("view_sessions_session_id_idx").on(table.sessionId),
    startedAtIdx: index("view_sessions_started_at_idx").on(table.startedAt),
    ipHashIdx: index("view_sessions_ip_hash_idx").on(table.ipAddressHash), // Security monitoring
    riskIdx: index("view_sessions_risk_idx").on(table.riskScore),
    retentionIdx: index("view_sessions_retention_idx").on(table.dataRetentionDate), // GDPR cleanup
  }),
);

// Page views table - tracks individual page views within a session
export const pageViews = pgTable(
  "page_views",
  {
    id: serial("id").primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => viewSessions.sessionId, { onDelete: "cascade" }),
    pageNumber: integer("page_number").notNull(),
    viewedAt: timestamp("viewed_at").defaultNow().notNull(),
    duration: integer("duration").notNull().default(0), // time spent on page in seconds
  },
  (table) => ({
    sessionIdIdx: index("page_views_session_id_idx").on(table.sessionId),
    pageNumberIdx: index("page_views_page_number_idx").on(table.pageNumber),
    viewedAtIdx: index("page_views_viewed_at_idx").on(table.viewedAt),
  }),
);

// Email captures table - for email gating
export const emailCaptures = pgTable(
  "email_captures",
  {
    id: serial("id").primaryKey(),
    shareId: varchar("share_id", { length: 50 })
      .notNull()
      .references(() => shareLinks.shareId, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    referer: text("referer"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => ({
    shareIdIdx: index("email_captures_share_id_idx").on(table.shareId),
    emailIdx: index("email_captures_email_idx").on(table.email),
    capturedAtIdx: index("email_captures_captured_at_idx").on(table.capturedAt),
  }),
);

// Analytics summary table - for quick dashboard queries
export const analyticsSummary = pgTable(
  "analytics_summary",
  {
    id: serial("id").primaryKey(),
    fileId: integer("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
    totalViews: integer("total_views").notNull().default(0),
    uniqueViews: integer("unique_views").notNull().default(0),
    totalDuration: integer("total_duration").notNull().default(0), // in seconds
    avgDuration: integer("avg_duration").notNull().default(0), // in seconds
    emailCaptures: integer("email_captures").notNull().default(0),
    countries: json("countries").$type<Record<string, number>>(), // country code -> count
    devices: json("devices").$type<Record<string, number>>(), // device type -> count
    referers: json("referers").$type<Record<string, number>>(), // referer -> count
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    fileIdDateIdx: uniqueIndex("analytics_summary_file_id_date_idx").on(table.fileId, table.date),
    dateIdx: index("analytics_summary_date_idx").on(table.date),
  }),
);

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  files: many(files),
  feedback: many(feedback),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  user: one(users, {
    fields: [files.userId],
    references: [users.id],
  }),
  shareLinks: many(shareLinks),
  analyticsSummary: many(analyticsSummary),
}));

export const shareLinksRelations = relations(shareLinks, ({ one, many }) => ({
  file: one(files, {
    fields: [shareLinks.fileId],
    references: [files.id],
  }),
  viewSessions: many(viewSessions),
  emailCaptures: many(emailCaptures),
}));

export const viewSessionsRelations = relations(viewSessions, ({ one, many }) => ({
  shareLink: one(shareLinks, {
    fields: [viewSessions.shareId],
    references: [shareLinks.shareId],
  }),
  pageViews: many(pageViews),
}));

export const pageViewsRelations = relations(pageViews, ({ one }) => ({
  session: one(viewSessions, {
    fields: [pageViews.sessionId],
    references: [viewSessions.sessionId],
  }),
}));

export const emailCapturesRelations = relations(emailCaptures, ({ one }) => ({
  shareLink: one(shareLinks, {
    fields: [emailCaptures.shareId],
    references: [shareLinks.shareId],
  }),
}));

export const analyticsSummaryRelations = relations(analyticsSummary, ({ one }) => ({
  file: one(files, {
    fields: [analyticsSummary.fileId],
    references: [files.id],
  }),
}));

// Waitlist table for premium plan signups
export const waitlist = pgTable(
  "waitlist",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    plan: varchar("plan", { length: 20 }).notNull(), // starter, pro, business, either
    source: varchar("source", { length: 100 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    referer: varchar("referer", { length: 500 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("waitlist_email_idx").on(table.email),
    planIdx: index("waitlist_plan_idx").on(table.plan),
    createdAtIdx: index("waitlist_created_at_idx").on(table.createdAt),
  }),
);

// Feedback table
export const feedback = pgTable(
  "feedback",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    rating: integer("rating"), // 1-5 stars
    category: varchar("category", { length: 50 }), // bug, feature, general, etc.
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, reviewed, resolved, closed
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("feedback_user_id_idx").on(table.userId),
    createdAtIdx: index("feedback_created_at_idx").on(table.createdAt),
    statusIdx: index("feedback_status_idx").on(table.status),
    categoryIdx: index("feedback_category_idx").on(table.category),
    userCreatedIdx: index("feedback_user_created_idx").on(table.userId, table.createdAt), // For rate limiting
  }),
);

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

// Audit Logs table
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    event: varchar("event", { length: 50 }).notNull(),
    fileId: varchar("file_id", { length: 255 }),
    shareId: varchar("share_id", { length: 255 }),
    userId: varchar("user_id", { length: 255 }),
    ipAddress: varchar("ip_address", { length: 45 }), // IPv6 max length
    userAgent: text("user_agent"),
    email: varchar("email", { length: 255 }),
    success: boolean("success"),
    scanResult: varchar("scan_result", { length: 20 }), // clean, infected, failed
    threats: json("threats").$type<string[]>().default([]),
    scanners: json("scanners").$type<string[]>().default([]),
    metadata: json("metadata").$type<Record<string, unknown>>().default({}),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => ({
    eventIdx: index("audit_logs_event_idx").on(table.event),
    fileIdIdx: index("audit_logs_file_id_idx").on(table.fileId),
    shareIdIdx: index("audit_logs_share_id_idx").on(table.shareId),
    timestampIdx: index("audit_logs_timestamp_idx").on(table.timestamp),
    fileTimestampIdx: index("audit_logs_file_timestamp_idx").on(table.fileId, table.timestamp),
    ipIdx: index("audit_logs_ip_idx").on(table.ipAddress),
  }),
);
