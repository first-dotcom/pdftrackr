import { Metadata } from "next";
import DemoFilePageClient from "./DemoFilePageClient";

export const metadata: Metadata = {
  title: "PDF Analytics Demo - View PDF Tracking Analytics",
  description:
    "Explore PDFTrackr's detailed analytics dashboard with our interactive demo. See real-time PDF view tracking, engagement metrics, and lead capture analytics - no signup required.",
  keywords: [
    "PDF analytics demo",
    "PDF tracking analytics",
    "document analytics demo",
    "PDF engagement metrics",
    "PDF viewer analytics",
  ],
  openGraph: {
    title: "PDF Analytics Demo - View PDF Tracking Analytics",
    description:
      "Explore PDFTrackr's detailed analytics dashboard with our interactive demo. See real-time PDF view tracking, engagement metrics, and lead capture analytics - no signup required.",
    type: "website",
    url: "/demo/files",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Analytics Demo - View PDF Tracking Analytics",
    description:
      "Explore PDFTrackr's detailed analytics dashboard with our interactive demo. See real-time PDF view tracking, engagement metrics, and lead capture analytics - no signup required.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DemoFilePage() {
  return <DemoFilePageClient />;
}