drop policy if exists "Admins can manage unit subcategory hours" on public.unit_subcategory_hours;
drop policy if exists "Admins can manage option groups" on public.unit_option_groups;
drop policy if exists "Admins can manage option choices" on public.unit_option_choices;
drop policy if exists "Admins can manage optional items" on public.unit_optional_items;

create policy "Admins can manage unit subcategory hours"
  on public.unit_subcategory_hours
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can manage option groups"
  on public.unit_option_groups
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can manage option choices"
  on public.unit_option_choices
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can manage optional items"
  on public.unit_optional_items
  for all
  using (public.is_admin())
  with check (public.is_admin());
