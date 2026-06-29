"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { getPocketBase } from "@/lib/pocketbase";
import { formatDate, formatCurrency } from "@/lib/format";

export function RecentActivity() {
  const { data: projects } = useProjects();
  const { data: docs } = useDocuments();

  const recentProjects = (projects ?? []).slice(0, 5);
  const recentDocs = (docs ?? []).slice(0, 5);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentProjects.length === 0 && (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          )}
          {recentProjects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
            >
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{formatDate(p.start_date)}</div>
              </div>
              <span className="text-sm text-muted-foreground">{formatCurrency(p.budget)}</span>
            </Link>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentDocs.length === 0 && (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          )}
          {recentDocs.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {d.category} · {formatDate(d.uploaded_at)}
                </div>
              </div>
              <a
                href={getPocketBase().files.getUrl(d, d.file)}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline"
              >
                Open
              </a>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
