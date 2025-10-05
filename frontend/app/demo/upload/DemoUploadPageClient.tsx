"use client";

import { calculatePercentage, formatFileSize, getProgressColor } from "@/utils/formatters";
import { AlertCircle, CheckCircle, FileText, RefreshCw, Upload, X } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface UploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string | null;
  uploadedId?: number;
}

export default function DemoUploadPageClient() {
  const { isSignedIn } = useAuth();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = Array.from(selectedFiles).map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: "pending",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedFiles = e.dataTransfer.files;
      handleFileSelect(droppedFiles);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const retryFile = (id: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === id ? { ...file, status: "pending", progress: 0, error: null } : file,
      ),
    );
  };

  const startUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    // Mock upload process
    for (const file of files) {
      if (file.status === "pending") {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: "uploading" } : f)),
        );

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress } : f)));
        }

        // Simulate success
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: "success", progress: 100, uploadedId: Math.floor(Math.random() * 1000) }
              : f,
          ),
        );
      }
    }

    setIsUploading(false);
  };

  const clearAll = () => {
    setFiles([]);
  };

  const totalSize = files.reduce((sum, file) => sum + file.file.size, 0);
  const uploadedFiles = files.filter((file) => file.status === "success");
  const errorFiles = files.filter((file) => file.status === "error");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href={isSignedIn ? "/dashboard" : "/demo"} className="flex items-center text-primary-600 hover:text-primary-700">
                <X className="h-5 w-5 mr-2 rotate-45" />
                {isSignedIn ? "Back to Dashboard" : "Back to Demo Dashboard"}
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Demo Upload Page
              </div>
              <Link href="/sign-up" className="btn-primary btn-sm">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Upload Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Demo Mode Banner */}
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
                <h3 className="text-sm font-medium text-blue-800">Demo Mode - File Upload Simulation</h3>
                <p className="text-sm text-blue-700 mt-1">This is a demo upload page. Files are simulated but not actually uploaded.</p>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Upload PDF Files</h2>
              <p className="text-gray-600">Demo mode - files are simulated but not saved</p>
            </div>
            <div className="card-body">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">Drop files here or click to browse</span>
                    <span className="mt-1 block text-sm text-gray-500">PDF files only, up to 10MB each</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    accept=".pdf"
                    className="sr-only"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Files ({files.length})</h3>
                  <div className="flex items-center space-x-3">
                    <button type="button" onClick={clearAll} className="text-sm text-gray-600 hover:text-gray-900">
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={startUpload}
                      disabled={isUploading || files.every((f) => f.status === "success")}
                      className="btn-primary btn-sm"
                    >
                      {isUploading ? "Uploading..." : "Start Upload"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.file.size)}</p>
                        {file.status === "uploading" && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Uploading...</span>
                              <span className="text-gray-900">{file.progress}%</span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(file.progress)}`}
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {file.status === "success" && (
                          <div className="mt-2 flex items-center text-sm text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Upload successful (Demo mode - not saved)
                          </div>
                        )}
                        {file.status === "error" && (
                          <div className="mt-2 flex items-center text-sm text-red-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {file.error || "Upload failed"}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.status === "error" && (
                          <button type="button" onClick={() => retryFile(file.id)} className="text-gray-600 hover:text-gray-900">
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        <button type="button" onClick={() => removeFile(file.id)} className="text-gray-600 hover:text-gray-900">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Demo Stats */}
          <div className="card">
            <div className="card-body">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Upload Real Files?</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  This is a demo upload page. Sign up for free to upload and track your own PDFs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/sign-up" className="btn-primary btn-lg">
                    Start Free Trial
                  </Link>
                  <Link href="/demo" className="btn-outline btn-lg">
                    Back to Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


