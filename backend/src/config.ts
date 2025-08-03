import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Define environment schema - SIMPLIFIED
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  
  // Database - use URL format (simpler)
  DATABASE_URL: z.string().default('postgresql://postgres:password@postgres:5432/pdftrackr'),
  
  // Redis - use URL format (simpler)  
  REDIS_URL: z.string().default('redis://redis:6379'),
  
  // Authentication - Only Clerk needed
  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),
  
  // Storage (using S3 format - works with DigitalOcean Spaces)
  S3_ENDPOINT: z.string().default('https://nyc3.digitaloceanspaces.com'),
  S3_REGION: z.string().default('nyc3'),
  S3_BUCKET: z.string().default('pdftrackr'),
  S3_ACCESS_KEY: z.string().default(''),
  S3_SECRET_KEY: z.string().default(''),
  
  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:3000'),
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
  },
  redis: {
    url: env.REDIS_URL,
  },
  clerk: {
    secretKey: env.CLERK_SECRET_KEY,
  },
  storage: {
    endpoint: env.S3_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
    region: env.S3_REGION || 'nyc3',
    bucket: env.S3_BUCKET || 'pdftrackr',
    accessKeyId: env.S3_ACCESS_KEY || '',
    secretAccessKey: env.S3_SECRET_KEY || '',
    enabled: !!(env.S3_ACCESS_KEY && env.S3_SECRET_KEY), // Only enable if credentials are provided
  },
  frontend: {
    url: env.FRONTEND_URL,
  },
  quotas: {
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
  },
};