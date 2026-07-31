const CANVAS_WIDTH = 864;
const CANVAS_HEIGHT = 1152;
const CANVAS_RENDER_SCALE = 2;
const OUTPUT_CANVAS_WIDTH = CANVAS_WIDTH * CANVAS_RENDER_SCALE;
const OUTPUT_CANVAS_HEIGHT = CANVAS_HEIGHT * CANVAS_RENDER_SCALE;
const CARD_SIDE_PADDING = 42;
const CARD_CONTENT_WIDTH = CANVAS_WIDTH - CARD_SIDE_PADDING * 2;
const CARD_MAX_IMAGE_HEIGHT = CANVAS_HEIGHT - CARD_SIDE_PADDING - 62;
const DEFAULT_CARD_FONT_SIZE = 34;
const DEFAULT_CARD_LINE_HEIGHT = 1.85;
const CARD_BODY_FONT_WEIGHT = 400;
const CARD_BODY_STROKE_WIDTH = 0;
const EXPORT_IMAGE_MIME = "image/png";
const DEFAULT_HANDLE = "@X: iamcora13";
const EXPORT_IMAGE_EXTENSION = ".png";
const EXPORT_ZIP_COMPRESSION = "STORE";
const LIVE_PHOTO_API_BASE = window.location.protocol === "file:" ? "http://127.0.0.1:5173" : "";
const LIVE_PHOTO_LOCAL_GUIDE_URL = "https://github.com/fxyadela/write-then-publish#本地运行";
const OBSIDIAN_VAULT_DB = "writeThenPublishObsidianVault";
const OBSIDIAN_VAULT_STORE = "settings";
const OBSIDIAN_VAULT_KEY = "directoryHandle";
const LIVE_MEDIA_DB = "writeThenPublishLiveMedia";
const LIVE_MEDIA_STORE = "videos";
const STORAGE_KEY = "graphicTextLayoutState.v1";
const PROJECTS_STORAGE_KEY = "graphicTextLayoutProjects.v1";
const AUTHOR_PROFILE_STORAGE_KEY = "writeThenPublishAuthorProfile.v1";
const PANEL_LAYOUT_STORAGE_KEY = "writeThenPublishPanelLayout.v1";
const ONBOARDING_STORAGE_KEY = "writeThenPublishOnboarding.v1";
const ENTRY_MODE_SESSION_KEY = "writeThenPublishEntryMode.v1";
const LAST_ACCOUNT_EMAIL_KEY = "writeThenPublishLastAccountEmail.v1";
const EXPERIENCE_VERSION = "2026.07";
const WELCOME_BACK_STORAGE_KEY = "writeThenPublishWelcomeBackVersion.v1";
const WHATS_NEW_STORAGE_KEY = "writeThenPublishWhatsNewVersion.v1";
let activeStorageScope = "guest";

function scopedStorageKey(baseKey, scope = activeStorageScope) {
  return scope === "local" ? baseKey : `${baseKey}.${scope}`;
}

function storageForScope(scope = activeStorageScope) {
  return scope === "guest" ? sessionStorage : localStorage;
}

function livePhotoApiUrl(path) {
  return `${LIVE_PHOTO_API_BASE}${path}`;
}

function cloudLivePhotoAvailable() {
  return Boolean(cloudApi()?.livePhotoConfigured && cloudApi()?.createCloudLivePhotoJob);
}

function needsLivePhotoStaticFallback() {
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  if (window.location.protocol === "file:") return true;
  return /^https?:$/.test(window.location.protocol)
    && !localHosts.has(window.location.hostname)
    && !cloudLivePhotoAvailable();
}
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
  exportProgress: $("#exportProgress"),
  exportProgressTitle: $("#exportProgressTitle"),
  exportProgressDetail: $("#exportProgressDetail"),
  exportProgressPercent: $("#exportProgressPercent"),
  exportProgressMeta: $("#exportProgressMeta"),
  exportProgressBar: $("#exportProgressBar"),
  exportProgressFill: $("#exportProgressFill"),
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
  account: $("#accountBtn"),
  accountLabel: $("#accountButtonLabel"),
  accountDock: $("#accountDock"),
  accountMenu: $("#accountMenu"),
  accountMenuTitle: $("#accountMenuTitle"),
  accountMenuDescription: $("#accountMenuDescription"),
  accountMenuLogin: $("#accountMenuLoginBtn"),
  accountMenuManage: $("#accountMenuManageBtn"),
  accountMenuSignOut: $("#accountMenuSignOutBtn"),
  accountMenuWhatsNew: $("#accountMenuWhatsNewBtn"),
  accountMenuHint: $("#accountMenuHint"),
  accountModal: $("#accountModal"),
  accountClose: $("#accountCloseBtn"),
  accountConfigNotice: $("#accountConfigNotice"),
  accountResendConfirmation: $("#accountResendConfirmationBtn"),
  accountAuthForm: $("#accountAuthForm"),
  accountEmail: $("#accountEmailInput"),
  accountPassword: $("#accountPasswordInput"),
  accountPasswordToggle: $("#accountPasswordToggleBtn"),
  accountPasswordConfirmField: $("#accountPasswordConfirmField"),
  accountPasswordConfirm: $("#accountPasswordConfirmInput"),
  accountSignInMode: $("#accountSignInModeBtn"),
  accountSignIn: $("#accountSignInBtn"),
  accountSignUp: $("#accountSignUpBtn"),
  accountSignedIn: $("#accountSignedIn"),
  accountAvatar: $("#accountAvatar"),
  accountDisplayName: $("#accountDisplayName"),
  accountEmailLabel: $("#accountEmail"),
  accountSyncStatus: $("#accountSyncStatus"),
  accountImportLocal: $("#accountImportLocalBtn"),
  accountSignOut: $("#accountSignOutBtn"),
  entryChoiceModal: $("#entryChoiceModal"),
  entryChoiceLoading: $("#entryChoiceLoading"),
  entryChoiceContent: $("#entryChoiceContent"),
  entryChoiceNotice: $("#entryChoiceNotice"),
  entryChoiceReturningHint: $("#entryChoiceReturningHint"),
  chooseGuest: $("#chooseGuestBtn"),
  chooseLogin: $("#chooseLoginBtn"),
  welcomeBackModal: $("#welcomeBackModal"),
  welcomeBackClose: $("#welcomeBackCloseBtn"),
  welcomeBackAccountState: $("#welcomeBackAccountState"),
  welcomeBackDirect: $("#welcomeBackDirectBtn"),
  welcomeBackTour: $("#welcomeBackTourBtn"),
  downloadZip: $("#downloadZipBtn"),
  downloadArticle: $("#downloadArticleBtn"),
  copyWechat: $("#copyWechatBtn"),
  syncWechat: $("#syncWechatBtn"),
  articleSettings: $("#articleSettings"),
  articleThemeButtons: document.querySelectorAll("[data-article-theme]"),
  articleFontButtons: document.querySelectorAll("[data-article-font]"),
  articleSizeButtons: document.querySelectorAll("[data-article-size]"),
  articleColorButtons: document.querySelectorAll("[data-article-color]"),
  contentImage: $("#contentImageInput"),
  contentVideo: $("#contentVideoInput"),
  obsidianImportMenu: $("#obsidianImportMenu"),
  connectObsidianVault: $("#connectObsidianVaultBtn"),
  syncObsidianVault: $("#syncObsidianVaultBtn"),
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
  wechatModal: $("#wechatModal"),
  wechatClose: $("#wechatCloseBtn"),
  wechatCancel: $("#wechatCancelBtn"),
  wechatConfirm: $("#wechatConfirmBtn"),
  wechatTitle: $("#wechatTitleInput"),
  wechatAuthor: $("#wechatAuthorInput"),
  wechatCover: $("#wechatCoverInput"),
  wechatCoverPreview: $("#wechatCoverPreview"),
  wechatCoverHint: $("#wechatCoverHint"),
  wechatServiceStatus: $("#wechatServiceStatus"),
  livePhotoModal: $("#livePhotoModal"),
  livePhotoClose: $("#livePhotoCloseBtn"),
  livePhotoCancel: $("#livePhotoCancelBtn"),
  livePhotoForm: $("#livePhotoForm"),
  livePhotoPreview: $("#livePhotoPreview"),
  livePhotoVideo: $("#livePhotoVideo"),
  livePhotoCropCanvas: $("#livePhotoCropCanvas"),
  livePhotoEmpty: $("#livePhotoEmpty"),
  livePhotoVideoInput: $("#livePhotoVideoInput"),
  livePhotoFileLabel: $("#livePhotoFileLabel"),
  livePhotoVideoMeta: $("#livePhotoVideoMeta"),
  livePhotoPlatformButtons: document.querySelectorAll("[data-live-platform]"),
  livePhotoRatioButtons: document.querySelectorAll("[data-live-ratio]"),
  livePhotoCustomRatioRow: $("#livePhotoCustomRatioRow"),
  livePhotoCustomRatio: $("#livePhotoCustomRatioInput"),
  livePhotoCustomRatioOutput: $("#livePhotoCustomRatioOutput"),
  livePhotoDurationHint: $("#livePhotoDurationHint"),
  livePhotoStart: $("#livePhotoStartInput"),
  livePhotoCover: $("#livePhotoCoverInput"),
  livePhotoServiceStatus: $("#livePhotoServiceStatus"),
  livePhotoGenerate: $("#livePhotoGenerateBtn"),
  livePhotoHandoffModal: $("#livePhotoHandoffModal"),
  livePhotoHandoffTitle: $("#livePhotoHandoffTitle"),
  livePhotoHandoffClose: $("#livePhotoHandoffCloseBtn"),
  livePhotoHandoffReveal: $("#livePhotoHandoffRevealBtn"),
  livePhotoHandoffAirdrop: $("#livePhotoHandoffAirdropBtn"),
  livePhotoHandoffDownload: $("#livePhotoHandoffDownloadBtn"),
  livePhotoHandoffSummary: $("#livePhotoHandoffSummary"),
  livePhotoHandoffPreview: $("#livePhotoHandoffPreview"),
  livePhotoHandoffPreviewHint: $("#livePhotoHandoffPreviewHint"),
  livePhotoHandoffThumbnails: $("#livePhotoHandoffThumbnails"),
  livePhotoHandoffDevice: $("#livePhotoHandoffDevice"),
  livePhotoHandoffDeviceLabel: $("#livePhotoHandoffDeviceLabel"),
  livePhotoHandoffCount: $("#livePhotoHandoffCount"),
  livePhotoHandoffDetail: $("#livePhotoHandoffDetail"),
  livePhotoHandoffFiles: $("#livePhotoHandoffFiles"),
  livePhotoHandoffHint: $("#livePhotoHandoffHint"),
  livePhotoHandoffProgress: $("#livePhotoHandoffProgress"),
  livePhotoHandoffProgressTitle: $("#livePhotoHandoffProgressTitle"),
  livePhotoHandoffProgressDetail: $("#livePhotoHandoffProgressDetail"),
  livePhotoHandoffProgressPercent: $("#livePhotoHandoffProgressPercent"),
  livePhotoHandoffProgressMeta: $("#livePhotoHandoffProgressMeta"),
  livePhotoHandoffProgressBar: $("#livePhotoHandoffProgressBar"),
  livePhotoHandoffProgressFill: $("#livePhotoHandoffProgressFill"),
  livePhotoHandoffProgressSteps: $("#livePhotoHandoffProgressSteps"),
  livePhotoHandoffCancel: $("#livePhotoHandoffCancelBtn"),
  onboardingTour: $("#onboardingTour"),
  onboardingFocus: $("#onboardingFocus"),
  onboardingTooltip: $("#onboardingTooltip"),
  onboardingTitle: $("#onboardingTitle"),
  onboardingBody: $("#onboardingBody"),
  onboardingProgress: $("#onboardingProgress"),
  onboardingAction: $("#onboardingActionBtn"),
  onboardingSkip: $("#onboardingSkipBtn"),
  onboardingNext: $("#onboardingNextBtn"),
  featureBadges: document.querySelectorAll("[data-feature-badge]"),
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

const GUIDE_STATIC_IMAGE_SRC = "docs/guide-assets/guide-static-image.jpg";
const GUIDE_LIVE_POSTER_SRC = "docs/guide-assets/guide-live-poster.jpg";
const GUIDE_LIVE_VIDEO_SRC = "docs/guide-assets/guide-live-demo.mp4";

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
  colorBrush: false,
  bgColorBrush: false,
  uiTheme: "light",
  headerMode: "every",
  appMode: "cards",
  articleTheme: "wechat",
  articleFont: "sans",
  articleSize: "normal",
  articleColor: "#0f766e",
  obsidianNotePath: null,
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
let previewImageDrag = null;
let previewImageSelection = null;
let wechatCoverData = "";
let wechatServiceReady = false;
let wechatSyncing = false;
const livePhotoState = {
  file: null,
  objectUrl: "",
  sourceDuration: 0,
  sourceWidth: 0,
  sourceHeight: 0,
  platform: "xhs",
  aspect: "original",
  customAspect: 0.75,
  localReady: false,
  serviceMode: "none",
  generating: false,
  editingId: "",
  crop: null,
  savedCrop: null,
  cropDisplay: null,
  cropDrag: null,
  previewFrame: 0,
};
const liveMediaFiles = new Map();
const livePhotoHandoffState = {
  liveResults: [],
  staticPages: [],
  staticPackage: null,
  onlineFallback: false,
  onlineEntries: [],
  selectedJobId: "",
  selectedPageIndex: -1,
  items: [],
  isBatch: false,
  batch: null,
  batchPreparing: null,
  pendingEntries: [],
  prepared: false,
};
const livePhotoPrewarmState = {
  jobs: new Map(),
  timer: 0,
};
const exportProgressState = {
  main: { active: false, startedAt: 0, timer: 0, hideTimer: 0, current: null, total: null, value: 0 },
  handoff: { active: false, startedAt: 0, timer: 0, hideTimer: 0, current: null, total: null, value: 0 },
};
const cloudState = {
  session: null,
  user: null,
  profileAvatarUrl: "",
  loadingWorkspace: false,
  syncingProjects: false,
  syncTimer: 0,
  profileTimer: 0,
  pendingProjects: new Map(),
  pendingAvatarUpload: false,
  localImportProjects: [],
  initialized: false,
  loadingUserId: "",
  signingOut: false,
};
const entryState = {
  mode: "pending",
  resolved: false,
  returning: false,
};
let onboardingStepIndex = 0;
let onboardingMode = "first-run";
const obsidianVault = {
  handle: null,
  fileLookup: null,
  writable: false,
  loading: false,
  importing: false,
  syncing: false,
};

function defaultFormState() {
  return {
    content: defaultText,
    displayName: "捏捏番茄（AI图文版）",
    handle: DEFAULT_HANDLE,
    textColor: "#202938",
    accentColor: "#2563eb",
    bgColor: "#ffffff",
    fontSize: String(DEFAULT_CARD_FONT_SIZE),
    lineHeight: String(DEFAULT_CARD_LINE_HEIGHT),
    zhFont: "zh-system",
    enFont: "en-system",
    imageHeight: String(CARD_MAX_IMAGE_HEIGHT),
    headerMode: "every",
    appMode: "cards",
    articleTheme: "wechat",
    articleFont: "sans",
    articleSize: "normal",
    articleColor: "#0f766e",
    obsidianNotePath: null,
    uiTheme: "light",
    avatar: sampleAvatar,
    avatarCrop: null,
    images: defaultImages(),
  };
}

function blankFormState() {
  const profile = loadStoredAuthorProfile();
  return {
    ...defaultFormState(),
    ...(profile || {}),
    content: "",
    images: {},
  };
}

const cardsGuideText = `# 图文卡片说明书

这是一份内置说明书，用来直接体验图文卡片、普通图片、实况图片和 Obsidian 同步。它不会被修改，也不能删除。

## 第一步：创建自己的内容

点击左上角“+”新建内容，再粘贴 Markdown 或普通文本。图文卡片适合小红书图文、X 长帖截图、知识卡片和长文拆条。

## 第二步：插入普通图片

点击工具栏的图片按钮，上传后选择裁剪比例和画面范围。

[[image:guide_static]]

上面是普通图片示例。在右侧可以拖动图片调整段落位置，也可以修改宽度、对齐和裁剪。

编辑框里的 \`[[image:图片编号]]\` 就是图片位置，把整行移动到其他段落之间即可重新排版。

## 第三步：制作实况图片

点击工具栏的视频按钮，上传 MP4、MOV 或 WebM。选择发布平台和画面比例后，拖动裁剪框决定保留区域，再插入图文。

[[image:guide_live]]

上面是可播放的内置实况演示。新建内容后请换成自己的视频；右侧下载会自动识别实况页。在线版会由云端 Mac 生成完整 Live Photo 发布包，本地版还可以直接打开 Finder 和 AirDrop。

混合批量下载会保持原始顺序：普通页面保留为高清 PNG，实况页面保留为完整 \`.pvt\`。在线版下载 ZIP 后，在 Finder 中把整个 \`.pvt\` AirDrop 到 iPhone。

## 第四步：连接 Obsidian

点击工具栏的 Obsidian 按钮，选择仓库根目录。之后直接粘贴 Obsidian Markdown，页面会读取 \`![[图片.png]]\` 和标准 Markdown 图片。

修改完成后点击“同步回 Obsidian”。浏览器允许写入时会保存到仓库的“写了就发”文件夹；无法直写时会下载 ZIP 导入包。

## 第五步：排版与导出

使用 H1、H2、加粗、斜体、引用、颜色和文字背景色整理重点。

选择“每页头像”或“仅首页头像”，在右侧检查自动分页，再下载单张或批量导出。

如果某一页太满，优先拆短段落，而不是一味缩小字号。空行会被保留，可以主动控制卡片节奏。

## 常用 Markdown

- \`# 标题\`：大标题
- \`## 标题\`：段落标题
- \`**文字**\`：加粗
- \`*文字*\`：斜体
- \`> 内容\`：引用块`;

function cardsGuideImages() {
  return {
    guide_static: {
      src: GUIDE_STATIC_IMAGE_SRC,
      name: "普通图片示例",
      layout: { widthPercent: 100, align: "center" },
    },
    guide_live: {
      kind: "live",
      src: GUIDE_LIVE_POSTER_SRC,
      previewVideoSrc: GUIDE_LIVE_VIDEO_SRC,
      videoKey: "guide_live",
      videoName: "guide-live-demo.mp4",
      name: "实况图片示例",
      demoOnly: true,
      layout: { widthPercent: 100, align: "center" },
      liveSettings: {
        platform: "xhs",
        aspect: "1.777778",
        start: 0,
        coverOffset: 0.2,
        focusX: 50,
        focusY: 50,
      },
    },
  };
}

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
    images: cardsGuideImages(),
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

const GUIDE_DOWNLOAD_MESSAGE = "内置说明书仅供预览，请先点击左上角“+”新建自己的内容再下载。";

function blockBuiltInGuideDownload() {
  if (!isBuiltInProjectId(state.currentProjectId)) return false;
  els.status.textContent = GUIDE_DOWNLOAD_MESSAGE;
  return true;
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
  syncExportBusyState();
}

function readForm() {
  return {
    content: els.content.value,
    displayName: els.displayName.value.trim() || "未命名作者",
    handle: normalizeHandle(els.handle.value),
    textColor: els.textColor.value,
    accentColor: els.accentColor.value,
    bgColor: els.bgColor.value,
    fontSize: clamp(Number(els.fontSize.value) || DEFAULT_CARD_FONT_SIZE, 24, 40),
    lineHeight: clamp(Number(els.lineHeight.value) || DEFAULT_CARD_LINE_HEIGHT, 1, 2.4),
    zhFont: FONT_STACKS[els.zhFont.value] ? els.zhFont.value : "zh-system",
    enFont: FONT_STACKS[els.enFont.value] ? els.enFont.value : "en-system",
    imageHeight: clamp(Number(els.imageHeight.value) || CARD_MAX_IMAGE_HEIGHT, 220, CARD_MAX_IMAGE_HEIGHT),
    headerMode: state.headerMode === "first" ? "first" : "every",
    appMode: state.appMode === "article" ? "article" : "cards",
    articleTheme: normalizeArticleTheme(state.articleTheme),
    articleFont: normalizeArticleFont(state.articleFont),
    articleSize: normalizeArticleSize(state.articleSize),
    articleColor: normalizeArticleColor(state.articleColor),
    obsidianNotePath: state.obsidianNotePath,
    uiTheme: state.uiTheme,
    avatar: state.avatar,
    avatarCrop: state.avatarCrop,
    images: state.images,
  };
}

function normalizeAuthorProfile(data = {}) {
  const displayName = String(data.displayName || "").trim().slice(0, 40) || "捏捏番茄（AI图文版）";
  const avatarCrop = data.avatarCrop && typeof data.avatarCrop === "object"
    ? {
        x: finiteNumber(data.avatarCrop.x, 0),
        y: finiteNumber(data.avatarCrop.y, 0),
        width: finiteNumber(data.avatarCrop.width, 0),
        height: finiteNumber(data.avatarCrop.height, 0),
      }
    : null;
  return {
    displayName,
    handle: normalizeHandle(data.handle || DEFAULT_HANDLE),
    avatar: typeof data.avatar === "string" && data.avatar ? data.avatar : sampleAvatar,
    avatarCrop,
  };
}

function loadStoredAuthorProfile() {
  try {
    const raw = storageForScope().getItem(scopedStorageKey(AUTHOR_PROFILE_STORAGE_KEY));
    return raw ? normalizeAuthorProfile(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function saveAuthorProfile(data = readForm()) {
  if (isBuiltInProjectId(state.currentProjectId)) return false;
  try {
    storageForScope().setItem(scopedStorageKey(AUTHOR_PROFILE_STORAGE_KEY), JSON.stringify(normalizeAuthorProfile(data)));
    scheduleCloudProfileSync();
    return true;
  } catch {
    els.status.textContent = "头像文件过大，作者资料暂时无法写入本机缓存";
    return false;
  }
}

function applyForm(data) {
  const projectProfile = normalizeAuthorProfile(data);
  const profile = isBuiltInProjectId(state.currentProjectId)
    ? projectProfile
    : loadStoredAuthorProfile() || projectProfile;
  els.content.value = data.content ?? defaultText;
  els.displayName.value = profile.displayName;
  els.handle.value = profile.handle;
  els.textColor.value = data.textColor ?? "#202938";
  els.accentColor.value = data.accentColor ?? "#2563eb";
  els.bgColor.value = data.bgColor ?? "#ffffff";
  els.fontSize.value = data.fontSize ?? String(DEFAULT_CARD_FONT_SIZE);
  els.lineHeight.value = data.lineHeight ?? String(DEFAULT_CARD_LINE_HEIGHT);
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
  state.obsidianNotePath = normalizeObsidianNotePath(data.obsidianNotePath);
  updateAppMode();
  updateHeaderModeButton();
  updateArticleControls();
  setUiTheme(data.uiTheme || "light", false, true);
  state.avatar = profile.avatar;
  state.avatarCrop = profile.avatarCrop;
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
  els.downloadZip.hidden = state.appMode === "article";
  els.downloadArticle.hidden = state.appMode !== "article";
  els.copyWechat.hidden = state.appMode !== "article";
  els.syncWechat.hidden = state.appMode !== "article";
  els.headerModeToggle.hidden = state.appMode === "article";
}

async function setAppMode(mode) {
  const nextMode = mode === "article" ? "article" : "cards";
  if (state.appMode === nextMode) return;
  state.appMode = nextMode;
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
    saveAuthorProfile(data);

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
    storageForScope().setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(data));
    saveProjectStore();
    scheduleCloudProjectSync(current);
    updateProjectHistory();
  } catch {
    els.status.textContent = "本次内容较大，浏览器未写入本地缓存";
  }
}

function loadState() {
  const store = loadProjectStore();
  state.projects = store.projects;
  state.currentProjectId = store.activeId || store.projects[0]?.id || GUIDE_CARDS_PROJECT_ID;
  const data = findHistoryProject(state.currentProjectId)?.data || findHistoryProject(GUIDE_CARDS_PROJECT_ID)?.data || defaultFormState();
  if (!isBuiltInProjectId(state.currentProjectId) && !loadStoredAuthorProfile()) {
    saveAuthorProfile(data);
  }
  return data;
}

function cloudApi() {
  return window.WriteThenPublishCloud || null;
}

function cloudIsReady() {
  return Boolean(cloudApi()?.configured && cloudState.user);
}

function accountScope(userId) {
  return `user_${String(userId || "").replace(/[^a-z0-9_-]/gi, "")}`;
}

function loadProjectStoreForScope(scope) {
  const previousScope = activeStorageScope;
  activeStorageScope = scope;
  const store = loadProjectStore();
  activeStorageScope = previousScope;
  return store;
}

function setAccountNotice(message = "", tone = "") {
  if (!els.accountConfigNotice) return;
  els.accountConfigNotice.hidden = !message;
  els.accountConfigNotice.textContent = message;
  els.accountConfigNotice.className = `account-notice${tone ? ` ${tone}` : ""}`;
}

let accountAuthMode = "signin";
let pendingConfirmationEmail = "";

function setPendingConfirmation(email = "") {
  pendingConfirmationEmail = String(email || "").trim();
}

function setAccountPasswordVisible(visible) {
  if (!els.accountPassword || !els.accountPasswordToggle) return;
  els.accountPassword.type = visible ? "text" : "password";
  els.accountPasswordToggle.title = visible ? "隐藏密码" : "显示密码";
  els.accountPasswordToggle.setAttribute("aria-label", visible ? "隐藏密码" : "显示密码");
  const icon = els.accountPasswordToggle.querySelector("[data-lucide]");
  if (icon) icon.setAttribute("data-lucide", visible ? "eye-off" : "eye");
  if (window.lucide) window.lucide.createIcons();
}

function authRedirectErrorMessage() {
  const rawParams = [window.location.search.slice(1), window.location.hash.slice(1)].filter(Boolean);
  for (const raw of rawParams) {
    const params = new URLSearchParams(raw);
    const code = params.get("error_code") || "";
    if (!code) continue;
    if (code === "otp_expired") {
      return "这封确认邮件已经失效。请重新发送确认邮件，并只点击最新收到的那一封。";
    }
    return params.get("error_description") || "邮箱确认失败，请重新发送确认邮件。";
  }
  return "";
}

function setAccountAuthMode(mode, { keepNotice = false } = {}) {
  accountAuthMode = mode === "signup" ? "signup" : "signin";
  const signingUp = accountAuthMode === "signup";
  els.accountSignInMode?.classList.toggle("is-active", !signingUp);
  els.accountSignInMode?.setAttribute("aria-selected", String(!signingUp));
  els.accountSignUp?.classList.toggle("is-active", signingUp);
  els.accountSignUp?.setAttribute("aria-selected", String(signingUp));
  if (els.accountPasswordConfirmField) els.accountPasswordConfirmField.hidden = !signingUp;
  if (els.accountPasswordConfirm) {
    els.accountPasswordConfirm.required = signingUp;
    if (!signingUp) els.accountPasswordConfirm.value = "";
  }
  if (els.accountPassword) els.accountPassword.autocomplete = signingUp ? "new-password" : "current-password";
  if (els.accountSignIn) els.accountSignIn.textContent = signingUp ? "注册" : "登录";
  if (els.accountResendConfirmation) {
    els.accountResendConfirmation.hidden = signingUp || Boolean(cloudState.user) || !cloudApi()?.configured;
  }
  setAccountPasswordVisible(false);
  if (!keepNotice && cloudApi()?.configured) setAccountNotice("");
}

function accountAuthErrorMessage(error, mode) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  if (mode === "signin") {
    if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
      return "登录失败：邮箱尚未注册，或密码不正确。第一次使用请先切换到“注册新账号”。";
    }
    if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
      return "账号已经创建，但邮箱还没有确认。请先打开确认邮件，再回来登录。";
    }
    return error?.message || "登录失败，请检查邮箱和密码。";
  }
  if (code === "user_already_exists" || message.includes("already registered")) {
    return "这个邮箱已经注册过，请切换到“登录”并输入原密码。";
  }
  if (code === "email_address_not_authorized" || message.includes("email address not authorized")) {
    return "当前邮件服务暂时无法向这个邮箱发送确认邮件，请稍后再试。";
  }
  return error?.message || "注册失败，请稍后再试。";
}

function setAccountBusy(busy) {
  [
    els.accountEmail,
    els.accountPassword,
    els.accountPasswordToggle,
    els.accountPasswordConfirm,
    els.accountSignInMode,
    els.accountSignIn,
    els.accountSignUp,
    els.accountResendConfirmation,
    els.accountSignOut,
    els.accountImportLocal,
  ]
    .filter(Boolean)
    .forEach((element) => {
      element.disabled = busy;
    });
}

