"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { apiClient } from '@/lib/api-client';
import { 
  PaginatedSessionsResponse, 
  IndividualSession, 
  AppliedFilters, 
  AvailableFilters
} from '@/shared/types/api';
import LoadingSpinner from './LoadingSpinner';
import { formatViewTime } from '@/utils/formatters';

interface IndividualViewProps {
  fileId: number;
}

export default function IndividualView({ fileId }: IndividualViewProps) {
  const [data, setData] = useState<PaginatedSessionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<AppliedFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.analytics.individual(fileId, filters);
      
      if (response.success && response.data) {
        setData(response.data as PaginatedSessionsResponse);
      } else {
        setError('Failed to load individual analytics data');
      }
    } catch (err) {
      setError('Error loading individual analytics data');
    } finally {
      setLoading(false);
    }
  }, [fileId, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = useCallback((key: keyof AppliedFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Calculate user stats from sessions data
  const getUserStats = () => {
    if (!data?.sessions || data.sessions.length === 0) {
      return {
        totalSessions: 0,
        totalDuration: 0,
        avgSessionTime: 0,
        totalPageViews: 0
      };
    }

    const totalSessions = data.sessions.length;
    const totalDuration = data.sessions.reduce((sum, session) => sum + session.totalDuration, 0);
    const avgSessionTime = totalSessions > 0 ? totalDuration / totalSessions : 0;
    const totalPageViews = data.sessions.reduce((sum, session) => sum + session.pages.length, 0);

    return {
      totalSessions,
      totalDuration,
      avgSessionTime,
      totalPageViews
    };
  };

  // Create chart data from sessions - aggregate page data across all sessions
  const getChartData = () => {
    if (!data?.sessions || data.sessions.length === 0) return [];
    
    // Create a map to aggregate page data across all sessions
    const pageDataMap = new Map<number, {
      totalDuration: number;
      totalViews: number;
      totalScrollDepth: number;
      sessionCount: number;
    }>();

    // Aggregate data from all sessions
    data.sessions.forEach(session => {
      session.pages.forEach(page => {
        const existing = pageDataMap.get(page.pageNumber) || {
          totalDuration: 0,
          totalViews: 0,
          totalScrollDepth: 0,
          sessionCount: 0
        };

        existing.totalDuration += page.avgDuration || 0;
        existing.totalViews += page.totalViews || 0;
        existing.totalScrollDepth += page.avgScrollDepth || 0;
        existing.sessionCount += 1;

        pageDataMap.set(page.pageNumber, existing);
      });
    });

    // Convert to chart data format
    return Array.from(pageDataMap.entries())
      .map(([pageNumber, data]) => ({
        page: `P${pageNumber}`,
        time: data.sessionCount > 0 ? Math.round(data.totalDuration / data.sessionCount) : 0,
        pageNumber
      }))
      .sort((a, b) => a.pageNumber - b.pageNumber);
  };

  // Get aggregated page stats for the table
  const getPageStats = () => {
    if (!data?.sessions || data.sessions.length === 0) return [];
    
    const pageDataMap = new Map<number, {
      totalDuration: number;
      totalViews: number;
      totalScrollDepth: number;
      sessionCount: number;
      durations: number[];
    }>();

    // Aggregate data from all sessions
    data.sessions.forEach(session => {
      session.pages.forEach(page => {
        const existing = pageDataMap.get(page.pageNumber) || {
          totalDuration: 0,
          totalViews: 0,
          totalScrollDepth: 0,
          sessionCount: 0,
          durations: []
        };

        existing.totalDuration += page.avgDuration || 0;
        existing.totalViews += page.totalViews || 0;
        existing.totalScrollDepth += page.avgScrollDepth || 0;
        existing.sessionCount += 1;
        existing.durations.push(page.avgDuration || 0);

        pageDataMap.set(page.pageNumber, existing);
      });
    });

    // Convert to page stats format
    return Array.from(pageDataMap.entries())
      .map(([pageNumber, data]) => ({
        pageNumber,
        avgDuration: data.sessionCount > 0 ? Math.round(data.totalDuration / data.sessionCount) : 0,
        totalViews: data.totalViews,
        avgScrollDepth: data.sessionCount > 0 ? Math.round(data.totalScrollDepth / data.sessionCount) : 0,
        medianDuration: data.durations.length > 0 ? 
          Math.round(data.durations.sort((a, b) => a - b)[Math.floor(data.durations.length / 2)]) : 0
      }))
      .sort((a, b) => a.pageNumber - b.pageNumber);
  };

  const userStats = getUserStats();
  const chartData = getChartData();
  const pageStats = getPageStats();

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No session data available yet.</p>
      </div>
    );
  }

  if (!data.sessions || data.sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No individual analytics data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Individual Analytics (Per-File User Behavior)</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600">Total Sessions</div>
            <div className="text-2xl font-bold text-blue-900">{userStats.totalSessions}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-600">Total Duration</div>
            <div className="text-2xl font-bold text-green-900">{formatViewTime(userStats.totalDuration)}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-600">Avg Session Time</div>
            <div className="text-2xl font-bold text-purple-900">{formatViewTime(userStats.avgSessionTime)}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-orange-600">Total Page Views</div>
            <div className="text-2xl font-bold text-orange-900">{userStats.totalPageViews}</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            id="email-search"
            name="emailSearch"
            type="text"
            placeholder="Search by email..."
            value={filters.email || ''}
            onChange={(e) => handleFilterChange('email', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="device-filter" className="block text-sm font-medium text-gray-700 mb-1">Device</label>
              <select
                id="device-filter"
                name="deviceFilter"
                value={filters.device || ''}
                onChange={(e) => handleFilterChange('device', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Devices</option>
                {(data.filters?.available?.devices || []).map(device => (
                  <option key={device} value={device}>{device}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="country-filter" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                id="country-filter"
                name="countryFilter"
                value={filters.country || ''}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Countries</option>
                {(data.filters?.available?.countries || []).map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date-from-filter" className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                id="date-from-filter"
                name="dateFromFilter"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="date-to-filter" className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                id="date-to-filter"
                name="dateToFilter"
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {Object.keys(filters).some(key => filters[key as keyof AppliedFilters]) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Analytics Chart */}
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Page Engagement (Average Time per Page)</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="page" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => [`${value} seconds`, 'Average Time']}
                labelFormatter={(label) => `Page ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="time" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Page Statistics Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h4 className="text-lg font-semibold text-gray-900">Page Statistics</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Scroll Depth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Median Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pageStats.map((page) => (
                <tr key={page.pageNumber} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Page {page.pageNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.avgDuration}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.totalViews}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.avgScrollDepth}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {page.medianDuration}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
