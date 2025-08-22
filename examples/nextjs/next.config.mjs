/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable ES modules
  experimental: {
    esmExternals: true
  },
  // Configure transpilation for drizzle-cube
  transpilePackages: ['drizzle-cube'],
  // Configure webpack for CSS imports
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  }
}

export default nextConfig