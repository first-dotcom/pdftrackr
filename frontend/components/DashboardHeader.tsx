"use client";

import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Menu, FileText, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

interface DashboardHeaderProps {
  onMobileMenuClick?: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Files", href: "/dashboard/files", icon: FileText },
];

export default function DashboardHeader({ onMobileMenuClick }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { user } = useUser();

  // Get contextual title based on current path (for mobile)
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

    // Default: no title on desktop (navigation tabs handle this)
    return null;
  };

  const contextualTitle = getContextualTitle();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={onMobileMenuClick}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md touch-manipulation flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* PDFTrackr Logo - Responsive */}
            <Link href="/dashboard" className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              <span className="text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">PDFTrackr</span>
              <span className="text-lg font-bold text-gray-900 sm:hidden">PDF</span>
            </Link>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex space-x-8 ml-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href === "/dashboard/files" && pathname.startsWith("/dashboard/files"));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "text-primary-600 bg-primary-50 border-primary-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Context title - Mobile only */}
            {contextualTitle && (
              <div className="flex-1 min-w-0 ml-2 sm:ml-4 lg:hidden">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {contextualTitle}
                </h1>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <UserButton 
              afterSignOutUrl="/" 
              appearance={{
                elements: {
                  avatarBox: "w-7 h-7 sm:w-8 sm:h-8 rounded-full",
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
