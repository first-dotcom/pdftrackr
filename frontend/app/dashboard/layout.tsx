"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSidebar from "@/components/DashboardSidebar";
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
        <DashboardSidebar 
          isMobileOpen={isMobileSidebarOpen} 
          onMobileClose={handleMobileSidebarClose} 
        />
        
        <main className="flex-1 w-full lg:w-auto">
          {/* Content wrapper with proper mobile spacing */}
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {/* Breadcrumbs - Only show on mobile for cleaner desktop */}
            <div className="mb-6 lg:hidden">
              <Breadcrumbs />
            </div>
            {children}
          </div>
        </main>
      </div>
      
      {/* Removed floating upload button - redundant with header button */}
      <WaitlistModal />
    </div>
  );
}
