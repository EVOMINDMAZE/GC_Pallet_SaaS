# Dashboard analytics & activity feed

## Goal

Replace the current "4 static cards + status pills + 2 recent lists" dashboard with a real **command center** — feature-rich analytics a SaaS user would actually come back to every morning.

## What's already in /dashboard (current state)

- `StatsCards` — 4 cards (Active Projects, Documents, Inventory Items, Total Budget) with **hardcoded** trends like `"+2 this week"`.
- `ProjectStatusChart` — just 4 status pills with counts.
- `RecentActivity` — two lists (recent projects, recent documents).

No real charts. No time-range filtering. No inventory or budget insight.

## What we'll add

1. **Charts library** — Install `recharts`.
2. **Time-range selector** — Pill group at the top of the dashboard: `7 days / 30 days / All time`. Filters every analytics card on the page.
3. **Enhanced StatCards with sparklines** — 4 cards now show a computed delta vs the previous period and a mini line-chart sparkline of the last 14 data points.
4. **Project status donut** — Replaces the `ProjectStatusChart` pill list. Click a slice to deep-link to `/projects?status=active` (filtered list).
5. **Documents timeline** — Bar chart: documents uploaded per day for the selected range. Highlights today.
6. **Inventory by location donut** — Inventory value (qty × cost) split by warehouse / job_site / in_transit.
7. **Project timeline list** — Active projects only, each with a horizontal progress bar (days elapsed / total days) and a "X% complete" badge.
8. **Personalized greeting** — "Good morning, {firstName}" at the top, with last-login time if available.
9. **Insights row** (low effort) — A small "Did you know" or "Heads up" banner that surfaces an actionable insight (e.g. "3 items are below 50 units — restock soon").

## File changes

```
frontend/components/dashboard/
  sparkline.tsx                   NEW  – tiny SVG line chart primitive
  time-range-selector.tsx         NEW  – pill group, controlled component
  stats-cards.tsx                 MOD  – sparklines + computed trend deltas
  project-status-chart.tsx        DEL  – replaced by donut
  project-status-donut.tsx        NEW  – recharts donut, click → /projects?status=
  documents-timeline.tsx          NEW  – recharts bar chart by day
  inventory-by-location.tsx       NEW  – recharts donut
  project-timeline-list.tsx       NEW  – active projects + horizontal progress
  insight-banner.tsx              NEW  – actionable suggestion card
  recent-activity.tsx             MOD  – same shape, nicer empty state + clickable rows
  greeting.tsx                    NEW  – "Good morning, {name}"

frontend/hooks/
  useDashboardData.ts             NEW  – one hook that returns projects / documents / inventory scoped to a date range
  useProjects.ts                  MOD  – accept createdAfter
  useDocuments.ts                 MOD  – accept uploadedAfter
  useInventory.ts                 MOD  – accept lastUpdatedAfter

frontend/app/(dashboard)/dashboard/
  page.tsx                        MOD  – wire time-range selector + new layout
  filters.tsx                     NEW  – tiny helper to read ?status= from URL on /projects

frontend/components/ui/
  stat-card.tsx                   MOD  – accept an optional sparkline element

frontend/app/(marketing)/features/
  page.tsx                        MOD  – add "Insights" feature row highlighting the dashboard

frontend/package.json             MOD  – add "recharts": "^2.12.7"
```

## Data flow

1. User picks a range (`7d / 30d / all`). Stored in a `TimeRangeProvider` context (or just lifted state in the dashboard page — keeps it simple).
2. `useDashboardData(range)` issues three SWR calls with the appropriate filter (`created >= X`, `uploaded_at >= X`, `last_updated >= X`). PB indexes already exist on these date fields from the original migrations.
3. Each analytics card receives pre-computed data via props. Cards are pure presentational components.

## Visual goals

- Use the existing design tokens (`gcpallet-primary`, semantic colors).
- Light + dark parity (no hard-coded hex).
- Charts use the `chart-*` CSS variables that Recharts picks up via `stroke="hsl(var(--chart-1))"` style — same approach shadcn uses.
- Mobile: stack to single column under `md:`, charts shrink to `100% w` with a fixed height.
- Skeleton states (using existing `CardSkeleton`) for each card while loading.

## Verification

- [ ] `npm run build` succeeds — build output should show `/dashboard` First Load JS up by ~30 kB (Recharts is the cost).
- [ ] `tsc --noEmit` clean.
- [ ] Update `backend/scripts/ui-e2e.py` Stage 1 (or add a new mini-stage) to:
  - check that the dashboard renders 4 stat cards,
  - check that the project status donut renders with ≥ 1 project (after User A creates Riverside Tower),
  - check that the documents timeline renders at least one bar,
  - check that the inventory-by-location donut renders,
  - check the time-range selector changes the document count when toggled.
- [ ] Re-run `frontend-routes.mjs` and `ui-e2e.py` — target **60+ pass / 0 fail**.
- [ ] Capture dashboard screenshots at 1280×900 and 1440×900 (light + dark) to `/tmp/gcpallet-dashboard/`.

## Out of scope (deferred)

- Export dashboard as PDF report.
- Customisable widget arrangement.
- Email digest of these stats.
