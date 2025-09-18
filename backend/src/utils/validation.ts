import type { Request } from "express";
import { z } from "zod";
import type { UserPlan, WaitlistPlan } from "../../../shared/types";

// Common validation schemas
export const emailSchema = z.string().email().max(255);
export const nameSchema = z.string().min(1).max(100).trim();
export const passwordSchema = z.string().min(8).max(128);
export const pageNumberSchema = z.number().int().min(1).max(10000);
export const durationSchema = z.number().int().min(0).max(86400000); // max 24 hours in milliseconds

// File validation
export const fileUploadSchema = z.object({
  title: z.string().max(255).trim().optional(),
  description: z.string().max(1000).trim().optional(),
});

// Share link validation
export const createShareLinkSchema = z.object({
  fileId: z.number().int().positive(),
  title: z.string().max(255).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  password: passwordSchema.optional(),
  emailGatingEnabled: z.boolean().optional(),
  downloadEnabled: z.boolean().optional(),
  watermarkEnabled: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
  maxViews: z.number().int().positive().max(1000000).optional(),
});

export const updateShareLinkSchema = z.object({
  title: z.string().max(255).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  password: passwordSchema.optional(),
  emailGatingEnabled: z.boolean().optional(),
  downloadEnabled: z.boolean().optional(),
  watermarkEnabled: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
  maxViews: z.number().int().positive().max(1000000).optional(),
  isActive: z.boolean().optional(),
});

// Analytics validation
export const trackPageViewSchema = z.object({
  sessionId: z.string().uuid(),
  pageNumber: pageNumberSchema,
  duration: durationSchema.optional(),
});

// Share access validation
export const shareAccessSchema = z.object({
  password: z.string().max(128).optional(),
  email: emailSchema.optional(),
  name: nameSchema.optional(),
});

// User profile validation
export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
});



// IP address validation
export const ipAddressSchema = z.string().ip();

// Environment validation schema
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3001"),

  // Database
  DATABASE_URL: z.string().min(1),

  // Redis
  REDIS_URL: z.string().min(1),

  // Authentication - Only Clerk needed
  CLERK_SECRET_KEY: z.string().min(1),

  // Storage
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),

  // Frontend
  FRONTEND_URL: z.string().min(1),
});

// Utility functions for handling strict TypeScript validation

/**
 * Safely extract and validate a numeric ID from request params
 */
export function getNumericId(req: Request, paramName = "id"): number {
  const id = req.params[paramName];
  if (!id) {
    throw new Error(`${paramName} is required`);
  }
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    throw new Error(`${paramName} must be a valid number`);
  }
  return numericId;
}

/**
 * Safely extract user ID from request
 */
export function getUserId(req: Request): number {
  if (!req.user?.id) {
    throw new Error("User ID is required");
  }
  return req.user.id;
}

/**
 * Safely extract user data with null checks
 */
export function getUserData(req: Request) {
  if (!req.user) {
    throw new Error("User data is required");
  }
  return {
    id: req.user.id,
    storageUsed: req.user.storageUsed ?? 0,
    filesCount: req.user.filesCount ?? 0,
  };
}

/**
 * Safely extract and validate query parameters with defaults
 */
export function getQueryParams(req: Request) {
  const page = parseInt((req.query["page"] as string) || "1", 10);
  const limit = parseInt((req.query["limit"] as string) || "10", 10);
  
  // Validate parsed numbers
  if (isNaN(page) || page < 1 || page > 1000) {
    throw new Error("Page must be a number between 1 and 1000");
  }
  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw new Error("Limit must be a number between 1 and 100");
  }
  
  return { page, limit };
}

/**
 * Zod schema for common ID parameters
 */
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

// Plan Validation Schemas
export const userPlanSchema = z.enum(["free", "starter", "pro", "business"]) satisfies z.ZodType<UserPlan>;
export const waitlistPlanSchema = z.enum(["starter", "pro", "business", "either"]) satisfies z.ZodType<WaitlistPlan>;

// Helper function for plan validation
export const validatePlan = (plan: string): { valid: boolean; error?: string } => {
  try {
    userPlanSchema.parse(plan);
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid plan selection" };
  }
};
