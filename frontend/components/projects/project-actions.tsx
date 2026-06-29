"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { getPocketBase } from "@/lib/pocketbase";
import { toast } from "@/components/ui/toaster";

export function ProjectActions({ projectId }: { projectId: string }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm("Delete this project and its documents/inventory?")) return;
    try {
      const pb = getPocketBase();
      await pb.collection("projects").delete(projectId);
      toast({ title: "Project deleted" });
      router.push("/projects");
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Delete failed",
        variant: "destructive",
      });
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={onDelete}>
      <Trash2 className="mr-2 h-4 w-4" /> Delete
    </Button>
  );
}
