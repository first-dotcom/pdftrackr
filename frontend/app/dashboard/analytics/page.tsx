'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { BarChart3, Eye, Users, Globe, Smartphone, Clock, TrendingUp } from 'lucide-react';
import { config } from '@/lib/config';

interface AnalyticsData {
  totalFiles: number;
  totalViews: number;
  uniqueViewers: number;
  avgSessionDuration: number;
  topCountries: Array<{ country: string; views: number }>;
  topDevices: Array<{ device: string; views: number }>;
  viewsOverTime: Array<{ date: string; views: number; uniqueViews: number }>;
  topFiles: Array<{ title: string; views: number; uniqueViews: number }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const { getToken } = useAuth();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No authentication token available');
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.api.url}/api/analytics/dashboard?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      } else {
        console.error('Failed to fetch analytics:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">View your file performance and audience insights</p>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">View your file performance and audience insights</p>
        </div>
        <div className="card">
          <div className="card-body text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Analytics Data</h3>
            <p className="mt-2 text-gray-600">Start sharing files to see analytics here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">View your file performance and audience insights</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 p-2 rounded-md">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(analytics.totalViews)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 p-2 rounded-md">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Unique Viewers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(analytics.uniqueViewers)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 p-2 rounded-md">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Avg. Session</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatDuration(analytics.avgSessionDuration)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-500 p-2 rounded-md">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Active Files</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(analytics.totalFiles)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Geographic and Device Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Globe className="mr-2 h-5 w-5" />
              Top Countries
            </h3>
          </div>
          <div className="card-body">
            {analytics.topCountries.length > 0 ? (
              <div className="space-y-3">
                {analytics.topCountries.map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{country.country}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(country.views / analytics.topCountries[0].views) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{formatNumber(country.views)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No geographic data available</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Smartphone className="mr-2 h-5 w-5" />
              Device Types
            </h3>
          </div>
          <div className="card-body">
            {analytics.topDevices.length > 0 ? (
              <div className="space-y-3">
                {analytics.topDevices.map((device, index) => (
                  <div key={device.device} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{device.device}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(device.views / analytics.topDevices[0].views) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{formatNumber(device.views)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No device data available</p>
            )}
          </div>
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
          {analytics.topFiles.length > 0 ? (
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
                  {analytics.topFiles.map((file) => (
                    <tr key={file.title} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{file.title}</div>
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
  );
} 