'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { config } from '@/lib/config';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string | null;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { getToken } = useAuth();

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed';
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }
    
    return null;
  };

  const handleFileSelect = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    
    // For single file upload, replace existing files
    if (fileArray.length === 1) {
      const file = fileArray[0];
      const error = validateFile(file);
      const newFile: UploadFile = {
        file,
        id: generateId(),
        status: error ? 'error' : 'pending',
        progress: 0,
        error,
      };
      setFiles([newFile]);
    } else {
      // For multiple files, add to existing
      const newFiles: UploadFile[] = [];
      fileArray.forEach(file => {
        const error = validateFile(file);
        newFiles.push({
          file,
          id: generateId(),
          status: error ? 'error' : 'pending',
          progress: 0,
          error,
        });
      });
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('title', uploadFile.file.name.replace('.pdf', ''));

      const response = await fetch(`${config.api.url}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const startUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    
    const validFiles = files.filter(f => f.status === 'pending');
    
    for (const file of validFiles) {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      try {
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => 
            f.id === file.id && f.progress < 90 
              ? { ...f, progress: f.progress + 10 } 
              : f
          ));
        }, 200);

        await uploadFile(file);
        
        clearInterval(progressInterval);
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'success', progress: 100 } : f
        ));
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error', 
            progress: 0,
            error: error instanceof Error ? error.message : 'Upload failed'
          } : f
        ));
      }
    }

    setIsUploading(false);
    
    // Redirect to files page after a short delay if all uploads succeeded
    const allSuccess = files.every(f => f.status === 'success' || f.status === 'error');
    const hasSuccess = files.some(f => f.status === 'success');
    
    if (allSuccess && hasSuccess) {
      setTimeout(() => {
        router.push('/dashboard/files');
      }, 2000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'uploading':
        return <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const pendingFiles = files.filter(f => f.status === 'pending').length;
  const successFiles = files.filter(f => f.status === 'success').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => router.back()}
          className="btn-outline btn-md"
        >
          Cancel
        </button>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div className="card-body">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
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
            <p className="text-sm text-gray-500 mt-2">
              PDF files only, up to 10MB each
            </p>
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
                  <div className="flex-shrink-0">
                    {getStatusIcon(file.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.file.size)}
                        </p>
                      </div>
                      {file.status !== 'uploading' && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {file.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {file.error && (
                      <p className="text-sm text-red-600 mt-1">{file.error}</p>
                    )}
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
              <span className="text-green-600 mr-4">
                ✓ {successFiles} uploaded successfully
              </span>
            )}
            {pendingFiles > 0 && (
              <span>
                {pendingFiles} files ready to upload
              </span>
            )}
          </div>
          <div className="space-x-4">
            <button
              onClick={() => setFiles([])}
              className="btn-outline btn-md"
              disabled={isUploading}
            >
              Clear All
            </button>
            <button
              onClick={startUpload}
              disabled={pendingFiles === 0 || isUploading}
              className="btn-primary btn-md"
            >
              {isUploading ? 'Uploading...' : `Upload ${pendingFiles} Files`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}