function updateAccountUi() {
  const api = cloudApi();
  const configured = Boolean(api?.configured);
  const signedIn = Boolean(cloudState.user);
  els.account?.classList.toggle("is-online", signedIn);
  els.account?.classList.toggle("is-guest", entryState.mode === "guest" && !signedIn);
  if (els.accountLabel) {
    els.accountLabel.textContent = signedIn
      ? "已同步"
      : entryState.mode === "guest"
        ? "游客模式"
        : "账号";
  }
  if (els.accountMenuTitle) {
    els.accountMenuTitle.textContent = signedIn
      ? els.displayName.value.trim() || "已登录"
      : entryState.mode === "guest"
        ? "游客模式"
        : "账号";
  }
  if (els.accountMenuDescription) {
    els.accountMenuDescription.textContent = signedIn
      ? cloudState.user.email || "云端工作区已连接"
      : "草稿仅临时保存在当前标签页";
  }
  if (els.accountMenuLogin) els.accountMenuLogin.hidden = signedIn;
  if (els.accountMenuManage) els.accountMenuManage.hidden = !signedIn;
  if (els.accountMenuSignOut) els.accountMenuSignOut.hidden = !signedIn;
  if (els.accountMenuHint) {
    els.accountMenuHint.textContent = signedIn
      ? "图文、头像和素材会按当前账号同步保存。"
      : "继续使用游客模式无需操作，点击菜单外即可关闭。";
  }
  if (els.accountAuthForm) els.accountAuthForm.hidden = signedIn;
  if (els.accountSignedIn) els.accountSignedIn.hidden = !signedIn;
  if (els.accountResendConfirmation) {
    els.accountResendConfirmation.hidden = signedIn || !configured || accountAuthMode === "signup";
  }

  if (!configured) {
    setAccountNotice(api?.configurationError || "Supabase 尚未配置。", "");
    [els.accountEmail, els.accountPassword, els.accountPasswordConfirm, els.accountSignInMode, els.accountSignIn, els.accountSignUp]
      .filter(Boolean)
      .forEach((element) => {
      element.disabled = true;
      });
  } else if (!signedIn && els.accountConfigNotice?.textContent?.includes("Supabase")) {
    setAccountNotice("");
  }

  if (signedIn) {
    els.accountAvatar.src = els.avatarPreview?.src || state.avatar || sampleAvatar;
    els.accountDisplayName.textContent = els.displayName.value.trim() || "未命名作者";
    els.accountEmailLabel.textContent = cloudState.user.email || "";
    const localCount = cloudState.localImportProjects.length;
    els.accountImportLocal.hidden = localCount < 1;
    if (localCount) els.accountImportLocal.innerHTML = `<i data-lucide="cloud-upload"></i>导入 ${localCount} 条游客 / 旧本机草稿到此账号`;
  }
  updateFeatureBadges();
  if (window.lucide) window.lucide.createIcons();
}

function openAccountModal() {
  closeAccountMenu();
  els.entryChoiceModal?.classList.add("hidden");
  els.accountModal.classList.remove("hidden");
  updateAccountUi();
  if (!cloudState.user) setAccountAuthMode(accountAuthMode, { keepNotice: true });
  const lastEmail = localStorage.getItem(LAST_ACCOUNT_EMAIL_KEY) || "";
  if (!els.accountEmail.value && lastEmail) els.accountEmail.value = lastEmail;
  if (!cloudState.user && cloudApi()?.configured) requestAnimationFrame(() => els.accountEmail.focus());
}

function closeAccountModal() {
  els.accountModal.classList.add("hidden");
  if (!entryState.resolved) showEntryChoice();
}

function accountMenuIsOpen() {
  return Boolean(els.accountMenu && !els.accountMenu.classList.contains("hidden"));
}

function openAccountMenu() {
  updateAccountUi();
  els.accountMenu?.classList.remove("hidden");
  els.account?.setAttribute("aria-expanded", "true");
}

function closeAccountMenu() {
  els.accountMenu?.classList.add("hidden");
  els.account?.setAttribute("aria-expanded", "false");
}

function toggleAccountMenu() {
  if (accountMenuIsOpen()) closeAccountMenu();
  else openAccountMenu();
}

function experienceSubject() {
  return cloudState.user?.id ? accountScope(cloudState.user.id) : "guest";
}

function experienceStorageKey(baseKey) {
  return `${baseKey}.${experienceSubject()}`;
}

function experienceVersionIsStored(baseKey) {
  try {
    return localStorage.getItem(experienceStorageKey(baseKey)) === EXPERIENCE_VERSION;
  } catch {
    return false;
  }
}

function storeExperienceVersion(baseKey) {
  try {
    localStorage.setItem(experienceStorageKey(baseKey), EXPERIENCE_VERSION);
  } catch {
    // The experience continues even if version memory is unavailable.
  }
}

function experiencePreviewMode() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "1") return "welcome";
    if (params.get("whatsnew") === "1") return "whats-new";
  } catch {
    // Ignore malformed preview URLs.
  }
  return "";
}

function firstRunTourIsForced() {
  try {
    return new URLSearchParams(window.location.search).get("tour") === "1";
  } catch {
    return false;
  }
}

function workspaceHasReturningData() {
  if (state.projects.length) return true;
  try {
    if (localStorage.getItem(ONBOARDING_STORAGE_KEY) === "completed") return true;
  } catch {
    // Continue with project-store checks.
  }
  return loadProjectStoreForScope("guest").projects.length > 0
    || loadProjectStoreForScope("local").projects.length > 0;
}

function loadAuthorProfileForScope(scope) {
  const previousScope = activeStorageScope;
  activeStorageScope = scope;
  const profile = loadStoredAuthorProfile();
  activeStorageScope = previousScope;
  return profile;
}

async function activateGuestWorkspace({ restoreLegacy = true } = {}) {
  const guestStore = loadProjectStoreForScope("guest");
  const legacyStore = loadProjectStoreForScope("local");
  if (restoreLegacy && !guestStore.projects.length && legacyStore.projects.length) {
    const legacyProfile = loadAuthorProfileForScope("local");
    const profileRow = legacyProfile
      ? {
          display_name: legacyProfile.displayName,
          handle: legacyProfile.handle,
          avatar_url: legacyProfile.avatar,
          avatar_crop: legacyProfile.avatarCrop,
        }
      : null;
    await activateWorkspaceScope("guest", legacyStore.projects, profileRow);
    return;
  }
  await activateWorkspaceScope("guest");
}

function updateFeatureBadges() {
  const acknowledged = experienceVersionIsStored(WHATS_NEW_STORAGE_KEY);
  els.featureBadges.forEach((badge) => {
    const accountOnly = badge.dataset.featureBadge === "account";
    badge.hidden = !entryState.resolved || acknowledged || (accountOnly && Boolean(cloudState.user));
  });
}

function welcomeBackIsOpen() {
  return Boolean(els.welcomeBackModal && !els.welcomeBackModal.classList.contains("hidden"));
}

function openWelcomeBack() {
  closeAccountMenu();
  finishOnboarding({ remember: false });
  if (els.welcomeBackAccountState) {
    els.welcomeBackAccountState.textContent = cloudState.user ? "已开启" : "可选开启";
  }
  els.welcomeBackModal?.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function closeWelcomeBack({ startTour = false } = {}) {
  if (!welcomeBackIsOpen() && !startTour) return;
  storeExperienceVersion(WELCOME_BACK_STORAGE_KEY);
  els.welcomeBackModal?.classList.add("hidden");
  updateFeatureBadges();
  if (startTour) window.setTimeout(startWhatsNewTour, 120);
}

async function showGuideProjectForDemo() {
  const guideProject = findHistoryProject(GUIDE_CARDS_PROJECT_ID);
  if (!guideProject) return;
  state.currentProjectId = guideProject.id;
  applyForm(guideProject.data);
  syncGuideReadOnlyMode();
  resetTextHistory();
  updateProjectHistory();
  await render();
  els.status.textContent = "演示模式：正在展示内置《图文卡片说明书》";
}

async function presentPostEntryExperience() {
  if (!entryState.resolved) return;
  const previewMode = experiencePreviewMode();
  updateFeatureBadges();
  if (firstRunTourIsForced()) {
    await showGuideProjectForDemo();
    onboardingMode = "first-run";
    showOnboardingStep(0);
    return;
  }
  if (previewMode === "whats-new") {
    await showGuideProjectForDemo();
    startWhatsNewTour();
    return;
  }
  if (previewMode === "welcome" || (entryState.returning && !experienceVersionIsStored(WELCOME_BACK_STORAGE_KEY))) {
    if (previewMode === "welcome") await showGuideProjectForDemo();
    openWelcomeBack();
    return;
  }
  if (!entryState.returning) maybeStartOnboarding();
}

function setEntryChoiceNotice(message = "", tone = "") {
  if (!els.entryChoiceNotice) return;
  els.entryChoiceNotice.hidden = !message;
  els.entryChoiceNotice.textContent = message;
  els.entryChoiceNotice.className = `entry-choice-notice${tone ? ` ${tone}` : ""}`;
}

function showEntryChoice(message = "", tone = "") {
  closeAccountMenu();
  entryState.mode = "pending";
  entryState.resolved = false;
  document.body.classList.add("entry-choice-pending");
  els.entryChoiceModal?.classList.remove("hidden");
  if (els.entryChoiceLoading) els.entryChoiceLoading.hidden = true;
  if (els.entryChoiceContent) els.entryChoiceContent.hidden = false;
  setEntryChoiceNotice(message, tone);
  const lastEmail = localStorage.getItem(LAST_ACCOUNT_EMAIL_KEY) || "";
  if (els.entryChoiceReturningHint) {
    els.entryChoiceReturningHint.hidden = !lastEmail;
    els.entryChoiceReturningHint.textContent = lastEmail ? `上次登录：${lastEmail}` : "";
  }
  updateAccountUi();
  if (window.lucide) window.lucide.createIcons();
}

function finishEntryChoice(mode, { returning = null } = {}) {
  entryState.mode = mode;
  entryState.resolved = true;
  entryState.returning = returning == null ? workspaceHasReturningData() : Boolean(returning);
  els.entryChoiceModal?.classList.add("hidden");
  els.accountModal?.classList.add("hidden");
  document.body.classList.remove("entry-choice-pending", "cloud-session-checking");
  updateAccountUi();
  window.setTimeout(() => void presentPostEntryExperience(), 180);
}

async function chooseGuestMode() {
  sessionStorage.setItem(ENTRY_MODE_SESSION_KEY, "guest");
  await activateGuestWorkspace();
  finishEntryChoice("guest");
  els.status.textContent = "游客模式：内容仅临时保存在当前标签页";
}

function chooseLoginMode() {
  if (!cloudApi()?.configured) {
    openAccountModal();
    setAccountNotice(cloudApi()?.configurationError || "站点管理员尚未启用登录功能。", "");
    return;
  }
  openAccountModal();
}

function cloudProjectFromRow(row) {
  const updatedAt = Date.parse(row.updated_at) || Date.now();
  return normalizeProject({
    id: row.id,
    title: row.title,
    updatedAt,
    data: row.data,
  });
}

async function hydrateCloudProject(project) {
  const api = cloudApi();
  const images = project?.data?.images;
  if (!api?.configured || !images || typeof images !== "object") return project;
  await Promise.all(
    Object.entries(images).map(async ([id, image]) => {
      if (!image || typeof image !== "object") return;
      try {
        if (image.storagePath && !image.src) {
          const blob = await api.downloadProjectAsset(image.storagePath);
          image.src = URL.createObjectURL(blob);
        }
        if (image.kind === "live" && image.videoStoragePath) {
          const key = String(image.videoKey || id);
          const videoBlob = await api.downloadProjectAsset(image.videoStoragePath);
          await writeLiveMediaBlob(key, videoBlob);
          replaceLiveMediaCache(key, videoBlob, image.videoName || "video.mov");
        }
      } catch (error) {
        console.error("云端素材读取失败", error);
      }
    }),
  );
  return project;
}

async function activateWorkspaceScope(scope, projects = null, profile = null) {
  cloudState.loadingWorkspace = true;
  activeStorageScope = scope;
  try {
    if (profile) {
      const normalizedProfile = normalizeAuthorProfile({
        displayName: profile.display_name,
        handle: profile.handle,
        avatar: profile.avatar_url || sampleAvatar,
        avatarCrop: profile.avatar_crop,
      });
      cloudState.profileAvatarUrl = profile.avatar_url || "";
      storageForScope().setItem(scopedStorageKey(AUTHOR_PROFILE_STORAGE_KEY), JSON.stringify(normalizedProfile));
    } else {
      cloudState.profileAvatarUrl = "";
    }

    if (Array.isArray(projects)) {
      const hydrated = await Promise.all(projects.map(hydrateCloudProject));
      state.projects = hydrated.filter(Boolean).slice(0, MAX_PROJECTS);
      state.currentProjectId = state.projects[0]?.id || GUIDE_CARDS_PROJECT_ID;
      saveProjectStore();
    } else {
      const store = loadProjectStore();
      state.projects = store.projects;
      state.currentProjectId = store.activeId || store.projects[0]?.id || GUIDE_CARDS_PROJECT_ID;
    }

    const data = findHistoryProject(state.currentProjectId)?.data || findHistoryProject(GUIDE_CARDS_PROJECT_ID)?.data || defaultFormState();
    applyForm(data);
    syncGuideReadOnlyMode();
    resetTextHistory();
    updateProjectHistory();
    await render();
  } finally {
    cloudState.loadingWorkspace = false;
  }
}

async function loadCloudWorkspace(session) {
  const api = cloudApi();
  const user = session?.user;
  if (!api?.configured || !user) return;
  if (cloudState.loadingUserId === user.id) return;
  cloudState.loadingUserId = user.id;
  cloudState.session = session;
  cloudState.user = user;
  const guestProjects = loadProjectStoreForScope("guest").projects;
  const legacyProjects = loadProjectStoreForScope("local").projects;
  cloudState.localImportProjects = [...guestProjects, ...legacyProjects]
    .filter((project, index, projects) => projects.findIndex((item) => item.id === project.id) === index)
    .slice(0, MAX_PROJECTS);
  setAccountBusy(true);
  if (els.accountSyncStatus) els.accountSyncStatus.textContent = "正在读取账号数据…";
  updateAccountUi();
  try {
    const [profile, rows] = await Promise.all([api.getProfile(), api.listProjects()]);
    let resolvedProfile = profile;
    if (!resolvedProfile) {
      const cached = loadStoredAuthorProfile() || normalizeAuthorProfile({
        displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || "未命名作者",
        handle: user.email ? `@${user.email.split("@")[0]}` : "@profile",
      });
      resolvedProfile = await api.upsertProfile(cached);
    }
    const projects = rows.map(cloudProjectFromRow).filter(Boolean);
    await activateWorkspaceScope(accountScope(user.id), projects, resolvedProfile);
    els.accountSyncStatus.textContent = projects.length ? `已同步 ${projects.length} 条图文` : "云端还没有图文，可导入游客或旧本机草稿";
    setAccountNotice("");
  } catch (error) {
    console.error(error);
    if (activeStorageScope !== accountScope(user.id)) {
      await activateWorkspaceScope(accountScope(user.id));
    }
    setAccountNotice(error?.message || "云端数据读取失败，请检查数据库初始化是否完成。", "error");
    els.accountSyncStatus.textContent = "云端同步未完成";
  } finally {
    cloudState.loadingUserId = "";
    setAccountBusy(false);
    updateAccountUi();
  }
}

async function handleCloudSession(session) {
  const nextUserId = session?.user?.id || "";
  if (nextUserId && cloudState.user?.id === nextUserId && activeStorageScope === accountScope(nextUserId)) {
    cloudState.session = session;
    updateAccountUi();
    return;
  }
  if (session?.user) {
    await loadCloudWorkspace(session);
    return;
  }

  cloudState.session = null;
  cloudState.user = null;
  cloudState.profileAvatarUrl = "";
  updateAccountUi();
}

async function initializeCloudAccount() {
  const api = cloudApi();
  const redirectError = authRedirectErrorMessage();
  document.body.classList.toggle("cloud-session-checking", Boolean(api?.configured));
  updateAccountUi();
  cloudState.initialized = true;
  if (experiencePreviewMode() || firstRunTourIsForced()) {
    document.body.classList.remove("cloud-session-checking");
    activeStorageScope = "guest";
    await showGuideProjectForDemo();
    finishEntryChoice("guest", { returning: true });
    return;
  }
  if (!api?.configured) {
    document.body.classList.remove("cloud-session-checking");
    if (sessionStorage.getItem(ENTRY_MODE_SESSION_KEY) === "guest") {
      await activateGuestWorkspace();
      finishEntryChoice("guest");
    } else if (experiencePreviewMode() || workspaceHasReturningData()) {
      sessionStorage.setItem(ENTRY_MODE_SESSION_KEY, "guest");
      await activateGuestWorkspace();
      finishEntryChoice("guest", { returning: true });
    } else {
      showEntryChoice();
    }
    return;
  }
  api.onAuthStateChange((event, session) => {
    if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) return;
    if (event === "SIGNED_OUT") {
      if (!cloudState.signingOut && entryState.mode === "account") {
        window.setTimeout(async () => {
          await handleCloudSession(null);
          await activateWorkspaceScope("guest");
          sessionStorage.removeItem(ENTRY_MODE_SESSION_KEY);
          showEntryChoice("登录状态已结束，请重新选择使用方式。");
        }, 0);
      }
      return;
    }
    window.setTimeout(async () => {
      await handleCloudSession(session);
      if (session?.user) finishEntryChoice("account");
    }, 0);
  });
  try {
    const session = await api.getSession();
    if (session?.user) {
      await handleCloudSession(session);
      finishEntryChoice("account");
    } else if (redirectError) {
      const lastEmail = localStorage.getItem(LAST_ACCOUNT_EMAIL_KEY) || "";
      setPendingConfirmation(lastEmail);
      showEntryChoice();
      window.setTimeout(() => {
        openAccountModal();
        setAccountNotice(redirectError, "error");
      }, 0);
    } else if (sessionStorage.getItem(ENTRY_MODE_SESSION_KEY) === "guest") {
      await activateGuestWorkspace();
      finishEntryChoice("guest");
    } else if (experiencePreviewMode() || workspaceHasReturningData()) {
      sessionStorage.setItem(ENTRY_MODE_SESSION_KEY, "guest");
      await activateGuestWorkspace();
      finishEntryChoice("guest", { returning: true });
    } else {
      showEntryChoice();
    }
  } catch (error) {
    setAccountNotice(error?.message || "登录状态读取失败。", "error");
    if (experiencePreviewMode() || firstRunTourIsForced()) {
      sessionStorage.setItem(ENTRY_MODE_SESSION_KEY, "guest");
      await activateGuestWorkspace();
      finishEntryChoice("guest", { returning: true });
    } else {
      showEntryChoice("暂时无法检查登录状态，你仍可先使用游客模式。", "error");
    }
  } finally {
    document.body.classList.remove("cloud-session-checking");
  }
}

async function signInAccount() {
  const email = els.accountEmail.value.trim();
  const password = els.accountPassword.value;
  if (!email || password.length < 8) {
    setAccountNotice("请输入邮箱和至少 8 位密码。", "error");
    return;
  }
  setAccountBusy(true);
  setAccountNotice("正在登录…");
  try {
    const result = await cloudApi().signIn(email, password);
    await handleCloudSession(result.session);
    localStorage.setItem(LAST_ACCOUNT_EMAIL_KEY, email);
    setPendingConfirmation("");
    sessionStorage.removeItem(ENTRY_MODE_SESSION_KEY);
    finishEntryChoice("account");
    els.accountPassword.value = "";
    setAccountNotice("登录成功，已切换到你的云端工作区。", "success");
  } catch (error) {
    setAccountNotice(accountAuthErrorMessage(error, "signin"), "error");
  } finally {
    setAccountBusy(false);
  }
}

async function signUpAccount() {
  const email = els.accountEmail.value.trim();
  const password = els.accountPassword.value;
  if (!email || password.length < 8) {
    setAccountNotice("请输入邮箱和至少 8 位密码。", "error");
    return;
  }
  if (password !== els.accountPasswordConfirm.value) {
    setAccountNotice("两次输入的密码不一致，请重新确认。", "error");
    els.accountPasswordConfirm.focus();
    return;
  }
  setAccountBusy(true);
  setAccountNotice("正在创建账号…");
  try {
    const result = await cloudApi().signUp(email, password);
    localStorage.setItem(LAST_ACCOUNT_EMAIL_KEY, email);
    if (result.session) {
      await handleCloudSession(result.session);
      localStorage.setItem(LAST_ACCOUNT_EMAIL_KEY, email);
      sessionStorage.removeItem(ENTRY_MODE_SESSION_KEY);
      finishEntryChoice("account");
      setAccountNotice("注册成功，已登录。", "success");
    } else {
      setPendingConfirmation(email);
      setAccountNotice("注册成功，请到邮箱点击确认链接后再登录。", "success");
      setAccountAuthMode("signin", { keepNotice: true });
    }
    els.accountPassword.value = "";
    els.accountPasswordConfirm.value = "";
  } catch (error) {
    setAccountNotice(accountAuthErrorMessage(error, "signup"), "error");
  } finally {
    setAccountBusy(false);
  }
}

async function resendAccountConfirmation() {
  const email = pendingConfirmationEmail || els.accountEmail.value.trim();
  if (!email) {
    setAccountNotice("请先输入注册时使用的邮箱。", "error");
    els.accountEmail.focus();
    return;
  }
  setAccountBusy(true);
  setAccountNotice("正在重新发送确认邮件…");
  try {
    await cloudApi().resendSignUp(email);
    localStorage.setItem(LAST_ACCOUNT_EMAIL_KEY, email);
    setPendingConfirmation(email);
    setAccountAuthMode("signin", { keepNotice: true });
    setAccountNotice("新的确认邮件已经发送。请只点击最新收到的那一封。", "success");
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();
    setAccountNotice(
      message.includes("rate limit")
        ? "发送得太频繁，请稍等一会儿再试。"
        : error?.message || "确认邮件发送失败，请稍后再试。",
      "error",
    );
  } finally {
    setAccountBusy(false);
  }
}

async function submitAccountAuth(event) {
  event.preventDefault();
  if (accountAuthMode === "signup") await signUpAccount();
  else await signInAccount();
}

async function signOutAccount() {
  closeAccountMenu();
  setAccountBusy(true);
  cloudState.signingOut = true;
  try {
    document.body.classList.add("entry-choice-pending");
    await cloudApi().signOut();
    await handleCloudSession(null);
    await activateWorkspaceScope("guest");
    sessionStorage.removeItem(ENTRY_MODE_SESSION_KEY);
    closeAccountModal();
    showEntryChoice("已安全退出。你可以重新登录，或临时以游客身份使用。");
  } catch (error) {
    document.body.classList.remove("entry-choice-pending");
    setAccountNotice(error?.message || "退出登录失败。", "error");
  } finally {
    cloudState.signingOut = false;
    setAccountBusy(false);
  }
}

function scheduleCloudProjectSync(project) {
  if (!cloudIsReady() || cloudState.loadingWorkspace || !project || isBuiltInProject(project)) return;
  cloudState.pendingProjects.set(project.id, project);
  window.clearTimeout(cloudState.syncTimer);
  cloudState.syncTimer = window.setTimeout(() => void flushCloudProjectSync(), 850);
}

async function prepareProjectForCloud(project) {
  const api = cloudApi();
  const cloudProject = JSON.parse(JSON.stringify(project));
  const sourceImages = project.data?.images || {};
  const cloudImages = cloudProject.data?.images || {};

  for (const [id, sourceImage] of Object.entries(sourceImages)) {
    const cloudImage = cloudImages[id];
    if (!sourceImage || !cloudImage || typeof sourceImage !== "object") continue;
    if (!sourceImage.storagePath && sourceImage.src && !/^https?:/i.test(sourceImage.src)) {
      try {
        const blob = await fetch(sourceImage.src).then((response) => response.blob());
        sourceImage.storagePath = await api.uploadProjectAsset(project.id, `${id}-cover`, blob, sourceImage.name || `${id}.jpg`);
      } catch (error) {
        console.error("图片上传失败", error);
      }
    }
    if (sourceImage.storagePath) {
      cloudImage.storagePath = sourceImage.storagePath;
      cloudImage.src = "";
    }

    if (sourceImage.kind === "live" && !sourceImage.videoStoragePath) {
      const videoKey = String(sourceImage.videoKey || id);
      try {
        const cachedBlob = liveMediaFiles.get(videoKey)?.blob || await readLiveMediaBlob(videoKey);
        if (cachedBlob) {
          sourceImage.videoStoragePath = await api.uploadProjectAsset(
            project.id,
            `${id}-video`,
            cachedBlob,
            sourceImage.videoName || "video.mov",
          );
        }
      } catch (error) {
        console.error("实况视频上传失败", error);
      }
    }
    if (sourceImage.videoStoragePath) cloudImage.videoStoragePath = sourceImage.videoStoragePath;
    if (sourceImage.kind === "live" && !String(sourceImage.previewVideoSrc || "").startsWith("docs/")) {
      delete cloudImage.previewVideoSrc;
    }
  }

  return cloudProject;
}

async function flushCloudProjectSync() {
  if (!cloudIsReady() || cloudState.loadingWorkspace || cloudState.syncingProjects) return;
  const projects = Array.from(cloudState.pendingProjects.values());
  if (!projects.length) return;
  cloudState.pendingProjects.clear();
  cloudState.syncingProjects = true;
  if (els.accountSyncStatus) els.accountSyncStatus.textContent = "正在同步图文和素材…";
  try {
    const prepared = [];
    for (const project of projects) prepared.push(await prepareProjectForCloud(project));
    await cloudApi().upsertProjects(prepared);
    saveProjectStore();
    if (els.accountSyncStatus) els.accountSyncStatus.textContent = `刚刚已同步 ${prepared.length} 条更新`;
  } catch (error) {
    console.error(error);
    projects.forEach((project) => cloudState.pendingProjects.set(project.id, project));
    if (els.accountSyncStatus) els.accountSyncStatus.textContent = "同步失败，将在下次修改时重试";
    els.status.textContent = error?.message || "云端同步失败，本机草稿仍已保存";
  } finally {
    cloudState.syncingProjects = false;
  }
}

function scheduleCloudProfileSync(options = {}) {
  if (!cloudIsReady() || cloudState.loadingWorkspace) return;
  cloudState.pendingAvatarUpload ||= Boolean(options.uploadAvatar);
  window.clearTimeout(cloudState.profileTimer);
  cloudState.profileTimer = window.setTimeout(() => void flushCloudProfileSync(), 700);
}

async function flushCloudProfileSync() {
  if (!cloudIsReady() || cloudState.loadingWorkspace) return;
  const shouldUploadAvatar = cloudState.pendingAvatarUpload;
  cloudState.pendingAvatarUpload = false;
  try {
    let avatarUrl = cloudState.profileAvatarUrl || (String(state.avatar).startsWith("http") ? state.avatar : "");
    if (shouldUploadAvatar) {
      await updateAvatarPreview();
      const renderedAvatar = els.avatarPreview?.src || state.avatar;
      if (renderedAvatar) avatarUrl = await cloudApi().uploadAvatar(renderedAvatar);
      cloudState.profileAvatarUrl = avatarUrl;
    }
    const profile = await cloudApi().upsertProfile({
      displayName: els.displayName.value.trim() || "未命名作者",
      handle: normalizeHandle(els.handle.value),
      avatarUrl: avatarUrl || undefined,
      avatarCrop: avatarUrl ? null : state.avatarCrop,
    });
    cloudState.profileAvatarUrl = profile.avatar_url || avatarUrl || "";
    updateAccountUi();
  } catch (error) {
    console.error(error);
    cloudState.pendingAvatarUpload ||= shouldUploadAvatar;
    els.status.textContent = error?.message || "账号资料同步失败，本机资料仍已保存";
  }
}

