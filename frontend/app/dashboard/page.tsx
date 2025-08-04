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

import StorageUsage from '@/components/StorageUsage';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

interface DashboardData {
  totalFiles: number;
  totalViews: number;
  totalUniqueViews: number;
  totalDuration: number;
  avgDuration: number;
  emailCaptures: number;
  recentViews: Array<{
    id: number;
    shareId: string;
    viewerEmail: string | null;
    viewerName: string | null;
    country: string | null;
    city: string | null;
    device: string | null;
    browser: string | null;
    os: string | null;
    startedAt: string;
    totalDuration: number;
    isUnique: boolean;
  }>;
  topFiles: Array<{
    fileId: number;
    title: string | null;
    originalName: string;
    viewCount: number;
    uniqueViewCount: number;
    totalDuration: number;
  }>;
  viewsByDay: Array<{
    date: string;
    views: number;
    uniqueViews: number;
  }>;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [timeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const isReady = authLoaded && userLoaded;

  useEffect(() => {
    if (isReady && user) {
      fetchDashboardData();
    }
  }, [isReady, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${config.api.url}/api/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch dashboard data' }));
        setError(errorData.message || 'Failed to fetch dashboard data');
        return;
      }

      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to fetch dashboard data');
        return;
      }

      setDashboardData(data.data);
    } catch (error) {
      setError('Failed to fetch dashboard information');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '—'; // Show dash when no duration is tracked
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
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
      value: dashboardData?.emailCaptures || 0,
      icon: Mail,
      color: 'bg-orange-500',
    },
  ];

  // Show loading state while Clerk is initializing
  if (!isReady) {
    return (
      <div className="space-y-6">
        
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

      {/* Header with Upload Button */}
      <div className="flex justify-between items-center">
        <div className="flex-1">
          {/* Welcome message is handled by header */}
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
          <StorageUsage />
        </div>
        
        {/* Analytics Section - Only show if there's data */}
        {dashboardData && (dashboardData.recentViews?.length > 0 || dashboardData.topFiles?.length > 0) && (
          <div className="space-y-6">
            {/* Top Performing Files - Show top 5 */}
            {dashboardData.topFiles && dashboardData.topFiles.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Top Files
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    {dashboardData.topFiles.map((file, index) => (
                      <div key={file.fileId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center flex-1">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {file.title || 'Untitled Document'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatNumber(file.viewCount)} views
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/files/${file.fileId}`}
                          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity - Show last 5 */}
            {dashboardData.recentViews && dashboardData.recentViews.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Recent Activity
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    {dashboardData.recentViews.map((view, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center flex-1">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {view.viewerName || view.viewerEmail || 'Anonymous'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDuration(view.totalDuration)}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(view.startedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}