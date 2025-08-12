// Plan Types
export type UserPlan = "free" | "pro" | "business";
export type WaitlistPlan = "pro" | "business" | "either";

// Plan Hierarchy for permission checking
export const planHierarchy = { free: 0, pro: 1, business: 2 } as const;

// Quota Configuration - Single source of truth for both frontend and backend
export const planQuotas = {
  free: {
    // Competitive with Papermark Free
    storage: 500 * 1024 * 1024, // 500MB (more generous)
    fileCount: 25, // 25 files vs Papermark's 50 documents
    fileSize: 10 * 1024 * 1024, // 10MB per file
    shareLinks: 25, // 25 share links vs Papermark's 50
    analyticsRetention: 30, // 30 days
    teamMembers: 1,
    customBranding: false,
    passwordProtection: true,
    emailRequired: true,
  },
  pro: {
    // Competitive pricing: $19/month (vs Papermark €24)
    storage: 5 * 1024 * 1024 * 1024, // 5GB
    fileCount: 200, // 200 files vs Papermark's 100
    fileSize: 50 * 1024 * 1024, // 50MB per file (large uploads)
    shareLinks: -1, // unlimited share links
    analyticsRetention: 365, // 1 year
    teamMembers: 1,
    customBranding: true,
    passwordProtection: true,
    emailRequired: true,
    folderOrganization: true,
    removeBranding: true,
  },
  business: {
    // Competitive pricing: $49/month (vs Papermark €59)
    storage: 25 * 1024 * 1024 * 1024, // 25GB
    fileCount: -1, // unlimited files
    fileSize: 100 * 1024 * 1024, // 100MB per file
    shareLinks: -1, // unlimited
    analyticsRetention: 730, // 2 years
    teamMembers: 5, // 5 team members vs Papermark's 3
    customBranding: true,
    passwordProtection: true,
    emailRequired: true,
    emailVerification: true,
    folderOrganization: true,
    removeBranding: true,
    allowBlockList: true,
    screenshotProtection: true,
    customDomain: true,
    webhooks: true,
    prioritySupport: true,
  },
} as const;

// Helper functions
export const getPlanQuotas = (plan: UserPlan) => planQuotas[plan];

export const hasPlanAccess = (userPlan: UserPlan, requiredPlan: UserPlan): boolean => {
  const userPlanLevel = planHierarchy[userPlan];
  const requiredPlanLevel = planHierarchy[requiredPlan];
  return userPlanLevel >= requiredPlanLevel;
};
