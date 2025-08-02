import dotenv from 'dotenv';
import { envSchema } from './utils/validation';
import { logger } from './utils/logger';

dotenv.config();

// Validate environment variables - FAIL FAST if missing critical vars
const envValidation = envSchema.safeParse(process.env);
if (!envValidation.success) {
  logger.error('❌ Invalid environment variables:', envValidation.error.errors);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1); // Fail in production
  } else {
    logger.warn('⚠️  Using fallback values for development');
  }
}

const requireEnvVar = (name: string, fallback?: string): string => {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`🚨 CRITICAL: Missing required environment variable: ${name}`);
    }
    if (fallback) {
      logger.warn(`⚠️  Using fallback for ${name}: ${fallback}`);
      return fallback;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  server: {
    port: parseInt(requireEnvVar('PORT', '3001'), 10),
  },
  database: {
    host: requireEnvVar('DB_HOST', 'localhost'),
    port: parseInt(requireEnvVar('DB_PORT', '5432'), 10),
    name: requireEnvVar('DB_NAME', 'pdftrackr'),
    user: requireEnvVar('DB_USER', 'postgres'),
    password: requireEnvVar('DB_PASSWORD', 'password'),
    ssl: process.env.DB_SSL === 'true',
  },
  redis: {
    host: requireEnvVar('REDIS_HOST', 'localhost'),
    port: parseInt(requireEnvVar('REDIS_PORT', '6379'), 10),
    password: process.env.REDIS_PASSWORD,
  },
  jwt: {
    secret: requireEnvVar('JWT_SECRET', process.env.NODE_ENV === 'development' ? 'dev-jwt-secret-please-change-in-production' : undefined),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  clerk: {
    secretKey: requireEnvVar('CLERK_SECRET_KEY'),
    publishableKey: requireEnvVar('CLERK_PUBLISHABLE_KEY'),
  },
  storage: {
    endpoint: requireEnvVar('DO_SPACES_ENDPOINT'),
    region: requireEnvVar('DO_SPACES_REGION', 'nyc3'),
    bucket: requireEnvVar('DO_SPACES_BUCKET', 'pdftrackr-files'),
    accessKeyId: requireEnvVar('DO_SPACES_KEY'),
    secretAccessKey: requireEnvVar('DO_SPACES_SECRET'),
    cdnUrl: process.env.DO_SPACES_CDN_URL || '',
  },
  frontend: {
    url: requireEnvVar('FRONTEND_URL', 'http://localhost:3000'),
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