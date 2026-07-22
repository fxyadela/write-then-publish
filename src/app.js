const CANVAS_WIDTH = 864;
const CANVAS_HEIGHT = 1152;
const CANVAS_RENDER_SCALE = 2;
const OUTPUT_CANVAS_WIDTH = CANVAS_WIDTH * CANVAS_RENDER_SCALE;
const OUTPUT_CANVAS_HEIGHT = CANVAS_HEIGHT * CANVAS_RENDER_SCALE;
const CARD_SIDE_PADDING = 42;
const CARD_CONTENT_WIDTH = CANVAS_WIDTH - CARD_SIDE_PADDING * 2;
const CARD_MAX_IMAGE_HEIGHT = CANVAS_HEIGHT - CARD_SIDE_PADDING - 62;
const EXPORT_IMAGE_MIME = "image/png";
const DEFAULT_HANDLE = "@X: iamcora13";
const EXPORT_IMAGE_EXTENSION = ".png";
const EXPORT_ZIP_COMPRESSION = "STORE";
const OBSIDIAN_VAULT_DB = "writeThenPublishObsidianVault";
const OBSIDIAN_VAULT_STORE = "settings";
const OBSIDIAN_VAULT_KEY = "directoryHandle";
const STORAGE_KEY = "graphicTextLayoutState.v1";
const PROJECTS_STORAGE_KEY = "graphicTextLayoutProjects.v1";
const PANEL_LAYOUT_STORAGE_KEY = "writeThenPublishPanelLayout.v1";
const MAX_PROJECTS = 24;
const BUILT_IN_PROJECT_PREFIX = "guide_";
const GUIDE_CARDS_PROJECT_ID = `${BUILT_IN_PROJECT_PREFIX}cards`;
const GUIDE_ARTICLE_PROJECT_ID = `${BUILT_IN_PROJECT_PREFIX}article`;
const PANEL_LIMITS = {
  history: { min: 210, max: 380, fallback: 260 },
  editor: { min: 360, max: 760, fallback: 500 },
};

const $ = (selector) => document.querySelector(selector);

const els = {
  workspace: $(".workspace"),
  content: $("#contentInput"),
  pages: $("#pages"),
  pageCount: $("#pageCount"),
  status: $("#statusText"),
  historySidebar: $("#historySidebar"),
  historyToggle: $("#historyToggleBtn"),
  historyClose: $("#historyCloseBtn"),
  newProject: $("#newProjectBtn"),
  projectHistory: $("#projectHistory"),
  historyFilterButtons: document.querySelectorAll("[data-history-filter]"),
  panelResizers: document.querySelectorAll("[data-panel-resize]"),
  modeButtons: document.querySelectorAll(".mode-switch [data-app-mode]"),
  convertMode: $("#convertModeBtn"),
  headerModeToggle: $("#headerModeToggleBtn"),
  themeToggle: $("#themeToggleBtn"),
  downloadZip: $("#downloadZipBtn"),
  downloadArticle: $("#downloadArticleBtn"),
  scrollMode: $("#scrollModeBtn"),
  articleSettings: $("#articleSettings"),
  articleThemeButtons: document.querySelectorAll("[data-article-theme]"),
  articleFontButtons: document.querySelectorAll("[data-article-font]"),
  articleSizeButtons: document.querySelectorAll("[data-article-size]"),
  articleColorButtons: document.querySelectorAll("[data-article-color]"),
  contentImage: $("#contentImageInput"),
  obsidianImportMenu: $("#obsidianImportMenu"),
  connectObsidianVault: $("#connectObsidianVaultBtn"),
  obsidianVaultFolder: $("#obsidianVaultFolderInput"),
  obsidianVaultStatus: $("#obsidianVaultStatus"),
  inlineColor: $("#inlineColorInput"),
  inlineBgColor: $("#inlineBgColorInput"),
  colorMenu: $("#colorMenu"),
  bgColorMenu: $("#bgColorMenu"),
  colorTool: $(".color-tool"),
  bgColorTool: $(".bg-color-tool"),
  colorGuide: $("#colorGuide"),
  colorConfirm: $("#colorConfirmBtn"),
  colorCancel: $("#colorCancelBtn"),
  bgColorConfirm: $("#bgColorConfirmBtn"),
  bgColorCancel: $("#bgColorCancelBtn"),
  find: $("#findInput"),
  replace: $("#replaceInput"),
  findNext: $("#findNextBtn"),
  replaceOne: $("#replaceOneBtn"),
  replaceAll: $("#replaceAllBtn"),
  avatarInput: $("#avatarInput"),
  avatarPreview: $("#avatarPreview"),
  cropAvatar: $("#cropAvatarBtn"),
  imageList: $("#imageList"),
  imageWidthPercent: $("#imageWidthPercentInput"),
  applyImageWidth: $("#applyImageWidthBtn"),
  fixedImageWidth: $("#fixedImageWidthInput"),
  fixedImageHeight: $("#fixedImageHeightInput"),
  applyFixedImageSize: $("#applyFixedImageSizeBtn"),
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

const CARD_THEME_COLORS = {
  light: {
    textColor: "#202938",
    accentColor: "#17202f",
    bgColor: "#ffffff",
  },
  dark: {
    textColor: "#ffffff",
    accentColor: "#ffffff",
    bgColor: "#050505",
  },
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
  bgColorBrush: false,
  uiTheme: "light",
  headerMode: "every",
  appMode: "cards",
  articleTheme: "wechat",
  articleFont: "sans",
  articleSize: "normal",
  articleColor: "#0f766e",
  currentProjectId: null,
  projects: [],
  historyFilter: "all",
  panelLayout: {
    history: PANEL_LIMITS.history.fallback,
    editor: PANEL_LIMITS.editor.fallback,
  },
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

let imageEditDrag = null;
const obsidianVault = {
  handle: null,
  fileLookup: null,
  loading: false,
  importing: false,
};

function defaultFormState() {
  return {
    content: defaultText,
    displayName: "捏捏番茄（AI图文版）",
    handle: DEFAULT_HANDLE,
    textColor: "#202938",
    accentColor: "#2563eb",
    bgColor: "#ffffff",
    fontSize: "31",
    lineHeight: "1.65",
    zhFont: "zh-system",
    enFont: "en-system",
    imageHeight: String(CARD_MAX_IMAGE_HEIGHT),
    headerMode: "every",
    appMode: "cards",
    articleTheme: "wechat",
    articleFont: "sans",
    articleSize: "normal",
    articleColor: "#0f766e",
    uiTheme: "light",
    avatar: sampleAvatar,
    avatarCrop: null,
    images: defaultImages(),
  };
}

function blankFormState() {
  return {
    ...defaultFormState(),
    content: "",
    images: {},
  };
}

const cardsGuideText = `# 图文卡片说明书

这是一份内置说明书，用来快速看懂图文卡片模式。它不会被修改，也不能删除。

## 适合什么内容

- 小红书图文
- X 长帖截图
- 知识卡片
- 长文拆条
- 带图片的教程内容

## 基本流程

1. 在左侧输入或粘贴正文。
2. 使用 H1、H2、加粗、斜体、引用、颜色和文字背景色整理重点。
3. 点击图片按钮插入正文图片。
4. 选择“每页头像”或“仅首页头像”。
5. 在右侧检查分页效果。
6. 点击单张下载或批量下载。

## 常用写法

用 \`# 标题\` 生成大标题。

用 \`## 小标题\` 生成段落标题。

用 \`**重点文字**\` 加粗。

用 \`*斜体文字*\` 倾斜。

用 \`> 引用内容\` 做引用块。

用颜色刷和背景色刷突出重点。

## 图片规则

插入图片后，编辑框里会出现类似：

\`[[image:img_xxxxx]]\`

这行代表图片位置。你可以把它移动到任意段落之间。

在右侧预览里点击图片，可以调节图片宽度和对齐方式。

## 分页建议

如果某一页太满，优先减少长段落，而不是缩小字号。图文卡片的重点是“读起来不累”，不是把所有字塞进去。

单次回车会在同一段内手动换行。

空出来的行会在右侧图文卡片里保留为空白行。你想留几行，就在左侧留几行。

## 头像显示

默认每一页都显示头像、名称和昵称。

如果你只想第一张显示个人信息，点击“仅首页头像”。`;

const articleGuideText = `# 长文说明书

这是一份内置说明书，用来快速看懂长文模式。它不会被修改，也不能删除。

长文模式适合把内容整理成完整文章，而不是拆成多张图。

## 适合什么内容

- 公众号文章草稿
- Markdown 长文
- 方法论文章
- 产品介绍
- 图文内容沉淀

## 基本流程

1. 切换到“长文”。
2. 在左侧输入 Markdown 内容。
3. 在右侧查看长文预览。
4. 调整主题、字体、字号和主题色。
5. 需要拆成图文时，点击“转图文”。

## 推荐结构

# 主标题

开头先讲清楚这篇文章解决什么问题。

## 第一部分

用短段落展开观点。每段尽量只讲一件事。

> 可以用引用块放关键判断、金句或提醒。

## 第二部分

中间可以插入图片，辅助说明复杂内容。

## 结尾

最后做总结，给读者一个明确动作。

## Markdown 写法

- \`#\` 一级标题
- \`##\` 二级标题
- \`###\` 三级标题
- \`**文字**\` 加粗
- \`*文字*\` 斜体
- \`> 内容\` 引用
- \`- 内容\` 列表
- \`[[image:img_xxxxx]]\` 图片

## 和图文模式互转

长文没写完也可以转图文。

图文没排完也可以转长文。

转换只改变排版方式，不会替你重写内容。`;

function builtInGuideProjects() {
  const cardsData = migrateStoredState({
    ...defaultFormState(),
    content: cardsGuideText,
    appMode: "cards",
    headerMode: "every",
    images: {},
  });
  const articleData = migrateStoredState({
    ...defaultFormState(),
    content: articleGuideText,
    appMode: "article",
    images: {},
  });
  return [
    {
      id: GUIDE_CARDS_PROJECT_ID,
      title: "图文卡片说明书",
      updatedAt: 0,
      data: cardsData,
      builtIn: true,
    },
    {
      id: GUIDE_ARTICLE_PROJECT_ID,
      title: "长文说明书",
      updatedAt: 0,
      data: articleData,
      builtIn: true,
    },
  ];
}

function isBuiltInProjectId(projectId) {
  return String(projectId || "").startsWith(BUILT_IN_PROJECT_PREFIX);
}

function isBuiltInProject(project) {
  return Boolean(project?.builtIn || isBuiltInProjectId(project?.id));
}

function allHistoryProjects() {
  return [...builtInGuideProjects(), ...state.projects];
}

function findHistoryProject(projectId) {
  return allHistoryProjects().find((project) => project.id === projectId) || null;
}

function syncGuideReadOnlyMode() {
  const readOnly = isBuiltInProjectId(state.currentProjectId);
  document.body.dataset.guideReadonly = readOnly ? "true" : "false";
  els.content.readOnly = readOnly;
  els.content.setAttribute("aria-readonly", readOnly ? "true" : "false");

  document
    .querySelectorAll(
      ".mode-switch button, #convertModeBtn, #headerModeToggleBtn, #themeToggleBtn, .editor-controls button, .editor-controls input, .editor-controls select, .editor-controls summary",
    )
    .forEach((control) => {
      if (control instanceof HTMLDetailsElement) return;
      if ("disabled" in control) control.disabled = readOnly;
      control.setAttribute("aria-disabled", readOnly ? "true" : "false");
      if (readOnly) {
        control.dataset.previousTabIndex = control.getAttribute("tabindex") || "";
        control.setAttribute("tabindex", "-1");
      } else {
        const previousTabIndex = control.dataset.previousTabIndex;
        if (previousTabIndex) {
          control.setAttribute("tabindex", previousTabIndex);
        } else {
          control.removeAttribute("tabindex");
        }
        delete control.dataset.previousTabIndex;
      }
    });

  if (readOnly) {
    document.querySelectorAll(".editor-controls details[open]").forEach((details) => details.removeAttribute("open"));
  }
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
    lineHeight: clamp(Number(els.lineHeight.value) || 1.65, 1, 2.4),
    zhFont: FONT_STACKS[els.zhFont.value] ? els.zhFont.value : "zh-system",
    enFont: FONT_STACKS[els.enFont.value] ? els.enFont.value : "en-system",
    imageHeight: clamp(Number(els.imageHeight.value) || CARD_MAX_IMAGE_HEIGHT, 220, CARD_MAX_IMAGE_HEIGHT),
    headerMode: state.headerMode === "first" ? "first" : "every",
    appMode: state.appMode === "article" ? "article" : "cards",
    articleTheme: normalizeArticleTheme(state.articleTheme),
    articleFont: normalizeArticleFont(state.articleFont),
    articleSize: normalizeArticleSize(state.articleSize),
    articleColor: normalizeArticleColor(state.articleColor),
    uiTheme: state.uiTheme,
    avatar: state.avatar,
    avatarCrop: state.avatarCrop,
    images: state.images,
  };
}

function applyForm(data) {
  els.content.value = data.content ?? defaultText;
  els.displayName.value = data.displayName ?? "捏捏番茄（AI图文版）";
  els.handle.value = data.handle ?? DEFAULT_HANDLE;
  els.textColor.value = data.textColor ?? "#202938";
  els.accentColor.value = data.accentColor ?? "#2563eb";
  els.bgColor.value = data.bgColor ?? "#ffffff";
  els.fontSize.value = data.fontSize ?? "31";
  els.lineHeight.value = data.lineHeight ?? "1.65";
  els.zhFont.value = FONT_STACKS[data.zhFont] ? data.zhFont : "zh-system";
  els.enFont.value = FONT_STACKS[data.enFont] ? data.enFont : "en-system";
  const storedImageHeight = String(data.imageHeight ?? CARD_MAX_IMAGE_HEIGHT);
  els.imageHeight.value = ["380", "520"].includes(storedImageHeight)
    ? String(CARD_MAX_IMAGE_HEIGHT)
    : storedImageHeight;
  state.headerMode = data.headerMode === "first" ? "first" : "every";
  state.appMode = data.appMode === "article" ? "article" : "cards";
  state.articleTheme = normalizeArticleTheme(data.articleTheme);
  state.articleFont = normalizeArticleFont(data.articleFont);
  state.articleSize = normalizeArticleSize(data.articleSize);
  state.articleColor = normalizeArticleColor(data.articleColor);
  updateAppMode();
  updateHeaderModeButton();
  updateArticleControls();
  setUiTheme(data.uiTheme || "light", false, true);
  state.avatar = data.avatar || sampleAvatar;
  state.avatarCrop = data.avatarCrop || null;
  state.images = normalizeImagesForContent(data.content, data.images);
  updateAvatarPreview();
  document.documentElement.style.setProperty("--brush-color", els.inlineColor.value);
  document.documentElement.style.setProperty("--text-bg-brush-color", els.inlineBgColor.value);
  updateImageList();
}

function setUiTheme(theme, announce = false, syncCard = false) {
  const normalizedTheme = theme === "ink" ? "dark" : theme === "paper" ? "light" : theme;
  const nextTheme = UI_THEMES.includes(normalizedTheme) ? normalizedTheme : "light";
  state.uiTheme = nextTheme;
  document.documentElement.dataset.uiTheme = nextTheme;
  if (syncCard) syncCardColorsToTheme(nextTheme);
  if (els.themeToggle) {
    const label = UI_THEME_LABELS[nextTheme];
    els.themeToggle.title = `切换黑白主题：当前 ${label}`;
    els.themeToggle.setAttribute("aria-label", `切换黑白主题，当前 ${label}`);
  }
  if (announce) {
    els.status.textContent = `已切换为${UI_THEME_LABELS[nextTheme]}主题`;
  }
}

function syncCardColorsToTheme(theme) {
  const colors = CARD_THEME_COLORS[theme] || CARD_THEME_COLORS.light;
  els.textColor.value = colors.textColor;
  els.accentColor.value = colors.accentColor;
  els.bgColor.value = colors.bgColor;
}

async function toggleUiTheme() {
  const index = UI_THEMES.indexOf(state.uiTheme);
  const nextTheme = UI_THEMES[(index + 1) % UI_THEMES.length];
  setUiTheme(nextTheme, false, true);
  await render();
  els.status.textContent = `已切换为${UI_THEME_LABELS[nextTheme]}主题`;
}

function updateHeaderModeButton() {
  if (!els.headerModeToggle) return;
  const firstOnly = state.headerMode === "first";
  els.headerModeToggle.classList.toggle("active", firstOnly);
  els.headerModeToggle.innerHTML = `<i data-lucide="${firstOnly ? "user-round-check" : "user-round"}"></i>${firstOnly ? "仅首页头像" : "每页头像"}`;
  els.headerModeToggle.title = firstOnly ? "当前仅首页显示头像昵称，点击改为每页显示" : "当前每页显示头像昵称，点击改为仅首页显示";
  els.headerModeToggle.setAttribute("aria-label", els.headerModeToggle.title);
  if (window.lucide) window.lucide.createIcons();
}

async function toggleHeaderMode() {
  state.headerMode = state.headerMode === "first" ? "every" : "first";
  updateHeaderModeButton();
  await render();
  els.status.textContent = state.headerMode === "first" ? "仅首页显示个人信息" : "每张图片都显示个人信息";
}

function updateAppMode() {
  document.body.dataset.appMode = state.appMode;
  els.modeButtons.forEach((button) => {
    const active = button.dataset.appMode === state.appMode;
    button.classList.toggle("active", active);
  });
  const targetMode = state.appMode === "article" ? "cards" : "article";
  const targetLabel = targetMode === "article" ? "转长文" : "转图文";
  els.convertMode.dataset.targetMode = targetMode;
  els.convertMode.setAttribute("aria-label", targetLabel);
  els.convertMode.setAttribute("title", targetMode === "article" ? "将当前内容转为长文" : "将当前内容自动分页为图文卡片");
  els.convertMode.querySelector("span").textContent = targetLabel;
  els.articleSettings.hidden = state.appMode !== "article";
  els.scrollMode.hidden = state.appMode === "article";
  els.downloadZip.hidden = state.appMode === "article";
  els.downloadArticle.hidden = state.appMode !== "article";
  els.headerModeToggle.hidden = state.appMode === "article";
}

async function setAppMode(mode) {
  const nextMode = mode === "article" ? "article" : "cards";
  if (state.appMode === nextMode) return;
  state.appMode = nextMode;
  state.scrollOffset = 0;
  updateAppMode();
  await render();
}

async function convertCurrentMode() {
  const nextMode = state.appMode === "article" ? "cards" : "article";
  await setAppMode(nextMode);
  els.status.textContent = nextMode === "article" ? "已转为长文" : "已转为图文卡片，并自动分页排版";
}

function updateArticleControls() {
  els.articleThemeButtons.forEach((button) => button.classList.toggle("active", button.dataset.articleTheme === state.articleTheme));
  els.articleFontButtons.forEach((button) => button.classList.toggle("active", button.dataset.articleFont === state.articleFont));
  els.articleSizeButtons.forEach((button) => button.classList.toggle("active", button.dataset.articleSize === state.articleSize));
  els.articleColorButtons.forEach((button) => button.classList.toggle("active", button.dataset.articleColor?.toLowerCase() === state.articleColor.toLowerCase()));
}

async function setArticleOption(type, value) {
  if (type === "theme") state.articleTheme = normalizeArticleTheme(value);
  if (type === "font") state.articleFont = normalizeArticleFont(value);
  if (type === "size") state.articleSize = normalizeArticleSize(value);
  if (type === "color") state.articleColor = normalizeArticleColor(value);
  updateArticleControls();
  await render();
}

function normalizeHandle(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "@profile";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function normalizeArticleTheme(value) {
  return ["classic", "elegant", "clean", "wechat", "colorful"].includes(value) ? value : "wechat";
}

function normalizeArticleFont(value) {
  return ["sans", "serif", "mono"].includes(value) ? value : "sans";
}

function normalizeArticleSize(value) {
  return ["small", "normal", "large"].includes(value) ? value : "normal";
}

function normalizeArticleColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || "")) ? value : "#0f766e";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loadPanelLayout() {
  try {
    const stored = JSON.parse(localStorage.getItem(PANEL_LAYOUT_STORAGE_KEY) || "{}");
    state.panelLayout.history = clamp(Number(stored.history) || PANEL_LIMITS.history.fallback, PANEL_LIMITS.history.min, PANEL_LIMITS.history.max);
    state.panelLayout.editor = clamp(Number(stored.editor) || PANEL_LIMITS.editor.fallback, PANEL_LIMITS.editor.min, PANEL_LIMITS.editor.max);
  } catch {
    state.panelLayout.history = PANEL_LIMITS.history.fallback;
    state.panelLayout.editor = PANEL_LIMITS.editor.fallback;
  }
}

