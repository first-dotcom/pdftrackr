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
          totalViews: Number(data.totalViews) || 0,
          uniqueViewers: Number(data.uniqueViewers) || 0,
          completionRate: Number(data.completionRate) || 0,
          avgViewTime: Number(data.avgSessionDuration) || 0, // Keep in seconds for better precision
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
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
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return null; // Don't show anything if there's an error or no data
  }

  // Only show if there's actually some data
  if ((Number(stats.totalViews) || 0) === 0) {
    return (
      <div className="card">
        <div className="card-body p-6 text-center">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mb-6">
            <Eye className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No views yet</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Share this document to start tracking views.
          </p>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      label: 'Views',
      value: (Number(stats.totalViews) || 0).toLocaleString(),
      icon: Eye,
      bgGradient: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Unique Viewers',
      value: (Number(stats.uniqueViewers) || 0).toLocaleString(),
      icon: Users,
      bgGradient: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
    },
    {
      label: 'Completion Rate',
      value: `${Number(stats.completionRate) || 0}%`,
      icon: CheckCircle,
      bgGradient: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Avg View Time',
      value: (Number(stats.avgViewTime) || 0) > 0 ? `${Number(stats.avgViewTime) || 0}s` : '-',
      icon: Clock,
      bgGradient: 'from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600',
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        {statItems.map((item) => (
          <div 
            key={item.label} 
            className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <div className="card-body p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 bg-gradient-to-br ${item.bgGradient} rounded-lg flex items-center justify-center border ${item.borderColor}`}>
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
