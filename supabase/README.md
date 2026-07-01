# GC Pallet → Supabase migration

This folder holds everything needed to move GC Pallet off PocketBase
and onto a Supabase Postgres + Storage + Auth backend.

## Files

| File | Purpose |
| --- | --- |
| `schema.sql` | Full DDL: tables, RLS, storage bucket, triggers, the `increment_share_view` function. Idempotent. |
| `migrate-from-pocketbase.mjs` | One-time Node script that reads from the live PocketBase instance and writes into Supabase, including uploading document files into the `documents` storage bucket. |
| `package.json` | Local-only deps for running the migration script (`@supabase/supabase-js`, `dotenv`). |

## 1. Apply the schema (once)

1. Sign in to [supabase.com](https://supabase.com) and open this project.
2. In the left sidebar click **SQL editor** → **New query**.
3. Paste the entire contents of [`schema.sql`](./schema.sql) and click **Run**.

The script is idempotent — if a table / policy already exists, the
relevant statement is skipped or recreated. Re-running it is safe.

What it creates:
- `profiles` (1-to-1 with `auth.users`)
- `projects`, `inventory`, `documents` (owner-only via RLS)
- `shares` (owner can write, public can read by token via the
  `/api/shares/[token]` server route which uses the service role key)
- `contact_messages` (public insert only)
- `storage.objects` policies that pin every uploaded file to the
  owner's folder: `<user_id>/<filename>`
- An `auth.users → profiles` insert trigger so every signup
  automatically gets a `profiles` row.

## 2. Run the data migration (once)

The script reads from the live PB instance (`POCKETBASE_URL`) and
writes into Supabase. Users, projects, inventory, documents (incl.
file bytes), shares and contact messages are all migrated. PB and
Supabase IDs don't match, so the script uses a deterministic UUID
derived from the PB id — re-running is a no-op for already-migrated
records.

1. Make sure `frontend/.env.local` is filled in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   POCKETBASE_URL=http://127.0.0.1:8090
   POCKETBASE_ADMIN_EMAIL=...
   POCKETBASE_ADMIN_PASSWORD=...
   ```
2. From this folder:
   ```bash
   npm install
   node migrate-from-pocketbase.mjs
   ```
3. The script prints, at the end, the list of users whose passwords
   it could not preserve (PB and Supabase hash algorithms differ).
   Each of those users must use the "Forgot password" flow on first
   sign-in to set a new password.

## 3. Rotate secrets (recommended)

After the migration is done:
- Rotate the `service_role` key in **Supabase → Project settings →
  API** and update Vercel + any local `.env.local`.
- The PB admin password is no longer needed by the app and can be
  rotated on the PB instance.

## 4. Delete the PocketBase backend (when ready)

Once the Supabase project is live and you've confirmed data is there,
you can delete:
- `backend/` (PocketBase binary + `pb_migrations/`)
- The `POCKETBASE_*` env vars in `frontend/.env.local` and Vercel.

The frontend now talks to Supabase directly through
`@supabase/supabase-js` + RLS, and only the public share
endpoint (`/api/shares/[token]`) runs in a Next.js API route with
the service-role key.
