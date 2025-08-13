"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useApi } from "@/hooks/useApi";

interface BreadcrumbsProps {
  fileName?: string;
}

export default function Breadcrumbs({ fileName }: BreadcrumbsProps) {
  const pathname = usePathname();
  const api = useApi();
  const [fileTitle, setFileTitle] = useState<string | null>(null);

  // Fetch file title for file detail pages
  useEffect(() => {
    const fetchFileTitle = async () => {
      if (pathname.startsWith("/dashboard/files/") && pathname !== "/dashboard/files/upload") {
        const fileId = pathname.split("/").pop();
        if (fileId && fileId !== "upload") {
          try {
            const response = await api.files.get(parseInt(fileId));

            if (response.success && response.data) {
              const file = (response.data as any).file;
              setFileTitle(file.title || "Untitled Document");
            }
          } catch (error) {
            console.error("Failed to fetch file title:", error);
          }
        }
      }
    };

    fetchFileTitle();
  }, [pathname, api]);

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    // Always start with Dashboard
    breadcrumbs.push({ name: "Dashboard", href: "/dashboard", current: segments.length === 1 });

    if (segments.length > 1) {
      if (segments[1] === "files") {
        breadcrumbs.push({
          name: "Files",
          href: "/dashboard/files",
          current: segments.length === 2,
        });

        if (segments.length > 2) {
          if (segments[2] === "upload") {
            breadcrumbs.push({
              name: "Upload PDF",
              href: "/dashboard/files/upload",
              current: true,
            });
          } else {
            // File details page - use actual file title or fallback
            const displayName = fileTitle || fileName || "File Details";
            breadcrumbs.push({ name: displayName, href: pathname, current: true });
          }
        }
      } else if (segments[1] === "settings") {
        breadcrumbs.push({ name: "Settings", href: "/dashboard/settings", current: true });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Don't show breadcrumbs on main dashboard or when there's only one level
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 sm:p-4 mb-6 shadow-sm">
      <div className="flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base text-gray-600 overflow-x-auto">
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.href} className="flex items-center flex-shrink-0">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 sm:mx-2 text-gray-400 flex-shrink-0" />
            )}
            {breadcrumb.current ? (
              <span className="text-gray-900 font-semibold px-2 py-1 rounded-md bg-white shadow-sm border border-gray-200">
                {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                <span className="hidden sm:inline">{breadcrumb.name}</span>
                <span className="sm:hidden">
                  {breadcrumb.name.length > 12 ? breadcrumb.name.substring(0, 12) + "..." : breadcrumb.name}
                </span>
              </span>
            ) : (
              <Link 
                href={breadcrumb.href} 
                className="px-2 py-1 rounded-md hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all duration-200 font-medium"
              >
                {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                <span className="hidden sm:inline">{breadcrumb.name}</span>
                <span className="sm:hidden">
                  {breadcrumb.name.length > 12 ? breadcrumb.name.substring(0, 12) + "..." : breadcrumb.name}
                </span>
              </Link>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
