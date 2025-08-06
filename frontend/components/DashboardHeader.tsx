"use client";

import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

interface DashboardHeaderProps {
  onMobileMenuClick?: () => void;
}

export default function DashboardHeader({ onMobileMenuClick }: DashboardHeaderProps) {
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={onMobileMenuClick}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md touch-manipulation"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Context title */}
            {contextualTitle && (
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate sm:text-xl">
                  {contextualTitle}
                </h1>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <UserButton 
              afterSignOutUrl="/" 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-full",
                  userButtonTrigger: "focus:shadow-none",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
