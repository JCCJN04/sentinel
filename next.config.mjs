/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kzmpxobbo9z9b0benlfw.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Asegurarnos de que la ruta principal sea la landing page
  async redirects() {
    return []
  },
  // Deshabilitar webpack cache temporalmente para evitar WasmHash error
  webpack: (config, { isServer }) => {
    config.cache = false
    return config
  },
}

export default nextConfig
