# Inventory "Last updated" + Storage mime types — Spec

## Why
Two follow-up issues found by the user on the live deployment after the inventory + share fixes shipped:

1. **Every inventory row shows the same "X hours ago" timestamp.** The `inventory.last_updated` column is a `date` (day granularity), is set by the create hook to `new Date().toISOString().slice(0, 10)`, and is never updated when the row is edited. The display then renders `formatDistanceToNow(last_updated)` on a date-only value, so every row created on the same day shows the same `Nh ago`. There is already a perfectly good `updated_at timestamptz` column with a `set_updated_at` trigger, but the UI is reading the wrong field.
2. **Uploading a `.txt` file (or any non-image / non-PDF type) is rejected with `mime type text/plain is not supported`.** The `documents` storage bucket was created with an `allowed_mime_types` allow-list that only includes images and PDFs. The user wants **all** file types accepted.

## What Changes
- The `Last updated` column on the inventory list will reflect the row's real last-edit time (per-row, per-edit), sourced from `inventory.updated_at` instead of `inventory.last_updated`.
- The `documents` storage bucket will accept any mime type. No client-side filter is added; whatever the user picks goes through.
- The `inventory.last_updated` column is left in place (it's a date field that means "the date this count was last verified by hand" — it's still useful on the form, but it's not what the list should show).

## Impact
- **Affected code:**
  - [frontend/hooks/useInventory.ts](file:///workspace/frontend/hooks/useInventory.ts) — switch the `select(...)` call to also return `updated_at` (already returned) and stop forcing `last_updated` on insert; let the DB default + trigger do their job.
  - [frontend/lib/types.ts](file:///workspace/frontend/lib/types.ts) — `InventoryItem.lastUpdated` should be the row's `updated_at` (rename or repoint).
  - [frontend/components/inventory/inventory-table.tsx](file:///workspace/frontend/components/inventory/inventory-table.tsx) — render the new field.
  - [supabase/migrations/20260101000020_open_documents_bucket.sql](file:///workspace/supabase/migrations/20260101000020_open_documents_bucket.sql) — new migration that nulls `storage.buckets.allowed_mime_types` and bumps `file_size_limit` to a reasonable ceiling.
  - [frontend/components/documents/upload-modal.tsx](file:///workspace/frontend/components/documents/upload-modal.tsx) — drop the client-side validation that surfaced "mime type … is not supported" (it's a server response; we just want to render the actual error from the upload, not duplicate it).

- **Affected specs:** none — the inventory add-item spec and the share/spec are independent. This is a small bug-fix delta on top.

## ADDED Requirements

### Requirement: Inventory "Last updated" column reflects the real edit time
The system SHALL display, in the inventory list, a per-row `Last updated` value that:
- comes from the row's `updated_at` column (full timestamp, auto-maintained by the existing `inventory_set_updated_at` trigger),
- changes every time the row is edited, including edits made by other devices,
- and shows a friendly relative time (`Ns / Nm / Nh / Nd ago`) using the existing `formatDistanceToNow` helper.

#### Scenario: Newly created row
- **WHEN** the user creates a new inventory item,
- **THEN** the new row's `Last updated` reads `0s ago` (or `just now`) on first render and `Ns / Nm` after a short delay.

#### Scenario: Row is edited
- **WHEN** the user updates any field on an existing inventory item,
- **THEN** the row's `Last updated` is bumped to the current time on the next render of the list.

#### Scenario: Different items, same day
- **WHEN** two items are created minutes apart on the same calendar day,
- **THEN** their `Last updated` values are different (e.g. `2m ago` and `15m ago`), not both `19h ago`.

### Requirement: Documents bucket accepts any mime type
The system SHALL accept uploads of any file type into the `documents` storage bucket, subject only to the existing per-file size limit.

#### Scenario: Upload a .txt file
- **WHEN** the user picks a `.txt` file in the upload modal and clicks **Upload**,
- **THEN** the upload succeeds, the file is stored at `<user_id>/<name>` in the `documents` bucket, and a new `documents` row is created with the file's real mime type.

#### Scenario: Upload an arbitrary binary
- **WHEN** the user uploads a file whose extension is not in the previous allow-list (e.g. `.docx`, `.zip`, `.dwg`, `.csv`),
- **THEN** the upload succeeds with the same UX as PDFs/PNGs.

#### Scenario: Per-file size limit
- **WHEN** the user uploads a file larger than the bucket's `file_size_limit`,
- **THEN** the upload is rejected with a clear error (`File too large` / `storage_file_too_large`); the message is shown in the modal, not as a hard 400 to the user.

## MODIFIED Requirements

### Requirement: Inventory row "last updated" semantics
**Was:** the `last_updated date` column is the source of truth for the list's `Last updated` column.
**Now:** the list's `Last updated` column is the row's `updated_at timestamptz` (auto-maintained by trigger). The `last_updated` column remains on the form for users to record the date they last physically verified the count, but it is not surfaced in the list.

## REMOVED Requirements
None.

## Out of scope
- Migrating existing rows' `last_updated` values to `updated_at` — not needed; the list will read `updated_at` going forward and the old data is still valid for the form.
- Adding a client-side file-type picker / category-aware filters.
- Changing the storage RLS policies (already done in `20260101000010_storage_policies.sql`).
- Virus scanning, mime sniffing on the server, or any other security hardening of the bucket.
