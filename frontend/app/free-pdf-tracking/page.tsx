import { ArrowLeft, BarChart3, CheckCircle, Clock, Gift, Lock, Mail, Shield } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import CTAButton from "@/components/CTAButton";
import LearnMoreSection from "@/components/LearnMoreSection";
import SEOBreadcrumbs from "@/components/SEOBreadcrumbs";

export const metadata: Metadata = {
  title: "Free PDF Tracking & Analytics (No Credit Card)",
  description:
    "Free PDF tracking for freelancers and small teams. See who opens your files and what they read. 500MB included—no credit card required.",
  keywords: [
    "free PDF tracking",
    "PDF tracking free",
    "free PDF analytics",
    "track PDF views free",
    "free document tracking",
    "PDF viewer tracking free",
    "free PDF security",
    "no credit card PDF tracking",
    "free PDF tracking software",
    "PDF tracking no credit card required",
    "free PDF analytics dashboard",
    "track PDF views without payment",
    "free PDF sharing with analytics",
    "PDF tracking for freelancers free",
    "free document analytics platform",
    "PDF viewer analytics free",
    "free PDF engagement tracking",
    "no cost PDF tracking solution",
    "free PDF tracking for small business",
    "PDF analytics free trial",
  ],
  openGraph: {
    title: "Free PDF Tracking & Analytics (No Credit Card)",
    description:
      "Free PDF tracking for freelancers and small teams. See who opens your files and what they read. 500MB included—no credit card required.",
    type: "website",
    url: "https://pdftrackr.com/free-pdf-tracking",
    images: [{ url: "https://pdftrackr.com/og-logo.png", alt: "PDFTrackr — simple PDF tracking for freelancers" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://pdftrackr.com/og-logo.png"],
  },
  alternates: {
    canonical: "https://pdftrackr.com/free-pdf-tracking",
  },
};

const features = [
  {
    icon: Gift,
    title: "500MB Free Storage",
    description:
      "Upload and track unlimited PDFs with 500MB of free storage space. No hidden fees or storage limits.",
  },
  {
    icon: CheckCircle,
    title: "No Credit Card Required",
    description:
      "Start tracking PDFs immediately without providing any payment information. Our free plan is truly free.",
  },
  {
    icon: BarChart3,
    title: "Full Analytics Dashboard",
    description:
      "Get comprehensive analytics including view counts, engagement time, geographic data, and page-by-page insights.",
  },
  {
    icon: Mail,
    title: "Email Capture",
    description:
      "Capture viewer email addresses before they access your documents. Perfect for lead generation and building your audience.",
  },
  {
    icon: Lock,
    title: "Password Protection",
    description:
      "Secure your PDFs with password protection. Control who can access your documents and when.",
  },
  {
    icon: Shield,
    title: "Virus Scanning",
    description:
      "Every uploaded PDF is automatically scanned for viruses and malware to keep your documents safe.",
  },
  {
    icon: Clock,
    title: "Link Expiration",
    description:
      "Set custom expiration dates for your document links. Perfect for time-sensitive content.",
  },
];

const comparisonData = [
  {
    feature: "Free Storage",
    pdfTrackr: "500MB",
    competitors: "50-100MB",
    winner: "pdfTrackr",
  },
  {
    feature: "Credit Card Required",
    pdfTrackr: "No",
    competitors: "Often Yes",
    winner: "pdfTrackr",
  },
  {
    feature: "Email Capture",
    pdfTrackr: "Included",
    competitors: "Premium Feature",
    winner: "pdfTrackr",
  },
  {
    feature: "Password Protection",
    pdfTrackr: "Included",
    competitors: "Premium Feature",
    winner: "pdfTrackr",
  },
  {
    feature: "Virus Scanning",
    pdfTrackr: "Included",
    competitors: "Sometimes",
    winner: "pdfTrackr",
  },
  {
    feature: "Analytics Dashboard",
    pdfTrackr: "Full Access",
    competitors: "Limited",
    winner: "pdfTrackr",
  },
  {
    feature: "GDPR Compliance",
    pdfTrackr: "Built-in",
    competitors: "Limited",
    winner: "pdfTrackr",
  },
  {
    feature: "Page-by-Page Analytics",
    pdfTrackr: "Included",
    competitors: "Premium Feature",
    winner: "pdfTrackr",
  },
];

export default function FreePdfTrackingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <SEOBreadcrumbs />

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Free PDF Tracking - Track PDF Views & Analytics | No Credit Card Required
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get professional PDF tracking and analytics completely free. No credit card required, no
            hidden fees, no limitations. Start tracking your documents in minutes.
          </p>
        </div>

        {/* Hero CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 mb-12 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Start Free PDF Tracking Today</h2>
          <p className="text-lg mb-6 opacity-90">
            500MB free storage • No credit card required • Full analytics included
          </p>
          <div className="text-center">
            <CTAButton size="lg" variant="secondary">
              Get Started Free
              <Gift className="ml-2 h-5 w-5" />
            </CTAButton>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything You Need for Free PDF Tracking
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <feature.icon className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg p-8 mb-16 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How Free PDF Tracking Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your PDF</h3>
              <p className="text-gray-600">
                Upload any PDF document to PDFTrackr. Our platform automatically scans for viruses
                and prepares it for secure sharing.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Securely</h3>
              <p className="text-gray-600">
                Get a secure link to share your PDF. Add password protection, email capture, or set
                expiration dates as needed.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Track & Analyze</h3>
              <p className="text-gray-600">
                Monitor views, engagement, and analytics in real-time. See who's reading your
                documents and how they interact with them.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg p-8 mb-16 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose PDFTrackr for Free PDF Tracking?
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-primary-600">
                    PDFTrackr Free
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-600">
                    Other Platforms
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium text-gray-900">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center">
                        {row.pdfTrackr}
                        {row.winner === "pdfTrackr" && (
                          <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-600">{row.competitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Why Free PDF Tracking Matters */}
        <div className="bg-white rounded-lg p-8 mb-16 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Why Free PDF Tracking is Essential for Modern Business
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">The Problem with Traditional PDF Sharing</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>No visibility into who actually reads your documents</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Documents get downloaded and shared without your knowledge</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>No way to measure document effectiveness or engagement</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Missed opportunities for lead generation and follow-up</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">The PDFTrackr Solution</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Real-time tracking of document views and engagement</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Secure sharing with view-only options to prevent unauthorized downloads</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Comprehensive analytics to measure document performance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Email capture for lead generation and targeted follow-up</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Perfect for These Use Cases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Business Reports</h3>
              <p className="text-sm text-gray-600">
                Track engagement with quarterly reports, proposals, and presentations
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold">📚</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Educational Content</h3>
              <p className="text-sm text-gray-600">
                Monitor student engagement with course materials and study guides
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">💼</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Lead Generation</h3>
              <p className="text-sm text-gray-600">
                Capture emails and track engagement with marketing materials
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm text-center">
              <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold">🔒</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Sharing</h3>
              <p className="text-sm text-gray-600">
                Protect sensitive documents with password protection and access controls
              </p>
            </div>
          </div>
        </div>

        {/* Industry-Specific Benefits */}
        <div className="bg-white rounded-lg p-8 mb-16 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Free PDF Tracking Benefits by Industry
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Freelancers & Consultants</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Track client proposal engagement</li>
                <li>• See which sections get most attention</li>
                <li>• Follow up with interested prospects</li>
                <li>• Measure portfolio effectiveness</li>
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                Learn more: <Link href="/how-to-track-pdf-views" className="underline hover:text-blue-900">How to Track PDF Views</Link>
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Small Businesses</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li>• Monitor employee handbook distribution</li>
                <li>• Track training material completion</li>
                <li>• Measure marketing material effectiveness</li>
                <li>• Secure sharing of sensitive documents</li>
              </ul>
              <p className="text-xs text-green-700 mt-2">
                Learn more: <Link href="/document-tracking-system" className="underline hover:text-green-900">Document Tracking System</Link>
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Educators</h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li>• Track student engagement with materials</li>
                <li>• Monitor assignment completion rates</li>
                <li>• Identify students needing support</li>
                <li>• Measure course material effectiveness</li>
              </ul>
              <p className="text-xs text-purple-700 mt-2">
                Learn more: <Link href="/track-documents-online" className="underline hover:text-purple-900">Track Documents Online</Link>
              </p>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-900 mb-3">Real Estate</h3>
              <ul className="space-y-2 text-sm text-orange-800">
                <li>• Track property brochure views</li>
                <li>• See which listings generate interest</li>
                <li>• Follow up with serious buyers</li>
                <li>• Measure marketing campaign success</li>
              </ul>
              <p className="text-xs text-orange-700 mt-2">
                Learn more: <Link href="/secure-pdf-sharing-guide" className="underline hover:text-orange-900">Secure PDF Sharing Guide</Link>
              </p>
            </div>
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-red-900 mb-3">Legal Professionals</h3>
              <ul className="space-y-2 text-sm text-red-800">
                <li>• Track document review progress</li>
                <li>• Ensure client engagement with contracts</li>
                <li>• Monitor case file access</li>
                <li>• Secure sharing of sensitive documents</li>
              </ul>
              <p className="text-xs text-red-700 mt-2">
                Learn more: <Link href="/pdf-analytics-tutorial" className="underline hover:text-red-900">PDF Analytics Tutorial</Link>
              </p>
            </div>
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">Marketing Agencies</h3>
              <ul className="space-y-2 text-sm text-indigo-800">
                <li>• Track campaign material engagement</li>
                <li>• Measure client proposal effectiveness</li>
                <li>• Generate leads through email capture</li>
                <li>• Demonstrate ROI to clients</li>
              </ul>
              <p className="text-xs text-indigo-700 mt-2">
                Learn more: <Link href="/pdf-tracking-faq" className="underline hover:text-indigo-900">PDF Tracking FAQ</Link>
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg p-8 mb-16 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is PDF tracking really free?
              </h3>
              <p className="text-gray-600">
                Yes! PDFTrackr offers a generous free plan with 500MB storage, full analytics, email
                capture, and security features. No credit card required to get started.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What's the catch?</h3>
              <p className="text-gray-600">
                There's no catch. We believe in providing value first. Our free plan includes
                everything you need to start tracking PDFs effectively. Pro plans will be available
                later for advanced features.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How long can I use the free plan?
              </h3>
              <p className="text-gray-600">
                The free plan is available indefinitely. You can use it as long as you want with no
                time restrictions or hidden fees.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens when I reach 500MB?
              </h3>
              <p className="text-gray-600">
                You can delete old files to free up space. We're working on premium plans with more storage
                and advanced features - join our waitlist to be notified when they become available.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I track multiple PDFs with the free plan?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can upload and track as many PDFs as you want within your 500MB storage limit. 
                Each document gets its own tracking link and analytics dashboard.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my data secure with the free plan?
              </h3>
              <p className="text-gray-600">
                Yes! All plans, including the free plan, include virus scanning, secure HTTPS connections, 
                GDPR compliance, and data encryption. Your documents and analytics data are fully protected.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I export my analytics data?
              </h3>
              <p className="text-gray-600">
                Yes, you can export your tracking data in various formats for further analysis, reporting, 
                or integration with other business tools. This feature is included in the free plan.
              </p>
            </div>
          </div>
        </div>

        {/* Related Guides Section */}
        <LearnMoreSection 
          title="Learn More About PDF Tracking"
          guides={[
            {
              href: "/how-to-track-pdf-views",
              title: "How to Track PDF Views",
              description: "Complete step-by-step guide to PDF tracking setup and implementation.",
              label: "Read Guide"
            },
            {
              href: "/secure-pdf-sharing-guide",
              title: "Secure PDF Sharing Guide",
              description: "Learn best practices for secure document sharing and access control.",
              label: "Read Guide"
            },
            {
              href: "/pdf-analytics-tutorial",
              title: "PDF Analytics Tutorial",
              description: "Master document insights and performance tracking with comprehensive analytics.",
              label: "Read Tutorial"
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
            Ready to Start Free PDF Tracking?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already tracking their PDFs for free with PDFTrackr. No credit card required.
          </p>
          <CTAButton size="lg">
            Start Free PDF Tracking Now
          </CTAButton>
        </div>
      </div>
    </div>
  );
}
