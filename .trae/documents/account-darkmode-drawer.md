# GC Pallet — Account, Dark Mode & Mobile Drawer

## Summary

The design refresh is shipped and verified (backend E2E 24/24, frontend routes 7/7, UI E2E 29/29). Three high-value gaps remain in the user-facing UX that this plan closes:

1. **Account / profile** — `/settings` page where a user can edit `name`, `company_name`, `phone`, change password, and sign out.
2. **Dark mode** — toggle wired through the existing token system. Theme persists per-user in `localStorage` and respects `prefers-color-scheme` on first visit.
3. **Mobile sidebar drawer** — the current sidebar is `hidden md:flex`, so on a phone there is zero navigation. Replace it with a slide-in drawer triggered from the topbar; keep the desktop sidebar exactly as is.

All three are scoped to one working session. No PocketBase schema migration, no new routes beyond `/settings`, no new npm packages.

## Current State Analysis (grounded)

- **Tokens & theme hooks are already in place.** [`tailwind.config.ts`](file:///workspace/frontend/tailwind.config.ts) sets `darkMode: ["class"]` and exposes the new `gcpallet-*` palette + semantic `success | warning | info | destructive`. [`globals.css`](file:///workspace/frontend/app/globals.css) defines the HSL `:root` variables but **no `.dark` block** exists.
- **Sidebar hides on mobile.** [`sidebar.tsx`](file:///workspace/frontend/components/layout/sidebar.tsx#L17) uses `hidden md:flex md:w-60` — confirmed no nav surface under `md`.
- **Topbar already has the account pill** ([`topbar.tsx`](file:///workspace/frontend/components/layout/topbar.tsx#L60)) but [`UserMenu`](file:///workspace/frontend/components/layout/user-menu.tsx) (the dropdown with Sign out) is exported and **never mounted**. It will host the new Settings entry and the theme toggle.
- **`/settings` route does not exist.** `app/(dashboard)/` contains only `/`, `/projects`, `/inventory`, `/documents`. The dashboard layout ([`app/(dashboard)/layout.tsx`](file:///workspace/frontend/app/(dashboard)/layout.tsx)) does not include Settings in the nav.
- **Users collection already has the editable fields.** [`pb_migrations/1782743199_updated_users.js`](file:///workspace/backend/pb_migrations/1782743199_updated_users.js) extended users with `company_name` and `phone`. Register form ([`register/page.tsx`](file:///workspace/frontend/app/(auth)/register/page.tsx)) captures them on signup. There is no subsequent edit surface.
- **Dialog primitive exists** ([`components/ui/dialog.tsx`](file:///workspace/frontend/components/ui/dialog.tsx)) but **no Sheet primitive**. We will add a small `sheet.tsx` (Radix Dialog with side-aware styling) so the mobile drawer can slide from the left.
- **Auth hook exposes `user` and `logout`.** [`useAuth`](file:///workspace/frontend/hooks/useAuth.ts) returns the typed user, so the settings form can pre-fill from it.

## Proposed Changes

### 1. Dark mode tokens & theme provider

**Files**
- **Edit** [frontend/app/globals.css](file:///workspace/frontend/app/globals.css): add a `.dark` block that overrides every `:root` variable (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`) and a `&.dark` companion inside `@layer base` for the `bg-background text-foreground` rule so Tailwind picks it up under `dark:` variants.
- **Edit** [frontend/tailwind.config.ts](file:///workspace/frontend/tailwind.config.ts): switch the six `gcpallet-*` palette entries and the four semantic tokens from inline hex literals to `hsl(var(--gcpallet-primary) / <alpha-value>)` style CSS variables. This is what makes the dark variant flip them. Add the matching CSS-variable declarations (and `.dark` overrides) inside `:root` / `.dark` in `globals.css`. **Why**: the existing hex literals in `tailwind.config.ts` cannot be themed; converting to variables is the only way to make `darkMode: ["class"]` flip them without writing two parallel `dark:` classes everywhere.
- **Create** [frontend/components/theme/theme-provider.tsx](file:///workspace/frontend/components/theme/theme-provider.tsx): a thin React context that:
  - Reads initial theme from `localStorage["gcpallet-theme"]` or falls back to `prefers-color-scheme`.
  - Exposes `theme` (`"light" | "dark" | "system"`) and `setTheme(value)`.
  - Applies/removes the `dark` class on `<html>` inside a `useLayoutEffect`.
- **Create** [frontend/components/theme/theme-toggle.tsx](file:///workspace/frontend/components/theme/theme-toggle.tsx): three-state toggle (`Sun` / `Moon` / `Monitor` icons from `lucide-react`) mounted inside the existing `UserMenu`. Persists via the provider.
- **Edit** [frontend/components/providers.tsx](file:///workspace/frontend/components/providers.tsx): wrap children in `<ThemeProvider>` (must run before SWR so the dark class is set before first paint).

**Why this approach**: we avoid new dependencies. The `dark:` class strategy is already enabled in Tailwind config. Converting the `gcpallet-*` tokens to CSS variables is the minimal change that flips them in dark mode.

### 2. Mobile sidebar drawer

**Files**
- **Create** [frontend/components/ui/sheet.tsx](file:///workspace/frontend/components/ui/sheet.tsx): minimal shadcn Sheet port — extends the existing Dialog primitive with side-aware transforms (`left` slide-in by default). Components: `Sheet`, `SheetTrigger`, `SheetPortal`, `SheetOverlay`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetClose`.
- **Edit** [frontend/components/layout/sidebar.tsx](file:///workspace/frontend/components/layout/sidebar.tsx): extract the inner nav into a reusable `<SidebarContent />` subcomponent so the same items render in the desktop sidebar and inside the mobile `SheetContent`. Desktop `<aside>` keeps `hidden md:flex`. Mobile variant is a hidden `<Sheet>` block rendered alongside.
- **Edit** [frontend/components/layout/topbar.tsx](file:///workspace/frontend/components/layout/topbar.tsx): add a hamburger `<Button variant="ghost" size="icon">` with the `Menu` icon, visible only under `md` (`md:hidden`). It opens the new `<Sheet>` containing the same sidebar items. Close the sheet on navigation by listening to `usePathname` inside the sheet.

**Why this approach**: the existing desktop sidebar layout (240px, brand wordmark, active/hover states, orange focus ring) stays intact. We re-use the same `<SidebarContent />` so the drawer and the desktop sidebar cannot drift apart.

### 3. Account / Settings page

**Files**
- **Create** [frontend/app/(dashboard)/settings/page.tsx](file:///workspace/frontend/app/(dashboard)/settings/page.tsx): page header `Account settings` + three cards:
  - **Profile** — form with `name`, `company_name`, `phone`. Submits via `pb.collection("users").update(user.id, {...})`. Toast `success` on save, `destructive` on error. Resets SWR `auth-user` cache via `useAuth().refresh()`.
  - **Security** — password change with current / new / confirm. Uses `pb.collection("users").update(...)` with `password` + `passwordConfirm` (PocketBase enforces current-password on direct `update` via `oldPassword`). Toast `success` / `destructive`. Empty state shown when user signed up via the OAuth-style flow with no password (defensive — n/a for current register flow).
  - **Sign out** — destructive `Button` calling `useAuth().logout()`.
- **Create** [frontend/components/settings/profile-form.tsx](file:///workspace/frontend/components/settings/profile-form.tsx): client form, controlled inputs, zod-validated.
- **Create** [frontend/components/settings/password-form.tsx](file:///workspace/frontend/components/settings/password-form.tsx): client form, zod-validated (`password.min(8)`, `passwordConfirm.refine === password`).
- **Edit** [frontend/components/layout/user-menu.tsx](file:///workspace/frontend/components/layout/user-menu.tsx): add a `<DropdownMenuItem>` linking to `/settings` (`UserCog` icon) above the existing Sign out. This menu is now mounted inside the topbar (Step 4).
- **Edit** [frontend/components/layout/topbar.tsx](file:///workspace/frontend/components/layout/topbar.tsx): replace the read-only account pill with the existing `<UserMenu />`; add the new `<ThemeToggle />` next to it; show the hamburger button on mobile.
- **Edit** [frontend/components/layout/sidebar.tsx](file:///workspace/frontend/components/layout/sidebar.tsx): add a Settings row at the bottom of `items` (icon `Settings`, href `/settings`) so the desktop sidebar is also a discovery surface.

### 4. Optional polish — wire the `Topbar` brand chip to the new account menu

The current topbar has two elements (a static `Badge variant="success"` "Brand approved" and a static user pill). After Step 3 the user pill becomes interactive (`<UserMenu />`), the badge stays. Theme toggle sits between them. No other change.

## Assumptions & Decisions

- **Light vs dark on first visit** = `prefers-color-scheme` (system). Subsequent visits are sticky via `localStorage["gcpallet-theme"]`. This is the conventional shadcn behavior.
- **Tokens converted to CSS variables, not duplicated.** Converting the six `gcpallet-*` hex literals in `tailwind.config.ts` to `hsl(var(...))` references is required because Tailwind cannot theme inline hex values via the `dark:` class. The semantic `success | warning | info | destructive` are converted the same way. The HSL `:root` block already exists — we add the parallel `.dark` block and declare the new `gcpallet-*` variables.
- **No new npm packages.** Sheet is built from the existing `@radix-ui/react-dialog`. Theme toggle uses existing `lucide-react` icons (`Sun`, `Moon`, `Monitor`, `Menu`, `Settings`, `UserCog`).
- **Settings page is a regular dashboard route.** It sits under `(dashboard)/layout.tsx`, so it inherits the auth gate, sidebar, and topbar — no separate header needed.
- **Password change UX** uses PocketBase's built-in `update(id, { password, passwordConfirm, oldPassword })` flow. PocketBase v0.22 accepts these on the `users` collection.
- **Out of scope**: forgot-password email flow, email verification, avatar upload, team/role permissions, project sharing.

## Verification

A. **Type-check**:
```bash
cd /workspace/frontend && pnpm typecheck   # → 0 errors
```

B. **Production build**:
```bash
cd /workspace/frontend && pnpm build       # → routes table includes /settings
```

C. **Existing E2E suite stays green** (regressions break the change):
```bash
cd /workspace/backend && node scripts/e2e.mjs              # → 24/24
cd /workspace/backend && node scripts/frontend-routes.mjs  # → 7/7 (login, register, /, /projects, /projects/new, /documents, /inventory unchanged)
cd /workspace/backend && python3 scripts/ui-e2e.py         # → 29/29 (after updating ui-e2e.py for any new selectors)
```

D. **New headless coverage** — extend `ui-e2e.py` with a Stage 3 user-A flow:
   1. Visit `/settings`, change `company_name` to `"Acme Builders"`, save → assert success toast + sidebar `<UserMenu>` label updates.
   2. Toggle dark mode → assert `<html class="dark">` and a `localStorage["gcpallet-theme"] === "dark"`.
   3. Reload at mobile viewport (`375×812`) → click hamburger → assert the sheet contains the same 5 nav rows as the desktop sidebar → tap "Dashboard" → assert sheet closes.
   4. Sign out from `/settings` → assert `/login` redirect.

E. **Screenshots** in `/tmp/gcpallet-settings/`:
   - `settings-light.png` — `/settings` light mode
   - `settings-dark.png` — `/settings` dark mode (after toggle)
   - `dashboard-dark.png` — dashboard with dark theme active
   - `mobile-drawer.png` — mobile viewport with drawer open

F. **Manual visual check**: flip theme twice, navigate across `/`, `/projects`, `/inventory`, `/documents`, `/settings` — confirm no light/dark bleed, focus ring is orange on both themes, sidebar hover states still visible.