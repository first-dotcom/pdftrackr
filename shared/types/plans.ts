// Plan Types
export type UserPlan = "free" | "starter" | "pro" | "business";
export type WaitlistPlan = "starter" | "pro" | "business" | "either";

// Plan Hierarchy for permission checking
export const planHierarchy = { free: 0, starter: 1, pro: 2, business: 3 } as const;

// Centralized file size limits - single source of truth
export const FILE_SIZE_LIMITS = {
  free: 50 * 1024 * 1024,      // 50MB
  starter: 125 * 1024 * 1024,   // 125MB
  pro: 250 * 1024 * 1024,       // 250MB
  business: 500 * 1024 * 1024,  // 500MB
} as const;

// Helper function to get file size limit for a plan
export const getFileSizeLimit = (plan: UserPlan): number => FILE_SIZE_LIMITS[plan];

// Helper function to format file size limit for display
export const getFileSizeLimitDisplay = (plan: UserPlan): string => {
  const bytes = FILE_SIZE_LIMITS[plan];
  const mb = bytes / (1024 * 1024);
  return `${mb}MB`;
};

// Quota Configuration - Single source of truth for both frontend and backend
export const planQuotas = {
  free: {
    storage: 500 * 1024 * 1024, // 500MB
    fileCount: 25, // 25 files
    fileSize: FILE_SIZE_LIMITS.free, // 50MB per file
    shareLinks: 25, // 25 share links
    analyticsRetention: 30, // 30 days
    passwordProtection: true,
    emailGating: true,
    downloadControl: true,
    virusScanning: true,
    linkExpiration: true,
    fullAnalytics: true,
    // Paid plan extras
    emailNotifications: false,
    customBranding: false,
    prioritySupport: false,
    apiAccess: false,
    bulkOperations: false,
    exportAnalytics: false,
  },
  starter: {
    storage: 2 * 1024 * 1024 * 1024, // 2GB
    fileCount: 100, // 100 files
    fileSize: FILE_SIZE_LIMITS.starter, // 125MB per file
    shareLinks: 100, // 100 share links
    analyticsRetention: 30, // 30 days
    passwordProtection: true,
    emailGating: true,
    downloadControl: true,
    virusScanning: true,
    linkExpiration: true,
    fullAnalytics: true,
    // Paid plan extras
    emailNotifications: true,
    customBranding: false,
    prioritySupport: false,
    apiAccess: false,
    bulkOperations: false,
    exportAnalytics: false,
  },
  pro: {
    storage: 10 * 1024 * 1024 * 1024, // 10GB
    fileCount: 500, // 500 files
    fileSize: FILE_SIZE_LIMITS.pro, // 250MB per file
    shareLinks: -1, // unlimited share links
    analyticsRetention: 30, // 30 days
    passwordProtection: true,
    emailGating: true,
    downloadControl: true,
    virusScanning: true,
    linkExpiration: true,
    fullAnalytics: true,
    // Paid plan extras
    emailNotifications: true,
    customBranding: false,
    prioritySupport: false,
    apiAccess: false,
    bulkOperations: true,
    exportAnalytics: true,
  },
  business: {
    storage: 50 * 1024 * 1024 * 1024, // 50GB
    fileCount: -1, // unlimited files
    fileSize: FILE_SIZE_LIMITS.business, // 500MB per file
    shareLinks: -1, // unlimited
    analyticsRetention: 30, // 30 days
    passwordProtection: true,
    emailGating: true,
    downloadControl: true,
    virusScanning: true,
    linkExpiration: true,
    fullAnalytics: true,
    // Paid plan extras
    emailNotifications: true,
    customBranding: true,
    prioritySupport: true,
    apiAccess: true,
    bulkOperations: true,
    exportAnalytics: true,
  },
} as const;

// Helper functions
export const getPlanQuotas = (plan: UserPlan) => planQuotas[plan];

export const hasPlanAccess = (userPlan: UserPlan, requiredPlan: UserPlan): boolean => {
  const userPlanLevel = planHierarchy[userPlan];
  const requiredPlanLevel = planHierarchy[requiredPlan];
  return userPlanLevel >= requiredPlanLevel;
};
