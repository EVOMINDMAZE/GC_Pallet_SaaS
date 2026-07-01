"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, ShieldCheck } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { toastVariants_enum as toast } from "@/components/ui/toaster";

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const { error } = await getSupabase().auth.signInWithPassword({
        email: String(fd.get("email")),
        password: String(fd.get("password")),
      });
      if (error) throw error;
      toast.success("Welcome back");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.destructive(
        "Invalid credentials",
        err instanceof Error ? err.message : "Check your email and password.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-[400px]">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gcpallet-primary text-white shadow-sm">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              GC Pallet
            </span>
            <span className="text-body-strong tracking-tight">Operations Hub</span>
          </div>
          <Badge variant="success" className="ml-auto">
            <ShieldCheck className="h-3 w-3" /> Secure
          </Badge>
        </div>
        <div>
          <h1 className="text-h1 font-bold tracking-tight text-foreground">Sign in</h1>
          <p className="text-sm text-muted-foreground">Use your email and password.</p>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoFocus required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <p className="pt-2 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="font-medium text-gcpallet-primary hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
