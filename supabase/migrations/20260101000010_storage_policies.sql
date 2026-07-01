-- Storage policies for the `documents` bucket.
-- The bucket itself is created via the dashboard (private, 50MB cap,
-- restricted mime types). This migration adds the row-level policies
-- on `storage.objects` that the application depends on.
--
-- The application stores files under `<user_id>/<docId>-<fileName>`,
-- so the first path segment is always the owner's auth.uid().

-- Clean up any prior policies so this migration is idempotent.
drop policy if exists "documents_storage_select_own" on storage.objects;
drop policy if exists "documents_storage_insert_own" on storage.objects;
drop policy if exists "documents_storage_update_own" on storage.objects;
drop policy if exists "documents_storage_delete_own" on storage.objects;

-- Read: owners can read their own files. We DO NOT allow anon reads
-- here — public access happens via short-lived signed URLs minted
-- server-side from the service_role key, so the bucket stays locked.
create policy "documents_storage_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Insert: owners can upload to their own folder.
create policy "documents_storage_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update: owners can update their own objects (e.g., replace content).
create policy "documents_storage_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete: owners can delete their own objects.
create policy "documents_storage_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
