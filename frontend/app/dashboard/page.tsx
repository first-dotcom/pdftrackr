import { Suspense } from 'react';
import { currentUser } from '@clerk/nextjs';
import DashboardStats from '@/components/DashboardStats';
import RecentFiles from '@/components/RecentFiles';
import StorageUsage from '@/components/StorageUsage';
import LoadingSpinner from '@/components/LoadingSpinner';

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.firstName || 'User'}!</p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <DashboardStats />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<LoadingSpinner />}>
            <RecentFiles />
          </Suspense>
        </div>
        
        <div>
          <Suspense fallback={<LoadingSpinner />}>
            <StorageUsage />
          </Suspense>
        </div>
      </div>
    </div>
  );
}