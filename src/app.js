const CANVAS_WIDTH = 864;
const CANVAS_HEIGHT = 1152;
const STORAGE_KEY = "graphicTextLayoutState.v1";

const $ = (selector) => document.querySelector(selector);

const els = {
  content: $("#contentInput"),
  pages: $("#pages"),
  pageCount: $("#pageCount"),
  status: $("#statusText"),
  themeToggle: $("#themeToggleBtn"),
  downloadZip: $("#downloadZipBtn"),
  rerender: $("#rerenderBtn"),
  scrollMode: $("#scrollModeBtn"),
  contentImage: $("#contentImageInput"),
  inlineColor: $("#inlineColorInput"),
  colorMenu: $("#colorMenu"),
  colorTool: $(".color-tool"),
  colorGuide: $("#colorGuide"),
  colorConfirm: $("#colorConfirmBtn"),
  colorCancel: $("#colorCancelBtn"),
  find: $("#findInput"),
  replace: $("#replaceInput"),
  findNext: $("#findNextBtn"),
  replaceOne: $("#replaceOneBtn"),
  replaceAll: $("#replaceAllBtn"),
  avatarInput: $("#avatarInput"),
  avatarPreview: $("#avatarPreview"),
  cropAvatar: $("#cropAvatarBtn"),
  imageList: $("#imageList"),
  displayName: $("#displayNameInput"),
  handle: $("#handleInput"),
  textColor: $("#textColorInput"),
  accentColor: $("#accentColorInput"),
  bgColor: $("#bgColorInput"),
  fontSize: $("#fontSizeInput"),
  lineHeight: $("#lineHeightInput"),
  zhFont: $("#zhFontInput"),
  enFont: $("#enFontInput"),
  imageHeight: $("#imageHeightInput"),
  cropModal: $("#cropModal"),
  cropCanvas: $("#cropCanvas"),
  cropTitle: $("#cropTitle"),
  cropSubtitle: $("#cropSubtitle"),
  cropClose: $("#cropCloseBtn"),
  cropApply: $("#cropApplyBtn"),
  cropReset: $("#cropResetBtn"),
  ratioButtons: document.querySelectorAll("[data-ratio]"),
};

const sampleAvatar =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect width="160" height="160" fill="#b8dd8a"/>
  <circle cx="80" cy="82" r="55" fill="#f5f3d8" stroke="#223622" stroke-width="7"/>
  <path d="M42 48c16-15 56-16 76 1" fill="none" stroke="#223622" stroke-width="8" stroke-linecap="round"/>
  <circle cx="59" cy="75" r="7" fill="#223622"/>
  <circle cx="100" cy="75" r="7" fill="#223622"/>
  <path d="M63 105c10 9 25 9 35 0" fill="none" stroke="#223622" stroke-width="7" stroke-linecap="round"/>
  <rect x="39" y="62" width="31" height="20" rx="6" fill="none" stroke="#223622" stroke-width="5"/>
  <rect x="90" y="62" width="31" height="20" rx="6" fill="none" stroke="#223622" stroke-width="5"/>
  <path d="M70 72h20" stroke="#223622" stroke-width="5"/>
</svg>`);

const sampleImage =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="650" viewBox="0 0 1200 650">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#f3efe6"/>
      <stop offset="0.48" stop-color="#d9e8e0"/>
      <stop offset="1" stop-color="#efc8a2"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="650" fill="url(#g)"/>
  <rect x="95" y="95" width="1010" height="460" rx="34" fill="#ffffff" opacity=".45"/>
  <circle cx="735" cy="305" r="132" fill="#222831"/>
  <circle cx="735" cy="230" r="62" fill="#f5d8c9"/>
  <path d="M605 502c23-111 234-113 260 0" fill="#111827"/>
  <rect x="210" y="318" width="305" height="25" rx="12" fill="#243447"/>
  <circle cx="538" cy="331" r="45" fill="#111827"/>
  <path d="M190 420h370" stroke="#ffffff" stroke-width="9" opacity=".65"/>
  <path d="M190 462h330" stroke="#ffffff" stroke-width="9" opacity=".65"/>
  <text x="600" y="598" text-anchor="middle" font-size="36" fill="#ffffff" font-family="Arial, sans-serif">Image placeholder</text>
</svg>`);

const verifiedBadgeSrc =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112">
  <g fill="#1d9bf0">
    <circle cx="56" cy="56" r="34"/>
    <circle cx="56" cy="25" r="18"/>
    <circle cx="78" cy="34" r="18"/>
    <circle cx="87" cy="56" r="18"/>
    <circle cx="78" cy="78" r="18"/>
    <circle cx="56" cy="87" r="18"/>
    <circle cx="34" cy="78" r="18"/>
    <circle cx="25" cy="56" r="18"/>
    <circle cx="34" cy="34" r="18"/>
  </g>
  <path d="M34 55.5 48.5 70 79 36" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="square" stroke-linejoin="miter"/>
</svg>`);

const FONT_STACKS = {
  "zh-system": '"PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif',
  "zh-song": '"Songti SC", SimSun, "Noto Serif CJK SC", serif',
  "zh-kai": '"Kaiti SC", KaiTi, STKaiti, serif',
  "zh-hei": 'STHeiti, "Heiti SC", "Microsoft YaHei", sans-serif',
  "en-system": '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  "en-serif": 'Georgia, "Times New Roman", Times, serif',
  "en-rounded": '"Arial Rounded MT Bold", "Avenir Next", Arial, sans-serif',
  "en-mono": '"SFMono-Regular", Menlo, Consolas, monospace',
};

const UI_THEMES = ["light", "dark"];

const UI_THEME_LABELS = {
  light: "白色",
  dark: "黑色",
};

const defaultText = `[[image:sample]]

她说，如果你无聊的时候，不想只是刷手机，可以让 AI 做一件事：

“请你从某个领域里，选择一个研究生水平的概念。然后写一个寓言故事，用间接的方式把这个概念讲清楚。不要一开始就说答案，尽量到故事快结束的时候，才让人意识到原来讲的是这个概念。故事结束后，再解释这个概念，以及故事里的隐喻分别对应什么。”

## 你可以继续补充你的长文本

