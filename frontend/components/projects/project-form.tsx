"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPocketBase } from "@/lib/pocketbase";
import { projectSchema, type ProjectInput } from "@/lib/schemas";
import { toast } from "@/components/ui/toaster";
import type { ProjectsRecord, ProjectStatus } from "@/lib/types";

export function ProjectForm({ initial, projectId }: { initial?: ProjectsRecord; projectId?: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<ProjectStatus>(initial?.status ?? "planning");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const parsed = projectSchema.safeParse({ ...Object.fromEntries(fd.entries()), status });
    if (!parsed.success) {
      toast({
        title: "Validation error",
        description: parsed.error.issues[0]?.message,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }
    const data: ProjectInput = parsed.data;
    try {
      const pb = getPocketBase();
      const userId = pb.authStore.model?.id;
      if (!userId) throw new Error("Not authenticated");

      if (projectId) {
        await pb.collection("projects").update(projectId, data);
        toast({ title: "Project updated" });
      } else {
        await pb.collection("projects").create({ ...data, user: userId });
        toast({ title: "Project created" });
      }
      router.push("/projects");
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Save failed",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{projectId ? "Edit project" : "New project"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={initial?.name} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={initial?.address} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                min="0"
                step="0.01"
                defaultValue={initial?.budget ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["planning", "active", "completed", "on_hold"] as ProjectStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={initial?.start_date}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">End date</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={initial?.end_date}
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
