import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "PDF Data Rights - GDPR Compliance for Document Sharing",
  description:
    "Exercise your GDPR data rights for PDF documents shared through PDFTrackr. Request access, deletion, or export of your personal data and document analytics.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PdfDataRightsPage() {
  redirect("/data-rights");
}
