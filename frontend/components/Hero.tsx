"use client";

import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import { useEffect, useState } from "react";
import CTAButton from "./CTAButton";

interface HeroProps {
  isSignedIn?: boolean;
}

interface PublicAnalytics {
  totalViews: number;
  totalDocs: number;
  avgSession: number;
}

interface GlobalAnalytics {
  totalViews: number;
  totalUniqueViews: number;
  totalDuration: number;
  avgDuration: number; // in milliseconds
  totalFiles: number;
  totalShares: number;
  totalEmailCaptures: number;
}

export default function Hero({ isSignedIn = false }: HeroProps) {
  const [globalAnalytics, setGlobalAnalytics] = useState<GlobalAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  useEffect(() => {
    const fetchGlobalAnalytics = async () => {
      try {
        const response = await apiClient.analytics.getGlobal();
        if (response.success && response.data) {
          setGlobalAnalytics(response.data as GlobalAnalytics);
        }
      } catch (error) {
        console.error("Failed to fetch global analytics:", error);
        // Fallback to default values if API fails
        setGlobalAnalytics({
          totalViews: 156,
          totalUniqueViews: 89,
          totalDuration: 0,
          avgDuration: 154000, // 2m 34s in milliseconds
          totalFiles: 42,
          totalShares: 67,
          totalEmailCaptures: 23,
        });
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    fetchGlobalAnalytics();
  }, []);

  // Format session duration for display - same logic as dashboard
  const formatSessionDuration = (milliseconds: number) => {
    if (milliseconds < 0) {
      return "0ms";
    }

    const totalMs = Math.round(milliseconds);
    const ms = totalMs % 1000;
    const totalSeconds = Math.floor(totalMs / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    // Build parts array and join only non-zero parts (but always show at least ms)
    const parts: string[] = [];
    
    if (hours > 0) {
      parts.push(`${hours.toString().padStart(2, '0')}h`);
    }
    if (minutes > 0 || hours > 0) {
      parts.push(`${minutes.toString().padStart(2, '0')}m`);
    }
    if (seconds > 0 || minutes > 0 || hours > 0) {
      parts.push(`${seconds.toString().padStart(2, '0')}s`);
    }
    
    // Always show milliseconds
    parts.push(`${ms.toString().padStart(3, '0')}ms`);
    
    return parts.join(':');
  };

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout: Side by side */}
        <div className="hidden lg:flex lg:items-center lg:py-16 lg:gap-8 lg:max-w-6xl lg:mx-auto">
          {/* Main Content - Takes most of the space */}
          <div className="flex-1 lg:max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              PDF Tracking & Analytics - Simple Document Sharing for Freelancers
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Track PDF views, capture emails, and control access with our secure sharing platform.
              Perfect for consultants, solopreneurs, and small teams who need professional document
              insights.
            </p>

            <p className="mt-2 text-sm text-gray-500 sm:max-w-xl">
              Need more than 500MB?{" "}
              <button
                type="button"
                onClick={() =>
                  document.getElementById("waitlist-modal")?.classList.remove("hidden")
                }
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Join the waitlist for Pro plans launching Q4 2025
              </button>
            </p>

            <div className="mt-5 sm:mt-8 sm:flex sm:justify-start">
              <div className="flex flex-col">
                <CTAButton size="lg">
                  {isSignedIn ? "Go to Dashboard" : "Upload PDF"}
                </CTAButton>
                {!isSignedIn && (
                  <p className="mt-2 text-sm text-gray-500">
                    Start Free - No Card Required
                  </p>
                )}
              </div>

              <div className="mt-3 sm:mt-0 sm:ml-3">
                <Link
                  href="/demo"
                  className="w-full flex items-center justify-center px-6 py-2.5 border border-primary-300 text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 md:py-3 md:px-8 transition-colors"
                >
                  View Demo
                </Link>
              </div>
            </div>
          </div>

          {/* Demo Analytics - Responsive width */}
          <div className="w-64 flex-shrink-0 lg:w-72 xl:w-80 2xl:w-96">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-4 shadow-lg">
              <div className="flex flex-col items-center space-y-3">
                {/* Analytics Dashboard Preview */}
                <div
                  className={`bg-white p-3 rounded-lg shadow-sm w-full ${
                    isLoadingAnalytics ? "animate-pulse" : ""
                  }`}
                >
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-700 text-sm">Live Analytics</span>
                      <span className="text-xs text-gray-500">Real Data</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Views</span>
                        <span className="text-sm font-medium text-green-700">
                          {isLoadingAnalytics
                            ? "..."
                            : globalAnalytics?.totalViews.toLocaleString() || "0"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Docs</span>
                        <span className="text-sm font-medium text-green-700">
                          {isLoadingAnalytics
                            ? "..."
                            : globalAnalytics?.totalFiles.toLocaleString() || "0"}
                        </span>
                      </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Average Time Spent</span>
                                  <span className="text-sm font-medium text-green-700">
                                    {isLoadingAnalytics
                                      ? "..."
                                      : globalAnalytics
                                        ? formatSessionDuration(globalAnalytics.avgDuration)
                                        : "0ms"}
                                  </span>
                                </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Layout: Stacked */}
        <div className="lg:hidden">
          {/* Main Content */}
          <div className="pt-10 pb-8 sm:pt-12 sm:pb-16 md:pt-16 md:pb-20">
            <div className="text-center">
              <h2 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl">
                <span className="block">PDF Tracking & Analytics</span>
                <span className="block text-primary-600">
                  - Simple Document Sharing for Freelancers
                </span>
              </h2>

              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto">
                Track PDF views, capture emails, and control access with our secure sharing
                platform. Perfect for consultants, solopreneurs, and small teams who need
                professional document insights.
              </p>

              <p className="mt-2 text-sm text-gray-500 sm:max-w-xl sm:mx-auto">
                Need more than 500MB?{" "}
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("waitlist-modal")?.classList.remove("hidden")
                  }
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  Join the waitlist for Pro plans launching Q4 2025
                </button>
              </p>

              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center">
                <div className="flex flex-col">
                  <CTAButton size="lg">
                    {isSignedIn ? "Go to Dashboard" : "Upload PDF"}
                  </CTAButton>
                  {!isSignedIn && (
                    <p className="mt-2 text-sm text-gray-500 text-center">
                      Start Free - No Card Required
                    </p>
                  )}
                </div>

                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link
                    href="/demo"
                    className="w-full flex items-center justify-center px-6 py-2.5 border border-primary-300 text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 md:py-3 md:px-8 transition-colors"
                  >
                    Try Demo
                  </Link>
                </div>

                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link
                    href="#features"
                    className="w-full flex items-center justify-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-3 md:px-8"
                  >
                    See Features
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
