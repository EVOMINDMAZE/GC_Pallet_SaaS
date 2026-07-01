"use client";
import useSWR from "swr";
import { getSupabase } from "@/lib/supabase";
import type { InventoryItem } from "@/lib/types";

export function useInventory(opts?: { projectId?: string; updatedAfter?: string }) {
  const supabase = getSupabase();
  const { projectId, updatedAfter } = opts ?? {};
  const key =
    projectId || updatedAfter
      ? ["inventory", projectId ?? "_", updatedAfter ?? "_"]
      : "inventory";
  return useSWR<InventoryItem[]>(key, async () => {
    let q = supabase.from("inventory").select("*").order("last_updated", { ascending: false });
    if (projectId) q = q.eq("project_id", projectId);
    if (updatedAfter) q = q.gte("last_updated", updatedAfter);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as InventoryItem[];
  });
}
