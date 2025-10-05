import { Metadata } from "next";
import DemoPageClient from "./DemoPageClient";

export const metadata: Metadata = {
  title: "PDFTrackr Demo - Try PDF Tracking for Free",
  description:
    "Experience PDFTrackr's powerful PDF tracking and analytics features with our interactive demo. See how to track PDF views, capture leads, and analyze engagement - no signup required.",
  keywords: [
    "PDF tracking demo",
    "PDF analytics demo",
    "document tracking demo",
    "PDF viewer analytics",
    "PDF engagement tracking",
  ],
  openGraph: {
    title: "PDFTrackr Demo - Try PDF Tracking for Free",
    description:
      "Experience PDFTrackr's powerful PDF tracking and analytics features with our interactive demo. See how to track PDF views, capture leads, and analyze engagement - no signup required.",
    type: "website",
    url: "/demo",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFTrackr Demo - Try PDF Tracking for Free",
    description:
      "Experience PDFTrackr's powerful PDF tracking and analytics features with our interactive demo. See how to track PDF views, capture leads, and analyze engagement - no signup required.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DemoPage() {
  return <DemoPageClient />;
}
