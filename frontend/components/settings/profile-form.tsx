"use client";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  company_name: z.string().max(160).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
});

export function ProfileForm() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setCompanyName(user.company_name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const parsed = profileSchema.safeParse({
      name,
      company_name: companyName,
      phone,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[issue.path.join(".")] = issue.message;
      }
      setErrors(next);
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await getSupabase()
        .from("profiles")
        .update({
          name: parsed.data.name,
          company_name: parsed.data.company_name || null,
          phone: parsed.data.phone || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      await refresh();
      toast({ title: "Profile saved", variant: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save profile";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your name, company, and phone number.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-company">Company name</Label>
            <Input
              id="profile-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoComplete="organization"
              placeholder="Acme Builders"
            />
            {errors.company_name && (
              <p className="text-xs text-destructive">{errors.company_name}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-phone">Phone</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="+1 555 010 0000"
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
