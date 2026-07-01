/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: "55mb" } },
  // The Supabase JS SDK calls NEXT_PUBLIC_SUPABASE_URL directly, so we
  // no longer need a same-origin proxy. The `/api/shares/[token]`
  // route is the only server endpoint and it talks to Supabase
  // through the service-role key.
};
export default nextConfig;
