import type { 
  users, 
  files, 
  shareLinks, 
  viewSessions, 
  pageViews, 
  emailCaptures, 
  analyticsSummary 
} from '../models/schema';

// Infer types from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

export type ShareLink = typeof shareLinks.$inferSelect;
export type NewShareLink = typeof shareLinks.$inferInsert;

export type ViewSession = typeof viewSessions.$inferSelect;
export type NewViewSession = typeof viewSessions.$inferInsert;

export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;

export type EmailCapture = typeof emailCaptures.$inferSelect;
export type NewEmailCapture = typeof emailCaptures.$inferInsert;

export type AnalyticsSummary = typeof analyticsSummary.$inferSelect;
export type NewAnalyticsSummary = typeof analyticsSummary.$inferInsert;

// User plans
export type UserPlan = 'free' | 'pro' | 'team';

// File with relations
export type FileWithUser = File & {
  user: User;
};

export type FileWithShareLinks = File & {
  shareLinks: ShareLink[];
};

// Share link with relations
export type ShareLinkWithFile = ShareLink & {
  file: FileWithUser;
};

// View session with relations
export type ViewSessionWithPageViews = ViewSession & {
  pageViews: PageView[];
};

// Analytics types
export interface ViewerLocation {
  country?: string;
  city?: string;
}

export interface ViewerDevice {
  device?: string;
  browser?: string;
  os?: string;
}

export interface ViewerInfo extends ViewerLocation, ViewerDevice {
  email?: string;
  name?: string;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
}

export interface FileAnalytics {
  totalViews: number;
  uniqueViews: number;
  totalDuration: number;
  avgDuration: number;
  emailCaptures: number;
  topCountries: Array<{ country: string; count: number }>;
  topDevices: Array<{ device: string; count: number }>;
  topReferers: Array<{ referer: string; count: number }>;
  viewsOverTime: Array<{ date: string; views: number; uniqueViews: number }>;
}

export interface DashboardStats {
  totalFiles: number;
  totalViews: number;
  totalUniqueViews: number;
  totalEmailCaptures: number;
  storageUsed: number;
  storageQuota: number;
  filesQuota: number;
  recentFiles: FileWithShareLinks[];
}