import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { CustomError } from './errorHandler';
import { logger } from '../utils/logger';

// Verify Clerk webhook signature
export const verifyClerkWebhook = (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['svix-signature'] as string;
    const timestamp = req.headers['svix-timestamp'] as string;
    const payload = JSON.stringify(req.body);

    if (!signature || !timestamp) {
      throw new CustomError('Missing webhook signature', 401);
    }

    // In a real implementation, you would verify the signature
    // using the Clerk webhook secret and svix library
    // For now, we'll log and continue
    logger.info('Webhook signature verification needed');
    
    next();
  } catch (error) {
    logger.error('Webhook verification failed:', error);
    next(new CustomError('Webhook verification failed', 401));
  }
};

// Add security headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

// Enhanced CSRF protection
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for safe methods
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  try {
    // Check for CSRF token in headers or cookies
    const headerToken = req.headers['x-csrf-token'] || req.headers['csrf-token'];
    const cookieToken = req.cookies?.csrfToken;
    const sessionToken = req.headers.authorization;

    // Require either CSRF token or valid authentication
    if (!headerToken && !cookieToken && !sessionToken) {
      logger.warn('CSRF protection triggered - no token provided', { 
        ip: req.ip,
        path: req.path,
        method: req.method 
      });
      throw new CustomError('CSRF token required', 403);
    }

    // If CSRF token provided, validate it
    if (headerToken || cookieToken) {
      const providedToken = headerToken || cookieToken;
      
      // Simple validation - in production you'd want signed tokens
      if (!providedToken || providedToken.length < 10) {
        logger.warn('Invalid CSRF token format', { 
          ip: req.ip,
          tokenLength: providedToken?.length || 0 
        });
        throw new CustomError('Invalid CSRF token', 403);
      }
    }

    next();
  } catch (error) {
    if (error instanceof CustomError) {
      next(error);
    } else {
      logger.error('CSRF protection error', { error, ip: req.ip });
      next(new CustomError('CSRF validation failed', 403));
    }
  }
};

// Validate file upload security
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  const file = req.file;
  
  // Check file type
  if (file.mimetype !== 'application/pdf') {
    throw new CustomError('Only PDF files are allowed', 400);
  }

  // Check file size (this is also handled by multer, but double-check)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new CustomError('File too large', 400);
  }

  // Check for malicious content in filename
  const dangerousPatterns = [
    /\.\./,  // path traversal
    /[<>:"|?*]/,  // invalid filename chars
    /\0/,  // null bytes
  ];

  if (dangerousPatterns.some(pattern => pattern.test(file.originalname))) {
    throw new CustomError('Invalid filename', 400);
  }

  next();
};

// Normalize and validate IP address
export const normalizeIp = (req: Request, res: Response, next: NextFunction) => {
  let ip = req.ip;
  
  // Handle IPv4-mapped IPv6 addresses
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  // Store normalized IP
  req.ip = ip;
  next();
};

// Request ID for tracing
export const addRequestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// Rate limiting utility - CREATE THE MISSING FUNCTION
export const createRateLimit = (windowMs: number, max: number, message: string = 'Too many requests') => {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Remove deprecated onLimitReached
    keyGenerator: (req: Request) => {
      const forwarded = req.headers['x-forwarded-for'] as string;
      const ip = forwarded ? forwarded.split(',')[0] : req.ip;
      return ip || 'unknown';
    },
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      
      res.status(429).json({
        success: false,
        error: {
          message,
          statusCode: 429,
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
    }
  });
};