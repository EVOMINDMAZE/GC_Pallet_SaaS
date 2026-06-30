"use client";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Package } from "lucide-react";
import { getPocketBase } from "@/lib/pocketbase";
import { toastVariants_enum as toast } from "@/components/ui/toaster";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InventoryRecord } from "@/lib/types";

export function InventoryTable({ items }: { items: InventoryRecord[] }) {
  const router = useRouter();

  async function onDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    try {
      await getPocketBase().collection("inventory").delete(id);
      toast.success("Deleted");
      router.refresh();
      window.location.reload();
    } catch (err) {
      toast.destructive("Error", err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-6 w-6" />}
        title="No inventory yet"
        description="Add materials using the form above. They'll be assigned to your active project."
      />
    );
  }

  const totalValue = items.reduce(
    (sum, it) => sum + (typeof it.cost_per_unit === "number" ? it.cost_per_unit : 0) * it.quantity,
    0
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-gcpallet-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gcpallet-muted/50">
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Cost / unit</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.id} className="hover:bg-gcpallet-muted/40">
              <TableCell className="font-medium text-foreground">{it.item_name}</TableCell>
              <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
              <TableCell className="capitalize text-muted-foreground">{it.unit}</TableCell>
              <TableCell className="capitalize text-muted-foreground">
                {it.location.replace("_", " ")}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(it.cost_per_unit)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(it.last_updated)}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="destructive" onClick={() => onDelete(it.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between border-t border-border bg-gcpallet-muted/40 px-4 py-3">
        <span className="text-label uppercase tracking-wider text-muted-foreground">Total value</span>
        <span className="text-h3 font-bold tabular-nums text-foreground">
          {formatCurrency(totalValue)}
        </span>
      </div>
    </div>
  );
}
