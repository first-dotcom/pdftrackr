"use client";

// import SimpleStats from "@/components/SimpleStats";
import { FileCard } from "@/components/FileCard";
import OverallMetrics from "@/components/OverallMetrics";
import type { File } from "@/shared/types";
import { formatDuration } from "@/utils/formatters";
import { ArrowLeft, Clock, Eye, FileText, Mail, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// Sample data for the demo dashboard
const sampleDashboardData = {
  totalFiles: 8,
  totalViews: 247,
  totalUniqueViews: 89,
  totalDuration: 1847293, // in milliseconds
  avgDuration: 7479, // in milliseconds
  emailCaptures: 23,
  recentViews: [
    {
      id: 1,
      shareId: "demo-abc123",
      viewerEmail: "john.doe@example.com",
      viewerName: "John Doe",
      country: "United States",
      city: "New York",
      device: "Desktop",
      browser: "Chrome",
      os: "Windows",
      startedAt: "2025-01-15T14:30:00.000Z",
      totalDuration: 125000,
      isUnique: true,
    },
    {
      id: 2,
      shareId: "demo-def456",
      viewerEmail: "sarah.wilson@company.com",
      viewerName: "Sarah Wilson",
      country: "Canada",
      city: "Toronto",
      device: "Mobile",
      browser: "Safari",
      os: "iOS",
      startedAt: "2025-01-15T13:45:00.000Z",
      totalDuration: 89000,
      isUnique: true,
    },
    {
      id: 3,
      shareId: "demo-ghi789",
      viewerEmail: null,
      viewerName: null,
      country: "United Kingdom",
      city: "London",
      device: "Desktop",
      browser: "Firefox",
      os: "macOS",
      startedAt: "2025-01-15T12:20:00.000Z",
      totalDuration: 156000,
      isUnique: false,
    },
    {
      id: 4,
      shareId: "demo-jkl012",
      viewerEmail: "mike.chen@startup.io",
      viewerName: "Mike Chen",
      country: "Australia",
      city: "Sydney",
      device: "Tablet",
      browser: "Chrome",
      os: "Android",
      startedAt: "2025-01-15T11:15:00.000Z",
      totalDuration: 203000,
      isUnique: true,
    },
    {
      id: 5,
      shareId: "demo-mno345",
      viewerEmail: null,
      viewerName: null,
      country: "Germany",
      city: "Berlin",
      device: "Desktop",
      browser: "Edge",
      os: "Windows",
      startedAt: "2025-01-15T10:30:00.000Z",
      totalDuration: 67000,
      isUnique: true,
    },
  ],
  topFiles: [
    {
      fileId: 1,
      title: "Q3 Financial Report 2025",
      originalName: "Q3_Financial_Report_2025.pdf",
      viewCount: 89,
      uniqueViewCount: 45,
      totalDuration: 1245000,
      slug: "q3-financial-report-2025",
    },
    {
      fileId: 2,
      title: "Product Launch Strategy 2025",
      originalName: "Product_Launch_Strategy_2025.pdf",
      viewCount: 67,
      uniqueViewCount: 32,
      totalDuration: 892000,
      slug: "product-launch-strategy-2025",
    },
    {
      fileId: 3,
      title: "Client Proposal Template",
      originalName: "Client_Proposal_Template.pdf",
      viewCount: 45,
      uniqueViewCount: 28,
      totalDuration: 456000,
      slug: "client-proposal-template",
    },
    {
      fileId: 4,
      title: "September Team Meeting Notes",
      originalName: "September_Team_Meeting_Notes.pdf",
      viewCount: 23,
      uniqueViewCount: 15,
      totalDuration: 234000,
      slug: "september-team-meeting-notes",
    },
    {
      fileId: 5,
      title: "Fall Marketing Campaign Brief",
      originalName: "Fall_Marketing_Campaign_Brief.pdf",
      viewCount: 18,
      uniqueViewCount: 12,
      totalDuration: 189000,
      slug: "fall-marketing-campaign-brief",
    },
  ],
  viewsByDay: [
    { date: "2025-01-09", views: 12, uniqueViews: 8 },
    { date: "2025-01-10", views: 18, uniqueViews: 12 },
    { date: "2025-01-11", views: 25, uniqueViews: 16 },
    { date: "2025-01-12", views: 31, uniqueViews: 19 },
    { date: "2025-01-13", views: 28, uniqueViews: 17 },
    { date: "2025-01-14", views: 35, uniqueViews: 22 },
    { date: "2025-01-15", views: 42, uniqueViews: 28 },
  ],
};

// Storage demo data removed; demo no longer shows storage widget to match dashboard

export default function DemoPageClient() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

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
      value: sampleDashboardData.totalFiles,
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      name: "Views",
      value: sampleDashboardData.totalViews,
      icon: Eye,
      color: "bg-green-500",
    },
    {
      name: "Email Captures",
      value: sampleDashboardData.emailCaptures,
      icon: Mail,
      color: "bg-yellow-500",
    },
    {
      name: "Average Time Spent",
      value: sampleDashboardData.avgDuration,
      icon: Clock,
      color: "bg-orange-500",
      isDuration: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link 
                href={isSignedIn ? "/dashboard" : "/"} 
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                {isSignedIn ? "Back to Dashboard" : "Back to Home"}
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Live Demo Dashboard
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header with Upload Button - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Demo Dashboard</h1>
              <p className="text-gray-600">Experience PDFTrackr's full analytics capabilities</p>
            </div>
            <div className="sm:ml-4" />
          </div>

          {/* Demo Navigation Guide removed to match dashboard */}

          {/* Overall metrics - shared component */}
          <OverallMetrics items={statCards} />

          {/* Top Files - reuse FileCard for parity with dashboard (placed before Recent Views) */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-h3 flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Top Files
              </h3>
            </div>
            <div className="card-body p-3 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                {sampleDashboardData.topFiles.slice(0, 5).map((f) => {
                  const fileLike: File = {
                    id: f.fileId,
                    userId: "",
                    title: f.title || f.originalName || "Untitled Document",
                    originalName: f.originalName || f.title || "Untitled Document",
                    size: 0,
                    mimeType: "application/pdf",
                    createdAt: "",
                    updatedAt: "",
                    storagePath: "",
                    shareLinks: [],
                    viewCount: f.viewCount,
                  } as unknown as File;

                  return (
                    <FileCard
                      key={f.fileId}
                      file={fileLike}
                      onView={() => router.push(`/demo/files/${f.slug}`)}
                      onShare={() => router.push(`/demo`)}
                      onDelete={() => router.push(`/demo`)}
                      hideActions
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity - synced heading */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-h3 flex items-center">
                <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Recent Views
              </h3>
            </div>
            <div className="card-body p-3 sm:p-4">
              <div className="space-y-2 sm:space-y-3">
                {sampleDashboardData.recentViews.slice(0, 5).map((view) => (
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
                          {formatDuration(view.totalDuration)} • {view.city || view.country || "Unknown location"}
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

          {/* Removed extra demo-only sections to mirror dashboard layout */}
        </div>
      </div>
    </div>
  );
}


