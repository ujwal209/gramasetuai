/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    // Disable type checking in production build as requested
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint checking during production build
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.VITE_API_BASE_URL ||
      '',
  },
};

export default nextConfig;
