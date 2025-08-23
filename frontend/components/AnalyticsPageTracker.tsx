"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/hooks/useAnalyticsConsent';
import { hasAnalyticsConsent } from '@/components/ConsentBanner';

export default function AnalyticsPageTracker(): null {
  const pathname = usePathname();

  useEffect(() => {
    // Only track page views if consent is granted
    if (hasAnalyticsConsent()) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}
