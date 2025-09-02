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
      "Manage all your documents from a single, unified dashboard. Organize files, track performance, and maintain control across your entire document ecosystem.",
  },
  {
    icon: BarChart3,
    title: "Systematic Analytics",
    description:
      "Comprehensive analytics system that tracks every aspect of document performance. Monitor engagement patterns, user behavior, and content effectiveness with detailed reporting.",
  },
  {
    icon: Users,
    title: "Multi-User Access",
    description:
      "Grant access to team members with role-based permissions. Collaborate on document strategies while maintaining security and control over sensitive information.",
  },
  {
    icon: FileText,
    title: "Bulk Operations",
    description:
      "Upload and manage multiple documents simultaneously. Apply tracking settings, security policies, and analytics configurations across entire document sets.",
  },
  {
    icon: Settings,
    title: "Workflow Automation",
    description:
      "Automate document tracking workflows with customizable rules and policies. Set up automatic notifications, access controls, and reporting schedules.",
  },
  {
    icon: Shield,
    title: "Security & Privacy",
    description:
      "Bank-level security with encryption, access controls, and compliance features. Protect sensitive documents with industry-standard security practices.",
  },
  {
    icon: TrendingUp,
    title: "Performance Optimization",
    description:
      "Systematically optimize document performance based on analytics data. Identify trends, improve content strategy, and maximize engagement across all documents.",
  },
  {
    icon: Zap,
    title: "Real-Time Monitoring",
    description:
      "Monitor document activity in real-time with instant notifications and live analytics. Stay informed about document engagement as it happens.",
  },
];

const enterpriseCapabilities = [
  {
    title: "Simple & Reliable",
    description:
      "Handle thousands of documents and users with our reliable, cloud-hosted infrastructure.",
    icon: CheckCircle,
  },
  {
    title: "API Integration",
    description: "Integrate with your existing systems through our comprehensive API and webhooks.",
    icon: CheckCircle,
  },
  {
    title: "Custom Branding",
    description: "White-label the platform with your company branding and custom domain support.",
    icon: CheckCircle,
  },
  {
    title: "Compliance Ready",
    description:
      "Meet GDPR, HIPAA, and other regulatory requirements with built-in compliance features.",
    icon: CheckCircle,
  },
];

const workflowStages = [
  {
    step: "1",
    title: "Document Upload & Organization",
    description:
      "Upload documents to the system and organize them with custom categories, tags, and metadata for systematic management.",
  },
  {
    step: "2",
    title: "Tracking Configuration",
    description:
      "Configure tracking parameters, security settings, and access controls for each document or document group.",
  },
  {
    step: "3",
    title: "Distribution & Sharing",
    description:
      "Share documents through secure links, email campaigns, or direct integration with your existing communication systems.",
  },
  {
    step: "4",
    title: "Analytics & Monitoring",
    description:
      "Monitor real-time analytics, track engagement patterns, and generate comprehensive reports on document performance.",
  },
  {
    step: "5",
    title: "Optimization & Iteration",
    description:
      "Use analytics insights to optimize content, improve engagement, and refine your document strategy systematically.",
  },
];

const useCases = [
  {
    icon: "🏢",
    title: "Agencies & Growing Teams",
    description:
      "Manage compliance documents, track policy distribution, and monitor internal communication across growing teams.",
    color: "bg-blue-100",
    textColor: "text-blue-600",
  },
  {
    icon: "📊",
    title: "Marketing Teams",
    description:
      "Track campaign materials, monitor lead magnet performance, and optimize content strategy with systematic analytics.",
    color: "bg-green-100",
    textColor: "text-green-600",
  },
  {
    icon: "🎓",
    title: "Educational Institutions",
    description:
      "Manage course materials, track student engagement, and optimize educational content delivery across departments.",
    color: "bg-purple-100",
    textColor: "text-purple-600",
  },
  {
    icon: "⚖️",
    title: "Legal & Compliance",
    description:
      "Track legal document distribution, monitor compliance materials, and maintain audit trails for regulatory requirements.",
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
            Track your client documents with ease. Get powerful analytics without the complexity
            complexity. Perfect for consultants, solopreneurs, and small teams who need to
            understand document engagement.
          </p>
        </div>

        {/* Hero CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 mb-12 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            Start Using Our Document Tracking System Today
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Reliable platform • Systematic workflows • Bulk management • 500MB free storage
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
            {enterpriseCapabilities.map((capability, index) => (
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
            Perfect for Client Work & Small Teams
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
                  <td className="py-4 px-4 font-medium text-gray-900">Bulk Document Management</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center">
                      Included
                      <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">Limited</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-900">Systematic Analytics</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center">
                      Comprehensive
                      <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">Basic</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-900">Multi-User Access</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center">
                      Role-Based
                      <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">Single User</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-900">Workflow Automation</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center">
                      Advanced
                      <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">Manual</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-900">Security & Privacy</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center">
                      Bank-Level
                      <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">Basic</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium text-gray-900">API Integration</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center">
                      Full API
                      <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">Limited</td>
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
                Can I manage multiple documents at once?
              </h3>
              <p className="text-gray-600">
                Yes! PDFTrackr's document tracking system supports bulk operations. You can upload
                multiple documents, apply tracking settings across entire document sets, and manage
                them systematically from a single dashboard.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How does the systematic workflow work?
              </h3>
              <p className="text-gray-600">
                Our system follows a structured 5-stage workflow: upload and organize, configure
                tracking, distribute and share, monitor analytics, and optimize based on insights.
                This systematic approach ensures consistent document management across your
                organization.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can multiple team members access the system?
              </h3>
              <p className="text-gray-600">
                Absolutely! PDFTrackr supports multi-user access with role-based permissions. You
                can grant different access levels to team members, allowing collaboration while
                maintaining security and control over sensitive documents.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is the system suitable for growing teams and agencies?
              </h3>
              <p className="text-gray-600">
                Yes! PDFTrackr is built for growing teams with reliable infrastructure, API
                integration capabilities, custom branding options, and compliance-ready features.
                Our system can handle thousands of documents and users with industry-standard
                security.
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
            Join growing teams and agencies that trust PDFTrackr for their document tracking needs.
            Get started with our systematic approach to document management and analytics.
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
