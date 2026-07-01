"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProject,
  updateProject,
  type ProjectInput,
} from "@/hooks/useProjects";
import type { Project, ProjectStatus } from "@/lib/types";
import { Loader2 } from "lucide-react";

const STATUS_VALUES = [
  "planning",
  "active",
  "completed",
  "on_hold",
  "draft",
  "procurement",
] as const satisfies readonly ProjectStatus[];

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  address: z.string().max(500).optional().or(z.literal("")),
  budget: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "Budget must be a non-negative number",
    ),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  status: z.enum(STATUS_VALUES),
});
type FormValues = z.infer<typeof schema>;

export function ProjectForm({
  project,
  onSaved,
}: {
  project?: Project;
  onSaved?: (p: Project) => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { register, handleSubmit, formState, setValue, watch } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        name: project?.name ?? "",
        address: project?.address ?? "",
        budget: project?.budget != null ? String(project.budget) : "",
        startDate: project?.startDate ?? "",
        endDate: project?.endDate ?? "",
        status: project?.status ?? "planning",
      },
    });

  const status = watch("status");

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSubmitting(true);
    const input: ProjectInput = {
      name: values.name,
      address: values.address || null,
      budget: values.budget ? Number(values.budget) : null,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      status: values.status,
    };
    try {
      const saved = project
        ? await updateProject(project.id, input)
        : await createProject(input);
      onSaved?.(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save project");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {formState.errors.name && (
          <p className="text-xs text-destructive">
            {formState.errors.name.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" rows={2} {...register("address")} />
        {formState.errors.address && (
          <p className="text-xs text-destructive">
            {formState.errors.address.message}
          </p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="budget">Budget (USD)</Label>
          <Input
            id="budget"
            inputMode="decimal"
            {...register("budget")}
          />
          {formState.errors.budget && (
            <p className="text-xs text-destructive">
              {formState.errors.budget.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <Select
          value={status}
          onValueChange={(v) => setValue("status", v as ProjectStatus)}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_VALUES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {project ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
