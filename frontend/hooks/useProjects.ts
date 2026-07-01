"use client";
import useSWR from "swr";
import { getSupabase } from "@/lib/supabase";
import type { Project } from "@/lib/types";

export function useProjects(opts?: { createdAfter?: string }) {
  const supabase = getSupabase();
  const key = opts?.createdAfter ? ["projects", opts.createdAfter] : "projects";
  const createdAfter = opts?.createdAfter;
  return useSWR<Project[]>(key, async () => {
    let q = supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (createdAfter) q = q.gte("created_at", createdAfter);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Project[];
  });
}

export function useProject(id?: string) {
  const supabase = getSupabase();
  return useSWR<Project | null>(
    id ? ["project", id] : null,
    async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data as Project | null) ?? null;
    },
  );
}
