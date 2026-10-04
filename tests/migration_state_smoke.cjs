const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("src/app.js", "utf8");
function section(start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `missing ${start}`);
  return source.slice(first, last);
}

const storage = new Map();
const projects = Array.from({ length: 17 }, (_, index) => ({
  id: `old-${index}`,
  title: `旧稿 ${index + 1}`,
  updatedAt: 1000 + index,
}));
const cloudState = {
  user: { id: "test-user" }, legacyProjects: [], legacyProjectsStatus: "loading",
  migrationReceipts: {}, migrationBusy: false,
};
const els = {
  migrationTestControls: { hidden: true },
  migrationTestOpen: { innerHTML: "" },
  migrationTestSignOut: { hidden: true, disabled: false },
  cloudMigrationRefresh: { disabled: false },
  cloudMigrationStatus: { textContent: "" },
  accountSyncStatus: { textContent: "" },
};
let listProjects = async () => projects;
let getProfile = async () => ({ display_name: "测试账号" });
const context = {
  ACCOUNT_MAINTENANCE: true, LOCAL_DEPLOYMENT_MODE: false,
  MIGRATION_RECEIPTS_KEY: "migration.test", cloudState, els,
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => { storage.set(key, value); },
  },
  isMigrationTestUser: () => true,
  cloudIsReady: () => true,
  cloudApi: () => ({ configured: true, listProjects: () => listProjects(), getProfile: () => getProfile() }),
  cloudProjectFromRow: (row) => row,
  renderCloudMigrationList: () => {},
  updateMigrationAllButton: () => {},
  updateCloudMigrationStatus: () => {},
  updateAccountUi: () => {}, setAccountBusy: () => {}, setAccountNotice: () => {},
  loadProjectStoreForScope: () => ({ projects: [] }), MAX_PROJECTS: 24,
  accountScope: (id) => `user_${id}`,
  activateWorkspaceScope: async () => { context.activeStorageScope = "user_test-user"; },
  isCloudRestrictedMessage: () => false, activeStorageScope: "guest",
  window: {}, console: { error: () => {} },
};
vm.createContext(context);
vm.runInContext([
  section("function updateMigrationTestUi()", "function openAccountModal()"),
  section("async function loadCloudWorkspace(", "async function handleCloudSession("),
  section("async function refreshCloudMigrationList()", "function openCloudMigrationModal()"),
].join("\n"), context);

(async () => {
  context.updateMigrationTestUi();
  assert.match(els.migrationTestOpen.innerHTML, /读取中/);
  assert.doesNotMatch(els.migrationTestOpen.innerHTML, /0 篇/);

  await context.refreshCloudMigrationList();
  assert.equal(cloudState.legacyProjectsStatus, "ready");
  assert.match(els.migrationTestOpen.innerHTML, /17 篇/);

  context.recordMigrationReceipt(projects[0], "2026-10-03_旧稿1");
  context.recordMigrationFailure(projects[1], "图片 sample 读取失败");
  context.recordMigrationFolderSave(projects[2], "我的迁移文件夹", "旧稿-01.zip");
  context.updateMigrationTestUi();
  assert.match(els.migrationTestOpen.innerHTML, /已保存 2\/17 篇/);
  assert.equal(context.incompleteMigrationCount(), 1);
  assert.equal(context.writtenMigrationCount(), 1);
  assert.equal(context.loadMigrationReceipts("test-user")[projects[0].id].folderName, "2026-10-03_旧稿1");
  assert.equal(context.loadMigrationReceipts("test-user")[projects[2].id].state, "written");
  context.recordMigrationFailure(projects[2], "重试时网络断开");
  assert.equal(context.writtenMigrationCount(), 1, "later retry failure cannot erase an already saved ZIP");

  listProjects = async () => projects;
  await context.refreshCloudMigrationList();
  assert.match(els.migrationTestOpen.innerHTML, /已保存 2\/17 篇/, "refresh keeps saved state");
  assert.equal(context.incompleteMigrationCount(), 1, "refresh keeps failed state");
  cloudState.migrationReceipts = context.loadMigrationReceipts("test-user");
  assert.equal(context.writtenMigrationCount(), 1, "new page can restore selected-folder write state");

  listProjects = async () => { throw new Error("network error"); };
  await context.refreshCloudMigrationList();
  assert.equal(cloudState.legacyProjectsStatus, "error");
  assert.match(els.migrationTestOpen.innerHTML, /读取失败/);
  assert.doesNotMatch(els.migrationTestOpen.innerHTML, /0 篇/);

  listProjects = async () => projects;
  getProfile = async () => { throw new Error("profile temporarily unavailable"); };
  await context.loadCloudWorkspace({ user: { id: "test-user", email: "test@example.com" } });
  context.updateMigrationTestUi();
  assert.equal(cloudState.legacyProjectsStatus, "ready", "profile failure does not hide a successful project list");
  assert.match(els.migrationTestOpen.innerHTML, /已保存 2\/17 篇/);
  context.ACCOUNT_MAINTENANCE = false;
  getProfile = async () => ({ display_name: "测试账号" });
  let projectReads = 0;
  listProjects = async () => { projectReads += 1; throw new Error("must not read old drafts after cutoff"); };
  await context.loadCloudWorkspace({ user: { id: "test-user", email: "test@example.com" } });
  assert.equal(projectReads, 0);
  assert.equal(cloudState.legacyProjectsStatus, "closed");
  assert.equal(cloudState.legacyProjects.length, 0);
  assert.match(els.accountSyncStatus.textContent, /仅头像、昵称/);
  console.log("OK: counts and receipts survive refresh; after cutoff only the profile loads, without requesting cloud drafts");
})().catch((error) => { console.error(error); process.exitCode = 1; });
