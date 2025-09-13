import { Calendar } from "lucide-react";

interface LastUpdatedProps {
  date: string; // Format: "2025-09"
}

export default function LastUpdated({ date }: LastUpdatedProps) {
  // Convert "2025-09" to "September 2025"
  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split("-");
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[parseInt(month) - 1];
    return `${monthName} ${year}`;
  };

  const formattedDate = formatDate(date);
  const isoDate = `${date}-01T00:00:00.000Z`; // Convert to ISO format for schema

  return (
    <>
      {/* Schema markup for dateModified */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "dateModified": isoDate,
            "mainEntity": {
              "@type": "Article",
              "dateModified": isoDate
            }
          })
        }}
      />
      
      {/* Visual component */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border">
          <Calendar className="h-4 w-4" />
          <span>Last updated: {formattedDate}</span>
        </div>
      </div>
    </>
  );
}
