import PocketBase from "pocketbase";

/**
 * Server-side PocketBase client.
 *
 * Used by Next.js API routes that need elevated privileges — most
 * importantly the public share-link resolver at /api/shares/[token],
 * which serves unauthenticated visitors and therefore has no
 * end-user token to forward.
 *
 * Auth order:
 *   1. POCKETBASE_ADMIN_TOKEN  — long-lived JWT (preferred; generate in
 *      PB Admin UI under Settings → API tokens).
 *   2. POCKETBASE_ADMIN_EMAIL + POCKETBASE_ADMIN_PASSWORD
 *      — auth happens on first call via direct POST, the JWT is
 *      cached in this singleton and reused.
 *   3. unauth — every request must satisfy the collection's viewRule.
 *
 * Note: we don't use `pb.admins.authWithPassword` because the JS SDK
 * version installed in this project sends a path the running PB
 * server (v0.22.46) doesn't expose. Direct POST to
 * /api/admins/auth-with-password works reliably across patch levels.
 */

interface AdminCreds {
  token: string;
}

let _pb: PocketBase | null = null;
let _auth: AdminCreds | null = null;

async function authenticateWithCreds(
  base: string,
  email: string,
  password: string,
): Promise<string | null> {
  try {
    const r = await fetch(`${base}/api/admins/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: email, password }),
    });
    if (!r.ok) {
      console.error("[pb-admin] admin auth failed:", r.status, await r.text());
      return null;
    }
    const j = (await r.json()) as { token?: string };
    return j.token ?? null;
  } catch (err) {
    console.error("[pb-admin] admin auth threw:", (err as Error).message);
    return null;
  }
}

async function authenticate(pb: PocketBase, base: string): Promise<AdminCreds | null> {
  if (process.env.POCKETBASE_ADMIN_TOKEN) {
    pb.authStore.save(process.env.POCKETBASE_ADMIN_TOKEN, {
      id: "admin",
      name: "service",
    } as never);
    return { token: process.env.POCKETBASE_ADMIN_TOKEN };
  }
  const email = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;
  if (!email || !password) return null;
  const token = await authenticateWithCreds(base, email, password);
  if (!token) return null;
  pb.authStore.save(token, { id: "admin", name: "service" } as never);
  return { token };
}

export async function getAdminPocketBase(): Promise<PocketBase> {
  if (_pb && _auth) return _pb;
  const base =
    process.env.POCKETBASE_URL ||
    process.env.NEXT_PUBLIC_PB_URL ||
    "http://127.0.0.1:8090";
  _pb = new PocketBase(base);
  _pb.autoCancellation(false);
  _auth = await authenticate(_pb, base);
  return _pb;
}

export async function isAdminAuthed(): Promise<boolean> {
  if (!_pb) await getAdminPocketBase();
  return Boolean(_auth?.token);
}
