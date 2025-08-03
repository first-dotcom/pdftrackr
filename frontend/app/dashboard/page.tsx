'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { 
  FileText, 
  Eye, 
  Users, 
  Mail, 
  Clock, 
  TrendingUp, 
  BarChart3,
  Plus
} from 'lucide-react';
import { config } from '@/lib/config';
import RecentFiles from '@/components/RecentFiles';
import StorageUsage from '@/components/StorageUsage';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

interface DashboardData {
  totalFiles: number;
  totalViews: number;
  totalUniqueViews: number;
  totalEmailCaptures: number;
  recentViews: Array<{
    viewerEmail: string | null;
    viewerName: string | null;
    startedAt: string;
    duration: number;
    fileName: string;
    shareTitle: string;
    fileId: number;
    shareId: string;
  }>;
  topFiles: Array<{
    fileId: number;
    fileName: string;
    views: number | string;
    uniqueViews: number | string;
  }>;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const isReady = authLoaded && userLoaded;

  useEffect(() => {
    if (isReady && user) {
      fetchDashboardData();
    }
  }, [isReady, user, timeRange]);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No authentication token available');
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.api.url}/api/analytics/dashboard?days=${timeRange.replace('d', '')}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      } else {
        console.error('Failed to fetch dashboard data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatNumber = (num: number | string | undefined | null) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString();
  };

  const statCards = [
    {
      name: 'Total Files',
      value: dashboardData?.totalFiles || 0,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Views',
      value: dashboardData?.totalViews || 0,
      icon: Eye,
      color: 'bg-green-500',
    },
    {
      name: 'Unique Viewers',
      value: dashboardData?.totalUniqueViews || 0,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'Email Captures',
      value: dashboardData?.totalEmailCaptures || 0,
      icon: Mail,
      color: 'bg-orange-500',
    },
  ];

  // Show loading state while Clerk is initializing
  if (!isReady) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.firstName || 'User'}!</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back!</p>
        </div>
        <div className="card">
          <div className="card-body text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Authentication Required</h3>
            <p className="mt-1 text-sm text-gray-500">Please sign in to view your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName || 'User'}!</p>
        </div>
        <select 
          className="input w-auto"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} p-2 rounded-md`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(stat.value)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid - Simplified */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage Usage */}
        <div>
          <Suspense fallback={<LoadingSpinner />}>
            <StorageUsage />
          </Suspense>
        </div>
        
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="card-body space-y-4">
            <Link
              href="/dashboard/files/upload"
              className="flex items-center p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <Plus className="h-5 w-5 text-primary-600 mr-3" />
              <div>
                <div className="font-medium text-primary-900">Upload PDF</div>
                <div className="text-sm text-primary-600">Add a new file to your library</div>
              </div>
            </Link>
            
            <Link
              href="/dashboard/files"
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FileText className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Manage Files</div>
                <div className="text-sm text-gray-600">View and organize your files</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Section - Only show if there's data */}
      {dashboardData && (dashboardData.recentViews?.length > 0 || dashboardData.topFiles?.length > 0) && (
        <div className="space-y-6">
          {/* Top Performing Files - Only show top 3 */}
          {dashboardData.topFiles && dashboardData.topFiles.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Top Performing Files
                </h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {dashboardData.topFiles.slice(0, 3).map((file, index) => (
                    <div key={file.fileId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center flex-1">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {file.fileName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatNumber(file.views)} total views
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">
                          {formatNumber(file.uniqueViews)} unique
                        </div>
                        <div className="text-xs text-gray-500">
                          {Number(file.views) > 0 && Number(file.uniqueViews) > 0 ? 
                            `${Math.round((Number(file.uniqueViews) / Number(file.views)) * 100)}% return rate` : 
                            'New file'
                          }
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link
                          href={`/dashboard/files/${file.fileId}`}
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  ))}
                  {dashboardData.topFiles.length > 3 && (
                    <div className="text-center pt-2">
                      <Link
                        href="/dashboard/files"
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        View all files →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Views - Only show if there are views */}
          {dashboardData.recentViews && dashboardData.recentViews.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Recent Activity
                </h3>
              </div>
              <div className="card-body">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Viewer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Link
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData.recentViews.slice(0, 10).map((view, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Eye className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {view.viewerName || view.viewerEmail || 'Anonymous'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {view.viewerEmail ? 'Email provided' : 'No email'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              <Link
                                href={`/dashboard/files/${view.fileId}`}
                                className="hover:underline"
                              >
                                {view.fileName}
                              </Link>
                            </div>
                            {view.shareTitle && view.shareTitle !== view.fileName && (
                              <div className="text-xs text-gray-500">
                                Shared as: {view.shareTitle}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Share ID: {view.shareId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {view.duration > 0 ? formatDuration(view.duration) : 'Quick view'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {view.duration > 0 ? 'Engaged viewing' : 'Brief interaction'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(view.startedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(view.startedAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-primary-600">
                              <a 
                                href={`/view/${view.shareId}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                /view/{view.shareId}
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {dashboardData.recentViews.length > 10 && (
                  <div className="text-center pt-4 border-t border-gray-200">
                    <button className="text-sm text-primary-600 hover:text-primary-800">
                      View all {dashboardData.recentViews.length} activities →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State - Show when no data */}
      {dashboardData && (!dashboardData.recentViews?.length && !dashboardData.topFiles?.length) && (
        <div className="card">
          <div className="card-body text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
            <p className="mt-1 text-sm text-gray-500">Upload and share files to see analytics here</p>
            <div className="mt-6">
              <Link
                href="/dashboard/files/upload"
                className="btn-primary btn-md"
              >
                Upload your first file
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}