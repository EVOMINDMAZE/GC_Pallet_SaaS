import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client with the end-user's session.
 *
 * Uses `@supabase/ssr` so it reads/writes the auth cookies Next.js
 * already hands to Route Handlers and Server Components. RLS still
 * applies, which is what we want for user-scoped reads.
 *
 * IMPORTANT: this is created per-request because Next.js's cookie
 * store is per-request. Do not memoize at module scope.
 *
 * Typed as `any` on the table layer — see `client.ts` for why.
 */
export async function getSupabaseServer(): Promise<any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  const store = await cookies();
  return _createServerClient(url, anon, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(items: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          for (const { name, value, options } of items) {
            store.set(name, value, options as never);
          }
        } catch {
          // `cookies().set` throws when called from a Server Component;
          // we only call this from a Route Handler, so this catch is
          // a defensive no-op.
        }
      },
    },
  });
}
