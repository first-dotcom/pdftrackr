import crypto from "node:crypto";
import { config } from "../config";

/**
 * GDPR-compliant utilities for handling personal data
 */

/**
 * Hash an IP address for GDPR compliance
 * This ensures we can't reverse-engineer the original IP
 */
export function hashIPAddress(ipAddress: string): string {
  const salt = config.security.ipHashSalt;
  return crypto
    .createHash("sha256")
    .update(ipAddress + salt)
    .digest("hex");
}

/**
 * Extract country from IP address without storing the IP
 * This provides geographic data without personal information
 */
export function getCountryFromIP(_ipAddress: string): string {
  // This is a simplified version - in production you'd use a proper IP geolocation service
  // For now, we'll return a placeholder
  return "US"; // Placeholder - implement with real IP geolocation service
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
export function anonymizeUserData<T extends Record<string, unknown>>(data: T): T {
  const anonymized = { ...data } as T;

  // Remove or hash personal identifiers
  if (anonymized.email) {
    (anonymized as any).email = hashIPAddress(anonymized.email as string);
  }

  if (anonymized.name) {
    (anonymized as any).name = "Anonymous";
  }

  if (anonymized.ipAddress) {
    (anonymized as any).ipAddress = hashIPAddress(anonymized.ipAddress as string);
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
