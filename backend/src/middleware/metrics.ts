import { Request, Response, NextFunction } from 'express';
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Create metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

export const fileUploads = new Counter({
  name: 'file_uploads_total',
  help: 'Total number of file uploads',
  labelNames: ['status', 'user_plan'],
});

export const storageQuotaRejections = new Counter({
  name: 'storage_quota_rejections_total',
  help: 'Total number of uploads rejected due to storage quota',
  labelNames: ['user_plan'],
});

export const pdfViews = new Counter({
  name: 'pdf_views_total',
  help: 'Total number of PDF views',
  labelNames: ['file_id', 'is_unique'],
});

export const redisOperations = new Counter({
  name: 'redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status'],
});

export const queueJobsProcessed = new Counter({
  name: 'queue_jobs_processed_total',
  help: 'Total number of queue jobs processed',
  labelNames: ['queue', 'status'],
});

// Custom metrics for business logic
export const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['plan'],
});

export const planUpgrades = new Counter({
  name: 'plan_upgrades_total',
  help: 'Total number of plan upgrades',
  labelNames: ['from_plan', 'to_plan'],
});

// Middleware to track HTTP metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Track active connections
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    // Record metrics
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
    
    httpRequestDuration
      .labels(req.method, route)
      .observe(duration);
    
    activeConnections.dec();
  });
  
  next();
};

// Database query timing helper
export const trackDatabaseQuery = async <T>(
  operation: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  
  try {
    const result = await queryFn();
    const duration = (Date.now() - start) / 1000;
    
    databaseQueryDuration
      .labels(operation, table)
      .observe(duration);
    
    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    
    databaseQueryDuration
      .labels(operation, table)
      .observe(duration);
    
    throw error;
  }
};

// Redis operation tracking helper
export const trackRedisOperation = async <T>(
  operation: string,
  operationFn: () => Promise<T>
): Promise<T> => {
  try {
    const result = await operationFn();
    redisOperations.labels(operation, 'success').inc();
    return result;
  } catch (error) {
    redisOperations.labels(operation, 'error').inc();
    throw error;
  }
};

// Export the default registry for the /metrics endpoint
export { register };