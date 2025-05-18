/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'kzmpxobbo9z9b0benlfw.supabase.co'],
  },
  // Asegurarnos de que la ruta principal sea la landing page
  async redirects() {
    return []
  },
}

export default nextConfig
