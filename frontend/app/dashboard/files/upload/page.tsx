"use client";

import { config } from "@/lib/config";
import { generateCSRFToken } from "@/utils/security";
import { useAuth } from "@clerk/nextjs";
import { AlertCircle, CheckCircle, FileText, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";

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
  const [userQuotas, setUserQuotas] = useState<{
    storageUsed: number;
    storageQuota: number;
    filesCount: number;
    filesQuota: number;
  } | null>(null);
  const router = useRouter();
  const { getToken } = useAuth();

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Fetch user quotas on component mount
  useEffect(() => {
    const fetchUserQuotas = async () => {
      try {
        const response = await api.users.profile();

        if (response.success && response.data) {
          const userData = (response.data as any).user;
          const quotas = (response.data as any).quotas;
          setUserQuotas({
            storageUsed: userData.storageUsed,
            storageQuota: quotas.storage,
            filesCount: userData.filesCount,
            filesQuota: quotas.fileCount,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user quotas:", error);
      }
    };

    fetchUserQuotas();
  }, [api]);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      if (file.type !== "application/pdf") {
        return "Only PDF files are allowed";
      }

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return "File size must be less than 10MB";
      }

      // Check user quotas if available
      if (userQuotas) {
        // Check storage quota
        if (userQuotas.storageUsed + file.size > userQuotas.storageQuota) {
          return `Upload would exceed storage quota (${formatFileSize(
            userQuotas.storageUsed,
          )} / ${formatFileSize(userQuotas.storageQuota)})`;
        }

        // Check file count quota (if not unlimited)
        if (userQuotas.filesQuota !== -1 && userQuotas.filesCount >= userQuotas.filesQuota) {
          return `Upload would exceed file count limit (${userQuotas.filesCount} / ${userQuotas.filesQuota})`;
        }
      }

      return null;
    },
    [userQuotas],
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
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
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
    <div className="space-y-6">
      <div className="flex justify-end">
        <button type="button" onClick={() => router.back()} className="btn-outline btn-md">
          Cancel
        </button>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div className="card-body">
          {/* Quota Status */}
          {userQuotas && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Current Usage</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Storage</span>
                    <span className="text-gray-900">
                      {formatFileSize(userQuotas.storageUsed)} /{" "}
                      {formatFileSize(userQuotas.storageQuota)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (userQuotas.storageUsed / userQuotas.storageQuota) * 100 > 80
                          ? "bg-red-500"
                          : (userQuotas.storageUsed / userQuotas.storageQuota) * 100 > 60
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (userQuotas.storageUsed / userQuotas.storageQuota) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Files</span>
                    <span className="text-gray-900">
                      {userQuotas.filesCount} /{" "}
                      {userQuotas.filesQuota === -1 ? "∞" : userQuotas.filesQuota}
                    </span>
                  </div>
                  {userQuotas.filesQuota !== -1 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          (userQuotas.filesCount / userQuotas.filesQuota) * 100 > 80
                            ? "bg-red-500"
                            : (userQuotas.filesCount / userQuotas.filesQuota) * 100 > 60
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            (userQuotas.filesCount / userQuotas.filesQuota) * 100,
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              {(userQuotas.storageUsed / userQuotas.storageQuota) * 100 > 80 && (
                <p className="text-xs text-red-600 mt-2">⚠️ You're running low on storage space</p>
              )}
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary-400 bg-primary-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary-600 font-medium hover:text-primary-500">
                  Click to upload
                </span>
                <span className="text-gray-500"> or drag and drop</span>
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
            <p className="text-sm text-gray-500 mt-2">PDF files only, up to 10MB each</p>
          </div>
        </div>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Files to Upload ({files.length})</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">{getStatusIcon(file.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.file.name}
                        </p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.file.size)}</p>
                      </div>
                      {file.status !== "uploading" && (
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {file.status === "uploading" && (
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              file.progress > 0 ? "bg-primary-600" : "bg-gray-300"
                            }`}
                            style={{
                              width: `${Math.min(file.progress, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {file.error && <p className="text-sm text-red-600 mt-1">{file.error}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {successFiles > 0 && (
              <span className="text-green-600 mr-4">✓ {successFiles} uploaded successfully</span>
            )}
            {pendingFiles > 0 && <span>{pendingFiles} files ready to upload</span>}
          </div>
          <div className="space-x-4">
            <button
              type="button"
              onClick={() => setFiles([])}
              className="btn-outline btn-md"
              disabled={isUploading}
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={startUpload}
              disabled={pendingFiles === 0 || isUploading}
              className="btn-primary btn-md"
            >
              {isUploading ? "Uploading..." : `Upload ${pendingFiles} Files`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
