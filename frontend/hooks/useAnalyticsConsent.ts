import { useState, useEffect } from 'react';
import { hasAnalyticsConsent, updateAnalyticsConsent } from '@/components/ConsentBanner';

export function useAnalyticsConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check consent status on mount
    const consentStatus = hasAnalyticsConsent();
    setConsent(consentStatus);
    setIsLoading(false);
  }, []);

  const grantConsent = () => {
    updateAnalyticsConsent(true);
    setConsent(true);
  };

  const denyConsent = () => {
    updateAnalyticsConsent(false);
    setConsent(false);
  };

  const resetConsent = () => {
    localStorage.removeItem('analytics-consent');
    setConsent(null);
  };

  return {
    consent,
    isLoading,
    grantConsent,
    denyConsent,
    resetConsent,
    hasConsent: consent === true,
    needsConsent: consent === null
  };
}

// Utility function to track events only if consent is granted
export function trackEvent(
  eventName: string, 
  parameters?: Record<string, any>
): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const hasConsent = hasAnalyticsConsent();
  if (!hasConsent) return;

  window.gtag('event', eventName, parameters);
}

// Utility function to track page views only if consent is granted
export function trackPageView(url?: string): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const hasConsent = hasAnalyticsConsent();
  if (!hasConsent) return;

  if (url) {
    window.gtag('config', 'G-0D0FQG4352', {
      page_path: url
    });
  } else {
    window.gtag('config', 'G-0D0FQG4352');
  }
}
