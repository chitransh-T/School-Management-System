/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure image domains and patterns
  images: {
    domains: ['images.unsplash.com', 'almanet.in', 'picsum.photos', 'school-management-system-backend-i0ft.onrender.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'almanet.in',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'school-management-system-backend-i0ft.onrender.com',
      }
    ],
  },
  // Disable type checking during build for faster builds
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build for faster builds
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Output as a standalone build
  output: 'standalone',
}

module.exports = nextConfig