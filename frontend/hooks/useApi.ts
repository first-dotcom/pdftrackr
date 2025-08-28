"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "../lib/api-client";

/**
 * Custom hook that provides a configured API client with automatic auth
 * @returns Configured API client instance
 */
export function useApi() {
  const { getToken } = useAuth();

  // Initialize the API client with Clerk auth - only when getToken changes
  useEffect(() => {
    apiClient.setAuthProvider(getToken);
  }, [getToken]);

  // Return stable reference to prevent unnecessary re-renders
  return useMemo(() => apiClient, []);
}

/**
 * Hook for API operations with loading/error state management
 * Production-ready with race condition protection and cleanup
 */
export function useApiState<T = unknown>() {
  const api = useApi();

  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  // Track component mount status to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Track current abort controller to cancel previous requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(
    async (
      apiCall: (options?: { signal?: AbortSignal }) => Promise<{
        success: boolean;
        data?: T;
        error?: unknown;
      }>,
    ): Promise<T> => {
      // Abort any previous request
      abortControllerRef.current?.abort();

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        throw new Error("Component unmounted");
      }

      setState({ data: null, loading: true, error: null });

      try {
        const response = await apiCall({ signal: abortController.signal });

        // Check if request was aborted or component unmounted
        if (abortController.signal.aborted || !isMountedRef.current) {
          throw new Error("Request cancelled");
        }

        if (response.success) {
          // Type-safe data extraction with proper fallback
          const data = response.data ?? null;
          setState({ data: data as T, loading: false, error: null });
          return data as T;
        }
        const errorMsg =
          typeof response.error === "string"
            ? response.error
            : (response.error as { message?: string })?.message || "An error occurred";
        setState({ data: null, loading: false, error: errorMsg });
        throw new Error(errorMsg);
      } catch (error) {
        // Only update state if component is still mounted and request wasn't aborted
        if (isMountedRef.current && !abortController.signal.aborted) {
          const errorMsg = error instanceof Error ? error.message : "An error occurred";
          setState({ data: null, loading: false, error: errorMsg });
        }
        throw error;
      } finally {
        // Clear the abort controller if this was the current one
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [],
  );

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setState({ data: null, loading: false, error: null });
    }
  }, []);

  // Return stable references to prevent unnecessary re-renders
  return useMemo(
    () => ({
      ...state,
      execute,
      reset,
      api,
    }),
    [state, execute, reset, api],
  );
}
