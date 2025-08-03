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
  
  // Authentication
  JWT_SECRET: z.string().default('dev-jwt-secret-change-in-production'),
  CLERK_SECRET_KEY: z.string().default('sk_test_placeholder'),
  
  // Storage (using S3 format - works with DigitalOcean Spaces)
  S3_ENDPOINT: z.string().default('https://nyc3.digitaloceanspaces.com'),
  S3_BUCKET: z.string().default('pdftrackr-files'),
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
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: '7d',
  },
  clerk: {
    secretKey: env.CLERK_SECRET_KEY,
  },
  storage: {
    endpoint: env.S3_ENDPOINT,
    bucket: env.S3_BUCKET,
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  frontend: {
    url: env.FRONTEND_URL,
  },
  quotas: {
    free: {
      storage: 100 * 1024 * 1024, // 100MB
      fileCount: 10,
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    pro: {
      storage: 2 * 1024 * 1024 * 1024, // 2GB
      fileCount: 100,
      fileSize: 25 * 1024 * 1024, // 25MB
    },
    team: {
      storage: 10 * 1024 * 1024 * 1024, // 10GB
      fileCount: -1, // unlimited
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  },
};