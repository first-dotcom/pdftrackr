import Link from "next/link";

interface RelatedGuidesProps {
  className?: string;
  title?: string;
}

export default function RelatedGuides({ 
  className = "", 
  title = "Related Guides" 
}: RelatedGuidesProps) {
  const guides = [
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
      label: "Read Guide"
    },
    {
      href: "/free-pdf-tracking",
      title: "Free PDF Tracking",
      description: "Start tracking PDFs for free with 500MB storage and no credit card required.",
      label: "Learn More"
    },
    {
      href: "/pdf-tracking-faq",
      title: "PDF Tracking FAQ",
      description: "Get answers to common questions about PDF tracking and document analytics.",
      label: "Read FAQ"
    }
  ];

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guides.map((guide, index) => (
          <Link
            key={index}
            href={guide.href}
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
          >
            <h4 className="font-medium text-gray-900 mb-2">{guide.title}</h4>
            <p className="text-sm text-gray-600">{guide.description}</p>
            <span className="text-primary-600 text-sm font-medium mt-2 inline-block">
              {guide.label} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
