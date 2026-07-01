"use client";
import { useDocuments } from "@/hooks/useDocuments";
import { useProjects } from "@/hooks/useProjects";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { UploadDocumentModal } from "@/components/documents/upload-modal";
import { DocumentList } from "@/components/documents/document-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Upload, FileText } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function DocumentsPage() {
  // useSearchParams suspends — wrap in <Suspense> so the chrome can paint first.
  return (
    <React.Suspense fallback={null}>
      <DocumentsPageInner />
    </React.Suspense>
  );
}

function DocumentsPageInner() {
  const params = useSearchParams();
  const initialProject = params.get("project") ?? "all";
  const [projectFilter, setProjectFilter] = React.useState<string>(initialProject);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const { data: documents, isLoading } = useDocuments(
    projectFilter !== "all" ? { projectId: projectFilter } : undefined,
  );
  const { data: projects } = useProjects();
  const hasProjects = (projects?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-label uppercase tracking-wider text-muted-foreground">Workspace · File hub</span>
          <h1 className="text-h1 font-bold tracking-tight text-foreground">Documents</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Permits, contracts, and photos organized by project.
          </p>
        </div>
        {hasProjects && (
          <Button variant="primary" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" /> Upload Document
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <FileText className="h-4 w-4 text-muted-foreground" />
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
        </CardContent>
      </Card>

      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : (
        <DocumentList
          documents={documents ?? []}
          onChanged={() => setUploadOpen(true)}
        />
      )}

      {hasProjects && projects && projects[0] && (
        <UploadDocumentModal
          projectId={projectFilter !== "all" ? projectFilter : projects[0].id}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onUploaded={() => setUploadOpen(false)}
        />
      )}
    </div>
  );
}
