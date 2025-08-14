"use client";

import { generateCSRFToken } from "@/utils/security";
import { AlertCircle, CheckCircle, FileText, Upload, X, HardDrive } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { formatFileSize, getProgressColor, calculatePercentage } from "@/utils/formatters";
import type { UserProfile } from "@/shared/types";
import { getFileSizeLimit } from "@/shared/types";

interface UploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string | null;
}

export default function UploadPage() {
  const api = useApi();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.users.profile();

        if (response.success && response.data) {
          setUserProfile(response.data as UserProfile);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchUserProfile();
  }, [api]);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      if (file.type !== "application/pdf") {
        return "Only PDF files are allowed";
      }

      // Check file size against user's plan limit
      if (userProfile) {
        if (file.size > userProfile.quotas.fileSize) {
          return `File size must be less than ${formatFileSize(userProfile.quotas.fileSize)}`;
        }
      } else {
        // Fallback to a reasonable limit while profile is loading
        const fallbackLimit = getFileSizeLimit("free"); // Use free plan limit as fallback
        if (file.size > fallbackLimit) {
          return `File size must be less than ${formatFileSize(fallbackLimit)} (loading plan limits...)`;
        }
      }

      // Check user quotas if available
      if (userProfile) {
        // Check storage quota
        if (userProfile.user.storageUsed + file.size > userProfile.quotas.storage) {
          return `Upload would exceed storage quota (${formatFileSize(
            userProfile.user.storageUsed,
          )} / ${formatFileSize(userProfile.quotas.storage)})`;
        }

        // Check file count quota (if not unlimited)
        if (userProfile.quotas.fileCount !== -1 && userProfile.user.filesCount >= userProfile.quotas.fileCount) {
          return `Upload would exceed file count limit (${userProfile.user.filesCount} / ${userProfile.quotas.fileCount})`;
        }
      }

      return null;
    },
    [userProfile],
  );

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | File[]) => {
      const fileArray = Array.from(selectedFiles);

      if (fileArray.length === 1) {
        const file = fileArray[0];
        const error = validateFile(file);
        const newFile: UploadFile = {
          file,
          id: generateId(),
          status: error ? "error" : "pending",
          progress: 0,
          error,
        };
        setFiles([newFile]);
      } else {
        // For multiple files, add to existing
        const newFiles: UploadFile[] = [];
        for (const file of fileArray) {
          const error = validateFile(file);
          newFiles.push({
            file,
            id: generateId(),
            status: error ? "error" : "pending",
            progress: 0,
            error,
          });
        }
        setFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [generateId, validateFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = e.dataTransfer.files;
      handleFileSelect(droppedFiles);
    },
    [handleFileSelect],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFileSelect(e.target.files);
      }
    },
    [handleFileSelect],
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      // Generate CSRF token
      const csrfToken = generateCSRFToken();
      
      // Set CSRF token as cookie
      document.cookie = `csrfToken=${csrfToken}; path=/; SameSite=Lax`;

      const formData = new FormData();
      formData.append("file", uploadFile.file);
      formData.append("title", uploadFile.file.name.replace(".pdf", ""));

      const response = await api.files.upload(formData);

      if (!response.success) {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || "Upload failed";
        throw new Error(errorMessage);
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  const startUpload = async () => {
    if (files.length === 0) {
      return;
    }

    setIsUploading(true);

    const validFiles = files.filter((f) => f.status === "pending");

    for (const file of validFiles) {
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: "uploading", progress: 0 } : f)),
      );

      try {
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id && f.progress < 90 ? { ...f, progress: f.progress + 10 } : f,
            ),
          );
        }, 200);

        await uploadFile(file);

        clearInterval(progressInterval);
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: "success", progress: 100 } : f)),
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f,
          ),
        );
      }
    }

    setIsUploading(false);

    // Redirect to files page after a short delay if all uploads succeeded
    const allSuccess = files.every((f) => f.status === "success" || f.status === "error");
    const hasSuccess = files.some((f) => f.status === "success");

    if (allSuccess && hasSuccess) {
      setTimeout(() => {
        router.push("/dashboard/files");
      }, 2000);
    }
  };



  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "uploading":
        return (
          <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full" />
        );
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };



  const pendingFiles = files.filter((f) => f.status === "pending").length;
  const successFiles = files.filter((f) => f.status === "success").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Cancel Button - Mobile Responsive */}
      <div className="flex justify-end">
        <button 
          type="button" 
          onClick={() => router.back()} 
          className="btn-outline btn-md w-full sm:w-auto flex items-center justify-center"
        >
          Cancel
        </button>
      </div>

      {/* Upload Area - Modern Card Styling */}
      <div className="card">
        <div className="card-body p-4 sm:p-6">
          {/* Quota Status - Modern Progress Bar Design */}
          {userProfile && (
            <div className="mb-6 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 flex items-center">
                <HardDrive className="h-5 w-5 mr-2 text-gray-500" />
                Current Usage
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Storage</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatFileSize(userProfile.user.storageUsed)} / {formatFileSize(userProfile.quotas.storage)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ease-out ${getProgressColor(
                        calculatePercentage(userProfile.user.storageUsed, userProfile.quotas.storage)
                      )}`}
                      style={{
                        width: `${Math.min(
                          calculatePercentage(userProfile.user.storageUsed, userProfile.quotas.storage),
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {calculatePercentage(userProfile.user.storageUsed, userProfile.quotas.storage).toFixed(1)}% used
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Files</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {userProfile.user.filesCount} / {userProfile.quotas.fileCount === -1 ? "∞" : userProfile.quotas.fileCount}
                    </span>
                  </div>
                  {userProfile.quotas.fileCount !== -1 && (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${getProgressColor(
                            calculatePercentage(userProfile.user.filesCount, userProfile.quotas.fileCount)
                          )}`}
                          style={{
                            width: `${Math.min(
                              calculatePercentage(userProfile.user.filesCount, userProfile.quotas.fileCount),
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {calculatePercentage(userProfile.user.filesCount, userProfile.quotas.fileCount).toFixed(1)}% used
                      </p>
                    </>
                  )}
                </div>
              </div>
              {calculatePercentage(userProfile.user.storageUsed, userProfile.quotas.storage) > 80 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    You're running low on storage space
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Modern Drag & Drop Zone */}
          <div
            className={`group relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all duration-300 ease-out ${
              isDragging
                ? "border-primary-400 bg-primary-50 shadow-lg scale-[1.02]"
                : "border-gray-300 hover:border-primary-300 hover:bg-gray-50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="relative">
              <Upload className={`mx-auto h-12 w-12 transition-colors duration-300 ${
                isDragging ? "text-primary-500" : "text-gray-400 group-hover:text-primary-500"
              }`} />
              <div className="mt-4 space-y-2">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary-600 font-semibold hover:text-primary-700 transition-colors text-base sm:text-lg">
                    Click to upload
                  </span>
                  <span className="text-gray-500 text-sm sm:text-base"> or drag and drop</span>
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".pdf"
                  multiple
                  onChange={handleFileInput}
                />
              </div>
              <p className="text-sm text-gray-500 mt-3">PDF files only, up to {formatFileSize(getFileSizeLimit("free"))} each</p>
            </div>
          </div>
        </div>
      </div>

      {/* Files List - Modern Card Styling */}
      {files.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">
              Files to Upload ({files.length})
            </h3>
          </div>
          <div className="card-body p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {files.map((file) => (
                <div 
                  key={file.id} 
                  className="group relative bg-white border border-gray-200 rounded-lg p-4 sm:p-6 transition-all duration-200 hover:shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2"
                >
                  <div className="flex items-start space-x-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                        {getStatusIcon(file.status)}
                      </div>
                    </div>

                    {/* File Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          {/* File Name */}
                          <h3 className="text-base font-medium text-gray-900 truncate">
                            {file.file.name}
                          </h3>
                          
                          {/* File Metadata - Mobile */}
                          <div className="mt-2 sm:hidden space-y-1">
                            <div className="text-sm text-gray-600 font-medium">
                              {formatFileSize(file.file.size)}
                            </div>
                          </div>

                          {/* File Metadata - Desktop */}
                          <div className="hidden sm:flex sm:items-center sm:space-x-6 sm:mt-2 text-sm text-gray-500">
                            <span className="font-medium">{formatFileSize(file.file.size)}</span>
                          </div>

                          {/* Progress Bar - Modern Linear/Stripe Style */}
                          {file.status === "uploading" && (
                            <div className="mt-3 sm:mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                                <span className="text-sm text-gray-500">{Math.round(file.progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300 ease-out shadow-sm"
                                  style={{
                                    width: `${Math.min(file.progress, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Error Message - Modern Styling */}
                          {file.error && (
                            <div className="mt-3 sm:mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-700 flex items-start">
                                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                {file.error}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 sm:mt-0 sm:ml-4">
                          {/* Mobile: Always visible actions */}
                          <div className="sm:hidden flex space-x-2">
                            {file.status !== "uploading" && (
                              <button
                                type="button"
                                onClick={() => removeFile(file.id)}
                                className="flex items-center justify-center w-10 h-10 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                aria-label="Remove file"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            )}
                          </div>

                          {/* Desktop: Hover-visible actions */}
                          <div className="hidden sm:block">
                            <div className={`flex space-x-2 transition-opacity duration-200 ${file.status !== "uploading" ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                              <button
                                type="button"
                                onClick={() => removeFile(file.id)}
                                className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                aria-label="Remove file"
                              >
                                <X className="h-4 w-4" />
                              </button>
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
      )}

      {/* Upload Actions - Mobile Responsive */}
      {files.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            {successFiles > 0 && (
              <span className="text-green-600 mr-4 font-medium">✓ {successFiles} uploaded successfully</span>
            )}
            {pendingFiles > 0 && <span className="font-medium">{pendingFiles} files ready to upload</span>}
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => setFiles([])}
              className="btn-outline btn-md w-full sm:w-auto"
              disabled={isUploading}
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={startUpload}
              disabled={pendingFiles === 0 || isUploading}
              className="btn-primary btn-md w-full sm:w-auto flex items-center justify-center"
            >
              {isUploading ? "Uploading..." : `Upload ${pendingFiles} Files`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