系统会根据每一页能容纳的行数自动切割，保留大标题、小标题、加粗、斜体、颜色和图片。`;

const state = {
  avatar: sampleAvatar,
  avatarCrop: null,
  images: {
    sample: {
      src: sampleImage,
      name: "sample",
    },
  },
  canvases: [],
  lastFindIndex: -1,
  mode: "auto",
  scrollOffset: 0,
  scrollMax: 0,
  colorBrush: false,
  uiTheme: "light",
};

const textHistory = {
  stack: [],
  index: -1,
  timer: null,
  restoring: false,
  max: 80,
};

const cropper = {
  target: null,
  image: null,
  rect: null,
  aspect: null,
  display: null,
  drag: null,
};

function defaultFormState() {
  return {
    content: defaultText,
    displayName: "捏捏番茄（AI图文版）",
    handle: "@heytomato",
    textColor: "#202938",
    accentColor: "#2563eb",
    bgColor: "#ffffff",
    fontSize: "31",
    lineHeight: "1.85",
    zhFont: "zh-system",
    enFont: "en-system",
    imageHeight: "520",
    uiTheme: "light",
    avatar: sampleAvatar,
    avatarCrop: null,
    images: state.images,
  };
}

function readForm() {
  return {
    content: els.content.value,
    displayName: els.displayName.value.trim() || "未命名作者",
    handle: normalizeHandle(els.handle.value),
    textColor: els.textColor.value,
    accentColor: els.accentColor.value,
    bgColor: els.bgColor.value,
    fontSize: clamp(Number(els.fontSize.value) || 31, 24, 40),
    lineHeight: clamp(Number(els.lineHeight.value) || 1.85, 1.25, 2.4),
    zhFont: FONT_STACKS[els.zhFont.value] ? els.zhFont.value : "zh-system",
    enFont: FONT_STACKS[els.enFont.value] ? els.enFont.value : "en-system",
    imageHeight: clamp(Number(els.imageHeight.value) || 520, 220, 760),
    uiTheme: state.uiTheme,
    avatar: state.avatar,
    avatarCrop: state.avatarCrop,
    images: state.images,
  };
}

function applyForm(data) {
  els.content.value = data.content ?? defaultText;
  els.displayName.value = data.displayName ?? "捏捏番茄（AI图文版）";
  els.handle.value = data.handle ?? "@heytomato";
  els.textColor.value = data.textColor ?? "#202938";
  els.accentColor.value = data.accentColor ?? "#2563eb";
  els.bgColor.value = data.bgColor ?? "#ffffff";
  els.fontSize.value = data.fontSize ?? "31";
  els.lineHeight.value = Number(data.lineHeight) <= 1.65 ? "1.85" : data.lineHeight ?? "1.85";
  els.zhFont.value = FONT_STACKS[data.zhFont] ? data.zhFont : "zh-system";
  els.enFont.value = FONT_STACKS[data.enFont] ? data.enFont : "en-system";
  els.imageHeight.value = String(data.imageHeight ?? "520") === "380" ? "520" : data.imageHeight ?? "520";
  setUiTheme(data.uiTheme || "light");
  state.avatar = data.avatar || sampleAvatar;
  state.avatarCrop = data.avatarCrop || null;
  state.images = { ...defaultFormState().images, ...(data.images || {}) };
  els.avatarPreview.src = state.avatar;
  document.documentElement.style.setProperty("--brush-color", els.inlineColor.value);
  updateImageList();
}

function setUiTheme(theme, announce = false) {
  const normalizedTheme = theme === "ink" ? "dark" : theme === "paper" ? "light" : theme;
  const nextTheme = UI_THEMES.includes(normalizedTheme) ? normalizedTheme : "light";
  state.uiTheme = nextTheme;
  document.documentElement.dataset.uiTheme = nextTheme;
  if (els.themeToggle) {
    const label = UI_THEME_LABELS[nextTheme];
    els.themeToggle.title = `切换黑白主题：当前 ${label}`;
    els.themeToggle.setAttribute("aria-label", `切换黑白主题，当前 ${label}`);
  }
  if (announce) {
    els.status.textContent = `已切换为${UI_THEME_LABELS[nextTheme]}主题`;
  }
}

function toggleUiTheme() {
  const index = UI_THEMES.indexOf(state.uiTheme);
  const nextTheme = UI_THEMES[(index + 1) % UI_THEMES.length];
  setUiTheme(nextTheme, true);
  saveState();
}

function normalizeHandle(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "@profile";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function debounce(fn, wait = 140) {
  let id;
  return (...args) => {
    window.clearTimeout(id);
    id = window.setTimeout(() => fn(...args), wait);
  };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readForm()));
  } catch {
    els.status.textContent = "本次内容较大，浏览器未写入本地缓存";
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? migrateStoredState({ ...defaultFormState(), ...JSON.parse(raw) }) : defaultFormState();
  } catch {
    return defaultFormState();
  }
}

function migrateStoredState(data) {
  const oldBoldQuote =
    "**“请你从某个领域里，选择一个研究生水平的概念。然后写一个寓言故事，用间接的方式把这个概念讲清楚。不要一开始就说答案，尽量到故事快结束的时候，才让人意识到原来讲的是这个概念。故事结束后，再解释这个概念，以及故事里的隐喻分别对应什么。”**";
  data.content = (data.content || defaultText).replace(
    oldBoldQuote,
    "“请你从某个领域里，选择一个研究生水平的概念。然后写一个寓言故事，用间接的方式把这个概念讲清楚。不要一开始就说答案，尽量到故事快结束的时候，才让人意识到原来讲的是这个概念。故事结束后，再解释这个概念，以及故事里的隐喻分别对应什么。”",
  );
  if (String(data.imageHeight) === "380") data.imageHeight = "520";
  if (Number(data.lineHeight) <= 1.65) data.lineHeight = "1.85";
  return data;
}

function getTextSnapshot() {
  return {
    value: els.content.value,
    selectionStart: els.content.selectionStart,
    selectionEnd: els.content.selectionEnd,
  };
}

function resetTextHistory() {
  window.clearTimeout(textHistory.timer);
  textHistory.timer = null;
  textHistory.stack = [getTextSnapshot()];
  textHistory.index = 0;
}

function commitTextHistory() {
  if (textHistory.restoring) return;
  window.clearTimeout(textHistory.timer);
  textHistory.timer = null;

  const snapshot = getTextSnapshot();
  const current = textHistory.stack[textHistory.index];
  if (current?.value === snapshot.value) {
    textHistory.stack[textHistory.index] = snapshot;
    return;
  }

  if (textHistory.index < textHistory.stack.length - 1) {
    textHistory.stack = textHistory.stack.slice(0, textHistory.index + 1);
  }

  textHistory.stack.push(snapshot);
  if (textHistory.stack.length > textHistory.max) {
    textHistory.stack.shift();
  } else {
    textHistory.index += 1;
  }
}

function scheduleTextHistoryCommit() {
  if (textHistory.restoring) return;
  window.clearTimeout(textHistory.timer);
  textHistory.timer = window.setTimeout(commitTextHistory, 260);
}

function restoreTextSnapshot(snapshot) {
  textHistory.restoring = true;
  els.content.value = snapshot.value;
  els.content.focus();
  els.content.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
  textHistory.restoring = false;
  requestRender();
}

function undoTextChange() {
  commitTextHistory();
  if (textHistory.index <= 0) return;
  textHistory.index -= 1;
  restoreTextSnapshot(textHistory.stack[textHistory.index]);
}

function redoTextChange() {
  commitTextHistory();
  if (textHistory.index >= textHistory.stack.length - 1) return;
  textHistory.index += 1;
  restoreTextSnapshot(textHistory.stack[textHistory.index]);
}

function handleTextShortcut(event) {
  const isUndoKey = event.key.toLowerCase() === "z" && (event.metaKey || event.ctrlKey) && !event.altKey;
  if (!isUndoKey) return;
  event.preventDefault();
  if (event.shiftKey) {
    redoTextChange();
  } else {
    undoTextChange();
  }
}

function insertAtSelection(textarea, value, selectOffset = null) {
  commitTextHistory();
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const current = textarea.value;
  textarea.value = `${current.slice(0, start)}${value}${current.slice(end)}`;
  const cursor = selectOffset === null ? start + value.length : start + selectOffset;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
  commitTextHistory();
  requestRender();
}

function wrapSelection(kind) {
  commitTextHistory();
  const textarea = els.content;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || "文字";
  let next = selected;
  let cursorOffset = null;

  if (kind === "bold") {
    next = `**${selected}**`;
    cursorOffset = selected === "文字" ? 2 : null;
  } else if (kind === "italic") {
    next = `*${selected}*`;
    cursorOffset = selected === "文字" ? 1 : null;
  } else if (kind === "h1" || kind === "h2" || kind === "quote") {
    const prefix = kind === "h1" ? "# " : kind === "h2" ? "## " : "> ";
    const lineStart = textarea.value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    textarea.value = `${textarea.value.slice(0, lineStart)}${prefix}${textarea.value.slice(lineStart)}`;
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    commitTextHistory();
    requestRender();
    return;
  }

  textarea.value = `${textarea.value.slice(0, start)}${next}${textarea.value.slice(end)}`;
  if (cursorOffset !== null) {
    textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + selected.length);
  } else {
    textarea.setSelectionRange(start + next.length, start + next.length);
  }
  textarea.focus();
  commitTextHistory();
  requestRender();
}

function wrapSelectionWithColor() {
  commitTextHistory();
  const textarea = els.content;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || "彩色文字";
  const color = els.inlineColor.value;
  const next = `{{color:${color}|${selected}}}`;
  textarea.value = `${textarea.value.slice(0, start)}${next}${textarea.value.slice(end)}`;
  textarea.focus();
  textarea.setSelectionRange(start + next.length, start + next.length);
  commitTextHistory();
  requestRender();
}

function enableColorBrush() {
  state.colorBrush = true;
  document.documentElement.style.setProperty("--brush-color", els.inlineColor.value);
  els.colorTool?.classList.add("active");
  els.colorMenu.open = false;
  els.status.textContent = "刷色已开启，选中一段文字即可上色";
}

function disableColorBrush() {
  state.colorBrush = false;
  els.colorTool?.classList.remove("active");
  els.colorMenu.open = false;
}

function applyColorBrushToSelection() {
  if (!state.colorBrush) return;
  if (document.activeElement !== els.content) return;
  if (els.content.selectionStart === els.content.selectionEnd) return;
  wrapSelectionWithColor();
  disableColorBrush();
  els.status.textContent = "已应用选中文字颜色";
}

function findNext() {
  const needle = els.find.value;
  if (!needle) return;
  const haystack = els.content.value;
  const from = Math.max(els.content.selectionEnd, state.lastFindIndex + needle.length, 0);
  let index = haystack.indexOf(needle, from);
  if (index === -1) index = haystack.indexOf(needle, 0);
  if (index === -1) {
    els.status.textContent = "没有找到匹配文本";
    return;
  }
  state.lastFindIndex = index;
  els.content.focus();
  els.content.setSelectionRange(index, index + needle.length);
  els.status.textContent = `已选中第 ${index + 1} 个字符处`;
}

function replaceCurrent() {
  const needle = els.find.value;
  if (!needle) return;
  let start = els.content.selectionStart;
  let end = els.content.selectionEnd;
  let selected = els.content.value.slice(start, end);
  if (selected !== needle) {
    findNext();
    start = els.content.selectionStart;
    end = els.content.selectionEnd;
    selected = els.content.value.slice(start, end);
    if (selected !== needle) return;
  }
  insertAtSelection(els.content, els.replace.value);
  state.lastFindIndex = start;
}

function replaceAll() {
  const needle = els.find.value;
  if (!needle) return;
  const replacement = els.replace.value;
  const pieces = els.content.value.split(needle);
  const count = pieces.length - 1;
  if (count < 1) {
    els.status.textContent = "没有找到匹配文本";
    return;
  }
  commitTextHistory();
  els.content.value = pieces.join(replacement);
  els.content.focus();
  els.content.setSelectionRange(0, 0);
  commitTextHistory();
  els.status.textContent = `已替换 ${count} 处`;
  requestRender();
}

async function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function handleContentImage(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const src = await readFileAsDataURL(file);
  const id = `img_${Date.now().toString(36)}`;
  state.images[id] = {
    src,
    name: file.name,
    crop: null,
  };
  updateImageList();
  insertAtSelection(els.content, `\n[[image:${id}]]\n`);
  event.target.value = "";
}

async function handleAvatar(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  state.avatar = await readFileAsDataURL(file);
  state.avatarCrop = null;
  els.avatarPreview.src = state.avatar;
  updateImageList();
  requestRender();
  event.target.value = "";
}

function updateImageList() {
  if (!els.imageList) return;
  els.imageList.innerHTML = "";
  const entries = Object.entries(state.images);

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "插入图片后可在这里裁剪";
    els.imageList.append(empty);
    return;
  }

  for (const [id, image] of entries) {
    const row = document.createElement("div");
    row.className = "image-row";

    const thumb = document.createElement("img");
    thumb.className = "image-thumb";
    thumb.src = image.src;
    thumb.alt = image.name || id;

    const meta = document.createElement("div");
    meta.className = "image-meta";
    const name = document.createElement("strong");
    name.textContent = image.name || id;
    const status = document.createElement("span");
    status.textContent = image.crop ? "已裁剪" : "原图比例";
    meta.append(name, status);

    const actions = document.createElement("div");
    actions.className = "image-row-actions";
    const cropButton = document.createElement("button");
    cropButton.type = "button";
    cropButton.title = "裁剪图片";
    cropButton.setAttribute("aria-label", `裁剪 ${image.name || id}`);
    cropButton.innerHTML = '<i data-lucide="crop"></i>';
    cropButton.addEventListener("click", () => openCropper("image", id));

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.title = "恢复原图";
    resetButton.setAttribute("aria-label", `恢复 ${image.name || id}`);
    resetButton.innerHTML = '<i data-lucide="rotate-ccw"></i>';
    resetButton.disabled = !image.crop;
    resetButton.addEventListener("click", () => {
      image.crop = null;
      updateImageList();
      requestRender();
    });
    actions.append(cropButton, resetButton);

    row.append(thumb, meta, actions);
    els.imageList.append(row);
  }

  if (window.lucide) window.lucide.createIcons();
}

async function openCropper(kind, id = null) {
  const targetImage = kind === "avatar" ? { src: state.avatar, name: "头像", crop: state.avatarCrop } : state.images[id];
  if (!targetImage?.src) return;

  cropper.image = await loadImage(targetImage.src).catch(() => null);
  if (!cropper.image) return;

  cropper.target = { kind, id };
  cropper.aspect = null;
  cropper.drag = null;
  cropper.rect = clampCropRect(targetImage.crop, cropper.image);
  els.cropTitle.textContent = kind === "avatar" ? "裁剪头像" : `裁剪 ${targetImage.name || id}`;
  els.cropSubtitle.textContent = kind === "avatar" ? "头像最终会显示为圆形，建议使用 1:1" : "不裁剪时会按原图比例放入页面";
  setActiveRatioButton("free");
  els.cropModal.classList.remove("hidden");
  drawCropper();
  if (window.lucide) window.lucide.createIcons();
}

function closeCropper() {
  els.cropModal.classList.add("hidden");
  cropper.target = null;
  cropper.image = null;
  cropper.rect = null;
  cropper.drag = null;
}

function applyCropper() {
  if (!cropper.target || !cropper.image || !cropper.rect) return;
  const crop = isFullCrop(cropper.rect, cropper.image)
    ? null
    : {
        x: Math.round(cropper.rect.x),
        y: Math.round(cropper.rect.y),
        width: Math.round(cropper.rect.width),
        height: Math.round(cropper.rect.height),
      };

  if (cropper.target.kind === "avatar") {
    state.avatarCrop = crop;
  } else if (state.images[cropper.target.id]) {
    state.images[cropper.target.id].crop = crop;
  }
  updateImageList();
  closeCropper();
  requestRender();
}

function resetCropperTarget() {
  if (!cropper.target) return;
  if (cropper.target.kind === "avatar") {
    state.avatarCrop = null;
  } else if (state.images[cropper.target.id]) {
    state.images[cropper.target.id].crop = null;
  }
  updateImageList();
  closeCropper();
  requestRender();
}

function setCropAspect(value) {
  if (!cropper.image || !cropper.rect) return;
  let aspect = null;
  if (value === "original") aspect = cropper.image.width / cropper.image.height;
  if (value !== "free" && value !== "original") aspect = Number(value);
  cropper.aspect = Number.isFinite(aspect) && aspect > 0 ? aspect : null;
  cropper.rect = fitRectToAspect(cropper.rect, cropper.image, cropper.aspect);
  setActiveRatioButton(value);
  drawCropper();
}

function setActiveRatioButton(value) {
  els.ratioButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.ratio === value);
  });
}

function fullCropRect(image) {
  return { x: 0, y: 0, width: image.width, height: image.height };
}

function clampCropRect(crop, image) {
  if (!crop) return fullCropRect(image);
  const width = clamp(Number(crop.width) || image.width, 20, image.width);
  const height = clamp(Number(crop.height) || image.height, 20, image.height);
  return {
    x: clamp(Number(crop.x) || 0, 0, image.width - width),
    y: clamp(Number(crop.y) || 0, 0, image.height - height),
    width,
    height,
  };
}

function isFullCrop(rect, image) {
  return rect.x <= 1 && rect.y <= 1 && Math.abs(rect.width - image.width) <= 1 && Math.abs(rect.height - image.height) <= 1;
}

function fitRectToAspect(rect, image, aspect) {
  if (!aspect) return clampCropRect(rect, image);
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  let width = rect.width;
  let height = width / aspect;
  if (height > rect.height) {
    height = rect.height;
    width = height * aspect;
  }
  if (width > image.width) {
    width = image.width;
    height = width / aspect;
  }
  if (height > image.height) {
    height = image.height;
    width = height * aspect;
  }
  width = Math.max(20, width);
  height = Math.max(20, height);
  return {
    x: clamp(centerX - width / 2, 0, image.width - width),
    y: clamp(centerY - height / 2, 0, image.height - height),
    width,
    height,
  };
}

function getCropDisplay() {
  const canvas = els.cropCanvas;
  const image = cropper.image;
  const padding = 26;
  const scale = Math.min((canvas.width - padding * 2) / image.width, (canvas.height - padding * 2) / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    x: (canvas.width - width) / 2,
    y: (canvas.height - height) / 2,
    width,
    height,
    scale,
  };
}

function sourceToCanvasRect(rect) {
  const display = cropper.display;
  return {
    x: display.x + rect.x * display.scale,
    y: display.y + rect.y * display.scale,
    width: rect.width * display.scale,
    height: rect.height * display.scale,
  };
}

function canvasPointFromEvent(event) {
  const bounds = els.cropCanvas.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * els.cropCanvas.width,
    y: ((event.clientY - bounds.top) / bounds.height) * els.cropCanvas.height,
  };
}

function sourcePointFromCanvas(point) {
  const display = cropper.display;
  return {
    x: clamp((point.x - display.x) / display.scale, 0, cropper.image.width),
    y: clamp((point.y - display.y) / display.scale, 0, cropper.image.height),
  };
}

function drawCropper() {
  if (!cropper.image || !cropper.rect) return;
  const canvas = els.cropCanvas;
  const ctx = canvas.getContext("2d");
  cropper.display = getCropDisplay();
  const display = cropper.display;
  const crop = sourceToCanvasRect(cropper.rect);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(cropper.image, display.x, display.y, display.width, display.height);

  ctx.fillStyle = "rgba(2, 6, 23, 0.58)";
  ctx.fillRect(display.x, display.y, display.width, crop.y - display.y);
  ctx.fillRect(display.x, crop.y + crop.height, display.width, display.y + display.height - crop.y - crop.height);
  ctx.fillRect(display.x, crop.y, crop.x - display.x, crop.height);
  ctx.fillRect(crop.x + crop.width, crop.y, display.x + display.width - crop.x - crop.width, crop.height);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.76)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 3; i += 1) {
    const gx = crop.x + (crop.width * i) / 3;
    const gy = crop.y + (crop.height * i) / 3;
    ctx.beginPath();
    ctx.moveTo(gx, crop.y);
    ctx.lineTo(gx, crop.y + crop.height);
    ctx.moveTo(crop.x, gy);
    ctx.lineTo(crop.x + crop.width, gy);
    ctx.stroke();
  }

  ctx.fillStyle = "#ffffff";
  const handles = [
    [crop.x, crop.y],
    [crop.x + crop.width, crop.y],
    [crop.x, crop.y + crop.height],
    [crop.x + crop.width, crop.y + crop.height],
  ];
  for (const [x, y] of handles) {
    ctx.fillRect(x - 5, y - 5, 10, 10);
  }
}

function detectCropHit(point) {
  const crop = sourceToCanvasRect(cropper.rect);
  const corners = {
    nw: [crop.x, crop.y],
    ne: [crop.x + crop.width, crop.y],
    sw: [crop.x, crop.y + crop.height],
    se: [crop.x + crop.width, crop.y + crop.height],
  };
  for (const [handle, [x, y]] of Object.entries(corners)) {
    if (Math.hypot(point.x - x, point.y - y) <= 16) return handle;
  }
  if (point.x >= crop.x && point.x <= crop.x + crop.width && point.y >= crop.y && point.y <= crop.y + crop.height) {
    return "move";
  }
  return "move-new";
}

function startCropDrag(event) {
  if (!cropper.image || !cropper.rect) return;
  cropper.display = getCropDisplay();
  const canvasPoint = canvasPointFromEvent(event);
  const display = cropper.display;
  if (
    canvasPoint.x < display.x ||
    canvasPoint.x > display.x + display.width ||
    canvasPoint.y < display.y ||
    canvasPoint.y > display.y + display.height
  ) {
    return;
  }

  const sourcePoint = sourcePointFromCanvas(canvasPoint);
  const action = detectCropHit(canvasPoint);
  if (action === "move-new") {
    cropper.rect = clampMovedRect(
      {
        ...cropper.rect,
        x: sourcePoint.x - cropper.rect.width / 2,
        y: sourcePoint.y - cropper.rect.height / 2,
      },
      cropper.image,
    );
  }

  cropper.drag = {
    action: action === "move-new" ? "move" : action,
    startX: sourcePoint.x,
    startY: sourcePoint.y,
    startRect: { ...cropper.rect },
  };
  drawCropper();
}

function moveCropDrag(event) {
  if (!cropper.drag || !cropper.image) return;
  const point = sourcePointFromCanvas(canvasPointFromEvent(event));
  const drag = cropper.drag;

  if (drag.action === "move") {
    cropper.rect = clampMovedRect(
      {
        ...drag.startRect,
        x: drag.startRect.x + point.x - drag.startX,
        y: drag.startRect.y + point.y - drag.startY,
      },
      cropper.image,
    );
  } else {
    cropper.rect = resizeCropRect(drag.action, drag.startRect, point, cropper.image, cropper.aspect);
  }
  drawCropper();
}

function stopCropDrag() {
  cropper.drag = null;
}

function clampMovedRect(rect, image) {
  return {
    ...rect,
    x: clamp(rect.x, 0, image.width - rect.width),
    y: clamp(rect.y, 0, image.height - rect.height),
  };
}

function resizeCropRect(handle, startRect, point, image, aspect) {
  const anchorX = handle.includes("w") ? startRect.x + startRect.width : startRect.x;
  const anchorY = handle.includes("n") ? startRect.y + startRect.height : startRect.y;
  let width = Math.max(20, Math.abs(point.x - anchorX));
  let height = Math.max(20, Math.abs(point.y - anchorY));

  if (aspect) {
    if (width / height > aspect) width = height * aspect;
    else height = width / aspect;
  }

  width = Math.min(width, image.width);
  height = Math.min(height, image.height);
  let x = handle.includes("w") ? anchorX - width : anchorX;
  let y = handle.includes("n") ? anchorY - height : anchorY;

  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + width > image.width) x = image.width - width;
  if (y + height > image.height) y = image.height - height;
  return fitRectToAspect({ x, y, width, height }, image, aspect);
}

function parseBlocks(content) {
  const rawBlocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const blocks = [];

  for (const raw of rawBlocks) {
    const text = raw.trim();
    if (!text) continue;

    const imageOnly = text.match(/^\[\[image:([\w-]+)\]\]$/);
    if (imageOnly) {
      blocks.push({ type: "image", id: imageOnly[1] });
      continue;
    }

    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const imageInline = trimmed.match(/^\[\[image:([\w-]+)\]\]$/);
      if (imageInline) {
        blocks.push({ type: "image", id: imageInline[1] });
      } else if (trimmed.startsWith("# ")) {
        blocks.push({ type: "h1", tokens: parseInline(trimmed.slice(2).trim()) });
      } else if (trimmed.startsWith("## ")) {
        blocks.push({ type: "h2", tokens: parseInline(trimmed.slice(3).trim()) });
      } else if (trimmed.startsWith("> ")) {
        blocks.push({ type: "quote", tokens: parseInline(trimmed.slice(2).trim()) });
      } else {
        blocks.push({ type: "p", tokens: parseInline(trimmed) });
      }
    }
  }

  return blocks;
}

function parseInline(text) {
  const tokens = [];
  let i = 0;

  while (i < text.length) {
    const colorMatch = text.slice(i).match(/^\{\{color:(#[0-9a-fA-F]{3,8})\|([\s\S]*?)\}\}/);
    if (colorMatch) {
      tokens.push({ text: colorMatch[2], color: colorMatch[1] });
      i += colorMatch[0].length;
      continue;
    }

    if (text.startsWith("**", i)) {
      const close = text.indexOf("**", i + 2);
      if (close !== -1) {
        tokens.push({ text: text.slice(i + 2, close), bold: true });
        i = close + 2;
        continue;
      }
    }

    if (text.startsWith("*", i)) {
      const close = text.indexOf("*", i + 1);
      if (close !== -1) {
        tokens.push({ text: text.slice(i + 1, close), italic: true });
        i = close + 1;
        continue;
      }
    }

    const nextMarkers = ["{{color:", "**", "*"]
      .map((marker) => text.indexOf(marker, i + 1))
      .filter((index) => index !== -1);
    const next = nextMarkers.length ? Math.min(...nextMarkers) : text.length;
    tokens.push({ text: text.slice(i, next) });
    i = next;
  }

  return tokens.filter((token) => token.text.length > 0);
}

function styleForBlock(type, settings) {
  const baseSize = settings.fontSize;
  const fontSettings = {
    zhFont: settings.zhFont,
    enFont: settings.enFont,
  };
  if (type === "h1") {
    return {
      ...fontSettings,
      size: Math.round(baseSize * 1.36),
      lineHeight: 1.45,
      weight: 650,
      italic: false,
      marginTop: 22,
      marginBottom: 10,
      color: settings.textColor,
    };
  }
  if (type === "h2") {
    return {
      ...fontSettings,
      size: Math.round(baseSize * 1.12),
      lineHeight: 1.55,
      weight: 560,
      italic: false,
      marginTop: 20,
      marginBottom: 6,
      color: settings.textColor,
    };
  }
  if (type === "quote") {
    return {
      ...fontSettings,
      size: baseSize,
      lineHeight: settings.lineHeight,
      weight: 400,
      italic: false,
      marginTop: 18,
      marginBottom: 10,
      color: settings.textColor,
      quote: true,
    };
  }
  return {
    ...fontSettings,
    size: baseSize,
    lineHeight: settings.lineHeight,
    weight: 400,
    italic: false,
    marginTop: 16,
    marginBottom: 10,
    color: settings.textColor,
  };
}

function fontString(style, token = {}) {
  const italic = token.italic || style.italic ? "italic " : "";
  const weight = token.bold ? 650 : style.weight;
  return `${italic}${weight} ${style.size}px ${fontFamilyForText(token.text, style)}`;
}

function fontFamilyForText(text, settings) {
  const zhFont = FONT_STACKS[settings.zhFont] || FONT_STACKS["zh-system"];
  const enFont = FONT_STACKS[settings.enFont] || FONT_STACKS["en-system"];
  return /[A-Za-z0-9_@#%+./:-]/.test(text || "") ? `${enFont}, ${zhFont}` : `${zhFont}, ${enFont}`;
}

function splitTokenText(text) {
  return text.match(/[\u3400-\u9fff]|[A-Za-z0-9_@#%+./:-]+|\s+|[^\s]/g) || [];
}

function isNoLineStartPunctuation(text) {
  return /^[,.;:!?，。！？；：、…）\])}】》〉」』”’"'、]+$/.test(text);
}

function isNoLineEndPunctuation(text) {
  return /^[（\[(【《〈「『“‘"']+$/.test(text);
}

function wrapTokens(ctx, tokens, style, maxWidth) {
  const lines = [];
  let line = [];
  let width = 0;

  function pushLine() {
    while (line.length && /^\s+$/.test(line[0].text)) {
      width -= measureToken(ctx, line[0], style);
      line.shift();
    }
    while (line.length && /^\s+$/.test(line[line.length - 1].text)) {
      width -= measureToken(ctx, line[line.length - 1], style);
      line.pop();
    }
    if (line.length) lines.push(line);
    line = [];
    width = 0;
  }

  for (const token of tokens) {
    for (const unit of splitTokenText(token.text)) {
      const part = { ...token, text: unit };
      const measured = measureToken(ctx, part, style);
      const shouldStayWithPrevious = isNoLineStartPunctuation(unit);
      const previousText = line.length ? line[line.length - 1].text : "";
      const previousNeedsNext = isNoLineEndPunctuation(previousText);

      if (width + measured > maxWidth && line.length && !shouldStayWithPrevious && !previousNeedsNext) {
        pushLine();
      }
      if (!line.length && /^\s+$/.test(unit)) continue;
      if (!line.length && shouldStayWithPrevious && lines.length) {
        lines[lines.length - 1].push(part);
        continue;
      }
      line.push(part);
      width += measured;
    }
  }

  pushLine();
  return lines;
}

function measureToken(ctx, token, style) {
  ctx.font = fontString(style, token);
  return ctx.measureText(token.text).width;
}

function getImageSourceRect(image, crop) {
  return clampCropRect(crop, image);
}

function imageBlockSize(sourceRect, maxWidth, maxHeight) {
  const aspect = sourceRect.width / sourceRect.height;
  let width = maxWidth;
  let height = width / aspect;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }

  return {
    width,
    height,
    offsetX: (maxWidth - width) / 2,
  };
}

async function buildPages(settings) {
  const measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  const blocks = parseBlocks(settings.content);
  const avatar = await loadImage(settings.avatar).catch(() => null);
  const badge = await loadImage(verifiedBadgeSrc).catch(() => null);
  const imageCache = {};
  const pages = [];
  const bounds = {
    left: 42,
    right: CANVAS_WIDTH - 42,
    top: 158,
    bottom: CANVAS_HEIGHT - 62,
  };
  const contentWidth = bounds.right - bounds.left;
  let page = createPage();
  let y = bounds.top;
  let hasContent = false;

  function createPage() {
    return {
      avatar,
      badge,
      settings,
      items: [],
    };
  }

  function finishPage() {
    if (page.items.length) {
      pages.push(page);
    }
    page = createPage();
    y = bounds.top;
    hasContent = false;
  }

  function ensureSpace(height, topMargin = 0) {
    if (hasContent && y + topMargin + height > bounds.bottom) {
      finishPage();
    }
    if (!hasContent) topMargin = 0;
    y += topMargin;
  }

  for (const block of blocks) {
    if (block.type === "image") {
      const data = settings.images[block.id];
      if (!data) continue;
      if (!imageCache[block.id]) {
        imageCache[block.id] = await loadImage(data.src).catch(() => null);
      }
      const img = imageCache[block.id];
      if (!img) continue;
      const sourceRect = getImageSourceRect(img, data.crop);
      const size = imageBlockSize(sourceRect, contentWidth, Math.min(settings.imageHeight, bounds.bottom - bounds.top));
      const height = size.height;
      ensureSpace(height, hasContent ? 24 : 0);
      page.items.push({
        type: "image",
        image: img,
        sourceRect,
        x: bounds.left + size.offsetX,
        y,
        width: size.width,
        height,
        radius: 13,
      });
      y += height + 34;
      hasContent = true;
      continue;
    }

    const style = styleForBlock(block.type, settings);
    const lineHeight = Math.ceil(style.size * style.lineHeight);
    const textWidth = style.quote ? contentWidth - 28 : contentWidth;
    const lines = wrapTokens(ctx, block.tokens, style, textWidth);
    let firstLine = true;

    for (const line of lines) {
      const topMargin = firstLine ? (hasContent ? style.marginTop : 0) : 0;
      ensureSpace(lineHeight, topMargin);
      page.items.push({
        type: "text",
        blockType: block.type,
        line,
        style,
        x: bounds.left + (style.quote ? 28 : 0),
        y,
        lineHeight,
      });
      y += lineHeight;
      firstLine = false;
      hasContent = true;
    }

    if (lines.length) {
      y += style.marginBottom;
    }
  }

  finishPage();
  return pages.length ? pages : [createPage()];
}

async function buildScrollPage(settings) {
  const measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  const blocks = parseBlocks(settings.content);
  const avatar = await loadImage(settings.avatar).catch(() => null);
  const badge = await loadImage(verifiedBadgeSrc).catch(() => null);
  const imageCache = {};
  const bounds = {
    left: 42,
    right: CANVAS_WIDTH - 42,
    top: 158,
    bottom: CANVAS_HEIGHT - 62,
  };
  const contentWidth = bounds.right - bounds.left;
  const viewportHeight = bounds.bottom - bounds.top;
  const page = {
    avatar,
    badge,
    settings,
    items: [],
    bounds,
    scrollOffset: 0,
    scrollMax: 0,
  };
  let y = 0;
  let hasContent = false;

  for (const block of blocks) {
    if (block.type === "image") {
      const data = settings.images[block.id];
      if (!data) continue;
      if (!imageCache[block.id]) {
        imageCache[block.id] = await loadImage(data.src).catch(() => null);
      }
      const img = imageCache[block.id];
      if (!img) continue;
      const sourceRect = getImageSourceRect(img, data.crop);
      const size = imageBlockSize(sourceRect, contentWidth, settings.imageHeight);
      y += hasContent ? 24 : 0;
      page.items.push({
        type: "image",
        image: img,
        sourceRect,
        x: bounds.left + size.offsetX,
        y,
        width: size.width,
        height: size.height,
        radius: 13,
      });
      y += size.height + 34;
      hasContent = true;
      continue;
    }

    const style = styleForBlock(block.type, settings);
    const lineHeight = Math.ceil(style.size * style.lineHeight);
    const textWidth = style.quote ? contentWidth - 28 : contentWidth;
    const lines = wrapTokens(ctx, block.tokens, style, textWidth);
    let firstLine = true;

    for (const line of lines) {
      y += firstLine && hasContent ? style.marginTop : 0;
      page.items.push({
        type: "text",
        blockType: block.type,
        line,
        style,
        x: bounds.left + (style.quote ? 28 : 0),
        y,
        lineHeight,
      });
      y += lineHeight;
      firstLine = false;
      hasContent = true;
    }

    if (lines.length) {
      y += style.marginBottom;
    }
  }

  page.scrollMax = Math.max(0, y - viewportHeight);
  state.scrollMax = page.scrollMax;
  state.scrollOffset = clamp(state.scrollOffset, 0, page.scrollMax);
  page.scrollOffset = state.scrollOffset;
  return page;
}

function renderPage(page, index, total) {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.dataset.page = String(index + 1);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";

  drawBackground(ctx, page.settings);
  drawHeader(ctx, page.settings, page.avatar, page.badge);
  for (const item of page.items) {
    if (item.type === "image") drawImageBlock(ctx, item);
    if (item.type === "text") drawTextLine(ctx, item, page.settings);
  }
  return canvas;
}

function renderScrollPage(page) {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.dataset.page = "scroll";
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";

  drawBackground(ctx, page.settings);
  drawHeader(ctx, page.settings, page.avatar, page.badge);

  const { bounds } = page;
  ctx.save();
  ctx.beginPath();
  ctx.rect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
  ctx.clip();
  ctx.translate(0, bounds.top - page.scrollOffset);
  for (const item of page.items) {
    if (item.type === "image") drawImageBlock(ctx, item);
    if (item.type === "text") drawTextLine(ctx, item, page.settings);
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(23,32,47,.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bounds.left, bounds.top - 10);
  ctx.lineTo(bounds.right, bounds.top - 10);
  ctx.stroke();

  return canvas;
}

function drawBackground(ctx, settings) {
  ctx.fillStyle = settings.bgColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawHeader(ctx, settings, avatar, badge) {
  const x = 42;
  const y = 38;
  const size = 82;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) {
    drawSourceCoverImage(ctx, avatar, getImageSourceRect(avatar, settings.avatarCrop), x, y, size, size);
  } else {
    ctx.fillStyle = "#d8edc0";
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(32,41,56,.12)";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.stroke();

  const textX = 152;
  ctx.fillStyle = settings.textColor;
  ctx.font = `650 30px ${fontFamilyForText(settings.displayName, settings)}`;
  ctx.textBaseline = "alphabetic";
  const name = clampText(ctx, settings.displayName, 430);
  ctx.fillText(name, textX, 72);

  const nameWidth = ctx.measureText(name).width;
  drawVerifiedBadge(ctx, badge, textX + nameWidth + 24, 59);

  ctx.fillStyle = "#6f7785";
  ctx.font = `400 29px ${fontFamilyForText(settings.handle, settings)}`;
  ctx.fillText(clampText(ctx, settings.handle, 480), textX, 113);

  ctx.fillStyle = "#9aa2af";
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(769 + i * 16, 79, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVerifiedBadge(ctx, badge, x, y) {
  ctx.save();
  if (badge) {
    const size = 34;
    ctx.drawImage(badge, x - size / 2, y - size / 2, size, size);
  } else {
    ctx.fillStyle = "#1d9bf0";
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4.7;
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    ctx.beginPath();
    ctx.moveTo(x - 8.4, y - 0.7);
    ctx.lineTo(x - 2.2, y + 5.8);
    ctx.lineTo(x + 9.6, y - 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawImageBlock(ctx, item) {
  ctx.save();
  roundedRect(ctx, item.x, item.y, item.width, item.height, item.radius);
  ctx.clip();
  drawSourceImage(ctx, item.image, item.sourceRect, item.x, item.y, item.width, item.height);
  ctx.restore();
}

function drawTextLine(ctx, item, settings) {
  const { style, line, x, y, lineHeight } = item;
  if (style.quote) {
    ctx.fillStyle = settings.accentColor;
    roundedRect(ctx, x - 28, y + 7, 7, lineHeight - 13, 4);
    ctx.fill();
  }

  let cursor = x;
  const baseline = y + Math.round(lineHeight * 0.75);
  for (const token of line) {
    ctx.font = fontString(style, token);
    ctx.fillStyle = token.color || style.color;
    ctx.fillText(token.text, cursor, baseline);
    cursor += ctx.measureText(token.text).width;
  }
}

function drawCoverImage(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const dx = x + (width - drawWidth) / 2;
  const dy = y + (height - drawHeight) / 2;
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
}

function drawSourceImage(ctx, image, sourceRect, x, y, width, height) {
  ctx.drawImage(image, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height, x, y, width, height);
}

function drawSourceCoverImage(ctx, image, sourceRect, x, y, width, height) {
  const sourceAspect = sourceRect.width / sourceRect.height;
  const destAspect = width / height;
  let sx = sourceRect.x;
  let sy = sourceRect.y;
  let sw = sourceRect.width;
  let sh = sourceRect.height;

  if (sourceAspect > destAspect) {
    sw = sourceRect.height * destAspect;
    sx = sourceRect.x + (sourceRect.width - sw) / 2;
  } else {
    sh = sourceRect.width / destAspect;
    sy = sourceRect.y + (sourceRect.height - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function clampText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(`${result}...`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}...`;
}

