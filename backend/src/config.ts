import dotenv from "dotenv";
import { z } from "zod";
import { planQuotas } from "@/shared/types";

dotenv.config();

// Define environment schema - SIMPLIFIED
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3001"),

  // Database - use URL format (simpler)
  DATABASE_URL: z.string().default("postgresql://postgres:password@postgres:5432/pdftrackr"),
  DATABASE_POOL_MAX: z.string().default("20"),

  // Redis - use URL format (simpler)
  REDIS_URL: z.string().default("redis://redis:6379"),

  // Authentication - Only Clerk needed
  CLERK_SECRET_KEY: z.string(),

  // Storage (using S3 format - works with DigitalOcean Spaces)
  S3_ENDPOINT: z.string().default("https://nyc3.digitaloceanspaces.com"),
  S3_REGION: z.string().default("nyc3"),
  S3_BUCKET: z.string().default("pdftrackr"),
  S3_ACCESS_KEY: z.string().default(""),
  S3_SECRET_KEY: z.string().default(""),
  // Optional: Spaces storage limit in GB (used for admin progress bar)
  DO_SPACES_STORAGE_LIMIT: z.string().default("250"),

  // App URL - single source of truth
  APP_URL: z.string().default("http://localhost:3000"),
  
  // Security
  IP_HASH_SALT: z.string().default("pdftrackr-salt-5"),
  
  // Admin
  ADMIN_EMAILS: z.string().default(""),
  
  // Feature Flags
  ENABLE_CLEANUP_JOBS: z.string().default("true"),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  server: {
    port: parseInt(env.PORT, 10),
  },
  database: {
    url: env.DATABASE_URL,
    poolMax: parseInt(env.DATABASE_POOL_MAX, 10),
  },
  redis: {
    url: env.REDIS_URL,
  },
  clerk: {
    secretKey: env.CLERK_SECRET_KEY,
  },
  storage: {
    endpoint: env.S3_ENDPOINT || "https://nyc3.digitaloceanspaces.com",
    region: env.S3_REGION || "nyc3",
    bucket: env.S3_BUCKET || "pdftrackr",
    accessKeyId: env.S3_ACCESS_KEY || "",
    secretAccessKey: env.S3_SECRET_KEY || "",
    enabled: !!(env.S3_ACCESS_KEY && env.S3_SECRET_KEY), // Only enable if credentials are provided
    // Convert GB -> bytes if provided
    limitBytes:
      env.DO_SPACES_STORAGE_LIMIT && !Number.isNaN(Number(env.DO_SPACES_STORAGE_LIMIT))
        ? Number(env.DO_SPACES_STORAGE_LIMIT) * 1024 * 1024 * 1024
        : undefined,
  },
  app: {
    url: env.APP_URL,
  },
  security: {
    ipHashSalt: env.IP_HASH_SALT,
  },
  admin: {
    emails: env.ADMIN_EMAILS ? env.ADMIN_EMAILS.split(',').map(email => email.trim()) : [],
  },
  featureFlags: {
    enableCleanupJobs: env.ENABLE_CLEANUP_JOBS === "true",
  },
  quotas: planQuotas,
};
