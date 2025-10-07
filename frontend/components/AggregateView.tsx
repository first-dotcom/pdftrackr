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
    <div className="space-y-4">
      {/* Reading Time Chart */}
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Average time spent on each page. Detailed format in tooltip.
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
              <Tooltip
                formatter={(value: any) => [formatDuration(value), "Average Time Spent"]}
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
