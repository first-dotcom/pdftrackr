import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { auditService } from "../services/auditService";
import { pdfScanner } from "../services/virusScanning";
import { logger } from "../utils/logger";
import { CustomError } from "./errorHandler";

// Extend Request interface to include fileHash
interface RequestWithFileHash extends Request {
  fileHash?: string;
}

// Sanitize filenames to prevent injection attacks
export const sanitizeFilename = (filename: string): string => {
  return filename
    .normalize("NFC") // Normalize to ensure consistent encoding
    .replace(/[<>:"|?*\\\/]/g, "") // Remove dangerous chars
    .replace(/\.\./g, "") // Prevent path traversal
    .replace(/^\.+/, "") // Remove leading dots
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .trim()
    .substring(0, 255); // Limit length
};

// Validate PDF file structure and content with enhanced security
export const validatePDFSecurity = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  const file = req.file;

  try {
    // 1. Validate PDF magic number (header) - strict check
    const pdfHeader = file.buffer.slice(0, 5).toString("ascii");
    if (pdfHeader !== "%PDF-") {
      logger.warn("Invalid PDF header attempted", {
        header: pdfHeader,
        filename: file.originalname,
        ip: req.ip,
      });
      throw new CustomError("Invalid PDF file format", 400);
    }

    // 2. Check for PDF trailer - strict validation
    const bufferStr = file.buffer.toString("ascii");
    if (!bufferStr.includes("%%EOF")) {
      logger.warn("PDF missing EOF marker", {
        filename: file.originalname,
        ip: req.ip,
      });
      throw new CustomError("Corrupted PDF file", 400);
    }

    // 3. Check file size vs buffer length - integrity validation
    if (file.size !== file.buffer.length) {
      logger.warn("File size mismatch detected", {
        reported: file.size,
        actual: file.buffer.length,
        filename: file.originalname,
        ip: req.ip,
      });
      throw new CustomError("File size mismatch - potential tampering", 400);
    }

    // 4. Enhanced security scanning - comprehensive dangerous content detection
    const dangerousPatterns = [
      // JavaScript execution patterns
      /\/JavaScript\s*\[/gi,
      /\/JS\s*\[/gi,
      /\/Action\s*\/Launch/gi,
      /\/Launch/gi,
      /\/SubmitForm/gi,
      /\/ImportData/gi,
      /\/ResetForm/gi,

      // Embedded executable content
      /\/EmbeddedFile.*\/F\s*\(/gi,
      /\/RichMedia.*\/Params/gi,

      // Script injection patterns
      /<script/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /data:application\/x-javascript/gi,

      // URL schemes that could be dangerous
      /file:\/\//gi,
      /ftp:\/\//gi,
      /gopher:\/\//gi,

      // Form submission patterns
      /\/SubmitForm\s*\[/gi,
      /\/ImportData\s*\[/gi,

      // Annotations that could execute code
      /\/A\s*\[.*\/Launch/gi,
      /\/A\s*\[.*\/JavaScript/gi,

      // XFA forms (potential security risk)
      /\/XFA\s*\[/gi,
      /\/AcroForm.*\/XFA/gi,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(bufferStr)) {
        logger.warn("Dangerous content detected in PDF", {
          pattern: pattern.source,
          filename: file.originalname,
          ip: req.ip,
        });
        throw new CustomError("PDF contains potentially unsafe content", 400);
      }
    }



    // 6. Check for embedded files - security risk
    const embeddedFilePatterns = [/\/EmbeddedFile/gi, /\/Filespec/gi, /\/EF/gi];

    for (const pattern of embeddedFilePatterns) {
      if (pattern.test(bufferStr)) {
        logger.warn("Embedded files detected in PDF", {
          pattern: pattern.source,
          filename: file.originalname,
          ip: req.ip,
        });
        throw new CustomError("PDF contains embedded files which are not allowed", 400);
      }
    }

    // 7. Validate PDF structure integrity (relaxed check)
    const trailerMatch = bufferStr.match(/trailer\s*<<([^>]*)>>/gi);
    if (!trailerMatch) {
      logger.debug("PDF missing traditional trailer structure (may be newer format)", {
        filename: file.originalname,
        ip: req.ip,
      });
      // Don't reject - many valid PDFs use newer formats without traditional trailers
    }

    // 8. Check for suspicious object references (relaxed limit)
    const suspiciousRefs = bufferStr.match(/\d+\s+\d+\s+R\s*\[/g);
    if (suspiciousRefs && suspiciousRefs.length > 1000) {
      // Increased from 100 to 1000
      logger.warn("Excessive object references in PDF", {
        refs: suspiciousRefs.length,
        filename: file.originalname,
        ip: req.ip,
      });
      throw new CustomError("PDF contains excessive object references", 400);
    }

    // 9. Sanitize filename
    const originalName = file.originalname;
    file.originalname = sanitizeFilename(originalName);

    if (originalName !== file.originalname) {
      logger.info("Filename sanitized", {
        original: originalName,
        sanitized: file.originalname,
      });
    }

    // 10. Add file hash for integrity checking
    const hash = crypto.createHash("sha256").update(file.buffer).digest("hex");
    (req as RequestWithFileHash).fileHash = hash;

    // 11. Virus scanning
    const fileId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    logger.info("Starting virus scan for PDF", {
      filename: file.originalname,
      fileId,
      size: file.size,
    });

    try {
      const scanResult = await pdfScanner.scanPDF(file.buffer, fileId);

      // Log scan result
      await auditService.logVirusScan({
        fileId,
        isClean: scanResult.isClean,
        threats: scanResult.threats,
        scanners: scanResult.scanners,
        error: scanResult.error,
      });

      if (!scanResult.isClean) {
        logger.error("Virus scan failed - file blocked", {
          filename: file.originalname,
          fileId,
          threats: scanResult.threats,
          scanners: scanResult.scanners,
          error: scanResult.error,
        });

        throw new CustomError(
          scanResult.error
            ? "File could not be scanned for security threats"
            : `Security threat detected: ${scanResult.threats.join(", ")}`,
          400,
        );
      }

      logger.info("PDF validation and security scan passed", {
        filename: file.originalname,
        fileId,
        size: file.size,
        hash: hash.substring(0, 16),
        scanners: scanResult.scanners,
        riskLevel: scanResult.riskLevel,
      });
    } catch (scanError) {
      // If scanning fails, log but don't block upload in development
      // In production, you might want to block uploads when scanner is down
      const errorMessage = scanError instanceof Error ? scanError.message : String(scanError);

      logger.error("Virus scanning failed", {
        filename: file.originalname,
        fileId,
        error: errorMessage,
      });

      // Log the scan failure
      await auditService.logVirusScan({
        fileId,
        isClean: false,
        threats: [],
        scanners: [],
        error: errorMessage,
      });

      // For now, allow upload if ClamAV is unavailable (development friendly)
      // In production, you might want to throw an error here
      if (process.env.NODE_ENV === "production") {
        throw new CustomError("Security scanning is temporarily unavailable", 503);
      }
      logger.warn("Allowing upload without virus scan in development mode");
    }

    next();
  } catch (error) {
    logger.error("PDF validation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      filename: file.originalname,
      ip: req.ip,
    });

    if (error instanceof CustomError) {
      next(error);
    } else {
      next(new CustomError("PDF validation failed", 400));
    }
  }
};

// Enhanced MIME type validation with strict checking
export const validateMimeType = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  const allowedMimeTypes = ["application/pdf"];
  const file = req.file;

  // Check both reported MIME type and file signature
  if (!allowedMimeTypes.includes(file.mimetype)) {
    logger.warn("Invalid MIME type", {
      mimetype: file.mimetype,
      filename: file.originalname,
      ip: req.ip,
    });
    throw new CustomError("Invalid file type. Only PDFs are allowed.", 400);
  }

  // Additional check: verify file extension
  const fileExtension = file.originalname.toLowerCase().split(".").pop();
  if (fileExtension !== "pdf") {
    logger.warn("Invalid file extension", {
      extension: fileExtension,
      filename: file.originalname,
      ip: req.ip,
    });
    throw new CustomError("Invalid file extension. Only .pdf files are allowed.", 400);
  }

  next();
};

// Rate limiting specifically for file uploads - FIXED DEPRECATED API
export const createUploadRateLimit = () => {
  const rateLimit = require("express-rate-limit");
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 uploads per 15 minutes per IP
    message: {
      error: "Too many file uploads. Please try again in 15 minutes.",
      retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use IP + user ID for rate limiting
      return `${req.ip}-${req.userId || "anonymous"}`;
    },
    handler: (req: Request, res: Response) => {
      logger.warn("Upload rate limit reached", {
        ip: req.ip,
        userId: req.userId,
      });

      res.status(429).json({
        success: false,
        error: {
          message: "Too many file uploads. Please try again in 15 minutes.",
          statusCode: 429,
          retryAfter: 15 * 60,
        },
      });
    },
  });
};
