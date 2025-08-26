import { ClerkProvider } from "@clerk/nextjs";
import type React from "react";
import "./globals.css";
import ConsentBanner from "@/components/ConsentBanner";
import AnalyticsPageTracker from "@/components/AnalyticsPageTracker";
import FeedbackModal from "@/components/FeedbackModal";

// Use Tailwind's font-sans (configured to prefer Inter if available, then system fonts)

export const viewport = "width=device-width, initial-scale=1";

export const metadata = {
  title: "PDFTrackr - Track PDF Views & Analytics | Free Secure Document Sharing",
  description: "Share PDFs securely and track who views them. Get page-by-page analytics, capture emails, control downloads. 500MB free storage. No credit card required.",
  keywords: "secure PDF sharing, PDF link analytics, track PDF views, password-protected PDFs, share PDFs with analytics, email-gated PDF access, watermarked PDF viewing, link expiration for PDFs, document engagement analytics, GDPR compliant PDF sharing",
  author: "PDFTrackr",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/logo.png', type: 'image/png', sizes: '32x32' }
    ],
    apple: '/logo.png',
    shortcut: '/favicon.ico'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "PDFTrackr - Track PDF Views & Analytics | Free Secure Document Sharing",
    description: "Share PDFs securely and track who views them. Get page-by-page analytics, capture emails, control downloads. 500MB free storage. No credit card required.",
    url: "https://pdftrackr.com",
    siteName: "PDFTrackr",
    images: [
      {
        url: "https://pdftrackr.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PDFTrackr - Track PDF Views & Analytics | Free Secure Document Sharing",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFTrackr - Track PDF Views & Analytics | Free Secure Document Sharing",
    description: "Share PDFs securely and track who views them. Get page-by-page analytics, capture emails, control downloads. 500MB free storage. No credit card required.",
    images: ["https://pdftrackr.com/og-image.jpg"],
    creator: "@pdftrackr",
  },
  alternates: {
    canonical: "https://pdftrackr.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "PDFTrackr",
    "description": "Share PDFs securely and track who views them. Get page-by-page analytics, capture emails, control downloads. 500MB free storage. No credit card required.",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free plan with 500MB storage, password protection, email capture, live analytics, GDPR compliance, and virus scanning"
    },
    "featureList": [
      "500MB free storage",
      "Password-protected sharing",
      "Email capture",
      "Live analytics",
      "GDPR compliant",
      "Virus scanning"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127"
    }
  };

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link
            rel="preconnect"
            href="https://fonts.googleapis.com"
            crossOrigin="anonymous"
          />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
          {/* Google tag (gtag.js) */}
          <script async src="https://www.googletagmanager.com/gtag/js?id=G-0D0FQG4352"></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                
                // Initialize with consent mode - analytics disabled by default
                gtag('consent', 'default', {
                  'analytics_storage': 'denied',
                  'ad_storage': 'denied'
                });
                
                // Configure GA4 with consent mode
                gtag('config', 'G-0D0FQG4352', {
                  'consent_mode': 'advanced'
                });
                
                // Configure Google Ads
                gtag('config', 'AW-17505541054');
              `,
            }}
          />
        </head>
        <body className="font-sans">
          <div className="min-h-screen bg-gray-50">{children}</div>
          <AnalyticsPageTracker />
          <ConsentBanner />
          <FeedbackModal />
        </body>
      </html>
    </ClerkProvider>
  );
}
