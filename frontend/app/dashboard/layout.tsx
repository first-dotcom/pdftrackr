"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
import ErrorBoundary from "@/components/ErrorBoundary";
import FloatingUploadButton from "@/components/FloatingUploadButton";
import WaitlistModal from "@/components/WaitlistModal";

import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useState, type ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isLoaded, userId } = useAuth();



  // Show loading while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect unauthenticated users to sign in
  if (!userId) {
    redirect("/sign-in");
  }

  const handleMobileSidebarOpen = () => setIsMobileSidebarOpen(true);
  const handleMobileSidebarClose = () => setIsMobileSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
        <DashboardHeader onMobileMenuClick={handleMobileSidebarOpen} />
        
        <div className="flex">
          {/* Mobile-only sidebar */}
          <div className="lg:hidden">
            <DashboardSidebar 
              isMobileOpen={isMobileSidebarOpen} 
              onMobileClose={handleMobileSidebarClose} 
            />
          </div>

          <main className="flex-1 w-full">
            {/* Intelligent responsive layout */}
            <div className="flex justify-center">
              <div className="w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex gap-8">
                  {/* Main content area */}
                  <div className="flex-1 min-w-0">
              {/* Breadcrumbs - Only show on mobile for cleaner desktop */}
              <div className="mb-6 lg:hidden">
                <Breadcrumbs />
              </div>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
                  </div>
                

              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Removed floating upload button - redundant with header button */}
      <WaitlistModal />
    </div>
  );
}
