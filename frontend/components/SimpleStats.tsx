"use client";

import { useEffect, useState } from 'react';
import { FileText, Eye, Share2, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

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
          avgViewTime: Math.round((data.avgDuration || 0) / 60), // Convert seconds to minutes
        });
      } else {
        setError('Failed to load stats');
      }
    } catch (err) {
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="card">
              <div className="card-body p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return null; // Don't show anything if there's an error
  }

  const statItems = [
    {
      label: 'Total Files',
      value: stats.totalFiles.toLocaleString(),
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      label: 'Total Views',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-green-600',
    },
    {
      label: 'Share Links',
      value: stats.totalShares.toLocaleString(),
      icon: Share2,
      color: 'text-purple-600',
    },
    {
      label: 'Avg View Time',
      value: stats.avgViewTime > 0 ? `${stats.avgViewTime}m` : '-',
      icon: Clock,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
        <p className="mt-1 text-gray-600">Your document sharing statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item) => (
          <div key={item.label} className="card">
            <div className="card-body p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className={`h-8 w-8 ${item.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {item.value}
                  </p>
                  <p className="text-sm text-gray-500">{item.label}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
