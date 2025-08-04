"use client";

import dynamic from "next/dynamic";
import LoadingSpinner from "./LoadingSpinner";

// Dynamically import the PDF viewer with no SSR
const SecurePDFViewer = dynamic(() => import("./SecurePDFViewer"), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading PDF viewer..." />,
});

// Re-export with the same interface
export interface SecurePDFViewerProps {
  shareId: string;
  sessionId?: string;
  password?: string;
  email?: string;
  watermarkEmail?: string;
  watermarkTime?: string;
  downloadEnabled?: boolean;
  onError?: (error: string) => void;
  onLoadSuccess?: () => void;
}

export default function SecurePDFViewerWrapper(props: SecurePDFViewerProps) {
  return <SecurePDFViewer {...props} />;
}