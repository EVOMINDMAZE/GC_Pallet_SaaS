import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Reads/writes the session via the
 * cookie set by the server client. Safe to call from any "use
 * client" component.
 *
 * We keep a single instance per page (singleton) so we don't open a
 * new realtime channel on every render.
 *
 * The client is typed as `any` on the table layer — the hand-rolled
 * `Database` type in `lib/supabase/types.ts` is too restrictive for
 * supabase-js's `GenericSchema` constraint check. We can re-enable
 * strict types once `supabase gen types typescript` runs in CI.
 */
let _client: ReturnType<typeof _createBrowserClient> | null = null;

export function getSupabaseBrowser(): any {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  _client = _createBrowserClient(url, anon);
  return _client;
}
