"use client";
import { useProjects } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { useInventory } from "@/hooks/useInventory";
import type { DocumentRecord, InventoryItem, Project } from "@/lib/types";

export type DashboardRange = "7d" | "30d" | "all";

export function dashboardRangeStart(range: DashboardRange): string | undefined {
  if (range === "all") return undefined;
  const days = range === "7d" ? 7 : 30;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Single combined hook for the dashboard. Fetches projects, documents and
 * inventory once each. Components can also call the specific hooks directly
 * if they need a different filter (e.g. inventory scoped to one project).
 */
export function useDashboardData(range: DashboardRange) {
  const since = dashboardRangeStart(range);
  const projects = useProjects({ createdAfter: since });
  const documents = useDocuments({ uploadedAfter: since });
  const inventory = useInventory({ updatedAfter: since });

  const anyLoading = projects.isLoading || documents.isLoading || inventory.isLoading;
  const anyError = projects.error || documents.error || inventory.error;

  return {
    projects: (projects.data ?? []) as Project[],
    documents: (documents.data ?? []) as DocumentRecord[],
    inventory: (inventory.data ?? []) as InventoryItem[],
    isLoading: anyLoading,
    error: anyError,
  };
}
