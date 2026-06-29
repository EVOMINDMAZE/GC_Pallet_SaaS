"use client";
import { useDocuments } from "@/hooks/useDocuments";
import { useProjects } from "@/hooks/useProjects";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { UploadModal } from "@/components/documents/upload-modal";
import { DocumentList } from "@/components/documents/document-list";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function DocumentsPage() {
  const params = useSearchParams();
  const initialProject = params.get("project") ?? "all";
  const [projectFilter, setProjectFilter] = React.useState<string>(initialProject);
  const { data: documents, isLoading } = useDocuments(
    projectFilter !== "all" ? projectFilter : undefined
  );
  const { data: projects } = useProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
        {projects && projects.length > 0 && <UploadModal projects={projects} />}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by project:</span>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <DocumentList documents={documents ?? []} />
      )}
    </div>
  );
}
