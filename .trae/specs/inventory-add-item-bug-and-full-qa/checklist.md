# Verification Checklist

## Inventory Add-Item fix
- [x] `InventoryForm` is invoked from `app/(dashboard)/inventory/page.tsx` with an `onSaved` callback that calls `refresh()` from `useInventory` and shows a `"Item added"` toast.
- [x] `InventoryForm` resets its fields after a successful submit.
- [x] `InventoryForm` shows the active project name in its header.
- [x] When the page filter is "All projects", the form is replaced by a hint ("Pick a project from the filter above to add an item") instead of silently creating under `projects[0].id`.
- [x] The same `onSaved` pattern works in `app/(dashboard)/projects/[id]/page.tsx` (regression check).

## Build / typecheck
- [x] `cd /workspace/frontend && pnpm typecheck` passes.
- [x] `pnpm build` passes and emits all 19 routes.

## Live verification (agent-browser)
- [x] Sign in as `test@gcpallet.com` works.
- [x] `/inventory` → pick a project → fill form → click **Add item** → toast appears, new row visible in table, form clears.
- [x] `/inventory` → "All projects" selected → form is replaced by a hint.

## QA report
- [x] `frontend/qa-report.md` exists with a verdict (PASS / FAIL / PARTIAL) per feature.
- [x] Auth flow: login, logout, session persistence, register-new-user all PASS or PARTIAL (register is PARTIAL due to email confirmation, documented).
- [x] Profile / settings: view, update name/company/phone, change password, sign-out all PASS.
- [x] Projects CRUD: list, create, edit, delete, detail all PASS.
- [x] Project detail tabs: Overview, Inventory, Documents, Shares all PASS.
- [x] Inventory CRUD: list (all + filtered), add, edit, delete all PASS.
- [x] Documents CRUD: list, upload small file, upload large file (≤50MB), download via signed URL, delete — fixed in P0-1, needs post-deploy re-verify.
- [x] Share links: create with expiry, copy link, revoke, open in incognito, public page renders project + docs — P0-2 + P0-3 fixed in code, needs post-deploy re-verify.
- [x] Dashboard widgets: stats cards, greeting, recent activity, documents timeline, inventory by location, project timeline all PASS.
- [x] Marketing: home page renders, contact form anon-submits and creates a `contact_messages` row all PASS or PARTIAL (contact form has no success toast — known).
- [x] Cross-cutting: RLS isolation (a second user cannot see user A's projects/inventory/documents/shares) PARTIAL — RLS confirmed via direct REST probe, full UI re-test needs a pre-confirmed second account.
- [x] Cross-cutting: error toasts appear on failed actions, loading skeletons appear on data fetch, empty states appear with helpful copy, mobile (375px) layout is usable all PASS.

## Deploy
- [x] Commit is in place on `main` (latest = `8dd7aae`).
- [ ] `git push origin main` — **blocked on user**: no GitHub credentials in this sandbox.
- [ ] Vercel auto-deploy — will run after push.
- [ ] Live URL re-verified against P0-2 + P0-3 fixes via `scripts/verify-revoke.sh`.
