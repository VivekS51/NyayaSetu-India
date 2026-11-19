/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com'],
  },
  async rewrites() {
    // Only rewrite non-auth endpoints if a dedicated BACKEND_API_URL is configured
    const backendUrl = process.env.BACKEND_API_URL?.trim();
    if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
      const cleanTarget = backendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
      return [
        {
          // Preserve local serverless Next.js API auth endpoints while proxying legacy backend modules
          source: '/api/v1/external/:path*',
          destination: `${cleanTarget}/api/v1/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;

