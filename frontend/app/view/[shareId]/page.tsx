'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Download, Lock, Mail } from 'lucide-react';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ShareLinkInfo {
  id: number;
  shareId: string;
  title?: string;
  description?: string;
  emailGatingEnabled: boolean;
  downloadEnabled: boolean;
  watermarkEnabled: boolean;
  requiresPassword: boolean;
  file: {
    id: number;
    filename: string;
    originalName: string;
    title?: string;
    size: number;
  };
}

interface AccessData {
  sessionId: string;
  fileUrl: string;
  file: {
    id: number;
    filename: string;
    originalName: string;
    title?: string;
    size: number;
  };
  downloadEnabled: boolean;
  watermarkEnabled: boolean;
}

export default function ViewerPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  
  const [shareInfo, setShareInfo] = useState<ShareLinkInfo | null>(null);
  const [accessData, setAccessData] = useState<AccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Access form state
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  
  // PDF viewer state
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    if (shareId) {
      fetchShareInfo();
    }
  }, [shareId]);

  const fetchShareInfo = async () => {
    try {
      const response = await fetch(`/api/share/${shareId}`);
      const data = await response.json();
      
      if (response.ok) {
        setShareInfo(data.data.shareLink);
        setShowAccessForm(true);
      } else {
        setError(data.error?.message || 'Share link not found');
      }
    } catch (err) {
      setError('Failed to load share link');
    } finally {
      setLoading(false);
    }
  };

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/share/${shareId}/access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password || undefined,
          email: email || undefined,
          name: name || undefined,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setAccessData(data.data);
        setShowAccessForm(false);
        startTracking(data.data.sessionId);
      } else {
        setError(data.error?.message || 'Access denied');
      }
    } catch (err) {
      setError('Failed to access file');
    } finally {
      setAccessLoading(false);
    }
  };

  const startTracking = (sessionId: string) => {
    // Track page views and scroll depth
    let startTime = Date.now();
    let maxScrollDepth = 0;

    const trackPageView = (pageNum: number) => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      
      fetch(`/api/share/${shareId}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          pageNumber: pageNum,
          duration,
          scrollDepth: maxScrollDepth,
        }),
      }).catch(console.error);

      startTime = Date.now();
      maxScrollDepth = 0;
    };

    // Track when user leaves the page
    const handleBeforeUnload = () => {
      trackPageView(currentPage);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      trackPageView(currentPage);
    };
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleDownload = () => {
    if (accessData?.downloadEnabled && accessData.fileUrl) {
      const link = document.createElement('a');
      link.href = accessData.fileUrl;
      link.download = accessData.file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (showAccessForm && shareInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {shareInfo.title || shareInfo.file.title || shareInfo.file.originalName}
            </h1>
            {shareInfo.description && (
              <p className="text-gray-600 mt-2">{shareInfo.description}</p>
            )}
          </div>

          <form onSubmit={handleAccess} className="space-y-4">
            {shareInfo.emailGatingEnabled && (
              <>
                <div>
                  <label className="label">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="email"
                      required
                      className="input pl-10 w-full"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Name (optional)</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </>
            )}

            {shareInfo.requiresPassword && (
              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="password"
                    required
                    className="input pl-10 w-full"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={accessLoading}
              className="w-full btn-primary btn-md"
            >
              {accessLoading ? 'Accessing...' : 'Access Document'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (accessData) {
    return (
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-medium text-gray-900 truncate">
              {accessData.file.title || accessData.file.originalName}
            </h1>
            <div className="flex items-center space-x-4">
              {accessData.downloadEnabled && (
                <button
                  onClick={handleDownload}
                  className="btn-outline btn-sm flex items-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex flex-col items-center py-4">
          <div className="bg-white shadow-lg">
            <Document
              file={accessData.fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center space-x-4 bg-white px-4 py-2 rounded-lg shadow">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="btn-ghost btn-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage} of {numPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
              className="btn-ghost btn-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="border-l border-gray-300 pl-4">
              <select
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={0.5}>50%</option>
                <option value={0.75}>75%</option>
                <option value={1.0}>100%</option>
                <option value={1.25}>125%</option>
                <option value={1.5}>150%</option>
                <option value={2.0}>200%</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}