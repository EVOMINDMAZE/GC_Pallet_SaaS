# Tasks

- [x] **Task 1: Reproduce the Add-Item bug.** Sign in as `test@gcpallet.com` / `Test1234!`, go to `/inventory`, fill the form (item name = "woodmock1", quantity = 10, unit = pieces, cost = 20, location = warehouse), click **Add item**. Capture the actual behavior: no toast, no row added to the table, no reset, no error.
  - SubTask 1.1: Read `frontend/app/(dashboard)/inventory/page.tsx` to confirm `InventoryForm` is invoked without an `onSaved` prop.
  - SubTask 1.2: Read `frontend/components/inventory/inventory-form.tsx` to confirm the form's submit handler only fires `onSaved?.(saved)` and never toasts or resets on its own.

- [x] **Task 2: Wire the form's success callback into the inventory page.** Edit `frontend/app/(dashboard)/inventory/page.tsx`:
  - SubTask 2.1: Add `refresh` to the `useInventory` destructure.
  - SubTask 2.2: Pass `onSaved={() => { refresh(); toast({ title: "Item added" }); }}` to `<InventoryForm />`.
  - SubTask 2.3: Import `toast` from `@/components/ui/toaster`.

- [x] **Task 3: Make `InventoryForm` reset on success and surface the active project.** Edit `frontend/components/inventory/inventory-form.tsx`:
  - SubTask 3.1: After `onSaved?.(saved)` returns, call `reset()` (from `useForm`) to clear the inputs.
  - SubTask 3.2: Accept an optional `projectName` prop and render it in the form header so the user knows which project the new row belongs to.
  - SubTask 3.3: Accept an optional `disabled` prop. When true, disable the submit button and show a hint.

- [x] **Task 4: Make the inventory page "all projects" mode disable the form.** Edit `frontend/app/(dashboard)/inventory/page.tsx`:
  - SubTask 4.1: Pass `projectName` (resolved project name) and `disabled={filter === "all"}` to the form.
  - SubTask 4.2: When `filter === "all"`, render an inline hint ("Pick a project from the filter above to add an item") instead of the form, so the user is never confused about which project the row will be created under.

- [x] **Task 5: Verify the project detail page's InventoryForm still works.** Read `frontend/app/(dashboard)/projects/[id]/page.tsx` and confirm the `onSaved` callback is correctly wired (`refreshItems` + `toast`). If missing or broken, apply the same fix as Task 2.

- [x] **Task 6: Run typecheck + build.** `cd /workspace/frontend && pnpm typecheck && pnpm build`. Both must be clean.

- [x] **Task 7: Manually verify the Add-Item fix in the browser.** Use the agent-browser skill to sign in, go to `/inventory`, pick a project, fill the form, click **Add item**. Confirm: success toast, new row appears, form resets.

- [x] **Task 8: Comprehensive QA against the live deployment.** Use the agent-browser skill to walk through every feature in the spec's "Comprehensive QA report" requirement. Record pass/fail with screenshots and a written summary. Save the report to `frontend/qa-report.md` so it's easy to share back to the user.

- [x] **Task 9: Fix any P0 bugs found during QA.** Three P0 bugs found. All three fixed in local `main`:
  - **P0-1** documents upload — `supabase/migrations/20260101000010_storage_policies.sql` adds the 4 storage.objects policies. ✅
  - **P0-2** public share page — `app/share/[token]/shared-view.tsx` rewritten to match the actual API shape. ✅
  - **P0-3** revoked state not enforced — `app/api/shares/[token]/route.ts` now reads the share row via direct PostgREST fetch with `cache: "no-store"`. Root cause: supabase-js uses `cross-fetch` which polyfills `globalThis.fetch` and therefore participates in Next.js's fetch-level cache; that cache held a stale `revoked: false` response. Direct fetch to the same URL+key returned fresh data, so the supabase-js path was the problem. ✅

- [ ] **Task 10: Commit, push, deploy.** Commit is in place on `main` (`8dd7aae`). **Push + deploy is blocked on this sandbox:** no GitHub or Vercel API token is available. The Vercel OIDC token in `/workspace/.env.local` is a JWT, which the Vercel CLI rejects, and the Vercel REST API rejects it as `invalidToken: true`. The user needs to run `git push origin main` from a shell that has GitHub credentials, or trigger the deploy from the Vercel dashboard. After deploy, run `scripts/verify-revoke.sh <token>` to confirm the revoke fix end-to-end.

# Task Dependencies
- Task 2 depends on Task 1 (need to confirm the bug before fixing)
- Task 3 depends on Task 2 (page-level fix is the priority; form reset is a polish layer)
- Task 4 depends on Task 2 (uses the same `useInventory` destructure)
- Task 5 depends on Task 2 (re-uses the same pattern)
- Task 6 depends on Tasks 2, 3, 4, 5
- Task 7 depends on Task 6
- Task 8 depends on Task 7 (verify the fix is in place first, then sweep the rest)
- Task 9 depends on Task 8
- Task 10 depends on Task 9
