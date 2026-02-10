create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select
    exists (
      select 1
      from public.app_admins
      where user_id = auth.uid()
    )
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    or coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin';
$$;
