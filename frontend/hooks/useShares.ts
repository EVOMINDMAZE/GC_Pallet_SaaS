"use client";
import useSWR from "swr";
import { getPocketBase } from "@/lib/pocketbase";

export interface ShareRecord {
  id: string;
  token: string;
  resource: string;
  created_by: string;
  expires_at: string | null;
  revoked: boolean;
  view_count: number;
  created: string;
  updated: string;
}

/**
 * List active shares for a project. The PB listRule is
 * "@request.auth.id != ''", so this only returns the current user's
 * shares.
 */
export function useProjectShares(projectId: string | null | undefined) {
  return useSWR<ShareRecord[]>(
    projectId ? ["project-shares", projectId] : null,
    async () => {
      const pb = getPocketBase();
      const res = await pb.collection("shares").getList<ShareRecord>(1, 50, {
        filter: `resource = "${projectId}" && revoked = false`,
        sort: "-created",
      });
      return res.items;
    },
  );
}

export interface CreateShareInput {
  resourceId: string;
  expiresIn: "1d" | "7d" | "30d" | "never";
}

export interface CreateShareResponse {
  id: string;
  token: string;
  url: string;
  expiresAt: string | null;
}

export async function createShare(input: CreateShareInput): Promise<CreateShareResponse> {
  const res = await fetch("/api/shares", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `createShare failed (${res.status})`);
  }
  return res.json();
}

export async function revokeShare(token: string): Promise<void> {
  const res = await fetch(`/api/shares/${token}/revoke`, { method: "POST" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `revokeShare failed (${res.status})`);
  }
}
