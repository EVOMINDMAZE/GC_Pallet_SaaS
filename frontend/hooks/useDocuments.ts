"use client";
import { useMemo } from "react";
import useSWR from "swr";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import type { ProjectDocument, DocumentCategory } from "@/lib/types";

type Raw = {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  category: DocumentCategory;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
};

function rowToDoc(row: Raw, downloadUrl?: string): ProjectDocument {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    name: row.name,
    category: row.category,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadedAt: row.uploaded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    downloadUrl,
  };
}

const BUCKET = "documents";

/** Generate a one-hour signed download URL for a single storage_path. */
async function signedUrl(path: string): Promise<string> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

/** Fetch documents for a project and resolve a signed download URL for each. */
const projectFetcher = async (projectId: string) => {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id,user_id,project_id,name,category,storage_path,file_name,mime_type,size_bytes,uploaded_at,created_at,updated_at",
    )
    .eq("project_id", projectId)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  // Resolve signed URLs in parallel; if any fail we still return the rest.
  const docs = await Promise.all(
    ((data ?? []) as Raw[]).map(async (row: Raw) => {
      try {
        const url = await signedUrl(row.storage_path);
        return rowToDoc(row, url);
      } catch {
        return rowToDoc(row);
      }
    }),
  );
  return docs;
};

/**
 * Fetch all documents across the current user's projects. Used by
 * dashboard widgets that need a global view. RLS scopes to the user.
 */
const allFetcher = async () => {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id,user_id,project_id,name,category,storage_path,file_name,mime_type,size_bytes,uploaded_at,created_at,updated_at",
    )
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Raw[]).map((row: Raw) => rowToDoc(row));
};

export interface UseDocumentsOptions {
  projectId?: string;
  /**
   * Time-range filter (deep-linked from the dashboard timeline).
   * `7d` = last 7 days, `30d` = last 30 days, `all` (or undefined) = no
   * date filter.
   */
  range?: "7d" | "30d" | "all";
}

function rangeToSinceIso(range: "7d" | "30d" | "all" | undefined): string | null {
  if (!range || range === "all") return null;
  const days = range === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function useDocuments(options?: UseDocumentsOptions | string) {
  // Backwards-compat: callers can pass either an options object
  // ({ projectId }) or, for legacy code, a bare projectId string.
  const opts: UseDocumentsOptions =
    typeof options === "string" ? { projectId: options } : options ?? {};
  const { projectId, range } = opts;
  const { userId } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<ProjectDocument[]>(
    userId ? (projectId ? ["documents", projectId] : "documents-all") : null,
    projectId ? () => projectFetcher(projectId) : allFetcher,
  );
  // Apply the range filter on the client — the underlying query is
  // the full set, and SWR caches it across all consumers of the same
  // key. Cheap because `documents` is bounded by the user's RLS scope.
  const sinceIso = rangeToSinceIso(range);
  const filtered = useMemo(
    () =>
      sinceIso
        ? (data ?? []).filter((d) => new Date(d.uploadedAt).getTime() >= new Date(sinceIso).getTime())
        : data ?? [],
    [data, sinceIso],
  );
  return {
    data: filtered,
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

export function useProjectDocuments(projectId: string | null | undefined) {
  const { userId } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<ProjectDocument[]>(
    userId && projectId ? ["documents", projectId] : null,
    () => projectFetcher(projectId as string),
  );
  return {
    data: data ?? [],
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

export interface DocumentInput {
  projectId: string;
  name: string;
  category: DocumentCategory;
  file: File;
}

/**
 * Upload a document: stream the file to Supabase Storage, then insert
 * the metadata row. The storage path is `<user_id>/<doc_id>-<safe_name>`
 * so we can scope RLS later if we want, and so the user can never
 * overwrite another user's file.
 */
export async function uploadDocument(input: DocumentInput): Promise<ProjectDocument> {
  const supabase = getSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const docId = crypto.randomUUID();
  const safeName = input.file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${user.id}/${docId}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.file, {
      contentType: input.file.type,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from("documents")
    .insert({
      id: docId,
      user_id: user.id,
      project_id: input.projectId,
      name: input.name,
      category: input.category,
      storage_path: path,
      file_name: input.file.name,
      mime_type: input.file.type || "application/octet-stream",
      size_bytes: input.file.size,
    })
    .select()
    .single();
  if (insertError) {
    // Best-effort cleanup: try to remove the storage object if the DB
    // insert fails, so we don't leak orphan files.
    await supabase.storage.from(BUCKET).remove([path]);
    throw insertError;
  }
  return rowToDoc(data, await signedUrl(path).catch(() => ""));
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  // Look up the path first so we can clean up storage.
  const { data: doc, error: lookupErr } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (lookupErr) throw lookupErr;
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
  if (doc?.storage_path) {
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  }
}
