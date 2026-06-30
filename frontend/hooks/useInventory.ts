"use client";
import useSWR from "swr";
import { getPocketBase } from "@/lib/pocketbase";
import type { InventoryRecord } from "@/lib/types";

export function useInventory(opts?: { projectId?: string; updatedAfter?: string }) {
  const pb = getPocketBase();
  const { projectId, updatedAfter } = opts ?? {};
  const key = (projectId || updatedAfter)
    ? ["inventory", projectId ?? "_", updatedAfter ?? "_"]
    : "inventory";
  return useSWR<InventoryRecord[]>(key, async () => {
    const parts: string[] = [];
    if (projectId) parts.push(`project="${projectId}"`);
    if (updatedAfter) parts.push(`last_updated >= "${updatedAfter}"`);
    const filter = parts.join(" && ");
    return (await pb.collection("inventory").getFullList({
      sort: "-last_updated",
      filter,
    })) as InventoryRecord[];
  });
}
