"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const onClick = async () => {
    if (
      !window.confirm(
        `Delete project "${projectName}"? This also removes its inventory and documents.`,
      )
    )
      return;
    setBusy(true);
    try {
      await deleteProject(projectId);
      toast({ title: "Project deleted" });
      router.push("/projects");
      router.refresh();
    } catch (e) {
      toast({
        title: "Could not delete project",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={onClick}
      disabled={busy}
      className="gap-2"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      Delete project
    </Button>
  );
}
