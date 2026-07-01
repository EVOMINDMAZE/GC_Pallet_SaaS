"use client";
import * as React from "react";
import { useSupabaseAuth } from "@/lib/supabase/provider";

/**
 * Auth hook for components. Returns the session/user from the
 * SupabaseAuthProvider context plus a signOut helper. Components
 * should use this instead of reaching into supabase.auth directly so
 * the auth state stays in one place.
 *
 * @example
 *   const { user, isAuthenticated, signOut } = useAuth();
 */
export function useAuth() {
  const { session, user, isLoading, signOut, isAuthenticated } = useSupabaseAuth();
  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    signOut,
    /** Convenience: the current user id, or null if signed out. */
    userId: user?.id ?? null,
    /** Convenience: the user's display name from user_metadata. */
    displayName:
      (user?.user_metadata?.name as string | undefined) ??
      user?.email?.split("@")[0] ??
      "",
  };
}