async function render() {
  const settings = readForm();
  if (state.mode === "scroll") {
    const page = await buildScrollPage(settings);
    state.canvases = [renderScrollPage(page)];
  } else {
    const pages = await buildPages(settings);
    state.canvases = pages.map((page, index) => renderPage(page, index, pages.length));
    state.scrollOffset = 0;
    state.scrollMax = 0;
  }
  drawPreview(state.canvases);
  saveState();
}

function drawPreview(canvases) {
  els.pages.innerHTML = "";
  els.pages.classList.toggle("scroll-mode", state.mode === "scroll");
  els.scrollMode.classList.toggle("active", state.mode === "scroll");
  if (!canvases.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "暂无内容";
    els.pages.append(empty);
  }

  canvases.forEach((canvas, index) => {
    const shell = document.createElement("article");
    shell.className = "page-shell";
    const frame = document.createElement("div");
    frame.className = "page-frame";
    if (state.mode === "scroll") {
      frame.classList.add("scrollable");
      attachScrollFrameHandlers(frame);
    }
    frame.append(canvas);

    const actions = document.createElement("div");
    actions.className = "page-actions";
    const label = document.createElement("span");
    label.textContent = state.mode === "scroll" ? "滑动截图" : `图片 ${String(index + 1).padStart(2, "0")}`;
    const button = document.createElement("button");
    button.type = "button";
    button.title = "下载单张";
    button.setAttribute("aria-label", `下载第 ${index + 1} 张`);
    button.innerHTML = '<i data-lucide="download"></i>';
    const filename = state.mode === "scroll" ? "layout-scroll-shot.png" : `layout-page-${String(index + 1).padStart(2, "0")}.png`;
    button.addEventListener("click", () => downloadCanvas(canvas, filename));
    actions.append(label, button);
    shell.append(frame, actions);
    els.pages.append(shell);
  });

  els.pageCount.textContent = state.mode === "scroll" ? "滑动截图模式" : `${canvases.length} 张图片`;
  els.status.textContent =
    state.mode === "scroll"
      ? `滑动截图模式：在卡片上滚动，下载当前画面`
      : `已生成 ${canvases.length} 张，尺寸 ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`;
  if (window.lucide) window.lucide.createIcons();
}

