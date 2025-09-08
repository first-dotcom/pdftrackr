import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import FeedbackModal from "@/components/FeedbackModal";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "PDF Tracking & Analytics - Simple Document Sharing for Freelancers",
    template: "%s | PDFTrackr",
  },
  description:
    "Track who reads your PDFs with page-by-page insights and secure sharing. Built for freelancers and small teams. Free 500MB, no credit card.",
  keywords: [
    "PDF tracking",
    "PDF analytics",
    "secure PDF sharing",
    "PDF viewer tracking",
    "document analytics",
    "PDF engagement",
    "PDF security",
    "PDF password protection",
    "PDF email capture",
    "PDF link expiration",
    "PDF download control",
    "PDF watermarking",
    "PDF virus scanning",
    "GDPR compliant PDF tool",
    "PDF privacy policy",
    "PDF data rights",
  ],
  authors: [{ name: "PDFTrackr" }],
  creator: "PDFTrackr",
  publisher: "PDFTrackr",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://pdftrackr.com"),
  alternates: {
    canonical: "https://pdftrackr.com/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://pdftrackr.com",
    title: "PDF Tracking & Analytics - Simple Document Sharing for Freelancers",
    description:
      "Track who reads your PDFs with page-by-page insights and secure sharing. Built for freelancers and small teams. Free 500MB, no credit card.",
    siteName: "PDFTrackr",
    images: [
      {
        url: "https://pdftrackr.com/og-logo.png",
        width: 1200,
        height: 630,
        alt: "PDFTrackr - PDF Tracking and Analytics Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Tracking & Analytics - Simple Document Sharing for Freelancers",
    description:
      "Track who reads your PDFs with page-by-page insights and secure sharing. Built for freelancers and small teams. Free 500MB, no credit card.",
    images: ["https://pdftrackr.com/og-logo.png"],
    creator: "@pdftrackr",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "msvalidate.01": process.env.NEXT_PUBLIC_BING_WEBMASTER_VERIFY || "",
  },
};

// Organization Schema for Google Search Results
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "PDFTrackr",
  "url": "https://pdftrackr.com",
  "logo": "https://pdftrackr.com/logo.png",
  "description": "PDFTrackr provides professional PDF tracking and analytics to see who's reading your documents. Track PDF views, capture emails, and control access with our secure sharing platform.",
  "sameAs": [
    "https://twitter.com/pdftrackr"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "url": "https://pdftrackr.com"
  }
};

// SoftwareApplication Schema for LLM SEO
const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "PDFTrackr",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "description": "Professional PDF tracking and analytics platform for freelancers and small businesses. Track PDF views, capture emails, and control access with secure sharing.",
  "url": "https://pdftrackr.com",
  "author": {
    "@type": "Organization",
    "name": "PDFTrackr"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free PDF tracking with 500MB storage"
  },
  "featureList": [
    "PDF View Tracking",
    "Analytics Dashboard", 
    "Email Capture",
    "Geographic Data",
    "Device Information",
    "Secure Sharing",
    "Free Storage"
  ]
};

// Product Schema for LLM SEO
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "PDFTrackr",
  "description": "Professional PDF tracking and analytics platform for freelancers and small businesses. Track PDF views, capture emails, and control access with secure sharing.",
  "brand": {
    "@type": "Brand",
    "name": "PDFTrackr"
  },
  "category": "Document Management Software",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "description": "Free PDF tracking with 500MB storage"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "150"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* Organization Schema for Google Search Results */}
          <Script
            id="organization-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          />
          
          {/* SoftwareApplication Schema for LLM SEO */}
          <Script
            id="software-application-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
          />
          
          {/* Product Schema for LLM SEO */}
          <Script
            id="product-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
          />
          
          {/* Favicon Links - Following favicon generator instructions */}
          <link rel="icon" type="image/x-icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <meta name="msapplication-TileColor" content="#3B82F6" />
          <meta name="theme-color" content="#3B82F6" />
          
          {/* Google tag (gtag.js) */}
          <script async src="https://www.googletagmanager.com/gtag/js?id=G-0D0FQG4352"></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-0D0FQG4352');
              `,
            }}
          />
        </head>
        <body className={inter.className}>
          {children}
          <FeedbackModal />
        </body>
      </html>
    </ClerkProvider>
  );
}
