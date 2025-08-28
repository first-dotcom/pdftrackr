import { NextResponse } from "next/server";
import { pdfjs } from "react-pdf";

/**
 * Health check endpoint for PDF viewing functionality
 * Tests PDF.js worker initialization
 */
export async function GET() {
  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      service: "pdf-viewer",
      status: "unknown",
      details: {} as any,
    };

    // Test PDF.js version
    healthCheck.details.pdfjsVersion = pdfjs.version;

    // Test worker URLs
    const workerUrls = [
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
      `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
    ];

    const urlTests = await Promise.allSettled(
      workerUrls.map(async (url) => {
        try {
          const response = await fetch(url, {
            method: "HEAD",
            signal: AbortSignal.timeout(5000), // 5s timeout
          });
          return { url, status: response.status, ok: response.ok };
        } catch (error) {
          return { url, status: 0, ok: false, error: (error as Error).message };
        }
      }),
    );

    healthCheck.details.workerUrls = urlTests.map((result, index) => ({
      url: workerUrls[index],
      accessible: result.status === "fulfilled" && result.value.ok,
      details: result.status === "fulfilled" ? result.value : result.reason,
    }));

    // Determine overall status
    const anyWorkerAccessible = healthCheck.details.workerUrls.some((url: any) => url.accessible);
    healthCheck.status = anyWorkerAccessible ? "healthy" : "unhealthy";

    return NextResponse.json(healthCheck, {
      status: anyWorkerAccessible ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        service: "pdf-viewer",
        status: "error",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
