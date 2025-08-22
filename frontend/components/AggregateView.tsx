"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { apiClient } from '@/lib/api-client';
import { AggregateAnalytics, PageStats } from '@/shared/types/api';
import LoadingSpinner from './LoadingSpinner';
import { formatViewTime } from '@/utils/formatters';

interface AggregateViewProps {
  fileId: number;
  totalPages: number;
  days?: number;
}

export default function AggregateView({ fileId, totalPages, days = 30 }: AggregateViewProps) {
  const [data, setData] = useState<AggregateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageRange, setPageRange] = useState<{ start: number; end: number }>({ start: 1, end: 50 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use page range for optimization
      const pageRangeParam = `${pageRange.start}-${pageRange.end}`;
      const response = await apiClient.analytics.aggregate(fileId, days, pageRangeParam);
      
      if (response.success && response.data) {
        setData(response.data as AggregateAnalytics);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      setError('Error loading analytics data');
    } finally {
      setLoading(false);
    }
  }, [fileId, days, pageRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process data for the line chart
  const chartData = useMemo(() => {
    if (!data?.pageStats || !Array.isArray(data.pageStats)) {
      return [];
    }
    
    return data.pageStats.map(stat => ({
      page: `Page ${stat.pageNumber}`,
      avgTime: Math.round(Number(stat.avgDuration) || 0),
      pageNumber: stat.pageNumber
    })).sort((a, b) => a.pageNumber - b.pageNumber);
  }, [data]);

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
        <p className="text-gray-600">No analytics data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Range Controls for Large Documents */}
      {totalPages > 50 && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Page Range</h4>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Pages:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={pageRange.start}
                  onChange={(e) => setPageRange(prev => ({ ...prev, start: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">to</span>
                <input
                  type="number"
                  min={pageRange.start}
                  max={totalPages}
                  value={pageRange.end}
                  onChange={(e) => setPageRange(prev => ({ ...prev, end: Math.min(totalPages, parseInt(e.target.value) || prev.end) }))}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <button
                onClick={fetchData}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Load
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reading Time Chart */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Time by Page</h3>
        <p className="text-sm text-gray-600 mb-6">
          Average time spent on each page (like a price chart showing reading patterns)
        </p>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="page" 
                tick={{ fontSize: 12 }}
                interval={Math.max(1, Math.floor(chartData.length / 10))}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Time (seconds)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: any) => [formatViewTime(value), 'Average Time']}
                labelFormatter={(label) => label}
              />
              <Line 
                type="monotone" 
                dataKey="avgTime" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No page data available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
