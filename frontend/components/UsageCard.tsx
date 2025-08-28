"use client";

import { formatFileSize } from "@/utils/formatters";
import { AlertCircle, FileText, HardDrive, TrendingUp } from "lucide-react";

export interface UsageCardProps {
  storageUsed: number;
  storageQuota: number;
  filesCount: number;
  filesQuota: number; // -1 for unlimited
  plan?: string;
  isLoading?: boolean;
}

function getProgressColor(percentage: number) {
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 75) return "bg-yellow-500";
  return "bg-green-500";
}

function calculatePercentage(used: number, total: number) {
  if (!total || total <= 0) return 0;
  return (used / total) * 100;
}

export function UsageCardSkeleton() {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-base sm:text-lg font-medium text-gray-900">Storage Usage</h3>
      </div>
      <div className="card-body p-4 sm:p-6 space-y-6">
        {/* Storage block skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="ml-3">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-gray-200 rounded w-20 ml-auto mb-1" />
              <div className="h-3 bg-gray-200 rounded w-24 ml-auto" />
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="h-3 bg-gray-300 rounded-full w-1/3" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-28" />
          </div>
        </div>

        {/* Files block skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="ml-3">
                <div className="h-4 bg-gray-200 rounded w-20 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-28" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-gray-200 rounded w-10 ml-auto mb-1" />
              <div className="h-3 bg-gray-200 rounded w-16 ml-auto" />
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="h-3 bg-gray-300 rounded-full w-1/4" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        </div>

        {/* Plan block skeleton */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-32" />
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          </div>
        </div>

        {/* Warning placeholder to avoid jump when shown */}
        <div className="h-16 bg-transparent" />
      </div>
    </div>
  );
}

export default function UsageCard({
  storageUsed,
  storageQuota,
  filesCount,
  filesQuota,
  plan,
  isLoading,
}: UsageCardProps) {
  if (isLoading) {
    return <UsageCardSkeleton />;
  }

  const storagePct = calculatePercentage(storageUsed, storageQuota);
  const filesPct = filesQuota === -1 ? 0 : calculatePercentage(filesCount, filesQuota);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-base sm:text-lg font-medium text-gray-900">Storage Usage</h3>
      </div>
      <div className="card-body p-4 sm:p-6 space-y-6">
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
                {formatFileSize(storageUsed)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">of {formatFileSize(storageQuota)}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ease-out shadow-sm ${getProgressColor(
                storagePct,
              )}`}
              style={{ width: `${Math.min(storagePct, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-500">{storagePct.toFixed(1)}% used</p>
            <p className="text-xs sm:text-sm text-gray-500">
              {formatFileSize(Math.max(storageQuota - storageUsed, 0))} remaining
            </p>
          </div>
        </div>

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
              <p className="text-sm sm:text-base font-semibold text-gray-900">{filesCount}</p>
              <p className="text-xs sm:text-sm text-gray-500">
                of {filesQuota === -1 ? "∞" : filesQuota}
              </p>
            </div>
          </div>
          {filesQuota !== -1 && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ease-out shadow-sm ${getProgressColor(
                    filesPct,
                  )}`}
                  style={{ width: `${Math.min(filesPct, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-gray-500">{filesPct.toFixed(1)}% used</p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {Math.max(filesQuota - filesCount, 0)} remaining
                </p>
              </div>
            </>
          )}
        </div>

        {storagePct > 80 && (
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

        {plan && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-900 capitalize">
                  {plan} Plan
                </h4>
                <p className="text-xs sm:text-sm text-gray-500">Current subscription</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center border border-primary-200">
                <TrendingUp className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
