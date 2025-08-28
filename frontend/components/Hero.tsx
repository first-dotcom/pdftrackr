"use client";

import { ArrowRight, CreditCard, Gift, Shield } from "lucide-react";
import Link from "next/link";
import WaitlistModal from "./WaitlistModal";

export default function Hero() {
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">PDF Tracking & Analytics</span>
                <span className="block text-primary-600">- Secure Document Sharing Platform</span>
              </h1>

              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                PDFTrackr provides professional PDF tracking and analytics to see who's reading your
                documents. Track PDF views, capture emails, and control access with our secure
                sharing platform. 500MB free storage, no credit card required.
              </p>

              <p className="mt-2 text-sm text-gray-500 sm:max-w-xl sm:mx-auto lg:mx-0">
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

              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link
                    href="/sign-up"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                  >
                    Start Free - No Card Required
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>

                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link
                    href="#features"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10"
                  >
                    See Features
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <div className="h-56 w-full bg-gradient-to-br from-primary-50 to-primary-100 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
          <div className="flex flex-col items-center space-y-6 p-8">
            {/* Analytics Dashboard Preview */}
            <div className="bg-white p-6 rounded-lg shadow-sm w-full max-w-md animate-pulse">
              <div className="bg-gray-50 p-4 rounded">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-gray-700">Demo Analytics</span>
                  <span className="text-sm text-gray-500">Sample Data</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Views</span>
                    <span className="text-sm font-medium text-green-700">156</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg. Session</span>
                    <span className="text-sm font-medium text-green-700">2m 34s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-medium text-green-700">68%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <Gift className="w-4 h-4 mr-1" />
                500MB FREE
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <CreditCard className="w-4 h-4 mr-1" />
                No Credit Card
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                <Shield className="w-4 h-4 mr-1" />
                GDPR Compliant
              </span>
            </div>
          </div>
        </div>
      </div>
      <WaitlistModal />
    </section>
  );
}
