"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectsRecord } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

const statusVariant: Record<
  ProjectsRecord["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  active: "default",
  planning: "outline",
  completed: "secondary",
  on_hold: "destructive",
};

export function ProjectCard({ project }: { project: ProjectsRecord }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <CardTitle className="text-base">
          <Link href={`/projects/${project.id}`} className="hover:underline">
            {project.name}
          </Link>
        </CardTitle>
        <Badge variant={statusVariant[project.status]} className="capitalize">
          {project.status.replace("_", " ")}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>{project.address || "No address"}</p>
        <p>Budget: {formatCurrency(project.budget)}</p>
        <p>
          {formatDate(project.start_date)} → {formatDate(project.end_date)}
        </p>
      </CardContent>
    </Card>
  );
}
