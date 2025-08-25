"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../lib/api-client';
import { PaginatedSessionsResponse, AppliedFilters } from '../../shared/types/api';
import LoadingSpinner from './LoadingSpinner';
import { formatViewTime } from '../utils/formatters';

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
  const [currentPage, setCurrentPage] = useState(1);
  
  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.analytics.individual(fileId, { ...filters, page: currentPage });
      
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
  }, [fileId, filters, currentPage]);

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

  const toggleRowExpansion = useCallback((sessionId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
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

  // Create chart data for a specific user's sessions (same format as AggregateView)
  const getUserChartData = (session: any) => {
    if (!session.pages || session.pages.length === 0) return [];
    
    return session.pages
      .map((page: any) => ({
        page: `Page ${page.pageNumber}`,
        avgTime: Number(page.avgDuration) || 0,
        pageNumber: page.pageNumber
      }))
      .sort((a: any, b: any) => a.pageNumber - b.pageNumber);
  };

  if (loading) {
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

  const userStats = getUserStats();

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Unified Header */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Individual Analytics (Per-File User Behavior)</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="px-6 py-4 border-b bg-gray-50">
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

      {/* Results Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Session Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pages Viewed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.sessions.map((session) => (
              <React.Fragment key={session.sessionId}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {session.viewerEmail ? session.viewerEmail.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {session.viewerEmail || 'Anonymous User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.viewerName || 'No name provided'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(session.startedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatViewTime(session.totalDuration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.device || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.country || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.pages.length} pages
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => toggleRowExpansion(session.sessionId)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      {expandedRows.has(session.sessionId) ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                      <span className="ml-1">
                        {expandedRows.has(session.sessionId) ? 'Hide' : 'Show'} Analytics
                      </span>
                    </button>
                  </td>
                </tr>
                
                {/* Expanded Row - User's Page Analytics */}
                {expandedRows.has(session.sessionId) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 bg-gray-50">
                      {session.pages.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <LineChart data={getUserChartData(session)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="page" 
                              tick={{ fontSize: 12 }}
                              interval={Math.max(1, Math.floor(getUserChartData(session).length / 10))}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              label={{ value: 'Time (seconds)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip 
                              formatter={(value: any) => [`${value} seconds`, 'Average Time']}
                              labelFormatter={(label) => `Page ${label}`}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="avgTime" 
                              stroke="#3B82F6" 
                              strokeWidth={2}
                              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : null}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {data.pagination && data.pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
              {data.pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(data.pagination.page - 1)}
                disabled={data.pagination.page <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(data.pagination.page + 1)}
                disabled={data.pagination.page >= data.pagination.totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
