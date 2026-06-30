"use client";
import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FolderKanban, Plus } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/project-card";
import type { ProjectStatus } from "@/lib/types";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  on_hold: "On hold",
  draft: "Draft",
  procurement: "Procurement",
};

export default function ProjectsPage() {
  // useSearchParams suspends rendering until the URL is known.
  // Wrap in <Suspense> with a skeleton fallback so the page chrome paints immediately.
  return (
    <React.Suspense fallback={<ProjectsPageSkeleton />}>
      <ProjectsPageInner />
    </React.Suspense>
  );
}

function ProjectsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-label uppercase tracking-wider text-muted-foreground">Workspace · Project controls</span>
          <h1 className="text-h1 font-bold tracking-tight text-foreground">Projects</h1>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton /><CardSkeleton /><CardSkeleton />
      </div>
    </div>
  );
}

function ProjectsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusFilter = (searchParams.get("status") as ProjectStatus | "all" | null) ?? "all";
  const setStatusFilter = (next: ProjectStatus | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("status");
    else params.set("status", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const { data, isLoading } = useProjects();
  const items = (data ?? []).filter(
    (p) => statusFilter === "all" || p.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-label uppercase tracking-wider text-muted-foreground">Workspace · Project controls</span>
          <h1 className="text-h1 font-bold tracking-tight text-foreground">Projects</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Track budgets, schedules, and documents for every active site.
          </p>
        </div>
        <Button asChild variant="primary">
          <Link href="/projects/new"><Plus className="h-4 w-4" /> New Project</Link>
        </Button>
      </div>

      {/* Status filter — backed by ?status= so dashboard donuts can deep-link here. */}
      <div className="flex items-center gap-3">
        <span className="text-label uppercase tracking-wider text-muted-foreground">Filter</span>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProjectStatus | "all")}>
          <SelectTrigger className="w-48" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {statusFilter !== "all" && (
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className="text-xs font-medium text-gcpallet-primary hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title={statusFilter === "all" ? "No projects yet" : `No ${STATUS_LABELS[statusFilter]} projects`}
          description={
            statusFilter === "all"
              ? "Create your first project to start tracking budget, schedule, and inventory."
              : "Try a different status or clear the filter."
          }
          action={
            <Button asChild variant="primary">
              <Link href="/projects/new"><Plus className="h-4 w-4" /> New Project</Link>
            </Button>
          }
        />
      )}

      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
