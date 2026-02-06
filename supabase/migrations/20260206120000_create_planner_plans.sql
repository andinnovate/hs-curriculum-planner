create table if not exists public.planner_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists planner_plans_user_id_idx on public.planner_plans (user_id);

alter table public.planner_plans enable row level security;

create policy "Users can view their plans"
  on public.planner_plans
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their plans"
  on public.planner_plans
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their plans"
  on public.planner_plans
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their plans"
  on public.planner_plans
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_planner_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_planner_plans_updated_at
before update on public.planner_plans
for each row
execute function public.set_planner_plans_updated_at();
