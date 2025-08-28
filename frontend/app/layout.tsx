import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
        url: "/logo.png",
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
    images: ["/logo.png"],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX"}', {
                  page_title: document.title,
                  page_location: window.location.href,
                });
              `,
            }}
          />
        </head>
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
