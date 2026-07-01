# Dashboard widgets — clickable insights + chart overlap fixes

## Why
Two cosmetic + UX gaps on `/dashboard`:

1. **Most insight widgets are not clickable.** Only the project-status donut's slices and the active-project timeline rows are interactive. The other widgets (StatCards, DocumentsTimeline, InventoryByLocation, RecentActivity cards) are read-only — the user has to navigate to the right page from the top nav to act on what the widget is telling them. The user's mental model: "if this card is showing me a fact about my data, clicking it should take me there."
2. **Two chart layout bugs:**
   - **DocumentsTimeline X-axis labels run together** (`Jun 17Jun 18Jun 19…`) when the chart is narrow (e.g. on a 2-col grid in `lg:`) and the range is `7d` or `14d`. The `XAxis interval={0}` setting tells recharts to draw every tick, and at 14 ticks across ~400 px there is not enough horizontal room.
   - **InventoryByLocation tooltip overlaps the center label** (`$9,769 / TOTAL VALUE`). The recharts default tooltip renders near the cursor, but the donut's inner overlay sits at chart center, so the two fight for the same pixel.

## What Changes
- Every dashboard widget becomes a navigation surface: clicking a widget (or the meaningful element inside it) routes to the page that owns the data.
- Chart X-axis labels are spaced properly, and the donut tooltip is offset off the center label.

## Impact
- **Affected code:**
  - [frontend/app/(dashboard)/dashboard/page.tsx](file:///workspace/frontend/app/(dashboard)/dashboard/page.tsx) — no structural change; widgets get interactive prop wiring.
  - [frontend/components/dashboard/stats-cards.tsx](file:///workspace/frontend/components/dashboard/stats-cards.tsx) — wrap each `StatCard` in a `<Link>` to the right page.
  - [frontend/components/dashboard/documents-timeline.tsx](file:///workspace/frontend/components/dashboard/documents-timeline.tsx) — fix X-axis label interval; add clickable card wrap that links to `/documents?range=Nd`.
  - [frontend/components/dashboard/inventory-by-location.tsx](file:///workspace/frontend/components/dashboard/inventory-by-location.tsx) — offset the tooltip, make pie slices + legend rows clickable.
  - [frontend/components/dashboard/project-status-donut.tsx](file:///workspace/frontend/components/dashboard/project-status-donut.tsx) — already clickable; the fix here is making the center label co-exist with the tooltip (same `wrapperStyle` / `offset` pattern as InventoryByLocation).
  - [frontend/components/dashboard/project-timeline-list.tsx](file:///workspace/frontend/components/dashboard/project-timeline-list.tsx) — make each row a single `<Link>` so clicking anywhere in the row navigates, not just on the project name.
  - [frontend/components/dashboard/recent-activity.tsx](file:///workspace/frontend/components/dashboard/recent-activity.tsx) — make the four cards link to the relevant list.
  - [frontend/app/(dashboard)/projects/page.tsx](file:///workspace/frontend/app/(dashboard)/projects/page.tsx), [frontend/app/(dashboard)/documents/page.tsx](file:///workspace/frontend/app/(dashboard)/documents/page.tsx), [frontend/app/(dashboard)/inventory/page.tsx](file:///workspace/frontend/app/(dashboard)/inventory/page.tsx) — read the new `?status=`, `?range=`, `?location=` query params and pre-apply the filter.

## ADDED Requirements

### Requirement: Every dashboard widget is clickable
The system SHALL make every primary dashboard widget a navigation surface, so a user can act on what the widget is showing without having to find the right page in the top nav.

#### Scenario: Click "Active Projects" stat card
- **WHEN** the user clicks the "Active Projects" stat card on `/dashboard`,
- **THEN** they land on `/projects?status=active` and only projects with status `active` are shown.

#### Scenario: Click "Documents" stat card
- **WHEN** the user clicks the "Documents" stat card,
- **THEN** they land on `/documents` (or `/documents?range=<current range>`).

#### Scenario: Click "Inventory Items" stat card
- **WHEN** the user clicks the "Inventory Items" stat card,
- **THEN** they land on `/inventory`.

#### Scenario: Click "Total Budget" stat card
- **WHEN** the user clicks the "Total Budget" stat card,
- **THEN** they land on `/projects` (where the budget breakdown lives).

#### Scenario: Click a "Uploads per day" bar or the card
- **WHEN** the user clicks any bar (or the card chrome) of the documents timeline,
- **THEN** they land on `/documents?range=<days>` (e.g. `?range=7d` for the 7-day view).

#### Scenario: Click a slice of the "Inventory by location" donut
- **WHEN** the user clicks a slice (or a legend row),
- **THEN** they land on `/inventory?location=<loc>` and the location filter is pre-applied.

#### Scenario: Click a row in "Active project timelines"
- **WHEN** the user clicks anywhere in the row (not just the project name),
- **THEN** they land on `/projects/<id>`.

#### Scenario: Click a "Recent activity" card
- **WHEN** the user clicks any of the four recent-activity cards (Projects, Inventory items, Latest project, Shares),
- **THEN** they land on the relevant page: `/projects`, `/inventory`, `/projects/<id>`, or the project's Shares tab.

### Requirement: Documents-timeline X-axis labels don't overlap
The system SHALL render the "Uploads per day" chart's X-axis labels without overlap, regardless of the chosen range (`7d` / `14d` / `30d`).

#### Scenario: 7-day view at narrow width
- **WHEN** the chart is rendered at ~400 px width with 7 daily ticks,
- **THEN** each tick is legible, with no two labels touching.

#### Scenario: 14-day view
- **WHEN** the chart is rendered at ~400 px width with 14 daily ticks,
- **THEN** the X-axis shows every other day (e.g. `Jun 17`, `Jun 19`, `Jun 21` …) so labels never run into each other.

#### Scenario: 30-day view
- **WHEN** the chart is rendered with 30 daily ticks,
- **THEN** the X-axis shows ~5–6 evenly-spaced labels across the width.

### Requirement: Inventory-by-location tooltip does not collide with the center label
The system SHALL render the donut chart's hover tooltip so it does not visually overlap the `$9,769 / TOTAL VALUE` center label.

#### Scenario: Hover a slice near the center
- **WHEN** the user hovers any slice of the inventory donut,
- **THEN** the tooltip appears in a non-center area (offset above/below, or rendered as a card to the side), and the center label remains fully visible.

#### Scenario: Hover a slice near the right edge
- **WHEN** the slice is small and the cursor is near the right edge of the chart,
- **THEN** the tooltip still renders inside the chart card (does not get clipped at the card boundary) and does not collide with the center label.

## MODIFIED Requirements

### Requirement: `/projects?status=<x>` pre-filters the list
**Was:** the projects page renders all projects.
**Now:** if the URL has `?status=<x>`, the list filters by that status and the corresponding filter chip is pre-selected in the filter bar.

### Requirement: `/documents?range=<x>` pre-filters the list
**Was:** documents page always shows the full list.
**Now:** `?range=7d|30d|all` pre-selects the time-range filter and the list filters by upload date.

### Requirement: `/inventory?location=<x>` pre-filters the list
**Was:** inventory page always shows the full list.
**Now:** `?location=warehouse|job_site|in_transit` pre-selects the location filter.

## REMOVED Requirements
None.

## Out of scope
- Adding deep links from the donut center label to a project list (the slice + legend clicks are enough).
- Adding keyboard navigation across the cards.
- Routing from the insight-banner — the banner already has its own CTA link in the existing implementation.
- Changing the color palette or the chart library.
