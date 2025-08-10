"use client";

import { useEffect, useState } from 'react';
import { Eye, Clock, CheckCircle, Users } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface SimpleFileStats {
  totalViews: number;
  uniqueViewers: number;
  completionRate: number; // percentage
  avgViewTime: number; // in minutes
}

interface SimpleFileStatsProps {
  shareId: string;
  title?: string;
}

export default function SimpleFileStats({ shareId, title }: SimpleFileStatsProps) {
  const [stats, setStats] = useState<SimpleFileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFileStats();
  }, [shareId]);

  const fetchFileStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.analytics.getDocumentStats(shareId);

      if (response.success) {
        const data = response.data as any;
        setStats({
          totalViews: data.totalViews || 0,
          uniqueViewers: data.uniqueViewers || 0,
          completionRate: data.completionRate || 0,
          avgViewTime: Math.round((data.avgSessionDuration || 0) / 60), // Convert seconds to minutes
        });
      } else {
        setError('Failed to load file stats');
      }
    } catch (err) {
      setError('Failed to load file stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return null; // Don't show anything if there's an error or no data
  }

  // Only show if there's actually some data
  if (stats.totalViews === 0) {
    return (
      <div className="card">
        <div className="card-body p-6 text-center">
          <Eye className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No views yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Share this document to start tracking views.
          </p>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      label: 'Views',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-blue-600',
    },
    {
      label: 'Unique Viewers',
      value: stats.uniqueViewers.toLocaleString(),
      icon: Users,
      color: 'text-green-600',
    },
    {
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: CheckCircle,
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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          {title ? `Analytics for "${title}"` : 'Document Analytics'}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          View statistics for this shared document
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <div key={item.label} className="card">
            <div className="card-body p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div className="ml-3">
                  <p className="text-xl font-bold text-gray-900">
                    {item.value}
                  </p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
