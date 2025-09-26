"use client";

import { useApi } from "@/hooks/useApi";
import { calculatePercentage, formatFileSize, getStorageColor } from "@/utils/formatters";
import { useAuth, useUser } from "@clerk/nextjs";
import { AlertCircle, FileText, HardDrive, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

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
        const errorMessage =
          typeof response.error === "string"
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

  const storagePercentage = calculatePercentage(storage.storageUsed, storage.storageQuota);
  const filesPercentage =
    storage.filesQuota === -1 ? 0 : calculatePercentage(storage.filesCount, storage.filesQuota);

  // Show loading state while Clerk is initializing
  if (!isReady) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Storage Usage</h3>
        </div>
        <div className="card-body p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-2.5 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-2.5 bg-gray-200 rounded w-full" />
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
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Storage Usage</h3>
        </div>
        <div className="card-body p-4 sm:p-6">
          <div className="text-center py-8 sm:py-12">
            <HardDrive className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
            <p className="mt-4 text-sm sm:text-base text-gray-500">
              Please sign in to view your storage usage.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Storage Usage</h3>
        </div>
        <div className="card-body p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-2.5 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-2.5 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Storage Usage</h3>
        </div>
        <div className="card-body p-4 sm:p-6">
          <div className="text-center py-8 sm:py-12">
            <HardDrive className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-red-400" />
            <p className="mt-4 text-sm sm:text-base text-red-600">{error}</p>
            <button type="button" onClick={fetchStorageInfo} className="mt-4 btn-outline btn-md">
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
        <h3 className="text-base sm:text-lg font-medium text-gray-900">Storage Usage</h3>
      </div>
      <div className="card-body p-4 sm:p-6 space-y-6">
        {/* Storage Usage - Modern Design */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border border-blue-200">
                <HardDrive className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm sm:text-base font-medium text-gray-900">Storage</h4>
                <p className="text-xs sm:text-sm text-gray-500">Used vs. Available</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm sm:text-base font-semibold text-gray-900">
                {formatFileSize(storage.storageUsed)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                of {formatFileSize(storage.storageQuota)}
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ease-out shadow-sm ${getStorageColor(
                storagePercentage,
              )}`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-500">{storagePercentage.toFixed(1)}% used</p>
            <p className="text-xs sm:text-sm text-gray-500">
              {formatFileSize(storage.storageQuota - storage.storageUsed)} remaining
            </p>
          </div>
        </div>

        {/* File Count - Modern Design */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center border border-green-200">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm sm:text-base font-medium text-gray-900">Files</h4>
                <p className="text-xs sm:text-sm text-gray-500">Uploaded documents</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm sm:text-base font-semibold text-gray-900">
                {storage.filesCount}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                of {storage.filesQuota === -1 ? "∞" : storage.filesQuota}
              </p>
            </div>
          </div>
          {storage.filesQuota !== -1 && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ease-out shadow-sm ${getStorageColor(
                    filesPercentage,
                  )}`}
                  style={{ width: `${Math.min(filesPercentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-gray-500">
                  {filesPercentage.toFixed(1)}% used
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {storage.filesQuota - storage.filesCount} remaining
                </p>
              </div>
            </>
          )}
        </div>

        {/* Plan Info - Modern Badge Design */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-900 capitalize">
                {storage.plan} Plan
              </h4>
              <p className="text-xs sm:text-sm text-gray-500">Current subscription</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center border border-primary-200">
              <TrendingUp className="h-5 w-5 text-primary-600" />
            </div>
          </div>

          {storage.plan === "free" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  document.getElementById("waitlist-modal")?.classList.remove("hidden")
                }
                className="w-full btn-primary btn-md flex items-center justify-center"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Join Waitlist for Pro Plans
              </button>
              <p className="text-xs sm:text-sm text-gray-500 text-center">
                Premium plans launching Q4 2025
              </p>
            </div>
          )}
        </div>

        {/* Warning for high usage - Modern Alert */}
        {storagePercentage > 80 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-1">Storage Space Low</h4>
                <p className="text-sm text-yellow-700">
                  You're running low on storage space. Consider upgrading your plan or removing
                  unused files.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
