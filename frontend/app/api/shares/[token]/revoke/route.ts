import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/shares/[token]/revoke — mark a share as revoked.
 *
 * Only the share's creator can revoke. RLS enforces this — the
 * update policy on the shares table requires created_by = auth.uid(),
 * so any non-owner attempt will fail with a 0-row update that we
 * surface as a 404.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // RLS will scope the update to created_by = auth.uid(). If the
  // caller isn't the creator, .single() returns an error (PGRST116
  // = "no rows returned").
  const { data, error } = await supabase
    .from("shares")
    .update({ revoked: true })
    .eq("token", token)
    .select("id")
    .maybeSingle();

  if (error && error.code === "PGRST116") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
