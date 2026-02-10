create policy "Users can read own admin row"
  on public.app_admins
  for select
  using (auth.uid() = user_id);
