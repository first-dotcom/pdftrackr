"use client";

import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, FileText, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Files", href: "/dashboard/files", icon: FileText },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={clsx(
        "bg-white border-r border-gray-200 min-h-screen transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            PDFTrackr
          </Link>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="mt-4 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={clsx(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={clsx(
                      "flex-shrink-0",
                      isActive ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500",
                      isCollapsed ? "h-5 w-5" : "mr-3 h-5 w-5",
                    )}
                  />
                  {!isCollapsed && item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
