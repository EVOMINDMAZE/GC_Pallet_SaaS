"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
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
            <div className="relative h-[180px] w-full max-w-[220px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    onClick={(d) => {
                      const status = (d as { status?: ProjectStatus }).status;
                      if (status) router.push(`/projects?status=${status}`);
                    }}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} className="cursor-pointer outline-none" />
                    ))}
                  </Pie>
                  <Tooltip
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
                <div className="text-2xl font-bold tabular-nums text-foreground">{items.length}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</div>
              </div>
            </div>
            <ul className="grid w-full flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {data.map((row) => (
                <li key={row.status} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: row.color }}
                    />
                    {row.name}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
