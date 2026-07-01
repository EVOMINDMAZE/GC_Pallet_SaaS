"use client";
import useSWR from "swr";
import { getSupabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export function useAuth() {
  const supabase = getSupabase();
  const { data, isLoading, mutate } = useSWR<Profile | null>(
    "auth-user",
    async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session?.user) return null;
      const { data: row, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sess.session.user.id)
        .maybeSingle();
      if (error) return null;
      return (row as Profile | null) ?? null;
    },
    { revalidateOnMount: true },
  );

  return {
    user: data ?? null,
    isAuthenticated: !!data,
    isLoading,
    refresh: mutate,
    logout: async () => {
      await supabase.auth.signOut();
    },
  };
}
