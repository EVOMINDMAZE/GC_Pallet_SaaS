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
import { getSupabase } from "@/lib/supabase";
import { projectSchema, type ProjectInput } from "@/lib/schemas";
import { toast } from "@/components/ui/toaster";
import type { Project, ProjectStatus } from "@/lib/types";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  on_hold: "On hold",
  draft: "Draft",
  procurement: "Procurement",
};

export function ProjectForm({ initial, projectId }: { initial?: Project; projectId?: string }) {
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
    const supabase = getSupabase();
    try {
      if (projectId) {
        const { error } = await supabase
          .from("projects")
          .update({
            name: data.name,
            address: data.address || null,
            budget: typeof data.budget === "number" ? data.budget : null,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            status: data.status,
          })
          .eq("id", projectId);
        if (error) throw error;
        toast({ title: "Project updated", variant: "success" });
      } else {
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session?.user) throw new Error("Not authenticated");
        const { error } = await supabase.from("projects").insert({
          user_id: sess.session.user.id,
          name: data.name,
          address: data.address || null,
          budget: typeof data.budget === "number" ? data.budget : null,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          status: data.status,
        });
        if (error) throw error;
        toast({ title: "Project created", variant: "success" });
      }
      window.location.href = "/projects";
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{projectId ? "Edit project" : "New project"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" name="name" required defaultValue={initial?.name ?? undefined} placeholder="Riverside Tower" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Site address</Label>
            <Input id="address" name="address" defaultValue={initial?.address ?? undefined} placeholder="123 Riverside Dr, Springfield" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="budget">Budget</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="1000"
                  defaultValue={initial?.budget ?? ""}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" name="start_date" type="date" defaultValue={initial?.start_date ?? undefined} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">End date</Label>
              <Input id="end_date" name="end_date" type="date" defaultValue={initial?.end_date ?? undefined} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-6 mt-2 flex items-center justify-end gap-3 border-t border-border bg-background/85 px-6 py-4 backdrop-blur">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving…" : "Save project"}
        </Button>
      </div>
    </form>
  );
}
