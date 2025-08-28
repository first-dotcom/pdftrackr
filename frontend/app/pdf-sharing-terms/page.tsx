import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "PDF Sharing Terms of Service - Document Tracking & Analytics",
  description:
    "PDFTrackr's terms of service govern the secure sharing and tracking of PDF documents. Our platform provides professional PDF analytics while ensuring legal compliance and user protection.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PdfSharingTermsPage() {
  redirect("/terms");
}
