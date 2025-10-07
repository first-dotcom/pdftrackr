"use client";

import SkeletonLoader from "@/components/SkeletonLoader";
import { useApi } from "@/hooks/useApi";
import { config } from "@/lib/config";
import { formatDuration } from "@/utils/formatters";
import { trackEvent } from "@/hooks/useAnalyticsConsent";
import { useAuth, useUser } from "@clerk/nextjs";
import { BarChart3, Clock, Eye, FileText, Mail, Plus, TrendingUp, Play, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileCard } from "@/components/FileCard";
import type { File } from "@/shared/types";
import { useRouter } from "next/navigation";

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
    size?: number;
    createdAt?: string | null;
    shareLinks?: Array<{ id: number; isActive: boolean; expiresAt: string | null }>;
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
  const [_timeRange] = useState("all");
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  const { isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const api = useApi();
  const router = useRouter();

  const isReady = authLoaded && userLoaded;

  useEffect(() => {
    if (isReady && user) {
      fetchDashboardData();
    }
  }, [isReady, user]);

  // Track empty dashboard views
  useEffect(() => {
    if (isReady && user && dashboardData && dashboardData.totalFiles === 0) {
      trackEvent("empty_dashboard_views", {
        user_id: user.id,
        timestamp: new Date().toISOString(),
      });
    }
  }, [isReady, user, dashboardData]);

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

  const statCards: Array<{
    name: string;
    value: number;
    icon: any;
    color: string;
    isDuration?: boolean;
  }> = [
    {
      name: "Files",
      value: dashboardData?.totalFiles || 0,
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      name: "Views",
      value: dashboardData?.totalViews || 0,
      icon: Eye,
      color: "bg-green-500",
    },
    {
      name: "Email Captures",
      value: dashboardData?.emailCaptures || 0,
      icon: Mail,
      color: "bg-yellow-500",
    },
    {
      name: "Average Duration",
      value: dashboardData?.avgDuration || 0,
      icon: Clock,
      color: "bg-orange-500",
      isDuration: true,
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

      {/* New User Onboarding - Single Focused Experience */}
      {dashboardData && dashboardData.totalFiles === 0 && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="card-body text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
              <Play className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Welcome to PDFTrackr!
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-lg mx-auto">
              See how PDF tracking works with our interactive demo, then upload your own files.
            </p>
            <div className="space-y-4">
              <Link
                href="/demo"
                onClick={() => {
                  trackEvent("demo_clicked_from_dashboard", {
                    user_id: user?.id,
                    source: "empty_dashboard",
                    timestamp: new Date().toISOString(),
                  });
                }}
                className="btn-primary btn-lg w-full sm:w-auto flex items-center justify-center"
              >
                <Play className="h-5 w-5 mr-2" />
                Try the Demo First
              </Link>
              <p className="text-sm text-gray-500">
                Takes 2 minutes • No signup required
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall metrics - borderless chip row */}
      {dashboardData && (
        <div className="">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {statCards.map((stat) => (
              <div key={stat.name} className="bg-white rounded-lg p-2.5 sm:p-3 border border-gray-200 shadow-xs">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.color} p-1.5 sm:p-1.5 rounded-md`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                    <p className="text-[11px] sm:text-[12px] font-medium text-gray-700 truncate">
                      {stat.name}
                    </p>
                    <p className="text-sm sm:text-lg font-semibold text-gray-900">
                      {stat.isDuration ? formatDuration(stat.value) : formatNumber(stat.value)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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
            <div className="space-y-3 sm:space-y-4">
              {dashboardData.topFiles.slice(0, 5).map((f) => {
                const fileLike: File = {
                  id: f.fileId,
                  userId: "",
                  title: f.title || f.originalName || "Untitled Document",
                  originalName: f.originalName || f.title || "Untitled Document",
                  size: f.size || 0,
                  mimeType: "application/pdf",
                  createdAt: f.createdAt ? new Date(f.createdAt as any).toISOString() : "",
                  updatedAt: "",
                  storagePath: "",
                  shareLinks: (f.shareLinks as any) || [],
                  viewCount: f.viewCount,
                } as unknown as File;

                return (
                  <FileCard
                    key={f.fileId}
                    file={fileLike}
                    onView={(id) => router.push(`/dashboard/files/${id}`)}
                    onShare={() => router.push(`/dashboard/files`)}
                    onDelete={() => router.push(`/dashboard/files`)}
                    hideActions
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
