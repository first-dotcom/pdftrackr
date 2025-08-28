"use client";

interface SkeletonLoaderProps {
  type: "stats" | "list" | "card" | "table";
  count?: number;
  className?: string;
}

export default function SkeletonLoader({ type, count = 1, className = "" }: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  const StatsSkeleton = () => (
    <div className="card animate-pulse">
      <div className="card-body">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-200 rounded-md" />
          <div className="ml-4 flex-1">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-6 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );

  const ListSkeleton = () => (
    <div className="animate-pulse">
      <div className="flex items-center space-x-4 p-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="w-20 h-4 bg-gray-200 rounded" />
      </div>
    </div>
  );

  const CardSkeleton = () => (
    <div className="card animate-pulse">
      <div className="card-body">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    </div>
  );

  const TableSkeleton = () => (
    <div className="animate-pulse">
      <div className="flex items-center space-x-3 p-3">
        <div className="w-8 h-8 bg-gray-200 rounded" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-32 mb-1" />
          <div className="h-2 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case "stats":
        return <StatsSkeleton />;
      case "list":
        return <ListSkeleton />;
      case "card":
        return <CardSkeleton />;
      case "table":
        return <TableSkeleton />;
      default:
        return <ListSkeleton />;
    }
  };

  if (type === "stats") {
    return (
      <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {items.map((i) => (
          <div key={i}>{renderSkeleton()}</div>
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className={`card ${className}`}>
        <div className="card-body">
          <div className="divide-y divide-gray-200">
            {items.map((i) => (
              <div key={i}>{renderSkeleton()}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {items.map((i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
}

// Quick loading component for inline use
export function QuickSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  );
}
