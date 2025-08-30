"use client";

import { apiClient } from "@/lib/api-client";
import { config } from "@/lib/config";
import { ChevronLeft, ChevronRight, Download, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";


// Set up PDF.js worker (same as test page)
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

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

// 📊 ANALYTICS TRACKING INTERFACES
interface SessionData {
  startTime: number;
  pagesViewed: Set<number>;
  maxPageReached: number;
  totalPages: number;
}

// Add new state for tracking
interface PageTrackingData {
  pageStartTime: number;
}

const WatermarkOverlay = ({ email, timestamp }: { email: string; timestamp: string }) => (
  <div className="absolute top-4 right-4 bg-black bg-opacity-20 text-white px-3 py-1 rounded text-sm font-mono pointer-events-none z-10">
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
  const [workerError, setWorkerError] = useState<string | null>(null);

  // 📊 ANALYTICS TRACKING STATE
  const [sessionData, setSessionData] = useState<SessionData>({
    startTime: Date.now(),
    pagesViewed: new Set([1]),
    maxPageReached: 1,
    totalPages: 0,
  });

  // 📊 NEW: Page tracking state
  const [pageTracking, setPageTracking] = useState<PageTrackingData>({
    pageStartTime: Date.now(),
  });

  // 📊 NEW: Activity tracking state
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [isUserActive, setIsUserActive] = useState<boolean>(true);
  const [sessionEndTracked, setSessionEndTracked] = useState<boolean>(false);

  // 📊 NEW: Enhanced activity tracking function
  const trackUserActivity = useCallback(() => {
    const now = Date.now();
    setLastActivityTime(now);
    setIsUserActive(true);

    // Send activity heartbeat more frequently
    if (sessionId) {
      apiClient.analytics
        .updateSessionActivity({
          sessionId,
          lastActiveAt: new Date().toISOString(),
          currentPage: pageNumber,
        })
        .catch((error) => {
          console.warn("Activity heartbeat failed:", error);
        });
    }
  }, [sessionId, pageNumber]);

  // 📊 NEW: Reset tracking data on page change
  useEffect(() => {
    console.log("Page changed to:", pageNumber, "Resetting page tracking");
    setPageTracking({
      pageStartTime: Date.now(),
    });
  }, [pageNumber]);

  // 📊 Debug session data changes
  useEffect(() => {
    console.log("Session data updated:", {
      pagesViewed: Array.from(sessionData.pagesViewed),
      maxPageReached: sessionData.maxPageReached,
      totalPages: sessionData.totalPages,
    });
  }, [sessionData]);

  // 📊 NEW: Real-time activity monitoring
  useEffect(() => {
    const events = ["scroll", "mousemove", "click", "keypress"];

    events.forEach((event) => {
      document.addEventListener(event, trackUserActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, trackUserActivity);
      });
    };
  }, [trackUserActivity]);

  // 📊 ANALYTICS FUNCTIONS
  // Session is already created on backend when share link is accessed
  // No need to create another session here

  // 📊 ANALYTICS DATA PERSISTENCE UTILITIES
  const ANALYTICS_STORAGE_KEY = "pdftrackr:failed-analytics";
  const MAX_RETRY_ATTEMPTS = 5;
  const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

  // Store failed analytics data locally for later retry
  const storeFailedAnalytics = useCallback((data: any, type: "pageView" | "sessionEnd") => {
    try {
      const existing = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      const failedData = existing ? JSON.parse(existing) : [];

      const newEntry = {
        id: Date.now() + Math.random(), // Unique ID
        type,
        data,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        maxRetries: MAX_RETRY_ATTEMPTS,
      };

      failedData.push(newEntry);

      // Keep only last 50 failed entries to prevent storage bloat
      if (failedData.length > 50) {
        failedData.splice(0, failedData.length - 50);
      }

      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(failedData));
      console.warn(`Analytics data stored locally for retry: ${type}`, newEntry);
    } catch (error) {
      console.error("Failed to store analytics data locally:", error);
    }
  }, []);

  // Retry failed analytics data
  const retryFailedAnalytics = useCallback(async () => {
    try {
      const existing = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (!existing) return;

      const failedData = JSON.parse(existing);
      if (failedData.length === 0) return;

      const successfulRetries: number[] = [];

      for (const entry of failedData) {
        if (entry.retryCount >= entry.maxRetries) {
          console.warn(`Analytics data exceeded max retries, dropping: ${entry.type}`, entry);
          successfulRetries.push(entry.id);
          continue;
        }

        try {
          if (entry.type === "pageView") {
            await apiClient.analytics.trackPageView(entry.data);
          } else if (entry.type === "sessionEnd") {
            await apiClient.analytics.trackSessionEnd(entry.data);
          }

          successfulRetries.push(entry.id);
          console.log(`Successfully retried analytics data: ${entry.type}`, entry);
        } catch (error) {
          entry.retryCount++;
          console.warn(
            `Retry failed for analytics data: ${entry.type} (attempt ${entry.retryCount})`,
            error,
          );
        }
      }

      // Remove successful retries from storage
      if (successfulRetries.length > 0) {
        const remainingData = failedData.filter(
          (entry: any) => !successfulRetries.includes(entry.id),
        );
        localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(remainingData));
      }
    } catch (error) {
      console.error("Failed to retry analytics data:", error);
    }
  }, [apiClient]);

  // Enhanced retry logic with exponential backoff
  const retryWithBackoff = useCallback(
    async (operation: () => Promise<any>, retryCount = 0, context = "unknown"): Promise<any> => {
      try {
        return await operation();
      } catch (error) {
        console.warn(`${context} failed (attempt ${retryCount + 1}):`, error);

        if (retryCount < MAX_RETRY_ATTEMPTS - 1) {
          const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
          console.log(`Retrying ${context} in ${delay}ms...`);

          await new Promise((resolve) => setTimeout(resolve, delay));
          return retryWithBackoff(operation, retryCount + 1, context);
        } else {
          console.error(`${context} failed after ${MAX_RETRY_ATTEMPTS} attempts:`, error);
          throw error;
        }
      }
    },
    [],
  );

  const trackPageView = async (page: number, totalPages: number, isPageExit = false) => {
    // Validate parameters
    if (!page || page <= 0 || !totalPages || totalPages <= 0 || page > totalPages) {
      console.warn(`Invalid page view tracking parameters: page=${page}, totalPages=${totalPages}`);
      return;
    }

    if (!sessionId) {
      console.warn("No sessionId available for tracking");
      return;
    }

    if (!shareId) {
      console.warn("No shareId available for tracking");
      return;
    }

    // Track page views - file owners can always see their own analytics
    // Consent only affects whether we show analytics to viewers

    // Calculate page duration in milliseconds for sub-second precision
    const now = Date.now();
    const pageDuration = isPageExit
      ? Math.max(1, now - pageTracking.pageStartTime) // Exit: ms precision, min 1ms
      : 0; // Entry: 0ms duration

    // Update session data
    setSessionData((prev) => ({
      ...prev,
      pagesViewed: new Set([...prev.pagesViewed, page]),
      maxPageReached: Math.max(prev.maxPageReached, page),
    }));

    const pageViewData = {
      shareId,
      email,
      page,
      totalPages,
      sessionId,
      timestamp: new Date().toISOString(),
      duration: pageDuration,
      isPageExit, // Mark if this is a page exit
    };

    // Send analytics to backend with retry logic and local storage fallback
    try {
      await retryWithBackoff(
        () => apiClient.analytics.trackPageView(pageViewData),
        0,
        "Page view tracking",
      );
    } catch (error) {
      console.error("Page view tracking failed after all retries, storing locally:", error);
      storeFailedAnalytics(pageViewData, "pageView");
    }
  };

  const trackSessionEnd = useCallback(async (retryCount = 0) => {
    if (sessionEndTracked) {
      console.log("Session end already tracked, skipping");
      return;
    }

    const rawDurationSeconds = Math.round((Date.now() - sessionData.startTime) / 1000);

    // Quality filter: Only track sessions with meaningful engagement
    const minEngagementTime = 3; // 3 seconds minimum
    const minPagesViewed = 1; // At least 1 page viewed

    if (rawDurationSeconds < minEngagementTime || sessionData.pagesViewed.size < minPagesViewed) {
      console.log(
        `Session too short (${rawDurationSeconds}s) or no pages viewed (${sessionData.pagesViewed.size}), skipping session end tracking`,
      );
      setSessionEndTracked(true);
      return;
    }

    // Track exit from current page before ending session
    if (pageNumber > 0 && numPages > 0) {
      try {
        await trackPageView(pageNumber, numPages, true);
      } catch (error) {
        console.warn("Failed to track final page exit:", error);
      }
    }

    const sessionEndData = {
      shareId,
      email,
      sessionId,
      durationSeconds: rawDurationSeconds,
      pagesViewed: sessionData.pagesViewed.size,
      totalPages: sessionData.totalPages,
      maxPageReached: sessionData.maxPageReached,
      timestamp: new Date().toISOString(),
    };

    try {
      await retryWithBackoff(
        () => apiClient.analytics.trackSessionEnd(sessionEndData),
        0,
        "Session end tracking",
      );
      setSessionEndTracked(true);
      console.log("Session end tracked successfully");
    } catch (error) {
      console.error("Session end tracking failed after all retries, storing locally:", error);
      storeFailedAnalytics(sessionEndData, "sessionEnd");
      setSessionEndTracked(true);
    }
  }, [sessionData, pageNumber, numPages, shareId, email, sessionId, sessionEndTracked]);

  // Session is already created on backend when share link is accessed
  // No need to create another session here
  useEffect(() => {
    if (sessionId) {
      console.log("Session ready for tracking:", sessionId);
    }
  }, [sessionId]);

  // 📊 Retry failed analytics data on component mount
  useEffect(() => {
    if (sessionId) {
      // Retry any failed analytics data from previous sessions
      retryFailedAnalytics();
    }
  }, [sessionId, retryFailedAnalytics]);

  // 📊 NEW: Enhanced session end tracking with multiple strategies
  useEffect(() => {
    let hasTrackedEnd = false;

    // Strategy 1: beforeunload (most reliable for desktop)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasTrackedEnd && !sessionEndTracked) {
        hasTrackedEnd = true;
        // Use sendBeacon for more reliable delivery
        const sessionEndData = {
          shareId,
          email,
          sessionId,
          durationSeconds: Math.round((Date.now() - sessionData.startTime) / 1000),
          pagesViewed: sessionData.pagesViewed.size,
          totalPages: sessionData.totalPages,
          maxPageReached: sessionData.maxPageReached,
          timestamp: new Date().toISOString(),
        };
        
        // Try sendBeacon first (more reliable for page unload)
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(sessionEndData)], {
            type: 'application/json',
          });
          navigator.sendBeacon(`${config.api.url}/api/analytics/session-end`, blob);
        } else {
          // Fallback to synchronous tracking
          trackSessionEnd();
        }
      }
    };

    // Strategy 2: visibilitychange (good for mobile)
    const handleVisibilityChange = () => {
      if (document.hidden && !hasTrackedEnd && !sessionEndTracked) {
        hasTrackedEnd = true;
        trackSessionEnd();
      }
    };

    // Strategy 3: pagehide (more reliable than beforeunload on mobile)
    const handlePageHide = () => {
      if (!hasTrackedEnd && !sessionEndTracked) {
        hasTrackedEnd = true;
        trackSessionEnd();
      }
    };

    // Strategy 4: unload (fallback)
    const handleUnload = () => {
      if (!hasTrackedEnd && !sessionEndTracked) {
        hasTrackedEnd = true;
        trackSessionEnd();
      }
    };

    // Strategy 5: Periodic session end check (every 15 seconds)
    const interval = setInterval(() => {
      const currentDuration = Math.round((Date.now() - sessionData.startTime) / 1000);
      if (currentDuration > 15 && !hasTrackedEnd && !sessionEndTracked) {
        // Check if user has been inactive for too long
        const timeSinceLastActivity = Date.now() - lastActivityTime;
        if (timeSinceLastActivity > 60000) { // 1 minute of inactivity
          hasTrackedEnd = true;
          trackSessionEnd();
        }
      }
    }, 15000);

    // Add all event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("unload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("unload", handleUnload);
      clearInterval(interval);

      // Final attempt when component unmounts
      if (!hasTrackedEnd && !sessionEndTracked) {
        trackSessionEnd();
      }
    };
  }, [sessionData, trackSessionEnd, sessionEndTracked, lastActivityTime]);

  // Initialize PDF URL
  useEffect(() => {
    if (sessionId) {
      const params = new URLSearchParams();
      params.append("session", sessionId);
      if (password) params.append("password", password);
      if (email) params.append("email", email);

      const secureUrl = `${config.api.url}/api/share/${shareId}/view?${params.toString()}`;

      // Fetch the PDF URL from the backend
      fetch(secureUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.success && data.data?.pdfUrl) {
            setPdfUrl(data.data.pdfUrl);
            // Update download enabled state from the response
            if (data.data.downloadEnabled !== undefined) {
              // Note: downloadEnabled is now handled by the PDF viewer itself
              // The backend response includes the current permission state
            }
          } else {
            throw new Error(data.error || "Failed to get PDF URL");
          }
        })
        .catch((error) => {
          console.error("Failed to get PDF URL:", error);
          setWorkerError(error.message || "Failed to load PDF");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setWorkerError("No session provided for PDF access.");
      setLoading(false);
    }
  }, [shareId, sessionId, password, email]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log(`PDF loaded successfully with ${numPages} pages`);
    setNumPages(numPages);
    setLoading(false);

    // Update session data with total pages
    setSessionData((prev) => ({
      ...prev,
      totalPages: numPages,
    }));

            // Track initial page view
        trackPageView(1, numPages, false);

    onLoadSuccess?.();
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error);
    setLoading(false);
    onError?.(error.message);
  };

  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => {
      const newPage = Math.max(prev - 1, 1);
      if (newPage !== prev && numPages > 0) {
        // Track exit from current page with actual duration
        trackPageView(prev, numPages, true);
        // Track entry to new page
        setTimeout(() => trackPageView(newPage, numPages, false), 100);
      }
      return newPage;
    });
  }, [numPages, trackPageView]);

  const goToNextPage = useCallback(() => {
    if (numPages === 0) return;
    setPageNumber((prev) => {
      const newPage = Math.min(prev + 1, numPages);
      if (newPage !== prev) {
        // Track exit from current page with actual duration
        trackPageView(prev, numPages, true);
        // Track entry to new page
        setTimeout(() => trackPageView(newPage, numPages, false), 100);
      }
      return newPage;
    });
  }, [numPages, trackPageView]);

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
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "p")) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  if (workerError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ PDF Viewer Error</div>
          <div className="text-gray-700 mb-4">{workerError}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
        <div className="ml-4 text-lg">Loading PDF...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1 || numPages === 0}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm text-gray-600">
            Page {pageNumber} of {numPages || "?"}

          </span>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages || numPages === 0}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={zoomOut} className="p-2 rounded hover:bg-gray-100">
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600 min-w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button onClick={zoomIn} className="p-2 rounded hover:bg-gray-100">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={rotate} className="p-2 rounded hover:bg-gray-100">
            <RotateCw className="w-5 h-5" />
          </button>
          {downloadEnabled && (
            <button
              onClick={() => {
                if (pdfUrl) {
                  const link = document.createElement("a");
                  link.href = pdfUrl;
                  link.download = "document.pdf";
                  link.target = "_blank";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              className="p-2 rounded hover:bg-gray-100"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex justify-center p-4 relative">
        {watermarkEmail && watermarkTime && (
          <WatermarkOverlay email={watermarkEmail} timestamp={watermarkTime} />
        )}

        <div className="shadow-lg bg-white">
          {pdfUrl ? (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="flex items-center space-x-3">
                    <img src="/logo.png" alt="PDFTrackr Logo" className="w-8 h-8 animate-pulse" />
                    <span className="text-gray-600">Loading PDF...</span>
                  </div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-8 text-red-600">
                  <span>❌ Failed to load PDF</span>
                </div>
              }
            >
              {numPages > 0 && pageNumber <= numPages ? (
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="mx-auto shadow-lg"
                  onRenderSuccess={() => {}}
                  onRenderError={(error) => {
                    console.error(`PDF page render error:`, error);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center p-8 text-gray-600">
                  <span>⏳ Loading page {pageNumber}...</span>
                </div>
              )}
            </Document>
          ) : (
            <div className="flex items-center justify-center p-8 text-gray-600">
              <span>❌ No PDF URL provided</span>
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      {!downloadEnabled && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded text-sm">
          🔒 Download disabled for security
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .react-pdf__Page__canvas {
            max-width: 100% !important;
            height: auto !important; 
          }
          .react-pdf__Page__textContent {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
          }
          .react-pdf__Page__annotations {
            display: none !important;
          }
          .react-pdf__Document, .react-pdf__Page {
            -webkit-user-drag: none !important;
            -moz-user-drag: none !important;
            user-drag: none !important;
          }
          @media print {
            body { display: none !important; }
          }
        `,
        }}
      />
    </div>
  );
}
