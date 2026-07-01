"use client";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useProjects } from "@/hooks/useProjects";
import { useInventory } from "@/hooks/useInventory";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function InventoryPage() {
  // useSearchParams suspends — wrap in <Suspense> so the rest of the chrome paints first.
  return (
    <React.Suspense fallback={null}>
      <InventoryPageInner />
    </React.Suspense>
  );
}

function InventoryPageInner() {
  const params = useSearchParams();
  const initial = params.get("project") ?? "all";
  const [filter, setFilter] = React.useState<string>(initial);
  const { data: projects } = useProjects();
  const { data: items, isLoading } = useInventory(
    filter !== "all" ? { projectId: filter } : undefined,
  );
  const activeProjectId =
    filter !== "all" ? filter : projects?.[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-label uppercase tracking-wider text-muted-foreground">Workspace · Site ledger</span>
          <h1 className="text-h1 font-bold tracking-tight text-foreground">Inventory</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Track quantities, locations, and unit costs across every active site.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Filter</CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeProjectId ? (
            <InventoryForm projectId={activeProjectId} />
          ) : (
            <p className="rounded-md bg-warning-soft p-4 text-sm text-warning-foreground_soft">
              <strong className="font-semibold">Heads up:</strong> Create a project first to start tracking inventory.
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : (
        <InventoryTable items={items ?? []} />
      )}
    </div>
  );
}
