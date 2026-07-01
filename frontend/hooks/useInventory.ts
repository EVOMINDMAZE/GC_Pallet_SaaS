"use client";
import useSWR from "swr";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import type {
  InventoryItem,
  InventoryUnit,
  InventoryLocation,
} from "@/lib/types";

type Raw = {
  id: string;
  user_id: string;
  project_id: string;
  item_name: string;
  quantity: number;
  unit: InventoryUnit;
  location: InventoryLocation;
  cost_per_unit: number | null;
  last_updated: string;
  created_at: string;
  updated_at: string;
};

function rowToItem(row: Raw): InventoryItem {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    itemName: row.item_name,
    quantity: row.quantity,
    unit: row.unit,
    location: row.location,
    costPerUnit: row.cost_per_unit,
    // `Last updated` in the list shows the row's real edit time
    // (auto-bumped by the `inventory_set_updated_at` trigger). The
    // separate `last_updated date` column is for the form's
    // "Date verified" field and isn't surfaced here.
    lastUpdated: row.updated_at,
    lastVerified: row.last_updated,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Fetch the full inventory list for the current user, newest first. */
const allFetcher = async () => {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("inventory")
    .select(
      "id,user_id,project_id,item_name,quantity,unit,location,cost_per_unit,last_updated,created_at,updated_at",
    )
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToItem);
};

export interface UseInventoryOptions {
  projectId?: string;
}

export function useInventory(options?: UseInventoryOptions | string) {
  // Backwards-compat: callers can pass either an options object
  // ({ projectId }) or, for legacy code, a bare projectId string.
  const projectId =
    typeof options === "string" ? options : options?.projectId;
  const { userId } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<InventoryItem[]>(
    userId ? (projectId ? ["inventory", projectId] : "inventory") : null,
    projectId ? () => projectFetcher(projectId) : allFetcher,
  );
  return {
    data: data ?? [],
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

/** Fetch inventory for a single project. */
const projectFetcher = async (projectId: string) => {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("inventory")
    .select(
      "id,user_id,project_id,item_name,quantity,unit,location,cost_per_unit,last_updated,created_at,updated_at",
    )
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToItem);
};

export function useProjectInventory(projectId: string | null | undefined) {
  const { userId } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<InventoryItem[]>(
    userId && projectId ? ["inventory", projectId] : null,
    () => projectFetcher(projectId as string),
  );
  return {
    data: data ?? [],
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

export interface InventoryInput {
  projectId: string;
  itemName: string;
  quantity: number;
  unit: InventoryUnit;
  location: InventoryLocation;
  costPerUnit?: number | null;
  /**
   * Optional "date verified" — written to the `last_updated date`
   * column. If omitted, the DB defaults to `current_date`. The
   * row's `updated_at` timestamp is auto-maintained by trigger.
   */
  lastUpdated?: string;
}

export async function createInventoryItem(
  input: InventoryInput,
): Promise<InventoryItem> {
  const supabase = getSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const payload: Record<string, unknown> = {
    user_id: user.id,
    project_id: input.projectId,
    item_name: input.itemName,
    quantity: input.quantity,
    unit: input.unit,
    location: input.location,
    cost_per_unit: input.costPerUnit ?? null,
  };
  if (input.lastUpdated) payload.last_updated = input.lastUpdated;
  const { data, error } = await supabase
    .from("inventory")
    .insert(payload)
    .select(
      "id,user_id,project_id,item_name,quantity,unit,location,cost_per_unit,last_updated,created_at,updated_at",
    )
    .single();
  if (error) throw error;
  return rowToItem(data);
}

export async function updateInventoryItem(
  id: string,
  patch: Partial<InventoryInput>,
): Promise<InventoryItem> {
  const supabase = getSupabaseBrowser();
  const update: Record<string, unknown> = {};
  if (patch.itemName !== undefined) update.item_name = patch.itemName;
  if (patch.quantity !== undefined) update.quantity = patch.quantity;
  if (patch.unit !== undefined) update.unit = patch.unit;
  if (patch.location !== undefined) update.location = patch.location;
  if (patch.costPerUnit !== undefined) update.cost_per_unit = patch.costPerUnit;
  if (patch.lastUpdated !== undefined) update.last_updated = patch.lastUpdated;
  const { data, error } = await supabase
    .from("inventory")
    .update(update)
    .eq("id", id)
    .select(
      "id,user_id,project_id,item_name,quantity,unit,location,cost_per_unit,last_updated,created_at,updated_at",
    )
    .single();
  if (error) throw error;
  return rowToItem(data);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) throw error;
}
