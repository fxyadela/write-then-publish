-- project-assets 之前单文件放到 350MB，而 Supabase 免费额度总共只有 1GB：
-- 三个人各传一个大视频就能把整个项目的存储占满。
-- 客户端本来就只允许 80MB（MAX_CLOUD_BACKUP_VIDEO_BYTES），两边对齐即可，
-- 顺便让绕过前端直接调 API 的请求也受同一条限制。
update storage.buckets
set file_size_limit = 83886080
where id = 'project-assets';
