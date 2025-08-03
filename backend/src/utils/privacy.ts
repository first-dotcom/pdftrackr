import crypto from 'crypto';

/**
 * GDPR-compliant utilities for handling personal data
 */

/**
 * Hash an IP address for GDPR compliance
 * This ensures we can't reverse-engineer the original IP
 */
export function hashIPAddress(ipAddress: string): string {
  // Add a salt to make the hash more secure
  const salt = process.env.IP_HASH_SALT || 'pdftrackr-salt-2024';
  const hash = crypto.createHash('sha256');
  hash.update(ipAddress + salt);
  return hash.digest('hex');
}

/**
 * Extract country from IP address without storing the IP
 * This provides geographic data without personal information
 */
export function getCountryFromIP(ipAddress: string): string {
  // This is a simplified version - in production you'd use a proper IP geolocation service
  // For now, we'll return a placeholder
  return 'US'; // Placeholder - implement with real IP geolocation service
}

/**
 * Calculate data retention date based on user settings
 */
export function calculateRetentionDate(retentionDays: number): Date {
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() + retentionDays);
  return retentionDate;
}

/**
 * Check if data should be deleted based on retention policy
 */
export function shouldDeleteData(retentionDate: Date): boolean {
  return new Date() > retentionDate;
}

/**
 * Anonymize user data for GDPR compliance
 */
export function anonymizeUserData(data: any): any {
  const anonymized = { ...data };
  
  // Remove or hash personal identifiers
  if (anonymized.email) {
    anonymized.email = hashIPAddress(anonymized.email);
  }
  
  if (anonymized.name) {
    anonymized.name = 'Anonymous';
  }
  
  if (anonymized.ipAddress) {
    anonymized.ipAddress = hashIPAddress(anonymized.ipAddress);
  }
  
  return anonymized;
}

/**
 * Generate a unique session ID that doesn't contain personal information
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Check if user has given consent for tracking
 */
export function hasConsent(consentGiven: boolean, trackingEnabled: boolean): boolean {
  return consentGiven && trackingEnabled;
} 