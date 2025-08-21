"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/lib/api-client';
import { AggregateAnalytics, PageStats } from '@/shared/types/api';
import LoadingSpinner from './LoadingSpinner';
import { formatViewTime, formatPercentage } from '@/utils/formatters';

interface AggregateViewProps {
  fileId: number;
  totalPages: number;
  days?: number;
}

export default function AggregateView({ fileId, totalPages, days = 30 }: AggregateViewProps) {
  const [data, setData] = useState<AggregateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.analytics.aggregate(fileId, days);
      console.log('AggregateView: Response received:', response);
      if (response.success && response.data) {
        console.log('AggregateView: Setting data:', response.data);
        setData(response.data as AggregateAnalytics);
      } else {
        console.log('AggregateView: Failed response:', response);
        setError('Failed to load analytics data');
      }
    } catch (err) {
      console.error('AggregateView: Error:', err);
      setError('Error loading analytics data');
    } finally {
      setLoading(false);
    }
  }, [fileId, days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = useMemo(() => {
    console.log('AggregateView: Computing chartData from:', data);
    if (!data?.pageStats || !Array.isArray(data.pageStats)) {
      console.log('AggregateView: No pageStats data available');
      return [];
    }
    
    const result = data.pageStats.map(stat => {
      console.log('AggregateView: Processing stat:', stat);
      // Ensure all values are valid numbers and not NaN
      const medianTime = Number(stat.medianDuration);
      const avgTime = Number(stat.avgDuration);
      const views = Number(stat.totalViews);
      const completionRate = Number(stat.completionRate);
      const skimRate = Number(stat.skimRate);
      
      // Additional safety check - ensure no NaN values reach the chart
      const safeMedianTime = isNaN(medianTime) || medianTime < 0 ? 0 : medianTime;
      const safeAvgTime = isNaN(avgTime) || avgTime < 0 ? 0 : avgTime;
      const safeViews = isNaN(views) || views < 0 ? 0 : views;
      const safeCompletionRate = isNaN(completionRate) || completionRate < 0 ? 0 : completionRate;
      const safeSkimRate = isNaN(skimRate) || skimRate < 0 ? 0 : skimRate;
      
      const item = {
        page: `Page ${stat.pageNumber}`,
        medianTime: safeMedianTime,
        avgTime: safeAvgTime,
        views: safeViews,
        completionRate: safeCompletionRate,
        skimRate: safeSkimRate
      };
      console.log('AggregateView: Created chart item:', item);
      return item;
    }).filter(item => {
      // Final safety filter - remove any items with NaN values
      const isValid = !isNaN(item.medianTime) && 
             !isNaN(item.avgTime) && 
             !isNaN(item.views) && 
             !isNaN(item.completionRate) && 
             !isNaN(item.skimRate);
      console.log('AggregateView: Item valid:', isValid, item);
      return isValid;
    });
    
    console.log('AggregateView: Final chartData:', result);
    return result;
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
      {/* Page-by-Page Reading Time (Horizontal Bar Chart) */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Page-by-Page Reading Time</h3>
                       <p className="text-sm text-gray-600 mb-6">
                 Average time spent on each page (horizontal bars show time duration)
               </p>
        
                       <ResponsiveContainer width="100%" height={320}>
                 <BarChart
                   data={chartData}
                   layout="horizontal"
                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                 >
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis type="number" dataKey="avgTime" />
                   <YAxis type="category" dataKey="page" width={80} />
                   <Tooltip 
                     formatter={(value: any) => [formatViewTime(value), 'Average Time']}
                     labelFormatter={(label) => label}
                   />
                   <Bar dataKey="avgTime" fill="#3B82F6" />
                 </BarChart>
               </ResponsiveContainer>
      </div>
    </div>
  );
}
