import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "live-photo-jobs";
const MAX_TOTAL_BYTES = 180 * 1024 * 1024;
const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const JOB_TTL_SECONDS = 60 * 60;
const allowedFileTypes: Record<string, string[]> = {
  video: ["video/mp4", "video/quicktime", "video/webm", "application/octet-stream"],
  page: ["image/png"],
  mask: ["image/png"],
};

type InputDescriptor = {
  key: "video" | "page" | "mask";
  name: string;
  type: string;
  size: number;
  path?: string;
};

function serviceRoleKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}") as Record<string, unknown>;
    if (typeof keys.default === "string") return keys.default;
    return Object.values(keys).find((value): value is string => typeof value === "string") || "";
  } catch {
    return "";
  }
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const admin = createClient(supabaseUrl, serviceRoleKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

function originAllowed(origin: string): boolean {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    if (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) return true;
    if (url.protocol !== "https:") return false;
    return url.hostname === "fawen.fun" || url.hostname === "www.fawen.fun" || url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": originAllowed(origin) && origin ? origin : "https://fawen.fun",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-worker-secret",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

function json(req: Request, status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeName(value: unknown, fallback: string): string {
  const cleaned = String(value || "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return cleaned || fallback;
}

function finiteNumber(value: unknown, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

function sanitizeManifest(value: unknown): Record<string, unknown> {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const manifest: Record<string, unknown> = {
    platform: input.platform === "wechat" ? "wechat" : "xhs",
    start: finiteNumber(input.start, 0, 0, 1800),
    cover_offset: finiteNumber(input.cover_offset, 0.2, 0, 4.95),
    focus_x: finiteNumber(input.focus_x, 50, 0, 100),
    focus_y: finiteNumber(input.focus_y, 50, 0, 100),
    well_x: Math.round(finiteNumber(input.well_x, 0, 0, 1080)),
    well_y: Math.round(finiteNumber(input.well_y, 0, 0, 1440)),
    well_width: Math.round(finiteNumber(input.well_width, 1080, 40, 1080)),
    well_height: Math.round(finiteNumber(input.well_height, 1440, 40, 1440)),
    title: String(input.title || "云端实况").slice(0, 48),
  };
  if (["crop_x", "crop_y", "crop_width", "crop_height"].every((key) => Number.isFinite(Number(input[key])))) {
    manifest.crop_x = finiteNumber(input.crop_x, 0, 0, 1);
    manifest.crop_y = finiteNumber(input.crop_y, 0, 0, 1);
    manifest.crop_width = finiteNumber(input.crop_width, 1, 0.01, 1);
    manifest.crop_height = finiteNumber(input.crop_height, 1, 0.01, 1);
  }
  return manifest;
}

async function requestUser(req: Request): Promise<{ id: string } | null> {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error || !data.user ? null : { id: data.user.id };
}

async function clientHash(req: Request, userId = ""): Promise<string> {
  if (userId) return sha256(`user:${userId}`);
  const forwarded = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const address = forwarded || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
  const salt = Deno.env.get("RATE_LIMIT_SALT") || "write-then-publish";
  return sha256(`${salt}:${address}`);
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const value = await req.json();
    return value && typeof value === "object" ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function validateFiles(value: unknown): InputDescriptor[] {
  if (!Array.isArray(value)) throw new Error("没有收到云端处理文件。");
  const seen = new Set<string>();
  const files: InputDescriptor[] = value.map((raw) => {
    const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const key = String(item.key || "") as InputDescriptor["key"];
    const name = safeName(item.name, `${key || "file"}.bin`);
    const type = String(item.type || "application/octet-stream").toLowerCase();
    const size = Math.round(Number(item.size) || 0);
    if (!allowedFileTypes[key] || seen.has(key)) throw new Error("云端处理文件类型重复或无效。");
    if (!allowedFileTypes[key].includes(type)) throw new Error(`${key} 文件格式不受支持。`);
    const maximum = key === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (size <= 0 || size > maximum) throw new Error(`${key} 文件为空或超过云端限制。`);
    seen.add(key);
    return { key, name, type, size };
  });
  if (!seen.has("video") || !seen.has("page") || !seen.has("mask")) {
    throw new Error("云端实况需要视频、卡片画面和裁剪遮罩。");
  }
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_BYTES) {
    throw new Error("本次云端处理文件合计超过 180MB。");
  }
  return files;
}

async function findJob(jobId: string, accessToken: string) {
  if (!/^[0-9a-f-]{36}$/i.test(jobId) || !accessToken) return null;
  const tokenHash = await sha256(accessToken);
  const { data } = await admin
    .from("live_photo_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("access_token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return data || null;
}

async function cleanupExpiredJobs(): Promise<void> {
  const { data: expired } = await admin
    .from("live_photo_jobs")
    .select("id,input_files,result_path")
    .lt("expires_at", new Date().toISOString())
    .limit(12);
  for (const job of expired || []) {
    const inputFiles = Array.isArray(job.input_files) ? job.input_files as InputDescriptor[] : [];
    const paths = inputFiles.map((file) => String(file.path || "")).filter(Boolean);
    if (job.result_path) paths.push(String(job.result_path));
    if (paths.length) await admin.storage.from(BUCKET).remove(paths);
    await admin.from("live_photo_jobs").delete().eq("id", job.id);
  }
}

async function createJob(req: Request, body: Record<string, unknown>): Promise<Response> {
  await cleanupExpiredJobs().catch(() => undefined);
  const files = validateFiles(body.files);
  const user = await requestUser(req);
  const fingerprint = await clientHash(req, user?.id || "");
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recent, error: recentError } = await admin
    .from("live_photo_jobs")
    .select("id,status")
    .eq("client_hash", fingerprint)
    .gte("created_at", since)
    .limit(12);
  if (recentError) return json(req, 500, { ok: false, error: "暂时无法检查云端任务额度。" });
  const active = (recent || []).some((job) => ["uploading", "queued", "processing"].includes(job.status));
  if (active) return json(req, 409, { ok: false, error: "已有一张实况正在云端处理，请等待完成后再试。" });
  const hourlyLimit = user ? 10 : 3;
  if ((recent || []).length >= hourlyLimit) {
    return json(req, 429, { ok: false, error: `云端处理较忙，每小时最多生成 ${hourlyLimit} 张，请稍后再试。` });
  }

  const id = crypto.randomUUID();
  const accessToken = randomToken();
  const storedFiles = files.map((file) => ({
    ...file,
    path: `jobs/${id}/input/${file.key}-${safeName(file.name, `${file.key}.bin`)}`,
  }));
  const { error: insertError } = await admin.from("live_photo_jobs").insert({
    id,
    user_id: user?.id || null,
    access_token_hash: await sha256(accessToken),
    client_hash: fingerprint,
    manifest: sanitizeManifest(body.manifest),
    input_files: storedFiles,
    expires_at: new Date(Date.now() + JOB_TTL_SECONDS * 1000).toISOString(),
  });
  if (insertError) return json(req, 500, { ok: false, error: "无法创建云端实况任务。" });

  const uploads = [];
  for (const file of storedFiles) {
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(file.path);
    if (error || !data) {
      await admin.from("live_photo_jobs").delete().eq("id", id);
      return json(req, 500, { ok: false, error: "无法准备云端上传地址。" });
    }
    uploads.push({ key: file.key, path: data.path || file.path, token: data.token, signedUrl: data.signedUrl });
  }
  return json(req, 201, { ok: true, job_id: id, access_token: accessToken, uploads });
}

async function startJob(req: Request, body: Record<string, unknown>): Promise<Response> {
  const job = await findJob(String(body.job_id || ""), String(body.access_token || ""));
  if (!job) return json(req, 404, { ok: false, error: "云端实况任务不存在或已经过期。" });
  if (["queued", "processing", "complete"].includes(job.status)) return json(req, 200, { ok: true, status: job.status });
  const inputFiles = Array.isArray(job.input_files) ? job.input_files as InputDescriptor[] : [];
  const { data: objects, error: listError } = await admin.storage.from(BUCKET).list(`jobs/${job.id}/input`, { limit: 10 });
  const names = new Set((objects || []).map((item) => item.name));
  if (listError || inputFiles.some((file) => !names.has(String(file.path || "").split("/").pop() || ""))) {
    return json(req, 400, { ok: false, error: "视频或卡片文件没有上传完整，请重新尝试。" });
  }

  await admin.from("live_photo_jobs").update({ status: "queued", progress: 5, stage: "等待云端 Mac" }).eq("id", job.id);
  const githubRepo = Deno.env.get("GITHUB_REPO") || "fxyadela/write-then-publish";
  const dispatchToken = Deno.env.get("GITHUB_DISPATCH_TOKEN") || "";
  if (!dispatchToken) {
    await admin.from("live_photo_jobs").update({ status: "failed", error_message: "云端处理器尚未配置。" }).eq("id", job.id);
    return json(req, 503, { ok: false, error: "云端处理器尚未完成配置。" });
  }
  const response = await fetch(`https://api.github.com/repos/${githubRepo}/dispatches`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${dispatchToken}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "write-then-publish-cloud",
    },
    body: JSON.stringify({ event_type: "cloud-live-photo", client_payload: { job_id: job.id } }),
  });
  if (!response.ok) {
    await admin.from("live_photo_jobs").update({ status: "failed", error_message: "无法启动云端处理器。" }).eq("id", job.id);
    return json(req, 502, { ok: false, error: "云端处理器没有启动，请稍后重试。" });
  }
  return json(req, 202, { ok: true, status: "queued" });
}

async function jobStatus(req: Request, body: Record<string, unknown>): Promise<Response> {
  const job = await findJob(String(body.job_id || ""), String(body.access_token || ""));
  if (!job) return json(req, 404, { ok: false, error: "云端实况任务不存在或已经过期。" });
  const payload: Record<string, unknown> = {
    ok: true,
    job_id: job.id,
    status: job.status,
    progress: job.progress,
    stage: job.stage,
    error: job.error_message || "",
    archive_name: job.result_name || "",
    archive_bytes: Number(job.result_bytes || 0),
  };
  if (job.status === "complete" && job.result_path) {
    const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(job.result_path, JOB_TTL_SECONDS, {
      download: job.result_name || "写了就发-云端实况.zip",
    });
    if (!error && data) payload.archive_url = data.signedUrl;
  }
  return json(req, 200, payload);
}

function workerAuthorized(req: Request): boolean {
  const expected = Deno.env.get("CLOUD_JOB_SECRET") || "";
  return Boolean(expected && req.headers.get("x-worker-secret") === expected);
}

async function workerJob(req: Request, body: Record<string, unknown>): Promise<Response> {
  if (!workerAuthorized(req)) return json(req, 403, { ok: false, error: "Worker unauthorized" });
  const jobId = String(body.job_id || "");
  const { data: job } = await admin.from("live_photo_jobs").select("*").eq("id", jobId).maybeSingle();
  if (!job) return json(req, 404, { ok: false, error: "Job not found" });
  const inputFiles = Array.isArray(job.input_files) ? job.input_files as InputDescriptor[] : [];
  const inputs = [];
  for (const file of inputFiles) {
    const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(String(file.path), 30 * 60);
    if (error || !data) return json(req, 500, { ok: false, error: "Cannot sign worker input" });
    inputs.push({ ...file, signed_url: data.signedUrl });
  }
  const outputPath = `jobs/${job.id}/output/result.zip`;
  const { data: upload, error: uploadError } = await admin.storage.from(BUCKET).createSignedUploadUrl(outputPath, { upsert: true });
  if (uploadError || !upload) return json(req, 500, { ok: false, error: "Cannot sign worker output" });
  await admin.from("live_photo_jobs").update({ status: "processing", progress: 10, stage: "云端 Mac 已启动" }).eq("id", job.id);
  return json(req, 200, {
    ok: true,
    job_id: job.id,
    manifest: job.manifest,
    inputs,
    output: { path: outputPath, token: upload.token, signed_url: upload.signedUrl },
  });
}

async function workerUpdate(req: Request, body: Record<string, unknown>): Promise<Response> {
  if (!workerAuthorized(req)) return json(req, 403, { ok: false, error: "Worker unauthorized" });
  const jobId = String(body.job_id || "");
  const status = String(body.status || "processing");
  if (!/^[0-9a-f-]{36}$/i.test(jobId) || !["processing", "complete", "failed"].includes(status)) {
    return json(req, 400, { ok: false, error: "Invalid worker update" });
  }
  const { data: job } = await admin.from("live_photo_jobs").select("input_files").eq("id", jobId).maybeSingle();
  if (!job) return json(req, 404, { ok: false, error: "Job not found" });
  const progress = status === "complete" ? 100 : Math.round(finiteNumber(body.progress, 10, 0, 99));
  const update: Record<string, unknown> = {
    status,
    progress,
    stage: String(body.stage || (status === "complete" ? "下载包已完成" : status === "failed" ? "处理失败" : "正在处理")).slice(0, 120),
  };
  if (status === "complete") {
    update.result_path = `jobs/${jobId}/output/result.zip`;
    update.result_name = safeName(body.result_name, "写了就发-云端实况.zip");
    update.result_bytes = Math.max(1, Math.round(Number(body.result_bytes) || 0));
    update.error_message = null;
  } else if (status === "failed") {
    update.error_message = String(body.error || "云端处理失败，请重新尝试。").slice(0, 500);
  }
  await admin.from("live_photo_jobs").update(update).eq("id", jobId);
  if (["complete", "failed"].includes(status)) {
    const inputFiles = Array.isArray(job.input_files) ? job.input_files as InputDescriptor[] : [];
    const paths = inputFiles.map((file) => String(file.path || "")).filter(Boolean);
    if (paths.length) await admin.storage.from(BUCKET).remove(paths);
  }
  return json(req, 200, { ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  const origin = req.headers.get("origin") || "";
  if (!originAllowed(origin)) return json(req, 403, { ok: false, error: "当前网页来源不能使用云端实况服务。" });
  if (req.method !== "POST") return json(req, 405, { ok: false, error: "请求方式不受支持。" });
  const body = await readBody(req);
  const action = String(body.action || "");
  try {
    if (action === "create") return await createJob(req, body);
    if (action === "start") return await startJob(req, body);
    if (action === "status") return await jobStatus(req, body);
    if (action === "worker_job") return await workerJob(req, body);
    if (action === "worker_update") return await workerUpdate(req, body);
    return json(req, 404, { ok: false, error: "云端实况接口不存在。" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "云端实况服务异常。";
    return json(req, 400, { ok: false, error: message });
  }
});