function attachScrollFrameHandlers(frame) {
  let startY = 0;
  let startOffset = 0;

  frame.addEventListener(
    "wheel",
    (event) => {
      if (state.mode !== "scroll" || state.scrollMax <= 0) return;
      event.preventDefault();
      setScrollOffset(state.scrollOffset + event.deltaY);
    },
    { passive: false },
  );

  frame.addEventListener(
    "touchstart",
    (event) => {
      startY = event.touches[0]?.clientY || 0;
      startOffset = state.scrollOffset;
    },
    { passive: true },
  );

  frame.addEventListener(
    "touchmove",
    (event) => {
      if (state.mode !== "scroll" || state.scrollMax <= 0) return;
      event.preventDefault();
      const y = event.touches[0]?.clientY || startY;
      setScrollOffset(startOffset + startY - y);
    },
    { passive: false },
  );
}

function setScrollOffset(value) {
  state.scrollOffset = clamp(value, 0, state.scrollMax);
  render();
}

async function downloadCanvas(canvas, filename) {
  const writable = await chooseSaveTarget(filename, "image/png", ".png");
  if (writable === false) {
    els.status.textContent = "已取消下载";
    return;
  }
  const blob = await canvasToBlob(canvas);
  if (!blob) {
    els.status.textContent = "图片生成失败，请重新排版后再试";
    return;
  }
  await saveBlob(blob, filename, writable);
  els.status.textContent = writable ? `已保存 ${filename}` : `已交给浏览器下载 ${filename}`;
}

