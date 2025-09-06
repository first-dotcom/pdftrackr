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
  return [...corePages, ...contentPages, ...legalPages];
}
