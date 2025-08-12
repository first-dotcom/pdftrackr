// Shared API Types for Backend-Frontend Communication

// Base API Response Structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | { message: string; details?: any };
  message?: string;
}

// Paginated Response Structure
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// File Types
export interface File {
  id: number;
  userId: number;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  storageKey: string;
  storageUrl: string;
  title: string | null;
  description: string | null;
  isPublic: boolean;
  downloadEnabled: boolean;
  watermarkEnabled: boolean;
  password: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  fileHash: string | null;
  scanStatus: string | null;
  securityFlags: string[] | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  shareLinksCount: number;
  shareLinks?: ShareLink[];
}

// Share Link Types
export interface ShareLink {
  id: number;
  fileId: number;
  shareId: string;
  title: string | null;
  description: string | null;
  password: string | null;
  emailGatingEnabled: boolean;
  downloadEnabled: boolean;
  watermarkEnabled: boolean;
  expiresAt: string | null;
  maxViews: number | null;
  viewCount: number;
  uniqueViewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface User {
  id: number;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  plan: "free" | "pro" | "business";
  storageUsed: number;
  filesCount: number;
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface ViewDataPoint {
  date: string;
  views: number;
  uniqueViews: number;
  duration: number;
}

export interface DashboardData {
  totalFiles: number;
  totalViews: number;
  totalUniqueViews: number;
  totalDuration: number;
  avgDuration: number;
  emailCaptures: number;
  recentViews: ViewSession[];
  topFiles: TopFile[];
  viewsByDay: ViewDataPoint[];
}

export interface ViewSession {
  id: number;
  shareId: string;
  viewerEmail: string | null;
  viewerName: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  startedAt: string;
  totalDuration: number;
  isUnique: boolean;
}

export interface TopFile {
  fileId: number;
  title: string | null;
  originalName: string;
  viewCount: number;
  uniqueViewCount: number;
  totalDuration: number;
}

// Storage Usage Types
export interface StorageInfo {
  storageUsed: number;
  filesCount: number;
  storageQuota: number;
  filesQuota: number;
  plan: "free" | "pro" | "business";
}

// Waitlist Types
export interface WaitlistEntry {
  id: number;
  email: string;
  plan: "pro" | "business" | "either";
  source: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  referer: string | null;
  createdAt: string;
  updatedAt: string;
}

// API Endpoint Response Types
export interface FilesResponse extends ApiResponse<PaginatedResponse<File>> {}
export interface FileResponse extends ApiResponse<{ file: File }> {}
export interface ShareLinksResponse extends ApiResponse<PaginatedResponse<ShareLink>> {}
export interface ShareLinkResponse extends ApiResponse<{ shareLink: ShareLink; url: string }> {}
export interface UserResponse extends ApiResponse<{ user: User }> {}
export interface DashboardResponse extends ApiResponse<DashboardData> {}
export interface StorageResponse extends ApiResponse<StorageInfo> {}

// Request Types
export interface CreateShareLinkRequest {
  fileId: number;
  title: string;
  description?: string;
  password?: string;
  emailGatingEnabled: boolean;
  downloadEnabled: boolean;
  watermarkEnabled: boolean;
  expiresAt?: string;
  maxViews?: number;
}

export interface UpdateFileRequest {
  title?: string;
  description?: string;
  downloadEnabled?: boolean;
  watermarkEnabled?: boolean;
}

export interface UpdateShareLinkRequest {
  title?: string;
  description?: string;
  password?: string;
  emailGatingEnabled?: boolean;
  downloadEnabled?: boolean;
  watermarkEnabled?: boolean;
  expiresAt?: string;
  maxViews?: number;
}

export interface ShareAccessRequest {
  password?: string;
  email?: string;
}

// Pagination Types
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// Analytics Query Types
export interface AnalyticsQuery extends PaginationQuery {
  days?: number;
}
