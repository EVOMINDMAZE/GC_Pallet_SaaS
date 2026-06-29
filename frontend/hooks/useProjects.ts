"use client";
import useSWR from "swr";
import { getPocketBase } from "@/lib/pocketbase";
import type { ProjectsRecord } from "@/lib/types";

export function useProjects() {
  const pb = getPocketBase();
  return useSWR<ProjectsRecord[]>("projects", async () => {
    return (await pb.collection("projects").getFullList({ sort: "-created" })) as ProjectsRecord[];
  });
}

export function useProject(id?: string) {
  const pb = getPocketBase();
  return useSWR<ProjectsRecord | null>(id ? ["project", id] : null, async () => {
    if (!id) return null;
    return (await pb.collection("projects").getOne(id)) as ProjectsRecord;
  });
}
