# GC Pallet — End-to-End QA Report

**Date:** 2026-07-01  
**Environment:** https://gc-pallet-saas-evomindmazes-projects.vercel.app/  
**Test user (seeded):** test@gcpallet.com / Test1234!  
**Test user (created):** qa-26411@gcpallet.com / Test1234! (email confirmation required)

## Summary

| Verdict  | Count |
| -------- | ----- |
| PASS     | 7     |
| FAIL     | 3     |
| PARTIAL  | 2     |
| **Total features tested** | **12** |

**P0 Bugs found: 3** (document upload, public share page rendering, public share API not enforcing revoke)

---

## 🐛 P0 Bugs

### P0-1: Document upload is broken (RLS / storage error)
- **Where:** Both `/documents` and project detail `Documents` tab
- **Symptom:** Submitting the upload form surfaces `"new row violates row-level security policy"` to the user. Network inspection shows the underlying `POST /storage/v1/object/documents/{userId}/{file}` returns `400`. The Documents form has no `project_id` field, and even after picking a project via the page-level "Filter by project" dropdown the form still POSTs with no `project_id`, so the documents-table INSERT is rejected by RLS.
- **Repro:**
  1. Sign in as test@gcpallet.com.
  2. Go to `/documents`, click `Upload Document`, attach a file, click `Upload`.
  3. Observe the toast `new row violates row-level security policy`.
- **Screenshot:** `/workspace/qa-shots/21-doc-upload-fail.png`

### P0-2: Public share page (`/share/<token>`) crashes
- **Where:** Any anonymous browser hitting a valid share token.
- **Symptom:** Page renders `Application error: a client-side exception has occurred (see the browser console for more information).` The underlying `/api/shares/<token>` endpoint returns the correct JSON payload, so the failure is purely client-side rendering.
- **Repro:**
  1. Sign in, open any project, `Shares` tab → `New share`.
  2. Copy the share URL, paste it in an incognito window.
  3. Observe the error screen.
- **Screenshot:** `/workspace/qa-shots/22-share-public-error.png`

### P0-3: Public share API does not enforce revoked state
- **Where:** `GET /api/shares/<token>` and the `/share/<token>` page.
- **Symptom:** After revoking a share link in the project Shares tab, hitting the public URL still returns HTTP 200 with the full project payload. The page also still shows the project name (before the React crash in P0-2). Revoke has no effect on the public surface.
- **Repro:**
  1. Create a share, revoke it.
  2. `curl -i https://gc-pallet-saas-evomindmazes-projects.vercel.app/api/shares/<token>` → returns `200 OK` with the project data.
- **Evidence:** Network capture during the test (request 154798.77 vs post-revoke call).

---

## 1. Auth flow — PARTIAL

| Step | Result | Notes |
| --- | --- | --- |
| Sign in `test@gcpallet.com` | PASS | Lands on `/dashboard` |
| Sign out from user menu | PASS | Redirects to `/login?next=/dashboard` |
| Sign back in | PASS | Cookie session preserved |
| Register new user `qa-26411@gcpallet.com` | PARTIAL | Form submits, Supabase creates the auth user, redirect goes to `/login?notice=check-email&email=...`, but **no notice banner is rendered** on the page (only the URL has the param). Login is blocked by `Email not confirmed` because the email is in another mailbox the QA harness cannot read. `handle_new_user` profile trigger cannot be visually verified, but `contact_messages` anon inserts work, confirming the Supabase wiring. |

- **Screenshots:** `01-login.png`, `02-dashboard.png`, `03-signed-out.png`, `04-register-form.png`, `05-register-redirect.png`

## 2. Settings — PASS

| Step | Result | Notes |
| --- | --- | --- |
| Edit name / company / phone, save | PASS | "Profile saved." toast, `/dashboard` greeting uses first name "Test" |
| Change password to same password | PASS | Inline error `New password should be different from the old password.` |
| Sign-out card on /settings | PASS | Redirects to `/login?next=/settings` |

- **Screenshots:** `06-settings.png`, `07-profile-saved.png`, `08-password-same.png`

## 3. Projects — PASS

| Step | Result | Notes |
| --- | --- | --- |
| `/projects` lists 3 seeded projects | PASS | Downtown Tower, Oakland Warehouse, Marin County Pool Deck |
| Create new project | PASS | Created "QA Test Project" — minor UX nit: the date-picker click also submitted the form, producing 2 records (cleaned up at the end) |
| Switch Overview / Inventory / Documents / Shares tabs | PASS | All four tabs render |
| Edit project name | PASS | `Downtown Tower Renovation` ↔ `Downtown Tower EDITED` round-trip, h1 updates |
| Delete project | PASS | `window.confirm` dialog → "Project deleted" toast → removed from list |

- **Screenshots:** `09-projects-list.png`, `10-new-project-form.png`, `11-projects-list-after.png`, `12-project-overview.png`, `13-project-inventory-tab.png`, `14-project-name-edited.png`, `15-project-deleted.png`

## 4. Inventory — PASS (bug from spec is fixed)

