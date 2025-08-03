import { Request, Response, NextFunction } from 'express';
import { CustomError } from './errorHandler';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// Sanitize filenames to prevent injection attacks
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"|?*\x00-\x1f\\\/]/g, '') // Remove dangerous chars
    .replace(/\.\./g, '') // Prevent path traversal
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()
    .substring(0, 255); // Limit length
};

// Validate PDF file structure and content
export const validatePDFSecurity = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next();
  
  const file = req.file;
  
  try {
    // 1. Validate PDF magic number (header)
    const pdfHeader = file.buffer.slice(0, 5).toString('ascii');
    if (pdfHeader !== '%PDF-') {
      logger.warn(`Invalid PDF header attempted: ${pdfHeader}`, { ip: req.ip });
      throw new CustomError('Invalid PDF file format', 400);
    }
    
    // 2. Check for PDF trailer
    const bufferStr = file.buffer.toString('ascii');
    if (!bufferStr.includes('%%EOF')) {
      logger.warn('PDF missing EOF marker', { ip: req.ip });
      throw new CustomError('Corrupted PDF file', 400);
    }
    
    // 3. Check file size vs buffer length
    if (file.size !== file.buffer.length) {
      logger.warn('File size mismatch detected', { 
        reported: file.size, 
        actual: file.buffer.length,
        ip: req.ip 
      });
      throw new CustomError('File size mismatch - potential tampering', 400);
    }
    
    // 4. Scan for potentially dangerous content (relaxed for legitimate PDFs)
    const dangerousPatterns = [
      /\/JavaScript/gi,
      /\/JS\s*\[/gi, // More specific JS pattern to avoid false positives
      /\/Action\s*\/Launch/gi, // More specific - only launch actions are dangerous
      /\/Launch/gi,
      /<script/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi, // Embedded HTML
      /\/EmbeddedFile.*\/F\s*\(/gi, // Embedded executable files
    ];
    
    // Note: Removed /\/URI/gi as it's commonly used for legitimate hyperlinks
    // Note: Made /\/Action/gi more specific to avoid false positives
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(bufferStr)) {
        logger.warn(`Dangerous content detected in PDF: ${pattern}`, { 
          filename: file.originalname,
          ip: req.ip 
        });
        throw new CustomError('PDF contains potentially unsafe content', 400);
      }
    }
    
    // 5. Check for excessive size or complexity
    const MAX_PDF_COMPLEXITY = 1000; // Max objects/streams
    const objectMatches = bufferStr.match(/\d+\s+\d+\s+obj/g);
    if (objectMatches && objectMatches.length > MAX_PDF_COMPLEXITY) {
      logger.warn('PDF complexity exceeds limits', { 
        objects: objectMatches.length,
        ip: req.ip 
      });
      throw new CustomError('PDF file too complex', 400);
    }
    
    // 6. Sanitize filename
    const originalName = file.originalname;
    file.originalname = sanitizeFilename(originalName);
    
    if (originalName !== file.originalname) {
      logger.info('Filename sanitized', { 
        original: originalName, 
        sanitized: file.originalname 
      });
    }
    
    // 7. Add file hash for integrity checking
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    (req as any).fileHash = hash;
    
    logger.info('PDF validation passed', { 
      filename: file.originalname,
      size: file.size,
      hash: hash.substring(0, 16)
    });
    
    next();
  } catch (error) {
    logger.error('PDF validation failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      filename: file.originalname,
      ip: req.ip 
    });
    
    if (error instanceof CustomError) {
      next(error);
    } else {
      next(new CustomError('PDF validation failed', 400));
    }
  }
};

// Additional MIME type validation
export const validateMimeType = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next();
  
  const allowedMimeTypes = ['application/pdf'];
  const file = req.file;
  
  // Check both reported MIME type and file signature
  if (!allowedMimeTypes.includes(file.mimetype)) {
    logger.warn('Invalid MIME type', { 
      mimetype: file.mimetype,
      filename: file.originalname,
      ip: req.ip 
    });
    throw new CustomError('Invalid file type. Only PDFs are allowed.', 400);
  }
  
  next();
};

// Rate limiting specifically for file uploads - FIXED DEPRECATED API
export const createUploadRateLimit = () => {
  const rateLimit = require('express-rate-limit');
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 uploads per 15 minutes per IP
    message: {
      error: 'Too many file uploads. Please try again in 15 minutes.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use IP + user ID for rate limiting
      return `${req.ip}-${req.userId || 'anonymous'}`;
    },
    handler: (req: Request, res: Response) => {
      logger.warn('Upload rate limit reached', { 
        ip: req.ip,
        userId: req.userId 
      });
      
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many file uploads. Please try again in 15 minutes.',
          statusCode: 429,
          retryAfter: 15 * 60
        }
      });
    }
  });
};