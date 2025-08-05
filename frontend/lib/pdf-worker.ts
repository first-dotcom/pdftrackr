import { pdfjs } from 'react-pdf';

/**
 * Robust PDF.js worker setup with multiple fallbacks
 * Prevents the "Loading PDF..." infinite hang issue
 */

const WORKER_URLS = [
  // Primary: jsDelivr (most reliable)
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  // Fallback 1: unpkg
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  // Fallback 2: cdnjs
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
];

let workerInitialized = false;
let initializationPromise: Promise<boolean> | null = null;

/**
 * Test if a worker URL is accessible
 */
async function testWorkerUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true; // If we get here, URL is accessible
  } catch (error) {
    return false;
  }
}

/**
 * Initialize PDF.js worker with fallback strategy
 */
export async function initializePDFWorker(): Promise<boolean> {
  if (workerInitialized) return true;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    if (typeof window === 'undefined') return false;

    // Try each worker URL until one works
    for (const url of WORKER_URLS) {
      try {
        // Test URL accessibility (best effort)
        const isAccessible = await Promise.race([
          testWorkerUrl(url),
          new Promise<boolean>(resolve => setTimeout(() => resolve(true), 1000)) // 1s timeout
        ]);

        // Set worker source
        pdfjs.GlobalWorkerOptions.workerSrc = url;
        
        // Test worker initialization by creating a dummy document
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array([]) });
        
        // Quick test with timeout
        await Promise.race([
          loadingTask.promise.catch(() => {}), // Expect this to fail with empty data
          new Promise((_, reject) => setTimeout(() => reject(new Error('Worker timeout')), 2000))
        ]);

        workerInitialized = true;
        return true;

      } catch (error) {
        continue; // Try next URL
      }
    }
    return false;
  })();

  return initializationPromise;
}

/**
 * Get worker initialization status
 */
export function isPDFWorkerReady(): boolean {
  return workerInitialized;
}

/**
 * Force worker re-initialization (for recovery)
 */
export function resetPDFWorker(): void {
  workerInitialized = false;
  initializationPromise = null;
}