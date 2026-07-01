/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone build produces a minimal server bundle for Vercel's
  // serverless functions (and for any future self-hosted run too).
  output: "standalone",
  // Allow large document uploads (50 MB matches the Supabase Storage
  // bucket file_size_limit we set up in the migration).
  experimental: { serverActions: { bodySizeLimit: "55mb" } },
  images: {
    // Supabase Storage URLs are allowed for next/image. We don't
    // currently use next/image on the dashboard but it's wired up
    // here for future use.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ypcghozdhyrbkchwotyq.supabase.co",
      },
    ],
  },
};
export default nextConfig;
