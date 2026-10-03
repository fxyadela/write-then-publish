-- Temporary, read-only cloud migration for the existing test account.
-- Keep all old draft rows and assets. Avatar and nickname policies are unchanged.
begin;

grant select on public.projects to authenticated;
revoke insert, update, delete on public.projects from public, anon, authenticated;

drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
  on public.projects for select to authenticated
  using (
    (select auth.uid()) = user_id
    and user_id = 'd1f516ce-099d-4615-a6e6-f78de883bad4'::uuid
  );

drop policy if exists "project_assets_insert_own_folder" on storage.objects;
drop policy if exists "project_assets_update_own_folder" on storage.objects;
drop policy if exists "project_assets_delete_own_folder" on storage.objects;
drop policy if exists "project_assets_select_own_folder" on storage.objects;
create policy "project_assets_select_own_folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select auth.uid()) = 'd1f516ce-099d-4615-a6e6-f78de883bad4'::uuid
  );

commit;
