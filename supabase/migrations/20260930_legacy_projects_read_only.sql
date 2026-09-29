-- Run before reopening old-account migration. Existing projects and assets remain readable.
grant select on public.projects to authenticated;
revoke insert, update, delete on public.projects from authenticated;

drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;

drop policy if exists "project_assets_insert_own_folder" on storage.objects;
drop policy if exists "project_assets_update_own_folder" on storage.objects;
drop policy if exists "project_assets_delete_own_folder" on storage.objects;
