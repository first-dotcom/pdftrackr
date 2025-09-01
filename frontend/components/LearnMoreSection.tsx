import Link from "next/link";

interface LearnMoreSectionProps {
  className?: string;
  title?: string;
  guides?: Array<{
    href: string;
    title: string;
    description: string;
    label: string;
  }>;
}

export default function LearnMoreSection({ 
  className = "", 
  title = "Learn More About PDF Tracking",
  guides 
}: LearnMoreSectionProps) {
  const defaultGuides = [
    {
      href: "/how-to-track-pdf-views",
      title: "How to Track PDF Views",
      description: "Complete step-by-step guide to PDF tracking setup and implementation.",
      label: "Read Guide"
    },
    {
      href: "/secure-pdf-sharing-guide",
      title: "Secure PDF Sharing Guide",
      description: "Learn best practices for secure document sharing and access control.",
      label: "Read Guide"
    },
    {
      href: "/pdf-analytics-tutorial",
      title: "PDF Analytics Tutorial",
      description: "Master document insights and performance tracking with comprehensive analytics.",
      label: "Read Tutorial"
    },
    {
      href: "/free-pdf-tracking",
      title: "Free PDF Tracking",
      description: "Start tracking PDFs for free with 500MB storage and no credit card required.",
      label: "Learn More"
    }
  ];

  const displayGuides = guides || defaultGuides;

  return (
    <div className={`bg-white rounded-lg p-8 mb-16 shadow-sm ${className}`}>
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayGuides.map((guide, index) => (
          <Link
            key={index}
            href={guide.href}
            className="block p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 mb-2">{guide.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{guide.description}</p>
            <span className="text-primary-600 text-sm font-medium">{guide.label} →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
