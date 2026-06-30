# Checklist — GC Pallet Design System Refresh

Verification checkpoints. Each must be checkable by reading code, inspecting a screenshot, or running a script.

## Tokens & Theme

- [x] `tailwind.config.ts` declares the six core palette tokens (primary, accent, secondary, muted, card, info-soft) and the four semantic tokens (success, warning, info, destructive) under `theme.extend.colors`.
- [x] `tailwind.config.ts` extends `theme.extend.borderRadius` with sm / md / lg / full values.
- [x] `tailwind.config.ts` extends `theme.extend.boxShadow` with sm / lg values.
- [x] `tailwind.config.ts` exposes typography utilities (`text-display`, `text-h1..3`, `text-body`, `text-body-strong`, `text-label`).
- [x] `app/globals.css` declares matching CSS variables for both `:root` and any dark theme.

## Brand Chrome

- [x] Sidebar renders "GC PALLET Operations Hub" wordmark + grid mark.
- [x] Sidebar is 240px wide on md+ and collapsible on small screens.
- [x] Active sidebar row uses orange fill + white text.
- [x] Inactive sidebar rows show a hover background and an orange 2px focus-visible ring.
- [x] Top bar renders breadcrumb on the left and a "Brand approved" chip + account pill on the right.
- [x] Sidebar uses the icons for Dashboard / Projects / Documents / Inventory.

## UI Primitives

- [x] `Button` exposes `primary`, `secondary`, `outline`, `ghost`, `success`, `destructive` variants with a 2px orange focus ring.
- [x] `Card` uses radius lg and shadow sm by default.
- [x] `Badge` exposes the six semantic variants and is used for project status and table rows.
- [x] `Input`, `Textarea`, `Select` use radius md and a 2px orange focus-visible ring.
- [x] `Label` renders uppercase with letter-spacing per the LABEL / PROJECT METADATA spec.

## New Components

- [x] `StatCard` renders icon, label, value, optional trend pill, and caption.
- [x] `StatusBadge` maps `planning|active|completed|on_hold|draft|procurement` to the correct variant.
- [x] `DataTable` has a sticky header, comfortable cell padding, right-aligned numerics, and tabular numerals.
- [x] `EmptyState` shows icon + one-line message + one CTA.
- [x] `ErrorState` names the issue, preserves context, offers a recovery action.
- [x] `Skeleton` is used as a placeholder while SWR loads.
- [x] `Toast` supports default / success / warning / info / destructive variants with appropriate icons.

## Page Refreshes

- [x] Dashboard renders 4 `StatCard`s, Project Status pill row with counts, and Recent Projects + Recent Documents tables.
- [x] `/projects` shows `EmptyState` when no projects; otherwise a card grid with status badges.
- [x] `/projects/new` shows the refreshed form with sticky footer (Cancel + Save project).
- [x] `/projects/[id]` renders the 2-col detail with embedded Documents and Inventory tables and Edit/Delete actions.
- [x] `/inventory` shows the table with sticky header, right-aligned cost column, and total footer.
- [x] `/documents` shows the table; `EmptyState` ("No documents uploaded yet" + Upload CTA) when empty.
- [x] `/documents` Upload Modal has the new input/select look.
- [x] `/login` and `/register` render centered cards with the brand chip.

## Empty / Error / Loading Conventions

- [x] Every list page (projects, inventory, documents) renders `Skeleton` while SWR is loading.
- [x] Every list page renders `EmptyState` when data is empty.
- [x] Form submits fire `success` toasts on save.
- [x] Form submits fire `destructive` toasts on validation or API errors.

## Verification

- [x] `backend/scripts/e2e.mjs` returns 24 / 24.
- [x] `backend/scripts/frontend-routes.mjs` returns 7 / 7.
- [x] `backend/scripts/ui-e2e.py` returns 29 / 29.
- [x] Full-page screenshots saved to `/tmp/gcpallet-refresh/` for: Dashboard, /projects, /projects/[id], /inventory, /documents, /login, /register.
- [x] No new console errors when navigating across dashboard pages.