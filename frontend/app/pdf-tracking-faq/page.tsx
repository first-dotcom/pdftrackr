import { ArrowLeft, Clock, Download, Eye, HelpCircle, Mail, Shield } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import CTAButton from "@/components/CTAButton";
import LearnMoreSection from "@/components/LearnMoreSection";

export const metadata: Metadata = {
  title: "PDF Tracking FAQ - Common Questions About Document Analytics & Security",
  description:
    "Quick answers to PDF tracking questions. Simple, clear help for freelancers and small businesses—start tracking for free.",
  keywords: [
    "PDF tracking FAQ",
    "can a downloaded pdf be tracked",
    "can you see who has opened a pdf",
    "track pdf views",
    "PDF tracking questions",
    "PDF analytics FAQ",
    "document tracking privacy",
    "PDF security questions",
  ],
  openGraph: {
    title: "PDF Tracking FAQ - Common Questions About Document Analytics & Security",
    description:
      "Get instant answers to PDF tracking questions. Learn how to track PDF views, understand privacy concerns, and master document analytics. Free PDF tracking with no credit card required.",
    type: "article",
  },
};

const faqData = [
  {
    category: "PDF Tracking Basics",
    icon: Eye,
    questions: [
      {
        question: "Can a downloaded PDF be tracked?",
        answer:
          "Yes, PDFs can be tracked even after download, but it depends on the tracking method used. PDFTrackr uses link-based tracking, which means once someone downloads your PDF, you can still track when they access it through the original link. However, if they share the downloaded file directly, that activity won't be tracked. For maximum tracking, we recommend using view-only mode to prevent downloads.",
      },
      {
        question: "Can you see who has opened a PDF?",
        answer:
          "Yes, with PDFTrackr you can see detailed information about who has opened your PDFs. Our platform tracks viewer email addresses (when email gating is enabled), geographic location, device information, and viewing patterns. You'll know exactly who accessed your documents, when they viewed them, and how long they spent reading.",
      },
      {
        question: "How does PDF tracking work?",
        answer:
          "PDFTrackr uses secure link-based tracking. When you upload a PDF, we create a unique, secure URL that viewers access instead of downloading the file directly. This allows us to track views, engagement time, geographic location, and other analytics while keeping your document secure and protected.",
      },
      {
        question: "Is PDF tracking legal and ethical?",
        answer:
          "Yes, PDF tracking is legal when done transparently and ethically. PDFTrackr is GDPR-compliant and requires explicit consent for analytics tracking. We recommend informing recipients about tracking in your privacy policy and obtaining consent where required by law. Our platform includes built-in privacy controls and data retention policies.",
      },
    ],
  },
  {
    category: "Security & Privacy",
    icon: Shield,
    questions: [
      {
        question: "How secure is PDF tracking?",
        answer:
          "PDFTrackr provides enterprise-grade security for your documents. All data is encrypted using TLS/SSL protocols, files are virus-scanned automatically, and we implement strict access controls. Your documents are stored in secure cloud infrastructure with regular security audits and compliance with industry standards.",
      },
      {
        question: "Can PDF tracking be detected by viewers?",
        answer:
          "PDFTrackr's tracking is designed to be transparent and user-friendly. While viewers can see that they're accessing a secure link, the tracking itself is seamless and doesn't interfere with their reading experience. We believe in ethical tracking that respects user privacy while providing valuable insights.",
      },
      {
        question: "What data is collected during PDF tracking?",
        answer:
          "PDFTrackr collects essential analytics data including view counts, session duration, geographic location (country level), device information, and email addresses (when consent is given). We do not collect personal information beyond what's necessary for analytics and security purposes.",
      },
      {
        question: "How long is tracking data retained?",
        answer:
          "PDFTrackr automatically deletes analytics data after 26 months, session data after 30 days, and email captures after 12 months. Our automated cleanup system ensures compliance with data retention policies and privacy regulations.",
      },
    ],
  },
  {
    category: "Features & Capabilities",
    icon: Download,
    questions: [
      {
        question: "What analytics can I see with PDF tracking?",
        answer:
          "PDFTrackr provides comprehensive analytics including total views, unique visitors, average session duration, page-by-page engagement, geographic distribution, device and browser information, and completion rates. You can export this data for further analysis and reporting.",
      },
      {
        question: "Can I control who downloads my PDFs?",
        answer:
          "Yes, PDFTrackr offers download control features. You can set documents to view-only mode, preventing downloads entirely, or allow downloads while still tracking access. This gives you complete control over how your documents are shared and accessed.",
      },
      {
        question: "Does PDF tracking work offline?",
        answer:
          "PDFTrackr's tracking works when viewers access your documents through our secure links. If someone downloads a PDF and views it offline, that activity won't be tracked. For maximum tracking coverage, we recommend using view-only mode and encouraging viewers to access documents through the provided links.",
      },
      {
        question: "Can I set expiration dates for PDF access?",
        answer:
          "Yes, PDFTrackr allows you to set custom expiration dates for your document links. Once expired, the link becomes inactive and viewers can no longer access the document. This is perfect for time-sensitive content or temporary access requirements.",
      },
    ],
  },
  {
    category: "Email Capture & Lead Generation",
    icon: Mail,
    questions: [
      {
        question: "How does email capture work with PDF tracking?",
        answer:
          "PDFTrackr's email gating feature requires viewers to provide their email address before accessing your document. This is perfect for lead generation and building your email list. The email capture is GDPR-compliant and includes consent management features.",
      },
      {
        question: "Can I integrate PDF tracking with my CRM?",
        answer:
          "Yes, PDFTrackr provides export capabilities that allow you to integrate tracking data with your existing CRM systems. You can export viewer information, engagement metrics, and lead data to streamline your sales and marketing processes.",
      },
      {
        question: "Is email capture mandatory for PDF access?",
        answer:
          "No, email capture is optional. You can choose to enable or disable email gating based on your needs. When enabled, viewers must provide an email address. When disabled, viewers can access documents directly without providing contact information.",
      },
    ],
  },
  {
    category: "Pricing & Plans",
    icon: Clock,
    questions: [
      {
        question: "Is PDF tracking free?",
        answer:
          "Yes! PDFTrackr offers a generous free plan with 500MB storage, basic tracking features, and essential analytics. No credit card is required to get started. For advanced features and higher storage limits, we offer Pro plans starting Q4 2025.",
      },
      {
        question: "What's included in the free plan?",
        answer:
          "Our free plan includes 500MB storage, password protection, email capture, basic analytics, virus scanning, and GDPR compliance. You can track unlimited documents and get started immediately without any payment information.",
      },
      {
        question: "When will Pro plans be available?",
        answer:
          "PDFTrackr Pro plans will launch in Q4 2025 with advanced features including unlimited storage, priority support, advanced analytics, custom branding, and API access. Join our waitlist to be notified when Pro plans become available.",
      },
    ],
  },
];

