import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS — use only from server code
 * that has already authorized the caller. We use it in /api routes that
 * need to resolve a public share token or read records on behalf of a
 * visitor who isn't signed in.
 *
 * The service_role key is NEVER exposed to the browser; it's a
 * server-only env var.
 *
 * Typed as `any` on the table layer — see `client.ts` for why.
 */
let _admin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin(): any {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  _admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
