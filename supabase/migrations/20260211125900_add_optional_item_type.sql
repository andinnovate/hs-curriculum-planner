alter table public.unit_optional_items
  add column if not exists type text;

update public.unit_optional_items
  set type = 'Optional work'
  where type is null;

alter table public.unit_optional_items
  alter column type set default 'Optional work';

alter table public.unit_optional_items
  alter column type set not null;
