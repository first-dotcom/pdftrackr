import { ArrowLeft, BarChart3, CheckCircle, Clock, Cloud, Globe, Lock, Monitor, Shield, Smartphone, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import CTAButton from "@/components/CTAButton";
import LearnMoreSection from "@/components/LearnMoreSection";

export const metadata: Metadata = {
  title: "Track Documents Online - Simple Cloud Analytics for Freelancers",
  description:
    "Track documents online with ease. Affordable cloud analytics for freelancers—no complex setup, no big-company software required.",
  keywords: [
    "track documents online",
    "online document tracking",
    "cloud document analytics",
    "web-based document management",
    "online PDF tracking",
    "document tracking dashboard",
    "real-time document analytics",
    "cloud document system",
  ],
  openGraph: {
    title: "Track Documents Online - Simple Cloud Analytics for Freelancers",
    description:
      "Track documents online with ease. Affordable cloud analytics for freelancers—no complex setup, no big-company software required.",
    type: "website",
    url: "https://pdftrackr.com/track-documents-online",
    images: [{ url: "https://pdftrackr.com/og-logo.png", alt: "PDFTrackr — simple PDF tracking for freelancers" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://pdftrackr.com/og-logo.png"],
  },
  alternates: {
    canonical: "https://pdftrackr.com/track-documents-online",
  },
};

const features = [
  {
    icon: Cloud,
    title: "Cloud-Based Platform",
    description:
      "Access your document analytics from anywhere with our secure cloud platform. No software installation required - everything works through your web browser.",
  },
  {
    icon: Globe,
    title: "Real-Time Analytics",
    description:
      "Monitor document engagement in real-time with live updates. See who's viewing your documents, when they access them, and how they interact with content.",
  },
  {
    icon: Monitor,
    title: "Web Dashboard",
    description:
      "Manage all your documents through our intuitive web dashboard. Upload, share, and track documents with comprehensive analytics and reporting tools.",
  },
  {
    icon: Smartphone,
    title: "Cross-Device Access",
    description:
      "Access your document analytics on any device - desktop, tablet, or mobile. Our responsive design ensures optimal viewing and management from anywhere.",
  },
  {
    icon: Shield,
    title: "Secure Cloud Storage",
    description:
      "Your documents are stored securely in the cloud with industry-standard encryption. Automatic backups and virus scanning keep your data safe.",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description:
      "Your document tracking system is always available online. No downtime, no maintenance windows - track your documents whenever you need to.",
  },
  {
    icon: BarChart3,
    title: "Comprehensive Analytics",
    description:
      "Track document performance, user engagement, and analytics trends. View detailed insights on views, duration, geographic data, and page-by-page engagement.",
  },
  {
    icon: Lock,
    title: "Security Features",
    description:
      "Password protection, email gating, link expiration, and download controls. Every document is virus-scanned and encrypted for maximum security.",
  },
];

const benefits = [
  {
    title: "No Software Installation",
    description: "Access everything through your web browser - no downloads or installations required.",
    icon: CheckCircle,
  },
  {
    title: "Instant Setup",
    description: "Start tracking documents in minutes with our streamlined onboarding process.",
    icon: CheckCircle,
  },
  {
    title: "Automatic Updates",
    description: "Always have the latest features and security updates without manual intervention.",
    icon: CheckCircle,
  },
  {
    title: "Scalable Solution",
    description: "Grow your document tracking needs without worrying about infrastructure limitations.",
    icon: CheckCircle,
  },
];

const useCases = [
  {
    icon: "💼",
    title: "Freelancers & Consultants",
    description: "Track client document engagement, monitor proposal views, and understand which content resonates with your audience.",
    color: "bg-blue-100",
    textColor: "text-blue-600",
  },
  {
    icon: "📚",
    title: "Educators & Trainers",
    description: "Monitor student engagement with course materials and understand which content gets the most attention.",
    color: "bg-green-100",
    textColor: "text-green-600",
  },
  {
    icon: "🏢",
    title: "Small Business Owners",
    description: "Track marketing materials, monitor lead generation documents, and optimize content based on viewer engagement.",
    color: "bg-purple-100",
    textColor: "text-purple-600",
  },
  {
    icon: "📈",
    title: "Content Creators",
    description: "Monitor whitepaper performance, track lead magnet engagement, and optimize content strategy based on analytics.",
    color: "bg-orange-100",
    textColor: "text-orange-600",
  },
];

export default function TrackDocumentsOnlinePage() {
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
            Track Documents Online - Simple Cloud Analytics for Freelancers
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access your document insights from anywhere. No complex setup or expensive software needed. Perfect for freelancers who want to track client documents without the hassle.
          </p>
        </div>

        {/* Hero CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 mb-12 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Start Tracking Documents Online Today</h2>
          <p className="text-lg mb-6 opacity-90">
            Cloud-based platform • Real-time analytics • Cross-device access • 500MB free storage
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Get Started Free
            <Cloud className="ml-2 h-5 w-5" />
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything You Need to Track Documents Online
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  {React.createElement(feature.icon as React.ComponentType<any>, { className: "h-8 w-8 text-primary-600 mr-3" })}
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
            How Online Document Tracking Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload to Cloud</h3>
              <p className="text-gray-600">
                Upload your documents to our secure cloud platform. Files are automatically scanned for viruses and prepared for online tracking.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Online</h3>
              <p className="text-gray-600">
                Generate secure sharing links and distribute them to your audience. All access is tracked through our web-based system.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Monitor Analytics</h3>
              <p className="text-gray-600">
                Access real-time analytics through your web dashboard. Track views, engagement, and performance from any device, anywhere.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg p-8 mb-16 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose Online Document Tracking?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start">
                <benefit.icon className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Perfect for These Use Cases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm text-center">
                <div className={`${useCase.color} rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4`}>
                  <span className={`text-xl font-bold ${useCase.textColor}`}>{useCase.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{useCase.title}</h3>
                <p className="text-sm text-gray-600">{useCase.description}</p>
              </div>
            ))}
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
                Do I need to install any software?
              </h3>
              <p className="text-gray-600">
                No! PDFTrackr is completely web-based. You can access all features through your web browser on any device - no downloads or installations required.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I access my analytics from mobile devices?
              </h3>
              <p className="text-gray-600">
                Yes! Our web dashboard is fully responsive and works perfectly on smartphones, tablets, and desktop computers. Track your documents from anywhere.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How secure is the cloud platform?
              </h3>
              <p className="text-gray-600">
                PDFTrackr uses industry-standard security with TLS encryption, automatic virus scanning, and secure cloud infrastructure. Your documents are protected with the same security standards used by major corporations.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is the platform suitable for individual users?
              </h3>
              <p className="text-gray-600">
                Yes! PDFTrackr is designed specifically for individual users, freelancers, and small teams. The platform is simple to use and doesn't require technical expertise to get started.
              </p>
            </div>
          </div>
        </div>

        {/* Related Guides Section */}
        <LearnMoreSection 
          title="Learn More About Document Tracking"
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
              href: "/secure-pdf-sharing-guide",
              title: "Secure PDF Sharing Guide",
              description: "Learn best practices for secure document sharing and access control.",
              label: "Read Guide"
            }
          ]}
        />

        {/* Final CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Track Documents Online?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already tracking their documents online with PDFTrackr. Get started in minutes with no software installation required.
          </p>
          <CTAButton size="lg">
            Start Tracking Documents Online Now
          </CTAButton>
        </div>
      </div>
    </div>
  );
}

