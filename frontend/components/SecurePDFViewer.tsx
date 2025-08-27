"use client";

import { config } from "@/lib/config";
import { apiClient } from "@/lib/api-client";
import { ChevronLeft, ChevronRight, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Set up PDF.js worker (same as test page)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

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
  scrollDepth: number;
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
    scrollDepth: 0,
    pageStartTime: Date.now(),
  });

  // 📊 NEW: Activity tracking state
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());

  // 📊 REFS FOR CLEANUP TRACKING
  const scrollElementRef = useRef<Element | null>(null);
  const scrollListenersRef = useRef<Set<string>>(new Set());
  const activityListenersRef = useRef<Set<string>>(new Set());
  const mobileListenersRef = useRef<Set<string>>(new Set());
  const sessionListenersRef = useRef<Set<string>>(new Set());

  // 📊 NEW: Activity tracking function
  const trackUserActivity = useCallback(() => {
    setLastActivityTime(Date.now());
    
    // Send activity heartbeat
    if (sessionId) {
      apiClient.analytics.updateSessionActivity({
        sessionId,
        lastActiveAt: new Date().toISOString(),
        currentPage: pageNumber,
        scrollDepth: pageTracking.scrollDepth,
      }).catch(error => {
        console.warn('Activity heartbeat failed:', error);
      });
    }
  }, [sessionId, pageNumber, pageTracking.scrollDepth]);

  // 📊 NEW: Mobile-friendly scroll tracking function
  const handleScroll = useCallback((e: any) => {
    const element = e.target;
    if (!element) return;

    // Get scroll metrics
    const scrollTop = element.scrollTop || 0;
    const scrollHeight = element.scrollHeight || 0;
    const clientHeight = element.clientHeight || 0;

    // Mobile-friendly validation
    if (scrollHeight <= clientHeight) return;

    // Calculate scroll depth with mobile considerations
    let currentDepth = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    
    // Clamp to valid range (0-100)
    currentDepth = Math.max(0, Math.min(100, currentDepth));
    
    // Debounce rapid scroll events on mobile
    setPageTracking(prev => {
      // Only update if significant change (prevents micro-updates)
      if (Math.abs(currentDepth - prev.scrollDepth) >= 5) {
        return {
          ...prev,
          scrollDepth: Math.max(prev.scrollDepth, currentDepth)
        };
      }
      return prev;
    });

    // Track user activity on scroll
    trackUserActivity();
  }, [trackUserActivity]);

  // 📊 COMPREHENSIVE CLEANUP FUNCTION
  const cleanupAllListeners = useCallback(() => {
    // Clean up scroll listeners
    if (scrollElementRef.current) {
      const element = scrollElementRef.current;
      if (scrollListenersRef.current.has('scroll')) {
        element.removeEventListener('scroll', handleScroll);
        scrollListenersRef.current.delete('scroll');
      }
      if (scrollListenersRef.current.has('touchmove')) {
        element.removeEventListener('touchmove', handleScroll);
        scrollListenersRef.current.delete('touchmove');
      }
      scrollElementRef.current = null;
    }

    // Clean up activity listeners
    const activityEvents = ['scroll', 'mousemove', 'click', 'keypress'];
    activityEvents.forEach(event => {
      if (activityListenersRef.current.has(event)) {
        document.removeEventListener(event, trackUserActivity);
        activityListenersRef.current.delete(event);
      }
    });

    // Clean up mobile listeners
    if (mobileListenersRef.current.has('orientationchange')) {
      window.removeEventListener('orientationchange', () => {});
      mobileListenersRef.current.delete('orientationchange');
    }
    if (mobileListenersRef.current.has('resize')) {
      window.removeEventListener('resize', () => {});
      mobileListenersRef.current.delete('resize');
    }
    if (mobileListenersRef.current.has('visualViewport-resize') && 'visualViewport' in window) {
      (window as any).visualViewport?.removeEventListener('resize', () => {});
      mobileListenersRef.current.delete('visualViewport-resize');
    }

    // Clean up security listeners
    if (securityListenersRef.current.has('keydown')) {
      document.removeEventListener('keydown', () => {});
      securityListenersRef.current.delete('keydown');
    }
    if (securityListenersRef.current.has('contextmenu')) {
      document.removeEventListener('contextmenu', () => {});
      securityListenersRef.current.delete('contextmenu');
    }

    // Clean up session listeners
    if (sessionListenersRef.current.has('beforeunload')) {
      window.removeEventListener('beforeunload', () => {});
      sessionListenersRef.current.delete('beforeunload');
    }
    if (sessionListenersRef.current.has('visibilitychange')) {
      document.removeEventListener('visibilitychange', () => {});
      sessionListenersRef.current.delete('visibilitychange');
    }
  }, [handleScroll, trackUserActivity]);

  // 📊 FIXED: Mobile-friendly scroll setup with proper cleanup
  useEffect(() => {
    // Clean up any existing scroll listeners first
    if (scrollElementRef.current) {
      const element = scrollElementRef.current;
      if (scrollListenersRef.current.has('scroll')) {
        element.removeEventListener('scroll', handleScroll);
        scrollListenersRef.current.delete('scroll');
      }
      if (scrollListenersRef.current.has('touchmove')) {
        element.removeEventListener('touchmove', handleScroll);
        scrollListenersRef.current.delete('touchmove');
      }
      scrollElementRef.current = null;
    }

    const setupScrollTracking = () => {
      // Mobile-optimized selectors (order matters)
      const selectors = [
        '.react-pdf__Page__canvas', // Primary target for mobile
        '.react-pdf__Page', 
        '.react-pdf__Document',
        '[data-testid="pdf-page"]', // Common PDF viewer wrapper
        'body'
      ];
      
      let element: Element | null = null;

      // Try to find scrollable element
      for (const selector of selectors) {
        element = document.querySelector(selector);
        if (element) {
          // Check if element is actually scrollable
          const style = window.getComputedStyle(element);
          const isScrollable = style.overflow === 'auto' || 
                              style.overflow === 'scroll' || 
                              style.overflowY === 'auto' || 
                              style.overflowY === 'scroll';
          
          if (isScrollable || element.scrollHeight > element.clientHeight) {
            break;
          }
        }
      }

      if (element) {
        // Store reference for cleanup
        scrollElementRef.current = element;
        
        // Check if listeners already exist before adding
        if (!scrollListenersRef.current.has('scroll')) {
          element.addEventListener('scroll', handleScroll, { passive: true });
          scrollListenersRef.current.add('scroll');
        }
        
        if (!scrollListenersRef.current.has('touchmove')) {
          element.addEventListener('touchmove', handleScroll, { passive: true });
          scrollListenersRef.current.add('touchmove');
        }
        
        return true; // Setup successful
      }

      return false; // Setup failed
    };

    // Mobile-friendly setup with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let setupTimer: NodeJS.Timeout;

    const attemptSetup = () => {
      const success = setupScrollTracking();
      
      // If setup failed and we haven't exceeded retries, try again
      if (!success && retryCount < maxRetries) {
        retryCount++;
        setupTimer = setTimeout(attemptSetup, 500 * retryCount); // Exponential backoff
      }
    };

    // Initial setup with delay for PDF rendering
    const initialTimer = setTimeout(attemptSetup, 1000);
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(setupTimer);
      
      // Clean up scroll listeners
      if (scrollElementRef.current) {
        const element = scrollElementRef.current;
        if (scrollListenersRef.current.has('scroll')) {
          element.removeEventListener('scroll', handleScroll);
          scrollListenersRef.current.delete('scroll');
        }
        if (scrollListenersRef.current.has('touchmove')) {
          element.removeEventListener('touchmove', handleScroll);
          scrollListenersRef.current.delete('touchmove');
        }
        scrollElementRef.current = null;
      }
    };
  }, [handleScroll, pageNumber]);

  // 📊 NEW: Reset tracking data on page change
  useEffect(() => {
    setPageTracking({
      scrollDepth: 0,
      pageStartTime: Date.now(),
    });
  }, [pageNumber]);

  // 📊 FIXED: Activity tracking setup with proper cleanup
  useEffect(() => {
    const events = ['scroll', 'mousemove', 'click', 'keypress'];
    
    // Clean up any existing activity listeners first
    events.forEach(event => {
      if (activityListenersRef.current.has(event)) {
        document.removeEventListener(event, trackUserActivity);
        activityListenersRef.current.delete(event);
      }
    });
    
    // Add new listeners only if they don't exist
    events.forEach(event => {
      if (!activityListenersRef.current.has(event)) {
        document.addEventListener(event, trackUserActivity, { passive: true });
        activityListenersRef.current.add(event);
      }
    });
    
    return () => {
      // Clean up all activity listeners
      events.forEach(event => {
        if (activityListenersRef.current.has(event)) {
          document.removeEventListener(event, trackUserActivity);
          activityListenersRef.current.delete(event);
        }
      });
    };
  }, [trackUserActivity]);

  // 📊 FIXED: Mobile-specific event handling with proper cleanup
  useEffect(() => {
    const handleOrientationChange = () => {
      // Reset scroll tracking when orientation changes
      setTimeout(() => {
        setPageTracking(prev => ({
          ...prev,
          scrollDepth: 0 // Reset scroll depth on orientation change
        }));
      }, 100); // Small delay to let layout settle
    };

    const handleResize = () => {
      // Reset scroll tracking when viewport changes (keyboard, resize, etc.)
      setPageTracking(prev => ({
        ...prev,
        scrollDepth: 0
      }));
    };

    // Clean up any existing mobile listeners first
    if (mobileListenersRef.current.has('orientationchange')) {
      window.removeEventListener('orientationchange', handleOrientationChange);
      mobileListenersRef.current.delete('orientationchange');
    }
    if (mobileListenersRef.current.has('resize')) {
      window.removeEventListener('resize', handleResize);
      mobileListenersRef.current.delete('resize');
    }
    if (mobileListenersRef.current.has('visualViewport-resize') && 'visualViewport' in window) {
      (window as any).visualViewport?.removeEventListener('resize', handleResize);
      mobileListenersRef.current.delete('visualViewport-resize');
    }

    // Add mobile-specific event listeners only if they don't exist
    if (!mobileListenersRef.current.has('orientationchange')) {
      window.addEventListener('orientationchange', handleOrientationChange);
      mobileListenersRef.current.add('orientationchange');
    }
    
    if (!mobileListenersRef.current.has('resize')) {
      window.addEventListener('resize', handleResize);
      mobileListenersRef.current.add('resize');
    }
    
    // iOS Safari specific events
    if ('visualViewport' in window && !mobileListenersRef.current.has('visualViewport-resize')) {
      (window as any).visualViewport?.addEventListener('resize', handleResize);
      mobileListenersRef.current.add('visualViewport-resize');
    }

    return () => {
      // Clean up all mobile listeners
      if (mobileListenersRef.current.has('orientationchange')) {
        window.removeEventListener('orientationchange', handleOrientationChange);
        mobileListenersRef.current.delete('orientationchange');
      }
      if (mobileListenersRef.current.has('resize')) {
        window.removeEventListener('resize', handleResize);
        mobileListenersRef.current.delete('resize');
      }
      if (mobileListenersRef.current.has('visualViewport-resize') && 'visualViewport' in window) {
        (window as any).visualViewport?.removeEventListener('resize', handleResize);
        mobileListenersRef.current.delete('visualViewport-resize');
      }
    };
  }, []);

  // 📊 ANALYTICS FUNCTIONS
  // Session is already created on backend when share link is accessed
  // No need to create another session here

  const trackPageView = async (page: number, totalPages: number, isPageExit: boolean = false) => {
    // Validate parameters
    if (!page || page <= 0 || !totalPages || totalPages <= 0 || page > totalPages) {
      console.warn(`Invalid page view tracking parameters: page=${page}, totalPages=${totalPages}`);
      return;
    }

    // Check consent before tracking
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('analytics-consent');
      if (consent !== 'accepted') {
        return; // Don't track without consent
      }
    }

    // Calculate page duration in milliseconds for sub-second precision
    const now = Date.now();
    const pageDuration = isPageExit 
      ? Math.max(1, now - pageTracking.pageStartTime) // Exit: ms precision, min 1ms
      : 0; // Entry: 0ms duration

    // Update session data
    setSessionData(prev => ({
      ...prev,
      pagesViewed: new Set([...prev.pagesViewed, page]),
      maxPageReached: Math.max(prev.maxPageReached, page),
    }));

    // Send analytics to backend using custom API client
    try {
      await apiClient.analytics.trackPageView({
        shareId,
        email,
        page,
        totalPages,
        sessionId,
        timestamp: new Date().toISOString(),
        duration: pageDuration,
        isPageExit, // Mark if this is a page exit
      });
    } catch (error) {
      console.warn('Page view tracking failed:', error);
    }
  };

  const trackSessionEnd = async (retryCount = 0) => {
    const rawDurationSeconds = Math.round((Date.now() - sessionData.startTime) / 1000);
    
    // Quality filter: Only track sessions with meaningful engagement
    const minEngagementTime = 3; // 3 seconds minimum
    const minPagesViewed = 1; // At least 1 page viewed
    
    if (rawDurationSeconds < minEngagementTime || sessionData.pagesViewed.size < minPagesViewed) {
      console.log(`Session too short (${rawDurationSeconds}s) or no pages viewed (${sessionData.pagesViewed.size}), skipping session end tracking`);
      return;
    }
    
    // Track exit from current page before ending session
    if (pageNumber > 0 && numPages > 0) {
      trackPageView(pageNumber, numPages, true);
    }
    
    try {
      await apiClient.analytics.trackSessionEnd({
        shareId,
        email,
        sessionId,
        durationSeconds: rawDurationSeconds, // Use actual duration
        pagesViewed: sessionData.pagesViewed.size,
        totalPages: sessionData.totalPages,
        maxPageReached: sessionData.maxPageReached,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Session end tracking failed:', error);
      
      // Retry logic for production reliability
      if (retryCount < 2) {
        setTimeout(() => {
          trackSessionEnd(retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s
      }
    }
  };

  // Session is already created on backend when share link is accessed
  // No need to create another session here
  useEffect(() => {
    if (sessionId) {
      console.log('Session ready for tracking:', sessionId);
    }
  }, [sessionId]);

  // FIXED: Track session end with optimized event handling and proper cleanup
  useEffect(() => {
    let hasTrackedEnd = false;

    const handleBeforeUnload = () => {
      if (!hasTrackedEnd) {
        hasTrackedEnd = true;
        trackSessionEnd();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !hasTrackedEnd) {
        hasTrackedEnd = true;
        trackSessionEnd();
      }
    };

    // Debounced session end tracking for better performance
    const debouncedSessionEnd = debounce(() => {
      if (!hasTrackedEnd) {
        hasTrackedEnd = true;
        trackSessionEnd();
      }
    }, 2000); // 2 second debounce

    // Clean up any existing session listeners first
    if (sessionListenersRef.current.has('beforeunload')) {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sessionListenersRef.current.delete('beforeunload');
    }
    if (sessionListenersRef.current.has('visibilitychange')) {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      sessionListenersRef.current.delete('visibilitychange');
    }

    // Add session listeners only if they don't exist
    if (!sessionListenersRef.current.has('beforeunload')) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      sessionListenersRef.current.add('beforeunload');
    }
    if (!sessionListenersRef.current.has('visibilitychange')) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      sessionListenersRef.current.add('visibilitychange');
    }

    // Set up periodic session end check (every 30 seconds)
    const interval = setInterval(() => {
      const currentDuration = Math.round((Date.now() - sessionData.startTime) / 1000);
      if (currentDuration > 30) { // Only check after 30 seconds
        debouncedSessionEnd();
      }
    }, 30000);

    return () => {
      // Clean up all session listeners
      if (sessionListenersRef.current.has('beforeunload')) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        sessionListenersRef.current.delete('beforeunload');
      }
      if (sessionListenersRef.current.has('visibilitychange')) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        sessionListenersRef.current.delete('visibilitychange');
      }
      clearInterval(interval);
      
      // Track session end when component unmounts (if not already tracked)
      if (!hasTrackedEnd) {
        trackSessionEnd();
      }
    };
  }, [sessionData.totalPages, sessionData.maxPageReached]);

  // 📊 FINAL CLEANUP ON COMPONENT UNMOUNT
  useEffect(() => {
    return () => {
      // Ensure all listeners are cleaned up when component unmounts
      cleanupAllListeners();
    };
  }, [cleanupAllListeners]);

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
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
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
        .catch(error => {
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

  // 📊 REFS FOR SECURITY LISTENERS
  const securityListenersRef = useRef<Set<string>>(new Set());

  // FIXED: Disable browser shortcuts and right-click with proper cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "p")) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Clean up any existing security listeners first
    if (securityListenersRef.current.has('keydown')) {
      document.removeEventListener("keydown", handleKeyDown);
      securityListenersRef.current.delete('keydown');
    }
    if (securityListenersRef.current.has('contextmenu')) {
      document.removeEventListener("contextmenu", handleContextMenu);
      securityListenersRef.current.delete('contextmenu');
    }

    // Add security listeners only if they don't exist
    if (!securityListenersRef.current.has('keydown')) {
      document.addEventListener("keydown", handleKeyDown);
      securityListenersRef.current.add('keydown');
    }
    if (!securityListenersRef.current.has('contextmenu')) {
      document.addEventListener("contextmenu", handleContextMenu);
      securityListenersRef.current.add('contextmenu');
    }

    return () => {
      // Clean up all security listeners
      if (securityListenersRef.current.has('keydown')) {
        document.removeEventListener("keydown", handleKeyDown);
        securityListenersRef.current.delete('keydown');
      }
      if (securityListenersRef.current.has('contextmenu')) {
        document.removeEventListener("contextmenu", handleContextMenu);
        securityListenersRef.current.delete('contextmenu');
      }
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
            Page {pageNumber} of {numPages || '?'}
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
                      <img
                        src="/logo.png"
                        alt="PDFTrackr Logo"
                        className="w-8 h-8 animate-pulse"
                      />
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

      <style dangerouslySetInnerHTML={{
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
        `
      }} />
    </div>
  );
}
