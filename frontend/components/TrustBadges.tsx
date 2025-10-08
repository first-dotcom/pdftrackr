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
    if (typeof window === 'undefined' || scriptLoadedRef.current) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://b.sf-syn.com/badge_js?sf_id=3913790&variant_id=sf';
    script.onload = () => { scriptLoadedRef.current = true; };
    document.head.appendChild(script);
  }, []);

    const linkClasses = variant === "footer"
        ? "text-gray-400 hover:text-white transition-colors text-sm"
        : "text-gray-600 hover:text-gray-900 transition-colors text-sm";

    // Reserve space to prevent layout shift. SourceForge badge respects width only,
    // so we estimate height using a stable aspect ratio derived from their examples.
    // Using 0.6 ratio keeps visual parity: height ≈ 0.6 * width (e.g., 100px → 60px).
    const numericWidth = Number(String(width).replace(/[^0-9.]/g, "")) || 100;
    const reservedHeight = Math.round(numericWidth * 0.6); // px

    return (
        <div
            ref={badgeRef}
            className="sf-root"
            data-id="3913790"
            data-badge="customers-love-us-white"
            data-variant-id="sf"
            style={{ 
                width, 
                minHeight: `${reservedHeight}px`,
                height: `${reservedHeight}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
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
          <ComplianceBadge
            icon={<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />}
            text="GDPR Compliant"
            bgColor="bg-green-100"
            textColor="text-green-800"
          />
          <ComplianceBadge
            icon={<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />}
            text="EU Data Protection"
            bgColor="bg-blue-100"
            textColor="text-blue-800"
          />
        </div>
            ) : (
                // Inline/minimal variants: Centered layout with sections
                <div className="flex flex-col items-center space-y-8">
                    {/* Social Proof Section */}
                    <div className="flex flex-col items-center space-y-4">
                        <h3 className="text-sm text-gray-600 font-medium">Featured on leading platforms</h3>
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
                            {/* Product Hunt Badge */}
                            <ProductHuntBadge />

                            {/* GoodFirms Badge */}
                            <GoodFirmsBadge />

                            {/* SourceForge Badge */}
                            <SourceForgeBadge
                                variant={variant}
                                width={variant === "minimal" ? "86px" : "100px"}
                            />
                        </div>
                    </div>

                    {/* Compliance Section */}
                    <div className="flex flex-col items-center space-y-3">
                        <h3 className="text-sm text-gray-600 font-medium">Security & Compliance</h3>
                        <div className="flex items-center space-x-4">
                            <ComplianceBadge
                                icon={<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />}
                                text="GDPR Compliant"
                                bgColor="bg-green-100"
                                textColor="text-green-800"
                            />
                            <ComplianceBadge
                                icon={<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />}
                                text="EU Data Protection"
                                bgColor="bg-blue-100"
                                textColor="text-blue-800"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Reusable compliance badge component
function ComplianceBadge({ icon, text, bgColor, textColor }: {
    icon: React.ReactNode;
    text: string;
    bgColor: string;
    textColor: string;
}) {
    return (
        <div className={`flex items-center space-x-2 ${bgColor} ${textColor} px-3 py-1 rounded-full text-sm font-medium`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                {icon}
            </svg>
            <span>{text}</span>
        </div>
    );
}

// Reusable platform badge components
function ProductHuntBadge({ className = "w-[200px] h-auto sm:w-[240px]", width = "240", height = "51" }: {
    className?: string;
    width?: string;
    height?: string;
}) {
    return (
        <a
            href="https://www.producthunt.com/products/pdftrackr?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-pdftrackr"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
        >
            <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1019185&theme=light&t=1758799078030"
                alt="PDFTrackr - Track PDF engagement with page-by-page insights | Product Hunt"
                className={className}
                width={width}
                height={height}
            />
        </a>
    );
}

function GoodFirmsBadge({ className = "h-[51px] w-auto", width = "243", height = "51" }: {
    className?: string;
    width?: string;
    height?: string;
}) {
    return (
        <a
            href="https://www.goodfirms.co/document-management-software/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
        >
            <img
                src="https://assets.goodfirms.co/badges/color-badge/document-management-software.svg"
                alt="Top Document Management Software"
                title="Top Document Management Software"
                className={className}
                width={width}
                height={height}
            />
        </a>
    );
}

// Separate component for just compliance badges (if needed elsewhere)
export function ComplianceBadges({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            <ComplianceBadge
                icon={<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />}
                text="GDPR Compliant"
                bgColor="bg-green-100"
                textColor="text-green-800"
            />
            <ComplianceBadge
                icon={<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />}
                text="EU Data Protection"
                bgColor="bg-blue-100"
                textColor="text-blue-800"
            />
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
  if (variant === "minimal") {
    return (
      <div className={`text-left mt-16 md:mt-24 ${className}`}>
        <p className="text-sm text-gray-600 mb-3 font-medium">
          Trusted by professionals:
        </p>
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Product Hunt Badge */}
          <ProductHuntBadge className="h-8 w-auto" width="120" height="32" />
          
          {/* GoodFirms Badge */}
          <GoodFirmsBadge className="h-12 w-auto" width="180" height="48" />
          
          {/* SourceForge Badge - Keep original colors */}
          <SourceForgeBadge 
            variant="inline"
            width="86px"
          />
        </div>
        
      </div>
    );
  }

  return (
    <div className={`text-center md:mt-10 ${className}`}>
      <p className="text-sm text-gray-600 mb-4 font-medium">
        Trusted by professionals, featured on leading platforms
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
        {/* Product Hunt Badge */}
        <ProductHuntBadge className="w-[180px] h-auto sm:w-[200px]" width="200" height="42" />
        
        {/* GoodFirms Badge */}
        <GoodFirmsBadge className="h-[60px] w-auto" width="300" height="60" />
        
        {/* SourceForge Badge */}
        <SourceForgeBadge 
          variant="inline"
          width="100px"
        />
      </div>
    </div>
  );
}