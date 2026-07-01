# Dashboard Stat Cards — Design Polish Spec

## Why
After the design-system refresh and the "make insights clickable" pass, the four dashboard stat cards (`StatsCards`) ship with three visible defects that hurt the brand:

1. **Sparklines bleed past the card boundary.** The orange `Active Projects` line starts inside its card and continues out across the gap into the `Documents` card. The blue `Inventory Items` line pokes up *out of the top* of its card. The user sees lines that don't belong to the card they're reading. The root cause is `Sparkline`'s `<svg className="overflow-visible">` (lets the end-dot draw past bounds) plus the fact that the card's flex row doesn't constrain the sparkline's width, so the SVG can stretch and render its line beyond the card's right edge.
2. **Stat-card labels wrap inconsistently.** "ACTIVE PROJECTS" and "INVENTORY ITEMS" wrap to two lines while "DOCUMENTS" and "TOTAL BUDGET" stay on one. The card heights are equal (grid stretches) but the wrapping is unsightly. Cause: the label span has no `whitespace-nowrap`, so the long labels wrap when the icon + gap + label + sparkline row gets tight.
3. **The trend pill always reads `+100%` (or `—`).** `pctDelta(curr, 0)` short-circuits to `+100%` whenever there is no prior period. With only one period being shown (the current dashboard's `30d` window), there is never a "previous period" to compare against, so every card prints a misleading `+100%`. The pill is doing more harm than good here — it looks like a metric, but it isn't.

## What Changes
- **Sparkline** component is rewritten to (a) respect its own bounding box (`overflow: hidden` instead of `overflow: visible`), (b) clamp the end-dot inside the chart, (c) be rendered inside a `flex-none` wrapper that does not grow. The path is also clipped via `clipPath` so even an aggressive line geometry cannot escape the card.
- **`StatCard`** adds `whitespace-nowrap` to the label, gives the icon+label group a `min-w-0 flex-1` so the sparkline keeps a fixed slot, and the aside slot is wrapped in a `flex-none` flexbox with a fixed width equal to the sparkline's natural size.
- **Trend pill is removed from the stat cards.** A pill that always says `+100%` is worse than no pill. We re-purpose the freed horizontal space (or just give the value more room) and keep the `trend` prop on `StatCard` for future use (e.g. when we have multi-period data).
- **Sparkline stroke colors** are kept as the existing palette (`primary` / `info` / `success`) but the stroke width is slightly reduced (1.5 → 1.25) so the line feels less "hairy" at small sizes, and the end-dot radius is reduced (2.5 → 2).

## Impact
- **Affected specs:** dashboard, design-system (stat-card primitive).
- **Affected code:**
  - [frontend/components/dashboard/sparkline.tsx](file:///workspace/frontend/components/dashboard/sparkline.tsx) — add clipPath, remove `overflow-visible`, reduce stroke + dot radius, add a fixed-aspect wrapper.
  - [frontend/components/ui/stat-card.tsx](file:///workspace/frontend/components/ui/stat-card.tsx) — `whitespace-nowrap` on the label; constrain the icon+label group with `min-w-0 flex-1`; wrap the aside in a fixed-width `flex-none` container; trend pill stays in the component API for future use but is not rendered.
  - [frontend/components/dashboard/stats-cards.tsx](file:///workspace/frontend/components/dashboard/stats-cards.tsx) — stop passing `trend` to each `StatCard`.
  - No other consumer of `Sparkline` or `StatCard` to update (verified by grep).

## ADDED Requirements

### Requirement: Sparklines stay inside their card
The system SHALL render the `Sparkline` component so that the visible line, area fill, and end-dot are all fully contained within the card's content box; no element of the sparkline may overflow the card's right or top edges.

#### Scenario: Sparkline at narrow card width
- **WHEN** the dashboard renders the four stat cards in a 4-column grid at 1280px (each card ~ 290px wide),
- **THEN** every sparkline's line, area, and dot are fully contained within the parent card's border.

#### Scenario: Sparkline at 2-column grid
- **WHEN** the dashboard renders the cards in a 2-column grid at 640px (each card ~ 300px wide),
- **THEN** the same containment rule holds — no line bleeds into the neighbor card.

#### Scenario: Sparkline at single-column
- **WHEN** the dashboard renders one stat card per row at 375px,
- **THEN** the sparkline is still contained in the card and the line is not cropped at the bottom.

### Requirement: Stat-card labels never wrap
The system SHALL render every `StatCard` label on a single line. "ACTIVE PROJECTS", "DOCUMENTS", "INVENTORY ITEMS", and "TOTAL BUDGET" all render on one line each, regardless of the card's actual width.

#### Scenario: Label at 290px card width
- **WHEN** the dashboard renders the stat cards in a 4-column grid at 1280px,
- **THEN** every label fits on one line — no `ACTIVE\nPROJECTS` wrap.

#### Scenario: Label at 200px card width
- **WHEN** the card is rendered at its narrowest realistic width (~ 200px),
- **THEN** the label still does not wrap (it may truncate with `text-ellipsis` instead, but never break the line).

### Requirement: Stat cards do not display a misleading trend pill
The system SHALL NOT render the trend pill on the four dashboard stat cards while there is no prior-period data to compare against.

#### Scenario: Default render
- **WHEN** the dashboard renders the stat cards,
- **THEN** no green/yellow pill with `+100%` is shown.

## MODIFIED Requirements

### Requirement: Existing — `StatCard` API
**Was:** `StatCard` accepts an optional `trend` prop (`{ label, variant }`) and renders it as a pill on the right of the value.
**Now:** the `trend` prop is still accepted (so the component stays reusable), but the four dashboard stat cards pass no `trend`. Internal layout: the icon+label group has `min-w-0 flex-1`, the `aside` slot is in a `flex-none w-24` container, and the label has `whitespace-nowrap truncate`.

### Requirement: Existing — `Sparkline`
**Was:** `<svg className="overflow-visible" ...>` with strokeWidth 1.75, end-dot r=2.5, no clip path. The SVG could draw past its bounding box.
**Now:** `<svg overflow="hidden" ...>` with a `<clipPath>` that matches the viewBox, strokeWidth 1.25, end-dot r=2, and a wrapping `<div className="h-7 w-24 flex-none">` that fixes the rendered size. The line cannot escape.

## REMOVED Requirements
None. The `trend` prop is kept on `StatCard` for future use; the visual change is only at the dashboard call sites.

## Out of scope
- Changing the `pctDelta` helper or wiring a real previous-period comparison (needs server-side aggregation).
- Restyling the trend pill itself.
- Changing the card padding, border-radius, or shadow.
- Changing any other consumer of `Sparkline` / `StatCard` (there are none besides the dashboard, but we will grep to confirm).
