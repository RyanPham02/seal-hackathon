import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This project builds/dev-runs with webpack (see "next dev --webpack" in
  // package.json), so no Turbopack-specific config is needed here.
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  devIndicators: {
    appIsrStatus: false,
    buildActivityPosition: 'bottom-left',
  },
  // Allow external connections for Next.js dev server on the local Wi-Fi
  allowedDevOrigins: ["172.20.10.2"],
};

export default nextConfig;
