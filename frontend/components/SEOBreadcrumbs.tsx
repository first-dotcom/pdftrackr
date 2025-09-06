"use client";

// Simple breadcrumbs component - no icons needed
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  name: string;
  href: string;
  current?: boolean;
}

export default function SEOBreadcrumbs() {
  const pathname = usePathname();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Home
    breadcrumbs.push({ 
      name: "Home", 
      href: "/", 
      current: segments.length === 0 
    });

    // Map URL segments to readable names
    const segmentMap: Record<string, string> = {
      "how-to-track-pdf-views": "How to Track PDF Views",
      "free-pdf-tracking": "Free PDF Tracking",
      "document-tracking-system": "Document Tracking System",
      "track-documents-online": "Track Documents Online",
      "secure-pdf-sharing-guide": "Secure PDF Sharing Guide",
      "pdf-analytics-tutorial": "PDF Analytics Tutorial",
      "pdf-tracking-faq": "PDF Tracking FAQ",
      "pdf-privacy-policy": "Privacy Policy",
      "pdf-sharing-terms": "Terms of Service",
      "data-rights": "Data Rights",
      "cookies": "Cookie Policy",
    };

    // Build breadcrumbs from segments
    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      
      breadcrumbs.push({
        name: segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
        href: currentPath,
        current: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Don't show breadcrumbs on homepage
  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="mb-6" aria-label="Breadcrumb">
      <div className="flex items-center text-sm text-gray-600">
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400">&gt;</span>
            )}
            {breadcrumb.current ? (
              <span className="text-gray-900 font-medium">
                {breadcrumb.name}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {breadcrumb.name}
              </Link>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
