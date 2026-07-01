# Verification Checklist

## Inventory Add-Item fix
- [ ] `InventoryForm` is invoked from `app/(dashboard)/inventory/page.tsx` with an `onSaved` callback that calls `refresh()` from `useInventory` and shows a `"Item added"` toast.
- [ ] `InventoryForm` resets its fields after a successful submit.
- [ ] `InventoryForm` shows the active project name in its header.
- [ ] When the page filter is "All projects", the form is replaced by a hint ("Pick a project from the filter above to add an item") instead of silently creating under `projects[0].id`.
- [ ] The same `onSaved` pattern works in `app/(dashboard)/projects/[id]/page.tsx` (regression check).

## Build / typecheck
- [ ] `cd /workspace/frontend && pnpm typecheck` passes.
- [ ] `pnpm build` passes and emits all 19 routes.

## Live verification (agent-browser)
- [ ] Sign in as `test@gcpallet.com` works.
- [ ] `/inventory` → pick a project → fill form → click **Add item** → toast appears, new row visible in table, form clears.
- [ ] `/inventory` → "All projects" selected → form is replaced by a hint.

## QA report
- [ ] `frontend/qa-report.md` exists with a verdict (PASS / FAIL / PARTIAL) per feature.
- [ ] Auth flow: login, logout, session persistence, register-new-user all PASS.
- [ ] Profile / settings: view, update name/company/phone, change password, sign-out all PASS.
- [ ] Projects CRUD: list, create, edit, delete, detail all PASS.
- [ ] Project detail tabs: Overview, Inventory, Documents, Shares all PASS.
- [ ] Inventory CRUD: list (all + filtered), add, edit, delete all PASS.
- [ ] Documents CRUD: list, upload small file, upload large file (≤50MB), download via signed URL, delete all PASS.
- [ ] Share links: create with expiry, copy link, revoke, open in incognito, public page renders project + docs all PASS.
- [ ] Dashboard widgets: stats cards, greeting, recent activity, documents timeline, inventory by location, project timeline all PASS.
- [ ] Marketing: home page renders, contact form anon-submits and creates a `contact_messages` row all PASS.
- [ ] Cross-cutting: RLS isolation (a second user cannot see user A's projects/inventory/documents/shares) PASS.
- [ ] Cross-cutting: error toasts appear on failed actions, loading skeletons appear on data fetch, empty states appear with helpful copy, mobile (375px) layout is usable all PASS.

## Deploy
- [ ] Commit + push to `EVOMINDMAZE/GC_Pallet_SaaS` `main`.
- [ ] Vercel auto-deploy passes (READY state).
- [ ] Live URL is reachable and reflects the fix.
