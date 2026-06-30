"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { getPocketBase } from "@/lib/pocketbase";
import { toastVariants_enum as toast } from "@/components/ui/toaster";

export function ProjectActions({ projectId }: { projectId: string }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm("Delete this project and its documents/inventory?")) return;
    try {
      const pb = getPocketBase();
      await pb.collection("projects").delete(projectId);
      toast.success("Project deleted");
      router.push("/projects");
      router.refresh();
    } catch (err) {
      toast.destructive("Error", err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={onDelete}>
      <Trash2 className="mr-2 h-4 w-4" /> Delete
    </Button>
  );
}
