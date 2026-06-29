import { UserMenu } from "./user-menu";

export function Topbar({ title }: { title?: string }) {
  return (
    <div className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h1 className="text-lg font-semibold">{title ?? "GC Pallet"}</h1>
      <UserMenu />
    </div>
  );
}
