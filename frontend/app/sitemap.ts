import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pdftrackr.com";
  const lastModified = new Date();

  // Core landing pages (highest priority - transactional intent)
  const corePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/free-pdf-tracking`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/document-tracking-system`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/track-documents-online`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // Demo pages (high priority - conversion intent)
  const demoPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/demo`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // Individual demo file experiences
    {
      url: `${baseUrl}/demo/files/q3-financial-report-2025`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/demo/files/product-launch-strategy-2025`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/demo/files/client-proposal-template`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/demo/files/september-team-meeting-notes`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/demo/files/fall-marketing-campaign-brief`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Educational content pages (high priority - informational intent)
  const contentPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/how-to-track-pdf-views`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/pdf-tracking-faq`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/secure-pdf-sharing-guide`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pdf-analytics-tutorial`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Legal and compliance pages (lower priority)
  const legalPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/pdf-privacy-policy`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/pdf-sharing-terms`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/data-rights`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Combine all pages in priority order
  return [...corePages, ...demoPages, ...contentPages, ...legalPages];
}
