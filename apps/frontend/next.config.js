/** @type {import('next').NextConfig} */
const rawBackendTarget =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://nyayasetu-backend.onrender.com';

const cleanBackendTarget = rawBackendTarget
  .replace(/\/api\/v1\/?$/, '')
  .replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['legal-marketplace-docs-in.s3.ap-south-1.amazonaws.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${cleanBackendTarget}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

