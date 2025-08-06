"use client";

import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Globe, 
  Clock,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface TopDocument {
  shareId: string;
  views: number;
  avgEngagement: number;
  performanceScore: number;
}

interface AnalyticsOverviewProps {
  userId?: string;
}

export default function AnalyticsOverview({ userId }: AnalyticsOverviewProps) {
  const [topDocuments, setTopDocuments] = useState<TopDocument[]>([]);
  const [globalMap, setGlobalMap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsOverview();
  }, [userId]);

  const fetchAnalyticsOverview = async () => {
    try {
      setLoading(true);
      
      // Fetch top documents and global map in parallel
      const [topDocsResponse, globalMapResponse] = await Promise.all([
        apiClient.analytics.getTopDocuments(10),
        apiClient.analytics.getGlobalEngagementMap()
      ]);

      if (topDocsResponse.success) {
        setTopDocuments(topDocsResponse.data as TopDocument[]);
      }

      if (globalMapResponse.success) {
        setGlobalMap(globalMapResponse.data as any[]);
      }

    } catch (err) {
      setError('Failed to load analytics overview');
    } finally {
      setLoading(false);
    }
  };

  const totalViews = topDocuments.reduce((sum, doc) => sum + doc.views, 0);
  const avgEngagement = topDocuments.length > 0 
    ? Math.round(topDocuments.reduce((sum, doc) => sum + doc.avgEngagement, 0) / topDocuments.length)
    : 0;
  const totalCountries = globalMap.length;

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getEngagementBadge = (engagement: number) => {
    if (engagement >= 80) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (engagement >= 60) return { text: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (engagement >= 40) return { text: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Low', color: 'bg-red-100 text-red-800' };
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics Unavailable</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="mr-3 h-6 w-6" />
          Analytics Overview
        </h2>
        <p className="mt-2 text-gray-600">
          Complete insights into your document performance and reader engagement
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Views */}
        <div className="card">
          <div className="card-body p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-gray-900">
                  {totalViews.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total Views</p>
              </div>
            </div>
          </div>
        </div>

        {/* Average Engagement */}
        <div className="card">
          <div className="card-body p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-gray-900">
                  {avgEngagement}
                </p>
                <p className="text-sm text-gray-500">Avg Engagement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Reach */}
        <div className="card">
          <div className="card-body p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-gray-900">
                  {totalCountries}
                </p>
                <p className="text-sm text-gray-500">Countries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Documents */}
        <div className="card">
          <div className="card-body p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-gray-900">
                  {topDocuments.length}
                </p>
                <p className="text-sm text-gray-500">Documents</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Documents */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Top Performing Documents
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Ranked by performance score (views + engagement)
            </p>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {topDocuments.slice(0, 5).map((doc, index) => {
                const engagement = getEngagementBadge(doc.avgEngagement);
                
                return (
                  <div key={doc.shareId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.shareId}
                        </p>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs text-gray-500">
                            {doc.views} views
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${engagement.color}`}>
                            {engagement.text}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center ml-4">
                      <div className="text-right mr-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {Math.round(doc.performanceScore)}
                        </p>
                        <p className="text-xs text-gray-500">Score</p>
                      </div>
                      <div className="w-2 h-12 bg-gray-200 rounded-full">
                        <div 
                          className={`w-2 rounded-full ${getPerformanceColor(doc.performanceScore)}`}
                          style={{ height: `${Math.min((doc.performanceScore / 100) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {topDocuments.length === 0 && (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  No documents with analytics data yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Global Engagement Map */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Globe className="mr-2 h-5 w-5" />
              Global Engagement
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Where your readers are located worldwide
            </p>
          </div>
          <div className="card-body">
            {globalMap.length > 0 ? (
              <div className="space-y-3">
                {globalMap.slice(0, 8).map((country) => {
                  const getCountryFlag = (countryCode: string) => {
                    if (countryCode === 'LOCAL') return '🏠';
                    try {
                      return countryCode
                        .toUpperCase()
                        .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
                    } catch {
                      return '🌍';
                    }
                  };

                  return (
                    <div key={country.countryCode} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">
                          {getCountryFlag(country.countryCode)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {country.name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-2">
                          {country.views} views
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min((country.views / Math.max(...globalMap.map(c => c.views))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {globalMap.length > 8 && (
                  <div className="text-center pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      +{globalMap.length - 8} more countries
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Globe className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Global engagement data will appear as users access your documents
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">📊 Analytics Insights</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {avgEngagement >= 70 && (
              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    High Engagement
                  </p>
                  <p className="text-sm text-green-700">
                    Your documents are performing excellently with {avgEngagement}% average engagement!
                  </p>
                </div>
              </div>
            )}

            {totalCountries >= 3 && (
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Global Reach
                  </p>
                  <p className="text-sm text-blue-700">
                    Your content is reaching {totalCountries} countries worldwide. Consider internationalization.
                  </p>
                </div>
              </div>
            )}

            {topDocuments.length >= 5 && (
              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    Content Portfolio
                  </p>
                  <p className="text-sm text-purple-700">
                    You have {topDocuments.length} documents generating valuable engagement data.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}