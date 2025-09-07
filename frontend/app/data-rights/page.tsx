import DataRightsForm from "@/components/DataRightsForm";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "PDF Data Rights - GDPR Compliance for Document Sharing",
  description:
    "Exercise your GDPR data rights for PDFs shared via PDFTrackr. Request access, deletion, or export of your personal data and related document analytics.",
  keywords: [
    "PDF data rights",
    "GDPR PDF tool",
    "document privacy rights",
    "PDF GDPR compliance",
    "document data rights",
    "PDF privacy rights",
    "data protection rights",
    "GDPR document sharing",
    "PDF data deletion",
    "document privacy compliance",
  ],
  openGraph: {
    title: "PDF Data Rights - GDPR Compliance for Document Sharing",
    description:
      "Exercise your GDPR data rights for PDFs shared via PDFTrackr. Request access, deletion, or export of your personal data and related document analytics.",
    type: "article",
    url: "https://pdftrackr.com/data-rights",
    images: ["https://pdftrackr.com/og-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://pdftrackr.com/og-logo.png"],
  },
  alternates: {
    canonical: "https://pdftrackr.com/data-rights",
  },
};

export default async function DataRightsPage() {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/data-rights");
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            PDF Data Rights - GDPR Compliance for Document Sharing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Exercise your GDPR data rights for PDF documents shared through PDFTrackr. Request
            access, deletion, or export of your personal data and document analytics. Under the
            General Data Protection Regulation (GDPR), you have specific rights regarding your
            personal data. Use this form to exercise those rights.
          </p>
        </div>

        <DataRightsForm />

        <div className="mt-12 bg-white shadow-sm rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How long will it take to process my request?
              </h3>
              <p className="text-gray-600">
                We will respond to your request within 30 days. For complex requests, we may extend
                this period by an additional 60 days, but we will notify you within the first 30
                days.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do I need to provide identification?
              </h3>
              <p className="text-gray-600">
                Yes, we may need to verify your identity before processing your request to protect
                your privacy and ensure we're providing data to the right person.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I request data on behalf of someone else?
              </h3>
              <p className="text-gray-600">
                Yes, but you'll need to provide proof of authorization, such as a power of attorney
                or written consent from the data subject.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What if my request is denied?
              </h3>
              <p className="text-gray-600">
                If we cannot fulfill your request, we will explain why and inform you of your right
                to lodge a complaint with your local data protection authority.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a fee for data requests?
              </h3>
              <p className="text-gray-600">
                Generally, no. However, we may charge a reasonable fee for manifestly unfounded or
                excessive requests, or for additional copies of the same information.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? See our{" "}
                          <a href="/pdf-privacy-policy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
