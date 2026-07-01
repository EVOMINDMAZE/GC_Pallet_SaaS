"use client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Sign-out button. The actual signOut is in the auth hook (Supabase
 * call + redirect + refresh). This is just the UI card.
 */
export function SignOutCard() {
  const { signOut } = useAuth();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign out</CardTitle>
        <CardDescription>
          End your session on this device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          You can always sign back in with your email and password.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="destructive" onClick={signOut}>
          Sign out
        </Button>
      </CardFooter>
    </Card>
  );
}
