import { PublicNav } from "@/components/marketing/public-nav";
import { PublicFooter } from "@/components/marketing/public-footer";
import { Toaster } from "@/components/ui/toaster";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <Toaster />
    </div>
  );
}