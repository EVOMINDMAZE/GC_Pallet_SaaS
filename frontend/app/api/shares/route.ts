import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateShareToken } from "@/lib/share-token";

/**
 * POST /api/shares — create a share link for a project.
 *
 * Body: { resourceId, label?, expiresAt? }
 *
 * The caller must own the project (RLS enforces this). The token is
 * generated server-side with crypto-grade randomness; we use the
 * service_role key only to insert, after we've verified the caller
 * is the project owner via the user-scoped client.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const resourceId = body?.resourceId as string | undefined;
  const label = (body?.label as string | null | undefined) ?? null;
  const expiresAt = (body?.expiresAt as string | null | undefined) ?? null;
  if (!resourceId) {
    return NextResponse.json({ error: "resourceId required" }, { status: 400 });
  }

  // 1. Identify the caller via the user-scoped server client.
  const userScoped = await getSupabaseServer();
  const {
    data: { user },
  } = await userScoped.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Confirm they actually own the project (RLS already scopes this,
  //    but a maybeSingle() with no rows would be ambiguous vs. an
  //    actual error, so we check explicitly).
  const { data: project, error: projectErr } = await userScoped
    .from("projects")
    .select("id,user_id")
    .eq("id", resourceId)
    .maybeSingle();
  if (projectErr) {
    return NextResponse.json({ error: projectErr.message }, { status: 500 });
  }
  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // 3. Generate a token and insert via the admin client (RLS would
  //    allow this anyway because created_by = auth.uid(), but admin
  //    keeps the API surface consistent).
  const admin = getSupabaseAdmin();
  let token = generateShareToken();
  // Token has a 16-64 char CHECK constraint; our generator produces
  // 32 chars (24 bytes → 32 base64url chars), so we're always safe.
  for (let i = 0; i < 5; i++) {
    const { data, error } = await admin
      .from("shares")
      .insert({
        token,
        resource_id: resourceId,
        created_by: user.id,
        label,
        expires_at: expiresAt,
      })
      .select(
        "id,token,resource_id,created_by,expires_at,revoked,view_count,label,created_at,updated_at",
      )
      .single();
    if (!error && data) {
      return NextResponse.json({
        id: data.id,
        token: data.token,
        resourceId: data.resource_id,
        createdBy: data.created_by,
        expiresAt: data.expires_at,
        revoked: data.revoked,
        viewCount: data.view_count,
        label: data.label,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    }
    if (error?.code !== "23505") {
      // 23505 = unique_violation; anything else is a real error.
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    token = generateShareToken();
  }
  return NextResponse.json(
    { error: "could not allocate a unique token, try again" },
    { status: 500 },
  );
}
