"use client";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useProjects } from "@/hooks/useProjects";
import { useInventory } from "@/hooks/useInventory";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Package, Info } from "lucide-react";
import { toast } from "@/components/ui/toaster";
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
  const { data: items, isLoading, refresh } = useInventory(
    filter !== "all" ? { projectId: filter } : undefined,
  );
  const isAllProjects = filter === "all";
  const activeProject = isAllProjects
    ? null
    : projects?.find((p) => p.id === filter) ?? null;

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
          {projects && projects.length === 0 ? (
            <p className="rounded-md bg-warning-soft p-4 text-sm text-warning-foreground_soft">
              <strong className="font-semibold">Heads up:</strong> Create a project first to start tracking inventory.
            </p>
          ) : isAllProjects ? (
            <div className="flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Pick a project from the filter above to add an item. Items are scoped to a single project.
              </span>
            </div>
          ) : activeProject ? (
            <InventoryForm
              projectId={activeProject.id}
              projectName={activeProject.name}
              onSaved={() => {
                refresh();
                toast({ title: "Item added" });
              }}
            />
          ) : (
            <p className="rounded-md bg-warning-soft p-4 text-sm text-warning-foreground_soft">
              <strong className="font-semibold">Heads up:</strong> The selected project couldn&apos;t be found.
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
