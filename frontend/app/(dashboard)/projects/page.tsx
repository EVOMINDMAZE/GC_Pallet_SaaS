"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/project-card";

export default function ProjectsPage() {
  const { data, isLoading } = useProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
        <Button asChild>
          <Link href="/projects/new">New Project</Link>
        </Button>
      </div>
      {isLoading && <p>Loading…</p>}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <p className="text-muted-foreground">No projects yet. Create your first one.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}
