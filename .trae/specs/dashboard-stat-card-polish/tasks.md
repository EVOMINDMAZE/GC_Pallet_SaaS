# Tasks — Dashboard Stat Cards Design Polish

Implementation order: fix the sparkline containment → fix the StatCard label/grid layout → drop the misleading trend pill from the four dashboard stat cards → verify. Each task is small and produces a user-visible improvement.

- [x] **Task 1: Contain the sparkline.**
  - SubTask 1.1: In [frontend/components/dashboard/sparkline.tsx](file:///workspace/frontend/components/dashboard/sparkline.tsx), wrap the `<svg>` in a `<div className="h-7 w-24 flex-none">` so the rendered footprint is fixed (height 28, width 96) and the SVG cannot grow.
  - SubTask 1.2: Replace the SVG's `className="overflow-visible"` with `className="overflow-hidden"` and add a `<defs><clipPath id="spark-clip">…</clipPath></defs>` that matches the viewBox, applying it to both the area fill and the line path.
  - SubTask 1.3: Reduce stroke width 1.75 → 1.25 and the end-dot radius 2.5 → 2 so the chart reads cleaner at the stat-card size.

- [x] **Task 2: Stop the label from wrapping and lock down the layout.**
  - SubTask 2.1: In [frontend/components/ui/stat-card.tsx](file:///workspace/frontend/components/ui/stat-card.tsx), give the icon+label wrapper `min-w-0 flex-1` and add `whitespace-nowrap truncate` to the label `<span>`.
  - SubTask 2.2: Wrap the `aside` slot in a `<div className="flex-none w-24">` so it always has a fixed slot in the flex row, regardless of how the label group flexes.
  - SubTask 2.3: Keep the `trend` prop in the component API (with a JSDoc comment that says "currently unused by the dashboard — see [spec](file:///workspace/.trae/specs/dashboard-stat-card-polish/spec.md)") so it remains usable when a real previous-period comparison lands.

- [x] **Task 3: Drop the misleading `+100%` pill from the dashboard stat cards.**
  - SubTask 3.1: In [frontend/components/dashboard/stats-cards.tsx](file:///workspace/frontend/components/dashboard/stats-cards.tsx), stop passing `trend={…}` to each of the four `StatCard` instances. Keep computing `projDelta` / `docDelta` / `invDelta` only if other code needs them; otherwise remove the now-unused variables.

- [x] **Task 4: Verify.**
  - SubTask 4.1: `cd /workspace/frontend && pnpm typecheck && pnpm build` — both must be clean.
  - SubTask 4.2: Grep for other consumers of `Sparkline` and `StatCard` (e.g. `Grep "Sparkline" frontend/`, `Grep "StatCard" frontend/`) to confirm the spec scope is just the dashboard; if any other consumer shows up, update them or note in the spec checklist that they're intentionally untouched.
  - SubTask 4.3: Open the live dashboard, screenshot it, and confirm (a) no sparkline bleeds past a card, (b) all four labels are on a single line, (c) no `+100%` pill is visible.

- [x] **Task 5: Commit + push + deploy.**
  - `git commit` and `git push origin main` (using the GitHub token the user shared earlier). Vercel auto-deploys.

# Task Dependencies
- Task 2 depends on Task 1 (the sparkline must be a fixed size before the StatCard can safely reserve a slot for it).
- Task 3 depends on Task 2.
- Task 4 depends on Tasks 1–3.
- Task 5 depends on Task 4.

Parallelizable: none — Tasks 2 and 3 are sequential because both touch the dashboard's StatCard layout.
