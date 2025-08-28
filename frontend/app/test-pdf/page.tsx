"use client";

import { initializePDFWorker } from "@/lib/pdf-worker";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export default function TestPDFPage() {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPdf, setCurrentPdf] = useState<string>("mozilla");

  // Test PDF URL - a local test PDF
  const testPdfUrl = "/test.pdf";

  // Alternative: Simple base64 encoded PDF (1 page with "Hello World")
  const simplePdfBase64 =
    "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8DQoxIDAgb2JqDQo8PA0KL1R5cGUgL0NhdGFsb2cNCi9QYWdlcyAyIDAgUg0KPj4NCmVuZG9iag0KMiAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDENCi9LaWRzIFsgMyAwIFIgXQ0KPj4NCmVuZG9iag0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDIgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDQgMCBSDQo+Pg0KPj4NCi9NZWRpYUJveCBbIDAgMCA2MTIgNzkyIF0NCi9Db250ZW50cyA1IDAgUg0KPj4NCmVuZG9iag0KNCAwIG9iag0KPDwNCi9UeXBlIC9Gb250DQovU3VidHlwZSAvVHlwZTENCi9CYXNlRm9udCAvSGVsdmV0aWNhDQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZw0KPj4NCmVuZG9iag0KNSAwIG9iag0KPDwNCi9MZW5ndGggMzQNCj4+DQpzdHJlYW0NCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8gV29ybGQpIFRqCkVUCmVuZG9iag0KeHJlZg0KMCA2DQowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMTAgMDAwMDAgbg0KMDAwMDAwMDA3OSAwMDAwMCBuDQowMDAwMDAwMTczIDAwMDAwIG4NCjAwMDAwMDAzMDEgMDAwMDAgbg0KMDAwMDAwMDM4MCAwMDAwMCBuDQp0cmFpbGVyDQo8PA0KL1NpemUgNg0KL1Jvb3QgMSAwIFINCj4+DQpzdGFydHhyZWYNCjQ5Mg0KJSVFT0Y=";

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    console.log("PDF loaded successfully with", numPages, "pages");
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    setError(error.message);
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">PDF Test Page</h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setCurrentPdf("mozilla")}
                className={`px-3 py-1 rounded ${
                  currentPdf === "mozilla" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
              >
                Mozilla PDF
              </button>
              <button
                onClick={() => setCurrentPdf("base64")}
                className={`px-3 py-1 rounded ${
                  currentPdf === "base64" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
              >
                Base64 PDF
              </button>
            </div>

            <p className="text-gray-600 mb-2">
              Testing PDF loading with:{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {currentPdf === "mozilla" ? testPdfUrl : "Base64 encoded PDF"}
              </code>
            </p>

            {loading && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Loading PDF...</span>
              </div>
            )}

            {error && (
              <div className="text-red-600 bg-red-50 p-3 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          <div className="flex justify-center mb-4">
            <Document
              file={currentPdf === "mozilla" ? testPdfUrl : simplePdfBase64}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Loading PDF...</span>
                </div>
              }
              error={
                <div className="text-red-600">
                  Failed to load PDF. Please check the console for details.
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                width={800}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>

          {numPages > 0 && (
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="text-gray-600">
                Page {pageNumber} of {numPages}
              </span>

              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>PDF.js Version:</strong> {pdfjs.version}
            </p>
            <p>
              <strong>Worker Source:</strong> {pdfjs.GlobalWorkerOptions.workerSrc}
            </p>
            <p>
              <strong>Number of Pages:</strong> {numPages}
            </p>
            <p>
              <strong>Current Page:</strong> {pageNumber}
            </p>
            <p>
              <strong>Loading:</strong> {loading ? "Yes" : "No"}
            </p>
            <p>
              <strong>Error:</strong> {error || "None"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
