"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";
import { useProjects } from "@/hooks/useProjects";
import type { ProjectStatus } from "@/lib/types";
import { FolderKanban } from "lucide-react";

const SLICE_COLORS: Record<ProjectStatus, string> = {
  planning: "hsl(var(--chart-1))",
  active: "hsl(var(--chart-2))",
  completed: "hsl(var(--chart-3))",
  on_hold: "hsl(var(--chart-4))",
  draft: "hsl(var(--chart-5))",
  procurement: "hsl(var(--chart-6))",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  on_hold: "On hold",
  draft: "Draft",
  procurement: "Procurement",
};

// Custom tooltip: never paint at the chart center, so the donut's
// "N / TOTAL" label is never occluded. Recharts will float this
// near the cursor by default, which is fine for slices near the
// outer edge; for slices hugging the center we let `allowEscapeViewBox`
// push the tooltip toward the closest non-center area.
type SliceRow = { status: ProjectStatus; name: string; value: number; color: string };
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
        {row.value} project{row.value === 1 ? "" : "s"}
      </div>
    </div>
  );
}

export function ProjectStatusDonut() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const items = projects ?? [];

  const data = (Object.keys(STATUS_LABELS) as ProjectStatus[])
    .map((status) => ({
      status,
      name: STATUS_LABELS[status],
      value: items.filter((p) => p.status === status).length,
      color: SLICE_COLORS[status],
    }))
    .filter((row) => row.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FolderKanban className="h-4 w-4" /> Project status</CardTitle>
        <CardDescription>Click a slice to filter the projects page.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[220px]" />
        ) : data.length === 0 ? (
          <div className="flex h-[220px] flex-col items-center justify-center text-sm text-muted-foreground">
            No projects yet.
            <a href="/projects/new" className="mt-2 text-gcpallet-primary hover:underline">Create one →</a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-[220px] w-full max-w-[220px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={84}
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    onClick={(d) => {
                      const status = (d as { status?: ProjectStatus }).status;
                      if (status) router.push(`/projects?status=${status}`);
                    }}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} className="cursor-pointer outline-none transition-opacity hover:opacity-80" />
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
                <div className="text-2xl font-bold tabular-nums text-foreground">{items.length}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</div>
              </div>
            </div>
            <ul className="grid w-full flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {data.map((row) => (
                <li key={row.status}>
                  <Link
                    href={`/projects?status=${row.status}`}
                    className="group flex items-center justify-between gap-3 rounded-md px-1.5 py-1 -mx-1.5 hover:bg-gcpallet-muted/60"
                  >
                    <span className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground">
                      <span
                        aria-hidden
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: row.color }}
                      />
                      {row.name}
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">{row.value}</span>
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