async function importLocalProjectsToAccount() {
  if (!cloudIsReady() || !cloudState.localImportProjects.length) return;
  setAccountBusy(true);
  els.accountSyncStatus.textContent = `正在导入 ${cloudState.localImportProjects.length} 条游客 / 本机草稿…`;
  try {
    const prepared = [];
    for (const project of cloudState.localImportProjects) prepared.push(await prepareProjectForCloud(project));
    await cloudApi().upsertProjects(prepared);
    cloudState.localImportProjects = [];
    await loadCloudWorkspace(cloudState.session);
    setAccountNotice("游客 / 本机草稿已复制到当前账号，原数据仍然保留。", "success");
  } catch (error) {
    console.error(error);
    setAccountNotice(error?.message || "本机草稿导入失败。", "error");
  } finally {
    setAccountBusy(false);
    updateAccountUi();
  }
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
  if (!Number.isFinite(Number(data.fontSize)) || Math.abs(Number(data.fontSize) - 31) < 0.001) {
    data.fontSize = String(DEFAULT_CARD_FONT_SIZE);
  }
  if (!Number.isFinite(Number(data.lineHeight)) || Math.abs(Number(data.lineHeight) - 1.65) < 0.001) {
    data.lineHeight = String(DEFAULT_CARD_LINE_HEIGHT);
  }
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
  Object.entries(nextImages).forEach(([id, image]) => {
    if (!image || typeof image !== "object" || image.kind !== "live") return;
    nextImages[id] = {
      ...image,
      kind: "live",
      videoKey: String(image.videoKey || id),
      liveSettings: normalizeLiveMediaSettings({
        ...(image.liveSettings || {}),
        aspect: image.liveSettings?.aspect ?? "0.75",
      }),
    };
  });
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
    const raw = storageForScope().getItem(scopedStorageKey(PROJECTS_STORAGE_KEY));
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

    const legacyRaw = activeStorageScope === "local" ? localStorage.getItem(STORAGE_KEY) : null;
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
  storageForScope().setItem(
    scopedStorageKey(PROJECTS_STORAGE_KEY),
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
  if (cloudIsReady() && activeStorageScope === accountScope(cloudState.user.id)) {
    void Promise.all([cloudApi().deleteProject(projectId), cloudApi().deleteProjectAssets(projectId)]).catch((error) => {
      console.error(error);
      els.status.textContent = "本机已删除；云端删除失败，请稍后重试";
    });
  }
  const liveKeys = Object.entries(project.data?.images || {})
    .filter(([, image]) => image?.kind === "live")
    .map(([id, image]) => String(image.videoKey || id));
  await Promise.all(
    liveKeys.map(async (key) => {
      const cached = liveMediaFiles.get(key);
      if (cached?.url) URL.revokeObjectURL(cached.url);
      liveMediaFiles.delete(key);
      try {
        await deleteLiveMediaBlob(key);
      } catch {
        // The project can still be deleted when browser media cleanup is unavailable.
      }
    }),
  );
  const deletingCurrent = project.id === state.currentProjectId;
  state.projects = state.projects.filter((item) => item.id !== project.id);

  if (!state.projects.length) {
    const guideProject = findHistoryProject(GUIDE_CARDS_PROJECT_ID);
    state.currentProjectId = GUIDE_CARDS_PROJECT_ID;
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
  applyForm(project.data);
  syncGuideReadOnlyMode();
  resetTextHistory();
  updateProjectHistory();
  await render();
  els.status.textContent = "已新建图文，上一条已保存在历史记录";
}

const FIRST_RUN_ONBOARDING_STEPS = [
  {
    target: "#newProjectBtn",
    title: "先创建自己的内容",
    body: "左侧两个内容是示例模板。点击这里，新建你的图文卡片或公众号长文。",
  },
  {
    target: "#appModeSwitch",
    title: "选择发布形式",
    body: "同一份内容可以在“图文卡片”和“长文”之间切换，不需要重新排版。",
  },
  {
    target: "#obsidianImportMenu",
    title: "连接并同步 Obsidian",
    body: "点击这里选择仓库。粘贴笔记时会自动读取图片；修改完成后还能同步回 Obsidian，无法直写时会下载 ZIP。",
  },
  {
    target: ".preview-topbar",
    title: "边写边预览，完成后导出",
    body: "在左侧编辑内容，右侧会实时生成效果。完成后点击这里下载图片或发布包。",
  },
];

const WHATS_NEW_ONBOARDING_STEPS = [
  {
    target: "#accountBtn",
    title: "账户同步",
    body: () => cloudState.user
      ? "你的账户同步已经开启。头像、昵称和图文草稿会按当前账号保存，换设备登录也能继续编辑。"
      : "需要长期保存时，可以随时登录并同步；继续使用游客模式，也不影响原来的排版和下载流程。",
    actionLabel: () => cloudState.user ? "查看同步状态" : "登录并同步",
    action: () => {
      if (cloudState.user) {
        openAccountMenu();
        return;
      }
      finishOnboarding({ remember: false });
      openAccountModal();
    },
  },
  {
    target: "#livePhotoToolbarBtn",
    title: "实况图片",
    body: "从这里选择视频、裁剪画面并插入图文。导出时会自动识别实况页，单张和批量都按对应格式处理。",
  },
  {
    target: ".preview-image-box",
    fallbackTarget: "#previewPanel",
    title: "拖动图片调整位置",
    body: "直接按住右侧预览中的图片，拖到蓝色落点线后松手。图片会移动到对应段落，左侧 Markdown 顺序也会同步更新。",
  },
  {
    target: "#obsidianImportMenu",
    title: "连接 Obsidian",
    body: "连接仓库后，可以读取笔记里的图片并同步修改后的 Markdown。暂不连接也不会影响普通编辑。",
  },
];

function onboardingSteps() {
  return onboardingMode === "whats-new" ? WHATS_NEW_ONBOARDING_STEPS : FIRST_RUN_ONBOARDING_STEPS;
}

function onboardingIsOpen() {
  return Boolean(els.onboardingTour && !els.onboardingTour.classList.contains("hidden"));
}

function onboardingShouldStart() {
  try {
    return firstRunTourIsForced() || (!state.projects.length && localStorage.getItem(ONBOARDING_STORAGE_KEY) !== "completed");
  } catch {
    return !state.projects.length;
  }
}

function positionOnboardingStep() {
  if (!onboardingIsOpen()) return;
  const step = onboardingSteps()[onboardingStepIndex];
  const target = step
    ? document.querySelector(step.target) || (step.fallbackTarget ? document.querySelector(step.fallbackTarget) : null)
    : null;
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const padding = 7;
  els.onboardingFocus.style.left = `${Math.max(4, rect.left - padding)}px`;
  els.onboardingFocus.style.top = `${Math.max(4, rect.top - padding)}px`;
  els.onboardingFocus.style.width = `${Math.min(window.innerWidth - 8, rect.width + padding * 2)}px`;
  els.onboardingFocus.style.height = `${Math.min(window.innerHeight - 8, rect.height + padding * 2)}px`;

  const tooltipRect = els.onboardingTooltip.getBoundingClientRect();
  const gap = 18;
  let placement = "bottom";
  let top = rect.bottom + gap;
  if (top + tooltipRect.height > window.innerHeight - 16) {
    placement = "top";
    top = rect.top - tooltipRect.height - gap;
  }
  top = clamp(top, 16, Math.max(16, window.innerHeight - tooltipRect.height - 16));
  const left = clamp(rect.left, 16, Math.max(16, window.innerWidth - tooltipRect.width - 16));
  els.onboardingTooltip.dataset.placement = placement;
  els.onboardingTooltip.style.left = `${left}px`;
  els.onboardingTooltip.style.top = `${top}px`;
  const arrow = els.onboardingTooltip.querySelector(".onboarding-arrow");
  if (arrow) arrow.style.left = `${clamp(rect.left + rect.width / 2 - left - 6, 18, tooltipRect.width - 30)}px`;
}

function showOnboardingStep(index) {
  const steps = onboardingSteps();
  onboardingStepIndex = clamp(index, 0, steps.length - 1);
  const step = steps[onboardingStepIndex];
  closeAccountMenu();
  document.body.classList.toggle("onboarding-account-step", onboardingMode === "whats-new" && step.target === "#accountBtn");
  els.onboardingTitle.textContent = step.title;
  els.onboardingBody.textContent = typeof step.body === "function" ? step.body() : step.body;
  els.onboardingProgress.textContent = `${onboardingStepIndex + 1} / ${steps.length}`;
  els.onboardingNext.textContent = onboardingStepIndex === steps.length - 1
    ? onboardingMode === "whats-new" ? "完成" : "开始使用"
    : "下一步";
  if (els.onboardingAction) {
    const actionLabel = typeof step.actionLabel === "function" ? step.actionLabel() : step.actionLabel;
    els.onboardingAction.hidden = !actionLabel;
    els.onboardingAction.textContent = actionLabel || "";
    els.onboardingAction.onclick = actionLabel && step.action ? step.action : null;
  }
  els.onboardingTour.classList.remove("hidden");
  window.requestAnimationFrame(positionOnboardingStep);
}

function finishOnboarding({ remember = true } = {}) {
  els.onboardingTour.classList.add("hidden");
  document.body.classList.remove("onboarding-account-step");
  closeAccountMenu();
  if (els.onboardingAction) {
    els.onboardingAction.hidden = true;
    els.onboardingAction.onclick = null;
  }
  if (!remember) return;
  try {
    if (onboardingMode === "whats-new") {
      storeExperienceVersion(WHATS_NEW_STORAGE_KEY);
      updateFeatureBadges();
    } else {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "completed");
    }
  } catch {
    // The guide still closes when storage is unavailable.
  }
}

async function advanceOnboarding() {
  const steps = onboardingSteps();
  if (onboardingMode === "first-run" && onboardingStepIndex === 0 && isBuiltInProjectId(state.currentProjectId)) {
    await createNewProject();
  }
  if (onboardingStepIndex >= steps.length - 1) {
    finishOnboarding();
    return;
  }
  showOnboardingStep(onboardingStepIndex + 1);
}

function maybeStartOnboarding() {
  if (!onboardingShouldStart()) return;
  onboardingMode = "first-run";
  showOnboardingStep(0);
}

function startWhatsNewTour() {
  storeExperienceVersion(WELCOME_BACK_STORAGE_KEY);
  els.welcomeBackModal?.classList.add("hidden");
  onboardingMode = "whats-new";
  showOnboardingStep(0);
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
  return insertAtRange(textarea, value, textarea.selectionStart, textarea.selectionEnd, selectOffset);
}

function insertAtRange(textarea, value, start, end = start, selectOffset = null) {
  commitTextHistory();
  const current = textarea.value;
  const safeStart = clamp(Number(start) || 0, 0, current.length);
  const safeEnd = clamp(Number(end) || safeStart, safeStart, current.length);
  textarea.value = `${current.slice(0, safeStart)}${value}${current.slice(safeEnd)}`;
  const cursor = selectOffset === null ? safeStart + value.length : safeStart + selectOffset;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
  commitTextHistory();
  requestRender();
  return cursor;
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

function openLiveMediaDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("当前浏览器不支持保存视频素材。"));
      return;
    }
    const request = window.indexedDB.open(LIVE_MEDIA_DB, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(LIVE_MEDIA_STORE)) {
        database.createObjectStore(LIVE_MEDIA_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("视频素材数据库无法打开。"));
  });
}

async function writeLiveMediaBlob(key, blob) {
  const database = await openLiveMediaDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(LIVE_MEDIA_STORE, "readwrite");
      transaction.objectStore(LIVE_MEDIA_STORE).put(blob, key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("视频素材保存失败。"));
      transaction.onabort = () => reject(transaction.error || new Error("视频素材保存已取消。"));
    });
  } finally {
    database.close();
  }
}

async function readLiveMediaBlob(key) {
  const database = await openLiveMediaDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(LIVE_MEDIA_STORE, "readonly");
      const request = transaction.objectStore(LIVE_MEDIA_STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("视频素材读取失败。"));
    });
  } finally {
    database.close();
  }
}

async function deleteLiveMediaBlob(key) {
  const database = await openLiveMediaDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(LIVE_MEDIA_STORE, "readwrite");
      transaction.objectStore(LIVE_MEDIA_STORE).delete(key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("视频素材删除失败。"));
    });
  } finally {
    database.close();
  }
}

function replaceLiveMediaCache(key, blob, name = "video.mov") {
  const previous = liveMediaFiles.get(key);
  if (previous?.url) URL.revokeObjectURL(previous.url);
  const url = URL.createObjectURL(blob);
  const cached = { blob, url, name: name || "video.mov", type: blob.type || "video/quicktime" };
  liveMediaFiles.set(key, cached);
  return cached;
}

