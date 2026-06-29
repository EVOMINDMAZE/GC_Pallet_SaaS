"use client";
import * as React from "react";
import Link from "next/link";
import { useProject } from "@/hooks/useProjects";
import { useDocuments } from "@/hooks/useDocuments";
import { useInventory } from "@/hooks/useInventory";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectActions } from "@/components/projects/project-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getPocketBase } from "@/lib/pocketbase";
import { formatCurrency, formatDate } from "@/lib/format";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { data: project, isLoading } = useProject(params.id);
  const { data: docs } = useDocuments(params.id);
  const { data: inventory } = useInventory(params.id);
  const [editing, setEditing] = React.useState(false);

  if (isLoading) return <p>Loading…</p>;
  if (!project) return <p>Not found.</p>;

  if (editing) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Edit {project.name}</h2>
        <ProjectForm initial={project} projectId={project.id} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <Badge variant="outline" className="capitalize">
              {project.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground">{project.address}</p>
          <p className="mt-2 text-sm">
            Budget: {formatCurrency(project.budget)} · {formatDate(project.start_date)} –{" "}
            {formatDate(project.end_date)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <ProjectActions projectId={project.id} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documents</CardTitle>
          <Button asChild size="sm">
            <Link href={`/documents?project=${project.id}`}>Upload</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {(docs ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No documents.</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">File</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(docs ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.name}</TableCell>
                  <TableCell className="capitalize">{d.category}</TableCell>
                  <TableCell>{formatDate(d.uploaded_at)}</TableCell>
                  <TableCell className="text-right">
                    <a
                      href={getPocketBase().files.getUrl(d, d.file)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Open
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inventory</CardTitle>
          <Button asChild size="sm">
            <Link href={`/inventory?project=${project.id}`}>Add item</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {(inventory ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No inventory.</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Cost/unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(inventory ?? []).map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.item_name}</TableCell>
                  <TableCell>{it.quantity}</TableCell>
                  <TableCell className="capitalize">{it.unit}</TableCell>
                  <TableCell className="capitalize">{it.location.replace("_", " ")}</TableCell>
                  <TableCell className="text-right">{formatCurrency(it.cost_per_unit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
