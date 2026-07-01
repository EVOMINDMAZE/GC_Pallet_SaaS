# Verification Checklist

## Stat cards are clickable
- [x] "Active Projects" stat card → links to `/projects?status=active`
- [x] "Documents" stat card → links to `/documents?range=<current range>`
- [x] "Inventory Items" stat card → links to `/inventory`
- [x] "Total Budget" stat card → links to `/projects`
- [x] Each card has a visible click affordance (ring on hover, or pointer cursor)

## Documents timeline
- [x] Card / bars are clickable → `/documents?range=<days>`
- [x] X-axis labels are legible at 7-day, 14-day, and 30-day windows
- [x] At 375 px width, no two labels overlap (no `Jun 17Jun 18…`)

## Inventory by location
- [x] Pie slice is clickable → `/inventory?location=<loc>` where `<loc>` is the clicked slice
- [x] Legend rows are clickable → `/inventory?location=<loc>` where `<loc>` is the row
- [x] Tooltip renders without overlapping the `$9,769 / TOTAL VALUE` center label

## Project status donut
- [x] Slices still clickable (existing behavior) → `/projects?status=<status>`
- [x] Tooltip renders without overlapping the center `N / TOTAL` label

## Project timeline list
- [x] Clicking anywhere in a row navigates to `/projects/<id>` (not just on the project name)
- [x] No nested `<a>` tags (only one anchor per row)

## Recent activity
- [x] Projects card → `/projects`
- [x] Inventory items card → `/inventory`
- [x] Latest project card → `/projects/<id>` (or `/projects` if no projects)
- [x] Shares card → `/projects`
- [x] No nested `<a>` tags in any card

## Query-param wiring
- [x] `/projects?status=active` shows only active projects on first render
- [x] `/documents?range=7d` shows only the last 7 days on first render
- [x] `/inventory?location=warehouse` shows only warehouse items on first render
- [x] Invalid / unknown values do not crash the page (treated as "all")

## Build / typecheck
- [x] `cd /workspace/frontend && pnpm typecheck` passes
- [x] `pnpm build` passes and emits all 19 routes

## Deploy
- [x] Commit + push to `EVOMINDMAZE/GC_Pallet_SaaS` `main`
- [ ] Vercel auto-deploy passes (READY state)
- [ ] Live URL reflects the fix
