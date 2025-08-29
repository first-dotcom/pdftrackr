"use client";

import { useEffect, useState } from "react";

export default function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem("analytics-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("analytics-consent", "accepted");
    setShowBanner(false);

    // Enable analytics with proper consent update
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
      });

      // Send a pageview event to record the consent
      window.gtag("event", "consent_granted", {
        event_category: "consent",
        event_label: "analytics",
      });
    }
  };

  const handleDecline = () => {
    localStorage.setItem("analytics-consent", "declined");
    setShowBanner(false);

    // Ensure analytics remain disabled
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
      });

      // Send a consent declined event (this won't be tracked if analytics are denied)
      window.gtag("event", "consent_declined", {
        event_category: "consent",
        event_label: "analytics",
      });
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex-1 text-sm">
          <p className="mb-2">
            <strong>We value your privacy</strong>
          </p>
          <p>
            We use Google Analytics and other cookies to analyze site usage and improve our service.
            This includes collecting data about page views, time spent, and geographic location. You
            can choose to accept or decline these cookies.{" "}
                          <a href="/pdf-privacy-policy" className="underline hover:text-gray-300">
              Privacy Policy
            </a>{" "}
            •{" "}
            <a href="/cookies" className="underline hover:text-gray-300">
              Cookie Policy
            </a>
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors border border-gray-600 rounded-md hover:border-gray-500"
          >
            Decline All
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-md transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to check consent status
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("analytics-consent") === "accepted";
}

// Helper function to update consent programmatically
export function updateAnalyticsConsent(granted: boolean): void {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: granted ? "granted" : "denied",
  });

  localStorage.setItem("analytics-consent", granted ? "accepted" : "declined");
}
