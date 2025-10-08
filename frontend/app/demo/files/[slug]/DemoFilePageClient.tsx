"use client";

import FileDetailPageContent from "@/components/FileDetailPageContent";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Demo file data
const demoFiles = {
  "q3-financial-report-2025": {
    id: 1,
    userId: 1,
    filename: "Q3_Financial_Report_2025.pdf",
    originalName: "Q3_Financial_Report_2025.pdf",
    size: 2048576, // 2MB
    mimeType: "application/pdf",
    storageKey: "demo/q3-financial-report-2025.pdf",
    storageUrl: "https://pdftrackr.com/demo/q3-financial-report-2025.pdf",
    title: "Q3 Financial Report 2025",
    description: "Quarterly financial report for Q3 2025",
    isPublic: false,
    downloadEnabled: true,
    watermarkEnabled: false,
    password: null as string | null,
    ipAddress: null as string | null,
    userAgent: null as string | null,
    fileHash: "demo-hash-q3-2025",
    scanStatus: "clean",
    securityFlags: null as string[] | null,
    pageCount: 12,
    createdAt: "2025-09-15T10:30:00.000Z",
    updatedAt: "2025-09-15T10:30:00.000Z",
    viewCount: 89,
    shareLinksCount: 2,
    uniqueViewCount: 45,
    avgDuration: 184000, // 3m 4s
    shareId: "demo-q3-financial-2025",
    shareUrl: "https://pdftrackr.com/view/demo-q3-financial-2025",
    viewers: [
      { name: "John Smith", location: "New York, NY", duration: 245000, isUnique: true },
      { name: "Sarah Johnson", location: "San Francisco, CA", duration: 189000, isUnique: true },
      { name: "Mike Chen", location: "Toronto, ON", duration: 156000, isUnique: true },
      { name: "Anonymous", location: "London, UK", duration: 134000, isUnique: false },
      { name: "Lisa Wang", location: "Sydney, AU", duration: 298000, isUnique: true },
      { name: "David Brown", location: "Chicago, IL", duration: 167000, isUnique: true },
      { name: "Anonymous", location: "Berlin, DE", duration: 123000, isUnique: false },
      { name: "Emma Davis", location: "Vancouver, BC", duration: 201000, isUnique: true },
    ]
  },
  "product-launch-strategy-2025": {
    id: 2,
    userId: 1,
    filename: "Product_Launch_Strategy_2025.pdf",
    originalName: "Product_Launch_Strategy_2025.pdf",
    size: 1536000, // 1.5MB
    mimeType: "application/pdf",
    storageKey: "demo/product-launch-strategy-2025.pdf",
    storageUrl: "https://pdftrackr.com/demo/product-launch-strategy-2025.pdf",
    title: "Product Launch Strategy 2025",
    description: "Strategic plan for product launch in 2025",
    isPublic: false,
    downloadEnabled: true,
    watermarkEnabled: false,
    password: null as string | null,
    ipAddress: null as string | null,
    userAgent: null as string | null,
    fileHash: "demo-hash-product-launch-2025",
    scanStatus: "clean",
    securityFlags: null as string[] | null,
    pageCount: 8,
    createdAt: "2025-09-12T14:20:00.000Z",
    updatedAt: "2025-09-12T14:20:00.000Z",
    viewCount: 67,
    shareLinksCount: 1,
    uniqueViewCount: 32,
    avgDuration: 142000, // 2m 22s
    shareId: "demo-product-launch-2025",
    shareUrl: "https://pdftrackr.com/view/demo-product-launch-2025",
    viewers: [
      { name: "Alex Rodriguez", location: "Miami, FL", duration: 198000, isUnique: true },
      { name: "Jennifer Lee", location: "Seattle, WA", duration: 156000, isUnique: true },
      { name: "Anonymous", location: "Paris, FR", duration: 134000, isUnique: false },
      { name: "Tom Wilson", location: "Austin, TX", duration: 189000, isUnique: true },
      { name: "Maria Garcia", location: "Madrid, ES", duration: 167000, isUnique: true },
      { name: "Anonymous", location: "Tokyo, JP", duration: 145000, isUnique: false },
      { name: "Chris Taylor", location: "Boston, MA", duration: 201000, isUnique: true },
    ]
  },
  "client-proposal-template": {
    id: 3,
    userId: 1,
    filename: "Client_Proposal_Template.pdf",
    originalName: "Client_Proposal_Template.pdf",
    size: 1024000, // 1MB
    mimeType: "application/pdf",
    storageKey: "demo/client-proposal-template.pdf",
    storageUrl: "https://pdftrackr.com/demo/client-proposal-template.pdf",
    title: "Client Proposal Template",
    description: "Professional client proposal template",
    isPublic: false,
    downloadEnabled: true,
    watermarkEnabled: false,
    password: null as string | null,
    ipAddress: null as string | null,
    userAgent: null as string | null,
    fileHash: "demo-hash-client-proposal",
    scanStatus: "clean",
    securityFlags: null as string[] | null,
    pageCount: 6,
    createdAt: "2025-09-10T09:15:00.000Z",
    updatedAt: "2025-09-10T09:15:00.000Z",
    viewCount: 45,
    shareLinksCount: 1,
    uniqueViewCount: 28,
    avgDuration: 156000, // 2m 36s
    shareId: "demo-client-proposal",
    shareUrl: "https://pdftrackr.com/view/demo-client-proposal",
    viewers: [
      { name: "Rachel Green", location: "Los Angeles, CA", duration: 189000, isUnique: true },
      { name: "Anonymous", location: "Dublin, IE", duration: 123000, isUnique: false },
      { name: "Kevin Park", location: "Denver, CO", duration: 201000, isUnique: true },
      { name: "Sophie Martin", location: "Montreal, QC", duration: 167000, isUnique: true },
      { name: "Anonymous", location: "Amsterdam, NL", duration: 145000, isUnique: false },
      { name: "James Wilson", location: "Phoenix, AZ", duration: 198000, isUnique: true },
    ]
  },
  "september-team-meeting-notes": {
    id: 4,
    userId: 1,
    filename: "September_Team_Meeting_Notes.pdf",
    originalName: "September_Team_Meeting_Notes.pdf",
    size: 768000, // 768KB
    mimeType: "application/pdf",
    storageKey: "demo/september-team-meeting-notes.pdf",
    storageUrl: "https://pdftrackr.com/demo/september-team-meeting-notes.pdf",
    title: "September Team Meeting Notes",
    description: "Meeting notes from September team meeting",
    isPublic: false,
    downloadEnabled: true,
    watermarkEnabled: false,
    password: null as string | null,
    ipAddress: null as string | null,
    userAgent: null as string | null,
    fileHash: "demo-hash-september-meeting",
    scanStatus: "clean",
    securityFlags: null as string[] | null,
    pageCount: 4,
    createdAt: "2025-09-08T16:45:00.000Z",
    updatedAt: "2025-09-08T16:45:00.000Z",
    viewCount: 23,
    shareLinksCount: 1,
    uniqueViewCount: 15,
    avgDuration: 98000, // 1m 38s
    shareId: "demo-september-meeting",
    shareUrl: "https://pdftrackr.com/view/demo-september-meeting",
    viewers: [
      { name: "Anonymous", location: "Stockholm, SE", duration: 89000, isUnique: false },
      { name: "Anna Thompson", location: "Portland, OR", duration: 134000, isUnique: true },
      { name: "Anonymous", location: "Zurich, CH", duration: 78000, isUnique: false },
      { name: "Ryan Murphy", location: "Nashville, TN", duration: 156000, isUnique: true },
      { name: "Anonymous", location: "Copenhagen, DK", duration: 92000, isUnique: false },
    ]
  },
  "fall-marketing-campaign-brief": {
    id: 5,
    userId: 1,
    filename: "Fall_Marketing_Campaign_Brief.pdf",
    originalName: "Fall_Marketing_Campaign_Brief.pdf",
    size: 1280000, // 1.25MB
    mimeType: "application/pdf",
    storageKey: "demo/fall-marketing-campaign-brief.pdf",
    storageUrl: "https://pdftrackr.com/demo/fall-marketing-campaign-brief.pdf",
    title: "Fall Marketing Campaign Brief",
    description: "Marketing campaign brief for fall season",
    isPublic: false,
    downloadEnabled: true,
    watermarkEnabled: false,
    password: null as string | null,
    ipAddress: null as string | null,
    userAgent: null as string | null,
    fileHash: "demo-hash-fall-marketing",
    scanStatus: "clean",
    securityFlags: null as string[] | null,
    pageCount: 7,
    createdAt: "2025-09-05T11:30:00.000Z",
    updatedAt: "2025-09-05T11:30:00.000Z",
    viewCount: 18,
    shareLinksCount: 1,
    uniqueViewCount: 12,
    avgDuration: 167000, // 2m 47s
    shareId: "demo-fall-marketing",
    shareUrl: "https://pdftrackr.com/view/demo-fall-marketing",
    viewers: [
      { name: "Anonymous", location: "Oslo, NO", duration: 134000, isUnique: false },
      { name: "Jessica Kim", location: "San Diego, CA", duration: 189000, isUnique: true },
      { name: "Anonymous", location: "Helsinki, FI", duration: 112000, isUnique: false },
      { name: "Daniel Clark", location: "Atlanta, GA", duration: 201000, isUnique: true },
      { name: "Anonymous", location: "Vienna, AT", duration: 145000, isUnique: false },
    ]
  }
};

