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

const receipts = new Map();
const failures = new Map();
const cloudState = {
  user: { id: "test-user" }, legacyProjectsStatus: "ready", migrationBusy: false,
  legacyProjects: [
    { id: "2026-10-01_第一篇", title: "第一篇", updatedAt: 1000 },
    { id: "2026-10-02_第二篇", title: "第二篇", updatedAt: 1000 },
    { id: "2026-10-03_第三篇", title: "第三篇", updatedAt: 1000 },
  ],
};
const els = { cloudMigrationStatus: { textContent: "" } };
const context = {
  Blob, Array, Map, Object, Number, JSON, String, Error, cloudState, els,
  cloudIsReady: () => true,
  setMigrationBusy: (busy) => { cloudState.migrationBusy = busy; },
  recordMigrationReceipt: (project, name) => { receipts.set(project.id, name); return true; },
  recordMigrationFailure: (project, reason) => { failures.set(project.id, reason); return true; },
  renderCloudMigrationList: () => {}, updateMigrationAllButton: () => {}, updateMigrationTestUi: () => {},
  savedMigrationCount: () => receipts.size,
  incompleteMigrationCount: () => failures.size,
};
vm.createContext(context);
vm.runInContext([
  section("async function inspectPortableProject(", "async function importPortableProject("),
  section("async function inspectPortableFolder(", "function setPortableImportStatus("),
  section("async function migrationFailuresFromSummary(", "async function migrateAllCloudProjects("),
].join("\n"), context);

function original(folder, title) {
  const root = `写了就发旧稿-2026-10-03/${folder}/`;
  const gif = new Blob([Buffer.from("4749463839610100", "hex")], { type: "image/gif" });
  const manifest = { format: "write-then-publish", version: 1, media: [
    { path: "media/001.gif", size: gif.size, type: gif.type },
  ] };
  const project = {
    id: folder, title, updatedAt: 1000,
    data: { content: title, images: { cover: { name: "原图.gif", portableSrcPath: "media/001.gif" } } },
  };
  return [
    { path: `${root}manifest.json`, file: new Blob([JSON.stringify(manifest)]) },
    { path: `${root}project.json`, file: new Blob([JSON.stringify(project)]) },
    { path: `${root}content.md`, file: new Blob([title]) },
    { path: `${root}media/001.gif`, file: gif },
  ];
}

(async () => {
  const first = original("2026-10-01_第一篇", "第一篇");
  const second = original("2026-10-02_第二篇", "第二篇");
  const batch = await context.inspectPortableFolder([...first, ...second]);
  assert.equal(batch.length, 2);
  assert.equal(batch[0].candidate.source.title, "第一篇");
  assert.equal(batch[1].candidate.source.title, "第二篇");
  assert.equal(batch[0].candidate.listed.get("media/001.gif").type, "image/gif");
  const single = await context.inspectPortableFolder(first);
  assert.equal(single.source.title, "第一篇");
  const summary = { path: "写了就发旧稿-2026-10-03/迁移说明.txt", file: new Blob([
    "写了就发旧稿迁移\n已保存 2/3 篇。\n\n未完成：\n第三篇：图片 sample 读取失败：Object not found\n请回到迁移页面重试。\n",
  ]) };
  await context.verifySavedMigrationFolder([...first, ...second, summary]);
  assert.equal(receipts.size, 2, "an earlier migration folder can restore completed states");
  assert.match(failures.get("2026-10-03_第三篇"), /Object not found/);
  assert.match(els.cloudMigrationStatus.textContent, /已核对 2 篇完整原稿，另有 1 篇未完成/);
  console.log("OK: the downloaded migration folder and a date folder import directly with GIF intact");
})().catch((error) => { console.error(error); process.exitCode = 1; });
