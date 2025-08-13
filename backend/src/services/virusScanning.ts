import fs from "fs";
import net from "net";
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
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

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
    try {
      return new Promise((resolve) => {
        const socket = net.createConnection(this.port, this.host);

        socket.setTimeout(5000); // 5 second timeout for availability check

        socket.on("connect", () => {
          socket.write("PING\n");
        });

        socket.on("data", (data) => {
          const response = data.toString().trim();
          socket.end();
          resolve(response === "PONG");
        });

        socket.on("error", () => {
          resolve(false);
        });

        socket.on("timeout", () => {
          socket.destroy();
          resolve(false);
        });
      });
    } catch {
      return false;
    }
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

  constructor() {
    this.clamAV = new ClamAVScanner();
  }

  async scanPDF(input: string | Buffer, fileId: string) {
    const scanResult = {
      fileId,
      scannedAt: new Date(),
      isClean: false,
      threats: [] as string[],
      scanners: [] as string[],
      riskLevel: "unknown" as "low" | "medium" | "high" | "unknown",
      error: undefined as string | undefined,
    };

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

      // Step 2: ClamAV virus scan (only if we have a file path)
      if (typeof input === 'string') {
        const isAvailable = await this.clamAV.isAvailable();

        if (isAvailable) {
          const clamResult = await this.clamAV.scanFile(input);
          scanResult.scanners.push("ClamAV");

          if (!clamResult.isClean) {
            scanResult.threats.push(`ClamAV: ${clamResult.virusName || "Unknown threat"}`);
            return scanResult;
          }
        } else {
          logger.warn("ClamAV is not available - file uploaded without virus scan");
          scanResult.scanners.push("Structure-only");
          scanResult.error = "ClamAV unavailable";
        }
      } else {
        // Buffer input - skip ClamAV scan
        logger.info("Buffer input detected - skipping ClamAV scan");
        scanResult.scanners.push("Structure-only");
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
    }
  }
}

export const pdfScanner = new PDFScanningService();
export { ClamAVScanner };
