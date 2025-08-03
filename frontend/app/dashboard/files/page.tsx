'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { Search, FileText, Eye, Share2, Share, Plus, Trash2, Download, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { config } from '@/lib/config';
import ShareLinkModal from '@/components/ShareLinkModal';

interface File {
  id: number;
  title: string;
  originalName: string;
  size: number;
  createdAt: string;
  viewCount: number;
  shareLinks?: Array<{
    id: number;
    shareId: string;
    title: string;
    viewCount: number;
    uniqueViewCount: number;
    isActive: boolean;
  }>;
}

interface ShareLink {
  id: number;
  shareId: string;
  title: string;
  viewCount: number;
  createdAt: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Add proper loading states for Clerk
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  // Wait for both auth and user to be loaded
  const isReady = authLoaded && userLoaded;

  useEffect(() => {
    if (isReady && user) {
      fetchFiles();
    }
  }, [isReady, user]);

  const fetchFiles = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No authentication token available');
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.api.url}/api/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFiles(data.data.files || []);
      } else {
        console.error('Failed to fetch files:', response.status, response.statusText);
        const errorData = await response.json().catch(() => null);
        console.error('Error response data:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
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
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${config.api.url}/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove file from local state
        setFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file');
    }
  };

  const handleDownloadFile = async (file: File) => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${config.api.url}/api/files/${file.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download file');
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file');
    }
  };

  const handleEditFile = (file: File) => {
    // For now, just navigate to file details page where editing can be done
    window.location.href = `/dashboard/files/${file.id}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getActiveShareLinks = (shareLinks: Array<{isActive: boolean}> = []) => {
    return shareLinks.filter(link => link.isActive).length;
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Show loading state while Clerk is initializing
  if (!isReady) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-body">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
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

      {/* Header with Upload Button */}
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search files..."
                className="input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="ml-4">
          <Link
            href="/dashboard/files/upload"
            className="btn-primary btn-md flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
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
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="card-body text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {files.length === 0 ? 'No files uploaded' : 'No files found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {files.length === 0 
                ? 'Get started by uploading your first PDF file.'
                : 'Try adjusting your search terms.'
              }
            </p>
            {files.length === 0 && (
              <div className="mt-6">
                <Link
                  href="/dashboard/files/upload"
                  className="btn-primary btn-md"
                >
                  Upload your first PDF
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="card-body">
            <div className="space-y-4">
              {filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/dashboard/files/${file.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors block truncate"
                      >
                        {file.title || file.originalName}
                      </Link>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>{formatFileSize(file.size)}</span>
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {file.viewCount || 0} views
                        </span>
                        <span className="flex items-center">
                          <Share2 className="h-3 w-3 mr-1" />
                          {getActiveShareLinks(file.shareLinks)} links
                        </span>
                        <span>{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleShareClick(file)}
                      className="text-primary-600 hover:text-primary-900 p-2 rounded hover:bg-primary-50"
                      title="Create share link"
                    >
                      <Share className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadFile(file)}
                      className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50"
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditFile(file)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                      title="Edit file"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/dashboard/files/${file.id}`}
                      className="text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-gray-50"
                      title="View file details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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