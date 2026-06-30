"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { getPocketBase } from "@/lib/pocketbase";
import { toast } from "@/components/ui/toaster";

export function SignOutCard() {
  const router = useRouter();
  async function logout() {
    const pb = getPocketBase();
    pb.authStore.clear();
    toast({ title: "Signed out" });
    router.push("/login");
    router.refresh();
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign out</CardTitle>
        <CardDescription>End your current session on this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body text-muted-foreground">
          You will be returned to the sign-in screen. Your data stays safe.
        </p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="button" variant="destructive" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </CardFooter>
    </Card>
  );
}