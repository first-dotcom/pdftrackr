"use client";

import { hasAnalyticsConsent } from "@/components/ConsentBanner";
import { trackPageView } from "@/hooks/useAnalyticsConsent";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AnalyticsPageTracker(): null {
  const pathname = usePathname();

  useEffect(() => {
    // Check if we're on a share page
    const isSharePage = pathname?.startsWith("/view/");

    // Only check consent if not on share page
    // Share pages don't require consent for basic analytics
    if (!isSharePage && !hasAnalyticsConsent()) {
      return;
    }

    // Track page views (either with consent or on share pages)
    trackPageView(pathname);
  }, [pathname]);

  return null; // This component doesn't render anything
}
