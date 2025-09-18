"use client";

import PageAnalytics from "@/components/PageAnalytics";
import ShareLinkModal from "@/components/ShareLinkModal";
import SimpleFileStats from "@/components/SimpleFileStats";
import { ToastContainer, useToasts } from "@/components/Toast";
import { useApi } from "@/hooks/useApi";
import type { File as FileType, ShareLink } from "@/shared/types";
import { formatFileSize } from "@/utils/formatters";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Calendar, Download, Eye, FileText, Share2, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Use the shared interfaces instead of custom definitions

export default function FileDetailPage() {
  const params = useParams();
  const router = useRouter();

  const api = useApi();
  const fileId = params.id as string;

  const [file, setFile] = useState<FileType | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [editingShareLink, setEditingShareLink] = useState<ShareLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toasts, removeToast, showSuccess } = useToasts();
  const showSuccessRef = useRef(showSuccess);

  // Update ref when showSuccess changes
  useEffect(() => {
    showSuccessRef.current = showSuccess;
  }, [showSuccess]);

  useEffect(() => {
    if (fileId) {
      fetchFileDetails();
      fetchShareLinks();
    }
  }, [fileId]);

  // Flash success toast after redirect from upload
  useEffect(() => {
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
  }, []); // Empty dependency array - only run once on mount

  const fetchFileDetails = async () => {
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

  const handleDeleteShareLink = async (shareId: string) => {
    if (!confirm("Are you sure you want to delete this share link?")) {
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
      // TODO: Add toast notification - "Link copied to clipboard!"
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

  if (error || !file) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center text-primary-600 hover:text-primary-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Files
        </button>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{error || "File not found"}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          {/* File Info */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {file.title || "Untitled Document"}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleDeleteFile}
                    className="btn-outline btn-sm flex items-center text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="btn-outline btn-sm flex items-center"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-gray-500">Uploaded</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Download className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatFileSize(file.size)}</p>
                    <p className="text-xs text-gray-500">File Size</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                  {shareLinks.map((link) => (
                    <div key={link.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{link.title}</h3>
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
                              className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                              title="Copy link"
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
                        {!link.isActive && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
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
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(file);
                      setShareModalOpen(true);
                    }}
                    className="btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:ring-4 focus:ring-primary-200"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Create Your First Share Link
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Page-by-Page Analytics Section */}
          {file && (
            <div className="border-t pt-8">
              <PageAnalytics
                fileId={parseInt(fileId)}
                totalPages={file.pageCount || Math.max(1, Math.ceil((file.size || 0) / 50000))} // Use real page count, fallback to estimate
              />
            </div>
          )}

          {/* Simple Analytics Section - Show for each share link */}
          {shareLinks.length > 0 && (
            <div className="space-y-8">
              {shareLinks.map((link) => (
                <div key={link.shareId} className="border-t pt-8">
                  <SimpleFileStats shareId={link.shareId} title={link.title} />
                </div>
              ))}
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
          onSuccess={() => {
            fetchShareLinks(); // Refresh share links after creating/editing
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
