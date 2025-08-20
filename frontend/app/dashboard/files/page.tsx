"use client";

import ShareLinkModal from "@/components/ShareLinkModal";
import SkeletonLoader from "@/components/SkeletonLoader";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastContainer, useToasts } from "@/components/Toast";
import { config } from "@/lib/config";
import { useAuth, useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  FileText, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Share, 
  Share2, 
  Trash2,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import type { File } from "@/shared/types";
import { useApi } from "@/hooks/useApi";
import { formatFileSize } from "@/utils/formatters";

const FILES_PER_PAGE = 20;

interface FileCardProps {
  file: File;
  onShare: (file: File) => void;
  onDelete: (fileId: number) => void;
  onView: (fileId: number) => void;
  isDeleting?: boolean;
  isSharing?: boolean;
}

// Memoized File Card Component for performance
const FileCard = React.memo(function FileCard({ 
  file, 
  onShare, 
  onDelete, 
  onView, 
  isDeleting = false,
  isSharing = false 
}: FileCardProps) {
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);



  const getActiveShareLinks = useCallback((shareLinks: Array<{ isActive: boolean }> = []) => {
    return shareLinks.filter((link) => link.isActive).length;
  }, []);

  const formatDate = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return "Unknown date";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.warn("Failed to parse date:", dateString, error);
      return "Invalid date";
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className="group relative bg-white border border-gray-200 rounded-lg p-4 sm:p-6 transition-all duration-200 hover:shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      tabIndex={0}
      role="article"
      aria-label={`File: ${file.title || "Untitled Document"}`}
    >
      <div className="flex items-start space-x-4">
        {/* File Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex items-center justify-center border border-red-200">
            <FileText className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
        </div>

        {/* File Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              {/* File Title */}
              <button
                onClick={() => onView(file.id)}
                className="text-left w-full"
                onKeyDown={(e) => handleKeyDown(e, () => onView(file.id))}
                disabled={isDeleting || isSharing}
              >
                <h3 className="text-base font-medium text-gray-900 truncate hover:text-primary-600 transition-colors focus:outline-none focus:text-primary-600">
                  {file.title || "Untitled Document"}
                </h3>
              </button>
              
              {/* File Metadata - Mobile */}
              <div className="mt-2 sm:hidden space-y-1">
                <div className="text-sm text-gray-600 font-medium">
                  {formatFileSize(file.size)}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                    {file.viewCount || 0} views
                  </span>
                  <span className="flex items-center">
                    <Share2 className="h-4 w-4 mr-1" aria-hidden="true" />
                    {getActiveShareLinks(file.shareLinks)} links
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(file.createdAt)}
                </div>
              </div>

              {/* File Metadata - Desktop */}
              <div className="hidden sm:flex sm:items-center sm:space-x-6 sm:mt-2 text-sm text-gray-500">
                <span className="font-medium">{formatFileSize(file.size)}</span>
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                  {file.viewCount || 0} views
                </span>
                <span className="flex items-center">
                  <Share2 className="h-4 w-4 mr-1" aria-hidden="true" />
                  {getActiveShareLinks(file.shareLinks)} links
                </span>
                <span>
                  {formatDate(file.createdAt)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 sm:mt-0 sm:ml-4">
              {/* Mobile: Always visible actions */}
              <div className="sm:hidden flex space-x-2">
                <button
                  type="button"
                  onClick={() => onShare(file)}
                  disabled={isSharing || isDeleting}
                  className="flex items-center justify-center w-12 h-12 text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  aria-label="Create share link"
                  onKeyDown={(e) => handleKeyDown(e, () => onShare(file))}
                >
                  {isSharing ? (
                    <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Share className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(file.id)}
                  disabled={isDeleting || isSharing}
                  className="flex items-center justify-center w-12 h-12 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  aria-label="Delete file"
                  onKeyDown={(e) => handleKeyDown(e, () => onDelete(file.id))}
                >
                  {isDeleting ? (
                    <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Desktop: Hover-visible actions */}
              <div className="hidden sm:block">
                <div className={`flex space-x-2 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button
                    type="button"
                    onClick={() => onShare(file)}
                    disabled={isSharing || isDeleting}
                    className="flex items-center justify-center w-8 h-8 text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Create share link"
                    onKeyDown={(e) => handleKeyDown(e, () => onShare(file))}
                  >
                    {isSharing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Share className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(file.id)}
                    disabled={isDeleting || isSharing}
                    className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Delete file"
                    onKeyDown={(e) => handleKeyDown(e, () => onDelete(file.id))}
                  >
                    {isDeleting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Pagination Component
function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void; 
}) {
  if (totalPages <= 1) return null;

  const handleKeyDown = (e: React.KeyboardEvent, page: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPageChange(page);
    }
  };

  return (
    <nav 
      className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6"
      aria-label="Pagination"
    >
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] touch-manipulation"
          aria-label="Previous page"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] touch-manipulation"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center justify-center rounded-l-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] touch-manipulation"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center justify-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] touch-manipulation ${
                    page === currentPage
                      ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                  aria-label={`Page ${page}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center justify-center rounded-r-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] touch-manipulation"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </nav>
  );
}

// Loading Skeleton for File Cards
function FileCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="space-y-2 sm:hidden">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="hidden sm:flex sm:items-center sm:space-x-6 sm:mt-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4">
              <div className="sm:hidden flex space-x-2">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="hidden sm:flex sm:space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error State Component
function ErrorState({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry: () => void; 
}) {
  return (
    <div className="text-center py-12 sm:py-16">
      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mb-6">
        <FileText className="h-12 w-12 text-red-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Failed to load files
      </h3>
      <p className="text-gray-500 mb-8 max-w-sm mx-auto">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="btn-primary btn-lg inline-flex items-center"
      >
        <RefreshCw className="h-5 w-5 mr-2" aria-hidden="true" />
        Try Again
      </button>
    </div>
  );
}

// Empty State Component
function EmptyState({ hasFiles, onUpload }: { hasFiles: boolean; onUpload: () => void }) {
  return (
    <div className="text-center py-12 sm:py-16">
      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mb-6">
        <FileText className="h-12 w-12 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {hasFiles ? "No files found" : "No files uploaded yet"}
      </h3>
      <p className="text-gray-500 mb-8 max-w-sm mx-auto">
        {hasFiles 
          ? "Try adjusting your search terms to find what you're looking for."
          : "Get started by uploading your first PDF file to share and track."
        }
      </p>
      {!hasFiles && (
        <button
          onClick={onUpload}
          className="btn-primary btn-lg inline-flex items-center min-h-[44px] touch-manipulation"
        >
          <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
          <span className="hidden xs:inline">Upload your first PDF</span>
          <span className="xs:hidden">Upload PDF</span>
        </button>
      )}
    </div>
  );
}

// Proper debounce hook implementation
function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => func(...args), delay);
    },
    [func, delay]
  ) as T;
}

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState<Set<number>>(new Set());
  const [sharingFiles, setSharingFiles] = useState<Set<number>>(new Set());

  const { isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const api = useApi();
  const { toasts, removeToast, showError, showSuccess } = useToasts();
  const showSuccessRef = useRef(showSuccess);

  // Update ref when showSuccess changes
  useEffect(() => {
    showSuccessRef.current = showSuccess;
  }, [showSuccess]);

  const isReady = authLoaded && userLoaded;
  const totalPages = Math.ceil(totalFiles / FILES_PER_PAGE);

  // Stable references to prevent infinite loops
  const stableShowError = useCallback((title: string, message?: string) => {
    showError(title, message);
  }, [showError]);

  const stableShowSuccess = useCallback((title: string, message?: string) => {
    showSuccess(title, message);
  }, [showSuccess]);

  // Fetch files with pagination - FIXED: Remove from dependencies to prevent infinite loop
  const fetchFiles = useCallback(async (page = 1, search = searchTerm) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const response = await api.files.list({ 
        page: page, 
        limit: FILES_PER_PAGE 
      });
      
      if (response.success && response.data) {
        const data = response.data as any;
        setFiles(data.items || []);
        setTotalFiles(data.total || data.items?.length || 0);
      } else {
        const errorMessage = typeof response.error === 'string' ? response.error : "Failed to load files";
        setError(errorMessage);
        stableShowError("Failed to load files", errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load files";
      setError(errorMessage);
      stableShowError("Failed to load files", errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [api, stableShowError]); // FIXED: Remove searchTerm and showError from dependencies

  // FIXED: Remove fetchFiles from dependencies to prevent infinite loop
  useEffect(() => {
    if (isReady && user) {
      fetchFiles(currentPage);
    }
  }, [isReady, user, currentPage]); // FIXED: Removed fetchFiles from dependencies

  // Flash success toast after redirect from upload
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pdftrackr:flash");
      if (raw) {
        const flash = JSON.parse(raw) as { type: string; title: string; message?: string; ts?: number };
        sessionStorage.removeItem("pdftrackr:flash");
        if (flash?.title) {
          showSuccessRef.current(flash.title, flash.message);
        }
      }
    } catch {}
  }, []); // Empty dependency array - only run once on mount

  // FIXED: Create stable debounced search function
  const debouncedSearch = useMemo(
    () => {
      const debouncedFn = (search: string) => {
        setCurrentPage(1);
        fetchFiles(1, search);
      };
      
      let timeoutId: NodeJS.Timeout;
      return (search: string) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => debouncedFn(search), 300);
      };
    },
    [fetchFiles] // Only depend on fetchFiles, not searchTerm
  );

  // FIXED: Handle search term changes directly in onChange, not in useEffect
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleShareClick = useCallback(async (file: File) => {
    setSharingFiles(prev => new Set(prev).add(file.id));
    
    try {
      setSelectedFile(file);
      setShareModalOpen(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to open share modal";
      stableShowError("Share failed", errorMessage);
    } finally {
      setSharingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  }, [stableShowError]);

  const handleShareSuccess = useCallback(() => {
    fetchFiles(currentPage);
    stableShowSuccess("Share link created successfully");
  }, [fetchFiles, currentPage, stableShowSuccess]);

  const handleDeleteFile = useCallback(async (fileId: number) => {
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      return;
    }

    setDeletingFiles(prev => new Set(prev).add(fileId));

    try {
      const response = await api.files.delete(fileId);
      if (response.success) {
        await fetchFiles(currentPage);
        stableShowSuccess("File deleted successfully");
      } else {
        const errorMessage = typeof response.error === 'string' ? response.error : "Failed to delete file";
        stableShowError("Delete failed", errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete file";
      stableShowError("Delete failed", errorMessage);
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  }, [api, fetchFiles, currentPage, stableShowError, stableShowSuccess]);

  const handleViewFile = useCallback((fileId: number) => {
    window.location.href = `/dashboard/files/${fileId}`;
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Announce page change to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Page ${page} of ${totalPages}`;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }, [totalPages]);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchFiles(currentPage);
  }, [fetchFiles, currentPage]);

  const filteredFiles = useMemo(() => 
    files.filter((file) =>
      file.title?.toLowerCase().includes(searchTerm.toLowerCase()),
    ), [files, searchTerm]
  );

  // Show loading state while Clerk is initializing
  if (!isReady) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <FileCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="card">
          <EmptyState hasFiles={false} onUpload={() => {}} />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header with Search and Upload */}
        <div className="space-y-4 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
          <div className="flex-1 sm:max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search files..."
                className="input pl-10 w-full h-12 text-base"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label="Search files"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Link 
              href="/dashboard/files/upload" 
              className="btn-primary btn-lg w-full sm:w-auto flex items-center justify-center min-h-[44px]"
            >
              <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
              <span className="hidden xs:inline">Upload PDF</span>
              <span className="xs:hidden">Upload</span>
            </Link>
          </div>
        </div>

        {/* Files List */}
        <div className="card">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <FileCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState error={error} onRetry={handleRetry} />
          ) : filteredFiles.length === 0 ? (
            <EmptyState 
              hasFiles={files.length > 0} 
              onUpload={() => window.location.href = '/dashboard/files/upload'} 
            />
          ) : (
            <>
              <div className="space-y-4">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onShare={handleShareClick}
                    onDelete={handleDeleteFile}
                    onView={handleViewFile}
                    isDeleting={deletingFiles.has(file.id)}
                    isSharing={sharingFiles.has(file.id)}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
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

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </ErrorBoundary>
  );
}
