import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { logger } from '../utils/logger';

// Configure S3 client for DigitalOcean Spaces
console.log('🔧 DigitalOcean Spaces Configuration:');
console.log('  Endpoint:', config.storage.endpoint);
console.log('  Region: us-east-1 (hardcoded for DO Spaces)');
console.log('  Bucket:', config.storage.bucket);
console.log('  Access Key ID:', config.storage.accessKeyId);
console.log('  Secret Key (masked):', config.storage.secretAccessKey ? '***' + config.storage.secretAccessKey.slice(-4) : 'NOT SET');
console.log('  Storage Enabled:', config.storage.enabled);

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
  metadata?: Record<string, string>
): Promise<UploadResult> {
  try {
    console.log('🚀 Starting upload to DigitalOcean Spaces:');
    console.log('  Key:', key);
    console.log('  Bucket:', config.storage.bucket);
    console.log('  Content Type:', contentType);
    console.log('  Buffer Size:', buffer.length, 'bytes');
    console.log('  Metadata:', metadata);

    const command = new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
      ACL: 'private', // Files are private by default
    });

    console.log('📡 Sending command to DigitalOcean Spaces...');
    const result = await s3Client.send(command);
    console.log('✅ Upload successful! ETag:', result.ETag);
    
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
    console.log('❌ Upload failed with error:');
    console.log('  Error type:', error?.constructor?.name);
    console.log('  Error message:', error?.message);
    console.log('  Error code:', (error as any)?.Code);
    console.log('  Error name:', (error as any)?.name);
    console.log('  Full error:', error);
    
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

export async function getSignedViewUrl(
  key: string, 
  expiresIn: number = 3600, // 1 hour default
  downloadEnabled: boolean = true
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
      // Add headers to control browser behavior for downloads
      ResponseContentDisposition: downloadEnabled 
        ? undefined 
        : 'inline; filename="document.pdf"', // Force inline viewing
      ResponseContentType: 'application/pdf',
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    logger.error(`Failed to generate signed view URL for ${key}:`, error);
    throw new Error(`Failed to generate view URL: ${error}`);
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