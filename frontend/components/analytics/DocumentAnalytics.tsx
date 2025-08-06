"use client";

import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Eye, 
  Clock, 
  Target, 
  TrendingUp, 
  Map, 
  Users, 
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface DocumentStats {
  shareId: string;
  totalViews: number;
  uniqueViewers: number;
  avgReadingDepth: number;
  avgSessionDuration: number;
  completionRate: number;
  peakReadingTime: string;
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
  topPages: number[];
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

interface DocumentAnalyticsProps {
  shareId: string;
  title?: string;
}

export default function DocumentAnalytics({ shareId, title }: DocumentAnalyticsProps) {
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocumentStats();
  }, [shareId]);

  const fetchDocumentStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.analytics.getDocumentStats(shareId);

      if (response.success) {
        setStats(response.data as DocumentStats);
      } else {
        setError(typeof response.error === 'string' ? response.error : 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Failed to load document analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const getEngagementColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600 bg-green-50';
      case 'decreasing': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getEngagementIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '→';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Analytics Data</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error || 'Start sharing this document to see analytics.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <BarChart3 className="mr-2 h-5 w-5" />
          Document Analytics
          {title && <span className="ml-2 text-gray-500">— {title}</span>}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Detailed insights into how readers engage with your document
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views */}
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalViews.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total Views</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reading Depth */}
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.avgReadingDepth}%
                </p>
                <p className="text-sm text-gray-500">Avg Reading Depth</p>
              </div>
            </div>
          </div>
        </div>

        {/* Session Duration */}
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatDuration(stats.avgSessionDuration)}
                </p>
                <p className="text-sm text-gray-500">Avg Read Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.completionRate || 0}%
                </p>
                <p className="text-sm text-gray-500">Completion Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-medium">📈 Engagement Trend</h3>
          </div>
          <div className="card-body">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEngagementColor(stats.engagementTrend)}`}>
              <span className="mr-1">{getEngagementIcon(stats.engagementTrend)}</span>
              {stats.engagementTrend.charAt(0).toUpperCase() + stats.engagementTrend.slice(1)}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Reader engagement is {stats.engagementTrend} over time
            </p>
          </div>
        </div>

        {/* Peak Reading Time */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-medium">⏰ Peak Reading Time</h3>
          </div>
          <div className="card-body">
            <p className="text-2xl font-semibold text-gray-900">
              {stats.peakReadingTime}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Most readers engage at this time
            </p>
          </div>
        </div>
      </div>

      {/* Device Breakdown & Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-medium flex items-center">
              <Smartphone className="mr-2 h-4 w-4" />
              Device Breakdown
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {/* Desktop */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Monitor className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium">Desktop</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-900">{stats.deviceBreakdown.desktop}</span>
                  <div className="ml-3 w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(stats.deviceBreakdown.desktop / stats.totalViews) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Mobile */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Smartphone className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium">Mobile</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-900">{stats.deviceBreakdown.mobile}</span>
                  <div className="ml-3 w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(stats.deviceBreakdown.mobile / stats.totalViews) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Tablet */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Tablet className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium">Tablet</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-900">{stats.deviceBreakdown.tablet}</span>
                  <div className="ml-3 w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full" 
                      style={{ width: `${(stats.deviceBreakdown.tablet / stats.totalViews) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Pages */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-medium">🔥 Most Read Pages</h3>
          </div>
          <div className="card-body">
            <div className="space-y-2">
              {stats.topPages.slice(0, 5).map((page, index) => (
                <div key={page} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-500 w-6">#{index + 1}</span>
                    <span className="text-sm font-medium">Page {page}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Most viewed
                  </div>
                </div>
              ))}
              {stats.topPages.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No page data available yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unique Viewers */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-base font-medium flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Reader Summary
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {stats.uniqueViewers}
              </p>
              <p className="text-sm text-gray-500">Unique Readers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalViews > 0 ? Math.round(stats.totalViews / stats.uniqueViewers) : 0}
              </p>
              <p className="text-sm text-gray-500">Avg Views per Reader</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalViews > stats.uniqueViewers ? '🔥' : '📄'}
              </p>
              <p className="text-sm text-gray-500">
                {stats.totalViews > stats.uniqueViewers ? 'Highly Engaging' : 'New Document'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}