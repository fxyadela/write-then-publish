-- Migration closes after 2026-10-31, Asia/Shanghai.
-- All legacy accounts can read their own drafts during the window.
-- This migration never deletes originals and never permits draft/media writes.
begin;

create or replace function public.account_runtime_policy()
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'migration_open', now() < timestamptz '2026-11-01 00:00:00+08',
    'registration_open', true,
    'migration_end_at', '2026-11-01T00:00:00+08:00',
    'server_time', now()
  );
$$;
revoke all on function public.account_runtime_policy() from public;
grant execute on function public.account_runtime_policy() to anon, authenticated;

alter table public.projects enable row level security;
revoke all on public.projects from public, anon, authenticated;
grant select on public.projects to authenticated;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects for select to authenticated
using ((select auth.uid()) = user_id
  and (select now()) < timestamptz '2026-11-01 00:00:00+08');

drop policy if exists "project_assets_insert_own_folder" on storage.objects;
drop policy if exists "project_assets_update_own_folder" on storage.objects;
drop policy if exists "project_assets_delete_own_folder" on storage.objects;
drop policy if exists "project_assets_select_own_folder" on storage.objects;
create policy "project_assets_select_own_folder" on storage.objects for select to authenticated
using (bucket_id = 'project-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select now()) < timestamptz '2026-11-01 00:00:00+08');

-- Older profile fields, if present, cannot be read or written by the client.
revoke all on public.profiles from public, anon, authenticated;
grant select (user_id, display_name, avatar_url, updated_at) on public.profiles to authenticated;
grant insert (user_id, display_name, avatar_url, updated_at) on public.profiles to authenticated;
grant update (user_id, display_name, avatar_url, updated_at) on public.profiles to authenticated;

-- Existing cloud Live Photo endpoints use a service role. Stop job creation
-- before those endpoints can issue signed uploads, while preserving old jobs.
create or replace function public.reject_new_cloud_media_jobs()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception '云端文章与素材存储已停用，请使用本机实况导出。';
end;
$$;
revoke all on function public.reject_new_cloud_media_jobs() from public, anon, authenticated;
do $$
begin
  if to_regclass('public.live_photo_jobs') is not null then
    execute 'drop trigger if exists reject_new_cloud_media_jobs on public.live_photo_jobs';
    execute 'create trigger reject_new_cloud_media_jobs before insert on public.live_photo_jobs for each row execute function public.reject_new_cloud_media_jobs()';
  end if;
end;
$$;

commit;
