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
  BarChart3 
} from 'lucide-react';
import { config } from '@/lib/config';
import RecentFiles from '@/components/RecentFiles';
import StorageUsage from '@/components/StorageUsage';
import LoadingSpinner from '@/components/LoadingSpinner';

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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<LoadingSpinner />}>
            <RecentFiles />
          </Suspense>
        </div>
        
        <div>
          <Suspense fallback={<LoadingSpinner />}>
            <StorageUsage />
          </Suspense>
        </div>
      </div>

      {/* Analytics Section */}
      {dashboardData && (
        <div className="space-y-6">
          {/* Recent Views */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Recent Views
              </h3>
            </div>
            <div className="card-body">
              {dashboardData.recentViews && dashboardData.recentViews.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentViews.slice(0, 5).map((view, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Eye className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {view.viewerName || view.viewerEmail || 'Anonymous'}
                          </div>
                          <div className="text-xs text-gray-500">{view.fileName}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">{formatDuration(view.duration)}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(view.startedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent views available</p>
              )}
            </div>
          </div>

          {/* Top Performing Files */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Top Performing Files
              </h3>
            </div>
            <div className="card-body">
              {dashboardData.topFiles && dashboardData.topFiles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unique Views
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData.topFiles.map((file) => (
                        <tr key={file.fileId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{file.fileName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatNumber(file.views)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatNumber(file.uniqueViews)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No file data available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}