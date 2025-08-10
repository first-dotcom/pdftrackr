"use client";

import { useState, useEffect } from "react";

export default function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem('analytics-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('analytics-consent', 'accepted');
    setShowBanner(false);
    // Enable analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }
  };

  const handleDecline = () => {
    localStorage.setItem('analytics-consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex-1 text-sm">
          <p>
            We use analytics to improve your experience. By continuing, you agree to our use of analytics cookies.{" "}
            <a href="/privacy" className="underline hover:text-gray-300">
              Privacy Policy
            </a>
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-md transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to check consent status
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('analytics-consent') === 'accepted';
}
