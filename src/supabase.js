(function initializeWriteThenPublishCloud() {
  const config = window.WRITE_THEN_PUBLISH_SUPABASE || {};
  const url = String(config.url || "").trim().replace(/\/$/, "");
  const publishableKey = String(config.publishableKey || "").trim();
  const configPresent = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) && publishableKey.length > 20;
  const sdk = window.supabase;
  const configured = Boolean(configPresent && sdk?.createClient);
  const client = configured
    ? sdk.createClient(url, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

  function requireClient() {
    if (!client) throw new Error("Supabase 尚未配置，请先填写项目 URL 和 publishable key。");
    return client;
  }

  function throwIfError(error) {
    if (error) throw error;
  }

  function redirectUrl() {
    if (window.location.protocol === "https:" && window.location.hostname) {
      return `${window.location.origin}${window.location.pathname}`;
    }
    return "https://fawen.fun/";
  }

  async function signUp(email, password) {
    const { data, error } = await requireClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl() },
    });
    throwIfError(error);
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await requireClient().auth.signInWithPassword({ email, password });
    throwIfError(error);
    return data;
  }

  async function signInWithGoogle(migrationOnly = false) {
    if (migrationOnly && (!(await googleProviderIsEnabled(true)) || !(await migrationWindowOpen()))) {
      throw new Error("Google 旧账号迁移暂未开放，请稍后再试。");
    }
    const { error } = await requireClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl() },
    });
    if (error && /provider is not enabled/i.test(String(error.message || ""))) {
      throw new Error("Google 登录暂未启用，请使用邮箱登录。");
    }
    throwIfError(error);
  }

  /**
   * Google 按钮必须同时满足两件事：
   * 1) Supabase 后台已启用 Google Provider；2) 当前网络能直连 Google。
   * 只检查第 2 点会让用户看到一个必定返回 400 的按钮。
   */
  let googleProviderEnabled = null;
  let signupsDisabled = null;
  let googleReachable = null;
  // 项目超出免费额度被限流时，所有接口都返回 402；记下来好让界面提前说明。
  let serviceRestricted = false;

  async function googleProviderIsEnabled(refresh = false) {
    if (!configured) return false;
    if (!refresh && googleProviderEnabled !== null) return googleProviderEnabled;
    let timer;
    try {
      const controller = new AbortController();
      timer = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${url}/auth/v1/settings`, {
        headers: { apikey: publishableKey },
        cache: "no-store",
        signal: controller.signal,
      });
      if (response.status === 402) serviceRestricted = true;
      if (!response.ok) throw new Error(`settings request failed: ${response.status}`);
      const settings = await response.json();
      googleProviderEnabled = settings?.external?.google === true;
      signupsDisabled = settings?.disable_signup === true;
    } catch {
      // 无法确认配置时不展示入口，避免让用户点进一个不可用的登录方式。
      googleProviderEnabled = false;
      signupsDisabled = false;
    } finally {
      clearTimeout(timer);
    }
    return googleProviderEnabled;
  }

  async function googleSignInAvailable(migrationOnly = false) {
    if (!(await googleProviderIsEnabled()) || (migrationOnly && !(await migrationWindowOpen()))) return false;
    if (googleReachable !== null) return googleReachable;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      // no-cors 拿到的是不透明响应，读不了内容，但请求成功本身就说明连得上。
      await fetch("https://accounts.google.com/generate_204", {
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timer);
      googleReachable = true;
    } catch {
      googleReachable = false;
    }
    return googleReachable;
  }

  async function migrationWindowOpen() {
    try {
      const policy = await getAccountPolicy();
      return policy?.migration_open === true;
    } catch { return false; }
  }

  async function resendSignUp(email) {
    const { data, error } = await requireClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectUrl() },
    });
    throwIfError(error);
    return data;
  }

  async function sendPasswordReset(email) {
    // 回跳带上标记，落地后才知道这次是来改密码的，而不是普通登录。
    const { error } = await requireClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectUrl()}?reset=1`,
    });
    throwIfError(error);
  }

  async function updatePassword(password) {
    const { error } = await requireClient().auth.updateUser({ password });
    throwIfError(error);
  }

  async function signOut() {
    const { error } = await requireClient().auth.signOut();
    throwIfError(error);
  }

  async function signOutLocal() {
    const { error } = await requireClient().auth.signOut({ scope: "local" });
    throwIfError(error);
  }

  async function getSession() {
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    throwIfError(error);
    return data.session || null;
  }

  async function setSession(session) {
    const accessToken = String(session?.access_token || "").trim();
    const refreshToken = String(session?.refresh_token || "").trim();
    if (!accessToken || !refreshToken) throw new Error("这个账号的登录状态已失效，请重新登录。");
    const { data, error } = await requireClient().auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    throwIfError(error);
    return data;
  }

  function onAuthStateChange(callback) {
    if (!client) return () => {};
    const { data } = client.auth.onAuthStateChange((event, session) => callback(event, session));
    return () => data.subscription.unsubscribe();
  }

  async function getProfile() {
    const { data, error } = await requireClient()
      .from("profiles")
      .select("user_id,display_name,avatar_url,updated_at")
      .maybeSingle();
    throwIfError(error);
    return data || null;
  }

  async function getAccountPolicy() {
    const { data, error } = await requireClient().rpc("account_runtime_policy");
    throwIfError(error);
    return data;
  }

  async function upsertProfile(profile) {
    const user = (await requireClient().auth.getUser()).data.user;
    if (!user) throw new Error("登录状态已失效，请重新登录。");
    const payload = {
      user_id: user.id,
      display_name: profile.displayName,
      updated_at: new Date().toISOString(),
    };
    if (profile.avatarUrl !== undefined) payload.avatar_url = profile.avatarUrl || null;
    const { data, error } = await requireClient()
      .from("profiles")
      .upsert(payload, { onConflict: "user_id", defaultToNull: false })
      .select("user_id,display_name,avatar_url,updated_at")
      .single();
    throwIfError(error);
    return data;
  }

  async function listProjects() {
    const rows = [];
    const pageSize = 200;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await requireClient()
        .from("projects")
        .select("id,title,data,updated_at")
        .order("updated_at", { ascending: false })
        .order("id", { ascending: true })
        .range(offset, offset + pageSize - 1);
      throwIfError(error);
      rows.push(...(data || []));
      if (!data || data.length < pageSize) return rows;
    }
  }

  async function uploadAvatar(dataUrl) {
    const user = (await requireClient().auth.getUser()).data.user;
    if (!user) throw new Error("登录状态已失效，请重新登录。");
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/avatar.${extension}`;
    const { error } = await requireClient().storage.from("avatars").upload(path, blob, {
      upsert: true,
      contentType: blob.type || "image/jpeg",
      cacheControl: "3600",
    });
    throwIfError(error);
    const { data } = requireClient().storage.from("avatars").getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async function downloadProjectAsset(path) {
    const { data, error } = await requireClient().storage.from("project-assets").download(path);
    throwIfError(error);
    return data;
  }

  async function invokeLivePhotoFunction(action, payload = {}) {
    const session = await getSession();
    const response = await fetch(`${url}/functions/v1/live-photo-jobs`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${session?.access_token || publishableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, ...payload }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "云端实况服务暂时不可用。");
    }
    return result;
  }

  async function getCloudLivePhotoJob(jobId, accessToken) {
    return invokeLivePhotoFunction("status", {
      job_id: jobId,
      access_token: accessToken,
    });
  }

  async function cancelCloudLivePhotoJob(jobId, accessToken) {
    return invokeLivePhotoFunction("cancel", {
      job_id: jobId,
      access_token: accessToken,
    });
  }

  async function createCloudLivePhotoJob(files, manifest, onProgress = null) {
    const entries = Object.entries(files || {}).filter(([, file]) => file?.blob instanceof Blob);
    const descriptors = entries.map(([key, file]) => ({
      key,
      name: file.name || `${key}.bin`,
      type: file.blob.type || "application/octet-stream",
      size: file.blob.size,
    }));
    onProgress?.({ stage: "create", progress: 4, detail: "正在创建安全的云端处理任务…" });
    const created = await invokeLivePhotoFunction("create", { files: descriptors, manifest });
    const cancel = () => invokeLivePhotoFunction("cancel", {
      job_id: created.job_id,
      access_token: created.access_token,
    });
    onProgress?.({
      stage: "created",
      progress: 4,
      detail: "云端任务已创建，正在上传素材…",
      jobId: created.job_id,
      cancel,
    });
    let started = false;
    try {
      const uploads = new Map((created.uploads || []).map((upload) => [upload.key, upload]));
      // 视频、卡片、遮罩互不依赖，串行上传等于把三段等待时间相加；并行让它们共用同一条上行带宽。
      let finished = 0;
      onProgress?.({ stage: "upload", progress: 8, detail: "正在安全上传原视频，不会压缩画质…" });
      await Promise.all(entries.map(async ([key, file]) => {
        const upload = uploads.get(key);
        if (!upload?.path || !upload?.token) throw new Error(`云端没有准备 ${key} 上传地址。`);
        const { error } = await requireClient().storage.from("live-photo-jobs").uploadToSignedUrl(
          upload.path,
          upload.token,
          file.blob,
          { contentType: file.blob.type || "application/octet-stream", cacheControl: "3600" },
        );
        throwIfError(error);
        finished += 1;
        onProgress?.({
          stage: "upload",
          progress: 8 + Math.round((finished / entries.length) * 22),
          detail: finished === entries.length
            ? "素材已全部上传，正在启动云端 Mac…"
            : "正在安全上传原视频，不会压缩画质…",
        });
      }));
      onProgress?.({ stage: "queue", progress: 32, detail: "文件上传完成，正在启动云端 Mac…" });
      await invokeLivePhotoFunction("start", {
        job_id: created.job_id,
        access_token: created.access_token,
      });
      started = true;

      const deadline = Date.now() + 15 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise((resolve) => window.setTimeout(resolve, 1800));
        const status = await getCloudLivePhotoJob(created.job_id, created.access_token);
        onProgress?.({
          stage: status.status,
          progress: Math.max(32, Number(status.progress) || 32),
          detail: status.stage || "云端正在处理实况照片…",
        });
        if (status.status === "complete" && status.archive_url) {
          return {
            ...status,
            provider: "cloud",
            cloud_access_token: created.access_token,
          };
        }
        if (status.status === "failed") {
          throw new Error(status.error || "云端实况生成失败，请重新尝试。");
        }
      }
      throw new Error("云端实况处理超过 15 分钟，请稍后重新尝试。");
    } catch (error) {
      if (!started) {
        await invokeLivePhotoFunction("cancel", {
          job_id: created.job_id,
          access_token: created.access_token,
        }).catch(() => undefined);
      }
      throw error;
    }
  }

  window.WriteThenPublishCloud = {
    configured,
    livePhotoConfigured: configured,
    configurationError: configured
      ? ""
      : configPresent
        ? "Supabase SDK 加载失败，请检查网络后刷新页面。"
        : "请在 src/supabase-config.js 填写 Supabase 项目 URL 和 publishable key。",
    signUp,
    signIn,
    signInWithGoogle,
    googleSignInAvailable,
    isServiceRestricted: () => serviceRestricted,
    resendSignUp,
    sendPasswordReset,
    updatePassword,
    signOut,
    signOutLocal,
    getSession,
    setSession,
    onAuthStateChange,
    getProfile,
    getAccountPolicy,
    upsertProfile,
    listProjects,
    uploadAvatar,
    downloadProjectAsset,
    createCloudLivePhotoJob,
    getCloudLivePhotoJob,
    cancelCloudLivePhotoJob,
  };
})();
