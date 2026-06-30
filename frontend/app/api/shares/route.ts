import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminPocketBase } from "@/lib/pb-admin";
import { randomToken } from "@/lib/share-token";

// Runs in the Node.js runtime — Edge can't do PB server-side auth.
export const runtime = "nodejs";

const EXPIRY_MS: Record<string, number | null> = {
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  never: null,
};

/**
 * POST /api/shares
 *   body: { resourceId: string, expiresIn?: "1d" | "7d" | "30d" | "never" }
 *
 * Creates a new share record owned by the current user. Returns the
 * token, public URL, and ISO expiry (null = never).
 */
export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const pbAuthCookie = cookieStore.get("pb_auth")?.value;
  if (!pbAuthCookie) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { resourceId?: string; expiresIn?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.resourceId) {
    return NextResponse.json({ error: "resourceId required" }, { status: 400 });
  }
  const expiresIn = (body.expiresIn as keyof typeof EXPIRY_MS) ?? "7d";
  if (!(expiresIn in EXPIRY_MS)) {
    return NextResponse.json({ error: "invalid expiresIn" }, { status: 400 });
  }

  const pb = await getAdminPocketBase();
  // Trust only the user record id from the user's own auth record.
  // We use the admin PB to verify the resource belongs to the same
  // user before creating the share.
  let userId: string;
  try {
    const user = await pb.collection("users").getFirstListItem(
      // The pb_auth cookie is the user's own JWT.
      `id = "${parseJwtSub(pbAuthCookie)}"`,
    );
    userId = user.id;
  } catch {
    return NextResponse.json({ error: "Invalid user" }, { status: 401 });
  }

  try {
    const project = await pb.collection("projects").getOne(body.resourceId);
    if (project.user !== userId) {
      return NextResponse.json({ error: "Not the resource owner" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const ms = EXPIRY_MS[expiresIn]!;
  const expiresAt = ms ? new Date(Date.now() + ms).toISOString() : null;

  const token = randomToken(18);
  const record = await pb.collection("shares").create({
    token,
    resource: body.resourceId,
    created_by: userId,
    expires_at: expiresAt,
    revoked: false,
    view_count: 0,
  });

  const origin = req.nextUrl.origin;
  return NextResponse.json({
    id: record.id,
    token,
    url: `${origin}/share/${token}`,
    expiresAt,
  });
}

/** Extract the `id` claim (PB stores the user id there) from a JWT. */
function parseJwtSub(jwt: string): string | null {
  try {
    const part = jwt.split(".")[1];
    if (!part) return null;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    const obj = JSON.parse(json);
    return obj.id || null;
  } catch {
    return null;
  }
}
