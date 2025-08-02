import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { logger } from '../utils/logger';

// Configure S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: config.storage.endpoint,
  region: config.storage.region,
  credentials: {
    accessKeyId: config.storage.accessKeyId,
    secretAccessKey: config.storage.secretAccessKey,
  },
  forcePathStyle: true, // Required for DigitalOcean Spaces
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
  metadata?: Record<string, string>
): Promise<UploadResult> {
  try {
    const command = new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
      ACL: 'private', // Files are private by default
    });

    const result = await s3Client.send(command);
    
    // Construct URL (using CDN if available)
    const url = config.storage.cdnUrl 
      ? `${config.storage.cdnUrl}/${key}`
      : `${config.storage.endpoint}/${config.storage.bucket}/${key}`;

    logger.info(`File uploaded successfully: ${key}`);

    return {
      key,
      url,
      etag: result.ETag,
    };
  } catch (error) {
    logger.error(`Failed to upload file ${key}:`, error);
    throw new Error(`Upload failed: ${error}`);
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
    logger.error(`Failed to delete file ${key}:`, error);
    throw new Error(`Delete failed: ${error}`);
  }
}

export async function getSignedDownloadUrl(
  key: string, 
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    logger.error(`Failed to generate signed URL for ${key}:`, error);
    throw new Error(`Failed to generate download URL: ${error}`);
  }
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 300 // 5 minutes default
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'private',
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    logger.error(`Failed to generate signed upload URL for ${key}:`, error);
    throw new Error(`Failed to generate upload URL: ${error}`);
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
  } catch (error) {
    return false;
  }
}