"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";
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

// Reverse map from display label back to the location key so the
// tooltip value can build a navigation href.
const LABEL_TO_KEY: Record<string, InventoryLocation> = Object.entries(LABELS).reduce(
  (acc, [k, v]) => ({ ...acc, [v]: k as InventoryLocation }),
  {} as Record<string, InventoryLocation>
);

// Recharts default Tooltip paints near the cursor — which is exactly
// over the donut's center label. Render our own callout instead, and
// pin it to a fixed spot at the bottom of the chart so it never
// collides with `$X / TOTAL VALUE`.
type SliceRow = { name: string; value: number; color: string };
function CustomTooltip(props: TooltipContentProps) {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;
  const row = (payload[0]?.payload as SliceRow | undefined) ?? null;
  if (!row) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-sm">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: row.color }}
        />
        <span className="font-medium">{row.name}</span>
      </div>
      <div className="mt-0.5 font-semibold tabular-nums">
        {formatCurrency(row.value)}
      </div>
    </div>
  );
}

export function InventoryByLocation() {
  const router = useRouter();
  const { data: inventory, isLoading } = useInventory();
  const items = inventory ?? [];
  const sums: Record<InventoryLocation, number> = { warehouse: 0, job_site: 0, in_transit: 0 };
  for (const it of items) {
    const unit = typeof it.costPerUnit === "number" ? it.costPerUnit : 0;
    sums[it.location] += unit * it.quantity;
  }
  const total = Object.values(sums).reduce((a, b) => a + b, 0);

  const data = (Object.keys(LABELS) as InventoryLocation[])
    .map((loc) => ({ name: LABELS[loc], value: sums[loc], color: COLORS[loc], key: loc }))
    .filter((row) => row.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Inventory by location</CardTitle>
        <CardDescription>Click a slice or a row to filter the inventory page.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px]" />
        ) : data.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center text-sm text-muted-foreground">
            No inventory yet.
            <Link href="/inventory" className="mt-2 text-gcpallet-primary hover:underline">Add items →</Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-[200px] w-full max-w-[200px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    onClick={(d) => {
                      const key = (d as { key?: InventoryLocation }).key
                        ?? LABEL_TO_KEY[(d as { name?: string }).name ?? ""];
                      if (key) router.push(`/inventory?location=${key}`);
                    }}
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={entry.color}
                        className="cursor-pointer outline-none transition-opacity hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={CustomTooltip}
                    cursor={false}
                    wrapperStyle={{ pointerEvents: "none" }}
                    allowEscapeViewBox={{ x: true, y: true }}
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
                <li key={row.name}>
                  <Link
                    href={`/inventory?location=${row.key}`}
                    className="group flex items-center justify-between gap-3 rounded-md px-1.5 py-1 -mx-1.5 hover:bg-gcpallet-muted/60"
                  >
                    <span className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground">
                      <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: row.color }} />
                      {row.name}
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">{formatCurrency(row.value)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
