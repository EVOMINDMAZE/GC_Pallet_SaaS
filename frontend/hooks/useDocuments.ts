"use client";
import useSWR from "swr";
import { getSupabase } from "@/lib/supabase";
import type { DocumentRecord } from "@/lib/types";

export function useDocuments(opts?: { projectId?: string; uploadedAfter?: string }) {
  const supabase = getSupabase();
  const { projectId, uploadedAfter } = opts ?? {};
  const key =
    projectId || uploadedAfter
      ? ["documents", projectId ?? "_", uploadedAfter ?? "_"]
      : "documents";
  return useSWR<DocumentRecord[]>(key, async () => {
    let q = supabase
      .from("documents")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (projectId) q = q.eq("project_id", projectId);
    if (uploadedAfter) q = q.gte("uploaded_at", uploadedAfter);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as DocumentRecord[];
  });
}

/**
 * Build a short-lived signed URL for a stored document so the
 * "Open" button can stream the file from Supabase Storage.
 */
export async function getDocumentSignedUrl(
  filePath: string,
  expiresIn = 300,
): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}
