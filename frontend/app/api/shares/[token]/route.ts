import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SHARE_TOKEN_PATTERN } from "@/lib/share-token";

export const runtime = "nodejs";

/**
 * GET /api/shares/[token]
 * Public. Resolves a share token to a read-only project + inventory
 * bundle. Returns:
 *   200 → { project, inventory, owner: { name }, share: { id, expiresAt, viewCount } }
 *   404 → unknown or revoked token
 *   410 → expired
 *
 * Uses the service-role client so we can read the share + project +
 * inventory rows even when the visitor is not authenticated.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const token = params.token;
  if (!SHARE_TOKEN_PATTERN.test(token)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = getSupabaseAdmin();

  // Look up the share record.
  const { data: share, error: shareErr } = await admin
    .from("shares")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (shareErr || !share) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (share.revoked) {
    return NextResponse.json({ error: "Revoked" }, { status: 404 });
  }
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  // Project + inventory + owner in parallel.
  const [{ data: project, error: projErr }, { data: inv, error: invErr }, { data: owner }] =
    await Promise.all([
      admin.from("projects").select("*").eq("id", share.resource_id).maybeSingle(),
      admin
        .from("inventory")
        .select("id, item_name, quantity, unit, location, cost_per_unit, last_updated")
        .eq("project_id", share.resource_id)
        .order("last_updated", { ascending: false })
        .limit(200),
      admin
        .from("profiles")
        .select("id, name")
        .eq("id", share.created_by)
        .maybeSingle(),
    ]);

  if (projErr || !project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (invErr) {
    return NextResponse.json({ error: "Inventory read failed" }, { status: 500 });
  }

  // Increment view count (best-effort).
  const newCount = (share.view_count ?? 0) + 1;
  admin
    .from("shares")
    .update({ view_count: newCount })
    .eq("id", share.id)
    .then(() => {}, () => {});

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      status: project.status,
      address: project.address ?? "",
      budget: project.budget ?? 0,
      start_date: project.start_date,
      end_date: project.end_date,
      created: project.created_at,
    },
    inventory: (inv ?? []).map((i) => ({
      id: i.id,
      item_name: i.item_name,
      quantity: i.quantity,
      unit: i.unit,
      location: i.location,
      cost_per_unit: i.cost_per_unit,
      last_updated: i.last_updated,
    })),
    owner: owner ? { id: owner.id, name: owner.name ?? "" } : { id: "", name: "" },
    share: {
      id: share.id,
      expiresAt: share.expires_at ?? null,
      viewCount: newCount,
      createdAt: share.created_at,
    },
  });
}
