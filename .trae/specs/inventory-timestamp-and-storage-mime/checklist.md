# Verification Checklist

## Inventory "Last updated" sync
- [x] `InventoryItem.lastUpdated` in [frontend/lib/types.ts](file:///workspace/frontend/lib/types.ts) maps to the row's `updated_at` (full ISO timestamp), not `last_updated`.
- [x] `useInventory` selects `updated_at` and feeds it into `rowToItem.lastUpdated`.
- [x] `createInventoryItem` no longer writes `last_updated` on insert (let the default + trigger handle it).
- [x] `updateInventoryItem` no longer accepts/passes `last_updated` (trigger bumps `updated_at` automatically).
- [x] In the deployed app, two items created minutes apart show **different** "X ago" values.
- [x] Editing a row bumps its "Last updated" to the current time on the next render.

## Documents storage mime type
- [x] `supabase/migrations/20260101000020_open_documents_bucket.sql` exists and nulls `allowed_mime_types` on the `documents` bucket.
- [ ] The migration is applied to the live Supabase project. **Blocked on user — needs Supabase access token or manual paste into SQL editor.**
- [ ] In the Supabase dashboard, the `documents` bucket shows `allowed_mime_types: NULL`.
- [ ] Uploading a `.txt` file succeeds end-to-end (the file in the screenshot is `chat-AFS Auto Flipping Strategy.txt`).
- [ ] Uploading a `.docx` / `.zip` / `.csv` / `.dwg` succeeds.
- [ ] Uploading a file > 50 MB fails with a clear, modal-rendered error.

## Build / typecheck
- [x] `cd /workspace/frontend && pnpm typecheck` passes.
- [x] `pnpm build` passes and emits all 19 routes.

## Deploy
- [x] Commit + push to `EVOMINDMAZE/GC_Pallet_SaaS` `main`.
- [x] Vercel auto-deploy passes (READY state).
- [x] Live URL reflects the fix (create a new item, confirm `Last updated` is per-row, not all "X h ago").
