"use client";

import { apiClient } from "@/lib/api-client";
import { formatViewTime } from "@/utils/formatters";
import { Clock, Eye, FileText, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

interface SimpleStats {
  totalFiles: number;
  totalViews: number;
  totalShares: number;
  avgViewTime: number; // in minutes
}

interface SimpleStatsProps {
  userId?: string;
}

export default function SimpleStats({ userId }: SimpleStatsProps) {
  const [stats, setStats] = useState<SimpleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchSimpleStats();
    }
  }, [userId]);

  const fetchSimpleStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.analytics.dashboard();

      if (response.success) {
        const data = response.data as any;
        setStats({
          totalFiles: data.totalFiles || 0,
          totalViews: data.totalViews || 0,
          totalShares: data.totalShares || 0,
          avgViewTime: data.avgDuration || 0, // Keep in seconds for better precision
        });
      } else {
        setError("Failed to load stats");
      }
    } catch (err) {
      setError("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
          <p className="mt-1 text-gray-600">Your document sharing statistics</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="card">
                <div className="card-body p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return null; // Don't show anything if there's an error
  }

  const statItems = [
    {
      label: "Total Files",
      value: stats.totalFiles.toLocaleString(),
      icon: FileText,
      bgGradient: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Views",
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      bgGradient: "from-green-50 to-green-100",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
    },
    {
      label: "Share Links",
      value: stats.totalShares.toLocaleString(),
      icon: Share2,
      bgGradient: "from-purple-50 to-purple-100",
      borderColor: "border-purple-200",
      iconColor: "text-purple-600",
    },
    {
      label: "Avg Session Time",
      value: stats.avgViewTime > 0 ? formatViewTime(stats.avgViewTime) : "-",
      icon: Clock,
      bgGradient: "from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
        <p className="mt-1 text-gray-600">Your document sharing statistics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <div className="card-body p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${item.bgGradient} rounded-lg flex items-center justify-center border ${item.borderColor}`}
                  >
                    <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    {item.value}
                  </p>
                  <p className="text-sm text-gray-600 font-medium truncate">{item.label}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
