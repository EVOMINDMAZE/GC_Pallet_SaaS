"use client";
import { useProjects } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { useInventory } from "@/hooks/useInventory";
import type { Project, ProjectDocument, InventoryItem } from "@/lib/types";

/**
 * Time-range filter for the dashboard. The actual data fetch is
 * unpaginated (we use RLS to bound it by the signed-in user) — the
 * range just controls how the cards and charts slice the data.
 */
export type DashboardRange = "7d" | "30d" | "all";

/**
 * Combined dashboard data. We don't apply a date filter at the query
 * level (the underlying hooks always return the user's full data) —
 * the components slice client-side using the `range` prop.
 */
export function useDashboardData(_range: DashboardRange) {
  const projects = useProjects();
  const documents = useDocuments();
  const inventory = useInventory();

  return {
    projects: (projects.data ?? []) as Project[],
    documents: (documents.data ?? []) as ProjectDocument[],
    inventory: (inventory.data ?? []) as InventoryItem[],
    isLoading:
      projects.isLoading || documents.isLoading || inventory.isLoading,
    error: projects.error ?? documents.error ?? inventory.error,
    refresh: () => {
      projects.refresh();
      documents.refresh();
      inventory.refresh();
    },
  };
}
