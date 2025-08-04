import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fs from "fs";
import * as path from "path";
import { config } from "../config";
import { logger } from "../utils/logger";

// Configure S3 client for DigitalOcean Spaces
logger.info("Storage service initialized", {
  endpoint: config.storage.endpoint,
  region: "us-east-1",
  bucket: config.storage.bucket,
  accessKeyId: config.storage.accessKeyId
    ? `***${config.storage.accessKeyId.slice(-4)}`
    : "NOT SET",
  enabled: config.storage.enabled,
});

const s3Client = new S3Client({
  forcePathStyle: false, // Configures to use subdomain/virtual calling format for DigitalOcean Spaces
  endpoint: config.storage.endpoint,
  region: "us-east-1", // DigitalOcean Spaces uses us-east-1 regardless of actual region
  credentials: {
    accessKeyId: config.storage.accessKeyId,
    secretAccessKey: config.storage.secretAccessKey,
  },
});

export interface UploadResult {
  key: string;
  url: string;
  etag?: string;
}

export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string,
  metadata?: Record<string, string>,
): Promise<UploadResult> {
  // Check if we have valid credentials, if not use local storage fallback
  if (config.storage.accessKeyId === "your_spaces_access_key" || 
      config.storage.secretAccessKey === "your_spaces_secret_key") {
    return uploadToLocal(key, buffer, contentType, metadata);
  }

  try {
    logger.debug("Starting file upload", {
      key,
      bucket: config.storage.bucket,
      contentType,
      bufferSize: buffer.length,
      metadata,
    });

    const command = new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
      ACL: "private", // Files are private by default
    });

    logger.debug("Sending upload command to DigitalOcean Spaces");
    const result = await s3Client.send(command);
    logger.info("File uploaded successfully", {
      key,
      etag: result.ETag,
      size: buffer.length,
    });

    // Construct URL (using CDN if available)
    const url = `${config.storage.endpoint}/${config.storage.bucket}/${key}`;

    return {
      key,
      url,
      etag: result.ETag || "",
    };
  } catch (error) {
    logger.error("File upload failed, trying local fallback", {
      key,
      error: error instanceof Error ? error.message : String(error),
      errorCode: (error as { Code?: string })?.Code,
      errorName: (error as { name?: string })?.name,
    });
    
    // Fallback to local storage if DigitalOcean Spaces fails
    return uploadToLocal(key, buffer, contentType, metadata);
  }
}

// Local storage fallback for testing
async function uploadToLocal(
  key: string,
  buffer: Buffer,
  contentType: string,
  metadata?: Record<string, string>,
): Promise<UploadResult> {
  try {
    logger.info("Using local storage fallback", { key, contentType });
    
    // Create local storage directory
    const storageDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(storageDir, key);
    const fileDir = path.dirname(filePath);
    
    // Ensure directory exists
    await fs.promises.mkdir(fileDir, { recursive: true });
    
    // Write file to local storage
    await fs.promises.writeFile(filePath, buffer);
    
    // Generate a simple hash as etag
    const crypto = require("crypto");
    const etag = crypto.createHash("md5").update(buffer).digest("hex");
    
    logger.info("File saved locally", {
      key,
      path: filePath,
      size: buffer.length,
      etag: etag.substring(0, 8),
    });
    
    return {
      key,
      url: `/uploads/${key}`, // Local URL path
      etag,
    };
  } catch (error) {
    logger.error("Local storage upload failed", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`Local upload failed: ${error}`);
  }
}

export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
    });

    await s3Client.send(command);
    logger.info(`File deleted successfully: ${key}`);
  } catch (error) {
    logger.error(`Failed to delete file ${key}:`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Delete failed: ${error}`);
  }
}

export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 3600, // 1 hour default
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    logger.error(`Failed to generate signed URL for ${key}:`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Failed to generate download URL: ${error}`);
  }
}

export async function getSignedViewUrl(
  key: string,
  expiresIn = 3600, // 1 hour default
  downloadEnabled = true,
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
      // Add headers to control browser behavior for downloads
      ResponseContentDisposition: downloadEnabled ? undefined : 'inline; filename="document.pdf"', // Force inline viewing
      ResponseContentType: "application/pdf",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    logger.error(`Failed to generate signed view URL for ${key}:`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Failed to generate view URL: ${error}`);
  }
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300, // 5 minutes default
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
      ContentType: contentType,
      ACL: "private",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    logger.error(`Failed to generate signed upload URL for ${key}:`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Failed to generate upload URL: ${error}`);
  }
}

// Stream file from storage
export async function streamFromS3(key: string): Promise<NodeJS.ReadableStream> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
    });

    logger.debug("Streaming file from S3", { key });
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error("No file content received");
    }

    return response.Body as NodeJS.ReadableStream;
  } catch (error) {
    logger.error(`Failed to stream file ${key}:`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Failed to stream file: ${error}`);
  }
}

// Get file metadata from storage
export async function getFileMetadata(key: string): Promise<{
  contentType: string;
  contentLength: number;
  lastModified?: Date;
}> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    return {
      contentType: response.ContentType || "application/octet-stream",
      contentLength: response.ContentLength || 0,
      lastModified: response.LastModified,
    };
  } catch (error) {
    logger.error(`Failed to get metadata for ${key}:`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Failed to get file metadata: ${error}`);
  }
}

// Check if file exists in storage
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (_error) {
    return false;
  }
}
