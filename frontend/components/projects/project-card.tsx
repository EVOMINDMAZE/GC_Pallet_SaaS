"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { MapPin, Calendar } from "lucide-react";
import type { ProjectsRecord } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

export function ProjectCard({ project }: { project: ProjectsRecord }) {
  return (
    <Card className="group transition-all hover:border-gcpallet-primary/30 hover:shadow-md focus-within:ring-2 focus-within:ring-gcpallet-primary">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/projects/${project.id}`}
              className="block truncate text-h3 font-semibold tracking-tight text-foreground hover:text-gcpallet-primary"
            >
              {project.name}
            </Link>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {project.address || "No address on file"}
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <div className="text-label uppercase text-muted-foreground">Budget</div>
            <div className="text-body-strong tabular-nums text-foreground">
              {formatCurrency(project.budget)}
            </div>
          </div>
          <div>
            <div className="text-label uppercase text-muted-foreground">Schedule</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(project.start_date)} → {formatDate(project.end_date)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
