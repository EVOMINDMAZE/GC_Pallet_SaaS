import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight">GC Pallet</h1>
      <p className="max-w-md text-muted-foreground">
        Inventory & document management built for independent general contractors.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">Create account</Link>
        </Button>
      </div>
    </main>
  );
}
