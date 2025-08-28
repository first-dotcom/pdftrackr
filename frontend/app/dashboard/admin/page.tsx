"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import SkeletonLoader from "@/components/SkeletonLoader";
import { useAdmin } from "@/hooks/useAdmin";
import { formatFileSize } from "@/utils/formatters";
import { useAuth, useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { Clock, Cloud, Database, HardDrive, Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface AdminStats {
  totalUsers: number;
  totalFiles: number;
  totalViews: number;
  totalWaitlist: number;
  storageUsed: number;
  doSpacesUsage: number;
  storageLimit: number | null;
}

interface AdminUser {
  id: number;
  email: string;
  plan: string;
  createdAt: string;
  filesCount: number;
  storageUsed: number;
  totalViews: number;
}

interface WaitlistEntry {
  id: number;
  email: string;
  plan: string;
  source?: string;
  createdAt: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"users" | "waitlist">("users");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded: authLoaded, getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const isReady = authLoaded && userLoaded;

  useEffect(() => {
    if (isReady && user) {
      fetchData();
    }
  }, [isReady, user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      // Fetch stats
      const statsResponse = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!statsResponse.ok) throw new Error("Failed to fetch admin stats");
      const statsData = await statsResponse.json();
      setStats(statsData.data);

      // Fetch users
      const usersResponse = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!usersResponse.ok) throw new Error("Failed to fetch users");
      const usersData = await usersResponse.json();
      setUsers(usersData.data);

      // Fetch waitlist
      const waitlistResponse = await fetch("/api/admin/waitlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!waitlistResponse.ok) throw new Error("Failed to fetch waitlist");
      const waitlistData = await waitlistResponse.json();
      setWaitlist(waitlistData.data);
    } catch (error) {
      console.error("Admin data fetch error:", error);
      setError(error instanceof Error ? error.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Invalid date";
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "business":
        return "bg-purple-100 text-purple-800";
      case "pro":
        return "bg-blue-100 text-blue-800";
      case "starter":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isReady) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="list" count={5} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You need to be signed in to access the admin panel.</p>
      </div>
    );
  }

  if (!isAdmin && !adminLoading) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Access Required</h3>
        <p className="text-gray-500">You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {loading ? (
          <div className="space-y-6">
            <SkeletonLoader type="stats" count={4} />
            <SkeletonLoader type="card" count={1} />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load admin data</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button onClick={fetchData} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <HardDrive className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Files</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalFiles || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalViews || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Waitlist</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalWaitlist || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Usage */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Usage</h3>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>
                    Storage: {formatFileSize(stats?.storageUsed || 0)}
                    {stats?.storageLimit ? ` / ${formatFileSize(stats.storageLimit)}` : ""}
                  </span>
                  <span>
                    {stats?.storageLimit
                      ? Math.round(((stats?.storageUsed || 0) / (stats.storageLimit || 1)) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        stats?.storageLimit
                          ? ((stats?.storageUsed || 0) / (stats.storageLimit || 1)) * 100
                          : 0,
                        100,
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">DB:</span>
                  <span className="font-medium">{formatFileSize(stats?.storageUsed || 0)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Cloud className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">DO:</span>
                  <span className="font-medium">{formatFileSize(stats?.doSpacesUsage || 0)}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "users"
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Users
                  </button>
                  <button
                    onClick={() => setActiveTab("waitlist")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "waitlist"
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Waitlist
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "users" ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tier
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Files
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Storage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Views
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanBadgeColor(
                                  user.plan,
                                )}`}
                              >
                                {user.plan}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.filesCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatFileSize(user.storageUsed)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.totalViews}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Plan Requested
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {waitlist.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {entry.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanBadgeColor(
                                  entry.plan,
                                )}`}
                              >
                                {entry.plan}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(entry.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
