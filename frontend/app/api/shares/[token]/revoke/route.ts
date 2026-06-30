import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminPocketBase } from "@/lib/pb-admin";

export const runtime = "nodejs";

/**
 * POST /api/shares/[token]/revoke
 * Soft-revokes a share. Only the owner can revoke. Identified by the
 * public token so the ShareDialog doesn't need to track record ids
 * separately.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const cookieStore = cookies();
  const pbAuthCookie = cookieStore.get("pb_auth")?.value;
  if (!pbAuthCookie) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const pb = await getAdminPocketBase();

  let userId: string;
  try {
    const user = await pb.collection("users").getFirstListItem(
      `id = "${parseJwtSub(pbAuthCookie)}"`,
    );
    userId = user.id;
  } catch {
    return NextResponse.json({ error: "Invalid user" }, { status: 401 });
  }

  try {
    const share = await pb.collection("shares").getFirstListItem(
      `token = "${params.token}"`,
    );
    if (share.created_by !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await pb.collection("shares").update(share.id, { revoked: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

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
