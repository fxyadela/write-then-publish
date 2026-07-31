-- 写了就发：云端 Live Photo 任务队列

create table if not exists public.live_photo_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  access_token_hash text not null,
  client_hash text not null,
  status text not null default 'uploading'
    check (status in ('uploading', 'queued', 'processing', 'complete', 'failed')),
  progress integer not null default 0 check (progress between 0 and 100),
  stage text not null default '等待上传',
  manifest jsonb not null default '{}'::jsonb,
  input_files jsonb not null default '[]'::jsonb,
  result_path text,
  result_name text,
  result_bytes bigint,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour')
);

create index if not exists live_photo_jobs_client_created_idx
  on public.live_photo_jobs (client_hash, created_at desc);

create index if not exists live_photo_jobs_status_created_idx
  on public.live_photo_jobs (status, created_at);

alter table public.live_photo_jobs enable row level security;
revoke all on public.live_photo_jobs from anon, authenticated;

create or replace function public.touch_live_photo_job_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists live_photo_jobs_touch_updated_at on public.live_photo_jobs;
create trigger live_photo_jobs_touch_updated_at
before update on public.live_photo_jobs
for each row execute function public.touch_live_photo_job_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'live-photo-jobs',
  'live-photo-jobs',
  false,
  188743680,
  array[
    'image/jpeg', 'image/png',
    'video/mp4', 'video/quicktime', 'video/webm',
    'application/zip', 'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
