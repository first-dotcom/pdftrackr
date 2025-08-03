// Global type declarations
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    PORT: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    CLERK_SECRET_KEY: string;
    REDIS_URL: string;
    S3_ENDPOINT: string;
    S3_BUCKET: string;
    S3_ACCESS_KEY: string;
    S3_SECRET_KEY: string;
    FRONTEND_URL: string;
  }
}

// Node.js Error extensions
declare global {
  interface ErrorConstructor {
    captureStackTrace?(thisArg: any, func: any): void;
  }
}

export {};