"use client";

import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export default function DashboardHeader() {
  const pathname = usePathname();
  const { user } = useUser();

  // Get contextual title based on current path
  const getContextualTitle = () => {
    // For file detail pages, we'll let breadcrumbs handle the title
    if (pathname.startsWith("/dashboard/files/") && pathname !== "/dashboard/files/upload") {
      return null; // Let breadcrumbs show the file name
    }

    // For upload page, show contextual title
    if (pathname === "/dashboard/files/upload") {
      return "Upload PDF";
    }

    // For settings, show contextual title
    if (pathname === "/dashboard/settings") {
      return "Account Settings";
    }

    // For main dashboard, show greeting
    if (pathname === "/dashboard") {
      return `Welcome back, ${user?.firstName || "User"}!`;
    }

    // For files list, show contextual description
    if (pathname === "/dashboard/files") {
      return "Manage your PDF files and share links";
    }

    // Default: no title
    return null;
  };

  const contextualTitle = getContextualTitle();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {contextualTitle && (
              <h1 className="text-xl font-bold text-gray-900">{contextualTitle}</h1>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
}
