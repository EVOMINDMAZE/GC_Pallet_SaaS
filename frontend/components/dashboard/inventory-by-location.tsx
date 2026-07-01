"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useInventory } from "@/hooks/useInventory";
import { formatCurrency } from "@/lib/format";
import type { InventoryLocation } from "@/lib/types";
import { Package } from "lucide-react";

const COLORS: Record<InventoryLocation, string> = {
  warehouse: "hsl(var(--chart-7))",
  job_site: "hsl(var(--chart-8))",
  in_transit: "hsl(var(--chart-4))",
};

const LABELS: Record<InventoryLocation, string> = {
  warehouse: "Warehouse",
  job_site: "On site",
  in_transit: "In transit",
};

export function InventoryByLocation() {
  const { data: inventory, isLoading } = useInventory();
  const items = inventory ?? [];
  const sums: Record<InventoryLocation, number> = { warehouse: 0, job_site: 0, in_transit: 0 };
  for (const it of items) {
    const unit = typeof it.costPerUnit === "number" ? it.costPerUnit : 0;
    sums[it.location] += unit * it.quantity;
  }
  const total = Object.values(sums).reduce((a, b) => a + b, 0);

  const data = (Object.keys(LABELS) as InventoryLocation[])
    .map((loc) => ({ name: LABELS[loc], value: sums[loc], color: COLORS[loc] }))
    .filter((row) => row.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Inventory by location</CardTitle>
        <CardDescription>Material value across warehouse, job sites, and in transit.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px]" />
        ) : data.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center text-sm text-muted-foreground">
            No inventory yet.
            <a href="/inventory" className="mt-2 text-gcpallet-primary hover:underline">Add items →</a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-[180px] w-full max-w-[200px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {data.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatCurrency(typeof v === "number" ? v : Number(v))}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      color: "hsl(var(--popover-foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(total)}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total value</div>
              </div>
            </div>
            <ul className="grid w-full flex-1 grid-cols-1 gap-y-2 text-sm">
              {data.map((row) => (
                <li key={row.name} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: row.color }} />
                    {row.name}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">{formatCurrency(row.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
