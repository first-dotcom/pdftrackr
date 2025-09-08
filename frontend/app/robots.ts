import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/view/'],
        disallow: ['/dashboard/', '/api/', '/_next/', '/test-pdf/'],
      },
    ],
    sitemap: 'https://pdftrackr.com/sitemap.xml',
  };
}


