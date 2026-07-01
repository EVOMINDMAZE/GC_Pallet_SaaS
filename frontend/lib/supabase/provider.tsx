"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "./client";
import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/theme-provider";

/**
 * Auth context. Provides the current Supabase session, the user, and a
 * sign-out helper. We mirror the session into React state so any
 * component can read it without each one opening its own realtime
 * channel.
 *
 * The /api/shares server route does the actual authorization check
 * against the user's own cookie; this client context is just for UI.
 */

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  /** Resolves to true once we've confirmed there's no session on the server. */
  isAuthenticated: boolean;
}

const AuthContext = React.createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
  isAuthenticated: false,
});

export function useSupabaseAuth() {
  return React.useContext(AuthContext);
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  // Mounted-guard: avoid a hydration mismatch when the server has no
  // auth context and the first client paint would otherwise flip the UI.
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const supabase = getSupabaseBrowser();
    let active = true;
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setIsLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, newSession: Session | null) => {
        setSession(newSession);
      },
    );
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = React.useCallback(async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    setSession(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading: !mounted || isLoading,
      signOut,
      isAuthenticated: !!session?.user,
    }),
    [session, isLoading, signOut, mounted],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SupabaseAuthProvider>
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            shouldRetryOnError: false,
            dedupingInterval: 1000,
          }}
        >
          <Toaster />
          {children}
        </SWRConfig>
      </SupabaseAuthProvider>
    </ThemeProvider>
  );
}
