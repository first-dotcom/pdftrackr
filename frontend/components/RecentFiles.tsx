"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { FileText, Eye, Calendar, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";

interface File {
  id: number;
  title: string;
  originalName: string;
  size: number;
  createdAt: string;
  viewCount: number;
  shareLinks?: Array<{
    viewCount: number;
    uniqueViewCount: number;
  }>;
}

export default function RecentFiles() {
  const { isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const api = useApi();
  
  // Wait for both auth and user to be loaded
  const isReady = authLoaded && userLoaded;
  
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReady && user) {
      fetchFiles();
    }
  }, [isReady, user]);

  const fetchFiles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await api.files.list({ limit: 5 });

      if (response.success && response.data) {
        setFiles((response.data as any).files);
      } else {
        console.error("Failed to fetch files:", response.error);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
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



  // Show loading state while Clerk is initializing
  if (!isReady) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Recent Files</h3>
        </div>
        <div className="card-body p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={`skeleton-${i}`} className="animate-pulse">
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if user is not authenticated
  if (!user) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Recent Files</h3>
        </div>
        <div className="card-body p-4 sm:p-6">
          <div className="text-center py-8 sm:py-12">
            <FileText className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
            <p className="mt-4 text-sm sm:text-base text-gray-500">Please sign in to view your files.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Recent Files</h3>
        </div>
        <div className="card-body p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={`loading-${i}`} className="animate-pulse">
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h3 className="text-base sm:text-lg font-medium text-gray-900">Recent Files</h3>
        <Link 
          href="/dashboard/files" 
          className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200 hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="card-body p-4 sm:p-6">
        {files.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mb-6">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Get started by uploading your first PDF to share and track.
            </p>
            <Link 
              href="/dashboard/files/upload" 
              className="btn-primary btn-md inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload your first PDF
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {files.map((file) => (
              <div 
                key={file.id} 
                className="group relative bg-white border border-gray-200 rounded-lg p-4 sm:p-6 transition-all duration-200 hover:shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2"
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
                        <Link 
                          href={`/dashboard/files/${file.id}`}
                          className="block w-full"
                        >
                          <h3 className="text-base font-medium text-gray-900 truncate hover:text-primary-600 transition-colors focus:outline-none focus:text-primary-600">
                            {file.title || "Untitled Document"}
                          </h3>
                        </Link>
                        
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
                              <Calendar className="h-4 w-4 mr-1" aria-hidden="true" />
                              {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                            </span>
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
                            <Calendar className="h-4 w-4 mr-1" aria-hidden="true" />
                            {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 sm:mt-0 sm:ml-4">
                        {/* Mobile: Always visible actions */}
                        <div className="sm:hidden flex space-x-2">
                          <Link
                            href={`/dashboard/files/${file.id}`}
                            className="flex items-center justify-center w-10 h-10 text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                            aria-label="View file details"
                          >
                            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                          </Link>
                        </div>

                        {/* Desktop: Hover-visible actions */}
                        <div className="hidden sm:block">
                          <div className="flex space-x-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                            <Link
                              href={`/dashboard/files/${file.id}`}
                              className="flex items-center justify-center w-8 h-8 text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                              aria-label="View file details"
                            >
                              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          </div>
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
    </div>
  );
}