async function chooseSaveTarget(filename, mimeType, extension) {
  if (!window.showSaveFilePicker) return null;
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: extension === ".zip" ? "ZIP 压缩包" : "PNG 图片",
          accept: {
            [mimeType]: [extension],
          },
        },
      ],
    });
    return await handle.createWritable();
  } catch (error) {
    if (error?.name === "AbortError") return false;
    throw error;
  }
}

async function saveBlob(blob, filename, writable = null) {
  if (writable) {
    await writable.write(blob);
    await writable.close();
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

async function downloadAll() {
  if (!state.canvases.length) return;

  if (!window.JSZip) {
    els.status.textContent = "当前环境不支持打包，将逐张下载";
    state.canvases.forEach((canvas, index) => {
      const filename = state.mode === "scroll" ? "layout-scroll-shot.png" : `layout-page-${String(index + 1).padStart(2, "0")}.png`;
      window.setTimeout(() => downloadCanvas(canvas, filename), index * 120);
    });
    return;
  }

  const zipFilename = state.mode === "scroll" ? "graphic-layout-scroll-shot.zip" : "graphic-layout-pages.zip";
  const writable = await chooseSaveTarget(zipFilename, "application/zip", ".zip");
  if (writable === false) {
    els.status.textContent = "已取消下载";
    return;
  }

  els.status.textContent = "正在打包图片...";
  const zip = new window.JSZip();
  for (const [index, canvas] of state.canvases.entries()) {
    const blob = await canvasToBlob(canvas);
    if (!blob) {
      els.status.textContent = "图片生成失败，请重新排版后再试";
      return;
    }
    const filename = state.mode === "scroll" ? "layout-scroll-shot.png" : `layout-page-${String(index + 1).padStart(2, "0")}.png`;
    zip.file(filename, blob);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  await saveBlob(blob, zipFilename, writable);
  els.status.textContent = writable
    ? `已保存 ${zipFilename}`
    : state.mode === "scroll"
      ? "已交给浏览器下载当前滑动截图"
      : `已交给浏览器下载 ${state.canvases.length} 张图片`;
}

const requestRender = debounce(render, 120);

function bindEvents() {
  document.querySelectorAll(".tool-menu").forEach((menu) => {
    const summary = menu.querySelector("summary");
    summary?.addEventListener("click", () => {
      if (menu.open) return;
      document.querySelectorAll(".tool-menu").forEach((other) => {
        if (other !== menu) other.open = false;
      });
    });
    menu.addEventListener("toggle", () => {
      if (!menu.open) return;
      document.querySelectorAll(".tool-menu").forEach((other) => {
        if (other !== menu) other.open = false;
      });
    });
  });

  document.querySelectorAll("[data-format]").forEach((button) => {
    button.addEventListener("click", () => wrapSelection(button.dataset.format));
  });

  els.content.addEventListener("input", () => {
    scheduleTextHistoryCommit();
    requestRender();
  });
  els.content.addEventListener("keydown", handleTextShortcut);

  [
    els.displayName,
    els.handle,
    els.textColor,
    els.accentColor,
    els.bgColor,
    els.fontSize,
    els.lineHeight,
    els.zhFont,
    els.enFont,
    els.imageHeight,
  ].forEach((input) => {
    input.addEventListener("input", requestRender);
    input.addEventListener("change", requestRender);
  });

  els.inlineColor.addEventListener("input", () => {
    document.documentElement.style.setProperty("--brush-color", els.inlineColor.value);
  });
  els.colorConfirm.addEventListener("click", enableColorBrush);
  els.colorCancel.addEventListener("click", disableColorBrush);
  els.content.addEventListener("mouseup", () => window.setTimeout(applyColorBrushToSelection, 0));
  els.content.addEventListener("keyup", (event) => {
    if (event.key.startsWith("Arrow") || event.key === "Shift") {
      window.setTimeout(applyColorBrushToSelection, 0);
    }
  });
  els.contentImage.addEventListener("change", handleContentImage);
  els.avatarInput.addEventListener("change", handleAvatar);
  els.scrollMode.addEventListener("click", () => {
    state.mode = state.mode === "scroll" ? "auto" : "scroll";
    state.scrollOffset = 0;
    render();
  });
  els.cropAvatar.addEventListener("click", () => openCropper("avatar"));
  els.cropClose.addEventListener("click", closeCropper);
  els.cropApply.addEventListener("click", applyCropper);
  els.cropReset.addEventListener("click", resetCropperTarget);
  els.cropModal.addEventListener("click", (event) => {
    if (event.target === els.cropModal) closeCropper();
  });
  els.ratioButtons.forEach((button) => {
    button.addEventListener("click", () => setCropAspect(button.dataset.ratio));
  });
  els.cropCanvas.addEventListener("mousedown", startCropDrag);
  window.addEventListener("mousemove", moveCropDrag);
  window.addEventListener("mouseup", stopCropDrag);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.cropModal.classList.contains("hidden")) closeCropper();
  });
  els.findNext.addEventListener("click", findNext);
  els.replaceOne.addEventListener("click", replaceCurrent);
  els.replaceAll.addEventListener("click", replaceAll);
  els.themeToggle.addEventListener("click", toggleUiTheme);
  els.rerender.addEventListener("click", render);
  els.downloadZip.addEventListener("click", downloadAll);
}

applyForm(loadState());
resetTextHistory();
bindEvents();
render();

if (window.lucide) {
  window.lucide.createIcons();
}
