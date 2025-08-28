import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PDF Sharing Terms of Service - Document Tracking & Analytics",
  description:
    "PDFTrackr's terms of service govern the secure sharing and tracking of PDF documents. Our platform provides professional PDF analytics while ensuring legal compliance and user protection.",
  keywords: [
    "PDF sharing terms",
    "document tracking terms",
    "PDF service agreement",
    "PDF terms of service",
    "document analytics terms",
    "PDF tracking terms",
  ],
  openGraph: {
    title: "PDF Sharing Terms of Service - Document Tracking & Analytics",
    description:
      "PDFTrackr's terms of service govern the secure sharing and tracking of PDF documents. Our platform provides professional PDF analytics while ensuring legal compliance and user protection.",
    type: "article",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            PDF Sharing Terms of Service - Document Tracking & Analytics
          </h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> August 2025
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              PDFTrackr's terms of service govern the secure sharing and tracking of PDF documents.
              Our platform provides professional PDF analytics while ensuring legal compliance and
              user protection. By accessing and using PDFTrackr, you accept and agree to be bound by
              the terms and provision of this agreement. Learn more about our{" "}
              <a href="/secure-pdf-sharing-guide" className="text-blue-600 hover:underline">
                secure sharing features
              </a>{" "}
              and{" "}
              <a href="/free-pdf-tracking" className="text-blue-600 hover:underline">
                free PDF tracking
              </a>{" "}
              capabilities.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Use License</h2>
            <p className="text-gray-600 mb-4">
              Permission is granted to temporarily use PDFTrackr for personal, non-commercial
              transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">User Responsibilities</h2>
            <p className="text-gray-600 mb-4">
              You are responsible for the content you upload and share. You must not upload
              malicious files, violate copyright laws, or use the service for illegal purposes.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Service Limitations</h2>
            <p className="text-gray-600 mb-4">
              PDFTrackr reserves the right to modify or discontinue the service at any time. We are
              not liable for any damages arising from the use or inability to use our service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Privacy</h2>
            <p className="text-gray-600 mb-4">
              Your privacy is important to us. Please review our Privacy Policy, which also governs
              your use of the service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Contact Information</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about these Terms of Service, please see our{" "}
              <a href="/privacy" className="underline">
                Privacy Policy
              </a>{" "}
              or use our{" "}
              <a href="/data-rights" className="underline">
                Data Rights form
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
