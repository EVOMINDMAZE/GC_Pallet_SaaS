"use client";
import useSWR from "swr";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import type { Project, ProjectStatus } from "@/lib/types";

/**
 * Fetch the current user's projects. SWR caches the list and
 * revalidates on mutate. RLS scopes the result to auth.uid() on the
 * server, so the browser just calls .from('projects').select() and
 * gets the right rows back without any client-side filter.
 */
const fetcher = async () => {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id,user_id,name,address,budget,start_date,end_date,status,created_at,updated_at",
    )
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToProject);
};

function rowToProject(row: {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    address: row.address,
    budget: row.budget,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useProjects() {
  const { userId } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    userId ? "projects" : null,
    fetcher,
  );
  return {
    data: data ?? [],
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

/**
 * Fetch a single project by id. Returns null while loading or if the
 * project isn't visible to the current user (RLS will just return
 * nothing for that case).
 */
const singleFetcher = async (id: string) => {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id,user_id,name,address,budget,start_date,end_date,status,created_at,updated_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToProject(data) : null;
};

export function useProject(id: string | null | undefined) {
  const { userId } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Project | null>(
    userId && id ? ["project", id] : null,
    () => singleFetcher(id as string),
  );
  return {
    data: data ?? null,
    isLoading,
    error,
    refresh: () => mutate(),
  };
}

export interface ProjectInput {
  name: string;
  address?: string | null;
  budget?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status: ProjectStatus;
}

/**
 * Create a project for the current user. Throws on RLS rejection
 * (e.g. user_id mismatch) so the caller can show a useful error.
 */
export async function createProject(input: ProjectInput): Promise<Project> {
  const supabase = getSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: input.name,
      address: input.address ?? null,
      budget: input.budget ?? null,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      status: input.status,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToProject(data);
}

export async function updateProject(
  id: string,
  patch: Partial<ProjectInput>,
): Promise<Project> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("projects")
    .update({
      name: patch.name,
      address: patch.address,
      budget: patch.budget,
      start_date: patch.startDate,
      end_date: patch.endDate,
      status: patch.status,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToProject(data);
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}
