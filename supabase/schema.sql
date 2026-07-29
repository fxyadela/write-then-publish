-- 写了就发：Supabase 初始化脚本
-- 在 Supabase Dashboard -> SQL Editor 中完整运行一次。

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '未命名作者',
  handle text not null default '@profile',
  avatar_url text,
  avatar_crop jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  title text not null default '未命名图文',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists projects_user_updated_idx
  on public.projects (user_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
  on public.projects for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
  on public.projects for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
  on public.projects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
  on public.projects for delete to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-assets',
  'project-assets',
  false,
  367001600,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/quicktime', 'video/webm', 'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatar_insert_own_folder" on storage.objects;
create policy "avatar_insert_own_folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatar_select_own_folder" on storage.objects;
create policy "avatar_select_own_folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatar_update_own_folder" on storage.objects;
create policy "avatar_update_own_folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatar_delete_own_folder" on storage.objects;
create policy "avatar_delete_own_folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "project_assets_insert_own_folder" on storage.objects;
create policy "project_assets_insert_own_folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "project_assets_select_own_folder" on storage.objects;
create policy "project_assets_select_own_folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "project_assets_update_own_folder" on storage.objects;
create policy "project_assets_update_own_folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "project_assets_delete_own_folder" on storage.objects;
create policy "project_assets_delete_own_folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
