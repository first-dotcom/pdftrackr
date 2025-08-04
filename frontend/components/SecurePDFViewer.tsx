"use client";

import { config } from "@/lib/config";
import { ChevronLeft, ChevronRight, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SecurePDFViewerProps {
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

interface WatermarkOverlayProps {
  email: string;
  timestamp: string;
}

const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({ email, timestamp }) => (
  <div
    className="absolute top-4 right-4 bg-black bg-opacity-20 text-white px-3 py-1 rounded text-sm font-mono pointer-events-none z-10"
    style={{
      fontSize: "12px",
      opacity: 0.7,
      userSelect: "none",
      WebkitUserSelect: "none",
      MozUserSelect: "none",
      msUserSelect: "none",
    }}
  >
    <div>{email}</div>
    <div>{new Date(timestamp).toLocaleString()}</div>
  </div>
);

export default function SecurePDFViewer({
  shareId,
  sessionId,
  password,
  email,
  watermarkEmail,
  watermarkTime,
  downloadEnabled = false,
  onError,
  onLoadSuccess,
}: SecurePDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  // Construct secure PDF URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (sessionId) params.append("session", sessionId);
    if (password) params.append("password", password);
    if (email) params.append("email", email);

    const url = `${config.api.url}/api/share/${shareId}/view?${params.toString()}`;
    setPdfUrl(url);
  }, [shareId, sessionId, password, email]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    onLoadSuccess?.();
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    setLoading(false);
    onError?.("Failed to load PDF. Please check your access permissions.");
  };

  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  }, []);

  const rotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Disable browser shortcuts and right-click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable common download/print shortcuts
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "s" || e.key === "p" || e.key === "S" || e.key === "P")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Disable F12, Ctrl+Shift+I (Dev Tools)
      if (e.key === "F12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  // Disable text selection and drag
  const preventSelection = {
    userSelect: "none" as const,
    WebkitUserSelect: "none" as const,
    MozUserSelect: "none" as const,
    msUserSelect: "none" as const,
    WebkitTouchCallout: "none" as const,
    WebkitUserDrag: "none" as const,
    KhtmlUserSelect: "none" as const,
    MozUserDrag: "none" as const,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <div className="ml-4 text-lg">Loading PDF...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" style={preventSelection}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm text-gray-600">
            Page {pageNumber} of {numPages}
          </span>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={zoomOut} className="p-2 rounded hover:bg-gray-100" title="Zoom Out">
            <ZoomOut className="w-5 h-5" />
          </button>

          <span className="text-sm text-gray-600 min-w-16 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button onClick={zoomIn} className="p-2 rounded hover:bg-gray-100" title="Zoom In">
            <ZoomIn className="w-5 h-5" />
          </button>

          <button onClick={rotate} className="p-2 rounded hover:bg-gray-100" title="Rotate">
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="flex justify-center p-4 relative">
        {watermarkEmail && watermarkTime && (
          <WatermarkOverlay email={watermarkEmail} timestamp={watermarkTime} />
        )}

        <div
          className="shadow-lg bg-white"
          style={preventSelection}
          onDragStart={(e) => e.preventDefault()}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading PDF...</span>
              </div>
            }
            error={
              <div className="flex items-center justify-center p-8 text-red-600">
                <span>Failed to load PDF. Please check your access permissions.</span>
              </div>
            }
            options={{
              // Disable worker console warnings
              verbosity: 0,
              // Disable automatic PDF.js viewer UI
              disableAutoFetch: false,
              disableStream: false,
              disableRange: false,
            }}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={
                <div className="flex items-center justify-center h-96 w-full bg-gray-50">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              }
              error={
                <div className="flex items-center justify-center h-96 w-full bg-gray-50 text-red-600">
                  <span>Error loading page {pageNumber}</span>
                </div>
              }
              onLoadError={(error) => {
                console.error(`Error loading page ${pageNumber}:`, error);
              }}
            />
          </Document>
        </div>
      </div>

      {/* Security Notice */}
      {!downloadEnabled && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded text-sm">
          🔒 Download disabled for security
        </div>
      )}

      {/* CSS to hide PDF.js built-in controls */}
      <style jsx global>{`
        .react-pdf__Page__canvas {
          max-width: 100% !important;
          height: auto !important; 
        }
        
        /* Disable text selection */
        .react-pdf__Page__textContent {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }
        
        /* Hide PDF.js annotation layer that might contain download links */
        .react-pdf__Page__annotations {
          display: none !important;
        }
        
        /* Disable drag and drop */
        .react-pdf__Document, .react-pdf__Page {
          -webkit-user-drag: none !important;
          -moz-user-drag: none !important;
          user-drag: none !important;
        }
        
        /* Disable print media styles */
        @media print {
          body { display: none !important; }
        }
      `}</style>
    </div>
  );
}
