"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { FolderKanban, FileText, Plus, ChevronRight } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { getPocketBase } from "@/lib/pocketbase";
import { formatDate, formatCurrency } from "@/lib/format";

export function RecentActivity() {
  const { data: projects, isLoading: lp } = useProjects();
  const { data: docs, isLoading: ld } = useDocuments();

  const recentProjects = (projects ?? []).slice(0, 5);
  const recentDocs = (docs ?? []).slice(0, 5);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Recent projects</CardTitle>
          <Link href="/projects" className="text-xs font-medium text-gcpallet-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="space-y-1 px-2 pb-2">
          {lp ? (
            <div className="px-3 py-6 text-sm text-muted-foreground">Loading…</div>
          ) : recentProjects.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="h-6 w-6" />}
              title="No projects yet"
              description="Start by creating your first site."
              action={
                <Button asChild variant="primary">
                  <Link href="/projects/new"><Plus className="h-4 w-4" /> New Project</Link>
                </Button>
              }
            />
          ) : (
            recentProjects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center justify-between rounded-md px-3 py-3 hover:bg-gcpallet-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gcpallet-primary"
              >
                <div>
                  <div className="text-body-strong text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(p.start_date)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(p.budget)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Recent documents</CardTitle>
          <Link href="/documents" className="text-xs font-medium text-gcpallet-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="space-y-1 px-2 pb-2">
          {ld ? (
            <div className="px-3 py-6 text-sm text-muted-foreground">Loading…</div>
          ) : recentDocs.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No documents yet"
              description="Upload a permit or contract to get started."
            />
          ) : (
            recentDocs.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-md px-3 py-3 hover:bg-gcpallet-muted"
              >
                <div className="min-w-0">
                  <div className="truncate text-body-strong text-foreground">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.category} · {formatDate(d.uploaded_at)}
                  </div>
                </div>
                <a
                  href={getPocketBase().files.getUrl(d, d.file)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-gcpallet-primary hover:underline"
                >
                  Open
                </a>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
