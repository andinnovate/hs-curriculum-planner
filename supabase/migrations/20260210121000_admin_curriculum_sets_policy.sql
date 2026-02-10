drop policy if exists "Admins can manage curriculum sets" on public.curriculum_sets;

create policy "Admins can manage curriculum sets"
  on public.curriculum_sets
  for all
  using (public.is_admin())
  with check (public.is_admin());
