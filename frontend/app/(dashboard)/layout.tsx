import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DashboardGate } from "@/components/layout/dashboard-gate";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardGate>
      <div className="flex min-h-screen bg-gcpallet-muted/30">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
        <Toaster />
      </div>
    </DashboardGate>
  );
}
