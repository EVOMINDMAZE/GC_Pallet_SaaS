"use client";
import useSWR from "swr";
import { getPocketBase } from "@/lib/pocketbase";
import type { ProjectsRecord } from "@/lib/types";

export function useProjects(opts?: { createdAfter?: string }) {
  const pb = getPocketBase();
  const key = opts?.createdAfter ? ["projects", opts.createdAfter] : "projects";
  const createdAfter = opts?.createdAfter;
  return useSWR<ProjectsRecord[]>(key, async () => {
    const filter = createdAfter ? `created >= "${createdAfter}"` : "";
    return (await pb.collection("projects").getFullList({
      sort: "-created",
      filter,
    })) as ProjectsRecord[];
  });
}

export function useProject(id?: string) {
  const pb = getPocketBase();
  return useSWR<ProjectsRecord | null>(id ? ["project", id] : null, async () => {
    if (!id) return null;
    return (await pb.collection("projects").getOne(id)) as ProjectsRecord;
  });
}
