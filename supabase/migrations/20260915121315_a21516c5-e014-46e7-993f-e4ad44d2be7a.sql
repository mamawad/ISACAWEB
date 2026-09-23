create policy "No public access to pm_roles" on public.pm_roles for all to anon, authenticated using (false) with check (false);
create policy "No public access to pm_users" on public.pm_users for all to anon, authenticated using (false) with check (false);
create policy "No public access to pm_projects" on public.pm_projects for all to anon, authenticated using (false) with check (false);
create policy "No public access to pm_project_members" on public.pm_project_members for all to anon, authenticated using (false) with check (false);
create policy "No public access to pm_tasks" on public.pm_tasks for all to anon, authenticated using (false) with check (false);
create policy "No public access to pm_comments" on public.pm_comments for all to anon, authenticated using (false) with check (false);
create policy "No public access to pm_activity" on public.pm_activity for all to anon, authenticated using (false) with check (false);
create policy "No public access to pm_files" on public.pm_files for all to anon, authenticated using (false) with check (false);