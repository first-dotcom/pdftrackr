import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  FileText,
  Lock,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import CTAButton from "@/components/CTAButton";

export const metadata: Metadata = {
  title: "Document Tracking System - Simple PDF Analytics for Freelancers & Small Teams",
  description:
    "Track client documents with simple PDF analytics. Built for freelancers and small teams who need insights without big-company complexity.",
  keywords: [
    "document tracking system",
    "PDF tracking system",
            "document analytics for teams",
    "document management system",
    "PDF analytics platform",
    "document tracking software",
    "bulk document tracking",
    "document workflow system",
  ],
  openGraph: {
    title: "Document Tracking System - Simple PDF Analytics for Freelancers & Small Teams",
    description:
      "Track client documents with simple PDF analytics. Built for freelancers and small teams who need insights without big-company complexity.",
    type: "website",
    url: "https://pdftrackr.com/document-tracking-system",
    images: [{ url: "https://pdftrackr.com/og-logo.png", alt: "PDFTrackr — simple PDF tracking for freelancers" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://pdftrackr.com/og-logo.png"],
  },
  alternates: {
    canonical: "https://pdftrackr.com/document-tracking-system",
  },
};

const systemFeatures = [
  {
    icon: Database,
    title: "Centralized Management",
    description:
      "Manage all your documents from a single, unified dashboard. Organize files, track performance, and maintain control across your document collection.",
  },
  {
    icon: BarChart3,
    title: "Simple Analytics",
    description:
      "Track document views, engagement time, and geographic data. Monitor which pages get the most attention and understand your audience better.",
  },
  {
    icon: FileText,
    title: "Secure File Management",
    description:
      "Upload and manage PDF documents with built-in security. Each file is virus-scanned and stored securely with access controls.",
  },
  {
    icon: Shield,
    title: "Security & Privacy",
    description:
      "Bank-level security with encryption, password protection, and GDPR compliance. Protect sensitive documents with industry-standard security practices.",
  },
  {
    icon: TrendingUp,
    title: "Performance Insights",
    description:
      "Understand document performance with view counts, session duration, and page-by-page analytics. Identify which content resonates with your audience.",
  },
  {
    icon: Zap,
    title: "Real-Time Tracking",
    description:
      "Monitor document activity in real-time with live analytics. See who's viewing your documents and how they interact with your content.",
  },
];

const currentCapabilities = [
  {
    title: "Simple & Reliable",
    description:
      "Reliable, cloud-hosted infrastructure designed for individual users and small teams.",
    icon: CheckCircle,
  },
  {
    title: "GDPR Compliant",
    description: "Built-in privacy controls and data retention policies to meet GDPR requirements.",
    icon: CheckCircle,
  },
  {
    title: "Secure by Default",
    description: "Every document is virus-scanned and encrypted with industry-standard security.",
    icon: CheckCircle,
  },
  {
    title: "Easy to Use",
    description:
      "Intuitive interface designed for freelancers and small teams who need simple document tracking.",
    icon: CheckCircle,
  },
];

const workflowStages = [
  {
    step: "1",
    title: "Upload Your PDF",
    description:
      "Upload your PDF document to our secure platform. Files are automatically virus-scanned and prepared for tracking.",
  },
  {
    step: "2",
    title: "Configure Security Settings",
    description:
      "Set up password protection, email gating, link expiration, and download controls for your document.",
  },
  {
    step: "3",
    title: "Share Securely",
    description:
      "Generate a secure sharing link and distribute it to your audience. All access is tracked and monitored.",
  },
  {
    step: "4",
    title: "Monitor Analytics",
    description:
      "Track views, engagement time, geographic data, and page-by-page analytics in real-time through your dashboard.",
  },
  {
    step: "5",
    title: "Optimize Content",
    description:
      "Use analytics insights to understand which content resonates with your audience and improve future documents.",
  },
];

const useCases = [
  {
    icon: "💼",
    title: "Freelancers & Consultants",
    description:
      "Track client document engagement, monitor proposal views, and understand which content resonates with your audience.",
    color: "bg-blue-100",
    textColor: "text-blue-600",
  },
  {
    icon: "📊",
    title: "Small Business Owners",
    description:
      "Monitor marketing materials, track lead generation documents, and optimize content based on viewer engagement.",
    color: "bg-green-100",
    textColor: "text-green-600",
  },
  {
    icon: "🎓",
    title: "Educators & Trainers",
    description:
      "Track student engagement with course materials and understand which content gets the most attention.",
    color: "bg-purple-100",
    textColor: "text-purple-600",
  },
  {
    icon: "📈",
    title: "Content Creators",
    description:
      "Monitor whitepaper performance, track lead magnet engagement, and optimize content strategy based on analytics.",
    color: "bg-orange-100",
    textColor: "text-orange-600",
  },
];

export default function DocumentTrackingSystemPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Document Tracking System - Simple PDF Analytics for Freelancers & Small Teams
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Track your client documents with ease. Get powerful analytics without the complexity.
            Perfect for consultants, solopreneurs, and small teams who need to understand document engagement.
          </p>
        </div>

        {/* Hero CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 mb-12 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            Start Using Our Document Tracking System Today
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Reliable platform • Simple workflows • Secure sharing • 500MB free storage
          </p>
          <CTAButton size="lg" variant="secondary">
            Get Started Free
            <Database className="ml-2 h-5 w-5" />
          </CTAButton>
        </div>

        {/* System Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Complete Document Tracking System Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {systemFeatures.map((feature, index) => (
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

        {/* Workflow Process */}
        <div className="bg-white rounded-lg p-8 mb-16 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Systematic Document Tracking Workflow
          </h2>
          <div className="space-y-8">
            {workflowStages.map((stage, index) => (
              <div key={index} className="flex items-start">
                <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mr-6 flex-shrink-0">
                  <span className="text-xl font-bold text-primary-600">{stage.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{stage.title}</h3>
                  <p className="text-gray-600">{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Built for Freelancers & Small Teams */}
        <div className="bg-white rounded-lg p-8 mb-16 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Built for Freelancers & Small Teams
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentCapabilities.map((capability, index) => (
              <div key={index} className="flex items-start">
                <capability.icon className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{capability.title}</h3>
                  <p className="text-gray-600">{capability.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Perfect for Individual Users & Small Teams
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm text-center">
                <div
                  className={`${useCase.color} rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4`}
                >
                  <span className={`text-xl font-bold ${useCase.textColor}`}>{useCase.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{useCase.title}</h3>
                <p className="text-sm text-gray-600">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg p-8 mb-16 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose PDFTrackr's Document Tracking System?
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-primary-600">
                    PDFTrackr System
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-600">
                    Other Solutions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-900">Document Management</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center">
                      Simple & Secure
                      <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">Basic</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-900">Analytics & Tracking</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center">
                      Comprehensive
                      <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">Limited</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-900">Security Features</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center">
                      Bank-Level
                      <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">Basic</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-900">GDPR Compliance</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center">
                      Built-in
                      <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">Limited</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-900">Free Storage</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center">
                      500MB
                      <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">50-100MB</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-900">Ease of Use</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center">
                      Simple Setup
                      <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">Complex</td>
                </tr>
              </tbody>
            </table>
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
                How does the document tracking workflow work?
              </h3>
              <p className="text-gray-600">
                Our system follows a simple 5-step workflow: upload your PDF, configure security settings,
                share securely, monitor analytics, and optimize based on insights. This straightforward
                approach makes document tracking accessible for individual users and small teams.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What analytics can I see for my documents?
              </h3>
              <p className="text-gray-600">
                PDFTrackr provides comprehensive analytics including view counts, unique visitors,
                session duration, page-by-page engagement, geographic data, and device information.
                All analytics are available for 30 days with automatic data retention policies.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is the system suitable for freelancers and small teams?
              </h3>
              <p className="text-gray-600">
                Yes! PDFTrackr is specifically designed for freelancers, consultants, and small teams.
                We provide reliable infrastructure, comprehensive security features, and GDPR compliance
                without the complexity of enterprise solutions.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What security features are included?
              </h3>
              <p className="text-gray-600">
                PDFTrackr includes password protection, email gating, link expiration, download controls,
                virus scanning, TLS encryption, and GDPR-compliant data handling. Every document is
                automatically scanned for security threats upon upload.
              </p>
            </div>
          </div>
        </div>

        {/* Related Guides Section */}
        <div className="bg-white rounded-lg p-8 mb-16 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Learn More About Document Tracking
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/track-documents-online"
              className="block p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Track Documents Online</h3>
              <p className="text-sm text-gray-600 mb-3">
                Learn about our cloud-based platform for online document tracking and analytics.
              </p>
              <span className="text-primary-600 text-sm font-medium">Learn More →</span>
            </Link>
            <Link
              href="/pdf-analytics-tutorial"
              className="block p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">PDF Analytics Tutorial</h3>
              <p className="text-sm text-gray-600 mb-3">
                Master document insights and performance tracking with comprehensive analytics.
              </p>
              <span className="text-primary-600 text-sm font-medium">Read Tutorial →</span>
            </Link>
            <Link
              href="/how-to-track-pdf-views"
              className="block p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">How to Track PDF Views</h3>
              <p className="text-sm text-gray-600 mb-3">
                Complete step-by-step guide to PDF tracking setup and implementation.
              </p>
              <span className="text-primary-600 text-sm font-medium">Read Guide →</span>
            </Link>
            <Link
              href="/free-pdf-tracking"
              className="block p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Free PDF Tracking</h3>
              <p className="text-sm text-gray-600 mb-3">
                Start tracking PDFs for free with 500MB storage and no credit card required.
              </p>
              <span className="text-primary-600 text-sm font-medium">Learn More →</span>
            </Link>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Implement Our Document Tracking System?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join freelancers and small teams that trust PDFTrackr for their document tracking needs.
            Get started with our simple approach to document management and analytics.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Start Using Document Tracking System Now
            <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
