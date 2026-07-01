/**
 * Cryptographically random URL-safe token. Replaces the
 * `lib/share-token.ts` helper used by the PocketBase version.
 *
 * PB issued 32-char URL-safe tokens; we do the same with
 * `crypto.randomBytes` and a base64url alphabet, so existing share
 * links (none in this codebase, but) stay the same length.
 */
export function generateShareToken(byteLength = 24): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  // base64url, no padding
  return btoa(out)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
