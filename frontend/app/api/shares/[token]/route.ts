import { NextRequest, NextResponse } from "next/server";
import { getAdminPocketBase } from "@/lib/pb-admin";
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
 * The server-side admin PB client can read projects, inventory, and
 * users regardless of their viewRule; we still sanity-check that the
 * share is not revoked or expired before returning data.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const token = params.token;
  if (!SHARE_TOKEN_PATTERN.test(token)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pb = await getAdminPocketBase();

  let share;
  try {
    // Bypass the PocketBase JS SDK and use a direct `fetch` with
    // `cache: "no-store"` here. Reason: the admin SDK is a long-lived
    // singleton (see lib/pb-admin.ts), and in our investigation the
    // SDK's getFirstListItem returned a stale `revoked` flag on the
    // second hit within the same process — so a freshly-revoked token
    // still appeared active to the next public visitor until the
    // server restarted. Going straight to the REST API sidesteps any
    // in-process response caching and matches the per-request
    // semantics we need for revoke. Revisit this if/when:
    //   1) the PB JS SDK exposes an explicit no-cache option, or
    //   2) we switch to a per-request admin client and confirm the
    //      SDK cache is actually per-instance.
    const adminToken = pb.authStore.token;
    const base = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
    const res = await fetch(
      `${base}/api/collections/shares/records?filter=${encodeURIComponent(`token = "${token}"`)}&perPage=1`,
      { headers: { Authorization: adminToken }, cache: "no-store" },
    );
    if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = await res.json();
    share = data?.items?.[0];
    if (!share) return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (share.revoked) {
    return NextResponse.json({ error: "Revoked" }, { status: 404 });
  }
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  // Fetch the project + the inventory in this project, in parallel.
  const [project, inventoryRes, owner] = await Promise.all([
    pb.collection("projects").getOne(share.resource),
    pb.collection("inventory").getList(1, 200, {
      filter: `project = "${share.resource}"`,
      sort: "-last_updated",
    }),
    pb.collection("users").getOne(share.created_by).catch(() => null),
  ]);

  // Increment view_count (best-effort; the caller's experience is the
  // primary response, not the counter).
  const newCount = (share.view_count ?? 0) + 1;
  pb.collection("shares").update(share.id, { view_count: newCount }).catch(() => {
    /* ignore */
  });

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      status: project.status,
      address: project.address ?? "",
      budget: project.budget ?? 0,
      start_date: project.start_date,
      end_date: project.end_date,
      created: project.created,
    },
    inventory: inventoryRes.items.map((i: Record<string, unknown>) => ({
      id: i.id,
      item_name: i.item_name,
      quantity: i.quantity,
      unit: i.unit,
      location: i.location,
      cost_per_unit: i.cost_per_unit,
      last_updated: i.last_updated,
    })),
    owner: owner
      ? { id: owner.id, name: (owner as Record<string, unknown>).name ?? "" }
      : { id: "", name: "" },
    share: {
      id: share.id,
      expiresAt: share.expires_at ?? null,
      viewCount: newCount,
      createdAt: share.created,
    },
  });
}
