"use client";

import SecurePDFViewer from "@/components/SecurePDFViewerWrapper";
import { config } from "@/lib/config";
import dynamic from "next/dynamic";
import type React from "react";
import { useEffect, useState } from "react";

// Dynamic imports for lucide-react components
const Eye = dynamic(() => import("lucide-react").then((mod) => mod.Eye), { ssr: false });
const Download = dynamic(() => import("lucide-react").then((mod) => mod.Download), { ssr: false });
const Lock = dynamic(() => import("lucide-react").then((mod) => mod.Lock), { ssr: false });

const Clock = dynamic(() => import("lucide-react").then((mod) => mod.Clock), { ssr: false });
const Users = dynamic(() => import("lucide-react").then((mod) => mod.Users), { ssr: false });

interface ShareLinkData {
  shareLink: {
    id: number;
    shareId: string;
    title: string;
    description: string;
    emailGatingEnabled: boolean;
    downloadEnabled: boolean;
    watermarkEnabled: boolean;
    expiresAt: string | null;
    maxViews: number | null;
    viewCount: number;
    isActive: boolean;
    requiresPassword: boolean;
    file: {
      id: number;
      filename: string;
      originalName: string;
      size: number;
      title: string;
    };
  };
}

interface AccessData {
  sessionId: string;
  fileUrl: string;
  file: {
    id: number;
    filename: string;
    originalName: string;
    title: string;
    size: number;
  };
  downloadEnabled: boolean;
  watermarkEnabled: boolean;
}

interface SharePageClientProps {
  shareId: string;
}

export default function SharePageClient({ shareId }: SharePageClientProps) {
  const [shareData, setShareData] = useState<ShareLinkData | null>(null);
  const [accessData, setAccessData] = useState<AccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);

  // Access form state
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // PDF viewer state
  const [watermarkEmail, setWatermarkEmail] = useState<string>("");
  const [watermarkTime, setWatermarkTime] = useState<string>("");

  useEffect(() => {
    fetchShareInfo();
  }, []);

  const fetchShareInfo = async () => {
    try {
      const response = await fetch(`${config.api.url}/api/share/${shareId}`);

      if (response.ok) {
        const data = await response.json();
        setShareData(data.data);

        // If no password or email gating required, show access form
        if (!data.data.shareLink.requiresPassword && !data.data.shareLink.emailGatingEnabled) {
          setShowAccessForm(true);
        } else {
          setShowAccessForm(true);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Share link not found");
      }
    } catch (err) {
      console.error("Failed to fetch share info:", err);
      setError("Failed to load share link");
    } finally {
      setLoading(false);
    }
  };

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: Record<string, string> = {};

      if (shareData?.shareLink.requiresPassword) {
        payload.password = password;
      }

      if (shareData?.shareLink.emailGatingEnabled) {
        payload.email = email;
        if (name) {
          payload.name = name;
        }
      }

      const response = await fetch(`${config.api.url}/api/share/${shareId}/access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessData(data.data);
        setShowAccessForm(false);

        // Set watermark info if enabled
        if (shareData?.shareLink.watermarkEnabled) {
          setWatermarkEmail(email || "Viewer");
          setWatermarkTime(new Date().toISOString());
        }

        // Show PDF viewer for PDF files
        setShowPDFViewer(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Access denied");
      }
    } catch (err) {
      console.error("Failed to access share:", err);
      setError("Failed to access document");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (accessData?.fileUrl) {
      const link = document.createElement("a");
      link.href = accessData.fileUrl;
      link.download = accessData.file.title || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Share Link Not Found</h1>
          <p className="text-gray-600">This share link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  if (showAccessForm && !accessData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Eye className="h-6 w-6 text-primary-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">{shareData.shareLink.title}</h1>
            {shareData.shareLink.description && (
              <p className="text-gray-600 mt-2">{shareData.shareLink.description}</p>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Document:</span>
              <span className="font-medium">
                {shareData.shareLink.file.title || "Untitled Document"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Size:</span>
              <span className="font-medium">{formatFileSize(shareData.shareLink.file.size)}</span>
            </div>
            {shareData.shareLink.viewCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Views:</span>
                <span className="font-medium">{shareData.shareLink.viewCount}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleAccess} className="space-y-4">
            {shareData.shareLink.emailGatingEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input w-full border border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-sm text-gray-900 placeholder-gray-400"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input w-full border border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-sm text-gray-900 placeholder-gray-400"
                    placeholder="Enter your name"
                  />
                </div>
              </>
            )}

            {shareData.shareLink.requiresPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full border border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-sm text-gray-900 placeholder-gray-400"
                  placeholder="Enter password"
                  required
                />
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary btn-md w-full">
              {submitting ? "Accessing..." : "View Document"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              {shareData.shareLink.downloadEnabled && (
                <div className="flex items-center">
                  <Download className="h-3 w-3 mr-1" />
                  Download allowed
                </div>
              )}
              {shareData.shareLink.watermarkEnabled && (
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  Watermarked
                </div>
              )}
              {shareData.shareLink.expiresAt && (
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Expires {new Date(shareData.shareLink.expiresAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PDF Viewer (once access is granted)
  if (accessData && showPDFViewer) {
    return (
      <SecurePDFViewer
        shareId={shareId}
        sessionId={accessData.sessionId}
        password={password}
        email={email}
        watermarkEmail={shareData?.shareLink.watermarkEnabled ? watermarkEmail : undefined}
        watermarkTime={shareData?.shareLink.watermarkEnabled ? watermarkTime : undefined}
        downloadEnabled={accessData.downloadEnabled}
        onError={(errorMsg) => {
          setError(errorMsg);
          setShowPDFViewer(false);
        }}
        onLoadSuccess={() => {
          // PDF loaded successfully
        }}
      />
    );
  }

  // Legacy fallback for non-PDF files or when PDF viewer fails
  if (accessData && !showPDFViewer) {
    return (
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-gray-900">{shareData?.shareLink.title}</h1>
              <p className="text-sm text-gray-500">
                {accessData.file.title || "Untitled Document"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {accessData.downloadEnabled && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn-outline btn-sm flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Fallback File Viewer */}
        <div className="flex-1 p-4">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">View Document</h2>
              <p className="text-gray-600 mb-6">
                Click the button below to download or open the document
              </p>
              <div className="flex items-center justify-center space-x-4">
                {accessData.downloadEnabled && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="btn-primary btn-lg flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Document
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
