import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { PublicShareView } from "@/lib/types";

/**
 * GET /api/shares/[token] — public read of a share.
 *
 * No auth required. Looks up the share, checks it isn't revoked or
 * expired, increments the view count, and returns the project + its
 * documents (with short-lived signed URLs) so a logged-out visitor
 * can preview the shared resource.
 *
 * Uses the service_role key because RLS would otherwise block this
 * read — that's by design: a share link is meant to be reachable
 * without an account.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json(
      { ok: false, reason: "not_found" } satisfies PublicShareView,
      { status: 400 },
    );
  }
  const admin = getSupabaseAdmin();
  const { data: share, error: shareErr } = await admin
    .from("shares")
    .select("id,token,resource_id,created_by,expires_at,revoked,label,view_count")
    .eq("token", token)
    .maybeSingle();
  if (shareErr) {
    return NextResponse.json(
      { ok: false, reason: "not_found" } satisfies PublicShareView,
      { status: 500 },
    );
  }
  if (!share) {
    return NextResponse.json(
      { ok: false, reason: "not_found" } satisfies PublicShareView,
      { status: 404 },
    );
  }
  if (share.revoked) {
    return NextResponse.json(
      { ok: false, reason: "revoked" } satisfies PublicShareView,
      { status: 410 },
    );
  }
  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { ok: false, reason: "expired" } satisfies PublicShareView,
      { status: 410 },
    );
  }

  // Increment view count (fire-and-forget; failure is non-fatal).
  admin
    .from("shares")
    .update({ view_count: (share.view_count ?? 0) + 1 })
    .eq("id", share.id)
    .then(() => undefined);

  // Load the project + owner.
  const { data: project, error: projErr } = await admin
    .from("projects")
    .select("id,name,address,status,user_id")
    .eq("id", share.resource_id)
    .maybeSingle();
  if (projErr || !project) {
    return NextResponse.json(
      { ok: false, reason: "not_found" } satisfies PublicShareView,
      { status: 404 },
    );
  }
  const { data: profile } = await admin
    .from("profiles")
    .select("name")
    .eq("id", project.user_id)
    .maybeSingle();

  // Load the documents and mint short-lived signed URLs.
  const { data: documents, error: docsErr } = await admin
    .from("documents")
    .select("id,name,file_name,mime_type,size_bytes,storage_path")
    .eq("project_id", project.id);
  if (docsErr) {
    return NextResponse.json(
      { ok: false, reason: "not_found" } satisfies PublicShareView,
      { status: 500 },
    );
  }
  const docsWithUrls = await Promise.all(
    ((documents ?? []) as Array<{
      id: string;
      name: string;
      file_name: string;
      mime_type: string;
      size_bytes: number;
      storage_path: string;
    }>).map(async (d) => {
      const { data } = await admin.storage
        .from("documents")
        .createSignedUrl(d.storage_path, 60 * 60);
      return {
        id: d.id,
        name: d.name,
        fileName: d.file_name,
        mimeType: d.mime_type,
        sizeBytes: d.size_bytes,
        downloadUrl: data?.signedUrl ?? "",
      };
    }),
  );

  const payload: PublicShareView = {
    ok: true,
    project: {
      id: project.id,
      name: project.name,
      address: project.address,
      status: project.status,
    },
    owner: { name: profile?.name ?? "Someone" },
    documents: docsWithUrls,
    share: { label: share.label, expiresAt: share.expires_at },
  };
  // Force no-store: a stale `revoked=true` here is the exact bug the
  // PocketBase version had. See git history for the matching fix.
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
