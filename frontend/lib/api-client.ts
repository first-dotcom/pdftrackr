"use client";

import { config } from "./config";
import { generateCSRFToken } from "../utils/security";
import type { ApiResponse } from "@/shared/types";

export interface RequestOptions {
  skipCSRF?: boolean;
  skipAuth?: boolean;
  customHeaders?: Record<string, string>;
  signal?: AbortSignal;
}

class ApiClient {
  private baseUrl: string;
  private getToken?: () => Promise<string | null>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Initialize with auth token getter (from Clerk)
  setAuthProvider(getToken: () => Promise<string | null>) {
    this.getToken = getToken;
  }

  private async buildHeaders(
    method: string,
    options: RequestOptions = {}
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.customHeaders,
    };

    // Add authentication token
    if (!options.skipAuth && this.getToken) {
      const token = await this.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add CSRF token for mutating operations
    const needsCSRF = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
    if (needsCSRF && !options.skipCSRF) {
      const csrfToken = generateCSRFToken();
      document.cookie = `csrfToken=${csrfToken}; path=/; SameSite=Lax`;
      headers["X-CSRF-Token"] = csrfToken;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    method: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = await this.buildHeaders(method, options);

      const response = await fetch(url, {
        method,
        headers,
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
        signal: options.signal,
      });

      // Handle non-JSON responses (like file downloads)
      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.includes("application/json")) {
        if (response.ok) {
          return {
            success: true,
            data: response as any, // Return the response object for non-JSON data
          };
        } else {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${method} ${endpoint}`, error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: "Network error. Please check your connection.",
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      };
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "GET", undefined, options);
  }

  async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "POST", body, options);
  }

  async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "PUT", body, options);
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "PATCH", body, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "DELETE", undefined, options);
  }

  // File upload with automatic CSRF
  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {};

      // Add authentication
      if (!options.skipAuth && this.getToken) {
        const token = await this.getToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      // Add CSRF token
      if (!options.skipCSRF) {
        const csrfToken = generateCSRFToken();
        document.cookie = `csrfToken=${csrfToken}; path=/; SameSite=Lax`;
        headers["X-CSRF-Token"] = csrfToken;
      }

      // Add custom headers
      Object.assign(headers, options.customHeaders);

      const response = await fetch(url, {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
        signal: options.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      console.error(`File upload failed: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload error",
      };
    }
  }

  // Typed API methods for common operations
  files = {
    list: (params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      const query = searchParams.toString();
      return this.get(`/api/files${query ? `?${query}` : ''}`);
    },
    get: (id: number) => this.get(`/api/files/${id}`),
    upload: (formData: FormData) => this.uploadFile("/api/files/upload", formData),
    delete: (id: number) => this.delete(`/api/files/${id}`),
    download: (id: number) => this.get(`/api/files/${id}/download`, { skipCSRF: true }),
  };

  shareLinks = {
    list: (fileId: number) => this.get(`/api/share/file/${fileId}`),
    create: (data: any) => this.post("/api/share", data),
    get: (shareId: string, options?: RequestOptions) => 
      this.get(`/api/share/${shareId}`, { skipCSRF: true, skipAuth: true, ...options }),
    update: (shareId: string, data: any) => 
      this.patch(`/api/share/${shareId}`, data, { skipCSRF: true }),
    delete: (shareId: string) => 
      this.delete(`/api/share/${shareId}`, { skipCSRF: true }),
    access: (shareId: string, data: any) => 
      this.post(`/api/share/${shareId}/access`, data, { skipCSRF: true, skipAuth: true }),
  };

  users = {
    profile: () => this.get("/api/users/profile"),
    updatePlan: (plan: string) => this.patch("/api/users/plan", { plan }),
    stats: () => this.get("/api/users/stats"),
    settings: () => this.get("/api/users/settings"),
    updateSettings: (settings: any) => this.patch("/api/users/settings", settings),
  };

  waitlist = {
    join: (data: { email: string; plan: string; source: string }) => 
      this.post("/api/waitlist", data, { skipAuth: true }),
  };

  feedback = {
    submit: (data: { message: string; rating?: number; category?: string }) => 
      this.post("/api/feedback", data),
    getHistory: (params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      const query = searchParams.toString();
      return this.get(`/api/feedback${query ? `?${query}` : ''}`);
    },
    getRateLimit: () => this.get("/api/feedback/rate-limit"),
  };

  analytics = {
    file: (fileId: number) => this.get(`/api/analytics/files/${fileId}`),
    aggregate: (fileId: number, days?: number, pageRange?: string) => {
      const searchParams = new URLSearchParams();
      if (days) searchParams.append('days', days.toString());
      if (pageRange) searchParams.append('pageRange', pageRange);
      searchParams.append('_t', Date.now().toString()); // Cache buster
      const query = searchParams.toString();
      return this.get(`/api/analytics/files/${fileId}/aggregate?${query}`);
    },
    sessions: (fileId: number, params?: {
      page?: number;
      limit?: number;
      email?: string;
      device?: string;
      country?: string;
      dateFrom?: string;
      dateTo?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.email) searchParams.append('email', params.email);
      if (params?.device) searchParams.append('device', params.device);
      if (params?.country) searchParams.append('country', params.country);
      if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
      const query = searchParams.toString();
      return this.get(`/api/analytics/files/${fileId}/sessions${query ? `?${query}` : ''}`);
    },
    
    individual: (fileId: number, params?: {
      page?: number;
      limit?: number;
      email?: string;
      device?: string;
      country?: string;
      dateFrom?: string;
      dateTo?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.email) searchParams.append('email', params.email);
      if (params?.device) searchParams.append('device', params.device);
      if (params?.country) searchParams.append('country', params.country);
      if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
      const query = searchParams.toString();
      return this.get(`/api/analytics/files/${fileId}/individual${query ? `?${query}` : ''}`);
    },
    share: (shareId: string) => this.get(`/api/analytics/shares/${shareId}`),
    dashboard: () => this.get("/api/analytics/dashboard"),
    
    // 📊 HIGH-VALUE ANALYTICS TRACKING
    trackSessionStart: (data: {
      shareId: string;
      email?: string;
      sessionId?: string;
      timestamp: string;
    }) => this.post("/api/analytics/session-start", data, { skipCSRF: true, skipAuth: true }),
    
    trackPageView: (data: {
      shareId: string;
      email?: string;
      page: number;
      totalPages: number;
      sessionId?: string;
      timestamp: string;
      duration?: number;
      scrollDepth?: number;
    }) => this.post("/api/analytics/page-view", data, { skipCSRF: true, skipAuth: true }),
    
    trackSessionEnd: (data: {
      shareId: string;
      email?: string;
      sessionId?: string;
      durationSeconds: number;
      pagesViewed: number;
      totalPages: number;
      maxPageReached: number;
      timestamp: string;
    }) => this.post("/api/analytics/session-end", data, { skipCSRF: true, skipAuth: true }),
    
    trackReturnVisit: (data: {
      shareId: string;
      email?: string;
      totalVisits: number;
      daysSinceFirst: number;
    }) => this.post("/api/analytics/return-visit", data, { skipCSRF: true, skipAuth: true }),

    // Simple analytics retrieval methods
    getDocumentStats: (shareId: string) => 
      this.get(`/api/analytics/document/${shareId}/stats`, { skipCSRF: true, skipAuth: true }),
  };
}

// Create singleton instance
export const apiClient = new ApiClient(config.api.url);

// Export for easy importing
export default apiClient;