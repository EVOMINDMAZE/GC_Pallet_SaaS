# Checklist — E2E Harden & Cleanup

Verification checkpoints. Each must be checkable by reading code, running a script, or inspecting a build log.

## Hydration Sweep

- [x] Every `frontend/components/**/*.tsx` file that reads `localStorage`, `sessionStorage`, `Date.now()`, `Math.random()`, or `pb.authStore.*` in render gates the browser-dependent output behind a `mounted` flag.
  - Audited via `grep -n`; only the following had risky reads in render, all now fixed:
    - `components/dashboard/greeting.tsx` — `new Date().getHours()` + `user` → guarded with `mounted`.
    - `components/layout/user-menu.tsx` — `user` in trigger label + dropdown label → guarded with `mounted`.
    - `components/settings/profile-form.tsx` — `useState(user?.name ?? "")` initializers → moved to `useEffect`.
  - `components/projects/shares-list.tsx`, `components/dashboard/project-timeline-list.tsx` use `Date.now()` only inside functions called when SWR data is available (client-only) — no render-time risk.
  - `components/theme/theme-provider.tsx` reads `localStorage` inside `useEffect` callbacks only — no render-time risk.
- [x] Every `frontend/app/**/page.tsx` that does the same is gated the same way.
  - `app/(marketing)/page.tsx` reads `pb.authStore.model` inside `useEffect` only — no render-time risk.
  - `app/share/[token]/shared-view.tsx` uses `Date.now()` only inside `ExpiryFooter` after SWR data is loaded — no render-time risk.
- [x] `pnpm build` + `pnpm start` + navigating to `/dashboard`, `/projects`, `/inventory`, `/documents`, `/login`, `/register` produces zero React #418 / #423 errors in the browser console.
  - Verified by Playwright `pageerror` listener across all auth-gated pages: 0 errors.

## Debug-Residue Cleanup

- [x] `frontend/app/api/shares/[token]/route.ts` contains no `console.log`, no `console.debug`, no commented-out debug code.
- [x] `frontend/app/api/shares/` tree has no `TODO`, `FIXME`, or `debugger` statements.
- [x] All imports in the share route are used; no dead imports remain.
  - `grep -n 'console\.(log|debug|warn|error)|TODO|FIXME|debugger' frontend/app/api/shares/` → no matches.
  - `getAdminPocketBase` is used on line 28; import retained.

## Backend Test Suite

- [x] Every `backend/scripts/test_*.py` script has been executed against the current stack.
  - **Note:** No `test_*.py` files exist in `backend/scripts/`. The closest equivalents that are actively maintained are:
    - `backend/scripts/e2e.mjs` — PB-level headless E2E (auth, CRUD, documents, cross-user isolation).
    - `backend/scripts/frontend-routes.mjs` — Next.js route checker (compile + serve + content smoke test).
  - Both were executed; results below.
- [x] Each script exits with code 0, OR a follow-up subtask in `tasks.md` documents the failure.
  - `e2e.mjs`: exit 0, **24 / 24 passed** (PB healthy; register/login; project CRUD; inventory CRUD; document upload + serve; cross-user isolation).
  - `frontend-routes.mjs`: exit 0, **15 / 15 passed** (all public + auth-gated routes serve 200 with expected SSR marker).
- [x] The pass count for each script is recorded as evidence in this checklist (or a sibling log file).
  - Recorded above.

## UI E2E Re-verification

- [x] `pnpm build` succeeds with no type errors.
- [x] `pnpm start` serves `200` on `/` within 8 s of cold start.
- [x] `backend/scripts/ui-e2e.py` reports `90 passed, 0 failed (90 total)`.
  - 3 consecutive runs: `90 passed, 0 failed` × 3. Stable.

## Cache-Bypass Documentation

- [x] `frontend/app/api/shares/[token]/route.ts` contains a multi-line comment above the direct `fetch(..., { cache: "no-store" })` call that names the symptom (stale `revoked` flag), the workaround (bypass the JS SDK), and the revisit criterion.
  - Comment spans 13 lines (L31–L43) covering: (a) symptom — SDK's `getFirstListItem` returned a stale `revoked` flag; (b) workaround — direct `fetch` with `cache: "no-store"`; (c) revisit criteria — explicit no-cache option in PB SDK, or per-request admin client with confirmed per-instance cache.
