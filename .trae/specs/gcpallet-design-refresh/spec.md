# GC Pallet Design System Refresh — Spec

## Why
The current GC Pallet UI is functional but generic (vanilla shadcn defaults). The approved design system unifies the brand around "GC Pallet Operations Hub" with a warmer, construction-adjacent voice, clearer status semantics, and a field-ready UI kit. Implementing this brings the live app from "default admin template" to "trusted contractor tool", which is the positioning we committed to in the original product brief.

## What Changes
- **Refresh Tailwind theme + CSS variables** to match the approved design tokens (primary orange, soft accent, neutral palette, semantic success/warning/info/destructive).
- **Extend typography scale** to include Display 56, three heading levels, body/strong, and a label/metadata style. Bind via `tailwind.config.ts`.
- **Update brand chrome**: wordmark "GC PALLET Operations Hub", clipboard-grid mark, sidebar with active/hover/keyboard-focus states, breadcrumb-style top bar with brand-approved chip and user pill.
- **Restyle primitives**: Button (primary orange CTA, outline, ghost, destructive), Badge (six semantic variants incl. Procurement), Card (radius lg, soft shadow), Input/Select with strong focus ring.
- **Build new components**:
  - `StatCard` with icon, label, large value, change-indicator pill, helper caption.
  - `StatusBadge` mapping project status (`planning`/`active`/`completed`/`on_hold`/`draft`/`procurement`) to the six visual variants.
  - `DataTable` (or styled `<table>`) for compact operational rows with owner/status columns.
  - `EmptyState` and `ErrorState` shells using icon + one line of copy + one CTA.
  - `Skeleton` rows for loading.
  - `Toast` variants: success / warning / destructive.
- **Apply across pages**: Dashboard (4 stat cards + Project Status pills + Recent rows), Projects (cards + new project form), Inventory (table with sticky header + total footer), Documents (table + upload modal), Project detail (2-col with embedded Documents + Inventory tables), Login/Register (centered cards).

Non-breaking visual refresh of every page; no schema, SDK, or route changes.

## Impact
- Affected specs: design system, dashboard, projects, inventory, documents, auth.
- Affected code:
  - [tailwind.config.ts](file:///workspace/frontend/tailwind.config.ts) — token map + typography + radius + shadow.
  - [frontend/app/globals.css](file:///workspace/frontend/app/globals.css) — CSS variables and base typography.
  - [frontend/components/ui/*](file:///workspace/frontend/components/ui/) — Button, Card, Badge, Input, Select, Toast (restyle + variants).
  - [frontend/components/layout/sidebar.tsx](file:///workspace/frontend/components/layout/sidebar.tsx), [frontend/components/layout/topbar.tsx](file:///workspace/frontend/components/layout/topbar.tsx), [frontend/components/layout/dashboard-gate.tsx](file:///workspace/frontend/components/layout/dashboard-gate.tsx).
  - New: `frontend/components/ui/stat-card.tsx`, `frontend/components/ui/status-badge.tsx`, `frontend/components/ui/data-table.tsx`, `frontend/components/ui/empty-state.tsx`, `frontend/components/ui/skeleton.tsx`, `frontend/components/ui/toast.tsx`.
  - All page files under [frontend/app/(dashboard)](file:///workspace/frontend/app/(dashboard)) and [frontend/app/(auth)](file:///workspace/frontend/app/(auth)).

## ADDED Requirements

### Requirement: Design Tokens
The system SHALL expose the full approved token set via Tailwind config + CSS variables.

#### Scenario: All color values resolve from tokens
- **WHEN** any component references a color
- **THEN** the value SHALL resolve through one of: `--gcpallet-primary`, `--gcpallet-accent`, `--gcpallet-secondary`, `--gcpallet-muted`, `--gcpallet-card`, `--gcpallet-info-soft`, `--gcpallet-success`, `--gcpallet-warning`, `--gcpallet-info`, `--gcpallet-destructive`.

#### Scenario: Semantic statuses map to UI variants
- **WHEN** a component renders a status (`planning`, `active`, `completed`, `on_hold`, `draft`, `procurement`)
- **THEN** the rendered badge variant SHALL be one of: warning, info, success, destructive, secondary, primary respectively.

### Requirement: Typography Scale
The system SHALL expose display / heading / body / label typography utilities, Inter as the primary font, tabular numerals in tables and stat values.

#### Scenario: Page titles use H1
- **WHEN** a page renders its primary heading ("Dashboard", "Projects", "Inventory", "Documents")
- **THEN** the heading SHALL use the `text-h1` token at 28–32px, weight 700.

### Requirement: Brand Chrome
The shell SHALL render the new wordmark "GC PALLET Operations Hub" with a grid mark, a 240px sidebar with active/hover/focus states, and a top bar with breadcrumb, "Brand approved" chip, and account pill.

#### Scenario: Sidebar active state matches design
- **WHEN** a user is on /documents
- **THEN** the Documents sidebar row SHALL use the orange fill + white text + icon; inactive rows SHALL use hover-only background and a visible orange focus ring on keyboard navigation.

### Requirement: Stat Cards
`StatCard` SHALL render an icon, label, large value, optional trend pill, and helper caption. The Dashboard SHALL use four of these in a 4-col responsive grid.

### Requirement: Compact Data Tables
Tables SHALL use horizontal row dividers, comfortable cell padding, right-aligned numerics, and inline status badges.

### Requirement: Empty / Error States
Empty states SHALL be centered with an icon, one short message, and one CTA. Error states SHALL name the issue, preserve context, and offer a recovery action.

### Requirement: Toasts with Semantic Variants
The toast system SHALL support `default`, `success`, `warning`, `info`, `destructive` variants, all bottom-right stacked, 4s auto-dismiss.

### Requirement: Loading Skeletons
Lists and stat cards SHALL render shimmering placeholders shaped like the eventual content while data loads.

## MODIFIED Requirements

### Requirement: Existing — Sidebar
- Previous: 60px collapsed sidebar using pure shadcn primitives, no focus-visible ring.
- Updated: 240px persistent sidebar with the new wordmark, active row in orange, hover background, orange 2px focus-visible ring on keyboard navigation.

### Requirement: Existing — Dashboard
- Previous: four unshaded stats, plain badges, simple table-ish recent lists.
- Updated: four `StatCard`s with icons + trend + caption; Project Status pills with big counts; Recent Projects and Recent Documents as full `DataTable`s.

### Requirement: Existing — Toaster
- Previous: one variant (default + destructive).
- Updated: six variants including success / warning / info, each with semantic color, icon, title, and optional description.

## REMOVED Requirements

### Requirement: Old — generic shadcn defaults
**Reason**: replaced wholesale by the new design system; no migration path needed because all consumers (Button, Card, Badge, Input, Toast) are in-app and will be updated together.
**Migration**: n/a — visual refresh only.
