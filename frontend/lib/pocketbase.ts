import PocketBase from "pocketbase";

let _pb: PocketBase | null = null;

/**
 * Singleton PocketBase client used by the browser bundle.
 *
 * Auth state is mirrored into a `pb_auth` cookie so server-side Next.js
 * API routes (e.g. /api/shares) can identify the user without having
 * to round-trip through the PB /api/pb proxy. The cookie is the
 * `authStore.exportToCookie()` output, which PB already understands.
 */
export function getPocketBase(): PocketBase {
  if (_pb) return _pb;
  const base = typeof window !== "undefined"
    ? `${window.location.origin}/api/pb`
    : "/api/pb";
  _pb = new PocketBase(base);
  _pb.autoCancellation(false);
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    // Mirror auth → cookie on every change so server routes can read it.
    _pb.authStore.onChange((token, record) => {
      try {
        if (token) {
          document.cookie = `pb_auth=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;
        } else {
          document.cookie = "pb_auth=; Path=/; Max-Age=0";
        }
      } catch {
        // best-effort — API routes will return 401 if missing
      }
    }, true);
  }
  return _pb;
}

export function getPocketBaseStrict(): PocketBase {
  return getPocketBase();
}
