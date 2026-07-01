"use client";
import useSWR from "swr";
import { getSupabase } from "@/lib/supabase";
import type { Share } from "@/lib/types";

export type ShareRecord = Share;

/**
 * List the current user's active shares for a project.
 */
export function useProjectShares(projectId: string | null | undefined) {
  const supabase = getSupabase();
  return useSWR<ShareRecord[]>(
    projectId ? ["project-shares", projectId] : null,
    async () => {
      const { data, error } = await supabase
        .from("shares")
        .select("*")
        .eq("resource_id", projectId!)
        .eq("revoked", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ShareRecord[];
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

const EXPIRY_MS: Record<CreateShareInput["expiresIn"], number | null> = {
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  never: null,
};

/**
 * Create a share record. We use a client-side insert (RLS enforces
 * that the project belongs to the current user) and generate the
 * token + URL locally.
 */
export async function createShare(input: CreateShareInput): Promise<CreateShareResponse> {
  const supabase = getSupabase();
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session?.user) throw new Error("Not authenticated");

  const ms = EXPIRY_MS[input.expiresIn];
  const expiresAt = ms ? new Date(Date.now() + ms).toISOString() : null;

  const token = randomToken(18);
  const { data, error } = await supabase
    .from("shares")
    .insert({
      token,
      resource_id: input.resourceId,
      created_by: sess.session.user.id,
      expires_at: expiresAt,
      revoked: false,
      view_count: 0,
    })
    .select("id, token")
    .single();
  if (error) throw new Error(error.message);

  return {
    id: data.id,
    token: data.token,
    url: `${window.location.origin}/share/${data.token}`,
    expiresAt,
  };
}

export async function revokeShare(token: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("shares")
    .update({ revoked: true })
    .eq("token", token);
  if (error) throw new Error(error.message);
}

function randomToken(bytes = 18): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
