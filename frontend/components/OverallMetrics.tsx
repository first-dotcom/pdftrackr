"use client";

import { formatDuration } from "@/utils/formatters";

interface StatItem {
  name: string;
  value: number;
  icon: any;
  color: string; // tailwind bg-* class
  isDuration?: boolean;
}

export default function OverallMetrics({
  title = "Overall Metrics",
  timeRangeLabel = "All time",
  items,
}: {
  title?: string;
  timeRangeLabel?: string;
  items: StatItem[];
}) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h3">{title}</h3>
        <div className="text-meta">{timeRangeLabel}</div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {items.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.color} p-2 rounded-lg shadow-sm`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-meta truncate">{stat.name}</p>
                <p className="text-h2">
                  {stat.isDuration ? formatDuration(stat.value) : Number(stat.value || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


