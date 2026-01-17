/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@chorus/shared'],
  images: {
    domains: ['api.heygen.com', 'storage.googleapis.com'],
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