async function hydrateLiveMediaForState() {
  const liveImages = Object.entries(state.images).filter(([, image]) => image?.kind === "live");
  await Promise.all(
    liveImages.map(async ([id, image]) => {
      if (image.previewVideoSrc) return;
      const key = String(image.videoKey || id);
      if (liveMediaFiles.has(key)) return;
      try {
        const blob = await readLiveMediaBlob(key);
        if (blob) replaceLiveMediaCache(key, blob, image.videoName || "video.mov");
      } catch {
        // Keep the saved cover visible. Export will explain that the source video is missing.
      }
    }),
  );
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeLiveMediaSettings(settings = {}) {
  const platform = settings.platform === "wechat" ? "wechat" : "xhs";
  const duration = platform === "wechat" ? 3 : 5;
  const allowedAspects = ["free", "original", "1", "1.333333", "1.777778", "0.75", "0.5625"];
  const aspect = allowedAspects.includes(String(settings.aspect)) ? String(settings.aspect) : "original";
  const rawCrop = settings.crop && typeof settings.crop === "object" ? settings.crop : null;
  const crop = rawCrop
    ? {
        x: clamp(finiteNumber(rawCrop.x, 0), 0, 1),
        y: clamp(finiteNumber(rawCrop.y, 0), 0, 1),
        width: clamp(finiteNumber(rawCrop.width, 1), 0.01, 1),
        height: clamp(finiteNumber(rawCrop.height, 1), 0.01, 1),
      }
    : null;
  if (crop) {
    crop.width = Math.min(crop.width, 1 - crop.x);
    crop.height = Math.min(crop.height, 1 - crop.y);
  }
  return {
    platform,
    aspect,
    customAspect: clamp(finiteNumber(settings.customAspect, 0.75), 0.4, 2.5),
    start: clamp(finiteNumber(settings.start, 0), 0, 1800),
    coverOffset: clamp(finiteNumber(settings.coverOffset, 0.2), 0, duration - 0.05),
    focusX: clamp(finiteNumber(settings.focusX, 50), 0, 100),
    focusY: clamp(finiteNumber(settings.focusY, 50), 0, 100),
    crop,
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    try {
      const sourceUrl = new URL(String(src || ""), window.location.href);
      if (["http:", "https:"].includes(sourceUrl.protocol) && sourceUrl.origin !== window.location.origin) {
        img.crossOrigin = "anonymous";
        img.referrerPolicy = "no-referrer";
      }
    } catch {
      // data:、blob: 和内置 SVG 不需要跨域设置。
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片无法以可导出的方式加载。"));
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
      vaultPath: sourcePaths?.get(file) || null,
      crop: null,
      layout: defaultNewImageLayout(),
    };
    ids.push(id);
    tags.push(`[[image:${id}]]`);
  }

  return { ids, tags, skipped: Array.from(files || []).length - imageFiles.length };
}

function insertImageTagsAtCursor(tags, cursor = els.content.selectionStart) {
  if (!tags.length) return;
  insertAtRange(els.content, `\n${tags.join("\n\n")}\n`, cursor, cursor);
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
  els.obsidianImportMenu?.classList.toggle("is-vault-connected", hasConnectedObsidianVault());
  els.connectObsidianVault.innerHTML = connected
    ? '<i data-lucide="folder-cog"></i> 更换仓库'
    : '<i data-lucide="folder-open"></i> 连接仓库';
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
    const readPermission = await handle.queryPermission({ mode: "read" });
    let writePermission = "prompt";
    try {
      writePermission = await handle.queryPermission({ mode: "readwrite" });
    } catch {
      // Some browsers can read a saved directory handle but do not expose write permission queries.
    }
    obsidianVault.writable = writePermission === "granted";
    setObsidianVaultStatus(readPermission === "granted" ? `已连接：${handle.name}` : `已记住：${handle.name}（首次使用时确认权限）`, readPermission === "granted");
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
    obsidianVault.writable = false;
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
  obsidianVault.writable = false;
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

async function ensureObsidianVaultWritePermission() {
  if (!obsidianVault.handle) return false;
  try {
    let permission = await obsidianVault.handle.queryPermission({ mode: "readwrite" });
    if (permission !== "granted") permission = await obsidianVault.handle.requestPermission({ mode: "readwrite" });
    obsidianVault.writable = permission === "granted";
    setObsidianVaultStatus(
      obsidianVault.writable ? `已连接：${obsidianVault.handle.name}` : `仓库只读：${obsidianVault.handle.name}`,
      true,
    );
    return obsidianVault.writable;
  } catch {
    obsidianVault.writable = false;
    return false;
  }
}

function normalizeObsidianNotePath(value) {
  const path = String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
  if (!path) return null;
  return path.toLowerCase().endsWith(".md") ? path : `${path}.md`;
}

function safeObsidianFileName(value, fallback = "未命名笔记") {
  const name = String(value || "")
    .replace(/[\\/:*?"<>|\r\n]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim();
  return (name || fallback).slice(0, 80);
}

function currentObsidianNotePath() {
  if (state.obsidianNotePath) return state.obsidianNotePath;
  const title = projectTitleFromData(readForm());
  return `写了就发/${safeObsidianFileName(title)}.md`;
}

function imageExtensionFromSource(image, blob) {
  const nameMatch = String(image?.name || "").match(/\.(avif|bmp|gif|heic|jpe?g|png|svg|webp)$/i);
  if (nameMatch) return `.${nameMatch[1].toLowerCase().replace("jpeg", "jpg")}`;
  const mimeExtensions = {
    "image/avif": ".avif",
    "image/bmp": ".bmp",
    "image/gif": ".gif",
    "image/heic": ".heic",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
  };
  return mimeExtensions[blob?.type] || ".png";
}

async function imageBlobForObsidian(image) {
  const response = await fetch(image.src);
  if (!response.ok) throw new Error("图片读取失败");
  return response.blob();
}

async function buildObsidianExport() {
  const content = String(els.content.value || "");
  const imageIds = Array.from(content.matchAll(/\[\[image:([^\]\n]+)\]\]/g), (match) => match[1]);
  const references = new Map();
  const attachments = [];

  for (const imageId of new Set(imageIds)) {
    const image = state.images[imageId];
    if (!image) continue;
    if (image.vaultPath) {
      references.set(imageId, `![[${String(image.vaultPath).replace(/\\/g, "/")}]]`);
      continue;
    }
    const blob = await imageBlobForObsidian(image);
    const extension = imageExtensionFromSource(image, blob);
    const originalBase = String(image.name || "图片").replace(/\.[^.]+$/, "");
    const stableSuffix = imageId.replace(/[^a-z0-9_-]/gi, "").slice(-8) || "image";
    const fileName = `${safeObsidianFileName(originalBase, "图片")}-${stableSuffix}${extension}`;
    const path = `写了就发/附件/${fileName}`;
    attachments.push({ path, fileName, blob });
    references.set(imageId, `![[${path}]]`);
  }

  const markdown = content.replace(/\[\[image:([^\]\n]+)\]\]/g, (whole, imageId) => {
    return references.get(imageId) || `<!-- 缺失图片：${imageId} -->`;
  });

  return {
    markdown,
    notePath: currentObsidianNotePath(),
    attachments,
  };
}

async function getOrCreateVaultDirectory(root, parts) {
  let directory = root;
  for (const part of parts) directory = await directory.getDirectoryHandle(part, { create: true });
  return directory;
}

async function writeVaultFile(root, path, content) {
  const parts = String(path).split("/").filter(Boolean);
  const fileName = parts.pop();
  const directory = await getOrCreateVaultDirectory(root, parts);
  const fileHandle = await directory.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function writeObsidianExportToVault(exportData) {
  for (const attachment of exportData.attachments) {
    await writeVaultFile(obsidianVault.handle, attachment.path, attachment.blob);
  }
  await writeVaultFile(obsidianVault.handle, exportData.notePath, exportData.markdown);
}

async function downloadObsidianExportPackage(exportData) {
  if (!window.JSZip) throw new Error("ZIP 组件未加载");
  const zip = new window.JSZip();
  zip.file(exportData.notePath, exportData.markdown);
  exportData.attachments.forEach((attachment) => zip.file(attachment.path, attachment.blob));
  const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
  const title = exportData.notePath.split("/").pop().replace(/\.md$/i, "");
  await saveBlob(blob, `${safeObsidianFileName(title)}-Obsidian.zip`);
}

async function syncCurrentNoteToObsidian() {
  if (obsidianVault.syncing) return;
  if (!hasConnectedObsidianVault()) {
    els.obsidianImportMenu.open = true;
    els.status.textContent = "请先连接 Obsidian 仓库";
    requestAnimationFrame(() => positionToolPopover(els.obsidianImportMenu));
    return;
  }

  obsidianVault.syncing = true;
  els.syncObsidianVault.disabled = true;
  els.status.textContent = "正在确认 Obsidian 写入权限…";
  try {
    const canWriteToVault = Boolean(
      obsidianVault.handle && (obsidianVault.writable || (await ensureObsidianVaultWritePermission())),
    );
    els.status.textContent = "正在整理 Markdown 和图片…";
    const exportData = await buildObsidianExport();
    if (canWriteToVault) {
      await writeObsidianExportToVault(exportData);
      state.obsidianNotePath = exportData.notePath;
      saveState();
      els.status.textContent = `已同步到 Obsidian：${exportData.notePath}`;
      closeObsidianImportMenu();
      return;
    }

    await downloadObsidianExportPackage(exportData);
    els.status.textContent = "当前浏览器只有仓库读取权限，已下载 Obsidian 导入包，未直接写入仓库";
  } catch (error) {
    console.error(error);
    els.status.textContent = "同步失败：没有写入仓库，请检查权限后重试";
  } finally {
    obsidianVault.syncing = false;
    els.syncObsidianVault.disabled = false;
  }
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

function insertPastedMarkdown(markdown, cursor) {
  insertAtRange(els.content, markdown, cursor, cursor);
  updateImageList();
}

async function importMarkdownFromConnectedVault(markdown, cursor) {
  if (!hasConnectedObsidianVault() || obsidianVault.importing) return false;
  obsidianVault.importing = true;
  els.status.textContent = "正在从 Obsidian 仓库读取图片…";
  try {
    if (!(await ensureObsidianVaultPermission())) {
      insertPastedMarkdown(markdown, cursor);
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
      insertPastedMarkdown(markdown, cursor);
      els.obsidianImportMenu.open = true;
      els.status.textContent = message;
      return true;
    }
    const imported = await addImageFiles(files, sourcePaths);
    const converted = convertObsidianImageReferences(markdown, state.images);
    if (converted.unresolved.length) {
      insertPastedMarkdown(markdown, cursor);
      els.status.textContent = "发现重名图片，暂时无法自动判断该用哪一张。";
      return true;
    }
    insertPastedMarkdown(converted.content, cursor);
    els.status.textContent = `已从仓库自动读取 ${imported.ids.length} 张图片并插入光标位置`;
    closeObsidianImportMenu();
    return true;
  } catch (error) {
    console.error(error);
    insertPastedMarkdown(markdown, cursor);
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
  const cursor = event.currentTarget.selectionStart;
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
      await importMarkdownFromConnectedVault(markdown, cursor);
      return;
    }
    insertPastedMarkdown(markdown, cursor);
    els.obsidianImportMenu.open = true;
    els.status.textContent = `已插入 ${references} 个图片引用；连接 Obsidian 仓库后可自动读取原图。`;
    requestAnimationFrame(() => positionToolPopover(els.obsidianImportMenu));
    return;
  }
  event.preventDefault();
  const imported = await addImageFiles(files);
  insertImageTagsAtCursor(imported.tags, cursor);
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
    row.classList.toggle("is-live", image.kind === "live");

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
    const liveLabel = image.kind === "live"
      ? `${image.liveSettings?.platform === "wechat" ? "公众号 3 秒" : "小红书 5 秒"} · ${livePhotoAspectLabel(image)} · 实况`
      : image.crop
        ? "已裁剪"
        : "原图比例";
    status.textContent = `${liveLabel} · ${widthLabel}`;
    meta.append(name, status);

    const actions = document.createElement("div");
    actions.className = "image-row-actions";
    const cropButton = document.createElement("button");
    cropButton.type = "button";
    cropButton.title = image.kind === "live" ? "编辑实况" : "裁剪图片";
    cropButton.setAttribute("aria-label", `${image.kind === "live" ? "编辑实况" : "裁剪"} ${image.name || id}`);
    cropButton.innerHTML = `<i data-lucide="${image.kind === "live" ? "aperture" : "crop"}"></i>`;
    cropButton.addEventListener("click", () => image.kind === "live" ? openLivePhotoEditor(id) : openCropper("image", id));

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.title = "恢复原图";
    resetButton.setAttribute("aria-label", `恢复 ${image.name || id}`);
    resetButton.innerHTML = '<i data-lucide="rotate-ccw"></i>';
    resetButton.disabled = image.kind === "live" || !image.crop;
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
    scheduleCloudProfileSync({ uploadAvatar: true });
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
    scheduleCloudProfileSync({ uploadAvatar: true });
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
    const horizontalChange = Math.abs(width - startRect.width);
    const verticalChange = Math.abs(height - startRect.height) * aspect;
    if (horizontalChange >= verticalChange) height = width / aspect;
    else width = height * aspect;
  }

  if (aspect) {
    const maxWidth = Math.min(image.width, image.height * aspect);
    width = clamp(width, 20, maxWidth);
    height = width / aspect;
  } else {
    width = Math.min(width, image.width);
    height = Math.min(height, image.height);
  }
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
  let paragraphStart = null;
  let paragraphEnd = null;

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    blocks.push({ type: "p", lines: paragraphLines, sourceStart: paragraphStart, sourceEnd: paragraphEnd });
    paragraphLines = [];
    paragraphStart = null;
    paragraphEnd = null;
  };

  const appendParagraphLine = (tokens, index, line) => {
    if (!tokens.length) return;
    paragraphLines.push(tokens);
    if (paragraphStart === null) paragraphStart = lineOffsets[index];
    paragraphEnd = lineOffsets[index] + line.length;
  };

  const appendParagraphTokens = (tokens, index, line) => {
    let textTokens = [];
    for (const token of tokens) {
      if (token.type !== "image") {
        textTokens.push(token);
        continue;
      }
      appendParagraphLine(textTokens, index, line);
      flushParagraph();
      textTokens = [];
      if (images[token.imageId]) {
        blocks.push({
          type: "image",
          id: token.imageId,
          sourceStart: token.sourceStart,
          sourceEnd: token.sourceEnd,
        });
      }
    }
    appendParagraphLine(textTokens, index, line);
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
        if (imageId) {
          blocks.push({
            type: "image",
            id: imageId,
            sourceStart: lineOffsets[index],
            sourceEnd: lineOffsets[index] + line.length,
          });
        }
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
        const finalRowIndex = Math.max(index + 1, rowIndex - 1);
        blocks.push({
          type: "table",
          header: headerCells.map((cell) => parseInline(cell)),
          rows,
          sourceStart: lineOffsets[index],
          sourceEnd: lineOffsets[finalRowIndex] + lines[finalRowIndex].length,
        });
        index = rowIndex - 1;
      } else {
        const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
          flushParagraph();
          const level = heading[1].length;
          const contentStart = trimmedStart + heading[1].length + 1;
          blocks.push({
            type: level === 1 ? "h1" : level === 2 ? "h2" : "h3",
            tokens: parseInline(heading[2].trim(), contentStart),
            sourceStart: lineOffsets[index],
            sourceEnd: lineOffsets[index] + line.length,
          });
        } else if (trimmed.startsWith("> ")) {
          flushParagraph();
          const contentStart = trimmedStart + 2 + countLeadingSpaces(trimmed.slice(2));
          blocks.push({
            type: "quote",
            tokens: parseInline(trimmed.slice(2).trim(), contentStart),
            sourceStart: lineOffsets[index],
            sourceEnd: lineOffsets[index] + line.length,
          });
        } else if (/^([-*+]\s+|\d+[.)]\s+)/.test(trimmed)) {
          const text = trimmed.replace(/^([-*+]\s+|\d+[.)]\s+)/, "• ");
          appendParagraphTokens(parseInline(text, trimmedStart), index, line);
        } else if (/^([-*_])(?:\s*\1){2,}\s*$/.test(trimmed)) {
          flushParagraph();
          blocks.push({ type: "spacer", sourceStart: lineOffsets[index], sourceEnd: lineOffsets[index] + line.length });
        } else {
          appendParagraphTokens(parseInline(trimmed, trimmedStart), index, line);
        }
      }
    } else {
      flushParagraph();
      if (hasContentBeforeLine) {
        blocks.push({ type: "spacer", sourceStart: lineOffsets[index], sourceEnd: lineOffsets[index] });
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
    const imageMatch = text.slice(i).match(/^\[\[image:([\w-]+)\]\]/);
    if (imageMatch) {
      tokens.push({
        type: "image",
        imageId: imageMatch[1],
        sourceStart: baseStart + i,
        sourceEnd: baseStart + i + imageMatch[0].length,
      });
      i += imageMatch[0].length;
      continue;
    }

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

    const nextMarkers = ["[[image:", "{{color:", "{{bg:", "**", "*"]
      .map((marker) => text.indexOf(marker, i + 1))
      .filter((index) => index !== -1);
    const next = nextMarkers.length ? Math.min(...nextMarkers) : text.length;
    tokens.push({ text: text.slice(i, next), sourceStart: baseStart + i, sourceEnd: baseStart + next });
    i = next;
  }

  return tokens.filter((token) => token.type === "image" || token.text?.length > 0);
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
      weight: CARD_BODY_FONT_WEIGHT,
      strokeWidth: CARD_BODY_STROKE_WIDTH,
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
    weight: CARD_BODY_FONT_WEIGHT,
    strokeWidth: CARD_BODY_STROKE_WIDTH,
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
      page.items.push({ type: "table", x: page.bounds.left, y, width: contentWidth, table, sourceStart: block.sourceStart, sourceEnd: block.sourceEnd });
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
        sourceStart: block.sourceStart,
        sourceEnd: block.sourceEnd,
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
        sourceStart: line.find((token) => Number.isFinite(token.sourceStart))?.sourceStart ?? block.sourceStart,
        sourceEnd: [...line].reverse().find((token) => Number.isFinite(token.sourceEnd))?.sourceEnd ?? block.sourceEnd,
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

function renderPage(page, index, total) {
  const legacyCanvas = document.createElement("canvas");
  legacyCanvas.width = CANVAS_WIDTH;
  legacyCanvas.height = CANVAS_HEIGHT;
  const legacyContext = legacyCanvas.getContext("2d");
  legacyContext.imageSmoothingQuality = "high";
  drawPageToContext(legacyContext, page);

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_CANVAS_WIDTH;
  canvas.height = OUTPUT_CANVAS_HEIGHT;
  canvas.dataset.page = String(index + 1);
  canvas._page = page;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(legacyCanvas, 0, 0, OUTPUT_CANVAS_WIDTH, OUTPUT_CANVAS_HEIGHT);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.setTransform(CANVAS_RENDER_SCALE, 0, 0, CANVAS_RENDER_SCALE, 0, 0);
  drawPageMediaToContext(ctx, page);
  canvas._textHits = collectTextHits(ctx, page);
  canvas._imageHits = collectImageHits(page);
  canvas._imageDropTargets = collectImageDropTargets(page);
  return canvas;
}

function drawPageToContext(ctx, page) {
  drawBackground(ctx, page.settings);
  if (page.showHeader !== false) {
    drawHeader(ctx, page.settings, page.avatar, page.badge);
  }

  for (const item of page.items) {
    if (item.type === "image") drawImageBlock(ctx, item);
    if (item.type === "table") drawTableBlock(ctx, item, page.settings);
    if (item.type === "text") drawTextLine(ctx, item, page.settings);
  }
}

function drawPageMediaToContext(ctx, page) {
  if (page.showHeader !== false) {
    drawHeaderMedia(ctx, page.settings, page.avatar, page.badge);
  }
  for (const item of page.items) {
    if (item.type === "image") drawImageBlock(ctx, item);
  }
}

function collectTextHits(ctx, page) {
  const hits = [];

  for (const item of page.items) {
    if (item.type !== "text") continue;
    let cursor = item.x;

    for (const token of item.line) {
      const width = measureToken(ctx, token, item.style);
      if (!/^\s+$/.test(token.text) && Number.isFinite(token.sourceStart) && Number.isFinite(token.sourceEnd)) {
        hits.push({
          x: cursor,
          y: item.y,
          width,
          height: item.lineHeight,
          sourceStart: token.sourceStart,
          sourceEnd: token.sourceEnd,
        });
      }
      cursor += width;
    }
  }

  return hits;
}

function collectImageHits(page) {
  return page.items
    .filter((item) => item.type === "image" && item.imageId)
    .map((item) => ({
      imageId: item.imageId,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      baseWidth: item.baseWidth || item.width,
      maxWidth: item.maxWidth || CARD_CONTENT_WIDTH,
      resizeMaxWidth: item.resizeMaxWidth || item.baseWidth || item.width,
      sourceStart: item.sourceStart,
      sourceEnd: item.sourceEnd,
    }))
    .filter((hit) => hit.height > 0 && hit.width > 0);
}

function collectImageDropTargets(page) {
  return page.items
    .filter((item) => Number.isFinite(item.sourceStart) && Number.isFinite(item.sourceEnd))
    .map((item) => {
      const rawHeight = item.type === "table" ? item.table.height : item.type === "text" ? item.lineHeight : item.height;
      return {
        imageId: item.imageId || "",
        targetKind: item.type === "text" && item.blockType === "p" ? "text-line" : "block",
        y: item.y,
        height: rawHeight,
        sourceStart: item.sourceStart,
        sourceEnd: item.sourceEnd,
      };
    })
    .filter((target) => target.height > 0);
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

function drawHeaderMedia(ctx, settings, avatar, badge) {
  const x = 42;
  const y = 38;
  const size = 82;
  if (avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    drawSourceCoverImage(ctx, avatar, getImageSourceRect(avatar, settings.avatarCrop), x, y, size, size);
    ctx.restore();
  }
  if (badge) {
    const textX = 152;
    ctx.font = `650 30px ${fontFamilyForText(settings.displayName, settings)}`;
    const name = clampText(ctx, settings.displayName, 430);
    drawVerifiedBadge(ctx, badge, textX + ctx.measureText(name).width + 24, 59);
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
    const textColor = token.color || style.color;
    if (style.strokeWidth && !token.bold) {
      ctx.save();
      ctx.strokeStyle = textColor;
      ctx.lineWidth = style.strokeWidth;
      ctx.lineJoin = "round";
      ctx.strokeText(token.text, cursor, baseline);
      ctx.restore();
    }
    ctx.fillStyle = textColor;
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
  els.pages.innerHTML = "";
  els.pages.className = "pages article-mode";
  els.articleSettings.hidden = false;

  const article = document.createElement("article");
  article.className = `article-preview article-theme-${settings.articleTheme} article-font-${settings.articleFont} article-size-${settings.articleSize}`;
  article.style.setProperty("--article-accent", settings.articleColor);
  article.innerHTML = markdownToArticleHtml(settings.content, settings.images);
  hydrateArticleLiveMedia(article, settings.images);
  els.pages.append(article);

  const wordCount = settings.content.replace(/\s/g, "").length;
  els.pageCount.textContent = "长文";
  els.status.textContent = `已生成长文预览，约 ${wordCount} 字`;
  syncExportBusyState();
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
      if (image?.src && image.kind === "live") {
        html.push(
          `<figure class="article-live-figure" data-live-image-id="${escapeAttribute(imageId)}">` +
          `<div class="article-live-stage"><img src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.name || "实况图片")}" /></div>` +
          `</figure>`,
        );
      } else if (image?.src) {
        html.push(`<figure><img src="${escapeAttribute(image.src)}" alt="${escapeAttribute(image.name || "图片")}" /></figure>`);
      }
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

function createLivePreviewVideo(image, imageId, className) {
  const media = liveMediaFiles.get(String(image.videoKey || imageId));
  const videoSource = media?.url || image.previewVideoSrc;
  if (!videoSource) return null;
  const settings = normalizeLiveMediaSettings(image.liveSettings);
  const video = document.createElement("video");
  video.className = className;
  video.src = videoSource;
  video.muted = true;
  video.loop = false;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  if (settings.crop) {
    video.style.objectFit = "fill";
    video.style.width = `${100 / settings.crop.width}%`;
    video.style.height = `${100 / settings.crop.height}%`;
    video.style.left = `${(-settings.crop.x / settings.crop.width) * 100}%`;
    video.style.top = `${(-settings.crop.y / settings.crop.height) * 100}%`;
    video.style.right = "auto";
    video.style.bottom = "auto";
  } else {
    video.style.objectPosition = `${settings.focusX}% ${settings.focusY}%`;
  }
  video.addEventListener("loadedmetadata", () => {
    video.currentTime = Math.min(video.duration || settings.start, settings.start);
    video.play().catch(() => {});
  });
  video.addEventListener("timeupdate", () => {
    const duration = settings.platform === "wechat" ? 3 : 5;
    if (video.currentTime >= settings.start + duration) {
      video.currentTime = settings.start;
      video.play().catch(() => {});
    }
  });
  return video;
}

function hydrateArticleLiveMedia(article, images) {
  article.querySelectorAll("[data-live-image-id]").forEach((figure) => {
    const imageId = figure.dataset.liveImageId;
    const image = images[imageId];
    const stage = figure.querySelector(".article-live-stage");
    if (!image || !stage) return;
    const video = createLivePreviewVideo(image, imageId, "article-live-video");
    if (!video) return;
    const badge = document.createElement("span");
    badge.className = "article-live-badge";
    badge.innerHTML = '<i data-lucide="aperture"></i>LIVE';
    stage.append(video, badge);
  });
}

const WECHAT_STYLE_PROPERTIES = [
  "background-color",
  "border",
  "border-bottom",
  "border-left",
  "border-radius",
  "border-right",
  "border-top",
  "border-collapse",
  "box-decoration-break",
  "color",
  "display",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "letter-spacing",
  "line-height",
  "list-style-position",
  "list-style-type",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-width",
  "overflow-wrap",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "text-align",
  "text-decoration",
  "vertical-align",
  "white-space",
  "word-break",
];

function copyComputedWechatStyles(source, target) {
  const computed = window.getComputedStyle(source);
  const styles = WECHAT_STYLE_PROPERTIES.map((property) => {
    const value = computed.getPropertyValue(property);
    return value ? `${property}:${value}` : "";
  }).filter(Boolean);
  if (source.tagName === "IMG") {
    styles.push("display:block", "max-width:100%", "height:auto");
    target.removeAttribute("width");
    target.removeAttribute("height");
  }
  if (source.tagName === "H1") {
    styles.push(`border-bottom:2px solid ${readForm().articleColor}`);
  }
  target.setAttribute("style", styles.join(";"));
  target.removeAttribute("class");
  target.removeAttribute("id");
  for (const attribute of Array.from(target.attributes)) {
    if (attribute.name.startsWith("data-")) target.removeAttribute(attribute.name);
  }
}

function serializeArticleForWechat() {
  let article = els.pages.querySelector(".article-preview");
  if (!article || state.appMode !== "article") {
    state.appMode = "article";
    updateAppMode();
    renderArticlePreview(readForm());
    article = els.pages.querySelector(".article-preview");
  }
  if (!article || !readForm().content.trim()) {
    throw new Error("长文内容为空，请先输入正文。");
  }

  const clone = article.cloneNode(true);
  const sourceNodes = [article, ...article.querySelectorAll("*")];
  const cloneNodes = [clone, ...clone.querySelectorAll("*")];
  sourceNodes.forEach((source, index) => copyComputedWechatStyles(source, cloneNodes[index]));
  sourceNodes.forEach((source, index) => {
    if (source.matches?.("video, .article-live-badge")) cloneNodes[index]?.remove();
  });
  clone.querySelectorAll("[data-live-image-id]").forEach((node) => node.removeAttribute("data-live-image-id"));

  const section = document.createElement("section");
  const articleStyle = window.getComputedStyle(article);
  section.setAttribute(
    "style",
    [
      "margin:0 auto",
      "padding:0",
      `color:${articleStyle.color}`,
      `background-color:${articleStyle.backgroundColor}`,
      `font-family:${articleStyle.fontFamily}`,
      `font-size:${articleStyle.fontSize}`,
      `line-height:${articleStyle.lineHeight}`,
      `letter-spacing:${articleStyle.letterSpacing}`,
      "max-width:100%",
      "overflow-wrap:break-word",
    ].join(";"),
  );
  while (clone.firstChild) section.append(clone.firstChild);
  return {
    html: section.outerHTML,
    text: article.innerText.trim(),
    article,
  };
}

async function writeRichClipboard(html, text) {
  if (navigator.clipboard?.write && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch {}
  }

  const holder = document.createElement("div");
  holder.contentEditable = "true";
  holder.style.position = "fixed";
  holder.style.left = "-10000px";
  holder.innerHTML = html;
  document.body.append(holder);
  const range = document.createRange();
  range.selectNodeContents(holder);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  const copied = document.execCommand("copy");
  selection.removeAllRanges();
  holder.remove();
  if (!copied) throw new Error("浏览器没有允许复制。");
}

async function copyArticleToWechat() {
  try {
    const serialized = serializeArticleForWechat();
    await writeRichClipboard(serialized.html, serialized.text);
    els.status.textContent = "已复制公众号富文本，可直接粘贴到公众号编辑器";
  } catch (error) {
    els.status.textContent = error?.message || "复制失败，请允许浏览器访问剪贴板。";
  }
}

function wechatTitleFromContent() {
  const line = String(els.content.value || "")
    .split("\n")
    .map((value) => value.trim())
    .find((value) => value && !isMarkdownImageBlock(value));
  const cleaned = String(line || "未命名长文")
    .replace(/^#{1,6}\s+/, "")
    .replace(/\{\{(?:color|bg):#[0-9a-fA-F]{6}\|([^}]+)\}\}/g, "$1")
    .replace(/[*_`>]/g, "")
    .trim();
  return cleaned.slice(0, 64) || "未命名长文";
}

function isWechatDataImage(source) {
  return /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(String(source || ""));
}

function setWechatCover(source = "", label = "") {
  wechatCoverData = isWechatDataImage(source) ? source : "";
  els.wechatCoverPreview.innerHTML = "";
  if (wechatCoverData) {
    const image = document.createElement("img");
    image.src = wechatCoverData;
    image.alt = "公众号封面预览";
    els.wechatCoverPreview.append(image);
    els.wechatCoverHint.textContent = label || "已选择封面，同步时会保留原图数据。";
  } else {
    els.wechatCoverPreview.innerHTML = '<i data-lucide="image"></i><span>请选择封面</span>';
    els.wechatCoverHint.textContent = "正文没有可用图片，请单独上传一张封面。";
  }
  updateWechatConfirmState();
  if (window.lucide) window.lucide.createIcons();
}

function setWechatServiceMessage(message, type = "") {
  els.wechatServiceStatus.classList.toggle("ready", type === "ready");
  els.wechatServiceStatus.classList.toggle("error", type === "error");
  els.wechatServiceStatus.textContent = message;
}

function updateWechatConfirmState() {
  const complete = wechatServiceReady && Boolean(els.wechatTitle.value.trim()) && Boolean(wechatCoverData) && !wechatSyncing;
  els.wechatConfirm.disabled = !complete;
}

async function checkWechatService() {
  wechatServiceReady = false;
  setWechatServiceMessage("正在检查本机公众号同步服务…");
  updateWechatConfirmState();
  if (!/^https?:$/.test(window.location.protocol)) {
    setWechatServiceMessage("请用 npm start 打开本地版，直接打开 HTML 无法访问安全同步服务。", "error");
    return;
  }
  try {
    const response = await fetch("/api/wechat/status", { cache: "no-store" });
    if (!response.ok) throw new Error("服务不可用");
    const status = await response.json();
    wechatServiceReady = Boolean(status.ready);
    if (wechatServiceReady) {
      setWechatServiceMessage("本机同步服务已就绪。App Secret 仅保存在系统钥匙串中。", "ready");
    } else {
      setWechatServiceMessage(status.error || "本机公众号配置不完整，请检查 AppID、钥匙串和同步服务。", "error");
    }
  } catch {
    setWechatServiceMessage("当前页面未连接本机同步服务，请在项目目录执行 npm start 后重试。", "error");
  }
  updateWechatConfirmState();
}

async function openWechatModal() {
  let serialized;
  try {
    serialized = serializeArticleForWechat();
  } catch (error) {
    els.status.textContent = error?.message || "长文内容无法同步。";
    return;
  }
  els.wechatTitle.value = wechatTitleFromContent();
  els.wechatAuthor.value = "";
  els.wechatCover.value = "";
  const firstImage = serialized.article.querySelector("img[src]");
  setWechatCover(firstImage?.getAttribute("src") || "", firstImage ? "已默认使用正文第一张图片。" : "");
  els.wechatModal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
  await checkWechatService();
  els.wechatTitle.focus();
  els.wechatTitle.select();
}

function closeWechatModal() {
  if (wechatSyncing) return;
  els.wechatModal.classList.add("hidden");
}

async function handleWechatCover(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!/^image\/(?:png|jpeg|webp|gif)$/i.test(file.type)) {
    setWechatServiceMessage("封面请使用 PNG、JPG、WebP 或 GIF。", "error");
    event.target.value = "";
    return;
  }
  const source = await readFileAsDataURL(file);
  setWechatCover(source, `已选择 ${file.name}，保留原图数据。`);
}

async function syncArticleToWechatDraft() {
  if (wechatSyncing) return;
  let serialized;
  try {
    serialized = serializeArticleForWechat();
  } catch (error) {
    setWechatServiceMessage(error?.message || "长文内容无法同步。", "error");
    return;
  }
  if (!wechatServiceReady || !els.wechatTitle.value.trim() || !wechatCoverData) {
    setWechatServiceMessage("请确认本机服务、文章标题和封面都已准备好。", "error");
    return;
  }

  wechatSyncing = true;
  updateWechatConfirmState();
  setWechatServiceMessage("正在上传正文图片并创建公众号草稿，请不要关闭页面…");
  try {
    const response = await fetch("/api/wechat/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: els.wechatTitle.value.trim(),
        author: els.wechatAuthor.value.trim(),
        slug: state.currentProjectId || "write-then-publish",
        html: serialized.html,
        cover: wechatCoverData,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || "公众号草稿同步失败。");
    const statusLabel = {
      created: "已创建",
      updated: "已更新",
      recovered: "已恢复并更新",
      unchanged: "内容未变化",
    }[result.status] || "已同步";
    wechatSyncing = false;
    els.wechatModal.classList.add("hidden");
    els.status.textContent = `${statusLabel}公众号草稿：${result.title || els.wechatTitle.value.trim()}`;
  } catch (error) {
    wechatSyncing = false;
    setWechatServiceMessage(error?.message || "同步失败，未确认草稿写入。", "error");
    updateWechatConfirmState();
  }
}

function livePhotoDuration() {
  return livePhotoState.platform === "wechat" ? 3 : 5;
}

function livePhotoAspectRatio() {
  if (livePhotoState.aspect === "free") return clamp(finiteNumber(livePhotoState.customAspect, 0.75), 0.4, 2.5);
  if (livePhotoState.aspect === "original") {
    if (livePhotoState.sourceWidth > 0 && livePhotoState.sourceHeight > 0) {
      return livePhotoState.sourceWidth / livePhotoState.sourceHeight;
    }
    return 0.75;
  }
  return clamp(finiteNumber(livePhotoState.aspect, 0.75), 0.4, 2.5);
}

function fitLivePhotoCropToAspect(ratio, preserveSize = false) {
  const source = livePhotoSourceBounds();
  if (!source.width || !source.height) return;
  const current = clampCropRect(livePhotoState.crop, source);
  if (preserveSize) {
    livePhotoState.crop = fitRectToAspect(current, source, ratio);
    return;
  }

  const centerX = current.x + current.width / 2;
  const centerY = current.y + current.height / 2;
  const largest = fitRectToAspect(fullCropRect(source), source, ratio);
  livePhotoState.crop = {
    x: clamp(centerX - largest.width / 2, 0, source.width - largest.width),
    y: clamp(centerY - largest.height / 2, 0, source.height - largest.height),
    width: largest.width,
    height: largest.height,
  };
}

function setLivePhotoAspect(value, options = {}) {
  const allowed = ["free", "original", "1", "1.333333", "1.777778", "0.75", "0.5625"];
  livePhotoState.aspect = allowed.includes(String(value)) ? String(value) : "original";
  els.livePhotoRatioButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.liveRatio === livePhotoState.aspect);
  });
  const customRatioVisible = livePhotoState.aspect === "free";
  els.livePhotoCustomRatioRow.hidden = false;
  els.livePhotoCustomRatioRow.classList.toggle("is-visible", customRatioVisible);
  els.livePhotoCustomRatioRow.setAttribute("aria-hidden", customRatioVisible ? "false" : "true");
  const ratio = livePhotoAspectRatio();
  els.livePhotoCustomRatioOutput.value = ratio.toFixed(2);
  fitLivePhotoCropToAspect(ratio, Boolean(options.preserveCropSize));
  drawLivePhotoCropper();
}

function livePhotoAspectLabel(image) {
  const settings = normalizeLiveMediaSettings(image?.liveSettings);
  const labels = {
    original: "原视频",
    "1": "1:1",
    "1.333333": "4:3",
    "1.777778": "16:9",
    "0.75": "3:4",
    "0.5625": "9:16",
  };
  if (settings.aspect === "free") return `自由 ${settings.customAspect.toFixed(2)}`;
  return labels[settings.aspect] || "原视频";
}

function formatLivePhotoDuration(value) {
  const seconds = Math.max(0, Number(value) || 0);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return minutes ? `${minutes}:${remainder.toFixed(1).padStart(4, "0")}` : `${seconds.toFixed(1)} 秒`;
}

function formatLivePhotoFileSize(value) {
  const bytes = Math.max(0, Number(value) || 0);
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function setLivePhotoServiceMessage(message, type = "") {
  els.livePhotoServiceStatus.classList.toggle("ready", type === "ready");
  els.livePhotoServiceStatus.classList.toggle("error", type === "error");
  els.livePhotoServiceStatus.textContent = message;
}

function livePhotoSelectionIsValid() {
  if (!livePhotoState.file || !livePhotoState.sourceDuration) return false;
  const start = Number(els.livePhotoStart.value) || 0;
  return start >= 0 && start + livePhotoDuration() <= livePhotoState.sourceDuration + 0.03;
}

function updateLivePhotoGenerateState() {
  els.livePhotoGenerate.disabled = !livePhotoSelectionIsValid() || livePhotoState.generating;
}

function updateLivePhotoPreview() {
  drawLivePhotoCropper();
  updateLivePhotoGenerateState();
}

function livePhotoSourceBounds() {
  return { width: livePhotoState.sourceWidth, height: livePhotoState.sourceHeight };
}

function livePhotoCropFromNormalized(crop) {
  const source = livePhotoSourceBounds();
  if (!source.width || !source.height || !crop) return null;
  return clampCropRect(
    {
      x: crop.x * source.width,
      y: crop.y * source.height,
      width: crop.width * source.width,
      height: crop.height * source.height,
    },
    source,
  );
}

function normalizedLivePhotoCrop() {
  const source = livePhotoSourceBounds();
  const crop = livePhotoState.crop;
  if (!source.width || !source.height || !crop) return null;
  return {
    x: clamp(crop.x / source.width, 0, 1),
    y: clamp(crop.y / source.height, 0, 1),
    width: clamp(crop.width / source.width, 0.01, 1),
    height: clamp(crop.height / source.height, 0.01, 1),
  };
}

function getLivePhotoCropDisplay() {
  const canvas = els.livePhotoCropCanvas;
  const source = livePhotoSourceBounds();
  const padding = 28;
  const scale = Math.min((canvas.width - padding * 2) / source.width, (canvas.height - padding * 2) / source.height);
  const width = source.width * scale;
  const height = source.height * scale;
  return {
    x: (canvas.width - width) / 2,
    y: (canvas.height - height) / 2,
    width,
    height,
    scale,
  };
}

function livePhotoSourceToCanvasRect(rect) {
  const display = livePhotoState.cropDisplay;
  return {
    x: display.x + rect.x * display.scale,
    y: display.y + rect.y * display.scale,
    width: rect.width * display.scale,
    height: rect.height * display.scale,
  };
}

function livePhotoCanvasPoint(event) {
  const canvas = els.livePhotoCropCanvas;
  const bounds = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
    y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
  };
}

function livePhotoSourcePoint(point) {
  const source = livePhotoSourceBounds();
  const display = livePhotoState.cropDisplay;
  return {
    x: clamp((point.x - display.x) / display.scale, 0, source.width),
    y: clamp((point.y - display.y) / display.scale, 0, source.height),
  };
}

function drawLivePhotoCropper() {
  if (!els.livePhotoCropCanvas || !livePhotoState.sourceWidth || !livePhotoState.sourceHeight || !livePhotoState.crop) return;
  const canvas = els.livePhotoCropCanvas;
  const context = canvas.getContext("2d");
  livePhotoState.cropDisplay = getLivePhotoCropDisplay();
  const display = livePhotoState.cropDisplay;
  const crop = livePhotoSourceToCanvasRect(livePhotoState.crop);
  canvas.dataset.cropX = livePhotoState.crop.x.toFixed(3);
  canvas.dataset.cropY = livePhotoState.crop.y.toFixed(3);
  canvas.dataset.cropWidth = livePhotoState.crop.width.toFixed(3);
  canvas.dataset.cropHeight = livePhotoState.crop.height.toFixed(3);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#090d17";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (els.livePhotoVideo.readyState >= 2) {
    context.drawImage(els.livePhotoVideo, display.x, display.y, display.width, display.height);
  }
  context.fillStyle = "rgba(2, 6, 23, 0.62)";
  context.fillRect(display.x, display.y, display.width, Math.max(0, crop.y - display.y));
  context.fillRect(display.x, crop.y + crop.height, display.width, Math.max(0, display.y + display.height - crop.y - crop.height));
  context.fillRect(display.x, crop.y, Math.max(0, crop.x - display.x), crop.height);
  context.fillRect(crop.x + crop.width, crop.y, Math.max(0, display.x + display.width - crop.x - crop.width), crop.height);

  context.strokeStyle = "#fff";
  context.lineWidth = 3;
  context.strokeRect(crop.x, crop.y, crop.width, crop.height);
  context.strokeStyle = "rgba(255, 255, 255, 0.74)";
  context.lineWidth = 1;
  for (let i = 1; i < 3; i += 1) {
    context.beginPath();
    context.moveTo(crop.x + (crop.width * i) / 3, crop.y);
    context.lineTo(crop.x + (crop.width * i) / 3, crop.y + crop.height);
    context.moveTo(crop.x, crop.y + (crop.height * i) / 3);
    context.lineTo(crop.x + crop.width, crop.y + (crop.height * i) / 3);
    context.stroke();
  }
  context.fillStyle = "#fff";
  [[crop.x, crop.y], [crop.x + crop.width, crop.y], [crop.x, crop.y + crop.height], [crop.x + crop.width, crop.y + crop.height]].forEach(([x, y]) => {
    context.beginPath();
    context.arc(x, y, 11, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(23, 32, 47, 0.62)";
    context.lineWidth = 2;
    context.stroke();
  });
}

function animateLivePhotoCropper() {
  drawLivePhotoCropper();
  if (!els.livePhotoVideo.paused && !els.livePhotoVideo.ended) {
    livePhotoState.previewFrame = requestAnimationFrame(animateLivePhotoCropper);
  } else {
    livePhotoState.previewFrame = 0;
  }
}

function detectLivePhotoCropHit(point) {
  const crop = livePhotoSourceToCanvasRect(livePhotoState.crop);
  const corners = {
    nw: [crop.x, crop.y], ne: [crop.x + crop.width, crop.y],
    sw: [crop.x, crop.y + crop.height], se: [crop.x + crop.width, crop.y + crop.height],
  };
  for (const [handle, [x, y]] of Object.entries(corners)) {
    if (Math.hypot(point.x - x, point.y - y) <= 48) return handle;
  }
  if (point.x >= crop.x && point.x <= crop.x + crop.width && point.y >= crop.y && point.y <= crop.y + crop.height) return "move";
  return "move-new";
}

function startLivePhotoCropDrag(event) {
  if (!livePhotoState.crop || !livePhotoState.sourceWidth) return;
  livePhotoState.cropDisplay = getLivePhotoCropDisplay();
  const canvasPoint = livePhotoCanvasPoint(event);
  const display = livePhotoState.cropDisplay;
  if (canvasPoint.x < display.x || canvasPoint.x > display.x + display.width || canvasPoint.y < display.y || canvasPoint.y > display.y + display.height) return;
  event.preventDefault();
  const sourcePoint = livePhotoSourcePoint(canvasPoint);
  const source = livePhotoSourceBounds();
  let action = detectLivePhotoCropHit(canvasPoint);
  if (action === "move-new") {
    livePhotoState.crop = clampMovedRect({
      ...livePhotoState.crop,
      x: sourcePoint.x - livePhotoState.crop.width / 2,
      y: sourcePoint.y - livePhotoState.crop.height / 2,
    }, source);
    action = "move";
  }
  livePhotoState.cropDrag = {
    action,
    startX: sourcePoint.x,
    startY: sourcePoint.y,
    startRect: { ...livePhotoState.crop },
    pointerId: event.pointerId,
  };
  els.livePhotoCropCanvas.setPointerCapture?.(event.pointerId);
  drawLivePhotoCropper();
}

function moveLivePhotoCropDrag(event) {
  if (!livePhotoState.cropDrag) return;
  event.preventDefault();
  const point = livePhotoSourcePoint(livePhotoCanvasPoint(event));
  const drag = livePhotoState.cropDrag;
  const source = livePhotoSourceBounds();
  if (drag.action === "move") {
    livePhotoState.crop = clampMovedRect({
      ...drag.startRect,
      x: drag.startRect.x + point.x - drag.startX,
      y: drag.startRect.y + point.y - drag.startY,
    }, source);
  } else {
    livePhotoState.crop = resizeCropRect(drag.action, drag.startRect, point, source, livePhotoAspectRatio());
  }
  drawLivePhotoCropper();
}

function stopLivePhotoCropDrag(event) {
  if (!livePhotoState.cropDrag) return;
  els.livePhotoCropCanvas.releasePointerCapture?.(livePhotoState.cropDrag.pointerId);
  livePhotoState.cropDrag = null;
  drawLivePhotoCropper();
}

function seekLivePhotoPreview(toCover = false) {
  if (!livePhotoState.sourceDuration) return;
  const start = Math.max(0, Number(els.livePhotoStart.value) || 0);
  const offset = toCover ? Math.max(0, Number(els.livePhotoCover.value) || 0) : 0;
  els.livePhotoVideo.currentTime = Math.min(livePhotoState.sourceDuration, start + offset);
}

function normalizeLivePhotoTiming() {
  const target = livePhotoDuration();
  const availableStart = Math.max(0, livePhotoState.sourceDuration - target);
  const currentStart = Math.max(0, Number(els.livePhotoStart.value) || 0);
  const normalizedStart = Math.min(currentStart, availableStart);
  els.livePhotoStart.max = String(Math.max(0, availableStart).toFixed(1));
  els.livePhotoStart.value = String(Number(normalizedStart.toFixed(1)));
  const latestCover = Math.max(0, target - 0.05);
  els.livePhotoCover.max = String(latestCover);
  const cover = Math.min(latestCover, Math.max(0, finiteNumber(els.livePhotoCover.value, 0.2)));
  els.livePhotoCover.value = String(Number(cover.toFixed(1)));
  if (livePhotoState.file && livePhotoState.sourceDuration < target) {
    setLivePhotoServiceMessage(`当前视频只有 ${formatLivePhotoDuration(livePhotoState.sourceDuration)}，不足以生成 ${target} 秒版本。`, "error");
  } else if (livePhotoState.file) {
    setLivePhotoServiceMessage(
      needsLivePhotoStaticFallback()
        ? "设置会跟随视频插入图文；当前站点尚未连接云端实况服务。"
        : cloudLivePhotoAvailable() && !["localhost", "127.0.0.1"].includes(window.location.hostname)
          ? "设置会跟随视频插入图文；右侧下载时会安全上传原视频并由云端 Mac 生成实况。"
          : "设置会跟随视频插入图文；右侧下载时自动生成 Live Photo 发布包。",
      "ready",
    );
  }
  updateLivePhotoGenerateState();
}

function setLivePhotoPlatform(platform) {
  livePhotoState.platform = platform === "wechat" ? "wechat" : "xhs";
  els.livePhotoPlatformButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.livePlatform === livePhotoState.platform);
  });
  const duration = livePhotoDuration();
  els.livePhotoDurationHint.textContent = livePhotoState.platform === "wechat" ? "公众号版本固定生成 3 秒" : "小红书版本固定生成 5 秒";
  els.livePhotoCover.max = String(Math.max(0, duration - 0.05));
  normalizeLivePhotoTiming();
  seekLivePhotoPreview(true);
}

function releaseLivePhotoObjectUrl() {
  if (!livePhotoState.objectUrl) return;
  URL.revokeObjectURL(livePhotoState.objectUrl);
  livePhotoState.objectUrl = "";
}

function handleLivePhotoVideo(event) {
  const file = event.target.files?.[0] || null;
  if (!file) return;
  if (file.size > 350 * 1024 * 1024) {
    setLivePhotoServiceMessage("视频超过 350MB，请先裁短或压缩后再试。", "error");
    event.target.value = "";
    return;
  }
  if (!/^video\/(?:mp4|quicktime|webm)$/i.test(file.type) && !/\.(?:mp4|mov|webm)$/i.test(file.name)) {
    setLivePhotoServiceMessage("请选择 MP4、MOV 或 WebM 视频。", "error");
    event.target.value = "";
    return;
  }
  releaseLivePhotoObjectUrl();
  if (event.target === els.contentVideo) {
    livePhotoState.editingId = "";
    els.livePhotoGenerate.innerHTML = '<i data-lucide="image-plus"></i>插入图文';
    resetLivePhotoForm();
  }
  livePhotoState.file = file;
  livePhotoState.sourceDuration = 0;
  livePhotoState.sourceWidth = 0;
  livePhotoState.sourceHeight = 0;
  livePhotoState.objectUrl = URL.createObjectURL(file);
  els.livePhotoVideo.src = livePhotoState.objectUrl;
  els.livePhotoPreview.classList.add("has-video");
  els.livePhotoFileLabel.textContent = file.name;
  els.livePhotoVideoMeta.textContent = `${formatLivePhotoFileSize(file.size)} · 正在读取视频…`;
  updateLivePhotoGenerateState();
  els.livePhotoModal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
  els.livePhotoVideo.load();
}

function handleLivePhotoMetadata() {
  const duration = Number(els.livePhotoVideo.duration) || 0;
  if (!Number.isFinite(duration) || duration <= 0) {
    setLivePhotoServiceMessage("浏览器无法读取这个视频，请转换为 MP4 或 MOV 后再试。", "error");
    return;
  }
  livePhotoState.sourceDuration = duration;
  livePhotoState.sourceWidth = Number(els.livePhotoVideo.videoWidth) || 0;
  livePhotoState.sourceHeight = Number(els.livePhotoVideo.videoHeight) || 0;
  const source = livePhotoSourceBounds();
  livePhotoState.crop = livePhotoCropFromNormalized(livePhotoState.savedCrop) || fullCropRect(source);
  els.livePhotoVideoMeta.textContent = `${formatLivePhotoFileSize(livePhotoState.file?.size)} · ${formatLivePhotoDuration(duration)}`;
  normalizeLivePhotoTiming();
  setLivePhotoAspect(livePhotoState.aspect, { preserveCropSize: Boolean(livePhotoState.savedCrop) });
  seekLivePhotoPreview(false);
  els.livePhotoVideo.play().catch(() => drawLivePhotoCropper());
}

function keepLivePhotoPreviewInRange() {
  if (!livePhotoState.sourceDuration || els.livePhotoVideo.paused) return;
  const start = Math.max(0, Number(els.livePhotoStart.value) || 0);
  if (els.livePhotoVideo.currentTime >= start + livePhotoDuration()) {
    els.livePhotoVideo.currentTime = start;
    els.livePhotoVideo.play().catch(() => {});
  }
  drawLivePhotoCropper();
}

async function ensureLivePhotoServiceReady() {
  livePhotoState.localReady = false;
  livePhotoState.serviceMode = "none";
  if (!/^(?:https?:|file:)$/.test(window.location.protocol)) return false;
  try {
    const response = await fetch(livePhotoApiUrl("/api/live-photo/status"), { cache: "no-store" });
    if (response.ok) {
      const status = await response.json();
      livePhotoState.localReady = Boolean(status.ready);
      if (livePhotoState.localReady) {
        livePhotoState.serviceMode = "local";
        return true;
      }
    }
  } catch {
    livePhotoState.localReady = false;
  }
  if (cloudLivePhotoAvailable()) {
    livePhotoState.serviceMode = "cloud";
    return true;
  }
  return false;
}

function resetLivePhotoForm(settings = {}) {
  const normalized = normalizeLiveMediaSettings(settings);
  livePhotoState.savedCrop = normalized.crop;
  livePhotoState.crop = livePhotoCropFromNormalized(normalized.crop);
  livePhotoState.customAspect = normalized.customAspect;
  els.livePhotoCustomRatio.value = String(normalized.customAspect);
  els.livePhotoCustomRatioOutput.value = normalized.customAspect.toFixed(2);
  setLivePhotoPlatform(normalized.platform);
  setLivePhotoAspect(normalized.aspect, { preserveCropSize: Boolean(normalized.crop) });
  els.livePhotoStart.value = String(normalized.start);
  els.livePhotoCover.value = String(normalized.coverOffset);
  updateLivePhotoPreview();
}

async function openLivePhotoEditor(imageId) {
  const image = state.images[imageId];
  if (!image || image.kind !== "live") return;
  await hydrateLiveMediaForState();
  const media = liveMediaFiles.get(String(image.videoKey || imageId));
  if (!media?.blob) {
    els.status.textContent = "这张实况的原视频已经丢失，请重新上传视频。";
    return;
  }
  releaseLivePhotoObjectUrl();
  livePhotoState.editingId = imageId;
  livePhotoState.file = media.blob;
  livePhotoState.sourceDuration = Number(image.videoDuration) || 0;
  livePhotoState.sourceWidth = Number(image.videoWidth) || 0;
  livePhotoState.sourceHeight = Number(image.videoHeight) || 0;
  livePhotoState.objectUrl = URL.createObjectURL(media.blob);
  els.livePhotoFileLabel.textContent = image.videoName || media.name || "视频素材";
  els.livePhotoVideoMeta.textContent = `${formatLivePhotoFileSize(media.blob.size)} · ${formatLivePhotoDuration(livePhotoState.sourceDuration)}`;
  els.livePhotoVideo.src = livePhotoState.objectUrl;
  els.livePhotoPreview.classList.add("has-video");
  els.livePhotoGenerate.innerHTML = '<i data-lucide="check"></i>保存修改';
  resetLivePhotoForm(image.liveSettings);
  els.livePhotoModal.classList.remove("hidden");
  els.livePhotoVideo.load();
  if (window.lucide) window.lucide.createIcons();
}

function closeLivePhotoModal() {
  if (livePhotoState.generating) return;
  els.livePhotoVideo.pause();
  els.livePhotoModal.classList.add("hidden");
  releaseLivePhotoObjectUrl();
  livePhotoState.file = null;
  livePhotoState.sourceDuration = 0;
  livePhotoState.sourceWidth = 0;
  livePhotoState.sourceHeight = 0;
  livePhotoState.crop = null;
  livePhotoState.savedCrop = null;
  livePhotoState.cropDrag = null;
  if (livePhotoState.previewFrame) cancelAnimationFrame(livePhotoState.previewFrame);
  livePhotoState.previewFrame = 0;
  livePhotoState.editingId = "";
  els.contentVideo.value = "";
  els.livePhotoVideoInput.value = "";
  els.livePhotoGenerate.innerHTML = '<i data-lucide="image-plus"></i>插入图文';
}

function waitForLivePhotoSeek(video, target) {
  if (Math.abs(video.currentTime - target) < 0.03) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("封面帧读取超时。")), 8000);
    const done = () => {
      window.clearTimeout(timeout);
      video.removeEventListener("seeked", done);
      resolve();
    };
    video.addEventListener("seeked", done, { once: true });
    video.currentTime = target;
  });
}

async function captureLivePhotoCover() {
  const start = Math.max(0, Number(els.livePhotoStart.value) || 0);
  const coverOffset = Math.max(0, Number(els.livePhotoCover.value) || 0);
  await waitForLivePhotoSeek(els.livePhotoVideo, Math.min(livePhotoState.sourceDuration, start + coverOffset));
  const canvas = document.createElement("canvas");
  const videoWidth = els.livePhotoVideo.videoWidth;
  const videoHeight = els.livePhotoVideo.videoHeight;
  const crop = livePhotoState.crop || fullCropRect({ width: videoWidth, height: videoHeight });
  const sx = clamp(crop.x, 0, videoWidth - 1);
  const sy = clamp(crop.y, 0, videoHeight - 1);
  const sw = clamp(crop.width, 1, videoWidth - sx);
  const sh = clamp(crop.height, 1, videoHeight - sy);
  const targetAspect = sw / sh;
  let outputWidth;
  let outputHeight;
  if (targetAspect >= 1) {
    outputWidth = Math.max(1, Math.min(1440, Math.round(sw)));
    outputHeight = Math.max(1, Math.round(outputWidth / targetAspect));
  } else {
    outputHeight = Math.max(1, Math.min(1440, Math.round(sh)));
    outputWidth = Math.max(1, Math.round(outputHeight * targetAspect));
  }
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const resizedContext = canvas.getContext("2d");
  resizedContext.imageSmoothingEnabled = true;
  resizedContext.imageSmoothingQuality = "high";
  resizedContext.drawImage(els.livePhotoVideo, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);
  return canvas.toDataURL("image/jpeg", 0.95);
}

async function applyLivePhotoAsset(event) {
  event.preventDefault();
  if (!livePhotoSelectionIsValid() || livePhotoState.generating) return;
  livePhotoState.generating = true;
  updateLivePhotoGenerateState();
  setLivePhotoServiceMessage("正在保存视频素材并生成封面帧…");
  try {
    const editing = Boolean(livePhotoState.editingId);
    const id = livePhotoState.editingId || createImportedImageId();
    const videoKey = String(state.images[id]?.videoKey || id);
    const cover = await captureLivePhotoCover();
    const settings = normalizeLiveMediaSettings({
      platform: livePhotoState.platform,
      aspect: livePhotoState.aspect,
      customAspect: livePhotoState.customAspect,
      start: Number(els.livePhotoStart.value) || 0,
      coverOffset: Number(els.livePhotoCover.value) || 0,
      crop: normalizedLivePhotoCrop(),
    });
    await writeLiveMediaBlob(videoKey, livePhotoState.file);
    replaceLiveMediaCache(videoKey, livePhotoState.file, livePhotoState.file.name || state.images[id]?.videoName || "video.mov");
    state.images[id] = {
      ...(state.images[id] || {}),
      kind: "live",
      src: cover,
      name: state.images[id]?.name || `${livePhotoState.file.name || "视频"} · 实况`,
      videoKey,
      videoName: livePhotoState.file.name || state.images[id]?.videoName || "video.mov",
      videoType: livePhotoState.file.type || "video/quicktime",
      videoDuration: livePhotoState.sourceDuration,
      videoWidth: livePhotoState.sourceWidth,
      videoHeight: livePhotoState.sourceHeight,
      liveSettings: settings,
      crop: null,
      layout: state.images[id]?.layout || defaultNewImageLayout(),
    };
    if (!livePhotoState.editingId) insertImageTagsAtCursor([`[[image:${id}]]`]);
    updateImageList();
    livePhotoState.generating = false;
    closeLivePhotoModal();
    await render();
    els.status.textContent = editing
      ? "已更新实况素材"
      : needsLivePhotoStaticFallback()
        ? "已插入实况图片；当前站点尚未连接云端实况服务"
        : cloudLivePhotoAvailable() && !["localhost", "127.0.0.1"].includes(window.location.hostname)
          ? "已插入实况图片；右侧下载会自动交给云端 Mac 生成"
          : "已插入实况图片；右侧下载会自动生成发布包";
  } catch (error) {
    setLivePhotoServiceMessage(error?.message || "实况素材保存失败。", "error");
  } finally {
    livePhotoState.generating = false;
    updateLivePhotoGenerateState();
  }
}

async function render() {
  await hydrateLiveMediaForState();
  const settings = readForm();
  updateAppMode();
  updateArticleControls();
  if (state.appMode === "article") {
    renderArticlePreview(settings);
    saveState();
    return;
  }
  const pages = await buildPages(settings);
  state.canvases = pages.map((page, index) => renderPage(page, index, pages.length));
  drawPreview(state.canvases);
  saveState();
  scheduleLivePhotoPrewarm();
}

async function cancelStaleLivePhotoPrewarm(entry) {
  if (!entry || entry.stale) return;
  entry.stale = true;
  if (entry.cancel) {
    await entry.cancel().catch(() => undefined);
    return;
  }
  if (entry.promise) await entry.promise.catch(() => undefined);
}

async function prewarmLivePhotoCanvas(canvas, pageIndex) {
  const hits = liveImageHitsForCanvas(canvas);
  if (hits.length !== 1) return null;
  const imageId = String(hits[0].imageId);
  const image = state.images[imageId];
  if (!image || image.demoOnly || !liveMediaFiles.get(String(image.videoKey || imageId))?.blob) return null;

  const previous = livePhotoPrewarmState.jobs.get(imageId);
  if (previous?.canvas === canvas && (previous.promise || previous.result || previous.status === "failed")) {
    return previous.result || previous.promise;
  }
  if (previous) {
    await cancelStaleLivePhotoPrewarm(previous);
    if (livePhotoPrewarmState.jobs.get(imageId) === previous) livePhotoPrewarmState.jobs.delete(imageId);
  }

  const entry = {
    canvas,
    pageIndex,
    status: "preparing",
    result: null,
    promise: null,
    jobId: "",
    cancel: null,
    stale: false,
    error: "",
  };
  livePhotoPrewarmState.jobs.set(imageId, entry);
  entry.promise = (async () => {
    try {
      if (!(await ensureLivePhotoServiceReady())) throw new Error("云端实况服务暂时不可用。");
      if (livePhotoPrewarmState.jobs.get(imageId) !== entry) return null;
      const result = await generateLivePackageForCanvas(
        canvas,
        pageIndex,
        false,
        true,
        (stage, detail, cloudProgress, meta = {}) => {
          if (meta.jobId) entry.jobId = meta.jobId;
          if (meta.cancel) entry.cancel = meta.cancel;
          entry.status = stage === "complete" ? "complete" : "processing";
        },
      );
      if (livePhotoPrewarmState.jobs.get(imageId) !== entry || entry.stale) return null;
      entry.result = result;
      entry.status = "complete";
      entry.promise = null;
      els.status.textContent = "实况已在后台准备完成，点击下载时会直接使用。";
      return result;
    } catch (error) {
      if (livePhotoPrewarmState.jobs.get(imageId) === entry && !entry.stale) {
        entry.status = "failed";
        entry.error = error?.message || "后台实况准备失败。";
        entry.promise = null;
      }
      throw error;
    }
  })();
  els.status.textContent = "实况正在后台准备；你可以继续编辑内容。";
  return entry.promise;
}

function scheduleLivePhotoPrewarm() {
  window.clearTimeout(livePhotoPrewarmState.timer);
  livePhotoPrewarmState.timer = window.setTimeout(() => {
    livePhotoPrewarmState.timer = 0;
    if (!cloudLivePhotoAvailable() || !state.canvases.length) return;
    state.canvases.forEach((canvas, pageIndex) => {
      const hits = liveImageHitsForCanvas(canvas);
      if (hits.length === 1) void prewarmLivePhotoCanvas(canvas, pageIndex).catch(() => undefined);
    });
  }, 1200);
}

function drawPreview(canvases) {
  els.pages.innerHTML = "";
  els.pages.className = "pages";
  els.articleSettings.hidden = true;
  if (previewImageSelection && !String(els.content.value || "").includes(`[[image:${previewImageSelection.imageId}]]`)) {
    previewImageSelection = null;
  }
  if (!canvases.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "暂无内容";
    els.pages.append(empty);
  }

  canvases.forEach((canvas, index) => {
    const liveHits = liveImageHitsForCanvas(canvas);
    const shell = document.createElement("article");
    shell.className = "page-shell";
    shell.classList.toggle("has-live", liveHits.length > 0);
    const frame = document.createElement("div");
    frame.className = "page-frame";
    frame.append(canvas);
    frame.append(createImageEditLayer(canvas));
    frame.append(createTextHitLayer(canvas));
    attachPreviewImageDropHandlers(frame);
    frame.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".preview-image-box, .preview-text-hit")) clearPreviewImageSelection();
    });

    const actions = document.createElement("div");
    actions.className = "page-actions";
    const label = document.createElement("span");
    label.textContent = `${liveHits.length ? "实况" : "图片"} ${String(index + 1).padStart(2, "0")}`;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.pageExport = "true";
    button.title = liveHits.length
      ? needsLivePhotoStaticFallback() ? "查看实况导出选项" : "自动生成 Live Photo 发布包"
      : "下载单张 PNG";
    button.setAttribute("aria-label", liveHits.length ? `导出第 ${index + 1} 张实况` : `下载第 ${index + 1} 张`);
    button.innerHTML = `<i data-lucide="${liveHits.length ? "aperture" : "download"}"></i>`;
    const filename = `layout-page-${String(index + 1).padStart(2, "0")}.png`;
    button.addEventListener("click", () => exportCanvasAutomatically(canvas, filename, index));
    actions.append(label, button);
    shell.append(frame, actions);
    els.pages.append(shell);
  });

  const livePageCount = canvases.filter((canvas) => liveImageHitsForCanvas(canvas).length).length;
  els.pageCount.textContent = `${canvases.length} 张图片${livePageCount ? ` · ${livePageCount} 张实况` : ""}`;
  els.status.textContent = livePageCount && needsLivePhotoStaticFallback()
    ? `已生成 ${canvases.length} 张 · ${livePageCount} 张实况；当前站点尚未连接云端实况服务`
    : `已生成 ${canvases.length} 张${livePageCount ? `，其中 ${livePageCount} 张会自动导出 Live Photo` : ""}，高清尺寸 ${OUTPUT_CANVAS_WIDTH}x${OUTPUT_CANVAS_HEIGHT}`;
  syncExportBusyState();
  if (window.lucide) window.lucide.createIcons();
}

function createImageEditLayer(canvas) {
  const layer = document.createElement("div");
  layer.className = "preview-image-edit-layer";

  for (const hit of canvas._imageHits || []) {
    const image = state.images[hit.imageId];
    const isLive = image?.kind === "live";
    const box = document.createElement("div");
    box.className = "preview-image-box";
    box.classList.toggle("is-live", isLive);
    box.classList.toggle("is-selected", previewImageSelectionMatchesHit(hit));
    box.dataset.imageId = hit.imageId;
    box.dataset.baseWidth = String(hit.baseWidth || hit.width);
    box.dataset.maxWidth = String(hit.maxWidth || CARD_CONTENT_WIDTH);
    box.dataset.resizeMaxWidth = String(hit.resizeMaxWidth || hit.baseWidth || hit.width);
    box.dataset.sourceStart = String(hit.sourceStart);
    box.dataset.sourceEnd = String(hit.sourceEnd);
    box.tabIndex = 0;
    box.setAttribute("role", "button");
    box.setAttribute("aria-label", `选择${isLive ? "实况" : "图片"} ${image?.name || hit.imageId}`);
    box.setAttribute("aria-selected", previewImageSelectionMatchesHit(hit) ? "true" : "false");
    box.title = isLive
      ? "点击选中后按 Backspace 删除；拖动可调整位置，右上角编辑，顶部调整对齐，右下角缩放"
      : "点击选中后按 Backspace 删除；拖动可调整位置，右上角裁剪，顶部调整对齐，右下角缩放";
    applyImageBoxStyle(box, hit);
    box.addEventListener("pointerdown", startPreviewImageMove);
    box.addEventListener("click", (event) => {
      selectPreviewImage({
        imageId: hit.imageId,
        sourceStart: hit.sourceStart,
        sourceEnd: hit.sourceEnd,
      });
      if (event.target === box) box.focus({ preventScroll: true });
    });
    box.addEventListener("focus", () => {
      selectPreviewImage({
        imageId: hit.imageId,
        sourceStart: hit.sourceStart,
        sourceEnd: hit.sourceEnd,
      });
    });

    if (isLive) {
      const video = createLivePreviewVideo(image, hit.imageId, "preview-live-video");
      if (video) box.append(video);
      const badge = document.createElement("span");
      badge.className = "preview-live-badge";
      badge.innerHTML = '<i data-lucide="aperture"></i>LIVE';
      box.append(badge);
    }

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

    const cropButton = document.createElement("button");
    cropButton.type = "button";
    cropButton.className = "preview-image-crop";
    cropButton.title = isLive ? "编辑当前实况" : "裁剪当前图片";
    cropButton.setAttribute("aria-label", isLive ? "编辑当前实况" : "裁剪当前图片");
    cropButton.innerHTML = `<i data-lucide="${isLive ? "aperture" : "crop"}"></i>`;
    cropButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (isLive) {
        openLivePhotoEditor(hit.imageId);
      } else {
        openCropper("image", hit.imageId);
      }
    });

    const resize = document.createElement("span");
    resize.className = "preview-image-resize";
    resize.dataset.action = "resize";
    resize.addEventListener("pointerdown", startPreviewImageResize);

    box.append(alignBar, cropButton, resize);
    layer.append(box);
  }

  return layer;
}

function previewImageSelectionMatchesHit(hit) {
  if (!previewImageSelection || String(previewImageSelection.imageId) !== String(hit?.imageId || "")) return false;
  if (!Number.isFinite(previewImageSelection.sourceStart) || !Number.isFinite(hit?.sourceStart)) return true;
  return previewImageSelection.sourceStart === hit.sourceStart
    && previewImageSelection.sourceEnd === hit.sourceEnd;
}

function selectPreviewImage(selection) {
  if (!selection?.imageId || !state.images[selection.imageId]) return;
  previewImageSelection = {
    imageId: String(selection.imageId),
    sourceStart: Number(selection.sourceStart),
    sourceEnd: Number(selection.sourceEnd),
  };
  document.querySelectorAll(".preview-image-box").forEach((box) => {
    const selected = previewImageSelectionMatchesHit({
      imageId: box.dataset.imageId,
      sourceStart: Number(box.dataset.sourceStart),
      sourceEnd: Number(box.dataset.sourceEnd),
    });
    box.classList.toggle("is-selected", selected);
    box.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

function clearPreviewImageSelection() {
  previewImageSelection = null;
  document.querySelectorAll(".preview-image-box.is-selected").forEach((box) => {
    box.classList.remove("is-selected");
    box.setAttribute("aria-selected", "false");
  });
}

function isEditablePreviewDeleteTarget(target) {
  const element = target instanceof Element ? target : null;
  if (!element) return false;
  return Boolean(element.closest("input, textarea, select, [contenteditable='true']"));
}

function selectedPreviewImageHit(content) {
  if (!previewImageSelection) return null;
  const imageId = String(previewImageSelection.imageId || "");
  const tag = `[[image:${imageId}]]`;
  if (!tag || !content.includes(tag)) return null;
  const expectedStart = Number(previewImageSelection.sourceStart);
  const expectedEnd = Number(previewImageSelection.sourceEnd);
  if (Number.isFinite(expectedStart) && Number.isFinite(expectedEnd) && content.slice(expectedStart, expectedEnd) === tag) {
    return { imageId, sourceStart: expectedStart, sourceEnd: expectedEnd };
  }
  const candidates = Array.from(content.matchAll(new RegExp(`\\[\\[image:${escapeRegExp(imageId)}\\]\\]`, "g")), (match) => match.index);
  const fallbackStart = candidates.sort((a, b) => Number.isFinite(expectedStart)
    ? Math.abs(a - expectedStart) - Math.abs(b - expectedStart)
    : a - b)[0];
  return !Number.isFinite(fallbackStart)
    ? null
    : { imageId, sourceStart: fallbackStart, sourceEnd: fallbackStart + tag.length };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function cleanUpDeletedImageAsset(imageId, image) {
  if (image?.kind !== "live") return;
  const key = String(image.videoKey || imageId);
  const prewarm = livePhotoPrewarmState.jobs.get(imageId);
  if (prewarm) {
    prewarm.stale = true;
    livePhotoPrewarmState.jobs.delete(imageId);
    void cancelStaleLivePhotoPrewarm(prewarm).catch(() => undefined);
  }
  const cached = liveMediaFiles.get(key);
  if (cached?.url) URL.revokeObjectURL(cached.url);
  liveMediaFiles.delete(key);
  try {
    await deleteLiveMediaBlob(key);
  } catch {
    // The image has already been removed from the document; cache cleanup can retry later.
  }
}

async function deleteSelectedPreviewImage() {
  if (isBuiltInProjectId(state.currentProjectId)) {
    els.status.textContent = "内置说明书不可修改，请先点击左上角“+”新建内容";
    return;
  }
  const content = String(els.content.value || "");
  const selected = selectedPreviewImageHit(content);
  if (!selected) {
    clearPreviewImageSelection();
    return;
  }

  const removal = imageRemovalRange(content, selected.sourceStart, selected.sourceEnd);
  const image = state.images[selected.imageId];
  commitTextHistory();
  els.content.value = `${content.slice(0, removal.start)}${content.slice(removal.end)}`;
  const stillReferenced = els.content.value.includes(`[[image:${selected.imageId}]]`);
  if (!stillReferenced) delete state.images[selected.imageId];
  clearPreviewImageSelection();
  updateImageList();
  saveState();
  commitTextHistory();
  await render();
  if (!stillReferenced) void cleanUpDeletedImageAsset(selected.imageId, image);
  els.status.textContent = `已删除${image?.kind === "live" ? "实况" : "图片"}${image?.name ? `：${image.name}` : ""}`;
}

function handlePreviewImageDeleteKey(event) {
  if (event.isComposing || !["Backspace", "Delete"].includes(event.key)) return;
  if (isEditablePreviewDeleteTarget(event.target)) return;
  const activeElement = document.activeElement;
  const activeBox = activeElement?.closest?.(".preview-image-box");
  const targetBox = event.target?.closest?.(".preview-image-box");
  if (!previewImageSelection || (!activeBox && !targetBox)) return;
  if (activeElement?.matches?.("button, input, textarea, select")) return;
  if (isBuiltInProjectId(state.currentProjectId)) {
    event.preventDefault();
    els.status.textContent = "内置说明书不可修改，请先点击左上角“+”新建内容";
    return;
  }
  event.preventDefault();
  void deleteSelectedPreviewImage();
}

function attachPreviewImageDropHandlers(frame) {
  const indicator = document.createElement("div");
  indicator.className = "preview-image-drop-line";
  indicator.hidden = true;
  frame.append(indicator);
}

function startPreviewImageMove(event) {
  const box = event.currentTarget;
  selectPreviewImage({
    imageId: box.dataset.imageId,
    sourceStart: Number(box.dataset.sourceStart),
    sourceEnd: Number(box.dataset.sourceEnd),
  });
  if (event.button !== 0 || event.target.closest("button, .preview-image-resize")) return;
  box.focus({ preventScroll: true });
  const sourceStart = Number(box.dataset.sourceStart);
  const sourceEnd = Number(box.dataset.sourceEnd);
  if (!Number.isFinite(sourceStart) || !Number.isFinite(sourceEnd)) return;
  event.preventDefault();
  event.stopPropagation();
  const boxRect = box.getBoundingClientRect();
  previewImageDrag = {
    imageId: box.dataset.imageId,
    sourceStart,
    sourceEnd,
    box,
    pointerId: event.pointerId,
    dropFrame: null,
    startClientX: event.clientX,
    startClientY: event.clientY,
    lastClientY: event.clientY,
    grabOffsetY: event.clientY - boxRect.top,
    boxHeight: boxRect.height,
    direction: 0,
    active: false,
  };
  box.setPointerCapture?.(event.pointerId);
  document.addEventListener("pointermove", movePreviewImagePointer);
  document.addEventListener("pointerup", stopPreviewImagePointer, { once: true });
  document.addEventListener("pointercancel", stopPreviewImagePointer, { once: true });
}

function movePreviewImagePointer(event) {
  if (!previewImageDrag) return;
  event.preventDefault();
  const dx = event.clientX - previewImageDrag.startClientX;
  const dy = event.clientY - previewImageDrag.startClientY;
  if (!previewImageDrag.active && Math.hypot(dx, dy) < 5) return;
  previewImageDrag.active = true;
  previewImageDrag.totalDeltaY = dy;
  previewImageDrag.direction = event.clientY > previewImageDrag.lastClientY + 1
    ? 1
    : event.clientY < previewImageDrag.lastClientY - 1
      ? -1
      : previewImageDrag.direction || (dy >= 0 ? 1 : -1);
  previewImageDrag.lastClientY = event.clientY;
  previewImageDrag.box.classList.add("is-dragging");
  previewImageDrag.box.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  autoScrollPreviewDuringImageDrag(event.clientY);

  const frame = previewFrameAtPoint(event.clientX, event.clientY);
  if (!frame) {
    if (previewImageDrag.dropFrame) clearPreviewImageDropFrame(previewImageDrag.dropFrame);
    previewImageDrag.dropFrame = null;
    return;
  }
  if (previewImageDrag.dropFrame && previewImageDrag.dropFrame !== frame) {
    clearPreviewImageDropFrame(previewImageDrag.dropFrame);
  }
  previewImageDrag.dropFrame = frame;
  const canvas = frame.querySelector("canvas");
  setPreviewImageDropTarget(frame, canvas, event.clientY, previewImageDrag.direction);
}

function stopPreviewImagePointer(event) {
  document.removeEventListener("pointermove", movePreviewImagePointer);
  document.removeEventListener("pointerup", stopPreviewImagePointer);
  document.removeEventListener("pointercancel", stopPreviewImagePointer);
  if (!previewImageDrag) return;
  const frame = previewImageDrag.dropFrame;
  const drag = previewImageDrag;
  drag.box?.releasePointerCapture?.(drag.pointerId);
  let moved = false;
  if (drag.active && frame?._imageDropTarget) {
    moved = movePreviewImageMarkdown(drag.imageId, drag.sourceStart, drag.sourceEnd, frame._imageDropTarget);
  }
  stopPreviewImageDrag();
  if (drag.active && !moved) els.status.textContent = "图片位置没有变化，拖过蓝色落点线后松手即可移动";
  event?.preventDefault();
}

function stopPreviewImageDrag() {
  if (previewImageDrag?.box) {
    previewImageDrag.box.classList.remove("is-dragging");
    previewImageDrag.box.style.removeProperty("transform");
  }
  previewImageDrag = null;
  document.querySelectorAll(".page-frame.is-image-drop-target").forEach(clearPreviewImageDropFrame);
}

function previewFrameAtPoint(clientX, clientY) {
  const direct = document.elementFromPoint(clientX, clientY)?.closest(".page-frame");
  if (direct) return direct;
  let closest = null;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (const frame of document.querySelectorAll(".page-frame")) {
    const rect = frame.getBoundingClientRect();
    const dx = clientX < rect.left ? rect.left - clientX : clientX > rect.right ? clientX - rect.right : 0;
    const dy = clientY < rect.top ? rect.top - clientY : clientY > rect.bottom ? clientY - rect.bottom : 0;
    if (dx > 36 || dy > 44) continue;
    const distance = Math.hypot(dx, dy);
    if (distance < closestDistance) {
      closest = frame;
      closestDistance = distance;
    }
  }
  return closest;
}

function autoScrollPreviewDuringImageDrag(clientY) {
  const panel = document.querySelector(".preview-panel");
  if (!panel || panel.scrollHeight <= panel.clientHeight) return;
  const rect = panel.getBoundingClientRect();
  const edge = 64;
  if (clientY < rect.top + edge) panel.scrollTop -= Math.ceil((rect.top + edge - clientY) / 3);
  if (clientY > rect.bottom - edge) panel.scrollTop += Math.ceil((clientY - (rect.bottom - edge)) / 3);
}

function clearPreviewImageDropFrame(frame) {
  frame.classList.remove("is-image-drop-target");
  frame._imageDropTarget = null;
  const indicator = frame.querySelector(".preview-image-drop-line");
  if (indicator) indicator.hidden = true;
}

function setPreviewImageDropTarget(frame, canvas, clientY, direction = 0) {
  if (!previewImageDrag || !canvas) return;
  const rect = frame.getBoundingClientRect();
  const leadingEdgeOffset = direction > 0
    ? previewImageDrag.boxHeight - previewImageDrag.grabOffsetY
    : direction < 0
      ? -previewImageDrag.grabOffsetY
      : 0;
  const probeClientY = clientY + leadingEdgeOffset * 0.4;
  const logicalY = clamp(((probeClientY - rect.top) / rect.height) * CANVAS_HEIGHT, 0, CANVAS_HEIGHT);
  const rawTargets = (canvas._imageDropTargets || []).filter((target) => {
    return target.sourceEnd <= previewImageDrag.sourceStart || target.sourceStart >= previewImageDrag.sourceEnd;
  });
  const targets = rawTargets;
  let dropTarget = null;
  const shortDirectionalMove = direction && Math.abs(previewImageDrag.totalDeltaY || 0) <= 96;
  if (shortDirectionalMove) {
    const adjacent = direction > 0
      ? targets
          .filter((target) => target.sourceStart >= previewImageDrag.sourceEnd)
          .sort((a, b) => a.sourceStart - b.sourceStart)[0]
      : targets
          .filter((target) => target.sourceEnd <= previewImageDrag.sourceStart)
          .sort((a, b) => b.sourceEnd - a.sourceEnd)[0];
    if (adjacent) {
      dropTarget = {
        ...adjacent,
        after: direction > 0,
        indicatorY: direction > 0 ? adjacent.y + adjacent.height : adjacent.y,
      };
    }
  }
  for (const target of dropTarget ? [] : targets) {
    if (logicalY < target.y + target.height / 2) {
      dropTarget = { ...target, after: false, indicatorY: target.y };
      break;
    }
  }
  if (!dropTarget && targets.length) {
    const target = targets[targets.length - 1];
    dropTarget = { ...target, after: true, indicatorY: target.y + target.height };
  }
  if (!dropTarget) {
    const bounds = canvas._page?.bounds || { top: CARD_SIDE_PADDING, bottom: CANVAS_HEIGHT - 62 };
    dropTarget = {
      sourceStart: els.content.value.length,
      sourceEnd: els.content.value.length,
      after: true,
      indicatorY: bounds.bottom,
    };
  }
  frame._imageDropTarget = dropTarget;
  frame.classList.add("is-image-drop-target");
  const indicator = frame.querySelector(".preview-image-drop-line");
  indicator.hidden = false;
  indicator.style.top = `${(clamp(dropTarget.indicatorY, 0, CANVAS_HEIGHT) / CANVAS_HEIGHT) * 100}%`;
}

function markdownLineStart(content, index) {
  if (index <= 0) return 0;
  return content.lastIndexOf("\n", index - 1) + 1;
}

function markdownLineEnd(content, index) {
  const newline = content.indexOf("\n", clamp(index, 0, content.length));
  return newline === -1 ? content.length : newline + 1;
}

function imageRemovalRange(content, sourceStart, sourceEnd) {
  const lineStart = markdownLineStart(content, sourceStart);
  const lineEnd = markdownLineEnd(content, sourceEnd);
  const line = content.slice(lineStart, lineEnd).replace(/\n$/, "");
  if (isMarkdownImageBlock(line.trim())) {
    let end = lineEnd;
    if (end < content.length) {
      const followingLineEnd = markdownLineEnd(content, end);
      if (!content.slice(end, followingLineEnd).trim()) end = followingLineEnd;
    }
    return { start: lineStart, end };
  }
  return {
    start: clamp(sourceStart, 0, content.length),
    end: clamp(sourceEnd, sourceStart, content.length),
  };
}

function movePreviewImageMarkdown(imageId, sourceStart, sourceEnd, target) {
  const content = els.content.value;
  const removal = imageRemovalRange(content, sourceStart, sourceEnd);
  const moveStart = removal.start;
  const moveEnd = removal.end;
  const lineLevelTarget = target.targetKind === "text-line";
  const targetIndex = lineLevelTarget
    ? (target.after ? target.sourceEnd : target.sourceStart)
    : target.after
      ? markdownLineEnd(content, target.sourceEnd)
      : markdownLineStart(content, target.sourceStart);
  if (targetIndex >= moveStart && targetIndex <= moveEnd) return false;

  commitTextHistory();
  let chunk = `[[image:${imageId}]]`;
  const withoutSource = `${content.slice(0, moveStart)}${content.slice(moveEnd)}`;
  let insertionIndex = targetIndex > moveEnd ? targetIndex - (moveEnd - moveStart) : targetIndex;
  insertionIndex = clamp(insertionIndex, 0, withoutSource.length);
  if (!lineLevelTarget) {
    if (insertionIndex > 0 && withoutSource[insertionIndex - 1] !== "\n") chunk = `\n${chunk}`;
    if (insertionIndex < withoutSource.length && withoutSource[insertionIndex] !== "\n") chunk = `${chunk}\n`;
    if (!chunk.endsWith("\n")) chunk = `${chunk}\n`;
  }
  els.content.value = `${withoutSource.slice(0, insertionIndex)}${chunk}${withoutSource.slice(insertionIndex)}`;
  const movedTag = `[[image:${imageId}]]`;
  const movedSourceStart = els.content.value.indexOf(movedTag, Math.max(0, insertionIndex - 1));
  previewImageSelection = {
    imageId: String(imageId),
    sourceStart: movedSourceStart,
    sourceEnd: movedSourceStart === -1 ? -1 : movedSourceStart + movedTag.length,
  };
  els.content.focus({ preventScroll: true });
  els.content.setSelectionRange(insertionIndex, insertionIndex + chunk.length);
  scrollTextareaToRange(insertionIndex);
  commitTextHistory();
  updateImageList();
  requestRender();
  window.setTimeout(() => {
    els.status.textContent = "图片已移动，左侧 Markdown 顺序已同步";
  }, 320);
  return true;
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

function liveImageHitsForCanvas(canvas) {
  return (canvas?._imageHits || []).filter((hit) => state.images[hit.imageId]?.kind === "live");
}

function createLiveWellMaskBlob(width, height, radius = 16) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#fff";
  roundedRect(context, 0, 0, width, height, Math.min(radius, width / 2, height / 2));
  context.fill();
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function exportProgressElements(scope = "main") {
  if (scope === "handoff") {
    return {
      root: els.livePhotoHandoffProgress,
      title: els.livePhotoHandoffProgressTitle,
      detail: els.livePhotoHandoffProgressDetail,
      percent: els.livePhotoHandoffProgressPercent,
      meta: els.livePhotoHandoffProgressMeta,
      bar: els.livePhotoHandoffProgressBar,
      fill: els.livePhotoHandoffProgressFill,
    };
  }
  return {
    root: els.exportProgress,
    title: els.exportProgressTitle,
    detail: els.exportProgressDetail,
    percent: els.exportProgressPercent,
    meta: els.exportProgressMeta,
    bar: els.exportProgressBar,
    fill: els.exportProgressFill,
  };
}

function livePhotoHandoffDeviceText() {
  const userAgent = navigator.userAgent || "";
  const platform = /Mac/i.test(navigator.platform || userAgent) ? "Mac" : "当前设备";
  const browser = /Safari/i.test(userAgent) && !/(Chrome|Chromium|Edg)/i.test(userAgent)
    ? "Safari"
    : /Edg/i.test(userAgent)
      ? "Edge"
      : /(Chrome|Chromium)/i.test(userAgent)
        ? "Chrome"
        : "浏览器";
  return `已检测：${platform} · ${browser}`;
}

function livePhotoHandoffItemCopy(item) {
  const page = String(item.pageIndex + 1).padStart(2, "0");
  return item.type === "live"
    ? { page, label: "原生 Live Photo", extension: ".pvt", icon: "aperture" }
    : { page, label: "高清图片", extension: "PNG", icon: "image" };
}

function renderLivePhotoHandoffFiles() {
  if (!els.livePhotoHandoffFiles) return;
  const liveCount = livePhotoHandoffState.items.filter((item) => item.type === "live").length;
  const staticCount = livePhotoHandoffState.items.length - liveCount;
  if (livePhotoHandoffState.onlineFallback) {
    els.livePhotoHandoffFiles.innerHTML = `
      <div class="live-photo-package-card is-static-fallback">
        <div class="live-photo-package-lead">
          <span class="live-photo-package-icon"><i data-lucide="image" aria-hidden="true"></i></span>
          <span><strong>普通图片 .png</strong><small>当前在线站点只能导出静态图片，不能生成完整实况照片包。</small></span>
          <em>${livePhotoHandoffState.items.length} 张</em>
        </div>
      </div>
      <div class="live-photo-package-helper is-warning">
        <i data-lucide="info" aria-hidden="true"></i>
        <span><strong>为什么不是实况？</strong><small>在线站点还没有接入云端视频处理服务。这里下载的文件不会带“实况”标识。</small></span>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (livePhotoHandoffState.isBatch) {
    const liveRow = liveCount
      ? `<div class="live-photo-package-row">
          <i data-lucide="aperture" aria-hidden="true"></i>
          <span><strong>实况照片 .pvt</strong><small>完整的实况照片，里面已经包含封面和动态视频。</small></span>
          <em>${liveCount} 个</em>
        </div>`
      : "";
    const staticRow = staticCount
      ? `<div class="live-photo-package-row">
          <i data-lucide="image" aria-hidden="true"></i>
          <span><strong>高清图片 .png</strong><small>${staticCount} 张普通图片，可以直接上传到各个平台。</small></span>
          <em>${staticCount} 张</em>
        </div>`
      : "";
    els.livePhotoHandoffFiles.innerHTML = `
      <div class="live-photo-package-card">
        ${liveRow}${staticRow}
        ${liveCount ? `<details class="live-photo-package-details">
          <summary><i data-lucide="file-text" aria-hidden="true"></i><span>想了解 .pvt 里面的文件</span><i data-lucide="chevron-down" aria-hidden="true"></i></summary>
          <div class="live-photo-package-detail-grid">
            <span><strong>JPG</strong> 封面画面</span>
            <span><strong>MOV</strong> 动态视频</span>
            <span><strong>识别信息</strong> 让 iPhone 识别实况</span>
          </div>
        </details>
        <p class="live-photo-package-note"><i data-lucide="lock-keyhole" aria-hidden="true"></i>它相当于一个实况照片文件夹，请不要拆开里面的 JPG、MOV 和识别信息。</p>` : ""}
      </div>
      <div class="live-photo-package-helper">
        <i data-lucide="folder" aria-hidden="true"></i>
        <span><strong>下载后怎么用？</strong><small>解压 ZIP，在 Finder 中选中 .pvt → 点共享 → 隔空投送到 iPhone。手机会收到一张可播放的实况照片。</small></span>
      </div>
    `;
  } else {
    els.livePhotoHandoffFiles.innerHTML = `
      <div class="live-photo-package-card">
        <div class="live-photo-package-lead">
          <span class="live-photo-package-icon"><i data-lucide="aperture" aria-hidden="true"></i></span>
          <span><strong>实况照片 .pvt</strong><small>它看起来像一个文件，里面已经装好了封面、动态视频和识别信息。</small></span>
          <em>完整实况</em>
        </div>
        <div class="live-photo-package-contents">
          <strong>里面包含</strong>
          <div><i data-lucide="image" aria-hidden="true"></i><span><b>JPG 封面图</b><small>打开时先看到的画面</small></span></div>
          <div><i data-lucide="video" aria-hidden="true"></i><span><b>MOV 动态视频</b><small>长按时播放的部分</small></span></div>
          <div><i data-lucide="contact" aria-hidden="true"></i><span><b>识别信息</b><small>让 iPhone 把它识别成实况</small></span></div>
        </div>
        <p class="live-photo-package-note"><i data-lucide="lock-keyhole" aria-hidden="true"></i>这些文件需要待在一起，请不要打开或拆分 .pvt。</p>
      </div>
      <div class="live-photo-package-helper">
        <i data-lucide="folder" aria-hidden="true"></i>
        <span><strong>下载后怎么用？</strong><small>解压 ZIP，在 Finder 中选中 .pvt → 点共享 → 隔空投送到 iPhone。发送成功后，相册里会出现一张可长按播放的实况照片。</small></span>
      </div>
    `;
  }
  if (window.lucide) window.lucide.createIcons();
}

function updateLivePhotoHandoffProgressSteps(activePageIndex = -1, completedPageIndexes = []) {
  if (!els.livePhotoHandoffProgressSteps) return;
  const completed = new Set(completedPageIndexes.map(Number));
  els.livePhotoHandoffProgressSteps.innerHTML = "";
  for (const item of livePhotoHandoffState.items) {
    const isComplete = completed.has(item.pageIndex);
    const isActive = item.pageIndex === activePageIndex && !isComplete;
    const copy = livePhotoHandoffItemCopy(item);
    const step = document.createElement("div");
    step.className = `handoff-progress-step${isComplete ? " is-complete" : isActive ? " is-active" : ""}`;
    step.innerHTML = `
      <span>${item.type === "live" ? "实况" : "图片"} ${copy.page}</span>
      <strong><i data-lucide="${isComplete ? "check" : isActive ? "loader-circle" : "clock-3"}" aria-hidden="true"></i>${isComplete ? "已完成" : isActive ? "处理中" : "等待中"}</strong>
    `;
    els.livePhotoHandoffProgressSteps.append(step);
  }
  if (window.lucide) window.lucide.createIcons();
}

function syncExportBusyState() {
  const mainBusy = exportProgressState.main.active;
  const handoffBusy = exportProgressState.handoff.active;
  const guideLocked = isBuiltInProjectId(state.currentProjectId);
  document.body.classList.toggle("export-busy", mainBusy || handoffBusy);
  [els.downloadZip, els.downloadArticle].filter(Boolean).forEach((button) => {
    button.disabled = mainBusy || guideLocked;
    button.setAttribute("aria-disabled", button.disabled ? "true" : "false");
    button.title = guideLocked ? GUIDE_DOWNLOAD_MESSAGE : "";
  });
  document.querySelectorAll("[data-page-export]").forEach((button) => {
    if (!button.dataset.enabledTitle) button.dataset.enabledTitle = button.title || "下载当前页面";
    button.disabled = mainBusy || guideLocked;
    button.setAttribute("aria-disabled", button.disabled ? "true" : "false");
    button.title = guideLocked ? GUIDE_DOWNLOAD_MESSAGE : button.dataset.enabledTitle;
  });
  if (els.livePhotoHandoffClose) {
    els.livePhotoHandoffClose.disabled = handoffBusy;
    els.livePhotoHandoffClose.setAttribute("aria-disabled", handoffBusy ? "true" : "false");
  }
}

function exportElapsedSeconds(scope) {
  const startedAt = exportProgressState[scope]?.startedAt || Date.now();
  return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
}

function refreshExportProgressMeta(scope) {
  const stateForScope = exportProgressState[scope];
  const elements = exportProgressElements(scope);
  if (!stateForScope.active || !elements.meta) return;
  const count = Number.isFinite(stateForScope.current) && Number.isFinite(stateForScope.total)
    ? `${stateForScope.current}/${stateForScope.total} · `
    : "";
  elements.meta.textContent = `${count}已用时 ${exportElapsedSeconds(scope)} 秒`;
}

function setExportProgressValue(scope, value) {
  const stateForScope = exportProgressState[scope];
  const elements = exportProgressElements(scope);
  if (!stateForScope || !elements.root) return;
  stateForScope.value = clamp(Math.round(finiteNumber(value, stateForScope.value || 0)), 0, 100);
  elements.percent.textContent = `${stateForScope.value}%`;
  elements.fill.style.width = `${stateForScope.value}%`;
  elements.bar.setAttribute("aria-valuemin", "0");
  elements.bar.setAttribute("aria-valuemax", "100");
  elements.bar.setAttribute("aria-valuenow", String(stateForScope.value));
  elements.bar.setAttribute("aria-valuetext", `已完成 ${stateForScope.value}%`);
}

function beginExportProgress(scope, options = {}) {
  const stateForScope = exportProgressState[scope];
  const elements = exportProgressElements(scope);
  if (!stateForScope || !elements.root || stateForScope.active) return false;
  window.clearTimeout(stateForScope.hideTimer);
  window.clearInterval(stateForScope.timer);
  stateForScope.active = true;
  stateForScope.startedAt = Date.now();
  stateForScope.current = Number.isFinite(options.current) ? options.current : null;
  stateForScope.total = Number.isFinite(options.total) ? options.total : null;
  stateForScope.value = 0;
  elements.root.hidden = false;
  elements.root.className = `export-progress${scope === "handoff" ? " export-progress-compact" : ""}`;
  elements.root.querySelector(".export-progress-icon").innerHTML = '<i data-lucide="loader-circle"></i>';
  elements.title.textContent = options.title || "正在准备导出";
  elements.detail.textContent = options.detail || "系统正在处理，请不要关闭页面。";
  setExportProgressValue(scope, Number.isFinite(options.value) ? options.value : 5);
  if (scope === "handoff") {
    updateLivePhotoHandoffProgressSteps(
      Number.isFinite(options.activePageIndex) ? options.activePageIndex : livePhotoHandoffState.items[0]?.pageIndex ?? -1,
      options.completedPageIndexes || [],
    );
  }
  refreshExportProgressMeta(scope);
  stateForScope.timer = window.setInterval(() => refreshExportProgressMeta(scope), 1000);
  syncExportBusyState();
  if (window.lucide) window.lucide.createIcons();
  return true;
}

function updateExportProgress(scope, options = {}) {
  const stateForScope = exportProgressState[scope];
  const elements = exportProgressElements(scope);
  if (!stateForScope?.active || !elements.root) return;
  if (options.title) elements.title.textContent = options.title;
  if (options.detail) elements.detail.textContent = options.detail;
  if (Number.isFinite(options.current)) stateForScope.current = options.current;
  if (Number.isFinite(options.total)) stateForScope.total = options.total;

  const hasCount = Number.isFinite(stateForScope.current) && Number.isFinite(stateForScope.total) && stateForScope.total > 0;
  const hasValue = Number.isFinite(options.value);
  const nextValue = hasValue
    ? options.value
    : hasCount
      ? (stateForScope.current / stateForScope.total) * 100
      : stateForScope.value;
  setExportProgressValue(scope, Math.max(stateForScope.value, nextValue));
  refreshExportProgressMeta(scope);
}

function finishExportProgress(scope, options = {}) {
  const stateForScope = exportProgressState[scope];
  const elements = exportProgressElements(scope);
  if (!stateForScope || !elements.root) return;
  const cancelled = options.cancelled === true;
  const success = !cancelled && options.success !== false;
  const elapsed = exportElapsedSeconds(scope);
  stateForScope.active = false;
  window.clearInterval(stateForScope.timer);
  stateForScope.timer = 0;
  elements.root.classList.remove("is-success", "is-error", "is-cancelled");
  elements.root.classList.add(cancelled ? "is-cancelled" : success ? "is-success" : "is-error");
  elements.root.querySelector(".export-progress-icon").innerHTML = `<i data-lucide="${cancelled ? "x" : success ? "check" : "circle-alert"}"></i>`;
  elements.title.textContent = options.title || (cancelled ? "已取消下载" : success ? "导出处理完成" : "导出没有完成");
  elements.detail.textContent = options.detail || (cancelled ? "没有写入或下载任何文件。" : success ? "文件已经准备好。" : "请根据提示处理后重试。");
  setExportProgressValue(scope, success ? 100 : cancelled ? 0 : stateForScope.value);
  elements.meta.textContent = `${cancelled ? "已取消" : success ? "完成" : "已停止"} · 用时 ${elapsed} 秒`;
  elements.bar.setAttribute("aria-valuetext", elements.detail.textContent);
  syncExportBusyState();
  if (window.lucide) window.lucide.createIcons();
  const delay = Number.isFinite(options.hideAfter) ? options.hideAfter : success || cancelled ? 2400 : 5200;
  stateForScope.hideTimer = window.setTimeout(() => resetExportProgress(scope), delay);
}

function resetExportProgress(scope) {
  const stateForScope = exportProgressState[scope];
  const elements = exportProgressElements(scope);
  if (!stateForScope || !elements.root) return;
  window.clearInterval(stateForScope.timer);
  window.clearTimeout(stateForScope.hideTimer);
  stateForScope.active = false;
  stateForScope.timer = 0;
  stateForScope.hideTimer = 0;
  stateForScope.current = null;
  stateForScope.total = null;
  stateForScope.value = 0;
  elements.root.hidden = true;
  elements.root.className = `export-progress${scope === "handoff" ? " export-progress-compact" : ""}`;
  elements.percent.textContent = "0%";
  elements.fill.style.width = "0%";
  elements.bar.setAttribute("aria-valuenow", "0");
  if (scope === "handoff" && els.livePhotoHandoffProgressSteps) {
    els.livePhotoHandoffProgressSteps.innerHTML = "";
  }
  syncExportBusyState();
}

function waitForExportProgressPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

async function generateLivePackageForCanvas(canvas, pageIndex, reveal = true, serviceChecked = false, onStage = null) {
  onStage?.("validate", "正在检查实况素材和页面设置…");
  const hits = liveImageHitsForCanvas(canvas);
  if (!hits.length) return null;
  if (hits.length > 1) throw new Error(`第 ${pageIndex + 1} 页包含多段实况，稳妥首版请把它们拆到不同页面。`);
  const hit = hits[0];
  const image = state.images[hit.imageId];
  if (image?.demoOnly) {
    throw new Error("这是内置实况演示。请点击左上角“+”新建内容，再上传自己的视频后导出。");
  }
  if (!serviceChecked && !(await ensureLivePhotoServiceReady())) {
    throw new Error("本机实况服务没有运行。请双击项目里的「启动写了就发.command」，保留终端窗口后再试。");
  }
  const media = liveMediaFiles.get(String(image.videoKey || hit.imageId));
  if (!media?.blob) throw new Error("实况原视频已经丢失，请在左侧重新上传这段视频。");
  onStage?.("page", `正在生成第 ${pageIndex + 1} 页高清卡片…`);
  const pageBlob = await canvasToLosslessPngBlob(canvas);
  if (!pageBlob) throw new Error("卡片页面生成失败，请调整内容后再试。");
  const scale = 1080 / CANVAS_WIDTH;
  const wellX = clamp(Math.round(hit.x * scale), 0, 1080);
  const wellY = clamp(Math.round(hit.y * scale), 0, 1440);
  const wellWidth = clamp(Math.round(hit.width * scale), 40, 1080 - wellX);
  const wellHeight = clamp(Math.round(hit.height * scale), 40, 1440 - wellY);
  const maskBlob = await createLiveWellMaskBlob(wellWidth, wellHeight, Math.round(13 * scale));
  if (!maskBlob) throw new Error("实况圆角遮罩生成失败。");
  const settings = normalizeLiveMediaSettings(image.liveSettings);
  const title = `${projectTitleFromData(readForm())}-第${pageIndex + 1}页`;
  const manifest = {
    platform: settings.platform,
    start: settings.start,
    cover_offset: settings.coverOffset,
    focus_x: settings.focusX,
    focus_y: settings.focusY,
    well_x: wellX,
    well_y: wellY,
    well_width: wellWidth,
    well_height: wellHeight,
    title,
    ...(settings.crop ? {
      crop_x: settings.crop.x,
      crop_y: settings.crop.y,
      crop_width: settings.crop.width,
      crop_height: settings.crop.height,
    } : {}),
  };
  if (livePhotoState.serviceMode === "cloud") {
    onStage?.("package", "正在安全上传原视频，云端不会压缩源文件…", 8);
    const result = await cloudApi().createCloudLivePhotoJob(
      {
        video: { blob: media.blob, name: image.videoName || media.name || "video.mov" },
        page: { blob: pageBlob, name: `page-${String(pageIndex + 1).padStart(2, "0")}.png` },
        mask: { blob: maskBlob, name: "live-well-mask.png" },
      },
      manifest,
      ({ detail, progress, jobId, cancel }) => onStage?.("package", detail, progress, { jobId, cancel }),
    );
    result.pageIndex = pageIndex;
    result.platform_label = settings.platform === "wechat" ? "微信公众号" : "小红书";
    result.duration = settings.platform === "wechat" ? 3 : 5;
    return result;
  }
  const payload = new FormData();
  payload.append("video", media.blob, image.videoName || media.name || "video.mov");
  payload.append("page", pageBlob, `page-${String(pageIndex + 1).padStart(2, "0")}.png`);
  payload.append("mask", maskBlob, "live-well-mask.png");
  for (const [key, value] of Object.entries(manifest)) {
    payload.append(key, String(value));
  }
  payload.append("reveal", reveal ? "1" : "0");
  onStage?.("package", "正在合成 JPG、MOV 与 .pvt，这一步可能需要一些时间…");
  const response = await fetch(livePhotoApiUrl("/api/live-photo/render"), { method: "POST", body: payload });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error || `第 ${pageIndex + 1} 页实况发布包生成失败。`);
  result.pageIndex = pageIndex;
  return result;
}

async function prepareLivePhotoPackageForCanvas(canvas, pageIndex, reveal = false, serviceChecked = false, onStage = null) {
  const hits = liveImageHitsForCanvas(canvas);
  const imageId = hits.length === 1 ? String(hits[0].imageId) : "";
  const cached = imageId ? livePhotoPrewarmState.jobs.get(imageId) : null;
  if (cached?.canvas === canvas) {
    if (cached.result) {
      onStage?.("package", "已复用后台准备好的实况发布包。", 100);
      return { ...cached.result, pageIndex };
    }
    if (cached.promise) {
      try {
        const result = await cached.promise;
        if (result) return { ...result, pageIndex };
      } catch {
        if (livePhotoPrewarmState.jobs.get(imageId) === cached) livePhotoPrewarmState.jobs.delete(imageId);
      }
    }
  } else if (cached) {
    await cancelStaleLivePhotoPrewarm(cached);
    if (livePhotoPrewarmState.jobs.get(imageId) === cached) livePhotoPrewarmState.jobs.delete(imageId);
  }
  return generateLivePackageForCanvas(canvas, pageIndex, reveal, serviceChecked, onStage);
}

function closeLivePhotoHandoff() {
  if (exportProgressState.handoff.active) return;
  resetExportProgress("handoff");
  els.livePhotoHandoffModal.classList.add("hidden");
  els.livePhotoHandoffPreview.innerHTML = "";
  els.livePhotoHandoffThumbnails.innerHTML = "";
  els.livePhotoHandoffFiles.innerHTML = "";
  els.livePhotoHandoffDevice.hidden = true;
  els.livePhotoHandoffPreviewHint.hidden = true;
  livePhotoHandoffState.onlineFallback = false;
  livePhotoHandoffState.onlineEntries = [];
  livePhotoHandoffState.pendingEntries = [];
  livePhotoHandoffState.prepared = false;
}

function createLivePhotoHandoffPreviewFrame(pageIndex, compact = false) {
  const sourceCanvas = state.canvases[pageIndex];
  if (!sourceCanvas) return document.createElement("div");
  const frame = document.createElement("div");
  frame.className = "live-photo-handoff-preview-frame";
  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = sourceCanvas.width;
  previewCanvas.height = sourceCanvas.height;
  previewCanvas.getContext("2d").drawImage(sourceCanvas, 0, 0);
  frame.append(previewCanvas);

  liveImageHitsForCanvas(sourceCanvas).forEach((hit) => {
    const image = state.images[hit.imageId];
    if (!image) return;
    const well = document.createElement("div");
    well.className = "live-photo-handoff-video-well";
    well.style.left = `${(hit.x / CANVAS_WIDTH) * 100}%`;
    well.style.top = `${(hit.y / CANVAS_HEIGHT) * 100}%`;
    well.style.width = `${(hit.width / CANVAS_WIDTH) * 100}%`;
    well.style.height = `${(hit.height / CANVAS_HEIGHT) * 100}%`;
    const video = createLivePreviewVideo(image, hit.imageId, "live-photo-handoff-video");
    if (video) well.append(video);
    if (!compact) {
      const badge = document.createElement("span");
      badge.className = "live-photo-handoff-live-badge";
      badge.innerHTML = '<i data-lucide="aperture"></i>LIVE';
      well.append(badge);
    }
    frame.append(well);
  });
  return frame;
}

function selectLivePhotoHandoffPage(pageIndex) {
  const item = livePhotoHandoffState.items.find((entry) => entry.pageIndex === pageIndex) || livePhotoHandoffState.items[0] || null;
  if (!item) return;
  livePhotoHandoffState.selectedPageIndex = item.pageIndex;
  const result = item.type === "live" ? item.result : null;
  livePhotoHandoffState.selectedJobId = result?.job_id || "";
  els.livePhotoHandoffPreview.innerHTML = "";
  els.livePhotoHandoffPreview.append(createLivePhotoHandoffPreviewFrame(item.pageIndex));
  els.livePhotoHandoffThumbnails.querySelectorAll("[data-handoff-page]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.handoffPage) === item.pageIndex);
  });
  if (livePhotoHandoffState.onlineFallback) {
    els.livePhotoHandoffReveal.disabled = true;
    els.livePhotoHandoffDownload.disabled = false;
  } else if (!livePhotoHandoffState.isBatch) {
    els.livePhotoHandoffReveal.disabled = !result || result.provider === "cloud";
    els.livePhotoHandoffDownload.disabled = !result?.archive_url;
  }
  if (window.lucide) window.lucide.createIcons();
}

async function fetchCloudLivePhotoArchive(result) {
  let response = await fetch(result.archive_url);
  if (!response.ok && result.cloud_access_token && cloudApi()?.getCloudLivePhotoJob) {
    const refreshed = await cloudApi().getCloudLivePhotoJob(result.job_id, result.cloud_access_token);
    if (refreshed.archive_url) {
      result.archive_url = refreshed.archive_url;
      result.archive_bytes = refreshed.archive_bytes || result.archive_bytes;
      response = await fetch(result.archive_url);
    }
  }
  if (!response.ok) throw new Error("云端实况下载地址已经失效，请重新生成。");
  return responseBlobWithProgress(response);
}

async function prepareCloudLivePhotoBatch() {
  if (!window.JSZip) throw new Error("浏览器没有加载 ZIP 组件，无法整理批量实况包。");
  const zip = new window.JSZip();
  for (const result of livePhotoHandoffState.liveResults) {
    const sourceBlob = await fetchCloudLivePhotoArchive(result);
    const sourceZip = await window.JSZip.loadAsync(sourceBlob);
    let copied = 0;
    const entries = [];
    sourceZip.forEach((path, entry) => {
      const marker = path.toLowerCase().indexOf(".pvt/");
      if (!entry.dir && marker >= 0) entries.push([path, entry, marker]);
    });
    for (const [path, entry, marker] of entries) {
      const relative = path.slice(Number(marker) + 5);
      if (!relative) continue;
      const data = await entry.async("arraybuffer");
      zip.file(`${String(result.pageIndex + 1).padStart(2, "0")}-实况.pvt/${relative}`, data);
      copied += 1;
    }
    if (!copied) throw new Error(`第 ${result.pageIndex + 1} 页云端包缺少完整 .pvt。`);
  }
  for (const file of livePhotoHandoffState.staticPackage?.files || []) {
    zip.file(`${String(file.pageIndex + 1).padStart(2, "0")}-图片.png`, file.blob);
  }
  const archiveBlob = await zip.generateAsync({
    type: "blob",
    compression: EXPORT_ZIP_COMPRESSION,
    mimeType: "application/zip",
  });
  if (!(await isZipBlob(archiveBlob))) throw new Error("云端批量 ZIP 整理失败。");
  return {
    ok: true,
    provider: "cloud",
    archive_blob: archiveBlob,
    archive_name: `${safeObsidianFileName(projectTitleFromData(readForm())) || "写了就发"}-全部内容.zip`,
    archive_bytes: archiveBlob.size,
    count: livePhotoHandoffState.items.length,
  };
}

async function ensureLivePhotoBatchPrepared() {
  if (livePhotoHandoffState.batch) return livePhotoHandoffState.batch;
  if (livePhotoHandoffState.batchPreparing) return livePhotoHandoffState.batchPreparing;
  const prepare = async () => {
    if (livePhotoHandoffState.liveResults.some((result) => result.provider === "cloud")) {
      const result = await prepareCloudLivePhotoBatch();
      livePhotoHandoffState.batch = result;
      return result;
    }
    const payload = new FormData();
    payload.append("title", projectTitleFromData(readForm()));
    payload.append(
      "jobs",
      JSON.stringify(livePhotoHandoffState.liveResults.map((result) => ({ job_id: result.job_id, page_index: result.pageIndex }))),
    );
    for (const file of livePhotoHandoffState.staticPackage?.files || []) {
      payload.append(`static_${file.pageIndex}`, file.blob, file.filename);
    }
    const response = await fetch(livePhotoApiUrl("/api/live-photo/batch"), { method: "POST", body: payload });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || "批量发布包整理失败。");
    livePhotoHandoffState.batch = result;
    return result;
  };
  livePhotoHandoffState.batchPreparing = prepare().finally(() => {
    livePhotoHandoffState.batchPreparing = null;
  });
  return livePhotoHandoffState.batchPreparing;
}

async function preparePendingLivePhotoHandoffBatch() {
  if (livePhotoHandoffState.prepared) return ensureLivePhotoBatchPrepared();
  const entries = livePhotoHandoffState.pendingEntries;
  if (!entries.length) return ensureLivePhotoBatchPrepared();

  const liveEntries = entries.filter(([, canvas]) => liveImageHitsForCanvas(canvas).length);
  const staticEntries = entries.filter(([, canvas]) => !liveImageHitsForCanvas(canvas).length);
  if (!(await ensureLivePhotoServiceReady())) {
    throw new Error("实况生成服务暂时不可用，请检查网络后重试。");
  }
  const invalid = liveEntries.find(([, canvas]) => liveImageHitsForCanvas(canvas).length > 1);
  if (invalid) throw new Error(`第 ${invalid[0] + 1} 页包含多段实况，请先拆到不同页面。`);

  const completedPageIndexes = [];
  const liveResults = [];
  for (const [position, [pageIndex, canvas]] of liveEntries.entries()) {
    updateLivePhotoHandoffProgressSteps(pageIndex, completedPageIndexes);
    updateExportProgress("handoff", {
      title: "正在生成全部内容",
      detail: `正在处理第 ${pageIndex + 1} / ${entries.length} 页 · 原生 Live Photo`,
      current: completedPageIndexes.length,
      total: entries.length,
      value: 8 + (completedPageIndexes.length / entries.length) * 72,
    });
    const result = await prepareLivePhotoPackageForCanvas(canvas, pageIndex, false, true, (stage, detail, cloudProgress) => {
      const stageRatio = Number.isFinite(cloudProgress)
        ? Math.max(0.1, Number(cloudProgress) / 100)
        : stage === "validate" ? 0.1 : stage === "page" ? 0.35 : 0.68;
      updateExportProgress("handoff", {
        title: "正在生成全部内容",
        detail,
        current: completedPageIndexes.length,
        total: entries.length,
        value: 8 + ((completedPageIndexes.length + stageRatio) / entries.length) * 72,
      });
    });
    liveResults.push(result);
    completedPageIndexes.push(pageIndex);
    const nextLive = liveEntries[position + 1]?.[0];
    const nextStatic = staticEntries[0]?.[0];
    updateLivePhotoHandoffProgressSteps(nextLive ?? nextStatic ?? -1, completedPageIndexes);
  }

  let staticPackage = null;
  if (staticEntries.length) {
    updateLivePhotoHandoffProgressSteps(staticEntries[0][0], completedPageIndexes);
    staticPackage = await prepareStaticCanvasSubset(staticEntries, (progress) => {
      if (progress.type === "page" && !completedPageIndexes.includes(progress.pageIndex)) {
        completedPageIndexes.push(progress.pageIndex);
      }
      const nextStatic = staticEntries.find(([pageIndex]) => !completedPageIndexes.includes(pageIndex))?.[0] ?? -1;
      updateLivePhotoHandoffProgressSteps(nextStatic, completedPageIndexes);
      updateExportProgress("handoff", {
        title: "正在生成全部内容",
        detail: progress.type === "archive"
          ? "全部页面已经生成，正在整理批量发布包…"
          : `正在处理第 ${progress.pageIndex + 1} / ${entries.length} 页 · 高清 PNG`,
        current: completedPageIndexes.length,
        total: entries.length,
        value: progress.type === "archive" ? 84 : 8 + (completedPageIndexes.length / entries.length) * 72,
      });
    });
  }

  livePhotoHandoffState.liveResults = liveResults.sort((a, b) => a.pageIndex - b.pageIndex);
  livePhotoHandoffState.staticPages = staticEntries.map(([pageIndex]) => pageIndex).sort((a, b) => a - b);
  livePhotoHandoffState.staticPackage = staticPackage;
  livePhotoHandoffState.items = [
    ...livePhotoHandoffState.liveResults.map((result) => ({ type: "live", pageIndex: result.pageIndex, result })),
    ...livePhotoHandoffState.staticPages.map((pageIndex) => ({ type: "static", pageIndex })),
  ].sort((a, b) => a.pageIndex - b.pageIndex);
  livePhotoHandoffState.pendingEntries = [];
  livePhotoHandoffState.prepared = true;
  livePhotoHandoffState.batch = null;
  livePhotoHandoffState.batchPreparing = null;
  renderLivePhotoHandoffThumbnails();
  renderLivePhotoHandoffFiles();
  selectLivePhotoHandoffPage(livePhotoHandoffState.items[0]?.pageIndex ?? -1);
  updateLivePhotoHandoffProgressSteps(-1, completedPageIndexes);
  updateExportProgress("handoff", {
    title: "正在整理全部内容",
    detail: "全部页面已经生成，正在准备系统发送…",
    current: entries.length,
    total: entries.length,
    value: 88,
  });
  return ensureLivePhotoBatchPrepared();
}

async function responseBlobWithProgress(response, onProgress = null) {
  const total = Number(response.headers.get("content-length")) || 0;
  if (!response.body?.getReader || total <= 0) return response.blob();
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress?.(loaded, total);
  }
  return new Blob(chunks, { type: response.headers.get("content-type") || "application/octet-stream" });
}

async function revealLivePhotoHandoff() {
  const isBatch = livePhotoHandoffState.isBatch;
  const selected = livePhotoHandoffState.liveResults.find((result) => result.job_id === livePhotoHandoffState.selectedJobId);
  if (selected?.provider === "cloud" || livePhotoHandoffState.batch?.provider === "cloud") {
    els.status.textContent = "云端下载由浏览器保存；请打开浏览器下载列表查看文件。";
    return;
  }
  if (!isBatch && !livePhotoHandoffState.selectedJobId) return;
  let path = "/api/live-photo/reveal";
  let payload = { job_id: livePhotoHandoffState.selectedJobId };
  if (isBatch) {
    const batch = await ensureLivePhotoBatchPrepared();
    path = "/api/live-photo/batch-reveal";
    payload = { batch_id: batch.batch_id };
  }
  const response = await fetch(livePhotoApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    els.status.textContent = result.error || "无法在 Finder 中显示导出内容。";
    return;
  }
  els.status.textContent = isBatch ? "已在 Finder 中显示本次批量导出。" : "已在 Finder 中显示这个实况包。";
}

async function airdropLivePhotoHandoff() {
  if (livePhotoHandoffState.onlineFallback) {
    window.open(LIVE_PHOTO_LOCAL_GUIDE_URL, "_blank", "noopener,noreferrer");
    els.status.textContent = "已打开 macOS 本地版说明；完整 Live Photo 发布包需要在本机生成。";
    return;
  }
  const isBatch = livePhotoHandoffState.isBatch;
  if (!isBatch && !livePhotoHandoffState.selectedJobId) return;
  if (!beginExportProgress("handoff", {
    title: isBatch ? "正在生成全部内容" : "正在打开 AirDrop",
    detail: isBatch ? "完成后将自动打开 AirDrop。" : "正在把实况发布包交给 macOS…",
    value: isBatch ? 5 : 72,
    current: isBatch ? 0 : null,
    total: isBatch ? livePhotoHandoffState.items.length : null,
    activePageIndex: isBatch ? livePhotoHandoffState.items[0]?.pageIndex : -1,
  })) return;
  els.livePhotoHandoffAirdrop.disabled = true;
  els.livePhotoHandoffDownload.disabled = true;
  els.livePhotoHandoffReveal.disabled = true;
  if (window.lucide) window.lucide.createIcons();
  try {
    await waitForExportProgressPaint();
    let path = "/api/live-photo/airdrop";
    let payload = { job_id: livePhotoHandoffState.selectedJobId };
    if (isBatch) {
      const batch = await preparePendingLivePhotoHandoffBatch();
      path = "/api/live-photo/batch-airdrop";
      payload = { batch_id: batch.batch_id };
    }
    updateExportProgress("handoff", {
      title: "正在打开系统 AirDrop",
      detail: isBatch ? `正在发送全部 ${livePhotoHandoffState.items.length} 个项目…` : "正在发送这个实况发布包…",
      current: isBatch ? livePhotoHandoffState.items.length : null,
      total: isBatch ? livePhotoHandoffState.items.length : null,
      value: 97,
    });
    const response = await fetch(livePhotoApiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || "无法打开 AirDrop 分享面板。");
    els.status.textContent = isBatch ? "整批内容已加入 AirDrop，请选择你的 iPhone。" : "AirDrop 分享面板已打开，请选择你的 iPhone。";
    updateExportProgress("handoff", {
      title: "AirDrop 已打开",
      detail: isBatch ? `全部 ${livePhotoHandoffState.items.length} 个项目已交给系统。` : "实况发布包已交给系统。",
      value: 100,
    });
    window.setTimeout(() => resetExportProgress("handoff"), 260);
  } catch (error) {
    els.status.textContent = error?.message || "无法打开 AirDrop 分享面板。";
    finishExportProgress("handoff", { success: false, title: "AirDrop 没有打开", detail: els.status.textContent });
  } finally {
    els.livePhotoHandoffAirdrop.disabled = false;
    els.livePhotoHandoffDownload.disabled = false;
    els.livePhotoHandoffReveal.disabled = isBatch ? !livePhotoHandoffState.batch : !livePhotoHandoffState.selectedJobId;
    els.livePhotoHandoffAirdrop.innerHTML = `<i data-lucide="share"></i>${isBatch ? "AirDrop 全部到手机" : "AirDrop"}`;
    if (window.lucide) window.lucide.createIcons();
  }
}

async function downloadOnlineLivePhotoAsImages() {
  const entries = livePhotoHandoffState.onlineEntries
    .map(([pageIndex, canvas]) => [pageIndex, canvas || state.canvases[pageIndex]])
    .filter(([, canvas]) => canvas);
  if (!entries.length) return;
  if (!beginExportProgress("handoff", {
    title: entries.length > 1 ? "正在生成全部图片版" : "正在生成当前图片版",
    detail: "在线版会把当前画面导出为高清 PNG，不会伪装成 Live Photo。",
    value: 5,
  })) return;

  let completed = false;
  els.livePhotoHandoffDownload.disabled = true;
  els.livePhotoHandoffAirdrop.disabled = true;
  els.livePhotoHandoffReveal.disabled = true;
  els.livePhotoHandoffDownload.innerHTML = '<i data-lucide="loader-circle"></i>正在生成图片版…';
  if (window.lucide) window.lucide.createIcons();

  try {
    if (entries.length === 1) {
      const [pageIndex, canvas] = entries[0];
      updateExportProgress("handoff", {
        title: "正在生成当前图片版",
        detail: `正在把第 ${pageIndex + 1} 页按当前画面导出为高清 PNG…`,
        value: 55,
      });
      const filename = `layout-page-${String(pageIndex + 1).padStart(2, "0")}-static.png`;
      const saved = await downloadCanvas(canvas, filename);
      if (!saved) {
        finishExportProgress("handoff", {
          cancelled: true,
          title: "已取消下载",
          detail: "没有写入任何文件，视频和排版仍保留在当前项目中。",
        });
        return;
      }
    } else {
      const packageResult = await prepareStaticCanvasSubset(entries, (progress) => {
        updateExportProgress("handoff", {
          title: `正在生成图片 ${progress.completed}/${progress.total}`,
          detail: progress.type === "archive" ? "图片已经生成，正在创建 ZIP…" : `第 ${progress.pageIndex + 1} 页已处理。`,
          current: progress.completed,
          total: progress.total,
          value: progress.type === "archive" ? 88 : 10 + (progress.completed / progress.total) * 70,
        });
      });
      updateExportProgress("handoff", { title: "正在保存图片版", detail: "文件已经生成，正在交给浏览器下载…", value: 96 });
      if (packageResult?.type === "zip") {
        await saveBlob(packageResult.blob, "graphic-layout-online-images.zip");
      } else {
        for (const file of packageResult?.files || []) await saveBlob(file.blob, file.filename);
      }
    }

    completed = true;
    els.livePhotoHandoffDownload.innerHTML = '<i data-lucide="check"></i>图片版已下载';
    els.livePhotoHandoffHint.textContent = "下载的是普通图片，不包含“实况”标识；视频素材仍保留在当前项目中。";
    els.status.textContent = entries.length > 1
      ? `已下载 ${entries.length} 页普通图片版；完整 Live Photo 仍需 macOS 本地版生成。`
      : "已下载当前普通图片版；完整 Live Photo 仍需 macOS 本地版生成。";
    finishExportProgress("handoff", {
      title: "普通图片版已下载",
      detail: entries.length > 1 ? `已按原顺序导出 ${entries.length} 页图片。` : "当前页面已经导出为高清 PNG。",
    });
  } catch (error) {
    els.status.textContent = error?.message || "普通图片版导出失败。";
    finishExportProgress("handoff", { success: false, title: "图片版导出失败", detail: els.status.textContent });
  } finally {
    els.livePhotoHandoffDownload.disabled = false;
    els.livePhotoHandoffAirdrop.disabled = false;
    if (!completed) els.livePhotoHandoffDownload.innerHTML = '<i data-lucide="download"></i>下载普通图片版';
    if (window.lucide) window.lucide.createIcons();
  }
}

async function downloadLivePhotoBatch() {
  if (livePhotoHandoffState.onlineFallback) {
    await downloadOnlineLivePhotoAsImages();
    return;
  }
  const isBatch = livePhotoHandoffState.isBatch;
  if (!beginExportProgress("handoff", {
    title: isBatch ? "正在生成全部内容" : "正在准备实况照片",
    detail: isBatch ? "系统正在处理 Live Photo 与普通图片…" : "正在整理完整 .pvt…",
    value: 5,
    current: isBatch ? 0 : null,
    total: isBatch ? livePhotoHandoffState.items.length : null,
    activePageIndex: isBatch ? livePhotoHandoffState.items[0]?.pageIndex : -1,
  })) return;
  els.livePhotoHandoffDownload.disabled = true;
  els.livePhotoHandoffAirdrop.disabled = true;
  els.livePhotoHandoffReveal.disabled = true;
  if (window.lucide) window.lucide.createIcons();
  try {
    await waitForExportProgressPaint();
    const archive = isBatch
      ? await preparePendingLivePhotoHandoffBatch()
      : livePhotoHandoffState.liveResults.find((result) => result.job_id === livePhotoHandoffState.selectedJobId)
        || livePhotoHandoffState.liveResults[0];
    if (!archive?.archive_url && !archive?.archive_blob) {
      throw new Error(isBatch ? "批量下载包没有准备完成。" : "实况下载包没有准备完成，请重新生成。");
    }
    updateExportProgress("handoff", {
      title: isBatch ? "正在下载全部内容" : "正在下载实况照片",
      detail: "下载包已经整理完成，正在传输 ZIP…",
      value: 40,
    });
    let archiveBlob = archive.archive_blob || null;
    if (!archiveBlob) {
      let response = await fetch(archive.archive_url);
      if (!response.ok && archive.provider === "cloud" && archive.cloud_access_token) {
        const refreshed = await cloudApi().getCloudLivePhotoJob(archive.job_id, archive.cloud_access_token);
        archive.archive_url = refreshed.archive_url || archive.archive_url;
        response = await fetch(archive.archive_url);
      }
      if (!response.ok) throw new Error(isBatch ? "批量压缩包下载失败。" : "实况照片压缩包下载失败。");
      archiveBlob = await responseBlobWithProgress(response, (loaded, total) => {
        updateExportProgress("handoff", {
          title: isBatch ? "正在下载全部内容" : "正在下载实况照片",
          detail: `已传输 ${(loaded / 1024 / 1024).toFixed(1)} MB / ${(total / 1024 / 1024).toFixed(1)} MB`,
          value: 40 + (loaded / total) * 50,
        });
      });
    }
    updateExportProgress("handoff", { title: "正在保存下载文件", detail: "传输完成，正在交给浏览器保存…", value: 96 });
    const archiveName = archive.archive_name || (isBatch ? "写了就发-批量导出.zip" : "写了就发-实况照片.zip");
    await saveBlob(archiveBlob, archiveName);
    els.livePhotoHandoffDownload.innerHTML = `<i data-lucide="check"></i>${isBatch ? "全部内容已下载" : "实况照片已下载"}`;
    const cloudArchive = archive.provider === "cloud";
    els.livePhotoHandoffReveal.hidden = cloudArchive;
    els.livePhotoHandoffHint.textContent = "下载已完成。解压 ZIP 后，请保留每个 .pvt 的完整结构。";
    els.status.textContent = isBatch
      ? `已下载 ${livePhotoHandoffState.items.length} 页内容，ZIP 内只包含全部 .pvt 和普通 PNG。`
      : "实况照片 ZIP 已下载，解压后只有一个完整 .pvt。";
    updateLivePhotoHandoffProgressSteps(-1, livePhotoHandoffState.items.map((item) => item.pageIndex));
    finishExportProgress("handoff", {
      title: isBatch ? "全部内容下载完成" : "实况照片下载完成",
      detail: isBatch ? `已处理并下载 ${livePhotoHandoffState.items.length} 页内容。` : "完整实况照片包已经保存。",
    });
  } catch (error) {
    els.livePhotoHandoffDownload.disabled = false;
    els.livePhotoHandoffDownload.innerHTML = `<i data-lucide="download"></i>${isBatch ? "下载全部内容" : "下载实况照片"}`;
    els.status.textContent = error?.message || (isBatch ? "批量下载失败。" : "实况照片下载失败。");
    finishExportProgress("handoff", { success: false, title: isBatch ? "批量下载失败" : "实况照片下载失败", detail: els.status.textContent });
  }
  els.livePhotoHandoffAirdrop.disabled = false;
    const currentResult = livePhotoHandoffState.liveResults.find((result) => result.job_id === livePhotoHandoffState.selectedJobId);
    const cloudArchive = livePhotoHandoffState.batch?.provider === "cloud" || currentResult?.provider === "cloud";
    els.livePhotoHandoffReveal.disabled = cloudArchive || (livePhotoHandoffState.isBatch ? !livePhotoHandoffState.batch : !livePhotoHandoffState.selectedJobId);
  if (window.lucide) window.lucide.createIcons();
}

function renderLivePhotoHandoffThumbnails() {
  els.livePhotoHandoffThumbnails.innerHTML = "";
  for (const item of livePhotoHandoffState.items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "live-photo-handoff-thumbnail";
    button.dataset.handoffPage = String(item.pageIndex);
    button.append(createLivePhotoHandoffPreviewFrame(item.pageIndex, true));
    const label = document.createElement("span");
    label.textContent = `${item.type === "live" ? "实况" : "图片"} ${String(item.pageIndex + 1).padStart(2, "0")}`;
    button.append(label);
    button.addEventListener("click", () => selectLivePhotoHandoffPage(item.pageIndex));
    els.livePhotoHandoffThumbnails.append(button);
  }
}

function applyBatchLivePhotoHandoffCopy(liveCount, staticCount, total) {
  els.livePhotoHandoffTitle.textContent = "下载全部内容";
  els.livePhotoHandoffSummary.textContent = "系统会把实况照片和普通图片一起整理成一个下载包。";
  els.livePhotoHandoffDevice.hidden = true;
  els.livePhotoHandoffCount.textContent = "这个下载包里有什么？";
  els.livePhotoHandoffDetail.textContent = `共 ${total} 页 · ${liveCount} 张实况 · ${staticCount} 张图片`;
  renderLivePhotoHandoffFiles();
  els.livePhotoHandoffAirdrop.hidden = true;
  els.livePhotoHandoffDownload.hidden = false;
  els.livePhotoHandoffDownload.disabled = false;
  els.livePhotoHandoffDownload.innerHTML = '<i data-lucide="download"></i>下载全部内容';
  els.livePhotoHandoffReveal.hidden = true;
  els.livePhotoHandoffReveal.innerHTML = '<i data-lucide="folder-open"></i>在 Finder 中找到';
  els.livePhotoHandoffHint.textContent = "下载的是一个 ZIP 压缩包，解压后即可看到全部文件。";
  els.livePhotoHandoffPreviewHint.hidden = true;
  els.livePhotoHandoffThumbnails.hidden = false;
}

function showPendingLivePhotoBatchHandoff(entries) {
  resetExportProgress("main");
  resetExportProgress("handoff");
  livePhotoHandoffState.onlineFallback = false;
  livePhotoHandoffState.onlineEntries = [];
  livePhotoHandoffState.liveResults = [];
  livePhotoHandoffState.staticPages = entries
    .filter(([, canvas]) => !liveImageHitsForCanvas(canvas).length)
    .map(([pageIndex]) => pageIndex)
    .sort((a, b) => a - b);
  livePhotoHandoffState.staticPackage = null;
  livePhotoHandoffState.selectedJobId = "";
  livePhotoHandoffState.items = entries
    .map(([pageIndex, canvas]) => ({
      type: liveImageHitsForCanvas(canvas).length ? "live" : "static",
      pageIndex,
      result: null,
    }))
    .sort((a, b) => a.pageIndex - b.pageIndex);
  livePhotoHandoffState.isBatch = true;
  livePhotoHandoffState.batch = null;
  livePhotoHandoffState.batchPreparing = null;
  livePhotoHandoffState.pendingEntries = entries.map(([pageIndex, canvas]) => [pageIndex, canvas]);
  livePhotoHandoffState.prepared = false;
  renderLivePhotoHandoffThumbnails();

  const liveCount = livePhotoHandoffState.items.filter((item) => item.type === "live").length;
  const staticCount = livePhotoHandoffState.items.length - liveCount;
  applyBatchLivePhotoHandoffCopy(liveCount, staticCount, livePhotoHandoffState.items.length);
  els.livePhotoHandoffModal.classList.remove("hidden");
  selectLivePhotoHandoffPage(livePhotoHandoffState.items[0]?.pageIndex ?? -1);
  els.status.textContent = `已识别 ${livePhotoHandoffState.items.length} 页内容，可以下载完整 ZIP。`;
  if (window.lucide) window.lucide.createIcons();
}

function showLivePhotoHandoff(liveResults, staticEntries = [], staticPackage = null) {
  resetExportProgress("handoff");
  livePhotoHandoffState.onlineFallback = false;
  livePhotoHandoffState.onlineEntries = [];
  livePhotoHandoffState.liveResults = [...liveResults].sort((a, b) => a.pageIndex - b.pageIndex);
  livePhotoHandoffState.staticPages = staticEntries.map(([index]) => index).sort((a, b) => a - b);
  livePhotoHandoffState.staticPackage = staticPackage;
  livePhotoHandoffState.items = [
    ...livePhotoHandoffState.liveResults.map((result) => ({ type: "live", pageIndex: result.pageIndex, result })),
    ...livePhotoHandoffState.staticPages.map((pageIndex) => ({ type: "static", pageIndex })),
  ].sort((a, b) => a.pageIndex - b.pageIndex);
  livePhotoHandoffState.isBatch = livePhotoHandoffState.items.length > 1;
  livePhotoHandoffState.batch = null;
  livePhotoHandoffState.batchPreparing = null;
  livePhotoHandoffState.pendingEntries = [];
  livePhotoHandoffState.prepared = true;
  renderLivePhotoHandoffThumbnails();
  const liveCount = livePhotoHandoffState.liveResults.length;
  const staticCount = livePhotoHandoffState.staticPages.length;
  const total = livePhotoHandoffState.items.length;
  if (livePhotoHandoffState.isBatch) {
    applyBatchLivePhotoHandoffCopy(liveCount, staticCount, total);
  } else {
    const result = livePhotoHandoffState.liveResults[0];
    els.livePhotoHandoffDevice.hidden = true;
    els.livePhotoHandoffTitle.textContent = "下载实况照片";
    els.livePhotoHandoffSummary.textContent = "这一页会整理成一张可在 iPhone 播放的实况照片。";
    els.livePhotoHandoffCount.textContent = "你会下载到什么？";
    els.livePhotoHandoffDetail.textContent = `1 张实况照片${result.archive_bytes ? ` · ${formatLivePhotoFileSize(result.archive_bytes)}` : ""}`;
    renderLivePhotoHandoffFiles();
    els.livePhotoHandoffAirdrop.hidden = true;
    els.livePhotoHandoffDownload.hidden = false;
    els.livePhotoHandoffDownload.disabled = !result.archive_url;
    els.livePhotoHandoffDownload.innerHTML = `<i data-lucide="download"></i>下载实况照片${result.archive_bytes ? `　${formatLivePhotoFileSize(result.archive_bytes)}` : ""}`;
    els.livePhotoHandoffReveal.hidden = true;
    els.livePhotoHandoffReveal.innerHTML = '<i data-lucide="folder-open"></i>在 Finder 中找到';
    els.livePhotoHandoffHint.textContent = "下载的是一个 ZIP 压缩包，解压后只有一个完整 .pvt 实况照片。";
    els.livePhotoHandoffPreviewHint.hidden = false;
    els.livePhotoHandoffThumbnails.hidden = false;
  }
  els.livePhotoHandoffModal.classList.remove("hidden");
  selectLivePhotoHandoffPage(livePhotoHandoffState.items[0]?.pageIndex ?? -1);
  if (window.lucide) window.lucide.createIcons();
}

function showOnlineLivePhotoFallback(entries) {
  resetExportProgress("main");
  resetExportProgress("handoff");
  livePhotoHandoffState.onlineFallback = true;
  livePhotoHandoffState.onlineEntries = entries;
  livePhotoHandoffState.liveResults = [];
  livePhotoHandoffState.staticPages = [];
  livePhotoHandoffState.staticPackage = null;
  livePhotoHandoffState.selectedJobId = "";
  livePhotoHandoffState.items = entries
    .map(([pageIndex, canvas]) => ({
      type: liveImageHitsForCanvas(canvas).length ? "live" : "static",
      pageIndex,
      result: null,
    }))
    .sort((a, b) => a.pageIndex - b.pageIndex);
  livePhotoHandoffState.isBatch = livePhotoHandoffState.items.length > 1;
  livePhotoHandoffState.batch = null;
  livePhotoHandoffState.batchPreparing = null;
  livePhotoHandoffState.pendingEntries = [];
  livePhotoHandoffState.prepared = false;
  renderLivePhotoHandoffThumbnails();

  const liveCount = livePhotoHandoffState.items.filter((item) => item.type === "live").length;
  const staticCount = livePhotoHandoffState.items.length - liveCount;
  const total = livePhotoHandoffState.items.length;
  els.livePhotoHandoffDevice.hidden = true;
  els.livePhotoHandoffTitle.textContent = "在线实况下载尚未开放";
  els.livePhotoHandoffSummary.textContent = "当前在线站点还没有云端视频处理服务，不能生成完整 .pvt。";
  els.livePhotoHandoffCount.textContent = "暂时只能下载普通图片版";
  els.livePhotoHandoffDetail.textContent = `共 ${total} 页 · ${liveCount} 页包含实况${staticCount ? ` · ${staticCount} 张普通图片` : ""}`;
  renderLivePhotoHandoffFiles();
  els.livePhotoHandoffAirdrop.hidden = true;
  els.livePhotoHandoffDownload.hidden = false;
  els.livePhotoHandoffDownload.disabled = false;
  els.livePhotoHandoffDownload.innerHTML = `<i data-lucide="download"></i>${livePhotoHandoffState.isBatch ? "下载全部图片版" : "下载当前图片版"}`;
  els.livePhotoHandoffReveal.hidden = true;
  els.livePhotoHandoffReveal.disabled = true;
  els.livePhotoHandoffHint.textContent = "这里下载的是普通 PNG，不会显示“实况”标识。";
  els.livePhotoHandoffPreviewHint.hidden = livePhotoHandoffState.isBatch;
  els.livePhotoHandoffThumbnails.hidden = false;
  els.livePhotoHandoffModal.classList.remove("hidden");
  selectLivePhotoHandoffPage(livePhotoHandoffState.items[0]?.pageIndex ?? -1);
  els.status.textContent = "在线版可以预览实况，但云端 .pvt 生成服务尚未接通。";
  if (window.lucide) window.lucide.createIcons();
}

async function exportCanvasAutomatically(canvas, filename, pageIndex) {
  if (blockBuiltInGuideDownload()) return;
  const hits = liveImageHitsForCanvas(canvas);
  if (hits.length && needsLivePhotoStaticFallback()) {
    showOnlineLivePhotoFallback([[pageIndex, canvas]]);
    return;
  }
  if (!beginExportProgress("main", {
    title: hits.length ? `正在处理第 ${pageIndex + 1} 页实况` : `正在导出第 ${pageIndex + 1} 张图片`,
    detail: "正在准备页面素材…",
    value: 5,
  })) return;
  if (!hits.length) {
    updateExportProgress("main", { title: `正在导出第 ${pageIndex + 1} 张图片`, detail: "请选择保存位置，随后会生成高清 PNG。", value: 55 });
    const saved = await downloadCanvas(canvas, filename);
    finishExportProgress("main", {
      success: saved,
      cancelled: !saved,
      title: saved ? "图片导出完成" : "图片导出已取消",
      detail: saved ? filename : "没有写入或下载任何文件。",
    });
    return;
  }
  els.status.textContent = `正在生成第 ${pageIndex + 1} 页 Live Photo 发布包…`;
  try {
    const result = await prepareLivePhotoPackageForCanvas(canvas, pageIndex, false, false, (stage, detail, cloudProgress) => {
      updateExportProgress("main", {
        title: `正在处理第 ${pageIndex + 1} 页实况`,
        detail,
        value: Number.isFinite(cloudProgress)
          ? 8 + Number(cloudProgress) * 0.84
          : stage === "validate" ? 12 : stage === "page" ? 32 : 62,
      });
    });
    updateExportProgress("main", { title: "正在打开实况导出面板", detail: "Live Photo 发布包已经生成。", value: 95 });
    showLivePhotoHandoff([result]);
    els.status.textContent = result.provider === "cloud"
      ? `第 ${pageIndex + 1} 页云端实况包已生成，可以直接下载。`
      : `第 ${pageIndex + 1} 页实况包已生成，可在电脑中显示或直接 AirDrop。`;
    finishExportProgress("main", {
      title: "Live Photo 已生成",
      detail: result.provider === "cloud"
        ? "导出面板已经打开，可以下载完整实况包。"
        : "导出面板已经打开，可以在电脑中显示或 AirDrop。",
    });
  } catch (error) {
    els.status.textContent = error?.message || "Live Photo 发布包生成失败。";
    finishExportProgress("main", {
      success: false,
      title: "Live Photo 生成失败",
      detail: error?.message || "请检查网络或实况服务后重试。",
    });
  }
}

async function downloadCanvas(canvas, filename) {
  const writable = await chooseSaveTarget(filename, EXPORT_IMAGE_MIME, EXPORT_IMAGE_EXTENSION);
  if (writable === false) {
    els.status.textContent = "已取消下载";
    return false;
  }
  const blob = await canvasToLosslessPngBlob(canvas);
  if (!blob) {
    els.status.textContent = "图片生成失败，请调整内容后再试";
    return false;
  }
  await saveBlob(blob, filename, writable);
  els.status.textContent = writable ? `已保存 ${filename}` : `已交给浏览器下载 ${filename}`;
  return true;
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
  if (blockBuiltInGuideDownload()) return;
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

  if (!beginExportProgress("main", {
    title: "正在生成长文图片",
    detail: "正在准备完整文章画面…",
    value: 5,
  })) return;

  const filename = "write-then-publish-article.png";
  try {
    updateExportProgress("main", { title: "请选择保存位置", detail: "确认后会开始生成高清长图。", value: 18 });
    const writable = await chooseSaveTarget(filename, EXPORT_IMAGE_MIME, EXPORT_IMAGE_EXTENSION);
    if (writable === false) {
      els.status.textContent = "已取消下载";
      finishExportProgress("main", { cancelled: true, title: "长图下载已取消", detail: "没有写入任何文件。" });
      return;
    }

    els.status.textContent = "正在生成长图...";
    updateExportProgress("main", { title: "正在渲染完整长文", detail: "正在合成长文主题、文字和图片…", value: 42 });
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
    updateExportProgress("main", { title: "正在生成 PNG", detail: "长文画面已渲染，正在转换为高清图片…", value: 82 });
    const blob = await canvasToLosslessPngBlob(canvas);
    if (!blob) throw new Error("长图生成失败，请调整内容后再试");
    updateExportProgress("main", { title: "正在保存长图", detail: "图片已经生成，正在写入下载位置…", value: 96 });
    await saveBlob(blob, filename, writable);
    els.status.textContent = writable ? `已保存 ${filename}` : `已交给浏览器下载 ${filename}`;
    finishExportProgress("main", { title: "长图下载完成", detail: els.status.textContent });
  } catch (error) {
    els.status.textContent = error?.message || "长图下载失败，请稍后重试";
    finishExportProgress("main", { success: false, title: "长图下载失败", detail: els.status.textContent });
  }
}

function canvasToLosslessPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("图片生成失败，请刷新页面后重试。"));
      }, EXPORT_IMAGE_MIME);
    } catch (error) {
      if (error?.name === "SecurityError" || /tainted canvas/i.test(String(error?.message || ""))) {
        reject(new Error("当前内容包含浏览器不允许导出的网络图片。请重新上传头像或相关图片后再试。"));
        return;
      }
      reject(error);
    }
  });
}

