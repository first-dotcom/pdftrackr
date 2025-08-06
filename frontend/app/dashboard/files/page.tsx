"use client";

import ShareLinkModal from "@/components/ShareLinkModal";
import { config } from "@/lib/config";
import { useAuth, useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { Download, Edit, Eye, FileText, Plus, Search, Share, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { File } from "../../../../shared/types";
import { useApi } from "@/hooks/useApi";

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Add proper loading states for Clerk
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const api = useApi();

  // Wait for both auth and user to be loaded
  const isReady = authLoaded && userLoaded;

  useEffect(() => {
    if (isReady && user) {
      fetchFiles();
    }
  }, [isReady, user]);

  const fetchFiles = async () => {
    try {
      const response = await api.files.list();
      if (response.success && response.data) {
        setFiles((response.data as any).items || []);
      } else {
        console.error("Failed to fetch files:", response.error);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareClick = (file: File) => {
    setSelectedFile(file);
    setShareModalOpen(true);
  };

  const handleShareSuccess = () => {
    fetchFiles();
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await api.files.delete(fileId);
      if (response.success) {
        fetchFiles();
      } else {
        console.error("Failed to delete file:", response.error);
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  const handleDownloadFile = async (file: File) => {
    try {
      const token = await getToken();
      const response = await fetch(`${config.api.url}/api/files/${file.id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.title || "document.pdf";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Failed to download file:", response.status);
      }
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const handleEditFile = (_file: File) => {};

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const getActiveShareLinks = (shareLinks: Array<{ isActive: boolean }> = []) => {
    return shareLinks.filter((link) => link.isActive).length;
  };

  const filteredFiles = files.filter((file) =>
    file.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Show loading state while Clerk is initializing
  if (!isReady) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-body">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={`skeleton-${i}`} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                    </div>
                    <div className="w-20 h-4 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-body text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Authentication Required</h3>
            <p className="mt-1 text-sm text-gray-500">Please sign in to view your files.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Upload - Mobile Optimized */}
      <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
        <div className="flex-1 sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search files..."
              className="input pl-10 w-full h-12 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Link 
            href="/dashboard/files/upload" 
            className="btn-primary btn-lg w-full sm:w-auto flex items-center justify-center touch-manipulation"
          >
            <Plus className="h-5 w-5 mr-2" />
            Upload PDF
          </Link>
        </div>
      </div>

      {/* Files List */}
      <div className="card">
        {loading ? (
          <div className="card-body">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={`loading-${i}`} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                    </div>
                    <div className="w-20 h-4 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="card-body text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {files.length === 0 ? "No files uploaded" : "No files found"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {files.length === 0
                ? "Get started by uploading your first PDF file."
                : "Try adjusting your search terms."}
            </p>
            {files.length === 0 && (
              <div className="mt-6">
                <Link href="/dashboard/files/upload" className="btn-primary btn-md">
                  Upload your first PDF
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredFiles.map((file) => (
              <div key={file.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                {/* Mobile-first responsive layout */}
                <div className="flex items-start space-x-4">
                  {/* File icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                  </div>

                  {/* File details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/files/${file.id}`}
                          className="text-base font-medium text-gray-900 hover:text-primary-600 transition-colors block truncate touch-manipulation"
                        >
                          {file.title || "Untitled Document"}
                        </Link>
                        
                        {/* Mobile: stacked info */}
                        <div className="mt-2 flex flex-col space-y-1 text-sm text-gray-500 sm:hidden">
                          <div>{formatFileSize(file.size)}</div>
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {file.viewCount || 0} views
                            </span>
                            <span className="flex items-center">
                              <Share2 className="h-4 w-4 mr-1" />
                              {getActiveShareLinks(file.shareLinks)} links
                            </span>
                          </div>
                          <div>
                            {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                          </div>
                        </div>

                        {/* Desktop: horizontal info */}
                        <div className="hidden sm:flex sm:items-center sm:space-x-6 sm:mt-2 text-sm text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {file.viewCount || 0} views
                          </span>
                          <span className="flex items-center">
                            <Share2 className="h-4 w-4 mr-1" />
                            {getActiveShareLinks(file.shareLinks)} links
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      {/* Actions - responsive */}
                      <div className="mt-4 sm:mt-0 sm:ml-4">
                        {/* Mobile: horizontal scroll */}
                        <div className="flex space-x-2 sm:space-x-1 overflow-x-auto pb-2 sm:pb-0">
                          <button
                            type="button"
                            onClick={() => handleShareClick(file)}
                            className="flex-shrink-0 p-3 sm:p-2 text-primary-600 hover:text-primary-900 rounded-lg hover:bg-primary-50 touch-manipulation transition-colors"
                            title="Create share link"
                          >
                            <Share className="h-5 w-5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(file)}
                            className="flex-shrink-0 p-3 sm:p-2 text-green-600 hover:text-green-900 rounded-lg hover:bg-green-50 touch-manipulation transition-colors"
                            title="Download file"
                          >
                            <Download className="h-5 w-5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditFile(file)}
                            className="flex-shrink-0 p-3 sm:p-2 text-blue-600 hover:text-blue-900 rounded-lg hover:bg-blue-50 touch-manipulation transition-colors"
                            title="Edit file"
                          >
                            <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
                          </button>
                          <Link
                            href={`/dashboard/files/${file.id}`}
                            className="flex-shrink-0 p-3 sm:p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 touch-manipulation transition-colors"
                            title="View file details"
                          >
                            <Eye className="h-5 w-5 sm:h-4 sm:w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file.id)}
                            className="flex-shrink-0 p-3 sm:p-2 text-red-600 hover:text-red-900 rounded-lg hover:bg-red-50 touch-manipulation transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Link Modal */}
      {selectedFile && (
        <ShareLinkModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedFile(null);
          }}
          file={selectedFile}
          onSuccess={handleShareSuccess}
        />
      )}
    </div>
  );
}
