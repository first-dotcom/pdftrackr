"use client";

import { config } from "./config";
import { generateCSRFToken } from "../utils/security";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | { message: string; details?: any };
}

export interface RequestOptions {
  skipCSRF?: boolean;
  skipAuth?: boolean;
  customHeaders?: Record<string, string>;
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
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${method} ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
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
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
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
    list: () => this.get("/api/files"),
    get: (id: number) => this.get(`/api/files/${id}`),
    upload: (formData: FormData) => this.uploadFile("/api/files/upload", formData),
    delete: (id: number) => this.delete(`/api/files/${id}`),
    download: (id: number) => this.get(`/api/files/${id}/download`),
  };

  shareLinks = {
    list: (fileId: number) => this.get(`/api/share/file/${fileId}`),
    create: (data: any) => this.post("/api/share", data),
    get: (shareId: string, options?: RequestOptions) => 
      this.get(`/api/share/${shareId}`, { skipCSRF: true, skipAuth: true, ...options }),
    update: (shareId: string, data: any) => 
      this.patch(`/api/share/${shareId}`, data, { skipCSRF: true }), // PATCH endpoints typically skip CSRF
    delete: (shareId: string) => 
      this.delete(`/api/share/${shareId}`, { skipCSRF: true }), // DELETE endpoints typically skip CSRF
    access: (shareId: string, data: any) => 
      this.post(`/api/share/${shareId}/access`, data, { skipCSRF: true, skipAuth: true }),
  };

  users = {
    profile: () => this.get("/api/users/profile"),
    updatePlan: (plan: string) => this.patch("/api/users/plan", { plan }),
    stats: () => this.get("/api/users/stats"),
  };

  analytics = {
    file: (fileId: number) => this.get(`/api/analytics/files/${fileId}`),
    share: (shareId: string) => this.get(`/api/analytics/shares/${shareId}`),
  };
}

// Create singleton instance
export const apiClient = new ApiClient(config.api.url);

// Export for easy importing
export default apiClient;