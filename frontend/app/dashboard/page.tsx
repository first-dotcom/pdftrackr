"use client";

import SimpleStats from "@/components/SimpleStats";
import SkeletonLoader from "@/components/SkeletonLoader";
import StorageUsage from "@/components/StorageUsage";
import { useApi } from "@/hooks/useApi";
import { config } from "@/lib/config";
import { formatDuration } from "@/utils/formatters";
import { useAuth, useUser } from "@clerk/nextjs";
import { BarChart3, Clock, Eye, FileText, Mail, Plus, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardData {
  totalFiles: number;
  totalViews: number;
  totalUniqueViews: number;
  totalDuration: number;
  avgDuration: number;
  emailCaptures: number;
  recentViews: Array<{
    id: number;
    shareId: string;
    viewerEmail: string | null;
    viewerName: string | null;
    country: string | null;
    city: string | null;
    device: string | null;
    browser: string | null;
    os: string | null;
    startedAt: string;
    totalDuration: number;
    isUnique: boolean;
  }>;
  topFiles: Array<{
    fileId: number;
    title: string | null;
    originalName: string;
    viewCount: number;
    uniqueViewCount: number;
    totalDuration: number;
  }>;
  viewsByDay: Array<{
    date: string;
    views: number;
    uniqueViews: number;
  }>;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [_timeRange] = useState("30d");
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  const { isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const api = useApi();

  const isReady = authLoaded && userLoaded;

  useEffect(() => {
    if (isReady && user) {
      fetchDashboardData();
    }
  }, [isReady, user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.analytics.dashboard();

      if (response.success && response.data) {
        setDashboardData(response.data as DashboardData);
      } else {
        const errorMessage =
          typeof response.error === "string"
            ? response.error
            : response.error?.message || "Failed to fetch dashboard data";
        setError(errorMessage);
      }
    } catch (error) {
      setError("Failed to fetch dashboard information");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | string | undefined | null) => {
    if (num === undefined || num === null) {
      return "0";
    }
    return Number(num).toLocaleString();
  };

  const statCards = [
    {
      name: "Total Files",
      value: dashboardData?.totalFiles || 0,
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      name: "Total Views",
      value: dashboardData?.totalViews || 0,
      icon: Eye,
      color: "bg-green-500",
    },
    {
      name: "Unique Viewers",
      value: dashboardData?.totalUniqueViews || 0,
      icon: Users,
      color: "bg-purple-500",
    },
    {
      name: "Email Captures",
      value: dashboardData?.emailCaptures || 0,
      icon: Mail,
      color: "bg-orange-500",
    },
  ];

  // Show loading state while Clerk is initializing
  if (!isReady) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="stats" count={4} />
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-body text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Authentication Required</h3>
            <p className="mt-1 text-sm text-gray-500">Please sign in to view your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Upload Button - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="flex-1">{/* Welcome message is handled by header */}</div>
        <div className="sm:ml-4">
          <Link
            href="/dashboard/files/upload"
            className="btn-primary btn-md flex items-center justify-center w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload PDF
          </Link>
        </div>
      </div>

      {/* Key Metrics - Mobile Responsive */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-body p-3 sm:p-4">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} p-1.5 sm:p-2 rounded-md`}>
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="ml-2 sm:ml-4 flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    {stat.name}
                  </p>
                  <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                    {formatNumber(stat.value)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Storage Usage */}
      <StorageUsage />

      {/* Recent Activity - Mobile Responsive */}
      {dashboardData && dashboardData.recentViews && dashboardData.recentViews.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
              <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Recent Views
            </h3>
          </div>
          <div className="card-body p-3 sm:p-4">
            <div className="space-y-2 sm:space-y-3">
              {dashboardData.recentViews.slice(0, 5).map((view) => (
                <div
                  key={view.id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                    <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {view.viewerName || view.viewerEmail || "Anonymous"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {formatDuration(view.totalDuration)} •{" "}
                        {view.city || view.country || "Unknown location"}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {new Date(view.startedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Files - Mobile Responsive */}
      {dashboardData && dashboardData.topFiles && dashboardData.topFiles.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
              <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Top Files
            </h3>
          </div>
          <div className="card-body p-3 sm:p-4">
            <div className="space-y-2 sm:space-y-3">
              {dashboardData.topFiles.slice(0, 5).map((file, index) => (
                <div
                  key={file.fileId}
                  className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-green-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {file.title || "Untitled Document"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {formatNumber(file.viewCount)} views • {formatNumber(file.uniqueViewCount)}{" "}
                        unique
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/files/${file.fileId}`}
                    className="text-primary-600 hover:text-primary-800 text-xs sm:text-sm font-medium flex-shrink-0 ml-2"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State - Mobile Responsive */}
      {dashboardData && dashboardData.totalFiles === 0 && (
        <div className="card">
          <div className="card-body text-center py-8 sm:py-12">
            <FileText className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
            <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900">No files yet</h3>
            <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
              Upload your first PDF to start tracking views and sharing securely.
            </p>
            <div className="mt-4 sm:mt-6">
              <Link
                href="/dashboard/files/upload"
                className="btn-primary btn-lg flex items-center justify-center w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Upload PDF
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Simple Stats - Show if user has files */}
      {dashboardData && dashboardData.totalFiles > 0 && <SimpleStats userId={user?.id} />}
    </div>
  );
}
