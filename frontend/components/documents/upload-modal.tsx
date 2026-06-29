"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getPocketBase } from "@/lib/pocketbase";
import { documentSchema } from "@/lib/schemas";
import { toast } from "@/components/ui/toaster";
import { Plus } from "lucide-react";
import type { DocumentCategory, ProjectsRecord } from "@/lib/types";

export function UploadModal({ projects }: { projects: ProjectsRecord[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [category, setCategory] = React.useState<DocumentCategory>("contract");
  const [project, setProject] = React.useState<string>(projects[0]?.id ?? "");

  React.useEffect(() => {
    if (!project && projects.length > 0) setProject(projects[0].id);
  }, [projects, project]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file") as File | null;
    const parsed = documentSchema.safeParse({
      name: fd.get("name"),
      category,
      project,
      file,
    });
    if (!parsed.success) {
      toast({
        title: "Validation error",
        description: parsed.error.issues[0]?.message ?? "Check inputs",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }
    if (!file) {
      toast({ title: "File required", variant: "destructive" });
      setSubmitting(false);
      return;
    }
    try {
      const pb = getPocketBase();
      const userId = pb.authStore.model?.id;
      if (!userId) throw new Error("Not authenticated");
      const fd2 = new FormData();
      fd2.append("name", parsed.data.name);
      fd2.append("category", parsed.data.category);
      fd2.append("project", parsed.data.project);
      fd2.append("uploaded_at", new Date().toISOString());
      fd2.append("user", userId);
      fd2.append("file", file);
      await pb.collection("documents").create(fd2);
      toast({ title: "Uploaded", description: parsed.data.name });
      setOpen(false);
      router.refresh();
      location.reload(); // refresh SWR cache
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
          <DialogDescription>PDF or image, up to 50MB.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="doc-name">Name</Label>
            <Input id="doc-name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doc-project">Project</Label>
            <Select value={project} onValueChange={setProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doc-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["contract", "permit", "invoice", "receipt", "photo", "other"] as DocumentCategory[]).map(
                  (c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doc-file">File (PDF or image)</Label>
            <Input id="doc-file" name="file" type="file" accept="application/pdf,image/*" required />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Uploading…" : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
