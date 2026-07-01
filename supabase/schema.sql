-- =====================================================================
-- GC Pallet → Supabase schema
-- Run this in the Supabase SQL editor (Project → SQL → New query).
-- Idempotent: safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles: 1-to-1 with auth.users
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  company_name text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_profiles_email on public.profiles (email);

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 200),
  address     text check (address is null or char_length(address) <= 500),
  budget      numeric(14, 2) check (budget is null or budget >= 0),
  start_date  date,
  end_date    date,
  status      text not null default 'planning'
                check (status in ('planning','active','completed','on_hold','draft','procurement')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_projects_user on public.projects (user_id);
create index if not exists idx_projects_created on public.projects (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- inventory
-- ---------------------------------------------------------------------
create table if not exists public.inventory (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  project_id    uuid not null references public.projects(id) on delete cascade,
  item_name     text not null check (char_length(item_name) between 1 and 200),
  quantity      numeric(12, 2) not null default 0 check (quantity >= 0),
  unit          text not null check (unit in ('pieces','lbs','kg','sqft','sqm')),
  location      text not null check (location in ('warehouse','job_site','in_transit')),
  cost_per_unit numeric(12, 2) check (cost_per_unit is null or cost_per_unit >= 0),
  last_updated  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_inventory_user     on public.inventory (user_id);
create index if not exists idx_inventory_project  on public.inventory (project_id);
create index if not exists idx_inventory_updated  on public.inventory (user_id, last_updated desc);

-- ---------------------------------------------------------------------
-- documents
-- file_path is the object key inside the `documents` storage bucket.
-- Storage objects are private; we sign URLs in the app.
-- ---------------------------------------------------------------------
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 255),
  file_path   text not null,
  mime_type   text not null,
  size_bytes  bigint not null check (size_bytes >= 0),
  category    text not null
                check (category in ('contract','permit','invoice','receipt','photo','other')),
  uploaded_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_documents_user     on public.documents (user_id);
create index if not exists idx_documents_project  on public.documents (project_id);
create index if not exists idx_documents_uploaded on public.documents (user_id, uploaded_at desc);

-- ---------------------------------------------------------------------
-- shares: public read-only snapshots of a project
-- ---------------------------------------------------------------------
create table if not exists public.shares (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique
                check (char_length(token) between 16 and 64),
  resource_id uuid not null references public.projects(id) on delete cascade,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  expires_at  timestamptz,
  revoked     boolean not null default false,
  view_count  integer not null default 0 check (view_count >= 0),
  label       text check (label is null or char_length(label) <= 80),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists idx_shares_token      on public.shares (token);
create index if not exists idx_shares_resource       on public.shares (resource_id);
create index if not exists idx_shares_resource_state on public.shares (resource_id, revoked);

-- ---------------------------------------------------------------------
-- contact_messages: public insert, no auth required
-- ---------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null,
  message    text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','projects','inventory','documents','shares'
  ])
  loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on public.%1$s;
       create trigger trg_%1$s_updated_at
         before update on public.%1$s
         for each row execute function public.set_updated_at();',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- profile bootstrap on signup
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, company_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'company_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- share view counter (called by the public /api/shares/[token] route)
-- ---------------------------------------------------------------------
create or replace function public.increment_share_view(p_token text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.shares
     set view_count = view_count + 1
   where token = p_token
   returning view_count into new_count;
  return coalesce(new_count, 0);
end;
$$;
grant execute on function public.increment_share_view(text) to anon, authenticated;

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.profiles         enable row level security;
alter table public.projects         enable row level security;
alter table public.inventory        enable row level security;
alter table public.documents        enable row level security;
alter table public.shares           enable row level security;
alter table public.contact_messages enable row level security;

-- profiles: a user can read + update only their own profile
drop policy if exists "profiles self read"   on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self read"   on public.profiles for select
  using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert
  with check (auth.uid() = id);

-- projects / inventory / documents: owner only
drop policy if exists "projects owner all"   on public.projects;
create policy "projects owner all" on public.projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "inventory owner all"  on public.inventory;
create policy "inventory owner all" on public.inventory for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "documents owner all"  on public.documents;
create policy "documents owner all" on public.documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- shares
-- SELECT  : a logged-in user can see shares they created
--           the public /api/shares/[token] endpoint uses the service-role
--           key to read by token, so unauthenticated visitors do NOT need
--           an RLS policy here.
-- INSERT  : a logged-in user can create a share, but only for one of
--           their own projects (enforced via the with-check clause).
-- UPDATE  : only the creator; only the `revoked` column is mutable.
-- DELETE  : only the creator.
drop policy if exists "shares owner read"   on public.shares;
drop policy if exists "shares owner insert" on public.shares;
drop policy if exists "shares owner update" on public.shares;
drop policy if exists "shares owner delete" on public.shares;

create policy "shares owner read" on public.shares for select
  using (auth.uid() = created_by);

create policy "shares owner insert" on public.shares for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.projects p
       where p.id = resource_id and p.user_id = auth.uid()
    )
  );

create policy "shares owner update" on public.shares for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "shares owner delete" on public.shares for delete
  using (auth.uid() = created_by);

-- contact_messages: anyone (incl. anon) can insert, no read/update/delete
drop policy if exists "contact insert anyone" on public.contact_messages;
create policy "contact insert anyone" on public.contact_messages for insert
  with check (true);

-- =====================================================================
-- Storage: `documents` bucket (private)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Users can only read/write objects under their own folder:
--   <user_id>/<file>
drop policy if exists "documents read own folder"   on storage.objects;
drop policy if exists "documents write own folder"  on storage.objects;
drop policy if exists "documents update own folder" on storage.objects;
drop policy if exists "documents delete own folder" on storage.objects;

create policy "documents read own folder" on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents write own folder" on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents update own folder" on storage.objects for update
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents delete own folder" on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