export default function FAQPage() {
  // FAQ Schema structured data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Can a downloaded PDF be tracked?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, PDFs can be tracked even after download, but it depends on the tracking method used. PDFTrackr uses link-based tracking, which means once someone downloads your PDF, you can still track when they access it through the original link. However, if they share the downloaded file directly, that activity won't be tracked. For maximum tracking, we recommend using view-only mode to prevent downloads."
        }
      },
      {
        "@type": "Question",
        "name": "Can you see who has opened a PDF?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, with PDFTrackr you can see detailed information about who has opened your PDFs. Our platform tracks viewer email addresses (when email gating is enabled), geographic location, device information, and viewing patterns. You'll know exactly who accessed your documents, when they viewed them, and how long they spent reading."
        }
      },
      {
        "@type": "Question",
        "name": "How does PDF tracking work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "PDFTrackr uses secure link-based tracking. When you upload a PDF, we create a unique, secure URL that viewers access instead of downloading the file directly. This allows us to track views, engagement time, geographic location, and other analytics while keeping your document secure and protected."
        }
      },
      {
        "@type": "Question",
        "name": "Is PDF tracking legal and ethical?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, PDF tracking is legal when done transparently and ethically. PDFTrackr is GDPR-compliant and requires explicit consent for analytics tracking. We recommend informing recipients about tracking in your privacy policy and obtaining consent where required by law. Our platform includes built-in privacy controls and data retention policies."
        }
      },
      {
        "@type": "Question",
        "name": "How secure is PDF tracking?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "PDFTrackr provides enterprise-grade security for your documents. All data is encrypted using TLS/SSL protocols, files are virus-scanned automatically, and we implement strict access controls. Your documents are stored in secure cloud infrastructure with regular security audits and compliance with industry standards."
        }
      },
      {
        "@type": "Question",
        "name": "What analytics can I see with PDF tracking?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "PDFTrackr provides comprehensive analytics including total views, unique visitors, average session duration, page-by-page engagement, geographic distribution, device and browser information, and completion rates. You can export this data for further analysis and reporting."
        }
      },
      {
        "@type": "Question",
        "name": "How does email capture work with PDF tracking?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "PDFTrackr's email gating feature requires viewers to provide their email address before accessing your document. This is perfect for lead generation and building your email list. The email capture is GDPR-compliant and includes consent management features."
        }
      },
      {
        "@type": "Question",
        "name": "Is PDF tracking free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! PDFTrackr offers a generous free plan with 500MB storage, basic tracking features, and essential analytics. No credit card is required to get started. For advanced features and higher storage limits, we offer Pro plans starting Q4 2025."
        }
      },
      {
        "@type": "Question",
        "name": "What's included in the free plan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our free plan includes 500MB storage, password protection, email capture, basic analytics, virus scanning, and GDPR compliance. You can track unlimited documents and get started immediately without any payment information."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* FAQ Schema structured data */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
            PDF Tracking FAQ - Common Questions About Document Analytics & Security
          </h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-600 mb-8">
              Get answers to the most common questions about PDF tracking, document analytics, and
              secure sharing. Learn how PDFTrackr works, understand privacy considerations, and
              discover best practices for document security.
            </p>

            <div className="space-y-12">
              {faqData.map((category, categoryIndex) => (
                <div key={categoryIndex} className="border-b border-gray-200 pb-8">
                  <div className="flex items-center mb-6">
                    <category.icon className="h-6 w-6 text-primary-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">{category.category}</h2>
                  </div>

                  <div className="space-y-6">
                    {category.questions.map((item, questionIndex) => (
                      <div key={questionIndex} className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-start">
                          <HelpCircle className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                          {item.question}
                        </h3>
                        <p className="text-gray-600 ml-7">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

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
                  href: "/free-pdf-tracking",
                  title: "Free PDF Tracking",
                  description: "Start tracking PDFs for free with 500MB storage and no credit card required.",
                  label: "Learn More"
                }
              ]}
            />

            {/* Final CTA */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Ready to Start Tracking PDFs?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Get started with PDFTrackr's PDF tracking features. Free 500MB storage, no credit card required.
              </p>
              <CTAButton size="lg">
                Start PDF Tracking Now
              </CTAButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
