"use client";
import * as React from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

/**
 * Editable profile fields. We seed the form from the user_metadata
 * stored in the auth user record (name, company_name, phone) and
 * upsert to public.profiles on submit. RLS scopes the upsert to the
 * signed-in user's own row.
 */
export function ProfileForm() {
  const { user } = useAuth();
  const [name, setName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowser();
    let active = true;
    (async () => {
      // First read the public.profiles row, then fall back to
      // user_metadata if there's no row yet (shouldn't happen because
      // of the handle_new_user trigger, but be defensive).
      const { data: profile } = await supabase
        .from("profiles")
        .select("name,company_name,phone")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      setName(
        profile?.name ??
          (typeof meta.name === "string" ? meta.name : "") ??
          "",
      );
      setCompanyName(
        profile?.company_name ??
          (typeof meta.company_name === "string" ? meta.company_name : "") ??
          "",
      );
      setPhone(
        profile?.phone ??
          (typeof meta.phone === "string" ? meta.phone : "") ??
          "",
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    const supabase = getSupabaseBrowser();
    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        name: name.trim(),
        company_name: companyName.trim() || null,
        phone: phone.trim() || null,
      });
    setSaving(false);
    if (upsertErr) {
      setError(upsertErr.message);
      return;
    }
    setMessage("Profile saved.");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your name, company, and phone number.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pf-name">Full name</Label>
            <Input
              id="pf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-company">Company</Label>
            <Input
              id="pf-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-phone">Phone</Label>
            <Input
              id="pf-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {message && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {message}
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
