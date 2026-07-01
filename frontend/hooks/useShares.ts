"use client";
import useSWR from "swr";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import type { Share } from "@/lib/types";

type Raw = {
  id: string;
  token: string;
  resource_id: string;
  created_by: string;
  expires_at: string | null;
  revoked: boolean;
  view_count: number;
  label: string | null;
  created_at: string;
  updated_at: string;
};

function rowToShare(row: Raw): Share {
  return {
    id: row.id,
    token: row.token,
    resourceId: row.resource_id,
    createdBy: row.created_by,
    expiresAt: row.expires_at,
    revoked: row.revoked,
    viewCount: row.view_count,
    label: row.label,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const fetcher = async () => {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("shares")
    .select(
      "id,token,resource_id,created_by,expires_at,revoked,view_count,label,created_at,updated_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToShare);
};

export function useShares() {
  const { userId } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Share[]>(
    userId ? "shares" : null,
    fetcher,
  );
  return {
    data: data ?? [],
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

/**
 * Convenience hook: returns the share records that target a specific
 * project. Backed by the same SWR cache as `useShares` so we don't
 * double-fetch.
 */
export function useProjectShares(projectId: string | null | undefined) {
  const { data, isLoading, error, refresh } = useShares();
  const filtered = React.useMemo(
    () => (projectId ? data.filter((s) => s.resourceId === projectId) : []),
    [data, projectId],
  );
  return { data: filtered, isLoading, error, refresh };
}

// Re-export React so the useMemo above works without an extra import
// on the call site.
import * as React from "react";

export interface CreateShareInput {
  resourceId: string;
  label?: string | null;
  /**
   * Either an absolute ISO timestamp ("2026-08-01T00:00:00Z") for the
   * moment the share should expire, or a relative token like
   * "1d" / "7d" / "30d" / "never" that the API route will resolve.
   */
  expiresAt?: string | null;
}

/**
 * Backwards-compat alias for the old PocketBase-era record type.
 * Some dashboard components import this by name.
 */
export type ShareRecord = Share;

/**
 * Create a share. We use a server route so we can generate a strong
 * token (PB-style random string) and so the resulting token doesn't
 * need to round-trip through the client. The client just calls the
 * route and renders the result.
 */
export async function createShare(input: CreateShareInput): Promise<Share & { url: string }> {
  const res = await fetch("/api/shares", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  const share = (await res.json()) as Share;
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${share.token}`
      : `/share/${share.token}`;
  return { ...share, url };
}

export async function revokeShare(id: string): Promise<void> {
  const res = await fetch(`/api/shares/${id}/revoke`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
}
