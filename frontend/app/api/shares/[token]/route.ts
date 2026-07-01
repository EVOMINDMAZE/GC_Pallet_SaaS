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
 *
 * Note on fetch: we go straight to PostgREST for the share lookup
 * (not through `getSupabaseAdmin()`) with `cache: "no-store"`. The
 * supabase-js admin client uses `cross-fetch`, which polyfills
 * `globalThis.fetch` and therefore participates in Next.js's
 * fetch-level cache. In production on Vercel that cache held a
 * stale `revoked: false` response long after the row was revoked,
 * so the public surface stayed open. Bypassing the cache on the
 * read is the simplest reliable fix.
 */

const SHARE_COLS =
  "id,token,resource_id,created_by,expires_at,revoked,label,view_count";

type ShareRow = {
  id: string;
  token: string;
  resource_id: string;
  created_by: string;
  expires_at: string | null;
  revoked: boolean;
  label: string | null;
  view_count: number | null;
};

async function fetchShare(token: string): Promise<ShareRow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  const res = await fetch(
    `${url}/rest/v1/shares?select=${SHARE_COLS}&token=eq.${encodeURIComponent(
      token,
    )}&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        // Be explicit: never let Next.js cache this read.
      },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as ShareRow[];
  return rows[0] ?? null;
}

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

  let share: ShareRow | null;
  try {
    share = await fetchShare(token);
  } catch {
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

  // Load the project + owner. Use the admin client here — we only
  // resolve a project we already know is referenced by a live share,
  // and the response is force-no-store below so a stale project row
  // can't linger.
  const admin = getSupabaseAdmin();
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
  // Fire-and-forget increment; failure is non-fatal.
  // Use direct fetch so it also bypasses any cache.
  void (async () => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) return;
      await fetch(`${url}/rest/v1/shares?id=eq.${share!.id}`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ view_count: (share!.view_count ?? 0) + 1 }),
        cache: "no-store",
      });
    } catch {
      // ignore
    }
  })();

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
  // Force no-store: a stale `revoked=true` here was the bug.
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
