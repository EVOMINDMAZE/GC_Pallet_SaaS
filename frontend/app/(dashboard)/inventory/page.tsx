"use client";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useProjects } from "@/hooks/useProjects";
import { useInventory } from "@/hooks/useInventory";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { InventoryTable } from "@/components/inventory/inventory-table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function InventoryPage() {
  const params = useSearchParams();
  const initial = params.get("project") ?? "all";
  const [filter, setFilter] = React.useState<string>(initial);
  const { data: projects } = useProjects();
  const { data: items, isLoading } = useInventory(filter !== "all" ? filter : undefined);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Project:</span>
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
      </div>

      {projects && projects.length > 0 && (
        <InventoryForm
          projects={projects}
          defaultProjectId={filter !== "all" ? filter : undefined}
        />
      )}
      {projects && projects.length === 0 && (
        <p className="text-sm text-muted-foreground">Create a project first to add inventory.</p>
      )}

      {isLoading ? <p>Loading…</p> : <InventoryTable items={items ?? []} />}
    </div>
  );
}
