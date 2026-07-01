# Inventory Add-Item Bug + Full-App QA Spec

## Why
The user reported that clicking **Add item** on the Inventory page does nothing. Root cause is now identified (see "What Changes"). Beyond the fix, every feature in the app needs an end-to-end smoke test against the live Vercel + Supabase deployment so we can ship a tight, bug-free release rather than discovering regressions one-by-one after deploys.

## What Changes
- **Fix the Add Item button on the inventory page** so it (a) actually inserts, (b) shows a success toast, (c) refreshes the table, and (d) resets the form. The form already calls `onSaved?.(saved)` on success — the page just doesn't pass a callback, so the user sees no feedback and the table doesn't revalidate. **BREAKING**: changes the page-level `<InventoryForm>` usage signature (adds `onSaved`).
- **Expose the active project in the inventory form** so the user knows which project the new row will be added to. When the page filter is "all" we currently fall back to `projects[0].id` silently — that makes the form's `projectId` invisible. Fix: render the active project name in the form header, and disable the form until a project is explicitly chosen.
- **Same fix for the project detail page InventoryForm** (verify the existing `onSaved` callback there actually fires and toasts — confirm no regression).
- **Comprehensive QA** of every user-facing feature in the app against the live deployment. Produce a written report with pass/fail findings.

## Impact
- **Affected specs:** inventory CRUD, projects CRUD, documents (upload/download/delete), share links (create/revoke/public read), auth (login/register/logout/password), settings (profile/password), public share page, contact form, dashboard widgets.
- **Affected code:**
  - `frontend/app/(dashboard)/inventory/page.tsx` — add `onSaved` + project-name header
  - `frontend/components/inventory/inventory-form.tsx` — accept + invoke a `success` callback; reset on success
  - `frontend/app/(dashboard)/projects/[id]/page.tsx` — verify the InventoryForm onSaved chain (likely no change)
  - All other pages/components — read-only audit, no edits unless QA finds bugs
- **Affected data:** none. QA runs against the seeded test user + seeded projects/inventory.

## ADDED Requirements

### Requirement: Add-Item feedback loop
The inventory page (`/inventory`) MUST give the user visible feedback when the **Add item** button is clicked. The system SHALL:

#### Scenario: Successful add (item inserted, table updated, form reset)
- **WHEN** the user fills the form with valid values and clicks **Add item**
- **THEN** the row is inserted into `inventory` (RLS-scoped to the current user)
- **AND** a success toast appears (`"Item added"`)
- **AND** the inventory table revalidates so the new row shows up
- **AND** the form fields are reset to defaults

#### Scenario: Failed add (validation, network, or RLS error)
- **WHEN** the user submits and the insert fails
- **THEN** the form keeps the user's input
- **AND** an inline error message appears with the failure reason
- **AND** the submit button re-enables

### Requirement: Project selection visibility
The inventory page MUST make it clear which project a newly added item will belong to.

#### Scenario: Filter set to "all projects"
- **WHEN** the page filter is **All projects** and the user tries to add an item
- **THEN** the form is disabled (or hidden) and a hint tells the user to pick a specific project from the filter

#### Scenario: Filter set to a specific project
- **WHEN** the user picks a project from the filter
- **THEN** the form shows the project name in its header and is enabled

### Requirement: Comprehensive QA report
A sub-agent MUST exercise every user-facing feature end-to-end against the live deployment at https://gc-pallet-saas-evomindmazes-projects.vercel.app/ and produce a structured report.

The report SHALL include, per feature, a **PASS** / **FAIL** / **PARTIAL** verdict plus the steps run and the actual vs. expected outcome. Fails must include the URL/selector where the bug surfaced.

Features in scope (all using the seeded `test@gcpallet.com` / `Test1234!` account unless noted):
1. **Auth** — login, register new user, logout, session persistence across reload, session persistence across tabs
2. **Profile & settings** — view profile, update name/company/phone, change password, sign-out from settings page
3. **Projects CRUD** — list, create, edit, delete, view detail
4. **Project detail tabs** — Overview, Inventory, Documents, Shares
5. **Inventory CRUD** — list (with all-projects + per-project filter), add, edit, delete (the broken one is the focus)
6. **Documents CRUD** — list, upload (small + large file), download via signed URL, delete
7. **Share links** — create (with expiry option), copy, revoke, open the public share page in an incognito context, verify it shows the right project + docs
8. **Dashboard** — stats cards, greeting, recent activity, documents timeline, inventory by location, project timeline
9. **Public marketing** — home page renders, contact form submits anon message
10. **Cross-cutting** — RLS isolation (verify user A can't see user B's data), sign-out, error toasts, loading skeletons, empty states, mobile (375px) layout sanity

## MODIFIED Requirements
None — this is a bug-fix + QA change, not a feature rewrite.

## REMOVED Requirements
None.

## Out of scope
- Performance benchmarking
- i18n / locale work
- Migration from Supabase to anything else
- Adding new tables, columns, or features the user did not request
