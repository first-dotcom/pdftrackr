"use client";

import { clsx } from "clsx";
import { FileText, LayoutDashboard, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Files", href: "/dashboard/files", icon: FileText },
];

interface DashboardSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function DashboardSidebar({ isMobileOpen = false, onMobileClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobileOpen && onMobileClose) {
      onMobileClose();
    }
  }, [pathname]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onMobileClose) {
        onMobileClose();
      }
    };

    if (isMobileOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when mobile sidebar is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen, onMobileClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={clsx(
          "bg-white border-r border-gray-200 min-h-screen transition-transform duration-300 flex flex-col",
          "fixed inset-y-0 left-0 z-50 w-80",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 min-h-[4rem]">
          {/* PDFTrackr Logo */}
          <Link href="/dashboard" className="text-xl font-bold text-gray-900 truncate">
            PDFTrackr
          </Link>
          
          {/* Close button */}
          <button
            type="button"
            onClick={onMobileClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md touch-manipulation"
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === "/dashboard/files" && pathname.startsWith("/dashboard/files"));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={clsx(
                      "group flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors touch-manipulation",
                      isActive
                        ? "bg-primary-100 text-primary-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    )}
                  >
                    <item.icon
                      className={clsx(
                        "mr-4 h-6 w-6 flex-shrink-0",
                        isActive ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500",
                      )}
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer spacer */}
        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
          {/* Removed footer text for cleaner desktop experience */}
        </div>
      </div>
    </>
  );
}
