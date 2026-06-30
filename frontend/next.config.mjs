/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: "55mb" } },
  // Proxy PocketBase so the SDK can call it on the same origin (avoids
  // mixed-content / cross-origin pain when the browser is on a preview URL).
  async rewrites() {
    return [
      { source: "/api/pb/:path*", destination: "http://127.0.0.1:8090/:path*" },
    ];
  },
  // Force the preview URL gateway to NOT cache JS chunks — otherwise users
  // keep loading stale SDK code that hardcodes the old absolute PB URL.
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
};
export default nextConfig;
