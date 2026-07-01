"use client";

import { useState } from "react";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";

const passwordSchema = z
  .object({
    password: z.string().min(8, "New password must be at least 8 characters"),
    passwordConfirm: z.string().min(8, "Confirm your new password"),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords do not match",
  });

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const parsed = passwordSchema.safeParse({ password, passwordConfirm });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[issue.path.join(".")] = issue.message;
      }
      setErrors(next);
      return;
    }
    setSaving(true);
    try {
      const { error } = await getSupabase().auth.updateUser({
        password: parsed.data.password,
      });
      if (error) throw error;
      toast({ title: "Password updated", variant: "success" });
      setPassword("");
      setPasswordConfirm("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update password";
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Change your password. You will not be signed out.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
            {errors.passwordConfirm && (
              <p className="text-xs text-destructive">{errors.passwordConfirm}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Updating…" : "Update password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
