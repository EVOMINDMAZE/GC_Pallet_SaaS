"use client";
import useSWR from "swr";
import { getPocketBase } from "@/lib/pocketbase";
import type { UsersRecord } from "@/lib/types";

export function useAuth() {
  const pb = getPocketBase();
  const { data, isLoading, mutate } = useSWR<UsersRecord | null>("auth-user", async () => {
    if (!pb.authStore.model) return null;
    try {
      return (await pb.collection("users").getOne(pb.authStore.model.id)) as UsersRecord;
    } catch {
      return null;
    }
  });

  return {
    user: data ?? null,
    isAuthenticated: !!pb.authStore.model,
    isLoading,
    refresh: mutate,
    logout: () => pb.authStore.clear(),
  };
}
