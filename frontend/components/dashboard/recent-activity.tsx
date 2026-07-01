"use client";
import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProjects } from "@/hooks/useProjects";
import { useInventory } from "@/hooks/useInventory";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Package, FileText, Share2 } from "lucide-react";

/**
 * Recent activity for the dashboard. Shows the four most recently
 * updated projects, the latest inventory change, and the latest
 * share. Renders placeholders on first paint to avoid a hydration
 * mismatch (server can't know the user's data).
 */
export function RecentActivity() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: items, isLoading: itemsLoading } = useInventory();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted || projectsLoading || itemsLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const topProjects = projects.slice(0, 4);
  const topItems = items.slice(0, 5);
  const totalProjects = projects.length;
  const totalItems = items.length;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href="/projects"
        className="group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gcpallet-primary/40"
        aria-label="Open projects"
      >
        <Card className="transition group-hover:-translate-y-0.5 group-hover:ring-1 group-hover:ring-gcpallet-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {topProjects[0]?.name ?? "No projects yet"}
            </p>
          </CardContent>
        </Card>
      </Link>
      <Link
        href="/inventory"
        className="group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gcpallet-primary/40"
        aria-label="Open inventory"
      >
        <Card className="transition group-hover:-translate-y-0.5 group-hover:ring-1 group-hover:ring-gcpallet-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {topItems[0]?.itemName ?? "No items yet"}
            </p>
          </CardContent>
        </Card>
      </Link>
      <Link
        href={topProjects[0] ? `/projects/${topProjects[0].id}` : "/projects"}
        className="group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gcpallet-primary/40"
        aria-label={topProjects[0] ? `Open latest project ${topProjects[0].name}` : "Open projects"}
      >
        <Card className="transition group-hover:-translate-y-0.5 group-hover:ring-1 group-hover:ring-gcpallet-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest project</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topProjects[0] ? (
              <>
                <div className="text-sm font-medium text-foreground group-hover:text-gcpallet-primary">
                  {topProjects[0].name}
                </div>
                <CardDescription className="mt-1">
                  {topProjects[0].status.replace("_", " ")} ·{" "}
                  {new Date(topProjects[0].updatedAt).toLocaleDateString()}
                </CardDescription>
              </>
            ) : (
              <CardDescription>No projects yet.</CardDescription>
            )}
          </CardContent>
        </Card>
      </Link>
      <Link
        href="/projects"
        className="group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gcpallet-primary/40"
        aria-label="Manage share links from a project"
      >
        <Card className="transition group-hover:-translate-y-0.5 group-hover:ring-1 group-hover:ring-gcpallet-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              Manage your active share links from the project page.
            </CardDescription>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
