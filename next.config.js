/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production-ready configuration for Vercel deployment
  reactStrictMode: true,
  
  // Optimize images if needed in the future
  images: {
    domains: [],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
