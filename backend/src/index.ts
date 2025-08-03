import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { metricsMiddleware } from './middleware/metrics';
import { securityHeaders, addRequestId, csrfProtection } from './middleware/security';
import { connectDatabase } from './utils/database';
import { connectRedis } from './utils/redis';

// Import routes
import authRoutes from './routes/auth';
import filesRoutes from './routes/files';
import analyticsRoutes from './routes/analytics';
import usersRoutes from './routes/users';
import shareRoutes from './routes/share';
import metricsRoutes from './routes/metrics';
import waitlistRoutes from './routes/waitlist';
import upgradeRoutes from './routes/upgrade';

const app = express();

// Request ID for tracing
app.use(addRequestId);

// Security headers
app.use(securityHeaders);

// Enhanced security middleware with stricter policies
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // For CSS-in-JS libraries
      scriptSrc: ["'self'", "'strict-dynamic'"], // Allow dynamically loaded scripts
      imgSrc: ["'self'", "data:", "https:", config.storage.endpoint],
      connectSrc: ["'self'", config.storage.endpoint, "https://api.clerk.dev", "https://clerk.dev"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", config.storage.endpoint],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: config.env === 'production' ? [] : null,
    },
    reportOnly: config.env === 'development', // Report violations in dev
  },
  crossOriginEmbedderPolicy: false, // Required for PDF viewers
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  // expectCt removed - deprecated in newer helmet versions
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));

// Rate limiting (more reasonable)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.env === 'production' ? 200 : 500, // More reasonable limits
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req: any) => req.ip, // Use IP for rate limiting
});
app.use(limiter);

// CORS configuration (more permissive for development)
app.use(cors({
  origin: function (origin, callback) {
    // Allow same origin and configured frontend URL
    const allowedOrigins = [config.frontend.url];
    if (config.env === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001');
    }
    
    // In development, be more permissive
    if (config.env === 'development' && !origin) {
      return callback(null, true);
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
}));

// Cookie parser for CSRF tokens
app.use(cookieParser());

// Compression and parsing (with security limits)
app.use(compression({
  filter: (req, res) => {
    // Don't compress responses with sensitive headers
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses > 1KB
}));

app.use(express.json({ 
  limit: '10mb', // Reduced from 50mb for security
  verify: (req, res, buf) => {
    // Store raw body for webhook verification
    (req as any).rawBody = buf;
  },
  // Prevent JSON pollution attacks
  reviver: (key, value) => {
    if (typeof value === 'string' && value.length > 10000) {
      throw new Error('JSON string too long');
    }
    return value;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '5mb', // Even more restrictive for form data
  parameterLimit: 50, // Limit URL parameters
}));

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Metrics middleware
app.use(metricsMiddleware);

// CSRF Protection (applied selectively)
app.use('/api', (req, res, next) => {
  // Skip CSRF for webhooks, public endpoints, and share access
  if (req.path.includes('/webhook') || 
      req.path.includes('/public') ||
      req.path.includes('/health') ||
      req.path.includes('/metrics') ||
      req.path.includes('/share/')) {  // Allow public share access
    return next();
  }
  return csrfProtection(req, res, next);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/upgrade', upgradeRoutes);

// Metrics endpoint (no /api prefix for Prometheus)
app.use('/metrics', metricsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    const port = config.server.port;
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();