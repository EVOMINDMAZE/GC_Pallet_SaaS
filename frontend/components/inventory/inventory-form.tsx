"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getSupabase } from "@/lib/supabase";
import { inventorySchema } from "@/lib/schemas";
import { toastVariants_enum as toast } from "@/components/ui/toaster";
import type { InventoryLocation, InventoryUnit, Project } from "@/lib/types";

export function InventoryForm({
  projects,
  defaultProjectId,
}: {
  projects: Project[];
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [unit, setUnit] = React.useState<InventoryUnit>("pieces");
  const [location, setLocation] = React.useState<InventoryLocation>("warehouse");
  const [project, setProject] = React.useState<string>(defaultProjectId ?? projects[0]?.id ?? "");

  React.useEffect(() => {
    if (!project && projects.length > 0) setProject(projects[0].id);
  }, [projects, project]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const rawCost = fd.get("cost_per_unit");
    const parsed = inventorySchema.safeParse({
      item_name: fd.get("item_name"),
      quantity: fd.get("quantity"),
      unit,
      location,
      cost_per_unit: rawCost === "" ? undefined : rawCost,
      project,
    });
    if (!parsed.success) {
      toast.destructive("Validation error", parsed.error.issues[0]?.message);
      setSubmitting(false);
      return;
    }
    try {
      const supabase = getSupabase();
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session?.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("inventory").insert({
        user_id: sess.session.user.id,
        project_id: parsed.data.project,
        item_name: parsed.data.item_name,
        quantity: Number(parsed.data.quantity),
        unit: parsed.data.unit,
        location: parsed.data.location,
        cost_per_unit:
          typeof parsed.data.cost_per_unit === "number" ? parsed.data.cost_per_unit : null,
        last_updated: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Item added");
      (e.target as HTMLFormElement).reset();
      router.refresh();
      window.location.reload();
    } catch (err) {
      toast.destructive("Error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="grid gap-3 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={onSubmit}
    >
      <div className="grid gap-2">
        <Label htmlFor="item">Item name</Label>
        <Input id="item" name="item_name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="qty">Quantity</Label>
        <Input id="qty" name="quantity" type="number" min="0" step="0.01" required />
      </div>
      <div className="grid gap-2">
        <Label>Unit</Label>
        <Select value={unit} onValueChange={(v) => setUnit(v as InventoryUnit)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["pieces", "lbs", "kg", "sqft", "sqm"] as InventoryUnit[]).map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Location</Label>
        <Select value={location} onValueChange={(v) => setLocation(v as InventoryLocation)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["warehouse", "job_site", "in_transit"] as InventoryLocation[]).map((l) => (
              <SelectItem key={l} value={l}>
                {l.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cost">Cost per unit (USD)</Label>
        <Input id="cost" name="cost_per_unit" type="number" min="0" step="0.01" />
      </div>
      <div className="grid gap-2">
        <Label>Project</Label>
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger>
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Add item"}
        </Button>
      </div>
    </form>
  );
}
