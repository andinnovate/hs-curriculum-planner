create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.app_admins where user_id = auth.uid()
  );
$$;

create policy "Admins can read admin list"
  on public.app_admins
  for select
  using (public.is_admin());

create policy "Admins can manage admin list"
  on public.app_admins
  for all
  using (public.is_admin())
  with check (public.is_admin());
