const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/app.js', 'utf8');
function section(start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `missing ${start}`);
  return source.slice(first, last);
}
const clone = value => JSON.parse(JSON.stringify(value));
const key = 'projects.guest';
const draft = (id, content, updatedAt) => ({ id, title: id, updatedAt, data: { content, images: {} } });
function workspace(local = new Map(), session = new Map()) {
  let form = { content: '', images: {} }, nextId = 0;
  const classes = new Set(['history-disabled']);
  const ctx = {
    activeStorageScope: 'guest', PROJECTS_STORAGE_KEY: 'projects', STORAGE_KEY: 'current',
    CUSTOM_COLOR_PALETTE_STORAGE_KEY: 'palette', normalizeCustomColorPalette: value => value || { color: [], bg: [] },
    GUIDE_CARDS_PROJECT_ID: 'guide-cards', MAX_PROJECTS: 24, quota: false,
    state: { projects: [], currentProjectId: 'guide-cards' }, els: { status: {} },
    localStorage: {
      getItem: k => local.get(k) ?? null,
      setItem(k, value) { if (ctx.quota) throw new Error('QuotaExceededError'); local.set(k, value); },
    },
    sessionStorage: { getItem: k => session.get(k) ?? null, removeItem: k => session.delete(k) },
    document: { body: { classList: { remove: name => classes.delete(name) } } },
    readForm: () => clone(form), applyForm: data => { form = clone(data); },
    normalizeProject: project => clone(project),
    createProject: data => draft(`new-${++nextId}`, data.content, Date.now()),
    blankFormState: () => ({ content: '', images: {} }),
    projectTitleFromData: data => data.content.split('\n')[0],
    isBuiltInProjectId: id => String(id).startsWith('guide-'),
    isBuiltInProject: project => String(project.id).startsWith('guide-'),
    builtInGuideProjects: () => [{ id: 'guide-cards', title: '说明书' }],
    withExternalizedImages: data => data,
    saveAuthorProfile() {}, updateProjectHistory() {}, resetTextHistory() {}, syncGuideReadOnlyMode() {},
    cloudIsReady: () => false,
    findHistoryProject: id => ctx.state.projects.find(project => project.id === id),
    setHistoryOpen(value) { ctx.historyOpen = value; },
    render: async () => { ctx.saveState(); },
  };
  vm.createContext(ctx);
  vm.runInContext([
    section('function scopedStorageKey(', 'function livePhotoApiUrl('),
    section('function allHistoryProjects()', 'function findHistoryProject('),
    section('function saveState()', 'function loadState()'),
    section('function syncHistoryAvailability()', 'async function activateWorkspaceScope('),
    section('function migrateGuestDraftsFromSession()', 'function normalizeProject('),
    section('function saveProjectStore(', 'function projectTitleFromData('),
    section('async function openProject(', 'async function deleteProject('),
    section('async function createNewProject()', 'const FIRST_RUN_ONBOARDING_STEPS'),
    section('function loadCustomColorPalette()', 'function rememberCustomColor('),
  ].join('\n'), ctx);
  return {
    ctx, classes,
    load() {
      const stored = ctx.loadProjectStore();
      ctx.state.projects = stored.projects;
      ctx.state.currentProjectId = stored.activeId;
      ctx.applyForm(stored.projects.find(project => project.id === stored.activeId)?.data || { content: '', images: {} });
      return stored;
    },
    edit(content) { form.content = content; },
    content: () => form.content,
  };
}
(async () => {
  const local = new Map([[key, JSON.stringify({ activeId: 'b', projects: [draft('b', '乙正文', 2), draft('a', '甲旧内容', 1)] })]]);
  const session = new Map([[key, JSON.stringify({ activeId: 'a', projects: [draft('a', '甲最新内容', 3)] })]]);
  local.set('projects.user_other', JSON.stringify({ activeId: 'private', projects: [draft('private', '其他账号的草稿', 1)] }));
  const app = workspace(local, session);
  session.set('palette.guest', JSON.stringify({ color: ['#123456'], bg: [] }));
  assert.equal(app.ctx.loadCustomColorPalette().color[0], '#123456');
  assert.equal(JSON.parse(local.get('palette.guest')).color[0], '#123456', 'keep custom colors when moving guest storage to disk');
  assert.equal(app.load().projects.length, 2, 'merge old guest session into the persistent draft list');
  const historyIds = app => Array.from(app.ctx.allHistoryProjects(), project => project.id);
  assert.deepEqual(historyIds(app), ['b', 'a', 'guide-cards'], 'keep the stored order while recovering newer contents');
  assert.equal(app.content(), '甲最新内容', 'prefer the newer copy of the same draft');
  assert.equal(session.has(key), false, 'remove the session index only after durable write succeeds');
  app.ctx.syncHistoryAvailability();
  assert.equal(app.classes.has('history-disabled'), false, 'sidebar remains available without login');
  app.edit('甲刚输入还没等自动保存的内容');
  await app.ctx.openProject('b');
  assert.equal(app.content(), '乙正文');
  assert.equal(JSON.parse(local.get(key)).projects.find(project => project.id === 'a').data.content, '甲刚输入还没等自动保存的内容');
  app.edit('乙修改后的内容');
  await app.ctx.openProject('a');
  assert.equal(app.content(), '甲刚输入还没等自动保存的内容', 'switching back restores the first draft');
  assert.equal(app.ctx.state.projects.find(project => project.id === 'b').data.content, '乙修改后的内容');
  assert.deepEqual(historyIds(app), ['b', 'a', 'guide-cards'], 'editing and switching must not reorder drafts');

  const reopened = workspace(local);
  assert.equal(reopened.load().projects.length, 2, 'drafts survive a new tab/session');
  assert.deepEqual(historyIds(reopened), ['b', 'a', 'guide-cards'], 'keep the same order after reopening');
  assert.equal(reopened.content(), '甲刚输入还没等自动保存的内容');
  await reopened.ctx.openProject('b');
  assert.equal(reopened.content(), '乙修改后的内容');
  reopened.edit('空间不足时留在编辑器的文字');
  reopened.ctx.quota = true;
  await reopened.ctx.openProject('a');
  assert.equal(reopened.ctx.state.currentProjectId, 'b', 'a failed save must not switch away');
  assert.equal(reopened.content(), '空间不足时留在编辑器的文字');
  assert.match(reopened.ctx.els.status.textContent, /暂未保存/);

  const oldSession = new Map([[key, JSON.stringify({ activeId: 'legacy', projects: [draft('legacy', '未迁移的会话稿', 1)] })]]);
  const failedMigration = workspace(new Map(), oldSession);
  failedMigration.ctx.quota = true;
  assert.equal(failedMigration.load().projects[0].id, 'legacy', 'failed migration can still open the old draft in memory');
  assert.equal(oldSession.has(key), true, 'failed migration leaves the old session recoverable');

  reopened.ctx.quota = false;
  reopened.ctx.activeStorageScope = 'user_other';
  assert.equal(reopened.load().projects.length, 1);
  assert.equal(reopened.content(), '其他账号的草稿', 'guest migration does not mix account workspaces');

  const full = workspace(new Map([[key, JSON.stringify({ activeId: 'p0', projects: Array.from({ length: 24 }, (_, i) => draft(`p${i}`, `正文 ${i}`, i + 1)) })]]));
  full.load();
  await full.ctx.createNewProject();
  assert.equal(full.ctx.state.projects.length, 24);
  assert.match(full.ctx.els.status.textContent, /已达 24 篇/);
  assert.ok(full.ctx.state.projects.some(project => project.id === 'p23'), 'capacity must not silently evict an older draft');
  const oversized = workspace(new Map([[key, JSON.stringify({ activeId: 'p0', projects: Array.from({ length: 25 }, (_, i) => draft(`p${i}`, `旧正文 ${i}`, i + 1)) })]]));
  oversized.load();
  oversized.ctx.saveState();
  assert.equal(oversized.ctx.state.projects.length, 25, 'already stored drafts are never truncated during read/save');
  console.log('OK: local drafts persist and switch independently; legacy guest migration is safe; failures and capacity preserve existing drafts');
})().catch(error => { console.error(error); process.exitCode = 1; });
