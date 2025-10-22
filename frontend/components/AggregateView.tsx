"use client";

import { apiClient } from "@/lib/api-client";
import { type AggregateAnalytics } from "@/shared/types/api";
import { formatDuration } from "@/utils/formatters";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import LoadingSpinner from "./LoadingSpinner";

interface AggregateViewProps {
  fileId: number;
  totalPages: number;
  days?: number;
  mock?: AggregateAnalytics | null;
}

export default function AggregateView({ fileId, totalPages, days = 30, mock = null }: AggregateViewProps) {
  const [data, setData] = useState<AggregateAnalytics | null>(mock);
  const [loading, setLoading] = useState(!mock);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.analytics.aggregate(fileId, days);

      if (response.success && response.data) {
        setData(response.data as AggregateAnalytics);
      } else {
        setError("Failed to load analytics data");
      }
    } catch (err) {
      setError("Error loading analytics data");
    } finally {
      setLoading(false);
    }
  }, [fileId, days]);

  useEffect(() => {
    if (mock) {
      setData(mock);
      setLoading(false);
      setError(null);
      return;
    }
    fetchData();
  }, [fetchData, mock]);

  // Process data for the line chart
  const chartData = useMemo(() => {
    if (!data?.pageStats || !Array.isArray(data.pageStats)) {
      return [];
    }

    return data.pageStats
      .map((stat) => ({
        page: `Page ${stat.pageNumber}`,
        avgTime: Number(stat.avgDuration) || 0,
        pageNumber: stat.pageNumber,
      }))
      .sort((a, b) => a.pageNumber - b.pageNumber);
  }, [data]);

  // Generate mock data for preview when no real data exists
  const mockChartData = useMemo(() => {
    if (chartData.length > 0) return []; // Only use mock if no real data
    
    const pages = Math.min(totalPages, 20); // Cap at 20 pages for visualization
    return Array.from({ length: pages }, (_, i) => ({
      page: `Page ${i + 1}`,
      avgTime: Math.random() * 180000 + 30000, // Random time between 30s and 3.5min
      pageNumber: i + 1,
    }));
  }, [chartData.length, totalPages]);

  const hasNoData = chartData.length === 0;

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
          type="button"
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
        <p className="text-gray-600">No analytics data available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reading Time Chart */}
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Average time spent on each page
        </p>

        <div className="relative">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart 
              data={hasNoData ? mockChartData : chartData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={hasNoData ? "#E5E7EB" : undefined} />
              <XAxis
                dataKey="page"
                tick={{ fontSize: 12, fill: hasNoData ? "#D1D5DB" : "#6B7280" }}
                interval={Math.max(1, Math.floor((hasNoData ? mockChartData : chartData).length / 10))}
              />
              <YAxis
                tick={{ fontSize: 12, fill: hasNoData ? "#D1D5DB" : "#6B7280" }}
                allowDecimals={false}
                tickFormatter={(v: number) => {
                  const ms = Number(v) || 0;
                  const s = ms / 1000;
                  // Use mm:ss for readability above a minute, else seconds with up to 2 decimals
                  if (s >= 60) {
                    const m = Math.floor(s / 60);
                    const rs = Math.round(s % 60).toString().padStart(2, "0");
                    return `${m}:${rs}`;
                  }
                  return s.toFixed(s < 10 ? 2 : 0);
                }}
                tickCount={5}
              />
              {!hasNoData && (
                <Tooltip
                  formatter={(value: any) => [formatDuration(value), "Average view time"]}
                  labelFormatter={(label) => label}
                />
              )}
              <Line
                type="monotone"
                dataKey="avgTime"
                stroke={hasNoData ? "#D1D5DB" : "#3B82F6"}
                strokeWidth={hasNoData ? 2 : 3}
                dot={{ fill: hasNoData ? "#D1D5DB" : "#3B82F6", strokeWidth: hasNoData ? 1 : 2, r: hasNoData ? 3 : 4 }}
                activeDot={hasNoData ? false : { r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Overlay message when no data */}
          {hasNoData && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 pointer-events-none">
              <div className="text-center p-6 bg-white rounded-lg shadow-lg border-2 border-gray-200">
                <p className="text-gray-700 font-medium mb-1">No page data available yet</p>
                <p className="text-sm text-gray-500">This preview shows what your analytics will look like</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
