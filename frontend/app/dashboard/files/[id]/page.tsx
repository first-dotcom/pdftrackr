'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft, FileText, Eye, Share2, Calendar, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { config } from '@/lib/config';

interface FileDetail {
  id: number;
  title: string;
  originalName: string;
  size: number;
  createdAt: string;
  viewCount: number;
  description?: string;
}

interface ShareLink {
  id: number;
  shareId: string;
  title: string;
  viewCount: number;
  uniqueViewCount: number;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
  maxViews?: number;
  emailGatingEnabled: boolean;
  downloadEnabled: boolean;
  watermarkEnabled: boolean;
}

export default function FileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const fileId = params.id as string;

  const [file, setFile] = useState<FileDetail | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fileId) {
      fetchFileDetails();
      fetchShareLinks();
    }
  }, [fileId]);

  const fetchFileDetails = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${config.api.url}/api/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFile(data.data.file);
      } else {
        setError('File not found');
      }
    } catch (err) {
      console.error('Failed to fetch file details:', err);
      setError('Failed to load file details');
    }
  };

  const fetchShareLinks = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${config.api.url}/api/share/file/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShareLinks(data.data.shareLinks);
      }
    } catch (err) {
      console.error('Failed to fetch share links:', err);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-primary-600 hover:text-primary-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Files
        </button>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {error || 'File not found'}
          </h3>
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
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 btn-outline btn-md"
            >
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
                    <h2 className="text-lg font-medium text-gray-900">{file.title}</h2>
                    <p className="text-sm text-gray-500">{file.originalName}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.back()}
                  className="btn-outline btn-sm flex items-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <Eye className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.viewCount}</p>
                    <p className="text-xs text-gray-500">Total Views</p>
                  </div>
                </div>
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
                    <p className="text-sm font-medium text-gray-900">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
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
                <span className="text-sm text-gray-500">{shareLinks.length} total</span>
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
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {link.viewCount} views
                          </div>
                          <div>
                            Created {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
                          </div>
                          <a 
                            href={`/view/${link.shareId}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary-600 hover:text-primary-900 font-medium"
                          >
                            View
                          </a>
                        </div>
                      </div>
                      
                      {/* Link details */}
                      <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
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
                            Expires {formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true })}
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
                <div className="text-center py-8">
                  <Share2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No share links</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create a share link to share this file with others.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}