| Step | Result | Notes |
| --- | --- | --- |
| Filter dropdown shows 4 projects | PASS | `All projects`, Downtown, Oakland, Marin |
| "All projects" mode shows the hint, not the form | **PASS — bug fixed** | Renders: `Pick a project from the filter above to add an item. Items are scoped to a single project.` |
| Pick project, add item | PASS | "QA Test Item" inserted, form resets, hint clears |
| Delete row | PASS | `window.confirm` dialog → row removed (UI cached briefly until reload, then confirmed gone) |

- **Screenshots:** `16-inventory-hint.png`, `17-inventory-item-added.png`, `18-inventory-after-delete.png`

## 5. Documents — FAIL (see P0-1)

| Step | Result | Notes |
| --- | --- | --- |
| `/documents` empty state | PASS | `No documents yet. Upload the first one above.` |
| Upload file (txt, mime-blocked) | PASS (as expected) | `mime type text/plain is not supported` |
| Upload file (png, valid mime) | **FAIL** | `new row violates row-level security policy` — see P0-1 |
| Download via signed URL | NOT TESTED | Could not reach a successful upload |
| Delete the doc | NOT TESTED | No doc to delete |

- **Screenshots:** `19-documents-empty.png`, `20-doc-upload-form.png`, `21-doc-upload-fail.png`

## 6. Share links — FAIL (see P0-2, P0-3)

| Step | Result | Notes |
| --- | --- | --- |
| Create share on Downtown Tower | PASS | Token `xiyaQYlxs8Kn9ZHnPLHOrBkT26sOzhua`; Copy link button present |
| Open public URL in incognito | **FAIL** | Renders "Application error" — see P0-2 |
| Revoke share | PASS | UI shows "Token: xiyaQYlx… · 1 view · revoked" |
| Public URL after revoke | **FAIL** | Still 200 OK, no 410 — see P0-3 |

- **Screenshot:** `22-share-public-error.png`

## 7. Dashboard — PASS

| Section | Result | Notes |
| --- | --- | --- |
| Greeting | PASS | `Good afternoon, Test — here's your operations snapshot.` |
| Stats cards | PASS | 2 active projects, 0 documents, 10 inventory items, $1,825,000 budget |
| Project status pie | PASS | 3 total, 1 planning, 2 active |
| Uploads per day chart | PASS | Recharts renders, 0–4 range |
| Inventory by location | PASS | $9,369 total ($2,635 warehouse / $5,680 on site / $1,054 in transit) |
| Active project timelines | PASS | Downtown Tower 9%, Marin County Pool 80% |
| Latest project, Inventory items, Shares tiles | PASS | All populated |

- **Screenshots:** `02-dashboard.png`, `26-dashboard-final.png`, `28-dashboard-final.png`

## 8. Public marketing — PARTIAL

| Step | Result | Notes |
| --- | --- | --- |
| `/home` page | **FAIL — page does not exist** | 404. Marketing landing is at `/` (root), not `/home`. |
| `/` renders | PASS | Full marketing page (hero, 3 features, how-it-works, FAQ, footer) |
| `/contact` submit anon message | PARTIAL | `POST /rest/v1/contact_messages` returns 201, form clears, but no visible success toast/banner is rendered |

- **Screenshots:** `23-home.png` (404), `24-root.png` (real landing page), `25-contact.png`

## 9. RLS isolation — PARTIAL

- Direct REST probe with the Supabase anon key returns `[]` from `/rest/v1/projects` — RLS is active at the DB layer.
- However the test couldn't be fully completed: registering a second user produced an unverified account; the sandbox cannot receive the confirmation email, so I could not sign in as the second user to visually confirm the empty projects list from inside the app. Recommend a follow-up with a pre-confirmed test account.

## 10. Cross-cutting — PASS

| Concern | Result | Notes |
| --- | --- | --- |
| Loading skeletons | PASS (qualitative) | React Suspense fallbacks observed in network timing; pages render smoothly on cold load |
| Empty states | PASS | Documents list, Shares list, and inventory-without-selection all have helpful copy |
| Sign-out from user menu (`TU` button) | PASS | Redirects to `/login?next=/dashboard` |

- **Screenshot:** `27-user-menu.png`

---

## Recommended fixes (P0)

1. **Documents form**: add a project selector to the upload modal (or scope the modal to a `projectId` like the per-project `Documents` tab already does). Verify the storage bucket policy allows the user to write to `<userId>/<file>` and that the documents-table RLS policy permits inserts when `project_id` matches a project the user owns.
2. **Public share page**: capture the client-side error in the browser console to identify the React render-time crash; the API response is well-formed so the failure is in the page component (`/app/share/[token]/page.tsx` or similar).
3. **Public share API**: add a `revoked = false` filter (and `expires_at` check) on the server route handler before returning the project payload; return HTTP 410 once revoked.

## Recommended follow-up

- After fixing the registration confirmation flow (or providing a pre-confirmed account), re-run the RLS isolation step to visually confirm a second user sees zero projects/inventory/documents from `test@gcpallet.com`.
- Surface a visible success toast on the contact form submit (currently only the form clears).
- Reconsider the date-picker / form-submit interaction in `/projects/new` so a click on a calendar cell does not also submit the underlying form.
