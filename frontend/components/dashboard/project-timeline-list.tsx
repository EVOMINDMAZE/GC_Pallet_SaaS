"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useProjects } from "@/hooks/useProjects";
import { Calendar } from "lucide-react";

function progress(start?: string, end?: string): { pct: number; status: "future" | "in-progress" | "overdue" | "done" } {
  if (!start || !end) return { pct: 0, status: "future" };
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now >= e) return { pct: 100, status: "done" };
  if (now <= s) return { pct: 0, status: "future" };
  const pct = Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)));
  return { pct, status: "in-progress" };
}

export function ProjectTimelineList() {
  const { data: projects, isLoading } = useProjects();
  const items = (projects ?? []).filter((p) => p.status === "active").slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Active project timelines</CardTitle>
        <CardDescription>Schedule progress on jobs in flight.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px]" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-6 w-6" />}
            title="No active projects"
            description="Mark a project's status as Active to track its progress here."
          />
        ) : (
          <ul className="space-y-4">
            {items.map((p) => {
              const { pct, status } = progress(p.startDate ?? undefined, p.endDate ?? undefined);
              return (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="group block rounded-md -mx-2 px-2 py-1.5 transition hover:bg-gcpallet-muted/60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-body-strong truncate text-foreground group-hover:text-gcpallet-primary">
                        {p.name}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gcpallet-muted">
                      <div
                        className={
                          status === "done"
                            ? "h-full bg-success"
                            : status === "future"
                            ? "h-full bg-info-soft"
                            : "h-full bg-gcpallet-primary"
                        }
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{p.startDate ?? "—"} → {p.endDate ?? "—"}</span>
                      <span className="font-medium tabular-nums">
                        {status === "future" ? "Not started" : status === "done" ? "Complete" : `${pct}%`}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
