import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/dashboard/', '/api/', '/test-pdf/', '/view/'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/'],
        disallow: ['/dashboard/', '/api/', '/test-pdf/', '/view/'],
      },
      {
        userAgent: 'AnthropicBot',
        allow: ['/'],
        disallow: ['/dashboard/', '/api/', '/test-pdf/', '/view/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/'],
        disallow: ['/dashboard/', '/api/', '/test-pdf/', '/view/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/'],
        disallow: ['/dashboard/', '/api/', '/test-pdf/', '/view/'],
      },
    ],
    sitemap: 'https://pdftrackr.com/sitemap.xml',
  };
}


