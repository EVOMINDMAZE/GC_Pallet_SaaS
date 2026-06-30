import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";

type ProjectStatus = "planning" | "active" | "completed" | "on_hold" | "draft" | "procurement";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  on_hold: "On hold",
  draft: "Draft",
  procurement: "Procurement",
};

const STATUS_VARIANT: Record<ProjectStatus, BadgeProps["variant"]> = {
  planning: "warning",
  active: "info",
  completed: "success",
  on_hold: "destructive",
  draft: "secondary",
  procurement: "primary",
};

export function StatusBadge({ status, className, ...props }: { status: ProjectStatus; className?: string } & Omit<BadgeProps, "variant" | "children">) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className} {...props}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export { STATUS_LABELS, STATUS_VARIANT };
export type { ProjectStatus };
