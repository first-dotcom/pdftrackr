'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell, Settings } from 'lucide-react';
import Link from 'next/link';

export default function DashboardHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              PDFTrackr
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
              <Bell className="h-5 w-5" />
            </button>
            
            <Link 
              href="/dashboard/settings"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Settings className="h-5 w-5" />
            </Link>

            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
}