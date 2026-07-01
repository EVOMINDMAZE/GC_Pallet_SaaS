"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * Redirects unauthenticated visitors to /login. Uses a mounted-guard
 * so we don't render a flash of "redirect" on the server.
 *
 * Children are only rendered once we know the user is signed in.
 */
export function DashboardGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!mounted || isLoading) return;
    if (!isAuthenticated) {
      const next = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname : "/dashboard",
      );
      router.replace(`/login?next=${next}`);
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  if (!mounted || isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return null;
  }
  return <>{children}</>;
}
