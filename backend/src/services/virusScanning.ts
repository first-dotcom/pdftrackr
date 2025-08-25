import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import os from "node:os";
import { logger } from "../utils/logger";

export interface ScanResult {
  isClean: boolean;
  virusName?: string;
  scanResult: string;
  error?: string;
}

class ClamAVScanner {
  private host: string;
  private port: number;

  constructor(host = "clamav", port = 3310) {
    this.host = host;
    this.port = port;
  }

  async scanFile(filePath: string): Promise<ScanResult> {
    try {
      logger.info(`Starting virus scan for file: ${filePath}`);

      return new Promise((resolve, reject) => {
        const socket = net.createConnection(this.port, this.host);

        socket.setTimeout(30000); // 30 second timeout

        socket.on("connect", () => {
          logger.info(`Connected to ClamAV at ${this.host}:${this.port}`);
          socket.write(`SCAN ${filePath}\n`);
        });

        let result = "";
        socket.on("data", (data) => {
          result += data.toString();
        });

        socket.on("end", () => {
          const trimmedResult = result.trim();
          const isClean = trimmedResult.includes("OK") && !trimmedResult.includes("FOUND");
          const virusMatch = trimmedResult.match(/(.+): (.+) FOUND/);

          const scanResult: ScanResult = {
            isClean,
            virusName: virusMatch ? virusMatch[2] : undefined,
            scanResult: trimmedResult,
          };

          logger.info(`Scan completed for ${filePath}: ${isClean ? "CLEAN" : "INFECTED"}`);
          if (!isClean && virusMatch) {
            logger.warn(`Virus detected: ${virusMatch[2]} in file ${filePath}`);
          }

          resolve(scanResult);
        });

        socket.on("error", (error) => {
          logger.error(`ClamAV connection error: ${error.message}`);
          reject(new Error(`ClamAV scan failed: ${error.message}`));
        });

        socket.on("timeout", () => {
          logger.error(`ClamAV scan timeout for file: ${filePath}`);
          socket.destroy();
          reject(new Error("ClamAV scan timeout"));
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Virus scan error: ${errorMessage}`);
      return {
        isClean: false, // Fail-safe: treat as infected if we can't scan
        scanResult: "Scan failed",
        error: errorMessage,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    // Try multiple times with increasing delays
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await new Promise<boolean>((resolve) => {
          const socket = net.createConnection(this.port, this.host);
          
          // Increase timeout for each attempt
          const timeout = attempt * 10000; // 10s, 20s, 30s
          socket.setTimeout(timeout);

          socket.on("connect", () => {
            logger.debug(`ClamAV connection attempt ${attempt} successful`);
            socket.write("PING\n");
          });

          socket.on("data", (data) => {
            const response = data.toString().trim();
            socket.end();
            const isAvailable = response === "PONG";
            logger.debug(`ClamAV response: ${response}, available: ${isAvailable}`);
            resolve(isAvailable);
          });

          socket.on("error", (error) => {
            logger.debug(`ClamAV connection attempt ${attempt} failed: ${error.message}`);
            resolve(false);
          });

          socket.on("timeout", () => {
            logger.debug(`ClamAV connection attempt ${attempt} timed out`);
            socket.destroy();
            resolve(false);
          });
        });

        if (result) {
          logger.info("ClamAV is available and responding");
          return true;
        }

        // Wait before retry (except on last attempt)
        if (attempt < 3) {
          const delay = 5000 * attempt; // 5s, 10s delays
          logger.debug(`ClamAV unavailable, retrying in ${delay}ms (attempt ${attempt}/3)`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        logger.debug(`ClamAV availability check attempt ${attempt} error: ${error}`);
        // Continue to next attempt
      }
    }
    
    logger.warn("ClamAV is not available after 3 attempts");
    return false;
  }
}

// PDF Structure validation
export const validatePDFStructure = (input: string | Buffer) => {
  try {
    let buffer: Buffer;
    
    if (typeof input === 'string') {
      // Input is a file path
      buffer = fs.readFileSync(input);
    } else {
      // Input is already a buffer
      buffer = input;
    }

    // Check PDF header
    if (!buffer.slice(0, 4).equals(Buffer.from("%PDF"))) {
      throw new Error("Invalid PDF header");
    }

    // Check for suspicious patterns in PDF
    const content = buffer.toString("ascii", 0, Math.min(buffer.length, 10000)); // Check first 10KB
    const suspiciousPatterns = [
      "/JavaScript",
      "/JS",
      "/URI",
      "this.print",
      "app.launchURL",
      "/EmbeddedFile",
    ];

    const foundSuspicious = suspiciousPatterns.filter((pattern) => content.includes(pattern));

    return {
      isValid: true,
      suspiciousFeatures: foundSuspicious,
      riskLevel:
        foundSuspicious.length > 2 ? "high" : foundSuspicious.length > 0 ? "medium" : "low",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`PDF structure validation error: ${errorMessage}`);
    return {
      isValid: false,
      suspiciousFeatures: [] as string[],
      riskLevel: "unknown",
      error: errorMessage,
    };
  }
};

// Main scanning service
class PDFScanningService {
  private clamAV: ClamAVScanner;
  private tempDir: string;
  private initialized: boolean = false;

  constructor() {
    this.clamAV = new ClamAVScanner();
    
    // Use a single, consistent path that both containers can access
    this.tempDir = '/tmp/temp_uploads';
    
    // Ensure temp directory exists with proper error handling
    this.ensureTempDirectory();
  }

  private ensureTempDirectory() {
    try {
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true, mode: 0o700 }); // Secure permissions
        logger.info(`Created secure temporary directory: ${this.tempDir}`);
      }
      
      // Verify we can write to the directory
      const testFile = path.join(this.tempDir, '.test_write');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      logger.info(`Temporary directory is writable: ${this.tempDir}`);
    } catch (error) {
      logger.error(`Failed to setup temp directory ${this.tempDir}: ${error}`);
      
      // Final fallback: use a subdirectory of the current working directory
      this.tempDir = path.join(process.cwd(), 'temp_uploads');
      try {
        if (!fs.existsSync(this.tempDir)) {
          fs.mkdirSync(this.tempDir, { recursive: true, mode: 0o700 });
        }
        logger.info(`Using fallback temp directory: ${this.tempDir}`);
      } catch (fallbackError) {
        logger.error(`All temp directory fallbacks failed: ${fallbackError}`);
        // Don't throw here - let the service continue and handle errors gracefully
      }
    }
  }

  private async initialize() {
    if (!this.initialized) {
      // Clean up old temporary files on startup
      await this.cleanupOldTempFiles();
      this.initialized = true;
    }
  }

  private async cleanupOldTempFiles() {
    try {
      const files = await fs.promises.readdir(this.tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.promises.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.promises.unlink(filePath);
          logger.debug(`Cleaned up old temporary file: ${file}`);
        }
      }
    } catch (error) {
      logger.warn(`Failed to cleanup old temporary files: ${error}`);
    }
  }

  async scanPDF(input: string | Buffer, fileId: string) {
    // Initialize on first scan
    await this.initialize();

    const scanResult = {
      fileId,
      scannedAt: new Date(),
      isClean: false,
      threats: [] as string[],
      scanners: [] as string[],
      riskLevel: "unknown" as "low" | "medium" | "high" | "unknown",
      error: undefined as string | undefined,
    };

    let tempFilePath: string | null = null;

    try {
      logger.info(`Starting comprehensive scan for file: ${fileId}`);

      // Step 1: Basic PDF structure validation
      const structureCheck = validatePDFStructure(input);
      scanResult.riskLevel = structureCheck.riskLevel as 'low' | 'medium' | 'high' | 'unknown';

      if (!structureCheck.isValid) {
        scanResult.threats.push("Invalid PDF structure");
        scanResult.error = structureCheck.error;
        return scanResult;
      }

      if (structureCheck.suspiciousFeatures.length > 0) {
        logger.warn(
          `Suspicious PDF features detected: ${structureCheck.suspiciousFeatures.join(", ")}`,
        );
      }

      // Step 2: Prepare file for ClamAV scanning
      if (typeof input === 'string') {
        tempFilePath = input; // Use existing file path
      } else {
        // Create temporary file for buffer input with secure permissions
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        tempFilePath = path.join(this.tempDir, `${fileId}_${timestamp}_${randomSuffix}.pdf`);
        
        try {
          await fs.promises.writeFile(tempFilePath, input);
          
          // Set file permissions that allow ClamAV to read the file
          await fs.promises.chmod(tempFilePath, 0o644);
          
          logger.debug(`Created temporary file for ClamAV scan: ${tempFilePath}`);
          
          // No path conversion needed - using consistent path
        } catch (writeError) {
          logger.error(`Failed to create temporary file: ${writeError}`);
          throw new Error('Unable to prepare file for security scanning');
        }
      }

      // Step 3: ClamAV virus scan (now works with both file paths and buffers)
      const isAvailable = await this.clamAV.isAvailable();

      if (isAvailable) {
        const clamResult = await this.clamAV.scanFile(tempFilePath);
        scanResult.scanners.push("ClamAV");

        if (!clamResult.isClean) {
          scanResult.threats.push(`ClamAV: ${clamResult.virusName || "Unknown threat"}`);
          return scanResult;
        }
      } else {
        logger.warn("ClamAV is not available - using enhanced structure validation only");
        scanResult.scanners.push("Structure-only");
        
        // Enhanced structure validation when ClamAV is down
        if (structureCheck.riskLevel === "high") {
          scanResult.threats.push("High-risk PDF structure detected");
          scanResult.error = "Enhanced security validation failed";
          scanResult.isClean = false;
          return scanResult;
        }
        
        // Allow uploads with medium/low risk when ClamAV is down
        logger.info("Allowing upload with structure-only validation due to ClamAV unavailability");
      }

      // All checks passed
      scanResult.isClean = true;
      logger.info(`File ${fileId} passed all security checks`);
      return scanResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Scan error for file ${fileId}: ${errorMessage}`);
      scanResult.error = errorMessage;
      scanResult.isClean = false; // Fail-safe
      return scanResult;
    } finally {
      // Clean up temporary file if we created one
      if (tempFilePath && typeof input === 'object' && Buffer.isBuffer(input)) {
        try {
          await fs.promises.unlink(tempFilePath);
          logger.debug(`Cleaned up temporary file: ${tempFilePath}`);
        } catch (cleanupError) {
          logger.warn(`Failed to clean up temporary file ${tempFilePath}: ${cleanupError}`);
        }
      }
    }
  }
}

export const pdfScanner = new PDFScanningService();
export { ClamAVScanner };
