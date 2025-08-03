'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { config } from '@/lib/config';

interface BreadcrumbsProps {
  fileName?: string;
}

export default function Breadcrumbs({ fileName }: BreadcrumbsProps) {
  const pathname = usePathname();
  const { getToken } = useAuth();
  const [fileTitle, setFileTitle] = useState<string | null>(null);
  
  // Fetch file title for file detail pages
  useEffect(() => {
    const fetchFileTitle = async () => {
      if (pathname.startsWith('/dashboard/files/') && pathname !== '/dashboard/files/upload') {
        const fileId = pathname.split('/').pop();
        if (fileId && fileId !== 'upload') {
          try {
            const token = await getToken();
            if (!token) return;

            const response = await fetch(`${config.api.url}/api/files/${fileId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              setFileTitle(data.data.file.title || data.data.file.originalName);
            }
          } catch (error) {
            console.error('Failed to fetch file title:', error);
          }
        }
      }
    };

    fetchFileTitle();
  }, [pathname, getToken]);
  
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    // Always start with Dashboard
    breadcrumbs.push({ name: 'Dashboard', href: '/dashboard', current: segments.length === 1 });
    
    if (segments.length > 1) {
      if (segments[1] === 'files') {
        breadcrumbs.push({ name: 'Files', href: '/dashboard/files', current: segments.length === 2 });
        
        if (segments.length > 2) {
          if (segments[2] === 'upload') {
            breadcrumbs.push({ name: 'Upload PDF', href: '/dashboard/files/upload', current: true });
          } else {
            // File details page - use actual file title or fallback
            const displayName = fileTitle || fileName || 'File Details';
            breadcrumbs.push({ name: displayName, href: pathname, current: true });
          }
        }
      } else if (segments[1] === 'settings') {
        breadcrumbs.push({ name: 'Settings', href: '/dashboard/settings', current: true });
      }
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Don't show breadcrumbs on main dashboard or when there's only one level
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-4">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {breadcrumb.current ? (
            <span className="text-gray-900 font-medium">{breadcrumb.name}</span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="hover:text-gray-700 hover:underline"
            >
              {breadcrumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
} 