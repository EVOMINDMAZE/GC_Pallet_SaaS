# Tasks — GC Pallet Design System Refresh

Implementation order is foundation → primitives → page-level components → apply across pages → verify. Each task is small enough to verify independently and produces user-visible progress.

- [x] Task 1: Design tokens & Tailwind theme
  - [x] SubTask 1.1: Replace `tailwind.config.ts` color map with the six core palette tokens + four semantic tokens; add radius scale (sm/md/lg/full) and shadow scale (sm/lg).
  - [x] SubTask 1.2: Update `app/globals.css` CSS variables to match the dark/light theme structure; add Inter as primary font.
  - [x] SubTask 1.3: Add `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-body-strong`, `text-label` utilities via Tailwind theme extension.
  - [x] SubTask 1.4: Add `tabular-nums` to default for tables and stat values via `@layer base`.

- [x] Task 2: Brand chrome (sidebar + top bar)
  - [x] SubTask 2.1: Update `sidebar.tsx` to render "GC PALLET Operations Hub" wordmark + grid mark, 240px width, active/hover/keyboard-focus states.
  - [x] SubTask 2.2: Add `topbar.tsx` with breadcrumb on left, "Brand approved" chip and account pill on right; mount in `app/(dashboard)/layout.tsx`.
  - [x] SubTask 2.3: Verify wordmark icon and chip render correctly on Dashboard page (screenshot).

- [x] Task 3: Restyled UI primitives
  - [x] SubTask 3.1: Update `button.tsx` to add `primary` (orange CTA), `success`, `destructive` variants and stronger focus ring.
  - [x] SubTask 3.2: Update `card.tsx` to use radius lg + shadow sm default.
  - [x] SubTask 3.3: Update `badge.tsx` to expose six semantic variants (success / warning / info / destructive / secondary / primary).
  - [x] SubTask 3.4: Update `input.tsx` and `select.tsx` to use radius md and a 2px orange focus-visible ring.
  - [x] SubTask 3.5: Update `textarea.tsx` and `label.tsx` to match.

- [x] Task 4: New components
  - [x] SubTask 4.1: Build `stat-card.tsx` (icon, label, value, optional trend pill, caption).
  - [x] SubTask 4.2: Build `status-badge.tsx` mapping project status fields to badge variants.
  - [x] SubTask 4.3: Build `data-table.tsx` primitives with sticky header, compact padding, right-aligned numerics.
  - [x] SubTask 4.4: Build `empty-state.tsx` and `error-state.tsx` shells.
  - [x] SubTask 4.5: Build `skeleton.tsx` for shimmer placeholders.
  - [x] SubTask 4.6: Update `toaster.tsx` + `toast.tsx` to support six variants with semantic icons.

- [x] Task 5: Dashboard page refresh (`app/(dashboard)/page.tsx`)
  - [x] SubTask 5.1: Replace inline stat blocks with four `StatCard`s (Active Projects, Documents, Inventory Items, Total Budget).
  - [x] SubTask 5.2: Render Project Status as four `StatusBadge`s with big counts.
  - [x] SubTask 5.3: Render Recent Projects and Recent Documents as `DataTable`s.

- [x] Task 6: Projects + Project form
  - [x] SubTask 6.1: Refresh `/projects` cards (radius, hover ring, status badge).
  - [x] SubTask 6.2: Refresh `/projects/new` form (new label/input styles, sticky footer with primary CTA).
  - [x] SubTask 6.3: Refresh `/projects/[id]` detail (2-col layout, embedded Documents + Inventory tables, Edit/Delete actions in top-right).

- [x] Task 7: Inventory page refresh
  - [x] SubTask 7.1: Refresh `/inventory` table (sticky header, right-aligned cost, total footer with currency).
  - [x] SubTask 7.2: Refresh `InventoryForm` with new Input/Select look.
  - [x] SubTask 7.3: Add skeleton loaders for the table.

- [x] Task 8: Documents page refresh
  - [x] SubTask 8.1: Refresh `/documents` table with new component.
  - [x] SubTask 8.2: Refresh `UploadModal` with new form controls and project/category selects.
  - [x] SubTask 8.3: Add empty state ("No documents uploaded yet" + Upload CTA).

- [x] Task 9: Auth pages
  - [x] SubTask 9.1: Refresh `/login` and `/register` centered cards with new button/input/badge styles and brand chip.

- [x] Task 10: Apply Across Empty/Error/Loading States
  - [x] SubTask 10.1: Ensure every list page uses `EmptyState` for its zero-data case.
  - [x] SubTask 10.2: Ensure every list page renders `Skeleton` while SWR is fetching.
  - [x] SubTask 10.3: Ensure toasts fired from form submits use semantic variants (success on save, warning/destructive on error).

- [x] Task 11: Verification
  - [x] SubTask 11.1: Re-run backend E2E (`backend/scripts/e2e.mjs`) — 24/24 passed.
  - [x] SubTask 11.2: Re-run frontend routes smoke (`backend/scripts/frontend-routes.mjs`) — 7/7 passed.
  - [x] SubTask 11.3: Re-run Playwright UI E2E (`backend/scripts/ui-e2e.py`) — 29/29 passed.
  - [x] SubTask 11.4: Capture a full-page screenshot of each refreshed page and visually verify against the reference board.

# Task Dependencies
- Task 2 depends on Task 1 (tokens must exist before chrome references them).
- Tasks 3 + 4 depend on Task 1.
- Task 5 depends on Tasks 3 + 4.
- Task 6 depends on Tasks 3 + 4.
- Task 7 depends on Tasks 3 + 4.
- Task 8 depends on Tasks 3 + 4.
- Task 9 depends on Tasks 3 + 4.
- Task 10 depends on Tasks 5–9.
- Task 11 depends on Tasks 1–10.

Parallelizable: Tasks 3 and 4 can run in parallel after Task 1. Tasks 5–9 can run in parallel after Tasks 3 + 4 finish.