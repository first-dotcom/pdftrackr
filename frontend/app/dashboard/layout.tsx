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
            <ErrorBoundary title="Dashboard content failed to load">
              {children}
            </ErrorBoundary>
                </div>
                
                {/* Right sidebar for large screens - could be used for ads, quick actions, etc */}
                <div className="hidden xl:block w-80 flex-shrink-0">
                  <div className="sticky top-6 space-y-6">
                    {/* Quick Actions Panel */}
                    <div className="card">
                      <div className="card-header">
                        <h3 className="text-sm font-medium text-gray-900">Quick Actions</h3>
                      </div>
                      <div className="card-body p-4 space-y-3">
                        <a href="/dashboard/files/upload" className="block w-full btn-primary btn-sm text-center">
                          Upload New PDF
                        </a>
                        <a href="/dashboard/files" className="block w-full btn-secondary btn-sm text-center">
                          View All Files
                        </a>
                        <a href="/dashboard/settings" className="block w-full btn-secondary btn-sm text-center">
                          Account Settings
                        </a>
                      </div>
                    </div>
                    
                    {/* Tips Panel */}
                    <div className="card">
                      <div className="card-header">
                        <h3 className="text-sm font-medium text-gray-900">💡 Tips</h3>
                      </div>
                      <div className="card-body p-4">
                        <div className="space-y-3 text-sm text-gray-600">
                          <p>• Share links expire automatically for security</p>
                          <p>• Enable email gating to capture leads</p>
                          <p>• Check analytics to see engagement</p>
                          <p>• Watermarks protect your content</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Placeholder for ads or additional content */}
                    <div className="card bg-gray-50 border-dashed border-2 border-gray-300">
                      <div className="card-body p-6 text-center">
                        <div className="text-gray-400 text-sm">
                          Ad Space
                          <br />
                          320x250
                        </div>
                      </div>
                    </div>
                  </div>
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