function savePanelLayout() {
  localStorage.setItem(PANEL_LAYOUT_STORAGE_KEY, JSON.stringify(state.panelLayout));
}

function applyPanelLayout() {
  els.workspace?.style.setProperty("--history-width", `${Math.round(state.panelLayout.history)}px`);
  els.workspace?.style.setProperty("--editor-width", `${Math.round(state.panelLayout.editor)}px`);
}

function startPanelResize(event) {
  const target = event.currentTarget.dataset.panelResize;
  if (!["history", "editor"].includes(target)) return;
  if (window.matchMedia("(max-width: 980px)").matches) return;

  event.preventDefault();
  if (target === "history" && !els.historySidebar?.classList.contains("open")) {
    setHistoryOpen(true);
  }

  const startX = event.clientX;
  const startEditor = state.panelLayout.editor;
  const workspaceRect = els.workspace.getBoundingClientRect();
  const resizeHandle = event.currentTarget;
  resizeHandle.classList.add("active");
  document.body.classList.add("resizing-panels");
  resizeHandle.setPointerCapture?.(event.pointerId);

  const move = (moveEvent) => {
    if (target === "history") {
      const nextHistory = moveEvent.clientX - workspaceRect.left;
      state.panelLayout.history = clamp(nextHistory, PANEL_LIMITS.history.min, PANEL_LIMITS.history.max);
    } else {
      const nextEditor = startEditor + moveEvent.clientX - startX;
      state.panelLayout.editor = clamp(nextEditor, PANEL_LIMITS.editor.min, PANEL_LIMITS.editor.max);
    }
    applyPanelLayout();
  };

  const stop = (upEvent) => {
    resizeHandle.classList.remove("active");
    document.body.classList.remove("resizing-panels");
    resizeHandle.releasePointerCapture?.(upEvent.pointerId);
    savePanelLayout();
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
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
    const data = readForm();
    if (isBuiltInProjectId(state.currentProjectId)) {
      updateProjectHistory();
      return;
    }

    const now = Date.now();
    let current = state.projects.find((project) => project.id === state.currentProjectId);
    if (!current) {
      current = createProject(data);
      state.currentProjectId = current.id;
      state.projects.unshift(current);
    }
    current.data = data;
    current.title = projectTitleFromData(data);
    current.updatedAt = now;
    state.projects = [
      current,
      ...state.projects.filter((project) => project.id !== current.id),
    ].slice(0, MAX_PROJECTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    saveProjectStore();
    updateProjectHistory();
  } catch {
    els.status.textContent = "本次内容较大，浏览器未写入本地缓存";
  }
}

function loadState() {
  const store = loadProjectStore();
  state.projects = store.projects;
  state.currentProjectId = store.activeId || store.projects[0]?.id || GUIDE_CARDS_PROJECT_ID;
  return findHistoryProject(state.currentProjectId)?.data || findHistoryProject(GUIDE_CARDS_PROJECT_ID)?.data || defaultFormState();
}

function migrateStoredState(data) {
  const oldBoldQuote =
    "**“请你从某个领域里，选择一个研究生水平的概念。然后写一个寓言故事，用间接的方式把这个概念讲清楚。不要一开始就说答案，尽量到故事快结束的时候，才让人意识到原来讲的是这个概念。故事结束后，再解释这个概念，以及故事里的隐喻分别对应什么。”**";
  if (typeof data.content !== "string") data.content = defaultText;
  data.content = data.content.replace(
    oldBoldQuote,
    "“请你从某个领域里，选择一个研究生水平的概念。然后写一个寓言故事，用间接的方式把这个概念讲清楚。不要一开始就说答案，尽量到故事快结束的时候，才让人意识到原来讲的是这个概念。故事结束后，再解释这个概念，以及故事里的隐喻分别对应什么。”",
  );
  if (["380", "520"].includes(String(data.imageHeight))) data.imageHeight = String(CARD_MAX_IMAGE_HEIGHT);
  if (!data.handle || data.handle === "@heytomato") data.handle = DEFAULT_HANDLE;
  if (!Number.isFinite(Number(data.lineHeight))) data.lineHeight = "1.65";
  if (Math.abs(Number(data.lineHeight) - 1.85) < 0.001) data.lineHeight = "1.65";
  data.headerMode = data.headerMode === "first" ? "first" : "every";
  data.appMode = data.appMode === "article" ? "article" : "cards";
  data.articleTheme = normalizeArticleTheme(data.articleTheme);
  data.articleFont = normalizeArticleFont(data.articleFont);
  data.articleSize = normalizeArticleSize(data.articleSize);
  data.articleColor = normalizeArticleColor(data.articleColor);
  data.images = normalizeImagesForContent(data.content, data.images);
  return data;
}

function defaultImages() {
  return {
    sample: {
      src: sampleImage,
      name: "sample",
    },
  };
}

function normalizeImagesForContent(content, images) {
  const nextImages = images && typeof images === "object" ? { ...images } : {};
  if (String(content || "").includes("[[image:sample]]") && !nextImages.sample) {
    nextImages.sample = defaultImages().sample;
  }
  return nextImages;
}

function createProject(data = defaultFormState()) {
  const normalized = migrateStoredState({ ...defaultFormState(), ...data });
  const now = Date.now();
  return {
    id: `project_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    title: projectTitleFromData(normalized),
    updatedAt: now,
    data: normalized,
  };
}

function loadProjectStore() {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const projects = Array.isArray(parsed.projects)
        ? parsed.projects.map(normalizeProject).filter(Boolean).slice(0, MAX_PROJECTS)
        : [];
      const activeId = isBuiltInProjectId(parsed.activeId)
        ? parsed.activeId
        : projects.some((project) => project.id === parsed.activeId)
          ? parsed.activeId
          : projects[0]?.id || GUIDE_CARDS_PROJECT_ID;
      return { activeId, projects };
    }

    const legacyRaw = localStorage.getItem(STORAGE_KEY);
    if (!legacyRaw) return { activeId: GUIDE_CARDS_PROJECT_ID, projects: [] };

    const legacyData = JSON.parse(legacyRaw);
    const project = createProject(legacyData);
    return { activeId: project.id, projects: [project] };
  } catch {
    return { activeId: GUIDE_CARDS_PROJECT_ID, projects: [] };
  }
}

function normalizeProject(project) {
  if (!project || typeof project !== "object") return null;
  if (isBuiltInProjectId(project.id)) return null;
  const data = migrateStoredState({ ...defaultFormState(), ...(project.data || {}) });
  const updatedAt = Number(project.updatedAt) || Date.now();
  return {
    id: project.id || `project_${updatedAt.toString(36)}`,
    title: project.title || projectTitleFromData(data),
    updatedAt,
    data,
  };
}

function saveProjectStore() {
  localStorage.setItem(
    PROJECTS_STORAGE_KEY,
    JSON.stringify({
      activeId: state.currentProjectId,
      projects: state.projects.filter((project) => !isBuiltInProject(project)).slice(0, MAX_PROJECTS),
    }),
  );
}

function projectTitleFromData(data) {
  const contentLine = String(data.content || "")
    .split("\n")
    .map((line) => line.replace(/^\s*#+\s*/, "").trim())
    .find((line) => line && !line.startsWith("[[image:"));
  return (contentLine || data.displayName || "未命名图文").slice(0, 24);
}

function formatProjectTime(time) {
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function projectType(project) {
  return project?.data?.appMode === "article" ? "article" : "cards";
}

function projectTypeLabel(type) {
  return type === "article" ? "长文" : "图文";
}

function updateProjectHistory() {
  if (!els.projectHistory) return;
  els.projectHistory.innerHTML = "";
  els.historyFilterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.historyFilter === state.historyFilter);
  });

  const visibleProjects = allHistoryProjects().filter((project) => {
    if (state.historyFilter === "all") return true;
    return projectType(project) === state.historyFilter;
  });

  if (!visibleProjects.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = state.historyFilter === "article" ? "暂无长文记录" : state.historyFilter === "cards" ? "暂无图文记录" : "暂无历史记录";
    els.projectHistory.append(empty);
    return;
  }

  for (const project of visibleProjects) {
    const type = projectType(project);
    const builtIn = isBuiltInProject(project);
    const item = document.createElement("div");
    item.className = "history-item";
    item.classList.toggle("built-in", builtIn);
    item.classList.toggle("active", project.id === state.currentProjectId);
    item.dataset.projectType = type;
    item.dataset.projectId = project.id;
    item.innerHTML = `
      <button type="button" class="history-open">
        <span>${escapeHtml(project.title || "未命名图文")}</span>
        <small><b>${builtIn ? "说明" : projectTypeLabel(type)}</b>${builtIn ? projectTypeLabel(type) : formatProjectTime(project.updatedAt)}</small>
      </button>
      ${
        builtIn
          ? '<span class="history-lock" title="内置说明书不可修改"><i data-lucide="lock"></i></span>'
          : `<button type="button" class="history-delete" title="删除历史记录" aria-label="删除 ${escapeHtml(project.title || "未命名图文")}">
              <i data-lucide="trash-2"></i>
            </button>`
      }
    `;
    item.querySelector(".history-open").addEventListener("click", () => openProject(project.id));
    item.querySelector(".history-delete")?.addEventListener("click", () => deleteProject(project.id));
    els.projectHistory.append(item);
  }
  if (window.lucide) window.lucide.createIcons();
}

function setHistoryFilter(filter) {
  state.historyFilter = ["all", "cards", "article"].includes(filter) ? filter : "all";
  updateProjectHistory();
}

function setHistoryOpen(open) {
  if (!els.historySidebar) return;
  els.historySidebar.classList.toggle("open", open);
  els.workspace?.classList.toggle("history-open", open);
  els.historyToggle?.setAttribute("aria-label", open ? "收起历史记录" : "打开历史记录");
  els.historyToggle?.setAttribute("title", open ? "收起历史记录" : "打开历史记录");
}

function toggleHistory() {
  setHistoryOpen(!els.historySidebar?.classList.contains("open"));
}

async function openProject(projectId) {
  if (!projectId || projectId === state.currentProjectId) return;
  saveState();
  const project = findHistoryProject(projectId);
  if (!project) return;
  state.currentProjectId = project.id;
  state.scrollOffset = 0;
  applyForm(project.data);
  syncGuideReadOnlyMode();
  if (isBuiltInProject(project)) saveProjectStore();
  resetTextHistory();
  updateProjectHistory();
  await render();
  els.status.textContent = isBuiltInProject(project) ? `已打开内置说明书：${project.title}` : `已打开：${project.title || "未命名图文"}`;
}

async function deleteProject(projectId) {
  if (isBuiltInProjectId(projectId)) {
    els.status.textContent = "内置说明书不可删除";
    return;
  }
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return;
  const deletingCurrent = project.id === state.currentProjectId;
  state.projects = state.projects.filter((item) => item.id !== project.id);

  if (!state.projects.length) {
    const guideProject = findHistoryProject(GUIDE_CARDS_PROJECT_ID);
    state.currentProjectId = GUIDE_CARDS_PROJECT_ID;
    state.mode = "auto";
    state.scrollOffset = 0;
    applyForm(guideProject?.data || defaultFormState());
    syncGuideReadOnlyMode();
    resetTextHistory();
    saveProjectStore();
    updateProjectHistory();
    await render();
    els.status.textContent = "已删除全部草稿，已回到图文卡片说明书";
    return;
  }

  if (deletingCurrent) {
    const nextProject = state.projects[0];
    state.currentProjectId = nextProject.id;
    state.mode = "auto";
    state.scrollOffset = 0;
    applyForm(nextProject.data);
    syncGuideReadOnlyMode();
    resetTextHistory();
    saveProjectStore();
    updateProjectHistory();
    await render();
    els.status.textContent = `已删除并打开：${nextProject.title || "未命名图文"}`;
    return;
  }

  saveProjectStore();
  updateProjectHistory();
  els.status.textContent = `已删除：${project.title || "未命名图文"}`;
}

async function createNewProject() {
  saveState();
  const project = createProject(blankFormState());
  state.projects = [project, ...state.projects.filter((item) => item.id !== project.id)].slice(0, MAX_PROJECTS);
  state.currentProjectId = project.id;
  state.mode = "auto";
  state.scrollOffset = 0;
  applyForm(project.data);
  syncGuideReadOnlyMode();
  resetTextHistory();
  updateProjectHistory();
  await render();
  els.status.textContent = "已新建图文，上一条已保存在历史记录";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
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
  const key = event.key.toLowerCase();
  const isModifierShortcut = (event.metaKey || event.ctrlKey) && !event.altKey;
  if (!isModifierShortcut) return;

  if (key === "b" && !event.shiftKey) {
    event.preventDefault();
    wrapSelection("bold");
    return;
  }

  if (key === "i" && !event.shiftKey) {
    event.preventDefault();
    wrapSelection("italic");
    return;
  }

  const isUndoKey = key === "z";
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

function wrapSelectionWithBackground() {
  commitTextHistory();
  const textarea = els.content;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || "底色文字";
  const color = els.inlineBgColor.value;
  const next = `{{bg:${color}|${selected}}}`;
  textarea.value = `${textarea.value.slice(0, start)}${next}${textarea.value.slice(end)}`;
  textarea.focus();
  textarea.setSelectionRange(start + next.length, start + next.length);
  commitTextHistory();
  requestRender();
}

function enableColorBrush() {
  state.colorBrush = true;
  state.bgColorBrush = false;
  document.documentElement.style.setProperty("--brush-color", els.inlineColor.value);
  els.colorTool?.classList.add("active");
  els.bgColorTool?.classList.remove("active");
  els.colorMenu.open = false;
  els.status.textContent = "刷色已开启，选中一段文字即可上色";
}

function disableColorBrush() {
  state.colorBrush = false;
  els.colorTool?.classList.remove("active");
  els.colorMenu.open = false;
}

function enableBackgroundBrush() {
  state.bgColorBrush = true;
  state.colorBrush = false;
  document.documentElement.style.setProperty("--text-bg-brush-color", els.inlineBgColor.value);
  els.bgColorTool?.classList.add("active");
  els.colorTool?.classList.remove("active");
  els.bgColorMenu.open = false;
  els.status.textContent = "背景上色已开启，选中一段文字即可加底色";
}

function disableBackgroundBrush() {
  state.bgColorBrush = false;
  els.bgColorTool?.classList.remove("active");
  els.bgColorMenu.open = false;
}

function applyColorBrushToSelection() {
  if (!state.colorBrush) return;
  if (document.activeElement !== els.content) return;
  if (els.content.selectionStart === els.content.selectionEnd) return;
  wrapSelectionWithColor();
  disableColorBrush();
  els.status.textContent = "已应用选中文字颜色";
}

function applyBackgroundBrushToSelection() {
  if (!state.bgColorBrush) return;
  if (document.activeElement !== els.content) return;
  if (els.content.selectionStart === els.content.selectionEnd) return;
  wrapSelectionWithBackground();
  els.status.textContent = "已应用背景色，可继续选中文字刷色，点取消结束";
}

function applyActiveBrushToSelection() {
  window.setTimeout(() => {
    applyColorBrushToSelection();
    applyBackgroundBrushToSelection();
  }, 0);
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

function isImageFile(file) {
  return file?.type?.startsWith("image/") || /\.(avif|bmp|gif|heic|jpe?g|png|svg|webp)$/i.test(file?.name || "");
}

function createImportedImageId(index = 0) {
  const random = window.crypto?.randomUUID?.().slice(0, 8) || Math.random().toString(36).slice(2, 10);
  return `img_${Date.now().toString(36)}_${index.toString(36)}_${random}`;
}

function sourcePathForFile(file) {
  return file.webkitRelativePath || file.name || "图片";
}

async function addImageFiles(files, sourcePaths = null) {
  const imageFiles = Array.from(files || []).filter(isImageFile);
  const tags = [];
  const ids = [];

  for (const [index, file] of imageFiles.entries()) {
    const src = await readFileAsDataURL(file);
    const id = createImportedImageId(index);
    state.images[id] = {
      src,
      name: file.name || "图片",
      sourcePath: sourcePaths?.get(file) || sourcePathForFile(file),
      crop: null,
      layout: defaultNewImageLayout(),
    };
    ids.push(id);
    tags.push(`[[image:${id}]]`);
  }

  return { ids, tags, skipped: Array.from(files || []).length - imageFiles.length };
}

function insertImageTagsAtCursor(tags) {
  if (!tags.length) return;
  insertAtSelection(els.content, `\n${tags.join("\n\n")}\n`);
  updateImageList();
}

async function handleContentImage(event) {
  const result = await addImageFiles(event.target.files);
  event.target.value = "";
  if (!result.tags.length) return;
  insertImageTagsAtCursor(result.tags);
  els.status.textContent = `已插入 ${result.tags.length} 张图片`;
}

function normalizeObsidianImagePath(value) {
  let path = String(value || "").trim().replace(/^<|>$/g, "");
  try {
    path = decodeURIComponent(path);
  } catch {
    // Keep the original text when the reference contains an incomplete escape sequence.
  }
  return path
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/[?#].*$/, "")
    .replace(/^\/+/, "")
    .toLowerCase();
}

function imageReferenceKeys(reference) {
  const path = normalizeObsidianImagePath(reference);
  if (!path) return [];
  const name = path.split("/").filter(Boolean).pop();
  return name && name !== path ? [path, name] : [path];
}

function buildImageReferenceLookup(images) {
  const lookup = new Map();
  Object.entries(images || {}).forEach(([id, image]) => {
    imageReferenceKeys(image?.sourcePath || image?.name).forEach((key) => {
      if (!lookup.has(key)) lookup.set(key, []);
      lookup.get(key).push(id);
    });
  });
  return lookup;
}

function resolveObsidianImageReference(reference, lookup) {
  const keys = imageReferenceKeys(reference);
  for (const key of keys) {
    const ids = lookup.get(key) || [];
    if (ids.length === 1) return { id: ids[0] };
    if (ids.length > 1) return { ambiguous: true };
  }
  return { missing: true };
}

function convertObsidianImageReferences(markdown, images) {
  const lookup = buildImageReferenceLookup(images);
  const unresolved = new Set();
  let matched = 0;
  const replaceReference = (whole, reference) => {
    const target = String(reference || "").split("|")[0].trim();
    const result = resolveObsidianImageReference(target, lookup);
    if (result.id) {
      matched += 1;
      return `[[image:${result.id}]]`;
    }
    unresolved.add(`${result.ambiguous ? "重复文件名：" : "未找到："}${target}`);
    return whole;
  };

  let content = String(markdown || "").replace(/!\[\[([^\]\n]+)\]\]/g, replaceReference);
  content = content.replace(/!\[[^\]\n]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+[^)]*)?\)/g, (whole, wrappedPath, plainPath) => {
    return replaceReference(whole, wrappedPath || plainPath);
  });
  return { content, matched, unresolved: Array.from(unresolved) };
}

function countMarkdownImageReferences(markdown) {
  const text = String(markdown || "");
  return (text.match(/!\[\[[^\]\n]+\]\]/g) || []).length + (text.match(/!\[[^\]\n]*\]\([^)]*\)/g) || []).length;
}

function openObsidianVaultDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("浏览器不支持本地仓库授权保存"));
      return;
    }
    const request = window.indexedDB.open(OBSIDIAN_VAULT_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(OBSIDIAN_VAULT_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readStoredObsidianVault() {
  const db = await openObsidianVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OBSIDIAN_VAULT_STORE, "readonly");
    const request = transaction.objectStore(OBSIDIAN_VAULT_STORE).get(OBSIDIAN_VAULT_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function saveObsidianVault(handle) {
  const db = await openObsidianVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OBSIDIAN_VAULT_STORE, "readwrite");
    transaction.objectStore(OBSIDIAN_VAULT_STORE).put(handle, OBSIDIAN_VAULT_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function setObsidianVaultStatus(message, connected = false) {
  const statusText = String(message || "");
  if (statusText.startsWith("已连接：")) {
    els.obsidianVaultStatus.innerHTML = `已连接：<b>${escapeHtml(statusText.replace(/^已连接：/, ""))}</b>`;
  } else {
    els.obsidianVaultStatus.textContent = statusText;
  }
  els.obsidianVaultStatus.parentElement?.classList.toggle("is-connected", connected);
  els.obsidianImportMenu?.classList.toggle("is-vault-connected", Boolean(obsidianVault.handle));
  els.connectObsidianVault.innerHTML = connected
    ? '<i data-lucide="folder-cog"></i> 更换仓库'
    : '<i data-lucide="folder-open"></i> 连接 Obsidian 仓库';
  if (window.lucide) window.lucide.createIcons();
}

function canUseDirectoryPickerSafely() {
  const userAgent = navigator.userAgent || "";
  const embeddedBrowser = /Electron|Codex|ChatGPT|OpenAI/i.test(userAgent);
  const localPage = ["localhost", "127.0.0.1", ""].includes(window.location.hostname) || window.location.protocol === "file:";
  return Boolean(window.showDirectoryPicker && window.isSecureContext && !embeddedBrowser && !localPage);
}

function hasConnectedObsidianVault() {
  return Boolean(obsidianVault.handle || obsidianVault.fileLookup);
}

function buildVaultFileLookup(files) {
  const lookup = new Map();
  Array.from(files || []).filter(isImageFile).forEach((file) => {
    imageReferenceKeys(sourcePathForFile(file)).forEach((key) => {
      if (!lookup.has(key)) lookup.set(key, []);
      lookup.get(key).push(file);
    });
  });
  return lookup;
}

function findFileInSelectedVault(reference) {
  if (!obsidianVault.fileLookup) return null;
  for (const key of imageReferenceKeys(reference)) {
    const files = obsidianVault.fileLookup.get(key) || [];
    if (files.length === 1) return files[0];
  }
  return null;
}

async function loadObsidianVaultConnection() {
  if (!canUseDirectoryPickerSafely()) {
    setObsidianVaultStatus("点击连接仓库后选择 Obsidian 文件夹");
    return;
  }
  try {
    const handle = await readStoredObsidianVault();
    if (!handle) return;
    obsidianVault.handle = handle;
    const permission = await handle.queryPermission({ mode: "read" });
    setObsidianVaultStatus(permission === "granted" ? `已连接：${handle.name}` : `已记住：${handle.name}（首次粘贴时确认读取）`, permission === "granted");
  } catch {
    setObsidianVaultStatus("尚未连接仓库");
  }
}

async function connectObsidianVault() {
  if (!canUseDirectoryPickerSafely()) {
    els.obsidianVaultFolder?.click();
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: "read" });
    obsidianVault.handle = handle;
    obsidianVault.fileLookup = null;
    await saveObsidianVault(handle);
    setObsidianVaultStatus(`已连接：${handle.name}`, true);
    els.status.textContent = "仓库已连接。以后直接把 Obsidian Markdown 粘贴到正文编辑区即可。";
  } catch (error) {
    if (error?.name !== "AbortError") setObsidianVaultStatus("连接失败，请重新选择 Obsidian 仓库根目录。");
  }
}

function handleObsidianVaultFolder(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = "";
  if (!files.length) return;
  const rootName = files[0]?.webkitRelativePath?.split("/")?.[0] || "已选择的仓库";
  obsidianVault.handle = null;
  obsidianVault.fileLookup = buildVaultFileLookup(files);
  setObsidianVaultStatus(`已连接：${rootName}`, true);
  els.status.textContent = "仓库已连接。以后直接把 Obsidian Markdown 粘贴到正文编辑区即可。";
}

async function ensureObsidianVaultPermission() {
  if (obsidianVault.fileLookup) return true;
  if (!obsidianVault.handle) return false;
  let permission = await obsidianVault.handle.queryPermission({ mode: "read" });
  if (permission !== "granted") permission = await obsidianVault.handle.requestPermission({ mode: "read" });
  const granted = permission === "granted";
  setObsidianVaultStatus(granted ? `已连接：${obsidianVault.handle.name}` : `需要允许读取：${obsidianVault.handle.name}`, granted);
  return granted;
}

function extractMarkdownImageReferences(markdown) {
  const references = new Set();
  const text = String(markdown || "");
  for (const match of text.matchAll(/!\[\[([^\]\n]+)\]\]/g)) {
    references.add(match[1].split("|")[0].trim());
  }
  for (const match of text.matchAll(/!\[[^\]\n]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+[^)]*)?\)/g)) {
    references.add((match[1] || match[2] || "").trim());
  }
  return Array.from(references).filter(Boolean);
}

function vaultReferenceParts(reference) {
  let path = String(reference || "").trim().replace(/^<|>$/g, "");
  try {
    path = decodeURIComponent(path);
  } catch {
    // Keep the original text when the reference contains an incomplete escape sequence.
  }
  return path
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/[?#].*$/, "")
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean);
}

async function findFileInObsidianVault(reference) {
  if (/^https?:/i.test(String(reference || ""))) return null;
  const parts = vaultReferenceParts(reference);
  if (!parts.length) return null;
  try {
    let directory = obsidianVault.handle;
    for (const part of parts.slice(0, -1)) directory = await directory.getDirectoryHandle(part);
    return await directory.getFileHandle(parts[parts.length - 1]);
  } catch {
    return findObsidianFileByName(obsidianVault.handle, parts[parts.length - 1]);
  }
}

async function findObsidianFileByName(directory, name) {
  if (!directory || !name) return null;
  for await (const [entryName, handle] of directory.entries()) {
    if (handle.kind === "file" && entryName.toLowerCase() === name.toLowerCase()) return handle;
    if (handle.kind === "directory" && ![".git", ".obsidian", "node_modules"].includes(entryName)) {
      const found = await findObsidianFileByName(handle, name);
      if (found) return found;
    }
  }
  return null;
}

function replaceEditorContent(content) {
  commitTextHistory();
  els.content.value = content;
  els.content.focus();
  els.content.setSelectionRange(0, 0);
  commitTextHistory();
  updateImageList();
  requestRender();
}

function closeObsidianImportMenu() {
  els.obsidianImportMenu.open = false;
}

async function importMarkdownFromConnectedVault(markdown) {
  if (!hasConnectedObsidianVault() || obsidianVault.importing) return false;
  obsidianVault.importing = true;
  els.status.textContent = "正在从 Obsidian 仓库读取图片…";
  try {
    if (!(await ensureObsidianVaultPermission())) {
      els.status.textContent = "未获得仓库读取权限，请重新连接后再试。";
      return true;
    }
    const lookup = buildImageReferenceLookup(state.images);
    const files = [];
    const sourcePaths = new Map();
    const missing = [];
    for (const reference of extractMarkdownImageReferences(markdown)) {
      if (resolveObsidianImageReference(reference, lookup).id) continue;
      const selectedFile = findFileInSelectedVault(reference);
      if (selectedFile) {
        files.push(selectedFile);
        sourcePaths.set(selectedFile, reference);
        continue;
      }
      const handle = obsidianVault.handle ? await findFileInObsidianVault(reference) : null;
      if (!handle) {
        missing.push(reference);
        continue;
      }
      const file = await handle.getFile();
      files.push(file);
      sourcePaths.set(file, reference);
    }
    if (missing.length) {
      const message = `仓库已连接，但没有找到 ${missing.length} 张图片：${missing.slice(0, 3).join("、")}。请确认选择的是包含这些路径的 Obsidian 仓库根目录。`;
      replaceEditorContent(markdown);
      els.obsidianImportMenu.open = true;
      els.status.textContent = message;
      return true;
    }
    const imported = await addImageFiles(files, sourcePaths);
    const converted = convertObsidianImageReferences(markdown, state.images);
    if (converted.unresolved.length) {
      els.status.textContent = "发现重名图片，暂时无法自动判断该用哪一张。";
      return true;
    }
    replaceEditorContent(markdown);
    els.status.textContent = `已从仓库自动读取 ${imported.ids.length} 张图片并完成导入`;
    closeObsidianImportMenu();
    return true;
  } catch (error) {
    console.error(error);
    replaceEditorContent(markdown);
    els.status.textContent = "读取 Obsidian 仓库失败，请重新连接仓库后再试。";
    return true;
  } finally {
    obsidianVault.importing = false;
  }
}

function readDroppedEntry(entry) {
  if (!entry) return Promise.resolve([]);
  if (entry.isFile) {
    return new Promise((resolve) => entry.file((file) => resolve([file]), () => resolve([])));
  }
  if (!entry.isDirectory) return Promise.resolve([]);
  const reader = entry.createReader();
  const readBatch = () => new Promise((resolve) => reader.readEntries(resolve, () => resolve([])));
  const readAll = async () => {
    const entries = [];
    let batch;
    do {
      batch = await readBatch();
      entries.push(...batch);
    } while (batch.length);
    return (await Promise.all(entries.map(readDroppedEntry))).flat();
  };
  return readAll();
}

async function getDroppedFiles(dataTransfer) {
  const entries = Array.from(dataTransfer?.items || [])
    .map((item) => item.webkitGetAsEntry?.())
    .filter(Boolean);
  if (entries.length) return (await Promise.all(entries.map(readDroppedEntry))).flat();
  return Array.from(dataTransfer?.files || []);
}

async function handleEditorPaste(event) {
  const files = Array.from(event.clipboardData?.items || [])
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (!files.length) {
    const markdown = event.clipboardData?.getData("text/plain") || "";
    const references = countMarkdownImageReferences(markdown);
    if (!references) return;
    event.preventDefault();
    if (hasConnectedObsidianVault()) {
      await importMarkdownFromConnectedVault(markdown);
      return;
    }
    els.obsidianImportMenu.open = true;
    els.status.textContent = `检测到 ${references} 个 Obsidian 图片引用。请先连接 Obsidian 仓库后再粘贴。`;
    requestAnimationFrame(() => positionToolPopover(els.obsidianImportMenu));
    return;
  }
  event.preventDefault();
  const imported = await addImageFiles(files);
  insertImageTagsAtCursor(imported.tags);
  els.status.textContent = `已粘贴 ${imported.tags.length} 张图片`;
}

async function handleEditorDrop(event) {
  const hasFiles = Array.from(event.dataTransfer?.types || []).includes("Files");
  if (!hasFiles) return;
  event.preventDefault();
  const files = await getDroppedFiles(event.dataTransfer);
  if (!files.some(isImageFile)) return;
  const imported = await addImageFiles(files);
  insertImageTagsAtCursor(imported.tags);
  els.status.textContent = `已插入 ${imported.tags.length} 张图片`;
}

async function handleAvatar(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  state.avatar = await readFileAsDataURL(file);
  state.avatarCrop = null;
  updateAvatarPreview();
  updateImageList();
  requestRender();
  await openCropper("avatar");
  event.target.value = "";
}

async function updateAvatarPreview() {
  if (!els.avatarPreview) return;
  if (!state.avatarCrop) {
    els.avatarPreview.src = state.avatar;
    return;
  }

  try {
    const image = await loadImage(state.avatar);
    const crop = clampCropRect(state.avatarCrop, image);
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    drawSourceCoverImage(ctx, image, crop, 0, 0, canvas.width, canvas.height);
    els.avatarPreview.src = canvas.toDataURL("image/png");
  } catch {
    els.avatarPreview.src = state.avatar;
  }
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
    const layout = normalizeImageLayout(image.layout);
    const widthLabel = layout.fixedWidth && layout.fixedHeight
      ? `固定框 ${Math.round(layout.fixedWidth)}x${Math.round(layout.fixedHeight)}`
      : layout.widthPercent
        ? `${Math.round(layout.widthPercent)}%`
        : "自适应";
    status.textContent = `${image.crop ? "已裁剪" : "原图比例"} · ${widthLabel}`;
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

function defaultNewImageLayout() {
  const fixedWidth = normalizeFixedImageDimension(els.fixedImageWidth?.value, CARD_CONTENT_WIDTH);
  const fixedHeight = normalizeFixedImageDimension(els.fixedImageHeight?.value, CARD_MAX_IMAGE_HEIGHT);
  if (fixedWidth && fixedHeight) {
    return {
      fixedWidth,
      fixedHeight,
      align: "center",
    };
  }

  const percent = Number(els.imageWidthPercent?.value);
  if (!Number.isFinite(percent)) return null;
  return {
    widthPercent: clamp(percent, 25, 100),
    align: "center",
  };
}

function applyImageWidthToAll() {
  const entries = Object.entries(state.images);
  if (!entries.length) {
    els.status.textContent = "还没有插入图片";
    return;
  }

  const widthPercent = clamp(Number(els.imageWidthPercent?.value) || 100, 25, 100);
  if (els.imageWidthPercent) els.imageWidthPercent.value = String(Math.round(widthPercent));

  for (const [, image] of entries) {
    image.layout = {
      ...normalizeImageLayout(image.layout),
      widthPercent,
      fixedWidth: null,
      fixedHeight: null,
    };
  }

  updateImageList();
  saveState();
  render();
  els.status.textContent = `已将 ${entries.length} 张图片设置为 ${Math.round(widthPercent)}% 宽度`;
}

function applyFixedImageSizeToAll() {
  const entries = Object.entries(state.images);
  if (!entries.length) {
    els.status.textContent = "还没有插入图片";
    return;
  }

  const fixedWidth = normalizeFixedImageDimension(els.fixedImageWidth?.value, CARD_CONTENT_WIDTH);
  const fixedHeight = normalizeFixedImageDimension(els.fixedImageHeight?.value, CARD_MAX_IMAGE_HEIGHT);
  if (!fixedWidth || !fixedHeight) {
    els.status.textContent = "请输入固定宽度和固定高度";
    return;
  }

  if (els.fixedImageWidth) els.fixedImageWidth.value = String(Math.round(fixedWidth));
  if (els.fixedImageHeight) els.fixedImageHeight.value = String(Math.round(fixedHeight));

  for (const [, image] of entries) {
    image.layout = {
      ...normalizeImageLayout(image.layout),
      fixedWidth,
      fixedHeight,
      widthPercent: null,
    };
  }

  updateImageList();
  saveState();
  render();
  els.status.textContent = `已将 ${entries.length} 张图片设置为 ${Math.round(fixedWidth)}x${Math.round(fixedHeight)}`;
}

function normalizeFixedImageDimension(value, max) {
  const dimension = Number(value);
  if (!Number.isFinite(dimension) || dimension <= 0) return null;
  return clamp(dimension, 80, max);
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
    updateAvatarPreview();
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
    updateAvatarPreview();
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

function resolveMarkdownImageBlock(line, imageLookup) {
  const internal = line.match(/^\[\[image:([\w-]+)\]\]$/);
  if (internal) return internal[1];

  const obsidian = line.match(/^!\[\[([^\]\n]+)\]\]$/);
  if (obsidian) return resolveObsidianImageReference(obsidian[1].split("|")[0].trim(), imageLookup).id || null;

  const markdown = line.match(/^!\[[^\]\n]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+[^)]*)?\)$/);
  if (markdown) return resolveObsidianImageReference(markdown[1] || markdown[2], imageLookup).id || null;
  return null;
}

function isMarkdownImageBlock(line) {
  return /^\[\[image:[\w-]+\]\]$/.test(line)
    || /^!\[\[[^\]\n]+\]\]$/.test(line)
    || /^!\[[^\]\n]*\]\((?:<[^>]+>|[^\s)]+)(?:\s+[^)]*)?\)$/.test(line);
}

function parseBlocks(content, images = {}) {
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const imageLookup = buildImageReferenceLookup(images);
  const lineOffsets = [];
  let runningOffset = 0;
  lines.forEach((line) => {
    lineOffsets.push(runningOffset);
    runningOffset += line.length + 1;
  });
  const blocks = [];
  let paragraphLines = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    blocks.push({ type: "p", lines: paragraphLines });
    paragraphLines = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const hasContentBeforeLine = blocks.length > 0 || paragraphLines.length > 0;
    const leading = line.match(/^\s*/)[0].length;
    const trailing = line.match(/\s*$/)[0].length;
    const trimmed = line.slice(leading, line.length - trailing);
    const trimmedStart = lineOffsets[index] + leading;

    if (trimmed) {
      const imageId = resolveMarkdownImageBlock(trimmed, imageLookup);
      if (isMarkdownImageBlock(trimmed)) {
        flushParagraph();
        if (imageId) blocks.push({ type: "image", id: imageId });
      } else if (isMarkdownTableHeader(trimmed, lines[index + 1])) {
        flushParagraph();
        const headerCells = splitMarkdownTableRow(trimmed);
        const rows = [];
        let rowIndex = index + 2;
        while (rowIndex < lines.length) {
          const cells = splitMarkdownTableRow(lines[rowIndex].trim());
          if (!cells || !cells.length) break;
          rows.push(cells.map((cell) => parseInline(cell)));
          rowIndex += 1;
        }
        blocks.push({ type: "table", header: headerCells.map((cell) => parseInline(cell)), rows });
        index = rowIndex - 1;
      } else {
        const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
          flushParagraph();
          const level = heading[1].length;
          const contentStart = trimmedStart + heading[1].length + 1;
          blocks.push({ type: level === 1 ? "h1" : level === 2 ? "h2" : "h3", tokens: parseInline(heading[2].trim(), contentStart) });
        } else if (trimmed.startsWith("> ")) {
          flushParagraph();
          const contentStart = trimmedStart + 2 + countLeadingSpaces(trimmed.slice(2));
          blocks.push({ type: "quote", tokens: parseInline(trimmed.slice(2).trim(), contentStart) });
        } else if (/^([-*+]\s+|\d+[.)]\s+)/.test(trimmed)) {
          const text = trimmed.replace(/^([-*+]\s+|\d+[.)]\s+)/, "• ");
          paragraphLines.push(parseInline(text, trimmedStart));
        } else if (/^([-*_])(?:\s*\1){2,}\s*$/.test(trimmed)) {
          flushParagraph();
          blocks.push({ type: "spacer" });
        } else {
          paragraphLines.push(parseInline(trimmed, trimmedStart));
        }
      }
    } else {
      flushParagraph();
      if (hasContentBeforeLine) {
        blocks.push({ type: "spacer" });
      }
    }
  }

  flushParagraph();
  return blocks;
}

function splitMarkdownTableRow(line) {
  const value = String(line || "").trim();
  if (!value.includes("|")) return null;
  const cells = value.replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
  return cells.length > 1 ? cells : null;
}

function isMarkdownTableDivider(line) {
  const cells = splitMarkdownTableRow(line);
  return Boolean(cells?.length) && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isMarkdownTableHeader(line, nextLine) {
  return Boolean(splitMarkdownTableRow(line)?.length) && isMarkdownTableDivider(nextLine);
}

function countLeadingSpaces(text) {
  return text.match(/^\s*/)[0].length;
}

function applyInlineStyle(tokens, style) {
  return tokens.map((token) => {
    const next = { ...token };
    for (const [key, value] of Object.entries(style)) {
      if (next[key] === undefined) next[key] = value;
    }
    return next;
  });
}

function parseInline(text, baseStart = 0) {
  const tokens = [];
  let i = 0;

  while (i < text.length) {
    const colorMatch = text.slice(i).match(/^\{\{color:(#[0-9a-fA-F]{3,8})\|([\s\S]*?)\}\}/);
    if (colorMatch) {
      const textStart = baseStart + i + colorMatch[0].indexOf("|") + 1;
      tokens.push(...applyInlineStyle(parseInline(colorMatch[2], textStart), { color: colorMatch[1] }));
      i += colorMatch[0].length;
      continue;
    }

    const bgMatch = text.slice(i).match(/^\{\{bg:(#[0-9a-fA-F]{3,8})\|([\s\S]*?)\}\}/);
    if (bgMatch) {
      const textStart = baseStart + i + bgMatch[0].indexOf("|") + 1;
      tokens.push(...applyInlineStyle(parseInline(bgMatch[2], textStart), { bgColor: bgMatch[1] }));
      i += bgMatch[0].length;
      continue;
    }

    if (text.startsWith("**", i)) {
      const close = text.indexOf("**", i + 2);
      if (close !== -1) {
        tokens.push(...applyInlineStyle(parseInline(text.slice(i + 2, close), baseStart + i + 2), { bold: true }));
        i = close + 2;
        continue;
      }
    }

    if (text.startsWith("*", i)) {
      const close = text.indexOf("*", i + 1);
      if (close !== -1) {
        tokens.push(...applyInlineStyle(parseInline(text.slice(i + 1, close), baseStart + i + 1), { italic: true }));
        i = close + 1;
        continue;
      }
    }

    const nextMarkers = ["{{color:", "{{bg:", "**", "*"]
      .map((marker) => text.indexOf(marker, i + 1))
      .filter((index) => index !== -1);
    const next = nextMarkers.length ? Math.min(...nextMarkers) : text.length;
    tokens.push({ text: text.slice(i, next), sourceStart: baseStart + i, sourceEnd: baseStart + next });
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
  if (type === "h3") {
    return {
      ...fontSettings,
      size: Math.round(baseSize * 1.02),
      lineHeight: 1.55,
      weight: 620,
      italic: false,
      marginTop: 16,
      marginBottom: 4,
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
    marginTop: 5,
    marginBottom: 0,
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
  const emojiFont = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
  return /[A-Za-z0-9_@#%+./:-]/.test(text || "") ? `${enFont}, ${zhFont}, ${emojiFont}` : `${zhFont}, ${enFont}, ${emojiFont}`;
}

function splitTokenText(token) {
  const text = token.text || "";
  const segments = graphemeSegments(text);
  const units = [];
  let word = null;

  function flushWord() {
    if (!word) return;
    units.push(word);
    word = null;
  }

  for (const segment of segments) {
    if (/^[A-Za-z0-9_@#%+./:-]$/.test(segment.text)) {
      if (!word) word = { text: "", start: segment.start, end: segment.end };
      word.text += segment.text;
      word.end = segment.end;
      continue;
    }
    flushWord();
    units.push(segment);
  }

  flushWord();
  return units;
}

function graphemeSegments(text) {
  if (window.Intl?.Segmenter) {
    const segmenter = new Intl.Segmenter("zh", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (part) => ({
      text: part.segment,
      start: part.index,
      end: part.index + part.segment.length,
    }));
  }

  const result = [];
  let index = 0;
  for (const char of Array.from(text)) {
    result.push({ text: char, start: index, end: index + char.length });
    index += char.length;
  }
  return result;
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
    for (const unit of splitTokenText(token)) {
      const part = {
        ...token,
        text: unit.text,
        sourceStart: token.sourceStart + unit.start,
        sourceEnd: token.sourceStart + unit.end,
      };
      const measured = measureToken(ctx, part, style);
      const shouldStayWithPrevious = isNoLineStartPunctuation(unit.text);
      const previousText = line.length ? line[line.length - 1].text : "";
      const previousNeedsNext = isNoLineEndPunctuation(previousText);

      if (width + measured > maxWidth && line.length && !shouldStayWithPrevious && !previousNeedsNext) {
        pushLine();
      }
      if (!line.length && /^\s+$/.test(unit.text)) continue;
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

function wrapBlockLines(ctx, block, style, maxWidth) {
  if (!block.lines) return wrapTokens(ctx, block.tokens, style, maxWidth);
  const lines = [];
  for (const sourceLine of block.lines) {
    lines.push(...wrapTokens(ctx, sourceLine, style, maxWidth));
  }
  return lines;
}

function buildTableLayout(ctx, block, settings, maxWidth) {
  const columns = Math.max(1, block.header.length, ...block.rows.map((row) => row.length));
  const cellWidth = maxWidth / columns;
  const headerStyle = {
    ...styleForBlock("h3", settings),
    size: Math.max(18, Math.round(settings.fontSize * 0.76)),
    lineHeight: 1.35,
  };
  const bodyStyle = {
    ...styleForBlock("p", settings),
    size: Math.max(17, Math.round(settings.fontSize * 0.72)),
    lineHeight: 1.4,
  };
  const rowPadding = 10;
  const makeRow = (cells, style) => {
    const lines = Array.from({ length: columns }, (_, index) => wrapTokens(ctx, cells[index] || [], style, Math.max(34, cellWidth - rowPadding * 2)));
    const lineHeight = Math.ceil(style.size * style.lineHeight);
    return {
      cells: lines,
      style,
      lineHeight,
      height: Math.max(lineHeight, ...lines.map((cellLines) => cellLines.length * lineHeight)) + rowPadding * 2,
    };
  };
  const rows = [makeRow(block.header, headerStyle), ...block.rows.map((row) => makeRow(row, bodyStyle))];
  return {
    columns,
    cellWidth,
    rows,
    height: rows.reduce((total, row) => total + row.height, 0),
  };
}

function blankLineGap(settings) {
  return Math.max(18, Math.ceil(settings.fontSize * 0.8));
}

function tokenLetterSpacing(token, style) {
  if (!token?.text || /^\s+$/.test(token.text)) return 0;
  return Math.max(0.8, style.size * 0.025);
}

function glyphWidth(ctx, token, style) {
  ctx.font = fontString(style, token);
  return ctx.measureText(token.text).width;
}

function measureToken(ctx, token, style) {
  return glyphWidth(ctx, token, style) + tokenLetterSpacing(token, style);
}

function getImageSourceRect(image, crop) {
  return clampCropRect(crop, image);
}

function imageBlockSize(sourceRect, maxWidth, maxHeight, layout = null) {
  const normalized = normalizeImageLayout(layout);
  const aspect = sourceRect.width / sourceRect.height;
  const baseWidth = Math.min(maxWidth, maxHeight * aspect);
  const legacyMaxScale = baseWidth > 0 ? maxWidth / baseWidth : 1;
  const fixedWidth = normalized.fixedWidth && normalized.fixedHeight ? clamp(normalized.fixedWidth, 80, maxWidth) : null;
  const fixedHeight = normalized.fixedWidth && normalized.fixedHeight ? clamp(normalized.fixedHeight, 80, maxHeight) : null;
  let width = fixedWidth || (normalized.widthPercent
    ? maxWidth * (normalized.widthPercent / 100)
    : baseWidth * clamp(normalized.widthScale, 0.25, legacyMaxScale));
  let height = fixedHeight || width / aspect;
  const fitScale = Math.min(1, maxWidth / Math.max(1, width), maxHeight / Math.max(1, height));
  width *= fitScale;
  height *= fitScale;
  const maxOffset = Math.max(0, maxWidth - width);
  let offsetX = maxOffset / 2;

  if (normalized.align === "left") {
    offsetX = 0;
  } else if (normalized.align === "right") {
    offsetX = maxOffset;
  }

  return {
    width,
    height,
    offsetX,
    baseWidth,
    maxWidth,
    resizeMaxWidth: baseWidth,
  };
}

function normalizeImageLayout(layout = {}) {
  const value = layout || {};
  const align = ["left", "center", "right"].includes(value.align) ? value.align : "center";
  const rawPercent = Number(value.widthPercent);
  const widthPercent = Number.isFinite(rawPercent) && rawPercent > 0 ? clamp(rawPercent, 25, 100) : null;
  const rawFixedWidth = Number(value.fixedWidth);
  const rawFixedHeight = Number(value.fixedHeight);
  const fixedWidth = Number.isFinite(rawFixedWidth) && rawFixedWidth > 0 ? clamp(rawFixedWidth, 80, CARD_CONTENT_WIDTH) : null;
  const fixedHeight = Number.isFinite(rawFixedHeight) && rawFixedHeight > 0 ? clamp(rawFixedHeight, 80, CARD_MAX_IMAGE_HEIGHT) : null;
  return {
    widthScale: clamp(Number(value.widthScale) || 1, 0.25, 20),
    widthPercent,
    fixedWidth,
    fixedHeight,
    align,
  };
}

function imageMaxHeightForLayout(layout, fallbackMaxHeight, absoluteMaxHeight = fallbackMaxHeight) {
  const normalized = normalizeImageLayout(layout);
  if (!normalized.fixedHeight) return fallbackMaxHeight;
  return clamp(normalized.fixedHeight, 80, Math.max(80, absoluteMaxHeight));
}

function contentBoundsForHeader(showHeader) {
  return {
    left: CARD_SIDE_PADDING,
    right: CANVAS_WIDTH - CARD_SIDE_PADDING,
    top: showHeader ? 158 : CARD_SIDE_PADDING,
    bottom: CANVAS_HEIGHT - 62,
  };
}

async function buildPages(settings) {
  const measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  const blocks = parseBlocks(settings.content, settings.images);
  const avatar = await loadImage(settings.avatar).catch(() => null);
  const badge = await loadImage(verifiedBadgeSrc).catch(() => null);
  const imageCache = {};
  const pages = [];
  let page = createPage();
  const contentWidth = page.bounds.right - page.bounds.left;
  let y = page.bounds.top;
  let hasContent = false;
  let previousBlockType = null;

  function createPage() {
    const showHeader = settings.headerMode !== "first" || pages.length === 0;
    const bounds = contentBoundsForHeader(showHeader);
    return {
      avatar,
      badge,
      settings,
      showHeader,
      bounds,
      items: [],
    };
  }

  function finishPage() {
    if (page.items.length) {
      pages.push(page);
    }
    page = createPage();
    y = page.bounds.top;
    hasContent = false;
    previousBlockType = null;
  }

  function ensureSpace(height, topMargin = 0) {
    if (hasContent && y + topMargin + height > page.bounds.bottom) {
      finishPage();
    }
    if (!hasContent) topMargin = 0;
    y += topMargin;
  }

  for (const block of blocks) {
    if (block.type === "spacer") {
      const spacerHeight = blankLineGap(settings);
      ensureSpace(spacerHeight, 0);
      y += spacerHeight;
      previousBlockType = "spacer";
      continue;
    }

    if (block.type === "table") {
      const table = buildTableLayout(ctx, block, settings, contentWidth);
      ensureSpace(table.height, hasContent && previousBlockType !== "spacer" ? 18 : 0);
      page.items.push({ type: "table", x: page.bounds.left, y, width: contentWidth, table });
      y += table.height + 18;
      hasContent = true;
      previousBlockType = "table";
      continue;
    }

    if (block.type === "image") {
      const data = settings.images[block.id];
      if (!data) continue;
      if (!imageCache[block.id]) {
        imageCache[block.id] = await loadImage(data.src).catch(() => null);
      }
      const img = imageCache[block.id];
      if (!img) continue;
      const sourceRect = getImageSourceRect(img, data.crop);
      const size = imageBlockSize(sourceRect, contentWidth, imageMaxHeightForLayout(data.layout, Math.min(settings.imageHeight, page.bounds.bottom - page.bounds.top), page.bounds.bottom - page.bounds.top), data.layout);
      const height = size.height;
      ensureSpace(height, hasContent && previousBlockType !== "spacer" ? 24 : 0);
      page.items.push({
        type: "image",
        imageId: block.id,
        image: img,
        sourceRect,
        baseWidth: size.baseWidth,
        maxWidth: size.maxWidth,
        x: page.bounds.left + size.offsetX,
        y,
        width: size.width,
        height,
        radius: 13,
        resizeMaxWidth: size.resizeMaxWidth,
      });
      y += height + 34;
      hasContent = true;
      previousBlockType = "image";
      continue;
    }

    const style = styleForBlock(block.type, settings);
    const lineHeight = Math.ceil(style.size * style.lineHeight);
    const textWidth = style.quote ? contentWidth - 28 : contentWidth;
    const lines = wrapBlockLines(ctx, block, style, textWidth);
    let firstLine = true;

    for (const line of lines) {
      const topMargin = firstLine ? (hasContent && previousBlockType !== "spacer" ? style.marginTop : 0) : 0;
      ensureSpace(lineHeight, topMargin);
      page.items.push({
        type: "text",
        blockType: block.type,
        line,
        style,
        x: page.bounds.left + (style.quote ? 28 : 0),
        y,
        lineHeight,
      });
      y += lineHeight;
      firstLine = false;
      hasContent = true;
    }

    if (lines.length) {
      y += style.marginBottom;
      previousBlockType = block.type;
    }
  }

  finishPage();
  return pages.length ? pages : [createPage()];
}

async function buildScrollPage(settings) {
  const measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  const blocks = parseBlocks(settings.content, settings.images);
  const avatar = await loadImage(settings.avatar).catch(() => null);
  const badge = await loadImage(verifiedBadgeSrc).catch(() => null);
  const imageCache = {};
  const bounds = contentBoundsForHeader(true);
  const contentWidth = bounds.right - bounds.left;
  const viewportHeight = bounds.bottom - bounds.top;
  const page = {
    avatar,
    badge,
    settings,
    showHeader: true,
    items: [],
    bounds,
    scrollOffset: 0,
    scrollMax: 0,
  };
  let y = 0;
  let hasContent = false;
  let previousBlockType = null;

  for (const block of blocks) {
    if (block.type === "spacer") {
      y += blankLineGap(settings);
      previousBlockType = "spacer";
      continue;
    }

    if (block.type === "table") {
      const table = buildTableLayout(ctx, block, settings, contentWidth);
      y += hasContent && previousBlockType !== "spacer" ? 18 : 0;
      page.items.push({ type: "table", x: bounds.left, y, width: contentWidth, table });
      y += table.height + 18;
      hasContent = true;
      previousBlockType = "table";
      continue;
    }

    if (block.type === "image") {
      const data = settings.images[block.id];
      if (!data) continue;
      if (!imageCache[block.id]) {
        imageCache[block.id] = await loadImage(data.src).catch(() => null);
      }
      const img = imageCache[block.id];
      if (!img) continue;
      const sourceRect = getImageSourceRect(img, data.crop);
      const size = imageBlockSize(sourceRect, contentWidth, imageMaxHeightForLayout(data.layout, Math.min(settings.imageHeight, viewportHeight), viewportHeight), data.layout);
      y += hasContent && previousBlockType !== "spacer" ? 24 : 0;
      page.items.push({
        type: "image",
        imageId: block.id,
        image: img,
        sourceRect,
        baseWidth: size.baseWidth,
        maxWidth: size.maxWidth,
        x: bounds.left + size.offsetX,
        y,
        width: size.width,
        height: size.height,
        radius: 13,
        resizeMaxWidth: size.resizeMaxWidth,
      });
      y += size.height + 34;
      hasContent = true;
      previousBlockType = "image";
      continue;
    }

    const style = styleForBlock(block.type, settings);
    const lineHeight = Math.ceil(style.size * style.lineHeight);
    const textWidth = style.quote ? contentWidth - 28 : contentWidth;
    const lines = wrapBlockLines(ctx, block, style, textWidth);
    let firstLine = true;

    for (const line of lines) {
      y += firstLine && hasContent && previousBlockType !== "spacer" ? style.marginTop : 0;
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
      previousBlockType = block.type;
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
  canvas.width = OUTPUT_CANVAS_WIDTH;
  canvas.height = OUTPUT_CANVAS_HEIGHT;
  canvas.dataset.page = String(index + 1);
  canvas._page = page;
  canvas._scrollPage = false;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.setTransform(CANVAS_RENDER_SCALE, 0, 0, CANVAS_RENDER_SCALE, 0, 0);

  drawPageToContext(ctx, page, false);
  canvas._textHits = collectTextHits(ctx, page, false);
  canvas._imageHits = collectImageHits(page, false);
  return canvas;
}

function renderScrollPage(page) {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_CANVAS_WIDTH;
  canvas.height = OUTPUT_CANVAS_HEIGHT;
  canvas.dataset.page = "scroll";
  canvas._page = page;
  canvas._scrollPage = true;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.setTransform(CANVAS_RENDER_SCALE, 0, 0, CANVAS_RENDER_SCALE, 0, 0);

  drawPageToContext(ctx, page, true);
  canvas._textHits = collectTextHits(ctx, page, true);
  canvas._imageHits = collectImageHits(page, true);
  return canvas;
}

function drawPageToContext(ctx, page, scrollPage = false) {
  drawBackground(ctx, page.settings);
  if (page.showHeader !== false) {
    drawHeader(ctx, page.settings, page.avatar, page.badge);
  }

  if (!scrollPage) {
    for (const item of page.items) {
      if (item.type === "image") drawImageBlock(ctx, item);
      if (item.type === "table") drawTableBlock(ctx, item, page.settings);
      if (item.type === "text") drawTextLine(ctx, item, page.settings);
    }
    return;
  }

  const { bounds } = page;
  ctx.save();
  ctx.beginPath();
  ctx.rect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
  ctx.clip();
  ctx.translate(0, bounds.top - page.scrollOffset);
  for (const item of page.items) {
    if (item.type === "image") drawImageBlock(ctx, item);
    if (item.type === "table") drawTableBlock(ctx, item, page.settings);
    if (item.type === "text") drawTextLine(ctx, item, page.settings);
  }
  ctx.restore();

  if (page.showHeader !== false) {
    ctx.strokeStyle = isDarkHexColor(page.settings.bgColor) ? "rgba(255,255,255,.12)" : "rgba(23,32,47,.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bounds.left, bounds.top - 10);
    ctx.lineTo(bounds.right, bounds.top - 10);
    ctx.stroke();
  }
}

function collectTextHits(ctx, page, scrollPage = false) {
  const hits = [];
  const bounds = page.bounds || null;

  for (const item of page.items) {
    if (item.type !== "text") continue;
    let cursor = item.x;
    const y = scrollPage ? (bounds?.top || 0) + item.y - page.scrollOffset : item.y;
    if (scrollPage && bounds && (y + item.lineHeight < bounds.top || y > bounds.bottom)) {
      continue;
    }

    for (const token of item.line) {
      const width = measureToken(ctx, token, item.style);
      if (!/^\s+$/.test(token.text) && Number.isFinite(token.sourceStart) && Number.isFinite(token.sourceEnd)) {
        const top = Math.max(y, scrollPage && bounds ? bounds.top : y);
        const bottom = Math.min(y + item.lineHeight, scrollPage && bounds ? bounds.bottom : y + item.lineHeight);
        hits.push({
          x: cursor,
          y: top,
          width,
          height: Math.max(0, bottom - top),
          sourceStart: token.sourceStart,
          sourceEnd: token.sourceEnd,
        });
      }
      cursor += width;
    }
  }

  return hits;
}

function collectImageHits(page, scrollPage = false) {
  const bounds = page.bounds || null;
  return page.items
    .filter((item) => item.type === "image" && item.imageId)
    .map((item) => {
      const y = scrollPage ? (bounds?.top || 0) + item.y - page.scrollOffset : item.y;
      const top = scrollPage && bounds ? Math.max(y, bounds.top) : y;
      const bottom = scrollPage && bounds ? Math.min(y + item.height, bounds.bottom) : y + item.height;
      return {
        imageId: item.imageId,
        x: item.x,
        y: top,
        width: item.width,
        height: Math.max(0, bottom - top),
        baseWidth: item.baseWidth || item.width,
        maxWidth: item.maxWidth || CARD_CONTENT_WIDTH,
        resizeMaxWidth: item.resizeMaxWidth || item.baseWidth || item.width,
      };
    })
    .filter((hit) => hit.height > 0 && hit.width > 0);
}

function drawBackground(ctx, settings) {
  ctx.fillStyle = settings.bgColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawHeader(ctx, settings, avatar, badge) {
  const x = 42;
  const y = 38;
  const size = 82;
  const darkCard = isDarkHexColor(settings.bgColor);

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
  ctx.strokeStyle = darkCard ? "rgba(255,255,255,.2)" : "rgba(32,41,56,.12)";
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

  ctx.fillStyle = darkCard ? "rgba(255,255,255,.72)" : "#6f7785";
  ctx.font = `400 29px ${fontFamilyForText(settings.handle, settings)}`;
  ctx.fillText(clampText(ctx, settings.handle, 480), textX, 113);

  ctx.fillStyle = darkCard ? "rgba(255,255,255,.5)" : "#9aa2af";
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(769 + i * 16, 79, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function isDarkHexColor(hex) {
  const match = String(hex || "").match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return false;
  const value = match[1];
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 < 128;
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
  drawSourceCoverImage(ctx, item.image, item.sourceRect, item.x, item.y, item.width, item.height);
  ctx.restore();
}

function drawTableBlock(ctx, item, settings) {
  const { table } = item;
  let y = item.y;
  const darkCard = isDarkHexColor(settings.bgColor);
  ctx.save();
  for (const [rowIndex, row] of table.rows.entries()) {
    if (rowIndex === 0) {
      ctx.fillStyle = darkCard ? "rgba(255,255,255,.16)" : "rgba(43,127,216,.13)";
      ctx.fillRect(item.x, y, item.width, row.height);
    }
    for (let column = 0; column < table.columns; column += 1) {
      const x = item.x + column * table.cellWidth;
      ctx.strokeStyle = darkCard ? "rgba(255,255,255,.24)" : "rgba(32,41,56,.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, table.cellWidth, row.height);
      let lineY = y + 10;
      for (const line of row.cells[column]) {
        drawTextLine(ctx, {
          style: row.style,
          line,
          x: x + 10,
          y: lineY,
          lineHeight: row.lineHeight,
        }, settings);
        lineY += row.lineHeight;
      }
    }
    y += row.height;
  }
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
    const width = glyphWidth(ctx, token, style);
    if (token.bgColor) {
      ctx.fillStyle = token.bgColor;
      roundedRect(ctx, cursor - 3, y + Math.round(lineHeight * 0.14), width + 6, Math.round(lineHeight * 0.72), 7);
      ctx.fill();
    }
    ctx.fillStyle = token.color || style.color;
    ctx.fillText(token.text, cursor, baseline);
    cursor += width + tokenLetterSpacing(token, style);
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

function renderArticlePreview(settings) {
  state.canvases = [];
  state.scrollOffset = 0;
  state.scrollMax = 0;
  els.pages.innerHTML = "";
  els.pages.className = "pages article-mode";
  els.articleSettings.hidden = false;

  const article = document.createElement("article");
  article.className = `article-preview article-theme-${settings.articleTheme} article-font-${settings.articleFont} article-size-${settings.articleSize}`;
  article.style.setProperty("--article-accent", settings.articleColor);
  article.innerHTML = markdownToArticleHtml(settings.content, settings.images);
  els.pages.append(article);

  const wordCount = settings.content.replace(/\s/g, "").length;
  els.pageCount.textContent = "长文";
  els.status.textContent = `已生成长文预览，约 ${wordCount} 字`;
  if (window.lucide) window.lucide.createIcons();
}

function markdownToArticleHtml(markdown, images = {}) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const imageLookup = buildImageReferenceLookup(images);
  const html = [];
  let paragraph = [];
  let list = [];
  let code = [];
  let inCode = false;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderArticleInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${renderArticleInline(item)}</li>`).join("")}</ul>`);
    list = [];
  };
  const flushCode = () => {
    if (!code.length) return;
    html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    code = [];
  };

  const flushTable = (header, rows) => {
    html.push(`<div class="article-table-wrap"><table><thead><tr>${header.map((cell) => `<th>${renderArticleInline(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${header.map((_, index) => `<td>${renderArticleInline(row[index] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (isMarkdownTableHeader(trimmed, lines[index + 1])) {
      flushParagraph();
      flushList();
      const header = splitMarkdownTableRow(trimmed);
      const rows = [];
      let rowIndex = index + 2;
      while (rowIndex < lines.length) {
        const row = splitMarkdownTableRow(lines[rowIndex].trim());
        if (!row) break;
        rows.push(row);
        rowIndex += 1;
      }
      flushTable(header, rows);
      index = rowIndex - 1;
      continue;
    }

    const imageId = resolveMarkdownImageBlock(trimmed, imageLookup);
    if (isMarkdownImageBlock(trimmed)) {
      flushParagraph();
      flushList();
      const image = images[imageId];
      if (image?.src) html.push(`<figure><img src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.name || "图片")}" /></figure>`);
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(3, heading[1].length);
      html.push(`<h${level}>${renderArticleInline(heading[2])}</h${level}>`);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      flushList();
      html.push(`<blockquote>${renderArticleInline(trimmed.slice(2))}</blockquote>`);
      continue;
    }

    const listMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      list.push(listMatch[1]);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushCode();
  return html.length ? html.join("") : '<p class="article-empty">在左侧输入 Markdown，右侧会生成长文预览。</p>';
}

function renderArticleInline(text) {
  return parseInline(String(text || ""))
    .map((token) => {
      let inner = escapeHtml(token.text).replace(/`([^`]+)`/g, "<code>$1</code>");
      if (token.bold) inner = `<strong>${inner}</strong>`;
      if (token.italic) inner = `<em>${inner}</em>`;

      const styles = [];
      if (token.color) styles.push(`color: ${token.color}`);
      if (token.bgColor) {
        styles.push(`background-color: ${token.bgColor}`);
        styles.push("border-radius: 4px");
        styles.push("box-decoration-break: clone");
        styles.push("-webkit-box-decoration-break: clone");
        styles.push("padding: 0 3px");
      }

      return styles.length ? `<span style="${escapeAttribute(styles.join("; "))}">${inner}</span>` : inner;
    })
    .join("");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

async function render() {
  const settings = readForm();
  updateAppMode();
  updateArticleControls();
  if (state.appMode === "article") {
    renderArticlePreview(settings);
    saveState();
    return;
  }
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
  els.pages.className = "pages";
  els.pages.classList.toggle("scroll-mode", state.mode === "scroll");
  els.articleSettings.hidden = true;
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
    frame.append(createImageEditLayer(canvas));
    frame.append(createTextHitLayer(canvas));

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
      : `已生成 ${canvases.length} 张，高清尺寸 ${OUTPUT_CANVAS_WIDTH}x${OUTPUT_CANVAS_HEIGHT}`;
  if (window.lucide) window.lucide.createIcons();
}

function createImageEditLayer(canvas) {
  const layer = document.createElement("div");
  layer.className = "preview-image-edit-layer";

  for (const hit of canvas._imageHits || []) {
    const box = document.createElement("div");
    box.className = "preview-image-box";
    box.dataset.imageId = hit.imageId;
    box.dataset.baseWidth = String(hit.baseWidth || hit.width);
    box.dataset.maxWidth = String(hit.maxWidth || CARD_CONTENT_WIDTH);
    box.dataset.resizeMaxWidth = String(hit.resizeMaxWidth || hit.baseWidth || hit.width);
    box.title = "拖右下角调整图片大小；点击左/中/右按钮调整对齐";
    applyImageBoxStyle(box, hit);

    const alignBar = document.createElement("div");
    alignBar.className = "preview-image-align";
    [
      ["left", "align-start-horizontal", "左对齐"],
      ["center", "align-center-horizontal", "居中"],
      ["right", "align-end-horizontal", "右对齐"],
    ].forEach(([align, icon, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.align = align;
      button.title = label;
      button.setAttribute("aria-label", label);
      button.innerHTML = `<i data-lucide="${icon}"></i>`;
      button.addEventListener("click", setPreviewImageAlign);
      alignBar.append(button);
    });

    const resize = document.createElement("span");
    resize.className = "preview-image-resize";
    resize.dataset.action = "resize";
    resize.addEventListener("pointerdown", startPreviewImageResize);

    box.append(alignBar, resize);
    layer.append(box);
  }

  return layer;
}

function applyImageBoxStyle(box, hit) {
  box.style.left = `${(hit.x / CANVAS_WIDTH) * 100}%`;
  box.style.top = `${(hit.y / CANVAS_HEIGHT) * 100}%`;
  box.style.width = `${(hit.width / CANVAS_WIDTH) * 100}%`;
  box.style.height = `${(hit.height / CANVAS_HEIGHT) * 100}%`;
}

function createTextHitLayer(canvas) {
  const layer = document.createElement("div");
  layer.className = "preview-hit-layer";

  for (const hit of canvas._textHits || []) {
    if (hit.width <= 0 || hit.height <= 0) continue;
    const target = document.createElement("button");
    target.type = "button";
    target.className = "preview-text-hit";
    target.style.left = `${(hit.x / CANVAS_WIDTH) * 100}%`;
    target.style.top = `${(hit.y / CANVAS_HEIGHT) * 100}%`;
    target.style.width = `${(hit.width / CANVAS_WIDTH) * 100}%`;
    target.style.height = `${(hit.height / CANVAS_HEIGHT) * 100}%`;
    target.dataset.start = String(hit.sourceStart);
    target.dataset.end = String(hit.sourceEnd);
    target.addEventListener("pointerenter", handlePreviewTextTarget);
    target.addEventListener("click", handlePreviewTextTarget);
    layer.append(target);
  }

  return layer;
}

function handlePreviewTextTarget(event) {
  const start = Number(event.currentTarget.dataset.start);
  const end = Number(event.currentTarget.dataset.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return;
  focusEditorRange(start, end);
}

function focusEditorRange(start, end) {
  els.content.focus({ preventScroll: true });
  els.content.setSelectionRange(start, end);
  scrollTextareaToRange(start);
}

function scrollTextareaToRange(index) {
  const before = els.content.value.slice(0, index);
  const lineIndex = before.split("\n").length - 1;
  const lineHeight = Number.parseFloat(getComputedStyle(els.content).lineHeight) || 28;
  const targetTop = Math.max(0, lineIndex * lineHeight - els.content.clientHeight / 2);
  els.content.scrollTop = targetTop;
}

function setPreviewImageAlign(event) {
  event.preventDefault();
  event.stopPropagation();
  const align = event.currentTarget.dataset.align;
  const box = event.currentTarget.closest(".preview-image-box");
  const imageId = box?.dataset.imageId;
  if (!imageId || !state.images[imageId] || !["left", "center", "right"].includes(align)) return;

  state.images[imageId].layout = {
    ...normalizeImageLayout(state.images[imageId].layout),
    align,
  };
  saveState();
  render();
  els.status.textContent = align === "left" ? "图片已左对齐" : align === "right" ? "图片已右对齐" : "图片已居中";
}

function startPreviewImageResize(event) {
  const box = event.currentTarget.closest(".preview-image-box");
  const frame = box?.closest(".page-frame");
  const imageId = box?.dataset.imageId;
  if (!box || !frame || !imageId || !state.images[imageId]) return;

  event.preventDefault();
  event.stopPropagation();
  const frameRect = frame.getBoundingClientRect();
  imageEditDrag = {
    imageId,
    box,
    startX: event.clientX,
    startY: event.clientY,
    startLayout: normalizeImageLayout(state.images[imageId].layout),
    startBox: {
      x: (Number.parseFloat(box.style.left) / 100) * CANVAS_WIDTH,
      y: (Number.parseFloat(box.style.top) / 100) * CANVAS_HEIGHT,
      width: (Number.parseFloat(box.style.width) / 100) * CANVAS_WIDTH,
      height: (Number.parseFloat(box.style.height) / 100) * CANVAS_HEIGHT,
      baseWidth: Number(box.dataset.baseWidth) || (Number.parseFloat(box.style.width) / 100) * CANVAS_WIDTH,
      maxWidth: Number(box.dataset.maxWidth) || CARD_CONTENT_WIDTH,
      resizeMaxWidth: Number(box.dataset.resizeMaxWidth) || Number(box.dataset.baseWidth) || (Number.parseFloat(box.style.width) / 100) * CANVAS_WIDTH,
    },
    canvasScaleX: CANVAS_WIDTH / frameRect.width,
    canvasScaleY: CANVAS_HEIGHT / frameRect.height,
  };
  box.classList.add("is-resizing");
  box.setPointerCapture?.(event.pointerId);
  document.addEventListener("pointermove", movePreviewImageResize);
  document.addEventListener("pointerup", stopPreviewImageResize, { once: true });
}

function movePreviewImageResize(event) {
  if (!imageEditDrag) return;
  event.preventDefault();
  const dx = (event.clientX - imageEditDrag.startX) * imageEditDrag.canvasScaleX;
  const dy = (event.clientY - imageEditDrag.startY) * imageEditDrag.canvasScaleY;
  const nextLayout = resizeImageLayout(imageEditDrag.startLayout, imageEditDrag.startBox, dx, dy);
  state.images[imageEditDrag.imageId].layout = nextLayout;

  const nextWidth = imageEditDrag.startBox.baseWidth * nextLayout.widthScale;
  const nextHeight = nextWidth * (imageEditDrag.startBox.height / imageEditDrag.startBox.width);
  const maxOffset = Math.max(0, imageEditDrag.startBox.maxWidth - nextWidth);
  const nextX = nextLayout.align === "left" ? CARD_SIDE_PADDING : nextLayout.align === "right" ? CARD_SIDE_PADDING + maxOffset : CARD_SIDE_PADDING + maxOffset / 2;
  applyImageBoxStyle(imageEditDrag.box, {
    x: nextX,
    y: imageEditDrag.startBox.y,
    width: nextWidth,
    height: nextHeight,
  });
}

function stopPreviewImageResize() {
  if (!imageEditDrag) return;
  document.removeEventListener("pointermove", movePreviewImageResize);
  const imageId = imageEditDrag.imageId;
  imageEditDrag.box.classList.remove("is-resizing");
  imageEditDrag = null;
  saveState();
  render();
  els.status.textContent = `已调整图片 ${state.images[imageId]?.name || imageId}`;
}

function resizeImageLayout(startLayout, startBox, dx, dy) {
  const heightDrivenDelta = dy * (startBox.width / Math.max(1, startBox.height));
  const deltaWidth = Math.abs(dx) >= Math.abs(heightDrivenDelta) ? dx : heightDrivenDelta;
  const nextWidth = clamp(startBox.width + deltaWidth, startBox.resizeMaxWidth * 0.25, startBox.resizeMaxWidth);
  return {
    ...startLayout,
    widthScale: nextWidth / startBox.baseWidth,
    widthPercent: null,
    fixedWidth: null,
    fixedHeight: null,
  };
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
  const writable = await chooseSaveTarget(filename, EXPORT_IMAGE_MIME, EXPORT_IMAGE_EXTENSION);
  if (writable === false) {
    els.status.textContent = "已取消下载";
    return;
  }
  const blob = await canvasToLosslessPngBlob(canvas);
  if (!blob) {
    els.status.textContent = "图片生成失败，请调整内容后再试";
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

async function downloadArticleImage() {
  const settings = readForm();
  if (state.appMode !== "article") {
    state.appMode = "article";
    updateAppMode();
  }
  renderArticlePreview(settings);

  const article = els.pages.querySelector(".article-preview");
  if (!article) {
    els.status.textContent = "长文生成失败，请先检查内容";
    return;
  }

  if (!window.html2canvas) {
    els.status.textContent = "长图下载组件未加载，请刷新页面后重试";
    return;
  }

  const filename = "write-then-publish-article.png";
  const writable = await chooseSaveTarget(filename, EXPORT_IMAGE_MIME, EXPORT_IMAGE_EXTENSION);
  if (writable === false) {
    els.status.textContent = "已取消下载";
    return;
  }

  els.status.textContent = "正在生成长图...";
  const canvas = await window.html2canvas(article, {
    backgroundColor: null,
    scale: Math.min(2, window.devicePixelRatio || 1),
    useCORS: true,
    imageTimeout: 15000,
    width: article.scrollWidth,
    height: article.scrollHeight,
    windowWidth: Math.max(document.documentElement.clientWidth, article.scrollWidth),
    windowHeight: Math.max(document.documentElement.clientHeight, article.scrollHeight),
  });
  const blob = await canvasToLosslessPngBlob(canvas);
  if (!blob) {
    els.status.textContent = "长图生成失败，请调整内容后再试";
    return;
  }
  await saveBlob(blob, filename, writable);
  els.status.textContent = writable ? `已保存 ${filename}` : `已交给浏览器下载 ${filename}`;
}

function canvasToLosslessPngBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), EXPORT_IMAGE_MIME));
}

async function isZipBlob(blob) {
  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  return header[0] === 0x50 && header[1] === 0x4b && (header[2] === 0x03 || header[2] === 0x05 || header[2] === 0x07);
}

async function downloadCanvasesIndividually() {
  for (const [index, canvas] of state.canvases.entries()) {
    const filename = state.mode === "scroll" ? "layout-scroll-shot.png" : `layout-page-${String(index + 1).padStart(2, "0")}.png`;
    window.setTimeout(() => downloadCanvas(canvas, filename), index * 180);
  }
}

async function downloadAll() {
  if (!state.canvases.length) return;

  if (!window.JSZip) {
    els.status.textContent = "当前环境不支持打包，将逐张下载";
    await downloadCanvasesIndividually();
    return;
  }

  const zipFilename = state.mode === "scroll" ? "graphic-layout-scroll-shot.zip" : "graphic-layout-pages.zip";
  els.status.textContent = "正在打包图片...";
  try {
    const zip = new window.JSZip();
    for (const [index, canvas] of state.canvases.entries()) {
      const blob = await canvasToLosslessPngBlob(canvas);
      if (!blob) {
        els.status.textContent = "图片生成失败，请调整内容后再试";
        return;
      }
      const filename = state.mode === "scroll" ? "layout-scroll-shot.png" : `layout-page-${String(index + 1).padStart(2, "0")}.png`;
      zip.file(filename, blob);
    }
    const blob = await zip.generateAsync({
      type: "blob",
      compression: EXPORT_ZIP_COMPRESSION,
      mimeType: "application/zip",
    });

    if (!(await isZipBlob(blob))) {
      els.status.textContent = "打包文件异常，已改为逐张下载";
      await downloadCanvasesIndividually();
      return;
    }

    await saveBlob(blob, zipFilename);
    els.status.textContent = state.mode === "scroll" ? "已下载当前滑动截图压缩包" : `已下载 ${state.canvases.length} 张图片压缩包`;
  } catch (error) {
    console.error(error);
    els.status.textContent = "打包失败，已改为逐张下载";
    await downloadCanvasesIndividually();
  }
}

const requestRender = debounce(render, 120);

function positionToolPopover(menu) {
  const popover = menu.querySelector(".tool-popover");
  if (!popover) return;

  popover.style.left = "";
  popover.style.right = "";

  if (window.matchMedia("(max-width: 620px)").matches) return;

  const margin = 12;
  const menuRect = menu.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();
  let left = 0;

  const overflowRight = menuRect.left + popoverRect.width - (window.innerWidth - margin);
  if (overflowRight > 0) left -= overflowRight;

  const overflowLeft = menuRect.left + left - margin;
  if (overflowLeft < 0) left -= overflowLeft;

  popover.style.left = `${Math.round(left)}px`;
}

function positionOpenToolPopovers() {
  document.querySelectorAll(".tool-menu[open]").forEach(positionToolPopover);
}

function bindEvents() {
  document.querySelectorAll(".tool-menu").forEach((menu) => {
    const summary = menu.querySelector("summary");
    const popover = menu.querySelector(".tool-popover");
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
      requestAnimationFrame(() => positionToolPopover(menu));
    });
    if (menu.classList.contains("settings-menu")) {
      popover?.addEventListener("mouseleave", () => {
        menu.open = false;
      });
    }
  });

  window.addEventListener("resize", positionOpenToolPopovers);
  window.addEventListener("resize", applyPanelLayout);

  els.panelResizers.forEach((resizer) => {
    resizer.addEventListener("pointerdown", startPanelResize);
  });

  document.querySelectorAll("[data-format]").forEach((button) => {
    button.addEventListener("click", () => wrapSelection(button.dataset.format));
  });

  els.modeButtons.forEach((button) => {
    button.addEventListener("click", (event) => setAppMode(event.currentTarget.dataset.appMode));
  });

  els.articleThemeButtons.forEach((button) => {
    button.addEventListener("click", (event) => setArticleOption("theme", event.currentTarget.dataset.articleTheme));
  });
  els.articleFontButtons.forEach((button) => {
    button.addEventListener("click", (event) => setArticleOption("font", event.currentTarget.dataset.articleFont));
  });
  els.articleSizeButtons.forEach((button) => {
    button.addEventListener("click", (event) => setArticleOption("size", event.currentTarget.dataset.articleSize));
  });
  els.articleColorButtons.forEach((button) => {
    button.addEventListener("click", (event) => setArticleOption("color", event.currentTarget.dataset.articleColor));
  });

  els.content.addEventListener("input", () => {
    scheduleTextHistoryCommit();
    requestRender();
  });
  els.content.addEventListener("keydown", handleTextShortcut);
  els.content.addEventListener("paste", handleEditorPaste);
  els.content.addEventListener("dragover", (event) => {
    if (Array.from(event.dataTransfer?.types || []).includes("Files")) event.preventDefault();
  });
  els.content.addEventListener("drop", handleEditorDrop);

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
  els.inlineBgColor.addEventListener("input", () => {
    document.documentElement.style.setProperty("--text-bg-brush-color", els.inlineBgColor.value);
  });
  els.colorConfirm.addEventListener("click", enableColorBrush);
  els.colorCancel.addEventListener("click", disableColorBrush);
  els.bgColorConfirm.addEventListener("click", enableBackgroundBrush);
  els.bgColorCancel.addEventListener("click", disableBackgroundBrush);
  els.content.addEventListener("mouseup", applyActiveBrushToSelection);
  document.addEventListener("pointerup", applyActiveBrushToSelection);
  els.content.addEventListener("keyup", (event) => {
    if (event.key.startsWith("Arrow") || event.key === "Shift") {
      applyActiveBrushToSelection();
    }
  });
  els.contentImage.addEventListener("change", handleContentImage);
  els.connectObsidianVault?.addEventListener("click", connectObsidianVault);
  els.obsidianVaultFolder?.addEventListener("change", handleObsidianVaultFolder);
  els.applyImageWidth?.addEventListener("click", applyImageWidthToAll);
  els.applyFixedImageSize?.addEventListener("click", applyFixedImageSizeToAll);
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
  els.historyToggle.addEventListener("click", toggleHistory);
  els.historyClose.addEventListener("click", () => setHistoryOpen(false));
  els.historyFilterButtons.forEach((button) => {
    button.addEventListener("click", () => setHistoryFilter(button.dataset.historyFilter));
  });
  els.newProject.addEventListener("click", createNewProject);
  els.convertMode.addEventListener("click", convertCurrentMode);
  els.headerModeToggle.addEventListener("click", toggleHeaderMode);
  els.themeToggle.addEventListener("click", toggleUiTheme);
  els.downloadZip.addEventListener("click", downloadAll);
  els.downloadArticle.addEventListener("click", downloadArticleImage);
}

loadPanelLayout();
applyPanelLayout();
const initialFormState = loadState();
applyForm(initialFormState);
syncGuideReadOnlyMode();
resetTextHistory();
updateProjectHistory();
bindEvents();
render();
void loadObsidianVaultConnection();
if (window.lucide) {
  window.lucide.createIcons();
}
