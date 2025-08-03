'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { Search, FileText, Eye, Share2, MoreVertical, Share } from 'lucide-react';
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
  folder?: string;
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
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set<number>());
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  
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

  const fetchShareLinks = async (fileId: number) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No authentication token available');
        return;
      }

      const response = await fetch(`${config.api.url}/api/share/file/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShareLinks(data.data.shareLinks);
      } else {
        console.error('Failed to fetch share links:', response.status, response.statusText);
        const errorData = await response.json().catch(() => null);
        console.error('Error response data:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch share links:', error);
    }
  };

  const handleShareClick = (file: File) => {
    setSelectedFile(file);
    setShareModalOpen(true);
    fetchShareLinks(file.id);
  };

  const handleShareSuccess = () => {
    fetchFiles();
    if (selectedFile) {
      fetchShareLinks(selectedFile.id);
    }
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

  const toggleFileExpansion = (fileId: number) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
      fetchShareLinks(fileId);
    }
    setExpandedFiles(newExpanded);
  };

  // Group files by folder
  const groupedFiles = files.reduce((acc, file) => {
    const folder = file.folder || 'General';
    if (!acc[folder]) {
      acc[folder] = [];
    }
    acc[folder].push(file);
    return acc;
  }, {} as Record<string, File[]>);

  const folders = Object.keys(groupedFiles);

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || (file.folder || 'General') === selectedFolder;
    
    return matchesSearch && matchesFolder;
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

      {/* Search and Filters */}
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
        <select 
          className="input w-auto min-w-[150px]"
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
        >
          <option value="all">All Folders</option>
          {folders.map(folder => (
            <option key={folder} value={folder}>{folder}</option>
          ))}
        </select>
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
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Share Links
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <>
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-red-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <Link
                              href={`/dashboard/files/${file.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
                            >
                              {file.title || file.originalName}
                            </Link>
                            {file.title && file.title !== file.originalName && (
                              <div className="text-sm text-gray-500">
                                {file.originalName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Eye className="mr-1 h-4 w-4" />
                          {file.viewCount || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Share2 className="mr-1 h-4 w-4" />
                          {getActiveShareLinks(file.shareLinks)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => toggleFileExpansion(file.id)}
                            className={`text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 ${expandedFiles.has(file.id) ? 'bg-gray-100' : ''}`}
                            title="Toggle shared links"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleShareClick(file)}
                            className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                            title="Create share link"
                          >
                            <Share className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/dashboard/files/${file.id}`}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                            title="View file details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    {/* Expandable shared links row */}
                    {expandedFiles.has(file.id) && (
                      <tr key={`expanded-${file.id}`} className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-900">Shared Links for &quot;{file.title}&quot;</h4>
                            {shareLinks.length > 0 ? (
                              <div className="space-y-2">
                                {shareLinks.map((link) => (
                                  <div key={link.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-900">{link.title}</div>
                                      <div className="text-xs text-gray-500">
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
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                      <div className="flex items-center">
                                        <Eye className="h-3 w-3 mr-1" />
                                        {link.viewCount} views
                                      </div>
                                      <div className="text-xs">
                                        {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
                                      </div>
                                      <a 
                                        href={`/view/${link.shareId}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-primary-600 hover:text-primary-900 text-xs font-medium"
                                      >
                                        View
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">No shared links created yet.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
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