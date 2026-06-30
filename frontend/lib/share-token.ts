/**
 * URL-safe random token generator for public share links.
 *
 * Uses WebCrypto (`crypto.getRandomValues`) which is available in
 * both the Node.js runtime (≥19) and the browser. The alphabet is
 * base64url (no `+` / `/` / `=`), making tokens safe to drop into
 * a URL path segment with no escaping.
 */

/** Crypto-quality base64url string of the given byte length. */
export function randomToken(bytes = 18): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]!);
  // btoa is available in both Node (globalThis) and the browser.
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Lightweight validation — share tokens we issue are 18 random bytes
 *  (~24 base64url chars). Reject anything else early to avoid
 *  spending a DB round-trip on malformed paths. */
export const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;
