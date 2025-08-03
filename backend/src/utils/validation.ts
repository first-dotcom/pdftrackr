import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email().max(255);
export const nameSchema = z.string().min(1).max(100).trim();
export const passwordSchema = z.string().min(8).max(128);
export const pageNumberSchema = z.number().int().min(1).max(10000);
export const durationSchema = z.number().int().min(0).max(86400); // max 24 hours
export const scrollDepthSchema = z.number().int().min(0).max(100);

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
  scrollDepth: scrollDepthSchema.optional(),
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

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().min(1).max(1000).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
});

// IP address validation
export const ipAddressSchema = z.string().ip();

// Environment validation schema
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  
  // Database
  DATABASE_URL: z.string().min(1),
  
  // Redis
  REDIS_URL: z.string().min(1),
  
  // Authentication - Only Clerk needed
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
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