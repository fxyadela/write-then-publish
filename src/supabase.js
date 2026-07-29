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

  async function resendSignUp(email) {
    const { data, error } = await requireClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectUrl() },
    });
    throwIfError(error);
    return data;
  }

  async function signOut() {
    const { error } = await requireClient().auth.signOut();
    throwIfError(error);
  }

  async function getSession() {
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    throwIfError(error);
    return data.session || null;
  }

  function onAuthStateChange(callback) {
    if (!client) return () => {};
    const { data } = client.auth.onAuthStateChange((event, session) => callback(event, session));
    return () => data.subscription.unsubscribe();
  }

  async function getProfile() {
    const { data, error } = await requireClient()
      .from("profiles")
      .select("user_id,display_name,handle,avatar_url,avatar_crop,updated_at")
      .maybeSingle();
    throwIfError(error);
    return data || null;
  }

  async function upsertProfile(profile) {
    const user = (await requireClient().auth.getUser()).data.user;
    if (!user) throw new Error("登录状态已失效，请重新登录。");
    const payload = {
      user_id: user.id,
      display_name: profile.displayName,
      handle: profile.handle,
      avatar_crop: profile.avatarCrop || null,
      updated_at: new Date().toISOString(),
    };
    if (profile.avatarUrl !== undefined) payload.avatar_url = profile.avatarUrl || null;
    const { data, error } = await requireClient()
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("user_id,display_name,handle,avatar_url,avatar_crop,updated_at")
      .single();
    throwIfError(error);
    return data;
  }

  async function listProjects() {
    const { data, error } = await requireClient()
      .from("projects")
      .select("id,title,data,updated_at")
      .order("updated_at", { ascending: false });
    throwIfError(error);
    return data || [];
  }

  async function upsertProjects(projects) {
    if (!projects.length) return [];
    const user = (await requireClient().auth.getUser()).data.user;
    if (!user) throw new Error("登录状态已失效，请重新登录。");
    const rows = projects.map((project) => ({
      id: project.id,
      user_id: user.id,
      title: project.title || "未命名图文",
      data: project.data,
      updated_at: new Date(Number(project.updatedAt) || Date.now()).toISOString(),
    }));
    const { data, error } = await requireClient()
      .from("projects")
      .upsert(rows, { onConflict: "user_id,id" })
      .select("id,title,data,updated_at");
    throwIfError(error);
    return data || [];
  }

  async function deleteProject(projectId) {
    const { error } = await requireClient().from("projects").delete().eq("id", projectId);
    throwIfError(error);
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

  function safeStorageName(value, fallback = "asset") {
    const normalized = String(value || "")
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90);
    return normalized || fallback;
  }

  function extensionForBlob(blob, fileName = "") {
    const named = String(fileName).match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
    if (named) return named;
    const mime = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "video/webm": "webm",
    };
    return mime[blob.type] || "bin";
  }

  async function uploadProjectAsset(projectId, assetId, blob, fileName = "") {
    const user = (await requireClient().auth.getUser()).data.user;
    if (!user) throw new Error("登录状态已失效，请重新登录。");
    const extension = extensionForBlob(blob, fileName);
    const baseName = safeStorageName(String(fileName || "").replace(/\.[^.]+$/, ""), safeStorageName(assetId));
    const path = `${user.id}/${safeStorageName(projectId)}/${safeStorageName(assetId)}/${baseName}.${extension}`;
    const { error } = await requireClient().storage.from("project-assets").upload(path, blob, {
      upsert: true,
      contentType: blob.type || "application/octet-stream",
      cacheControl: "3600",
    });
    throwIfError(error);
    return path;
  }

  async function downloadProjectAsset(path) {
    const { data, error } = await requireClient().storage.from("project-assets").download(path);
    throwIfError(error);
    return data;
  }

  async function deleteProjectAssets(projectId) {
    const user = (await requireClient().auth.getUser()).data.user;
    if (!user) throw new Error("登录状态已失效，请重新登录。");
    const root = `${user.id}/${safeStorageName(projectId)}`;
    const { data: folders, error: foldersError } = await requireClient().storage.from("project-assets").list(root, { limit: 1000 });
    throwIfError(foldersError);
    const paths = [];
    for (const entry of folders || []) {
      if (entry.id) {
        paths.push(`${root}/${entry.name}`);
        continue;
      }
      const folderPath = `${root}/${entry.name}`;
      const { data: files, error } = await requireClient().storage.from("project-assets").list(folderPath, { limit: 1000 });
      throwIfError(error);
      for (const file of files || []) {
        if (file.id) paths.push(`${folderPath}/${file.name}`);
      }
    }
    for (let index = 0; index < paths.length; index += 100) {
      const { error } = await requireClient().storage.from("project-assets").remove(paths.slice(index, index + 100));
      throwIfError(error);
    }
  }

  window.WriteThenPublishCloud = {
    configured,
    configurationError: configured
      ? ""
      : configPresent
        ? "Supabase SDK 加载失败，请检查网络后刷新页面。"
        : "请在 src/supabase-config.js 填写 Supabase 项目 URL 和 publishable key。",
    signUp,
    signIn,
    resendSignUp,
    signOut,
    getSession,
    onAuthStateChange,
    getProfile,
    upsertProfile,
    listProjects,
    upsertProjects,
    deleteProject,
    uploadAvatar,
    uploadProjectAsset,
    downloadProjectAsset,
    deleteProjectAssets,
  };
})();
