"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/hooks/useProjects";
import type { ProjectStatus } from "@/lib/types";

const labels: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  on_hold: "On Hold",
};

const variants: Record<
  ProjectStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  planning: "outline",
  active: "default",
  completed: "secondary",
  on_hold: "destructive",
};

export function ProjectStatusChart() {
  const { data: projects } = useProjects();
  const counts = (projects ?? []).reduce<Record<ProjectStatus, number>>(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    { planning: 0, active: 0, completed: 0, on_hold: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {(Object.keys(labels) as ProjectStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Badge variant={variants[s]}>{labels[s]}</Badge>
            <span className="text-2xl font-bold">{counts[s]}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
