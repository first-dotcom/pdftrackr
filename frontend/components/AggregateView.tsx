"use client";

import { apiClient } from "@/lib/api-client";
import { type AggregateAnalytics } from "@/shared/types/api";
import { formatViewTime } from "@/utils/formatters";
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
    fetchData();
  }, [fetchData]);

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
                label={{ value: "Time (seconds)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                formatter={(value: any) => [formatViewTime(value), "Average Time"]}
                labelFormatter={(label) => label}
              />
              <Line
                type="monotone"
                dataKey="avgTime"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
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
