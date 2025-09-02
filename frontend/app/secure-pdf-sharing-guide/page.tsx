import { ArrowLeft, Clock, Download, Eye, Lock, Mail, Shield, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import CTAButton from "@/components/CTAButton";
import LearnMoreSection from "@/components/LearnMoreSection";

export const metadata: Metadata = {
  title: "Secure PDF Sharing Guide - Simple Protection for Freelancer Documents",
  description:
    "Keep client PDFs secure without the hassle. Simple, affordable sharing tools for freelancers and small teams.",
  keywords: [
    "secure PDF sharing guide",
    "PDF security best practices",
    "password protected PDF sharing",
    "PDF access controls",
    "secure document sharing",
    "PDF encryption",
    "PDF security features",
    "document protection guide",
  ],
  openGraph: {
    title: "Secure PDF Sharing Guide - Simple Protection for Freelancer Documents",
    description:
      "Keep client PDFs secure without the hassle. Simple, affordable sharing tools for freelancers and small teams.",
    type: "article",
    url: "https://pdftrackr.com/secure-pdf-sharing-guide",
    images: [{ url: "https://pdftrackr.com/og-logo.png", alt: "PDFTrackr — simple PDF tracking for freelancers" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://pdftrackr.com/og-logo.png"],
  },
  alternates: {
    canonical: "https://pdftrackr.com/secure-pdf-sharing-guide",
  },
};

export default function SecurePdfSharingGuidePage() {
  // Article Schema structured data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Secure PDF Sharing Guide - Simple Protection for Freelancer Documents",
    "description": "Keep client PDFs secure without the hassle. Simple, affordable sharing tools for freelancers and small teams.",
    "author": { "@type": "Organization", "name": "PDFTrackr" },
    "publisher": { "@type": "Organization", "name": "PDFTrackr" },
    "mainEntityOfPage": "https://pdftrackr.com/secure-pdf-sharing-guide",
    "dateModified": new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Article Schema structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Secure PDF Sharing Guide - Simple Protection for Freelancer Documents
          </h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-600 mb-6">
              Keep your client documents safe without breaking the bank. Learn simple security
              practices that work for freelancers and small teams. Start protecting your PDFs for
              free.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Security First:</strong> PDFTrackr provides industry-standard security
                    for your PDF documents with virus scanning, encryption, and comprehensive access
                    controls.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Why Secure PDF Sharing Matters
            </h2>
            <p className="text-gray-600 mb-4">
              In today's digital world, secure PDF sharing is essential for protecting sensitive
              information, maintaining compliance, and controlling document access. Whether you're
              sharing business proposals, legal documents, or confidential reports, proper security
              measures ensure your documents remain protected.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Essential Security Features for PDF Sharing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-3">
                  <Lock className="h-6 w-6 text-red-500 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Password Protection</h3>
                </div>
                <p className="text-gray-600 mb-3">
                  Add strong passwords to restrict access to your PDF documents. Only users with the
                  correct password can view the content.
                </p>
                <ul className="text-sm text-gray-600">
                  <li>• Custom password requirements</li>
                  <li>• Strong encryption standards</li>
                  <li>• Secure password transmission</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-3">
                  <Mail className="h-6 w-6 text-purple-500 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Email Gating</h3>
                </div>
                <p className="text-gray-600 mb-3">
                  Capture viewer email addresses before granting document access. Perfect for lead
                  generation and audience building.
                </p>
                <ul className="text-sm text-gray-600">
                  <li>• Automatic email collection</li>
                  <li>• Lead nurturing integration</li>
                  <li>• GDPR-compliant consent</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-3">
                  <Clock className="h-6 w-6 text-orange-500 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Link Expiration</h3>
                </div>
                <p className="text-gray-600 mb-3">
                  Set time limits on document access. Links automatically expire after a specified
                  period, ensuring temporary access only.
                </p>
                <ul className="text-sm text-gray-600">
                  <li>• Custom expiration dates</li>
                  <li>• Automatic access revocation</li>
                  <li>• Time-based security</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-3">
                  <Download className="h-6 w-6 text-blue-500 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Download Control</h3>
                </div>
                <p className="text-gray-600 mb-3">
                  Choose whether viewers can download your PDF or only view it online. Maintain
                  document control and prevent unauthorized distribution.
                </p>
                <ul className="text-sm text-gray-600">
                  <li>• View-only mode</li>
                  <li>• Download restrictions</li>
                  <li>• Content protection</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Step-by-Step Secure PDF Sharing Process
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Step 1: Prepare Your Document
            </h3>
            <p className="text-gray-600 mb-4">
              Before sharing, ensure your PDF is properly prepared:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Remove any sensitive metadata or personal information</li>
              <li>Optimize file size for faster sharing</li>
              <li>Ensure document quality meets your standards</li>
              <li>Consider adding watermarks for additional protection</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Step 2: Choose Your Security Settings
            </h3>
            <p className="text-gray-600 mb-4">
              Configure the appropriate security measures for your document:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>
                <strong>Password Protection:</strong> Set a strong, unique password
              </li>
              <li>
                <strong>Email Gating:</strong> Enable if you want to capture leads
              </li>
              <li>
                <strong>Link Expiration:</strong> Set appropriate time limits
              </li>
              <li>
                <strong>Download Control:</strong> Choose view-only or downloadable
              </li>
              <li>
                <strong>Access Notifications:</strong> Get alerts when documents are viewed
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Step 3: Upload and Secure
            </h3>
            <p className="text-gray-600 mb-4">
              Upload your PDF to a secure platform like PDFTrackr. The platform will:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Scan for viruses and malware</li>
              <li>Apply encryption to your document</li>
              <li>Generate a secure sharing link</li>
              <li>
                Set up{" "}
                <Link
                  href="/how-to-track-pdf-views"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  tracking and analytics
                </Link>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Step 4: Share Securely
            </h3>
            <p className="text-gray-600 mb-4">
              Distribute your secure PDF link through appropriate channels:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Email with clear access instructions</li>
              <li>Secure messaging platforms</li>
              <li>Password-protected portals</li>
              <li>Direct messaging for sensitive documents</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Step 5: Monitor and Manage
            </h3>
            <p className="text-gray-600 mb-4">Track document access and manage security:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Monitor who accesses your documents</li>
              <li>Track viewing patterns and engagement</li>
              <li>Revoke access if necessary</li>
              <li>Update security settings as needed</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Advanced Security Features
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Virus Scanning</h3>
            <p className="text-gray-600 mb-4">
              Every uploaded PDF is automatically scanned for viruses and malware, ensuring your
              documents and recipients remain safe from security threats.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">TLS/SSL Encryption</h3>
            <p className="text-gray-600 mb-4">
              All data transmission is encrypted using industry-standard TLS/SSL protocols,
              protecting your documents during upload, storage, and sharing.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Access Logging</h3>
            <p className="text-gray-600 mb-4">
              Comprehensive logs track every access attempt, providing an audit trail for compliance
              and security monitoring purposes.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Geographic Restrictions
            </h3>
            <p className="text-gray-600 mb-4">
              Restrict document access based on geographic location, ensuring compliance with
              regional data protection regulations.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Best Practices for Secure PDF Sharing
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              1. Use Strong Passwords
            </h3>
            <p className="text-gray-600 mb-4">
              Create complex passwords with a mix of letters, numbers, and special characters. Avoid
              using easily guessable information.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              2. Set Appropriate Expiration Dates
            </h3>
            <p className="text-gray-600 mb-4">
              Choose expiration dates that balance security with usability. Consider the document's
              sensitivity and intended use.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              3. Monitor Access Regularly
            </h3>
            <p className="text-gray-600 mb-4">
              Regularly review access logs and analytics to identify any suspicious activity or
              unauthorized access attempts.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4. Educate Recipients</h3>
            <p className="text-gray-600 mb-4">
              Inform recipients about security measures and best practices for handling sensitive
              documents.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              5. Regular Security Updates
            </h3>
            <p className="text-gray-600 mb-4">
              Keep your sharing platform and security tools updated to protect against the latest
              threats and vulnerabilities.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Compliance and Legal Considerations
            </h2>
            <p className="text-gray-600 mb-4">
              When sharing PDFs securely, consider these compliance requirements:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>
                <strong>GDPR Compliance:</strong> Ensure proper data handling for European users
              </li>
              <li>
                <strong>HIPAA Compliance:</strong> Special requirements for healthcare documents
              </li>
              <li>
                <strong>SOX Compliance:</strong> Financial document security requirements
              </li>
              <li>
                <strong>Industry Standards:</strong> Follow relevant industry security guidelines
              </li>
            </ul>

            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    <strong>Secure Your Documents:</strong> PDFTrackr provides industry-standard
                    security with 500MB free storage. Start protecting your PDFs today with
                    professional security features.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Guides Section */}
            <LearnMoreSection 
              title="Related Guides"
              guides={[
                {
                  href: "/how-to-track-pdf-views",
                  title: "How to Track PDF Views",
                  description: "Complete step-by-step guide to PDF tracking setup and implementation.",
                  label: "Read Guide"
                },
                {
                  href: "/pdf-analytics-tutorial",
                  title: "PDF Analytics Tutorial",
                  description: "Master document insights and performance tracking with comprehensive analytics.",
                  label: "Read Tutorial"
                },
                {
                  href: "/free-pdf-tracking",
                  title: "Free PDF Tracking",
                  description: "Start tracking PDFs for free with 500MB storage and no credit card required.",
                  label: "Learn More"
                },
                {
                  href: "/pdf-tracking-faq",
                  title: "PDF Tracking FAQ",
                  description: "Get answers to common questions about PDF tracking and document analytics.",
                  label: "Read FAQ"
                }
              ]}
            />

            {/* Final CTA */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Ready to Secure Your PDF Sharing?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Start protecting your client documents with PDFTrackr's secure sharing features. Get started for free with 500MB storage.
              </p>
              <CTAButton size="lg">
                Start Secure PDF Sharing Now
              </CTAButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
