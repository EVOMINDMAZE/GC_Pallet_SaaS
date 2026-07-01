-- =============================================================================
-- GC Pallet — initial Supabase schema
-- =============================================================================
-- Mirrors the original PocketBase collections 1:1.
-- All tables live in the `public` schema; `auth.users` is Supabase's built-in.
-- RLS is ON for every table. The `service_role` key bypasses RLS for
-- server-side work in /api routes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles: extends auth.users with the fields PB's users collection had
-- (name, company_name, phone). Auto-populated on signup via trigger.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  company_name text check (char_length(company_name) <= 200),
  phone       text check (char_length(phone) <= 50),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

-- Auto-create a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 200),
  address     text check (char_length(address) <= 500),
  budget      numeric check (budget >= 0),
  start_date  date,
  end_date    date,
  status      text not null check (status in
                ('planning','active','completed','on_hold','draft','procurement')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index projects_user_id_idx on public.projects (user_id);
alter table public.projects enable row level security;
create policy "projects_select_own" on public.projects
  for select using (user_id = auth.uid());
create policy "projects_insert_authenticated" on public.projects
  for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy "projects_update_own" on public.projects
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "projects_delete_own" on public.projects
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- inventory
-- ---------------------------------------------------------------------------
create table public.inventory (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  project_id      uuid not null references public.projects(id) on delete cascade,
  item_name       text not null check (char_length(item_name) between 1 and 200),
  quantity        numeric not null check (quantity >= 0),
  unit            text not null check (unit in ('pieces','lbs','kg','sqft','sqm')),
  location        text not null check (location in ('warehouse','job_site','in_transit')),
  cost_per_unit   numeric check (cost_per_unit >= 0),
  last_updated    date not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index inventory_user_id_idx on public.inventory (user_id);
create index inventory_project_id_idx on public.inventory (project_id);
alter table public.inventory enable row level security;
create policy "inventory_select_own" on public.inventory
  for select using (user_id = auth.uid());
create policy "inventory_insert_authenticated" on public.inventory
  for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy "inventory_update_own" on public.inventory
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "inventory_delete_own" on public.inventory
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  project_id   uuid not null references public.projects(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 255),
  category     text not null check (category in
                 ('contract','permit','invoice','receipt','photo','other')),
  storage_path text not null,
  file_name    text not null,
  mime_type    text not null,
  size_bytes   bigint not null check (size_bytes >= 0),
  uploaded_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index documents_user_id_idx on public.documents (user_id);
create index documents_project_id_idx on public.documents (project_id);
alter table public.documents enable row level security;
create policy "documents_select_own" on public.documents
  for select using (user_id = auth.uid());
create policy "documents_insert_authenticated" on public.documents
  for insert with check (auth.uid() is not null and user_id = auth.uid());
create policy "documents_update_own" on public.documents
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "documents_delete_own" on public.documents
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- shares (public-link access to a project)
-- ---------------------------------------------------------------------------
create table public.shares (
  id           uuid primary key default gen_random_uuid(),
  token        text not null unique check (char_length(token) between 16 and 64),
  resource_id  uuid not null references public.projects(id) on delete cascade,
  created_by   uuid not null references auth.users(id) on delete cascade,
  expires_at   timestamptz,
  revoked      boolean not null default false,
  view_count   integer not null default 0 check (view_count >= 0),
  label        text check (char_length(label) <= 80),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index shares_resource_id_idx on public.shares (resource_id);
create index shares_created_by_idx on public.shares (created_by);
alter table public.shares enable row level security;
-- Owners can manage their own shares.
create policy "shares_select_own" on public.shares
  for select using (created_by = auth.uid());
create policy "shares_insert_authenticated" on public.shares
  for insert with check (auth.uid() is not null and created_by = auth.uid());
create policy "shares_update_own" on public.shares
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "shares_delete_own" on public.shares
  for delete using (created_by = auth.uid());
-- Anon read of a share by token is handled by the /api/shares/[token] route
-- using the service_role key, which bypasses RLS. That's by design: a share
-- link is meant to be publicly viewable without an account.

-- ---------------------------------------------------------------------------
-- contact_messages (public form, anon can insert, only service_role can read)
-- ---------------------------------------------------------------------------
create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) between 3 and 320),
  message    text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
create policy "contact_messages_insert_anon" on public.contact_messages
  for insert with check (true);
-- Reads are admin-only via service_role; no SELECT policy = anon/authenticated
-- cannot read at all.

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
create trigger inventory_set_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();
create trigger shares_set_updated_at
  before update on public.shares
  for each row execute function public.set_updated_at();
