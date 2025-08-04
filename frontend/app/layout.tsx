import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import type React from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport = "width=device-width, initial-scale=1";

export const metadata = {
  title: "PDFTrackr - Secure PDF Sharing & Analytics",
  description:
    "Upload PDFs, generate secure smart links, and track viewer analytics with comprehensive insights.",
  keywords: "pdf, sharing, analytics, tracking, secure, documents",
  author: "PDFTrackr",
  robots: "index, follow",
  openGraph: {
    title: "PDFTrackr - Secure PDF Sharing & Analytics",
    description:
      "Upload PDFs, generate secure smart links, and track viewer analytics with comprehensive insights.",
    url: "https://pdftrackr.com",
    siteName: "PDFTrackr",
    images: [
      {
        url: "https://pdftrackr.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PDFTrackr - Secure PDF Sharing & Analytics Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFTrackr - Secure PDF Sharing & Analytics",
    description:
      "Upload PDFs, generate secure smart links, and track viewer analytics with comprehensive insights.",
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
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-gray-50">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
