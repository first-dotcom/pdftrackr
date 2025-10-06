"use client";

import { useApi } from "@/hooks/useApi";
import { calculatePercentage, formatFileSize } from "@/utils/formatters";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

interface UsageData {
  storageUsed: number;
  storageQuota: number;
  filesCount: number;
  filesQuota: number; // -1 means unlimited
}

function getRingColorClass(percent: number): string {
  if (percent >= 90) return "text-red-500";
  if (percent >= 80) return "text-yellow-500";
  return "text-primary-600";
}

function Ring({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  const size = 28; // px on base
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percent, 0), 100);
  const dash = (clamped / 100) * circumference;
  const colorClass = getRingColorClass(clamped);

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      <span className="text-[10px] sm:text-xs text-gray-600">{label}</span>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          className={colorClass}
          stroke="currentColor"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="text-[8px] sm:text-[9px] fill-gray-700"
        >
          {Math.round(clamped)}%
        </text>
      </svg>
    </div>
  );
}

export default function HeaderUsageRings() {
  const { isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const api = useApi();

  const isReady = authLoaded && userLoaded;
  const [data, setData] = useState<UsageData | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (isReady && user) {
      const run = async () => {
        try {
          const response = await api.users.profile();
          if (response.success && response.data) {
            const userData = (response.data as any).user;
            const quotas = (response.data as any).quotas;
            setData({
              storageUsed: userData.storageUsed,
              storageQuota: quotas.storage,
              filesCount: userData.filesCount,
              filesQuota: quotas.fileCount,
            });
          }
        } catch {}
      };
      run();
    }
  }, [isReady, user, api]);

  if (!isReady || !user) return null;

  const storagePct = data ? calculatePercentage(data.storageUsed, data.storageQuota) : 0;
  const filesPct = data ? (data.filesQuota === -1 ? 0 : calculatePercentage(data.filesCount, data.filesQuota)) : 0;

  const ariaLabel = data
    ? `Files: ${data.filesCount} of ${data.filesQuota === -1 ? "unlimited" : data.filesQuota} (${Math.round(
        filesPct,
      )}%). Storage: ${formatFileSize(data.storageUsed)} of ${formatFileSize(data.storageQuota)} (${Math.round(
        storagePct,
      )}%).`
    : "Usage info";

  return (
    <div
      className="relative flex items-center space-x-3 sm:space-x-4 mr-1"
      ref={containerRef}
      onMouseEnter={() => {
        if (closeTimer.current) {
          window.clearTimeout(closeTimer.current);
          closeTimer.current = null;
        }
        setOpen(true);
      }}
      onMouseLeave={() => {
        if (closeTimer.current) window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setOpen(false), 200);
      }}
      onClick={() => setOpen((v) => !v)}
      aria-label={ariaLabel}
    >
      <Ring label="Files" percent={filesPct} />
      <Ring label="Storage" percent={storagePct} />

      {open && data && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-40"
          onMouseEnter={() => {
            if (closeTimer.current) {
              window.clearTimeout(closeTimer.current);
              closeTimer.current = null;
            }
          }}
          onMouseLeave={() => {
            if (closeTimer.current) window.clearTimeout(closeTimer.current);
            closeTimer.current = window.setTimeout(() => setOpen(false), 200);
          }}
        >
          <div className="text-sm text-gray-900 font-medium mb-2">Usage</div>
          <div className="text-xs text-gray-700 space-y-1 mb-3">
            <div>
              Files: {data.filesCount} of {data.filesQuota === -1 ? "∞" : data.filesQuota} ({Math.round(filesPct)}%)
            </div>
            <div>
              Storage: {formatFileSize(data.storageUsed)} of {formatFileSize(data.storageQuota)} ({Math.round(storagePct)}%)
            </div>
          </div>
          <button
            type="button"
            className="btn-primary btn-sm w-full"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById("waitlist-modal")?.classList.remove("hidden");
            }}
          >
            Join wait list
          </button>
        </div>
      )}
    </div>
  );
}


