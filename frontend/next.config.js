/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable standalone for now to fix build issues
  // output: process.env.NODE_ENV === 'production' && process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined,
  
  // Development optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Experimental features for faster dev builds
  experimental: {
    optimizePackageImports: ['lucide-react', '@clerk/nextjs'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  images: {
    domains: ['cdn.clerk.com'],
  },

  // Fix for react-pdf Canvas dependency issues
  webpack: (config, { isServer }) => {
    // Ignore Canvas module for client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        stream: false,
        util: false,
      };
    }

    // Fix for pdfjs-dist Canvas dependency
    config.externals = config.externals || [];
    config.externals.push({
      canvas: 'canvas',
      'pdfjs-dist/build/pdf.worker.js': 'pdfjs-dist/build/pdf.worker.js',
    });

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:3001/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
                  {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.clerk.com *.clerk.accounts.dev *.clerk.dev cdn.jsdelivr.net unpkg.com cdnjs.cloudflare.com clerk.pdftrackr.com accounts.pdftrackr.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: cdn.clerk.com *.clerk.accounts.dev img.clerk.com https://*.digitaloceanspaces.com; connect-src 'self' api.clerk.dev *.clerk.accounts.dev clerk.pdftrackr.com accounts.pdftrackr.com clkmail.pdftrackr.com localhost:3001 https://mozilla.github.io https://*.digitaloceanspaces.com; frame-src 'none'; worker-src 'self' blob: https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com https://clerk.pdftrackr.com https://accounts.pdftrackr.com;",
        },
        ],
      },
    ];
  },
};

module.exports = nextConfig;