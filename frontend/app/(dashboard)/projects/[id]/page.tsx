"use client";
import * as React from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { useProject } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { useInventory } from "@/hooks/useInventory";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectActions } from "@/components/projects/project-actions";
import { ShareDialog } from "@/components/projects/share-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPocketBase } from "@/lib/pocketbase";
import { formatCurrency, formatDate } from "@/lib/format";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { data: project, isLoading, error } = useProject(params.id);
  const { data: docs } = useDocuments({ projectId: params.id });
  const { data: inventory } = useInventory({ projectId: params.id });
  const [editing, setEditing] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading project…</p>;
  // Either the row is genuinely missing or PB denied access (listRule on someone else's row).
  // In both cases render the same not-found surface so we don't leak existence.
  if (error || !project) return <p className="text-sm text-destructive">Not found.</p>;

  if (editing) {
    return (
      <div className="space-y-6">
        <div>
          <span className="text-label uppercase tracking-wider text-muted-foreground">Project controls · Edit</span>
          <h1 className="text-h1 font-bold tracking-tight text-foreground">{project.name}</h1>
        </div>
        <ProjectForm initial={project} projectId={project.id} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-h1 font-bold tracking-tight text-foreground">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-sm text-muted-foreground">{project.address || "No address on file"}</p>
          <p className="text-sm">
            <span className="text-label uppercase tracking-wider text-muted-foreground">Budget</span>{" "}
            <span className="font-semibold tabular-nums">{formatCurrency(project.budget)}</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="text-muted-foreground">{formatDate(project.start_date)} → {formatDate(project.end_date)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-accent"
            onClick={() => setSharing(true)}
          >
            <Link2 className="h-4 w-4" /> Share
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-accent"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          <ProjectActions projectId={project.id} />
        </div>
      </div>

      <ShareDialog
        open={sharing}
        onOpenChange={setSharing}
        projectId={project.id}
        projectName={project.name}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Documents</CardTitle>
          <Link
            href={`/documents?project=${project.id}`}
            className="text-sm font-medium text-gcpallet-primary hover:underline"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {(docs ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          )}
          {(docs ?? []).length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="bg-gcpallet-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(docs ?? []).map((d) => (
                  <TableRow key={d.id} className="hover:bg-gcpallet-muted/40">
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{d.category}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(d.uploaded_at)}</TableCell>
                    <TableCell className="text-right">
                      <a
                        href={getPocketBase().files.getUrl(d, d.file)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-gcpallet-primary hover:underline"
                      >
                        Open
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Inventory</CardTitle>
          <Link
            href={`/inventory?project=${project.id}`}
            className="text-sm font-medium text-gcpallet-primary hover:underline"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {(inventory ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No inventory yet.</p>
          )}
          {(inventory ?? []).length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="bg-gcpallet-muted/50">
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Cost / unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(inventory ?? []).map((it) => (
                  <TableRow key={it.id} className="hover:bg-gcpallet-muted/40">
                    <TableCell className="font-medium">{it.item_name}</TableCell>
                    <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{it.unit}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {it.location.replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(it.cost_per_unit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
