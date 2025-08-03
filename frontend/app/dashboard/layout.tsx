import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import FloatingUploadButton from '@/components/FloatingUploadButton';
import Breadcrumbs from '@/components/Breadcrumbs';
import WaitlistModal from '@/components/WaitlistModal';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  // Redirect unauthenticated users to sign in
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <FloatingUploadButton />
      <WaitlistModal />
    </div>
  );
}