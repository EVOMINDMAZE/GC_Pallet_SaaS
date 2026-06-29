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
import { getPocketBase } from "@/lib/pocketbase";
import { toast } from "@/components/ui/toaster";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InventoryRecord } from "@/lib/types";

export function InventoryTable({ items }: { items: InventoryRecord[] }) {
  const router = useRouter();
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No inventory yet.</p>;
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    try {
      await getPocketBase().collection("inventory").delete(id);
      toast({ title: "Deleted" });
      router.refresh();
      window.location.reload();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Delete failed",
        variant: "destructive",
      });
    }
  }

  const totalValue = items.reduce(
    (sum, it) => sum + (typeof it.cost_per_unit === "number" ? it.cost_per_unit : 0) * it.quantity,
    0
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Cost/unit</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((it) => (
          <TableRow key={it.id}>
            <TableCell className="font-medium">{it.item_name}</TableCell>
            <TableCell>{it.quantity}</TableCell>
            <TableCell className="capitalize">{it.unit}</TableCell>
            <TableCell className="capitalize">{it.location.replace("_", " ")}</TableCell>
            <TableCell>{formatCurrency(it.cost_per_unit)}</TableCell>
            <TableCell>{formatDate(it.last_updated)}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="destructive" onClick={() => onDelete(it.id)}>
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell colSpan={4} className="text-right font-semibold">
            Total value
          </TableCell>
          <TableCell colSpan={3} className="font-semibold">
            {formatCurrency(totalValue)}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
