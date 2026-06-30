"use client";

import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { SignOutCard } from "@/components/settings/sign-out-card";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <span className="text-label uppercase tracking-wider text-muted-foreground">
          Account
        </span>
        <h1 className="text-h1 font-bold tracking-tight text-foreground">
          Account settings
        </h1>
        <p className="text-body text-muted-foreground">
          Manage your profile, password, and session.
        </p>
      </header>

      <ProfileForm />
      <PasswordForm />
      <SignOutCard />
    </div>
  );
}