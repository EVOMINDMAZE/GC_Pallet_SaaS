import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client. Auth state is persisted to localStorage
 * by @supabase/ssr so reloads keep the user signed in, and is mirrored
 * into a `sb-auth` cookie by `middleware`-friendly listeners for any
 * server route that needs to identify the user.
 */
let _browser: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_browser) return _browser;
  _browser = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return _browser;
}

/**
 * Per-request server client. Reads the user's session from the cookies
 * that the browser client set, so the JWT travels with every request and
 * RLS policies apply correctly.
 *
 * Use this in React Server Components and server actions / API routes
 * that act on behalf of the logged-in user.
 */
export function getSupabaseServer(
  cookies: {
    getAll: () => { name: string; value: string }[];
    setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => void;
  },
): SupabaseClient {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookies.setAll(toSet);
        },
      },
    },
  );
}