async function isZipBlob(blob) {
  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  return header[0] === 0x50 && header[1] === 0x4b && (header[2] === 0x03 || header[2] === 0x05 || header[2] === 0x07);
}

async function downloadCanvasesIndividually(onProgress = null) {
  for (const [index, canvas] of state.canvases.entries()) {
    const filename = `layout-page-${String(index + 1).padStart(2, "0")}.png`;
    await downloadCanvas(canvas, filename);
    onProgress?.(index + 1, state.canvases.length);
  }
}

async function prepareStaticCanvasSubset(entries, onProgress = null) {
  if (!entries.length) return null;
  const files = [];
  for (const [index, canvas] of entries) {
    const blob = await canvasToLosslessPngBlob(canvas);
    if (!blob) throw new Error(`第 ${index + 1} 页 PNG 生成失败。`);
    files.push({ blob, filename: `layout-page-${String(index + 1).padStart(2, "0")}.png`, pageIndex: index });
    onProgress?.({ type: "page", pageIndex: index, completed: files.length, total: entries.length });
  }
  if (!window.JSZip) {
    return { type: "files", files, count: entries.length };
  }
  const zip = new window.JSZip();
  for (const file of files) {
    zip.file(file.filename, file.blob);
  }
  onProgress?.({ type: "archive", completed: files.length, total: entries.length });
  const blob = await zip.generateAsync({
    type: "blob",
    compression: EXPORT_ZIP_COMPRESSION,
    mimeType: "application/zip",
  });
  if (!(await isZipBlob(blob))) throw new Error("普通图片压缩包生成异常。");
  return { type: "zip", blob, filename: "graphic-layout-static-pages.zip", files, count: entries.length };
}

