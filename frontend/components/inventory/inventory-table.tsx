"use client";
import * as React from "react";
import { deleteInventoryItem } from "@/hooks/useInventory";
import type { InventoryItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";
import { Loader2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "@/lib/date";

export function InventoryTable({
  items,
  onChanged,
}: {
  items: InventoryItem[];
  onChanged?: () => void;
}) {
  const [pending, setPending] = React.useState<string | null>(null);

  const onDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete inventory item "${name}"?`)) return;
    setPending(id);
    try {
      await deleteInventoryItem(id);
      toast({ title: "Item deleted" });
      onChanged?.();
    } catch (e) {
      toast({
        title: "Could not delete",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setPending(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        No inventory items yet. Add the first one above.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Location</TableHead>
          <TableHead className="text-right">Cost / unit</TableHead>
          <TableHead>Last updated</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.itemName}</TableCell>
            <TableCell className="text-right tabular-nums">
              {item.quantity}
            </TableCell>
            <TableCell>{item.unit}</TableCell>
            <TableCell>{item.location.replace("_", " ")}</TableCell>
            <TableCell className="text-right tabular-nums">
              {item.costPerUnit != null
                ? `$${item.costPerUnit.toFixed(2)}`
                : "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDistanceToNow(item.lastUpdated)}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item.id, item.itemName)}
                disabled={pending === item.id}
                aria-label="Delete item"
              >
                {pending === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
