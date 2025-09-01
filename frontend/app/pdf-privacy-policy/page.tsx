import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import LearnMoreSection from "@/components/LearnMoreSection";

export const metadata: Metadata = {
  title: "PDF Privacy Policy - Simple Privacy Protection for Freelancers",
  description:
    "Our simple privacy policy explains how freelancer documents are protected. Transparent, GDPR-compliant, easy to understand.",
  keywords: [
    "PDF privacy policy",
    "secure PDF sharing privacy",
    "GDPR compliant PDF tool",
    "PDF data protection",
    "document privacy policy",
    "PDF security privacy",
  ],
  openGraph: {
    title: "PDF Privacy Policy - Secure Document Sharing & GDPR Compliance",
    description:
      "PDFTrackr's privacy policy ensures your documents and data remain secure when sharing PDFs online. Our GDPR-compliant platform protects your privacy while providing powerful PDF analytics and tracking features.",
    type: "article",
  },
};

export default function PdfPrivacyPolicyPage() {
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
            PDF Privacy Policy - Secure Document Sharing & GDPR Compliance
          </h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-600 mb-6">
              Understand how we protect your documents and data. Our simple, transparent privacy
              policy ensures your client work stays secure. GDPR-compliant protection for
              freelancers and small teams.
            </p>

            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> August 25, 2025
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              PDFTrackr's privacy policy ensures your documents and data remain secure when sharing
              PDFs online. Our GDPR-compliant platform protects your privacy while providing
              powerful PDF analytics and tracking features. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our PDF sharing
              and analytics platform. For more information about our tracking capabilities, see our{" "}
              <a href="/how-to-track-pdf-views" className="text-blue-600 hover:underline">
                PDF tracking guide
              </a>{" "}
              and{" "}
              <a href="/pdf-tracking-faq" className="text-blue-600 hover:underline">
                FAQ page
              </a>
              .
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              2.1 Information You Provide
            </h3>
            <p className="text-gray-600 mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Account information (email, name) when you create an account</li>
              <li>PDF files you upload to our platform</li>
              <li>Communication data when you contact us for support</li>
              <li>Payment information (if applicable for future paid plans)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              2.2 Automatically Collected Information
            </h3>
            <p className="text-gray-600 mb-4">
              We automatically collect certain information when you use our service:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Device information (browser type, operating system, device type)</li>
              <li>Usage data (pages visited, time spent, features used)</li>
              <li>IP address (anonymized for analytics)</li>
              <li>Geographic location (country level only)</li>
              <li>Referrer information (how you found our site)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              2.3 Google Analytics Data
            </h3>
            <p className="text-gray-600 mb-4">
              We use Google Analytics 4 (GA4) to collect website usage data. Google Analytics
              collects:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Page views and navigation patterns</li>
              <li>Time spent on pages</li>
              <li>Geographic location (country level)</li>
              <li>Device and browser information</li>
              <li>User interactions (clicks, form submissions)</li>
            </ul>
            <p className="text-gray-600 mb-4">
              <strong>Important:</strong> Google Analytics data is collected only after you provide
              explicit consent. You can withdraw consent at any time.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-600 mb-4">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>
                <strong>Service Provision:</strong> To provide, maintain, and improve our PDF
                sharing and analytics services
              </li>
              <li>
                <strong>Analytics:</strong> To analyze usage patterns and improve user experience
              </li>
              <li>
                <strong>Security:</strong> To detect and prevent fraud, abuse, and security threats
              </li>
              <li>
                <strong>Communication:</strong> To respond to your inquiries and provide customer
                support
              </li>
              <li>
                <strong>Legal Compliance:</strong> To comply with applicable laws and regulations
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              4. Legal Basis for Processing (GDPR)
            </h2>
            <p className="text-gray-600 mb-4">
              Under the General Data Protection Regulation (GDPR), we process your data based on the
              following legal grounds:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>
                <strong>Consent:</strong> For analytics and marketing purposes (you can withdraw at
                any time)
              </li>
              <li>
                <strong>Contract Performance:</strong> To provide our services as agreed
              </li>
              <li>
                <strong>Legitimate Interest:</strong> To improve our services and ensure security
              </li>
              <li>
                <strong>Legal Obligation:</strong> To comply with applicable laws
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              5. Data Sharing and Third Parties
            </h2>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5.1 Google Analytics</h3>
            <p className="text-gray-600 mb-4">
              We use Google Analytics, a service provided by Google LLC. Google Analytics processes
              data in accordance with their Privacy Policy. You can opt out of Google Analytics by
              installing the Google Analytics Opt-out Browser Add-on.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5.2 Service Providers</h3>
            <p className="text-gray-600 mb-4">
              We may share data with trusted service providers who assist us in operating our
              platform:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Cloud storage providers (DigitalOcean Spaces)</li>
              <li>Authentication services (Clerk)</li>
              <li>Email service providers</li>
              <li>Security and virus scanning services</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              5.3 Legal Requirements
            </h3>
            <p className="text-gray-600 mb-4">
              We may disclose your information if required by law or to protect our rights,
              property, or safety.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Data Retention</h2>
            <p className="text-gray-600 mb-4">
              We retain your data for the following periods. Our automated data retention system
              ensures compliance:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>
                <strong>Account Data:</strong> Until you delete your account or request deletion
              </li>
              <li>
                <strong>PDF Files:</strong> Until you delete them or your account is deleted
              </li>
              <li>
                <strong>Analytics Data:</strong> 26 months (Google Analytics default), automatically
                deleted
              </li>
              <li>
                <strong>Session Data:</strong> 30 days, automatically deleted
              </li>
              <li>
                <strong>Email Captures:</strong> 12 months, automatically deleted
              </li>
              <li>
                <strong>Log Data:</strong> 30 days for security and debugging purposes
              </li>
              <li>
                <strong>Orphaned Files:</strong> 90 days after user deletion, automatically cleaned
                up
              </li>
              <li>
                <strong>Legal Records:</strong> As required by applicable laws
              </li>
            </ul>
            <p className="text-gray-600 mb-4">
              Our automated cleanup job runs daily to ensure expired data is permanently deleted
              from our systems.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              7. International Data Transfers
            </h2>
            <p className="text-gray-600 mb-4">
              Your data may be transferred to and processed in countries other than your own. We
              ensure appropriate safeguards are in place for such transfers, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Standard Contractual Clauses (SCCs) for EU data transfers</li>
              <li>Adequacy decisions where applicable</li>
              <li>Other appropriate safeguards as required by law</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              8. Your Rights Under GDPR
            </h2>
            <p className="text-gray-600 mb-4">
              If you are in the European Economic Area (EEA), you have the following rights:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>
                <strong>Right of Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Right to Rectification:</strong> Request correction of inaccurate data
              </li>
              <li>
                <strong>Right to Erasure:</strong> Request deletion of your personal data ("right to
                be forgotten")
              </li>
              <li>
                <strong>Right to Restrict Processing:</strong> Request limitation of data processing
              </li>
              <li>
                <strong>Right to Data Portability:</strong> Request transfer of your data to another
                service
              </li>
              <li>
                <strong>Right to Object:</strong> Object to processing based on legitimate interests
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Withdraw consent for analytics at any
                time
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              9. How to Exercise Your Rights
            </h2>
            <p className="text-gray-600 mb-4">You can exercise your rights in several ways:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>
                <strong>Online Form:</strong> Use our{" "}
                <a href="/data-rights" className="text-blue-600 hover:underline">
                  Data Rights Request Form
                </a>{" "}
                to:
                <ul className="list-disc pl-6 mt-2">
                  <li>
                    <strong>Access your data:</strong> Get a complete copy of all personal data we
                    hold about you
                  </li>
                  <li>
                    <strong>Rectify your data:</strong> Update your profile information (name,
                    email)
                  </li>
                  <li>
                    <strong>Delete your data:</strong> Permanently delete your account and all
                    associated data
                  </li>
                  <li>
                    <strong>Export your data:</strong> Download your data in machine-readable format
                  </li>
                </ul>
              </li>
              <li>
                Use our{" "}
                <a href="/data-rights" className="text-blue-600 hover:underline">
                  Data Rights Request Form
                </a>
              </li>
              <li>
                <strong>Postal Address:</strong> [Your Business Address]
              </li>
            </ul>
            <p className="text-gray-600 mb-4">
              We will respond to your request within 30 days. For deletion requests, your account
              will be permanently removed immediately upon confirmation. You also have the right to
              lodge a complaint with your local data protection authority.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate technical and organizational measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Secure cloud storage with private access controls</li>
              <li>TLS/SSL encryption for all data in transit</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication</li>
              <li>Virus scanning for uploaded files</li>
              <li>Secure data centers and infrastructure</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              11. Cookies and Tracking Technologies
            </h2>
            <p className="text-gray-600 mb-4">We use cookies and similar technologies for:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>
                <strong>Essential Cookies:</strong> Required for basic site functionality
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Google Analytics (with consent)
              </li>
              <li>
                <strong>Preference Cookies:</strong> Remember your settings and choices
              </li>
            </ul>
            <p className="text-gray-600 mb-4">
              You can manage cookie preferences through your browser settings or our consent banner.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              12. Children's Privacy
            </h2>
            <p className="text-gray-600 mb-4">
              Our service is not intended for children under 16. We do not knowingly collect
              personal information from children under 16. If you believe we have collected such
              information, please contact us immediately.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              13. Changes to This Policy
            </h2>
            <p className="text-gray-600 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by posting the new policy on this page and updating the "Last
              updated" date.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              14. Contact Information
            </h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please
              contact us:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>
                Use our{" "}
                <a href="/data-rights" className="text-blue-600 hover:underline">
                  Data Rights Request Form
                </a>
              </li>
              <li>Postal Address: [Your Business Address]</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              15. Supervisory Authority
            </h2>
            <p className="text-gray-600 mb-4">
              If you are in the EEA and have concerns about our data processing, you have the right
              to lodge a complaint with your local data protection authority. You can find your
              authority's contact information at:{" "}
              <a
                href="https://edpb.europa.eu/about-edpb/board/members_en"
                className="text-blue-600 hover:underline"
              >
                https://edpb.europa.eu/about-edpb/board/members_en
              </a>
            </p>
          </div>
        </div>

        {/* Learn More Section */}
        <LearnMoreSection 
          title="Learn More About PDF Tracking"
          guides={[
            {
              href: "/document-tracking-system",
              title: "Document Tracking System",
              description: "Learn about our comprehensive document tracking system for freelancers and small teams.",
              label: "Learn More"
            },
            {
              href: "/track-documents-online",
              title: "Track Documents Online",
              description: "Discover how to track documents online with our cloud-based platform.",
              label: "Learn More"
            },
            {
              href: "/secure-pdf-sharing-guide",
              title: "Secure PDF Sharing Guide",
              description: "Learn best practices for secure document sharing and access control.",
              label: "Read Guide"
            },
            {
              href: "/free-pdf-tracking",
              title: "Free PDF Tracking",
              description: "Start tracking PDFs for free with 500MB storage and no credit card required.",
              label: "Learn More"
            }
          ]}
        />
      </div>
    </div>
  );
}