async function downloadAll() {
  if (blockBuiltInGuideDownload()) return;
  if (!state.canvases.length) return;
  const entries = state.canvases.map((canvas, index) => [index, canvas]);
  const liveEntries = entries.filter(([, canvas]) => liveImageHitsForCanvas(canvas).length);
  if (liveEntries.length && needsLivePhotoStaticFallback()) {
    showOnlineLivePhotoFallback(entries);
    return;
  }
  if (liveEntries.length) {
    showPendingLivePhotoBatchHandoff(entries);
    return;
  }
  if (!beginExportProgress("main", {
    title: "正在准备批量导出",
    detail: "正在识别普通图片和 Live Photo…",
    value: 5,
  })) return;

  if (!window.JSZip) {
    els.status.textContent = "当前环境不支持打包，将逐张下载";
    await downloadCanvasesIndividually((current, total) => {
      updateExportProgress("main", {
        title: `正在逐张下载 ${current}/${total}`,
        detail: `已处理 ${current} 张图片。`,
        current,
        total,
        value: 10 + (current / total) * 80,
      });
    });
    finishExportProgress("main", { title: "图片已逐张处理", detail: `共处理 ${state.canvases.length} 张图片。` });
    return;
  }

  const zipFilename = "graphic-layout-pages.zip";
  els.status.textContent = "正在打包图片...";
  try {
    const zip = new window.JSZip();
    for (const [index, canvas] of state.canvases.entries()) {
      updateExportProgress("main", {
        title: `正在生成高清图片 ${index + 1}/${state.canvases.length}`,
        detail: `正在处理第 ${index + 1} 页…`,
        current: index,
        total: state.canvases.length,
        value: 10 + (index / state.canvases.length) * 65,
      });
      const blob = await canvasToLosslessPngBlob(canvas);
      if (!blob) {
        els.status.textContent = "图片生成失败，请调整内容后再试";
        finishExportProgress("main", { success: false, title: "图片生成失败", detail: els.status.textContent });
        return;
      }
      const filename = `layout-page-${String(index + 1).padStart(2, "0")}.png`;
      zip.file(filename, blob);
      updateExportProgress("main", {
        title: `已生成高清图片 ${index + 1}/${state.canvases.length}`,
        detail: `第 ${index + 1} 页已经处理完成。`,
        current: index + 1,
        total: state.canvases.length,
        value: 10 + ((index + 1) / state.canvases.length) * 65,
      });
    }
    updateExportProgress("main", { title: "正在压缩下载文件", detail: "所有图片已经生成，正在创建 ZIP 压缩包…", value: 85 });
    const blob = await zip.generateAsync({
      type: "blob",
      compression: EXPORT_ZIP_COMPRESSION,
      mimeType: "application/zip",
    });

    if (!(await isZipBlob(blob))) {
      els.status.textContent = "打包文件异常，已改为逐张下载";
      await downloadCanvasesIndividually();
      finishExportProgress("main", { success: false, title: "ZIP 打包异常", detail: "已改为逐张下载图片。" });
      return;
    }

    updateExportProgress("main", { title: "正在保存批量文件", detail: "ZIP 已生成，正在交给浏览器下载…", value: 96 });
    await saveBlob(blob, zipFilename);
    els.status.textContent = `已下载 ${state.canvases.length} 张图片压缩包`;
    finishExportProgress("main", { title: "批量下载完成", detail: els.status.textContent });
  } catch (error) {
    console.error(error);
    els.status.textContent = "打包失败，已改为逐张下载";
    await downloadCanvasesIndividually();
    finishExportProgress("main", { success: false, title: "批量打包失败", detail: "已尝试改为逐张下载图片。" });
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
  document.addEventListener("keydown", handlePreviewImageDeleteKey);
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
  els.contentVideo.addEventListener("change", handleLivePhotoVideo);
  els.connectObsidianVault?.addEventListener("click", connectObsidianVault);
  els.syncObsidianVault?.addEventListener("click", syncCurrentNoteToObsidian);
  els.obsidianVaultFolder?.addEventListener("change", handleObsidianVaultFolder);
  els.applyImageWidth?.addEventListener("click", applyImageWidthToAll);
  els.applyFixedImageSize?.addEventListener("click", applyFixedImageSizeToAll);
  els.avatarInput.addEventListener("change", handleAvatar);
  els.cropAvatar.addEventListener("click", () => openCropper("avatar"));
  els.cropClose.addEventListener("click", closeCropper);
  els.cropApply.addEventListener("click", applyCropper);
  els.cropReset.addEventListener("click", resetCropperTarget);
  els.cropModal.addEventListener("click", (event) => {
    if (event.target === els.cropModal) closeCropper();
  });
  els.wechatModal.addEventListener("click", (event) => {
    if (event.target === els.wechatModal) closeWechatModal();
  });
  els.livePhotoModal.addEventListener("click", (event) => {
    if (event.target === els.livePhotoModal) closeLivePhotoModal();
  });
  els.accountModal.addEventListener("click", (event) => {
    if (event.target === els.accountModal) closeAccountModal();
  });
  els.welcomeBackModal?.addEventListener("click", (event) => {
    if (event.target === els.welcomeBackModal) closeWelcomeBack();
  });
  els.livePhotoHandoffModal.addEventListener("click", (event) => {
    if (event.target === els.livePhotoHandoffModal) closeLivePhotoHandoff();
  });
  els.wechatClose.addEventListener("click", closeWechatModal);
  els.wechatCancel.addEventListener("click", closeWechatModal);
  els.wechatTitle.addEventListener("input", updateWechatConfirmState);
  els.wechatCover.addEventListener("change", handleWechatCover);
  els.wechatConfirm.addEventListener("click", syncArticleToWechatDraft);
  els.livePhotoClose.addEventListener("click", closeLivePhotoModal);
  els.livePhotoCancel.addEventListener("click", closeLivePhotoModal);
  els.livePhotoHandoffClose.addEventListener("click", closeLivePhotoHandoff);
  els.livePhotoHandoffCancel.addEventListener("click", closeLivePhotoHandoff);
  els.livePhotoHandoffReveal.addEventListener("click", revealLivePhotoHandoff);
  els.livePhotoHandoffAirdrop.addEventListener("click", airdropLivePhotoHandoff);
  els.livePhotoHandoffDownload.addEventListener("click", downloadLivePhotoBatch);
  els.onboardingSkip.addEventListener("click", finishOnboarding);
  els.onboardingNext.addEventListener("click", advanceOnboarding);
  els.welcomeBackClose?.addEventListener("click", () => closeWelcomeBack());
  els.welcomeBackDirect?.addEventListener("click", () => closeWelcomeBack());
  els.welcomeBackTour?.addEventListener("click", () => closeWelcomeBack({ startTour: true }));
  els.account.addEventListener("click", toggleAccountMenu);
  els.accountMenuLogin?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openAccountModal();
  });
  els.accountMenuManage?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openAccountModal();
  });
  els.accountMenuSignOut?.addEventListener("click", signOutAccount);
  els.accountMenuWhatsNew?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeAccountMenu();
    startWhatsNewTour();
  });
  els.chooseGuest?.addEventListener("click", () => void chooseGuestMode());
  els.chooseLogin?.addEventListener("click", chooseLoginMode);
  els.accountClose.addEventListener("click", closeAccountModal);
  els.accountAuthForm.addEventListener("submit", submitAccountAuth);
  els.accountSignInMode.addEventListener("click", () => setAccountAuthMode("signin"));
  els.accountSignUp.addEventListener("click", () => setAccountAuthMode("signup"));
  els.accountPasswordToggle?.addEventListener("click", () => {
    setAccountPasswordVisible(els.accountPassword.type === "password");
    els.accountPassword.focus();
  });
  els.accountResendConfirmation.addEventListener("click", resendAccountConfirmation);
  els.accountSignOut.addEventListener("click", signOutAccount);
  els.accountImportLocal.addEventListener("click", importLocalProjectsToAccount);
  document.addEventListener("pointerdown", (event) => {
    if (accountMenuIsOpen() && !els.accountDock?.contains(event.target)) closeAccountMenu();
  });
  window.addEventListener("resize", positionOnboardingStep);
  window.addEventListener("scroll", positionOnboardingStep, true);
  els.livePhotoForm.addEventListener("submit", applyLivePhotoAsset);
  els.livePhotoVideoInput.addEventListener("change", handleLivePhotoVideo);
  els.livePhotoVideo.addEventListener("loadedmetadata", handleLivePhotoMetadata);
  els.livePhotoVideo.addEventListener("timeupdate", keepLivePhotoPreviewInRange);
  els.livePhotoVideo.addEventListener("play", animateLivePhotoCropper);
  els.livePhotoVideo.addEventListener("seeked", drawLivePhotoCropper);
  els.livePhotoCropCanvas.addEventListener("pointerdown", startLivePhotoCropDrag);
  els.livePhotoCropCanvas.addEventListener("pointermove", moveLivePhotoCropDrag);
  els.livePhotoCropCanvas.addEventListener("pointerup", stopLivePhotoCropDrag);
  els.livePhotoCropCanvas.addEventListener("pointercancel", stopLivePhotoCropDrag);
  els.livePhotoPlatformButtons.forEach((button) => {
    button.addEventListener("click", () => setLivePhotoPlatform(button.dataset.livePlatform));
  });
  els.livePhotoRatioButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setLivePhotoAspect(button.dataset.liveRatio);
      updateLivePhotoPreview();
    });
  });
  els.livePhotoCustomRatio.addEventListener("input", () => {
    livePhotoState.customAspect = clamp(finiteNumber(els.livePhotoCustomRatio.value, 0.75), 0.4, 2.5);
    els.livePhotoCustomRatioOutput.value = livePhotoState.customAspect.toFixed(2);
    if (livePhotoState.aspect === "free") {
      setLivePhotoAspect("free");
      updateLivePhotoPreview();
    }
  });
  els.livePhotoStart.addEventListener("input", () => {
    normalizeLivePhotoTiming();
    seekLivePhotoPreview(false);
  });
  els.livePhotoCover.addEventListener("input", () => seekLivePhotoPreview(true));
  els.ratioButtons.forEach((button) => {
    button.addEventListener("click", () => setCropAspect(button.dataset.ratio));
  });
  els.cropCanvas.addEventListener("mousedown", startCropDrag);
  window.addEventListener("mousemove", moveCropDrag);
  window.addEventListener("mouseup", stopCropDrag);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.cropModal.classList.contains("hidden")) closeCropper();
    if (event.key === "Escape" && !els.wechatModal.classList.contains("hidden")) closeWechatModal();
    if (event.key === "Escape" && !els.livePhotoModal.classList.contains("hidden")) closeLivePhotoModal();
    if (event.key === "Escape" && !els.livePhotoHandoffModal.classList.contains("hidden")) closeLivePhotoHandoff();
    if (event.key === "Escape" && !els.accountModal.classList.contains("hidden")) closeAccountModal();
    if (event.key === "Escape" && welcomeBackIsOpen()) closeWelcomeBack();
    if (event.key === "Escape" && accountMenuIsOpen()) closeAccountMenu();
  });
  els.findNext.addEventListener("click", findNext);
  els.replaceOne.addEventListener("click", replaceCurrent);
  els.replaceAll.addEventListener("click", replaceAll);
  els.historyToggle.addEventListener("click", toggleHistory);
  els.historyClose.addEventListener("click", () => setHistoryOpen(false));
  els.historyFilterButtons.forEach((button) => {
    button.addEventListener("click", () => setHistoryFilter(button.dataset.historyFilter));
  });
  els.newProject.addEventListener("click", async () => {
    await createNewProject();
    if (onboardingMode === "first-run" && onboardingIsOpen() && onboardingStepIndex === 0) showOnboardingStep(1);
  });
  els.convertMode.addEventListener("click", convertCurrentMode);
  els.headerModeToggle.addEventListener("click", toggleHeaderMode);
  els.themeToggle.addEventListener("click", toggleUiTheme);
  els.downloadZip.addEventListener("click", downloadAll);
  els.downloadArticle.addEventListener("click", downloadArticleImage);
  els.copyWechat.addEventListener("click", copyArticleToWechat);
  els.syncWechat.addEventListener("click", openWechatModal);
}

if (cloudApi()?.configured) document.body.classList.add("cloud-session-checking");
loadPanelLayout();
applyPanelLayout();
const initialFormState = loadState();
applyForm(initialFormState);
syncGuideReadOnlyMode();
resetTextHistory();
updateProjectHistory();
bindEvents();
void loadObsidianVaultConnection();
void initializeCloudAccount();
if (window.lucide) {
  window.lucide.createIcons();
}
