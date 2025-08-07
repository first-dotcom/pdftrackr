/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone for actual production builds, not development with production env
  output: process.env.NODE_ENV === 'production' && process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined,
  
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
        ],
      },
    ];
  },
};

module.exports = nextConfig;