"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/toaster";

export function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  // Defer user-dependent label until after mount so the server
  // (no auth context) and first client paint match exactly.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  async function logout() {
    await getSupabase().auth.signOut();
    toast({ title: "Signed out" });
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {mounted ? (user?.name ?? user?.email ?? "Account") : "Account"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {mounted && user && (
          <>
            <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <UserCog className="mr-2 h-4 w-4" /> Account settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}