export default function DemoFilePageClient() {
  const params = useParams();
  const slug = params.slug as string;

  const fileData = (demoFiles as any)[slug];

  const shareLinks = fileData
    ? [
        {
          id: 1,
          fileId: fileData.id,
          shareId: `${fileData.id}-public`,
          title: `${fileData.title} - Public Share`,
          description: null as string | null,
          password: null as string | null,
          viewCount: Math.floor(fileData.viewCount * 0.7),
          uniqueViewCount: Math.floor(fileData.uniqueViewCount * 0.7),
          createdAt: fileData.createdAt,
          updatedAt: fileData.updatedAt,
          isActive: true,
          emailGatingEnabled: false,
          downloadEnabled: true,
          watermarkEnabled: false,
          maxViews: null as number | null,
          expiresAt: null as string | null,
        },
        {
          id: 2,
          fileId: fileData.id,
          shareId: `${fileData.id}-private`,
          title: `${fileData.title} - Private Share`,
          description: null as string | null,
          password: null as string | null,
          viewCount: Math.max(3, Math.floor(fileData.viewCount * 0.3)),
          uniqueViewCount: Math.max(2, Math.floor(fileData.uniqueViewCount * 0.3)),
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          isActive: true,
          emailGatingEnabled: true,
          downloadEnabled: false,
          watermarkEnabled: true,
          maxViews: 50,
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        },
      ]
    : [];

  const mockAggregate = fileData
    ? {
        fileStats: {
          totalSessions: fileData.viewCount,
          uniqueSessions: fileData.uniqueViewCount,
          avgSessionTime: Math.max(45000, Math.floor((fileData as any).avgDuration || 90000)),
          completionRate: 65,
        },
        pageStats: Array.from({ length: fileData.pageCount }, (_, i) => {
          const p = i + 1;
          const base = 60000 + Math.floor(Math.random() * 90000);
          const variation = Math.floor((Math.sin(p) + 1) * 8000);
          return {
            pageNumber: p,
            totalViews: Math.max(3, Math.floor(fileData.viewCount * (1 - i / (fileData.pageCount + 1)) + Math.random() * 5)),
            medianDuration: base - 5000 + variation,
            avgDuration: base + variation,
            p25Duration: base - 20000 + variation,
            p75Duration: base + 20000 + variation,
            completionRate: Math.max(0, 100 - i * (90 / fileData.pageCount)),
            skimRate: Math.min(100, 10 + i * 2),
          };
        }),
        dropoffFunnel: Array.from({ length: fileData.pageCount }, (_, i) => ({
          page: i + 1,
          reachPercentage: Math.max(5, 100 - i * (90 / fileData.pageCount)),
        })),
      }
    : null;

  const mockIndividual = fileData
    ? {
        sessions: (fileData.viewers || []).slice(0, 8).map((v: any, i: number) => {
          const startedAt = new Date(Date.now() - (i + 1) * 86400000).toISOString();
          const pages = Array.from({ length: Math.max(1, Math.min(fileData.pageCount, fileData.pageCount - (i % 3))) }, (_, idx) => ({
            pageNumber: idx + 1,
            duration: 30000 + Math.floor(Math.random() * 90000),
            viewedAt: startedAt,
            avgDuration: 45000 + Math.floor(Math.random() * 60000),
            totalViews: 1,
          }));
          return {
            sessionId: `demo-session-${i}`,
            startedAt,
            totalDuration: pages.reduce((s, p) => s + p.duration, 0),
            viewerEmail: v.name !== "Anonymous" ? `${v.name.toLowerCase().replace(/\s+/g, ".")}@example.com` : null,
            viewerName: v.name !== "Anonymous" ? v.name : null,
            device: ["Desktop", "Mobile", "Tablet"][i % 3],
            country: (v.location || "Unknown").split(", ").pop() || "Unknown",
            browser: ["Chrome", "Safari", "Firefox"][i % 3],
            os: ["macOS", "Windows", "iOS", "Android"][i % 4],
            isUnique: v.isUnique,
            referer: ["Email", "Direct", "LinkedIn", "Slack"][i % 4],
            pages,
          };
        }),
        pagination: { page: 1, limit: 10, total: Math.min(8, (fileData.viewers || []).length), totalPages: 1 },
        filters: {
          applied: {},
          available: {
            devices: ["Desktop", "Mobile", "Tablet"],
            countries: Array.from(new Set((fileData.viewers || []).map((v: any) => (v.location || "Unknown").split(", ").pop() || "Unknown"))),
          },
        },
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/demo" className="flex items-center text-primary-600 hover:text-primary-700">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Demo Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">Demo File Analytics</div>
              <Link href="/sign-up" className="btn-outline btn-sm">
                Sign up free
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Demo File Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FileDetailPageContent
          isDemo={true}
          mockFile={fileData || null}
          mockShareLinks={shareLinks as any}
          mockAggregate={mockAggregate as any}
          mockIndividual={mockIndividual as any}
        />
      </div>
    </div>
  );
}


