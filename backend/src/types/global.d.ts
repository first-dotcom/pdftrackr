// Global type declarations
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      PORT: string;
      DATABASE_URL: string;
      REDIS_URL: string;
      CLERK_SECRET_KEY: string;
      S3_ENDPOINT?: string;
      S3_REGION?: string;
      S3_BUCKET: string;
      S3_ACCESS_KEY: string;
      S3_SECRET_KEY: string;
      FRONTEND_URL: string;
    }
  }
}

// Node.js Error extensions
declare global {
  interface ErrorConstructor {
    captureStackTrace?(thisArg: object, func: (...args: unknown[]) => void): void;
  }
}

export {};
