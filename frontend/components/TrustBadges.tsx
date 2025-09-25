"use client";

import { useEffect, useRef } from "react";

interface TrustBadgesProps {
    variant?: "footer" | "inline" | "minimal";
    className?: string;
}

// SourceForge Badge Component with proper React integration
function SourceForgeBadge({
    variant = "footer",
    width = "120px"
}: {
    variant?: "footer" | "inline" | "minimal";
    width?: string;
}) {
    const badgeRef = useRef<HTMLDivElement>(null);
    const scriptLoadedRef = useRef(false);

    useEffect(() => {
        // Only load script once and only on client side
        if (typeof window === 'undefined' || scriptLoadedRef.current) {
            return undefined;
        }

        const loadSourceForgeScript = () => {
            // Check if script already exists
            if (document.querySelector('script[src*="sf-syn.com"]')) {
                scriptLoadedRef.current = true;
                return;
            }

            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://b.sf-syn.com/badge_js?sf_id=3913790&variant_id=sf';
            script.onload = () => {
                scriptLoadedRef.current = true;
            };
            script.onerror = () => {
                console.warn('SourceForge badge script failed to load');
            };

            // Append to head instead of body to avoid React conflicts
            document.head.appendChild(script);
        };

        // Delay script loading to avoid hydration conflicts
        const timer = setTimeout(loadSourceForgeScript, 100);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    const linkClasses = variant === "footer"
        ? "text-gray-400 hover:text-white transition-colors text-sm"
        : "text-gray-600 hover:text-gray-900 transition-colors text-sm";

    return (
        <div
            ref={badgeRef}
            className="sf-root"
            data-id="3913790"
            data-badge="customers-love-us-white"
            data-variant-id="sf"
            style={{ width, minHeight: '32px' }}
        >
            <a
                href="https://sourceforge.net/software/product/PDFTrackr/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClasses}
            >
                PDFTrackr Reviews
            </a>
        </div>
    );
}

export default function TrustBadges({
    variant = "footer",
    className = ""
}: TrustBadgesProps) {
    const isFooterVariant = variant === "footer";

    return (
        <div className={`${className}`}>
      {isFooterVariant ? (
        // Footer layout: Clean compliance-only badges
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>EU Data Protection</span>
          </div>
        </div>
            ) : (
                // Inline/minimal variants: Centered layout with sections
                <div className="flex flex-col items-center space-y-8">
                    {/* Social Proof Section */}
                    <div className="flex flex-col items-center space-y-4">
                        <h3 className="text-sm text-gray-600 font-medium">Featured on leading platforms</h3>
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
                            {/* Product Hunt Badge */}
                            <a
                                href="https://www.producthunt.com/products/pdftrackr?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-pdftrackr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:opacity-80 transition-opacity"
                            >
                                <img
                                    src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1019185&theme=light&t=1758799078030"
                                    alt="PDFTrackr - Track PDF engagement with page-by-page insights | Product Hunt"
                                    className="w-[200px] h-auto sm:w-[240px]"
                                    width="240"
                                    height="51"
                                />
                            </a>

                            {/* SourceForge Badge */}
                            <SourceForgeBadge
                                variant={variant}
                                width={variant === "minimal" ? "100px" : "120px"}
                            />
                        </div>
                    </div>

                    {/* Compliance Section */}
                    <div className="flex flex-col items-center space-y-3">
                        <h3 className="text-sm text-gray-600 font-medium">Security & Compliance</h3>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>GDPR Compliant</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>EU Data Protection</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Separate component for just compliance badges (if needed elsewhere)
export function ComplianceBadges({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
                <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z"
                        clipRule="evenodd"
                    />
                </svg>
                <span>EU Data Protection</span>
            </div>
        </div>
    );
}

// Component for platform badges with social proof context
export function PlatformBadges({ 
  variant = "default",
  className = "" 
}: { 
  variant?: "default" | "minimal";
  className?: string;
}) {
  return (
    <div className={`text-center ${className}`}>
      <p className="text-sm text-gray-600 mb-4 font-medium">
        Trusted by professionals, featured on leading platforms
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
        {/* Product Hunt Badge */}
        <a 
          href="https://www.producthunt.com/products/pdftrackr?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-pdftrackr" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
        >
          <img 
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1019185&theme=light&t=1758799078030" 
            alt="PDFTrackr - Track PDF engagement with page-by-page insights | Product Hunt" 
            className="w-[180px] h-auto sm:w-[200px]" 
            width="200" 
            height="42" 
          />
        </a>
        
        {/* SourceForge Badge */}
        <SourceForgeBadge 
          variant="inline"
          width={variant === "minimal" ? "100px" : "110px"}
        />
      </div>
    </div>
  );
}