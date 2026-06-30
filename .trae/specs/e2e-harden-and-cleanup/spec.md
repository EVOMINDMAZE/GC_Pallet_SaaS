# E2E Harden & Cleanup — Spec

## Why
The Playwright UI suite was just stabilized (90/90 passing in both dev and production), but the stability came from three independent fixes whose rationale isn't documented and whose scope is incomplete. Hydration mismatches still exist in other localStorage-backed client components (`theme-toggle`, `user-menu`), debug residue from the investigation may still be present in the share route, the backend test suite hasn't been re-run against the share-link + cache-bypass changes, and future contributors will likely re-introduce the SDK-cache regression unless the reasoning is recorded.

## What Changes
- Sweep all client components for hydration-mismatch risks (localStorage read in render, `Date.now()`/`Math.random()` in render, conditional render based on auth/theme state) and apply the same `mounted` guard pattern used in DashboardGate/Topbar where needed.
- Verify and remove any debug `console.log` / unused imports left over from the share-cache investigation.
- Re-run the backend `test_*.py` suite end-to-end and confirm no regressions from the share-link or auth changes.
- Add a short code comment on the share GET route explaining why it bypasses the PocketBase JS SDK with a direct `cache: "no-store"` fetch, so the workaround is not "fixed" back later.

## Impact
- Affected specs: auth gate, share-link API, theme toggle, user menu, backend test suite.
- Affected code:
  - [frontend/components/theme/theme-toggle.tsx](file:///workspace/frontend/components/theme/theme-toggle.tsx)
  - [frontend/components/layout/user-menu.tsx](file:///workspace/frontend/components/layout/user-menu.tsx)
  - [frontend/app/api/shares/[token]/route.ts](file:///workspace/frontend/app/api/shares/[token]/route.ts)
  - Backend `scripts/test_*.py` (run only, no code changes unless a failure is found).
  - Any other client component found by the sweep to read localStorage or non-deterministic values in render.

## ADDED Requirements

### Requirement: Hydration-Safe Client Components
The system SHALL NOT render HTML that differs between the server (no browser context) and the first client paint. Any client component that reads `localStorage`, `sessionStorage`, `Date.now()`, `Math.random()`, or auth/theme state in its render path SHALL gate the browser-dependent output behind a `mounted` flag and render a neutral placeholder on the first paint.

#### Scenario: theme-toggle hydration
- **WHEN** `/dashboard` is requested by a logged-in user
- **THEN** the server-rendered HTML for the theme toggle SHALL match the client's first paint exactly (no React error #418/#423 in production).

#### Scenario: user-menu hydration
- **WHEN** the dashboard layout renders
- **THEN** the user-menu button label and any avatar/initials SHALL match between server and first client paint.

### Requirement: No Debug Residue
The share API route and any other code touched during the recent cache-bypass investigation SHALL NOT contain `console.log` debug statements, unused imports, or commented-out debugging code.

#### Scenario: no stray logs
- **WHEN** a revoked share link is requested via `/api/shares/<token>`
- **THEN** the server log SHALL contain only the normal Next.js request log, no debug output from the route handler.

### Requirement: Backend Test Suite Green
All `backend/scripts/test_*.py` scripts SHALL pass against the current state of the database and frontend API.

#### Scenario: full suite
- **WHEN** the backend suite is executed end-to-end
- **THEN** every test script SHALL exit with code 0 and the documented expected counts.

### Requirement: Cache-Bypass Documentation
The `GET /api/shares/[token]` route SHALL contain a code comment explaining that the JS SDK's `getFirstListItem` is bypassed in favor of a direct `cache: "no-store"` fetch because the admin SDK returns a stale `revoked` flag on subsequent calls within the same process.

#### Scenario: comment present
- **WHEN** a contributor reads the share GET route
- **THEN** they SHALL find a comment above the fetch call naming the symptom ("stale `revoked` flag") and the rationale ("bypass JS SDK to avoid in-process cache").

## MODIFIED Requirements
None — this spec adds hardening and documentation without changing product behavior.

## REMOVED Requirements
None.
