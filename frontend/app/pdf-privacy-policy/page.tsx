import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Privacy Policy - Secure Document Sharing & GDPR Compliance",
  description: "PDFTrackr's privacy policy ensures your documents and data remain secure when sharing PDFs online. Our GDPR-compliant platform protects your privacy while providing powerful PDF analytics and tracking features.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PdfPrivacyPolicyPage() {
  redirect("/privacy");
}
