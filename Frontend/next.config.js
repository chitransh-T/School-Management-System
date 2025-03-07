/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'almanet.in', 'picsum.photos'],
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
      }
    ],
  },
}

module.exports = nextConfig 