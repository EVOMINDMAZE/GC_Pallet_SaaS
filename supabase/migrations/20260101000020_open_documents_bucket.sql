-- =============================================================================
-- Open the `documents` storage bucket to any mime type
-- =============================================================================
-- The bucket was originally created with an `allowed_mime_types` allow-list
-- that rejected e.g. text/plain. The product decision is: any file type
-- the user picks should upload. We null the allow-list (= "no restriction")
-- and bump the size ceiling to 50 MB, which is what the upload UI already
-- advertises.
-- =============================================================================

update storage.buckets
  set allowed_mime_types = null,
      file_size_limit   = 52428800  -- 50 MB
where name = 'documents';
