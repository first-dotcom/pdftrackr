"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import CTAButton from "./CTAButton";

interface HeroProps {
  isSignedIn?: boolean;
}

export default function Hero({ isSignedIn = false }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
      
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
              PDFTrackr provides simple PDF tracking and analytics to see who's reading your
              documents. Track PDF views, capture emails, and control access with our secure
              sharing platform. Perfect for freelancers, consultants, and small teams.
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
              <CTAButton size="lg">
                {isSignedIn ? "Go to Dashboard" : "Start Free - No Card Required"}
              </CTAButton>

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

          {/* Demo Analytics - Responsive width */}
          <div className="w-64 flex-shrink-0 lg:w-72 xl:w-80 2xl:w-96">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-4 shadow-lg">
              <div className="flex flex-col items-center space-y-3">
                {/* Analytics Dashboard Preview */}
                <div className="bg-white p-3 rounded-lg shadow-sm w-full animate-pulse">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-700 text-sm">Demo Analytics</span>
                      <span className="text-xs text-gray-500">Sample Data</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Views</span>
                        <span className="text-sm font-medium text-green-700">156</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg. Session</span>
                        <span className="text-sm font-medium text-green-700">2m 34s</span>
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
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl">
                <span className="block">PDF Tracking & Analytics</span>
                <span className="block text-primary-600">- Simple Document Sharing for Freelancers</span>
              </h1>

              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto">
                PDFTrackr provides simple PDF tracking and analytics to see who's reading your
                documents. Track PDF views, capture emails, and control access with our secure
                sharing platform. Perfect for freelancers, consultants, and small teams.
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
                <CTAButton size="lg">
                  {isSignedIn ? "Go to Dashboard" : "Start Free - No Card Required"}
                </CTAButton>

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
