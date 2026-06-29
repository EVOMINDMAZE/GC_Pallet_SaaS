"use client";
import useSWR from "swr";
import { getPocketBase } from "@/lib/pocketbase";
import type { InventoryRecord } from "@/lib/types";

export function useInventory(projectId?: string) {
  const pb = getPocketBase();
  return useSWR<InventoryRecord[]>(
    projectId ? ["inventory", projectId] : "inventory",
    async () => {
      const filter = projectId ? `project="${projectId}"` : "";
      return (await pb.collection("inventory").getFullList({
        sort: "-last_updated",
        filter,
      })) as InventoryRecord[];
    }
  );
}
