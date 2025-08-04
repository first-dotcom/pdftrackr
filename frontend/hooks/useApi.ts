"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { apiClient } from "../lib/api-client";

/**
 * Custom hook that provides a configured API client with automatic auth
 * @returns Configured API client instance
 */
export function useApi() {
  const { getToken } = useAuth();

  // Initialize the API client with Clerk auth
  useEffect(() => {
    apiClient.setAuthProvider(getToken);
  }, [getToken]);

  return apiClient;
}

/**
 * Hook for API operations with loading/error state management
 */
export function useApiState<T = any>() {
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

  const execute = async <R = T>(
    apiCall: () => Promise<{ success: boolean; data?: R; error?: any }>
  ) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const response = await apiCall();
      
      if (response.success) {
        setState({ data: response.data as R, loading: false, error: null });
        return response.data as R;
      } else {
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || 'An error occurred';
        setState({ data: null, loading: false, error: errorMsg });
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMsg });
      throw error;
    }
  };

  return { ...state, execute, api };
}

