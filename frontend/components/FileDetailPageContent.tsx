"use client";

import PageAnalytics from "@/components/PageAnalytics";
import ShareLinkModal from "@/components/ShareLinkModal";
import SimpleFileStats from "@/components/SimpleFileStats";
import { ToastContainer, useToasts } from "@/components/Toast";
import { useApi } from "@/hooks/useApi";
import type { File as FileType, ShareLink, AggregateAnalytics, PaginatedSessionsResponse } from "@/shared/types";
import { formatFileSize } from "@/utils/formatters";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Calendar, Download, Eye, FileText, Share2, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface FileDetailPageContentProps {
  // Demo mode props
  isDemo?: boolean;
  mockFile?: any;
  mockShareLinks?: any[];
  mockAggregate?: AggregateAnalytics | null;
  mockIndividual?: PaginatedSessionsResponse | null;
}

export default function FileDetailPageContent({ 
  isDemo = false, 
  mockFile, 
  mockShareLinks, 
  mockAggregate, 
  mockIndividual 
}: FileDetailPageContentProps) {
  const params = useParams();
  const router = useRouter();

  const api = useApi();
  const fileId = params.id as string;

  const [file, setFile] = useState<FileType | null>(mockFile || null);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>(mockShareLinks || []);
  const [loading, setLoading] = useState(!isDemo);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [editingShareLink, setEditingShareLink] = useState<ShareLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toasts, removeToast, showSuccess } = useToasts();
  const showSuccessRef = useRef(showSuccess);
  const [quickShareLoading, setQuickShareLoading] = useState(false);

  // Update ref when showSuccess changes
  useEffect(() => {
    showSuccessRef.current = showSuccess;
  }, [showSuccess]);

  useEffect(() => {
    if (isDemo) {
      // Demo mode - data is already set via props
      setLoading(false);
      return;
    }

    if (fileId) {
      fetchFileDetails();
      fetchShareLinks();
    }
  }, [fileId, isDemo]);

  // Update file state when mockFile prop changes (for demo mode)
  useEffect(() => {
    if (isDemo && mockFile) {
      setFile(mockFile);
      setLoading(false);
    }
  }, [isDemo, mockFile]);

  // Flash success toast after redirect from upload (only for real mode)
  useEffect(() => {
    if (isDemo) return;
    
    try {
      const raw = sessionStorage.getItem("pdftrackr:flash");
      if (raw) {
        const flash = JSON.parse(raw) as {
          type: string;
          title: string;
          message?: string;
          ts?: number;
        };
        sessionStorage.removeItem("pdftrackr:flash");
        if (flash?.title) {
          showSuccessRef.current(flash.title, flash.message);
        }
      }
    } catch {}
  }, [isDemo]);

  const fetchFileDetails = async () => {
    if (isDemo) return;
    
    try {
      const response = await api.files.get(parseInt(fileId));

      if (response.success && response.data) {
        setFile((response.data as any).file);
      } else {
        setError("File not found");
      }
    } catch (err) {
      console.error("Failed to fetch file details:", err);
      setError("Failed to load file details");
    }
  };

  const fetchShareLinks = async () => {
    if (isDemo) return;
    
    try {
      const response = await api.shareLinks.list(parseInt(fileId));

      if (response.success && response.data) {
        setShareLinks((response.data as any).shareLinks);
      }
    } catch (err) {
      console.error("Failed to fetch share links:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShareLink = async (shareId: string, isActive: boolean) => {
    if (isDemo) {
      // Mock toggle functionality - show feedback but don't persist
      setShareLinks(prev => prev.map(link => 
        link.shareId === shareId ? { ...link, isActive } : link
      ));
      showSuccessRef.current(`Demo mode - Share link ${isActive ? 'enabled' : 'disabled'} (Not saved in demo)`);
      return;
    }

    try {
      const response = await api.shareLinks.update(shareId, { isActive });

      if (response.success) {
        fetchShareLinks(); // Refresh share links
      } else {
        console.error("Failed to toggle share link:", response.error);
      }
    } catch (error) {
      console.error("Failed to toggle share link:", error);
    }
  };

  const handleEditShareLink = (link: ShareLink) => {
    setEditingShareLink(link);
    setSelectedFile(file);
    setShareModalOpen(true);
  };

  const handleQuickShare = async () => {
    if (!file) return;
    
    setQuickShareLoading(true);
    try {
      if (isDemo) {
        // Mock quick share creation - show success but don't persist
        const newShareLink: ShareLink = {
          id: Date.now(),
          fileId: file.id,
          shareId: `${file.id}-quick-${Date.now()}`,
          title: `${file.title} - Quick Share`,
          description: null,
          password: null,
          viewCount: 0,
          uniqueViewCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          emailGatingEnabled: false,
          downloadEnabled: true,
          watermarkEnabled: false,
          maxViews: null,
          expiresAt: null,
        };
        
        setShareLinks(prev => [...prev, newShareLink]);
        showSuccessRef.current("Demo mode - Share link created! (Not saved in demo)");
        return;
      }

      const payload = {
        fileId: file.id,
        title: `${file.title || file.originalName} - Shared`,
        emailGatingEnabled: false,
        downloadEnabled: true,
        watermarkEnabled: false,
      };

      const response = await api.shareLinks.create(payload);
      
      if (response.success) {
        // Refresh share links to show the new one
        await fetchShareLinks();
        showSuccessRef.current("Share link created successfully!");
      } else {
        console.error("API Error:", response.error);
        const errorMessage = 
          typeof response.error === "string" 
            ? response.error 
            : "Failed to create share link";
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Failed to create quick share link:", error);
      alert("Failed to create share link");
    } finally {
      setQuickShareLoading(false);
    }
  };

  const handleDeleteShareLink = async (shareId: string) => {
    if (!confirm("Are you sure you want to delete this share link?")) {
      return;
    }

    if (isDemo) {
      // Mock delete functionality - show feedback but don't persist
      setShareLinks(prev => prev.filter(link => link.shareId !== shareId));
      showSuccessRef.current("Demo mode - Share link deleted (Not saved in demo)");
      return;
    }

    try {
      const response = await api.shareLinks.delete(shareId);
      if (response.success) {
        // Just refresh the entire page - simple and effective
        window.location.reload();
      } else {
        console.error("Failed to delete share link:", response.error);
      }
    } catch (error) {
      console.error("Failed to delete share link:", error);
    }
  };

  const handleDeleteFile = async () => {
    if (!file) return;
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      return;
    }

    if (isDemo) {
      showSuccessRef.current("Demo mode - File deletion not allowed in demo");
      return;
    }

    try {
      const response = await api.files.delete(file.id);
      if (response.success) {
        try {
          sessionStorage.setItem(
            "pdftrackr:flash",
            JSON.stringify({
              type: "success",
              title: "File deleted successfully",
              message: file.title ? `\"${file.title}\" was deleted` : undefined,
              ts: Date.now(),
            }),
          );
        } catch {}
        router.push("/dashboard/files");
      } else {
        console.error("Failed to delete file:", response.error);
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  const handleCopyLink = async (shareId: string) => {
    try {
      const url = `${window.location.origin}/view/${shareId}`;
      await navigator.clipboard.writeText(url);
      showSuccessRef.current("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // (debug logs removed for production)

  if (error || !file) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center text-primary-600 hover:text-primary-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isDemo ? "Back to Demo Dashboard" : "Back to Files"}
        </button>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {isDemo ? "Demo file not found" : (error || "File not found")}
          </h3>
          {isDemo && (
            <p className="mt-2 text-sm text-gray-500">
              The demo file you're looking for doesn't exist. Try one of the demo files from the dashboard.
            </p>
          )}
        </div>
      </div>
    );
  }

  // In demo mode, if no file is loaded yet, show loading
  if (isDemo && !file) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Demo mode
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                You’re viewing a demo with sample data. Changes aren’t saved.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="card-body">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button type="button" onClick={() => router.back()} className="mt-4 btn-outline btn-md">
              Go Back
            </button>
          </div>
        </div>
      ) : file ? (
        <>
          {/* File Info - larger and better spaced */}
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Left: icon + title */}
              <div className="flex items-center min-w-0 flex-1">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-red-200">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="ml-4 text-lg font-semibold text-gray-900 truncate">
                  {file.title || "Untitled Document"}
                </h2>
              </div>

              {/* Middle: chips - desktop only */}
              <div className="hidden lg:flex items-center flex-shrink-0 space-x-3 mx-6">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                  {formatFileSize(file.size)}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                  {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                </span>
                {file.pageCount ? (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                    {file.pageCount} pages
                  </span>
                ) : null}
              </div>

              {/* Right: actions */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title="Back"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                {!isDemo && (
                  <button
                    type="button"
                    onClick={handleDeleteFile}
                    className="w-10 h-10 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
            {/* Mobile chips below title - better spaced */}
            <div className="mt-3 flex lg:hidden items-center flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                {formatFileSize(file.size)}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
              </span>
              {file.pageCount ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                  {file.pageCount} pages
                </span>
              ) : null}
            </div>
          </div>

          {/* Page-by-Page Analytics Section - only when share links exist */}
          {shareLinks.length > 0 && (
            <div className="card">
              <div className="card-body">
                <PageAnalytics
                  fileId={isDemo ? 0 : parseInt(fileId)}
                  totalPages={file.pageCount || Math.max(1, Math.ceil((file.size || 0) / 50000))}
                  mock={isDemo ? { aggregate: mockAggregate, individual: mockIndividual } : undefined}
                />
              </div>
            </div>
          )}

          {/* Share Links */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Share Links</h2>
                {shareLinks.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">{shareLinks.length} total</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(file);
                        setShareModalOpen(true);
                      }}
                      className="btn-primary btn-sm flex items-center"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Create Share Link
                    </button>
                  </div>
                )}
              </div>

              {shareLinks.length > 0 ? (
                <div className="space-y-4">
                  {shareLinks.map((link) => {
                    const hasNoViews = link.viewCount === 0;
                    return (
                      <div 
                        key={link.id} 
                        className={`border rounded-lg p-4 transition-all duration-300 ${
                          hasNoViews ? 'border-primary-200 bg-gradient-to-r from-primary-50/30 to-blue-50/30 animate-border-pulse' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{link.title}</h3>
                              {hasNoViews && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 animate-pulse">
                                  👉 Share this
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              <a
                                href={`/view/${link.shareId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-900"
                              >
                                /view/{link.shareId}
                              </a>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="flex items-center text-sm font-medium text-gray-900">
                                <Eye className="h-4 w-4 mr-1" />
                                {link.viewCount}
                              </div>
                              <div className="text-xs text-gray-500">views</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-900">
                                {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
                              </div>
                              <div className="text-xs text-gray-500">created</div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleCopyLink(link.shareId)}
                                className={`relative p-1 rounded transition-all duration-300 ${
                                  hasNoViews 
                                    ? 'text-primary-600 hover:text-primary-900 bg-primary-100 hover:bg-primary-200 animate-copy-pulse shadow-md hover:shadow-lg' 
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                                title={hasNoViews ? "Copy link and share to get your first view!" : "Copy link"}
                              >
                                {hasNoViews && (
                                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                                  </span>
                                )}
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </button>
                            <button
                              type="button"
                              onClick={() => handleToggleShareLink(link.shareId, !link.isActive)}
                              className={`p-1 rounded ${
                                link.isActive
                                  ? "text-green-600 hover:text-green-900 hover:bg-green-50"
                                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                              }`}
                              title={link.isActive ? "Disable link" : "Enable link"}
                            >
                              {link.isActive ? (
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                  />
                                </svg>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditShareLink(link)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Edit link"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteShareLink(link.shareId)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Delete link"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                            <a
                              href={`/view/${link.shareId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                              title="Open in new tab"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Link details */}
                      <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                        {!link.isActive && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                        {link.emailGatingEnabled && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            Email Required
                          </span>
                        )}
                        {link.downloadEnabled && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                            Download Enabled
                          </span>
                        )}
                        {link.watermarkEnabled && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                            Watermarked
                          </span>
                        )}
                        {link.maxViews && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                            Max {link.maxViews} views
                          </span>
                        )}
                        {link.expiresAt && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800">
                            Expires{" "}
                            {formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg border-2 border-dashed border-primary-200">
                  <div className="mx-auto w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                    <Share2 className="h-10 w-10 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to share?</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                    Create a share link to securely share this document and track who views it.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="button"
                      onClick={handleQuickShare}
                      disabled={quickShareLoading}
                      className="btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:ring-4 focus:ring-primary-200 flex items-center justify-center"
                    >
                      {quickShareLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Share2 className="h-5 w-5 mr-2" />
                          Quick Share
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(file);
                        setShareModalOpen(true);
                      }}
                      className="btn-outline btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:ring-4 focus:ring-primary-200 flex items-center justify-center"
                    >
                      <Share2 className="h-5 w-5 mr-2" />
                      Custom Share
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Simple Analytics Section - Combined across all share links */}
          {shareLinks.length > 0 && (
            <div className="card">
              <div className="card-body">
                <SimpleFileStats
                  shareIds={shareLinks.map((l) => l.shareId)}
                  title={"Analytics of shared links"}
                  mock={isDemo ? {
                    totalViews: shareLinks.reduce((s, l) => s + (l.viewCount || 0), 0),
                    uniqueViewers: shareLinks.reduce((s, l) => s + (l.uniqueViewCount || 0), 0),
                    avgViewTime: (() => {
                      const base = (mockAggregate?.fileStats?.avgSessionTime as number | undefined) ?? 90000;
                      return Math.max(30000, Math.floor(base));
                    })(),
                  } : undefined}
                />
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Share Link Modal */}
      {selectedFile && (
        <ShareLinkModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedFile(null);
          }}
          file={selectedFile as FileType}
          existingShareLink={editingShareLink}
          isDemo={isDemo}
          onSuccess={() => {
            if (!isDemo) {
              fetchShareLinks(); // Refresh share links after creating/editing
            } else {
              showSuccessRef.current("Demo mode - Share link changes not saved");
            }
            setShareModalOpen(false);
            setSelectedFile(null);
            setEditingShareLink(null);
          }}
        />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
