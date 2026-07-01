# Tasks

- [x] **Task 1: Make every stat card clickable.**
  - SubTask 1.1: In [frontend/components/dashboard/stats-cards.tsx](file:///workspace/frontend/components/dashboard/stats-cards.tsx), wrap each of the four `StatCard` instances in a `next/link` `<Link>`. The destination for each:
    - Active Projects → `/projects?status=active`
    - Documents → `/documents?range=<range>`
    - Inventory Items → `/inventory`
    - Total Budget → `/projects`
  - SubTask 1.2: Use `hover:ring-1 hover:ring-gcpallet-primary/30` on the wrapped card so the user gets a clear "this is clickable" affordance (the donut already has this via the slice hover). Keep the card's existing layout (icon, label, value, caption, sparkline) — just put the `<Link>` around the existing `<StatCard>` JSX.

- [x] **Task 2: Make the documents timeline clickable + fix X-axis overlap.**
  - SubTask 2.1: In [frontend/components/dashboard/documents-timeline.tsx](file:///workspace/frontend/components/dashboard/documents-timeline.tsx), wrap the entire card content in a `<Link href={\`/documents?range=\${days === 7 ? "7d" : days === 30 ? "30d" : "all"}\`}>` (or pass a clickable `Bar` `onClick` that does `router.push(...)`).
  - SubTask 2.2: Fix the X-axis overlap by replacing `interval={days > 14 ? "preserveStartEnd" : 0}` with an explicit `interval` that picks every Nth tick based on `days`:
    - `days <= 7` → every tick (7 is fine at 400 px)
    - `days <= 14` → `interval={1}` (every other day)
    - `days > 14` → `interval="preserveStartEnd"` plus a `minTickGap={8}` so the renderer can drop ticks that don't fit
  - SubTask 2.3: Verify the chart in a narrow viewport (375 px) — labels are still legible.

- [x] **Task 3: Make the inventory-by-location widget clickable + fix tooltip overlap.**
  - SubTask 3.1: In [frontend/components/dashboard/inventory-by-location.tsx](file:///workspace/frontend/components/dashboard/inventory-by-location.tsx):
    - Add `useRouter` from `next/navigation`.
    - Wrap the whole card in a `<Link>` to `/inventory?location=<loc>` for the *most relevant* slice (or, better, leave the card non-clickable and add `onClick` to the `<Cell>` so each slice goes to its own filtered page).
    - Make the legend rows clickable too: each `<li>` becomes a `<Link>` to `/inventory?location=<loc>` where `<loc>` is the row's value.
  - SubTask 3.2: Fix the tooltip overlap by passing `<Tooltip wrapperStyle={{ pointerEvents: "none" }} offset={20} ... />` and a custom `content` that renders the value with a small padding offset, OR by using `<Tooltip position={{ x: 0, y: 0 }} ... />` to pin the tooltip to a fixed spot outside the donut. The simplest fix that works: add `cursor={false}` and use a custom `Tooltip` that renders a "callout" pill below the chart (below the donut, above the legend), not over the donut.

- [x] **Task 4: Make the project-status donut tooltip co-exist with the center label.**
  - SubTask 4.1: In [frontend/components/dashboard/project-status-donut.tsx](file:///workspace/frontend/components/dashboard/project-status-donut.tsx), the slice already navigates on click. Apply the same tooltip fix as Task 3.2 (use a custom callout below the chart, not over the donut), so the center `3 / TOTAL` label is never covered.

- [x] **Task 5: Make the project-timeline rows fully clickable.**
  - SubTask 5.1: In [frontend/components/dashboard/project-timeline-list.tsx](file:///workspace/frontend/components/dashboard/project-timeline-list.tsx), wrap the whole `<li>` contents (project name, badge, progress bar, date range) in a single `<Link href={\`/projects/\${p.id}\`}>`. Remove the inner `<Link>` on the project name to avoid nested anchors.

- [x] **Task 6: Make the recent-activity cards clickable.**
  - SubTask 6.1: In [frontend/components/dashboard/recent-activity.tsx](file:///workspace/frontend/components/dashboard/recent-activity.tsx), wrap each of the four cards in a `<Link>`:
    - Projects card → `/projects`
    - Inventory items card → `/inventory`
    - Latest project card → `/projects/<topProjects[0].id>` (or the project list if no projects)
    - Shares card → `/projects` (since shares live per-project, the user picks the project on the list page)
  - SubTask 6.2: Remove the existing inner `<Link>` on the latest-project name to avoid nested anchors.

- [x] **Task 7: Wire the query params into the list pages.**
  - SubTask 7.1: In [frontend/app/(dashboard)/projects/page.tsx](file:///workspace/frontend/app/(dashboard)/projects/page.tsx), use `useSearchParams` to read `?status=<x>` and pre-select the matching filter chip on first render. (If the page already uses a controlled filter, seed it from the URL.)
  - SubTask 7.2: In [frontend/app/(dashboard)/documents/page.tsx](file:///workspace/frontend/app/(dashboard)/documents/page.tsx), read `?range=<x>` and pre-select the time-range filter.
  - SubTask 7.3: In [frontend/app/(dashboard)/inventory/page.tsx](file:///workspace/frontend/app/(dashboard)/inventory/page.tsx), read `?location=<x>` and pre-select the location filter.

- [x] **Task 8: Typecheck + build.**
  - `cd /workspace/frontend && pnpm typecheck && pnpm build`. Both must be clean.

- [x] **Task 9: Manual verification in the deployed app.**
  - SubTask 9.1: Sign in, go to `/dashboard`. Click each stat card → land on the right page with the right filter applied.
  - SubTask 9.2: Click a bar (or anywhere) on the documents timeline → land on `/documents?range=...`.
  - SubTask 9.3: Click a slice on the inventory-by-location donut and a legend row → land on `/inventory?location=...`.
  - SubTask 9.4: Click a project-timeline row → land on `/projects/<id>`.
  - SubTask 9.5: Click each recent-activity card → land on the right page.
  - SubTask 9.6: At 375 px width, the documents-timeline X-axis labels are legible (no `Jun 17Jun 18` collisions).
  - SubTask 9.7: Hover a slice on the inventory donut → tooltip does not overlap the `$9,769 / TOTAL VALUE` center label.

- [ ] **Task 10: Commit + push + deploy.**
  - `git commit` and `git push origin main` (using the GitHub token the user shared earlier). Vercel auto-deploys.

# Task Dependencies
- Task 1 is independent.
- Task 2 is independent.
- Task 3 is independent.
- Task 4 is independent.
- Task 5 is independent.
- Task 6 is independent.
- Task 7 is independent but unblocks manual verification in 9.1.
- Task 8 depends on Tasks 1–7.
- Task 9 depends on Task 8.
- Task 10 depends on Task 9.

Parallelizable: Tasks 1, 2, 3, 4, 5, 6, 7 can all start in parallel (no code paths between them).
