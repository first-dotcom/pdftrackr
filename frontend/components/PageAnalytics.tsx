"use client";

import React, { useState } from "react";
import AggregateView from "./AggregateView";
import IndividualView from "./IndividualView";

interface PageAnalyticsProps {
  fileId: number;
  totalPages: number;
}

export default function PageAnalytics({ fileId, totalPages }: PageAnalyticsProps) {
  const [viewMode, setViewMode] = useState<"aggregate" | "individual">("aggregate");
  const [days, setDays] = useState(30);

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Page Analytics</h3>
        <div className="flex items-center space-x-4">
          {viewMode === "aggregate" && (
            <div className="flex items-center space-x-2">
              <label htmlFor="time-range-select" className="text-sm text-gray-600">
                Time Range:
              </label>
              <select
                id="time-range-select"
                name="timeRange"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
          )}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("aggregate")}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === "aggregate"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Aggregate
            </button>
            <button
              onClick={() => setViewMode("individual")}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === "individual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Individual
            </button>
          </div>
        </div>
      </div>

      {viewMode === "aggregate" ? (
        <AggregateView fileId={fileId} totalPages={totalPages} days={days} />
      ) : (
        <IndividualView fileId={fileId} />
      )}
    </div>
  );
}
