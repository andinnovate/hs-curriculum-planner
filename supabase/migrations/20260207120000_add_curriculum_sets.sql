create table if not exists public.curriculum_sets (
  id text primary key,
  name text not null,
  provider text not null,
  logo_url text,
  description text,
  created_at timestamptz not null default now()
);

alter table public.curriculum_sets enable row level security;
create policy "Allow read for all" on public.curriculum_sets for select using (true);

insert into public.curriculum_sets (id, name, provider, logo_url, description)
values (
  'gatherround',
  'Gather ''Round',
  'Gather ''Round Homeschool',
  '/providers/gatherround.png',
  'Unit studies curriculum library'
)
on conflict (id) do nothing;

alter table public.unit_subcategory_hours
  add column if not exists curriculum_id text;
update public.unit_subcategory_hours
  set curriculum_id = 'gatherround'
  where curriculum_id is null;
alter table public.unit_subcategory_hours
  alter column curriculum_id set not null;
alter table public.unit_subcategory_hours
  add constraint unit_subcategory_hours_curriculum_fk
  foreign key (curriculum_id) references public.curriculum_sets(id);
create index if not exists idx_ush_curriculum on public.unit_subcategory_hours(curriculum_id);

alter table public.unit_option_groups
  add column if not exists curriculum_id text;
update public.unit_option_groups
  set curriculum_id = 'gatherround'
  where curriculum_id is null;
alter table public.unit_option_groups
  alter column curriculum_id set not null;
alter table public.unit_option_groups
  add constraint unit_option_groups_curriculum_fk
  foreign key (curriculum_id) references public.curriculum_sets(id);
create index if not exists idx_uog_curriculum on public.unit_option_groups(curriculum_id);

alter table public.unit_optional_items
  add column if not exists curriculum_id text;
update public.unit_optional_items
  set curriculum_id = 'gatherround'
  where curriculum_id is null;
alter table public.unit_optional_items
  alter column curriculum_id set not null;
alter table public.unit_optional_items
  add constraint unit_optional_items_curriculum_fk
  foreign key (curriculum_id) references public.curriculum_sets(id);
create index if not exists idx_uoi_curriculum on public.unit_optional_items(curriculum_id);

alter table public.unit_option_choices
  add column if not exists curriculum_id text;
update public.unit_option_choices c
  set curriculum_id = g.curriculum_id
  from public.unit_option_groups g
  where c.option_group_id = g.id and c.curriculum_id is null;
update public.unit_option_choices
  set curriculum_id = 'gatherround'
  where curriculum_id is null;
alter table public.unit_option_choices
  alter column curriculum_id set not null;
alter table public.unit_option_choices
  add constraint unit_option_choices_curriculum_fk
  foreign key (curriculum_id) references public.curriculum_sets(id);
create index if not exists idx_uoc_curriculum on public.unit_option_choices(curriculum_id);
