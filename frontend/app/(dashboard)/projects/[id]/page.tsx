"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";
import { useProjectInventory } from "@/hooks/useInventory";
import { useProjectDocuments } from "@/hooks/useDocuments";
import { useShares, createShare, revokeShare } from "@/hooks/useShares";
import { ProjectForm } from "@/components/projects/project-form";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { DocumentList } from "@/components/documents/document-list";
import { UploadDocumentModal } from "@/components/documents/upload-modal";
import { DeleteProjectButton } from "@/components/projects/project-actions";
import { DashboardGate } from "@/components/layout/dashboard-gate";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/date";
import { Trash2, Copy, Plus, FilePlus } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    planning: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    completed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    on_hold: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    procurement: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[status] ?? colors.planning}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default function ProjectDetailPage() {
  return (
    <DashboardGate>
      <ProjectDetail />
    </DashboardGate>
  );
}

function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { data: project, refresh: refreshProject } = useProject(projectId);
  const { data: items, refresh: refreshItems } = useProjectInventory(projectId);
  const { data: documents, refresh: refreshDocuments } = useProjectDocuments(projectId);
  const { data: shares, refresh: refreshShares } = useShares();
  const [uploadOpen, setUploadOpen] = React.useState(false);

  const projectShares = shares.filter((s) => s.resourceId === projectId);

  if (!project) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const onCreateShare = async () => {
    try {
      const created = await createShare({
        resourceId: projectId,
        label: project.name,
      });
      const link = `${window.location.origin}/share/${created.token}`;
      await navigator.clipboard.writeText(link);
      toast({
        title: "Share link created & copied",
        description: link,
      });
      refreshShares();
    } catch (e) {
      toast({
        title: "Could not create share",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  const onCopyShare = async (token: string) => {
    const link = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(link);
    toast({ title: "Link copied" });
  };

  const onRevokeShare = async (token: string) => {
    if (!window.confirm("Revoke this share link?")) return;
    try {
      await revokeShare(token);
      toast({ title: "Share revoked" });
      refreshShares();
    } catch (e) {
      toast({
        title: "Could not revoke",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.address ?? "No address set"} ·{" "}
            updated {formatDate(project.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="shares">Shares</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project details</CardTitle>
              <CardDescription>
                Edit the project name, address, budget, dates, and status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectForm project={project} onSaved={refreshProject} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryForm
                projectId={projectId}
                onSaved={() => {
                  refreshItems();
                  toast({ title: "Item added" });
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>
                {items.length} item{items.length === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTable items={items} onChanged={refreshItems} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Upload contracts, permits, photos, and other files.
                </CardDescription>
              </div>
              <Button onClick={() => setUploadOpen(true)}>
                <FilePlus className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </CardHeader>
            <CardContent>
              <DocumentList
                documents={documents}
                onChanged={refreshDocuments}
              />
            </CardContent>
          </Card>
          <UploadDocumentModal
            projectId={projectId}
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            onUploaded={() => {
              refreshDocuments();
              toast({ title: "Document uploaded" });
            }}
          />
        </TabsContent>

        <TabsContent value="shares" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Share links</CardTitle>
                <CardDescription>
                  Create a public link so someone outside your team can view
                  this project. The link is a random token; revoke it to
                  disable.
                </CardDescription>
              </div>
              <Button onClick={onCreateShare}>
                <Plus className="mr-2 h-4 w-4" />
                New share
              </Button>
            </CardHeader>
            <CardContent>
              {projectShares.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No share links yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {projectShares.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">
                          {s.label ?? "Untitled share"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Token: {s.token.slice(0, 8)}… · {s.viewCount} view
                          {s.viewCount === 1 ? "" : "s"}
                          {s.revoked ? " · revoked" : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onCopyShare(s.token)}
                          disabled={s.revoked}
                          aria-label="Copy link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRevokeShare(s.token)}
                          disabled={s.revoked}
                          aria-label="Revoke link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
