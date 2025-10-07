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

function getGradientStops(percent: number): { from: string; to: string } {
  if (percent >= 90) return { from: "#dc2626", to: "#b91c1c" }; // red-600 → red-700
  if (percent >= 80) return { from: "#d97706", to: "#b45309" }; // amber-600 → amber-700
  return { from: "#3b82f6", to: "#2563eb" }; // primary-500 → primary-600
}

function Ring({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  const size = 36; // Larger to give more space for text
  const stroke = 3; // Thinner stroke to not cover the text
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percent, 0), 100);
  const dash = (clamped / 100) * circumference;
  const { from, to } = getGradientStops(clamped);
  const gradientId = `ringGradient-${label}`;

  return (
    <div className="flex items-center space-x-1 sm:space-x-1.5">
      <span className="text-[9px] sm:text-[10px] text-gray-700 font-medium">{label}</span>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block transition-all duration-200 ease-out group-hover:scale-105 drop-shadow-sm"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <filter id={`glow-${label}`}>
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Background circle with better contrast */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#9ca3af" // Darker gray for better contrast
          strokeWidth={stroke}
          fill="none"
          opacity={0.3}
        />
        {/* Progress circle with glow effect */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ 
            transition: "stroke-dasharray 300ms ease-out",
            filter: `url(#glow-${label})`
          }}
        />
        {/* Percentage text with better contrast and more space */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="text-[10px] sm:text-[11px] fill-gray-900 font-bold"
          style={{ fontSize: '10px' }}
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
      className="relative flex items-center space-x-2 sm:space-x-3 mr-1 rounded-full border border-gray-200 bg-white/80 backdrop-blur px-1.5 sm:px-2 py-1 group"
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


