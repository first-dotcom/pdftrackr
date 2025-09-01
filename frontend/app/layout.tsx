import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import FeedbackModal from "@/components/FeedbackModal";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "PDFTrackr - PDF Tracking & Analytics | Secure Document Sharing Platform",
    template: "%s | PDFTrackr",
  },
  description:
    "PDFTrackr provides professional PDF tracking and analytics to see who's reading your documents. Track PDF views, capture emails, and control access with our secure sharing platform. 500MB free storage, no credit card required.",
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
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://pdftrackr.com",
    title: "PDFTrackr - PDF Tracking & Analytics | Secure Document Sharing Platform",
    description:
      "Track PDF views, capture emails, and control access with our secure sharing platform. Professional PDF analytics with 500MB free storage.",
    siteName: "PDFTrackr",
    images: [
      {
        url: "https://pdftrackr.com/logo.png",
        width: 1200,
        height: 630,
        alt: "PDFTrackr - PDF Tracking and Analytics Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFTrackr - PDF Tracking & Analytics | Secure Document Sharing Platform",
    description:
      "Track PDF views, capture emails, and control access with our secure sharing platform. Professional PDF analytics with 500MB free storage.",
    images: ["https://pdftrackr.com/logo.png"],
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
