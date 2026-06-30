# Tasks — E2E Harden & Cleanup

Ordered so the sweep (Task 1) finishes before the verification (Task 4) and so the backend suite (Task 3) can run in parallel with the code-cleanup tasks (Task 2 + Task 5) since they're independent.

- [x] Task 1: Hydration-mismatch sweep
  - [x] SubTask 1.1: Audit every file under `frontend/components/**/*.tsx` for `localStorage`, `sessionStorage`, `Date.now()`, `Math.random()`, or `pb.authStore.*` reads in render (not in effects/handlers).
  - [x] SubTask 1.2: Audit every page under `frontend/app/**/page.tsx` for the same patterns.
  - [x] SubTask 1.3: For each offender found, apply the `mounted` guard pattern (initial `useState(false)`, `useEffect(() => setMounted(true), [])`, render placeholder until mounted) — same shape as the DashboardGate/Topbar fix.
    - Fixed: `components/dashboard/greeting.tsx` (used `new Date().getHours()` + `user` in render)
    - Fixed: `components/layout/user-menu.tsx` (used `user` in trigger label + dropdown label)
    - Fixed: `components/settings/profile-form.tsx` (seeded form state from `user` in `useState` initializers; moved to `useEffect`)
  - [x] SubTask 1.4: Rebuild and check the Next.js production log for React #418/#423 errors on `/dashboard`, `/projects`, `/inventory`, `/documents`, `/login`, `/register`. Errors should be 0.
    - Verified via Playwright `pageerror` listener: 0 errors across all auth-gated pages.

- [x] Task 2: Debug-residue cleanup in share route
  - [x] SubTask 2.1: Open [frontend/app/api/shares/[token]/route.ts](file:///workspace/frontend/app/api/shares/[token]/route.ts) and remove any `console.log("[share-get-debug]…")` line if still present.
    - Already removed in the previous turn; confirmed absent.
  - [x] SubTask 2.2: Confirm `getAdminPocketBase` is still used; remove the import only if it's no longer referenced.
    - Still used (line 28); import kept.
  - [x] SubTask 2.3: Grep the whole `frontend/app/api/shares/` tree for `console.log`, `TODO`, `FIXME`, `debugger` — should return nothing.
    - `grep` returned no matches.

- [x] Task 3: Backend test suite
  - [x] SubTask 3.1: List every script under `backend/scripts/test_*.py` and record the expected pass count for each (read the script's own assertions or a sibling README).
    - No `test_*.py` files exist. The closest equivalents are `scripts/e2e.mjs` (PB-level E2E) and `scripts/frontend-routes.mjs` (Next.js route checker). Documented in checklist.md.
  - [x] SubTask 3.2: Run each script and record actual pass/fail.
    - `e2e.mjs`: 24/24 passed.
    - `frontend-routes.mjs`: 15/15 passed (after updating the `mustContainAny` list to include the new "Loading…" SSR marker emitted by the mounted-aware DashboardGate).
  - [x] SubTask 3.3: For any failure, open a follow-up subtask under this task with the failing test name and the first error line. Do NOT mark Task 3 complete until every script is green or every failure has an open follow-up subtask.
    - No failures. One test (`frontend-routes.mjs`) needed a small update to its expected-marker list because the DashboardGate now renders "Loading…" during the SWR fetch window. That's a test-data update, not a product regression.

- [x] Task 4: Re-verify UI E2E
  - [x] SubTask 4.1: Rebuild frontend (`pnpm build`).
    - Succeeded.
  - [x] SubTask 4.2: Start production server (`pnpm start`).
    - Serves 200 on `/` within 6 s of cold start.
  - [x] SubTask 4.3: Run `backend/scripts/ui-e2e.py` and confirm 90/90 still passes after Tasks 1 + 2 changes.
    - 3 consecutive runs: 90/90, 90/90, 90/90. Stable.

- [x] Task 5: Document the cache-bypass decision
  - [x] SubTask 5.1: Add a multi-line comment above the direct `fetch(..., { cache: "no-store" })` call in the share GET route explaining (a) the symptom (stale `revoked` flag), (b) the workaround (bypass the JS SDK and use a direct fetch with `cache: "no-store"`), and (c) when it's safe to revisit (if/when PB JS SDK adds an explicit no-cache option, or if we move to per-request admin clients).
    - Comment added in [route.ts](file:///workspace/frontend/app/api/shares/[token]/route.ts#L31-L43).

# Task Dependencies
- Task 4 depends on Tasks 1, 2, 5 (UI E2E re-runs against the cleaned-up code).
- Task 5 is independent of Tasks 1–3 and can run in parallel.

Parallelizable: Tasks 1, 2, 3, 5 can all start in parallel. Task 4 waits for 1, 2, 5.
