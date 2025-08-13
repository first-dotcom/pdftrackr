"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useApi } from "@/hooks/useApi";
import { HardDrive, TrendingUp, Upload } from "lucide-react";

interface StorageInfo {
  storageUsed: number;
  storageQuota: number;
  filesCount: number;
  filesQuota: number;
  plan: string;
}

export default function StorageUsage() {
  const { isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const api = useApi();
  
  // Wait for both auth and user to be loaded
  const isReady = authLoaded && userLoaded;
  
  const [storage, setStorage] = useState<StorageInfo>({
    storageUsed: 0,
    storageQuota: 0,
    filesCount: 0,
    filesQuota: 0,
    plan: "free",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isReady && user) {
      fetchStorageInfo();
    }
  }, [isReady, user]);

  const fetchStorageInfo = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.users.profile();

      if (response.success && response.data) {
        const userData = (response.data as any).user;
        const quotas = (response.data as any).quotas;

        setStorage({
          storageUsed: userData.storageUsed,
          storageQuota: quotas.storage,
          filesCount: userData.filesCount,
          filesQuota: quotas.fileCount,
          plan: userData.plan,
        });
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || "Failed to fetch storage info";
        setError(errorMessage);
      }
    } catch (error) {
      setError("Failed to fetch storage information");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const storagePercentage =
    storage.storageQuota > 0 ? (storage.storageUsed / storage.storageQuota) * 100 : 0;
  const filesPercentage =
    storage.filesQuota === -1
      ? 0
      : storage.filesQuota > 0
        ? (storage.filesCount / storage.filesQuota) * 100
        : 0;

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) {
      return "bg-red-500";
    }
    if (percentage >= 75) {
      return "bg-yellow-500";
    }
    return "bg-green-500";
  };

  // Show loading state while Clerk is initializing
  if (!isReady) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Storage Usage</h3>
        </div>
        <div className="card-body">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-2 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-2 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if user is not authenticated
  if (!user) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Storage Usage</h3>
        </div>
        <div className="card-body">
          <div className="text-center py-8">
            <HardDrive className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Please sign in to view your storage usage.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Storage Usage</h3>
        </div>
        <div className="card-body">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-2 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-2 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Storage Usage</h3>
        </div>
        <div className="card-body">
          <div className="text-center py-8">
            <HardDrive className="mx-auto h-8 w-8 text-red-400" />
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button type="button" onClick={fetchStorageInfo} className="mt-4 btn-outline btn-sm">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Storage Usage</h3>
      </div>
      <div className="card-body space-y-6">
        {/* Storage Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <HardDrive className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Storage</span>
            </div>
            <span className="text-sm text-gray-500">
              {formatBytes(storage.storageUsed)} / {formatBytes(storage.storageQuota)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(
                storagePercentage,
              )}`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{storagePercentage.toFixed(1)}% used</p>
        </div>

        {/* File Count */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Upload className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Files</span>
            </div>
            <span className="text-sm text-gray-500">
              {storage.filesCount} / {storage.filesQuota === -1 ? "∞" : storage.filesQuota}
            </span>
          </div>
          {storage.filesQuota !== -1 && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(
                    filesPercentage,
                  )}`}
                  style={{ width: `${Math.min(filesPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{filesPercentage.toFixed(1)}% used</p>
            </>
          )}
        </div>

        {/* Plan Info */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 capitalize">{storage.plan} Plan</p>
              <p className="text-xs text-gray-500">Current subscription</p>
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>

          {storage.plan === "free" && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() =>
                  document.getElementById("waitlist-modal")?.classList.remove("hidden")
                }
                className="w-full btn-primary btn-sm text-center"
              >
                Coming Soon - Join Waitlist
              </button>
              <p className="text-xs text-gray-500 mt-1 text-center">Premium plans launching soon</p>
            </div>
          )}
        </div>

        {/* Warning for high usage */}
        {storagePercentage > 80 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              You're running low on storage space. Consider upgrading your plan or removing unused
              files.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
