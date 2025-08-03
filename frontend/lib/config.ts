import { z } from 'zod';

// Frontend environment schema - SIMPLIFIED
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // API Configuration
  NEXT_PUBLIC_API_URL: z.string().default('http://localhost:3001'),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().default('pk_test_placeholder'),
  CLERK_SECRET_KEY: z.string().optional(), // Only needed for server-side
  
  // App Configuration
  NEXT_PUBLIC_APP_ENV: z.string().default('development'),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  
  api: {
    url: env.NEXT_PUBLIC_API_URL,
    baseUrl: env.NEXT_PUBLIC_API_URL,
  },
  
  app: {
    url: env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
    env: env.NEXT_PUBLIC_APP_ENV,
  },
  
  clerk: {
    publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
  },
  
  // Client-side feature flags
  features: {
    analytics: true,
    waitlist: true,
    fileUpload: true,
    shareLinks: true,
  },
} as const;

// Export types for TypeScript
export type Config = typeof config;
export type ApiConfig = typeof config.api;
export type AppConfig = typeof config.app;