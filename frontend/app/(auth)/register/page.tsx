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

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    const name = String(fd.get("name") || "");
    const company_name = String(fd.get("company_name") || "");
    const phone = String(fd.get("phone") || "");
    try {
      const supabase = getSupabase();
      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, company_name, phone } },
      });
      if (signUpErr) throw signUpErr;
      // If email confirmation is required in Supabase, the user will get
      // a magic link. Otherwise they are signed in immediately.
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        toast.success(
          "Check your email",
          "We sent a confirmation link to " + email,
        );
        router.push("/login");
        return;
      }
      toast.success("Account created", "Welcome to GC Pallet.");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.destructive("Error", err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-[440px]">
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
          <Badge variant="info" className="ml-auto">
            <ShieldCheck className="h-3 w-3" /> New tenant
          </Badge>
        </div>
        <div>
          <h1 className="text-h1 font-bold tracking-tight text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Track projects, documents, and inventory in one place.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="company_name">Company</Label>
              <Input id="company_name" name="company_name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
          <p className="pt-2 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-gcpallet-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
