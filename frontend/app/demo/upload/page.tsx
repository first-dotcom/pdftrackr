import { Metadata } from "next";
import DemoUploadPageClient from "./DemoUploadPageClient";

export const metadata: Metadata = {
  title: "PDF Upload Demo - Try PDFTrackr Upload Process",
  description:
    "Experience PDFTrackr's secure PDF upload process with our interactive demo. See how easy it is to upload and share PDFs with tracking capabilities - no signup required.",
  keywords: [
    "PDF upload demo",
    "document upload demo",
    "PDF sharing demo",
    "secure PDF upload",
    "PDF file upload",
  ],
  openGraph: {
    title: "PDF Upload Demo - Try PDFTrackr Upload Process",
    description:
      "Experience PDFTrackr's secure PDF upload process with our interactive demo. See how easy it is to upload and share PDFs with tracking capabilities - no signup required.",
    type: "website",
    url: "/demo/upload",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Upload Demo - Try PDFTrackr Upload Process",
    description:
      "Experience PDFTrackr's secure PDF upload process with our interactive demo. See how easy it is to upload and share PDFs with tracking capabilities - no signup required.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DemoUploadPage() {
  return <DemoUploadPageClient />;
}

