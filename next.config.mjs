/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  compress: true,
  images: {
    unoptimized: false,
    minimumCacheTTL: 86400,
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/users',
        headers: [
          { key: 'Cache-Control', value: 'private, max-age=120, stale-while-revalidate=60' },
        ],
      },
      {
        source: '/api/projets',
        headers: [
          { key: 'Cache-Control', value: 'private, max-age=120, stale-while-revalidate=60' },
        ],
      },
    ]
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    
    // Configuration pour les bibliothèques PDF côté client uniquement
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        encoding: false,
      }
    }
    
    return config
  },
}

export default nextConfig
