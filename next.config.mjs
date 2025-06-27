/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // turn off default spinner
  devIndicators: {
    buildActivity: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "/api",
  },
};

export default nextConfig;
