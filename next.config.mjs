/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
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
