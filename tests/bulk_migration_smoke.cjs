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

class Directory {
  constructor() { this.directories = new Map(); this.files = new Map(); }
  async getDirectoryHandle(name) {
    if (!this.directories.has(name)) this.directories.set(name, new Directory());
    return this.directories.get(name);
  }
  async getFileHandle(name) {
    return {
      createWritable: async () => {
        let data;
        return {
          write: async (content) => { data = content instanceof Blob ? content : new Blob([content]); },
          close: async () => { this.files.set(name, data); },
          abort: async () => {},
        };
      },
      getFile: async () => this.files.get(name),
    };
  }
}

const gif = new Blob([Buffer.from("4749463839610100", "hex")], { type: "image/gif" });
const video = new Blob(["live-video"], { type: "video/quicktime" });
const projects = [0, 1].map((index) => ({
  id: `project_${(Date.UTC(2026, 8, 29, 12, index) / 1).toString(36)}_abcde`,
  title: `旧稿 ${index + 1}`,
  createdAt: Date.UTC(2026, 8, 29, 12, index),
  data: {
    content: `第 ${index + 1} 篇 [[image:cover]]`,
    images: { cover: {
      kind: "live", name: "原动图.gif", storagePath: `cover-${index}`,
      videoName: "原视频.mov", videoStoragePath: `video-${index}`,
    } },
  },
}));
const rows = projects.map((project) => {
  const result = { textContent: "待保存" };
  return { dataset: { cloudProjectId: project.id }, querySelector: () => result, result };
});
const destination = new Directory();
const cloudState = { user: { id: "test-user" }, legacyProjects: projects, legacyProjectsStatus: "ready", migrationBusy: false };
const receipts = new Map();
const percentages = [];
const progressDetails = [];
const progressPercent = {
  set textContent(value) { percentages.push(Number.parseInt(value, 10)); },
};
const progressDetail = {
  set textContent(value) { progressDetails.push(value); },
};
const els = {
  cloudMigrationList: { querySelectorAll: () => rows },
  cloudMigrationStatus: { textContent: "" },
  cloudMigrationProgress: { hidden: true, classList: { toggle: () => {} } },
  cloudMigrationProgressLabel: { textContent: "" },
  cloudMigrationProgressPercent: progressPercent,
  cloudMigrationProgressTrack: { setAttribute: () => {} },
  cloudMigrationProgressFill: { style: { width: "" } },
  cloudMigrationProgressDetail: progressDetail,
  status: { textContent: "" },
};
let pickerCalls = 0;
const context = {
  Blob, Date, Map, Math, String, Object, Number, JSON,
  cloudState, els,
  window: { showDirectoryPicker: async () => { pickerCalls += 1; return destination; } },
  cloudIsReady: () => true,
  isBuiltInProject: () => false,
  portableCloudBlob: async (path) => path.startsWith("cover-") ? gif : video,
  portableCoverBlob: async () => { throw new Error("should fetch cloud original"); },
  portableVideoBlob: async () => { throw new Error("should fetch cloud original"); },
  setMigrationBusy: (busy) => { cloudState.migrationBusy = busy; },
  recordMigrationReceipt: (project, folderName) => { receipts.set(project.id, folderName); return true; },
  updateMigrationTestUi: () => {},
};
vm.createContext(context);
vm.runInContext([
  section("function projectCreatedAt(", "function loadProjectStore("),
  section("function portableMediaExtension(", "async function portableCloudBlob("),
  section("function portableProjectMigrationUnits(", "async function exportPortableProject("),
  section("async function inspectPortableProject(", "async function importPortableProject("),
  section("function updateMigrationProgress(", "async function refreshCloudMigrationList("),
].join("\n"), context);

(async () => {
  await context.migrateAllCloudProjects();
  assert.equal(pickerCalls, 1, "one folder choice saves the whole account");
  assert.match(els.cloudMigrationStatus.textContent, /已写入 2 篇/);
  assert.equal(els.cloudMigrationProgress.hidden, false);
  assert.equal(percentages[0], 0);
  assert.ok(percentages.some((value) => value > 0 && value < 100), "progress advances during migration");
  assert.ok(percentages.every((value, index) => index === 0 || value >= percentages[index - 1]));
  assert.equal(percentages.at(-1), 100);
  assert.ok(progressDetails.some((value) => value.includes("正在读取图片/GIF")));
  assert.match(progressDetails.at(-1), /成功 2 篇 · 未完成 0 篇/);
  assert.equal(destination.directories.size, 1);
  const batch = [...destination.directories.values()][0];
  assert.equal(batch.directories.size, 2);
  assert.equal(receipts.size, 2, "completed drafts receive persistent save records");
  assert.ok(batch.files.has("迁移说明.txt"));
  for (const folder of batch.directories.values()) {
    const media = folder.directories.get("media");
    assert.deepEqual(Buffer.from(await media.files.get("001.gif").arrayBuffer()), Buffer.from(await gif.arrayBuffer()));
    assert.deepEqual(Buffer.from(await media.files.get("001-video.mov").arrayBuffer()), Buffer.from(await video.arrayBuffer()));
    const paths = [...folder.files.keys(), ...[...media.files.keys()].map((name) => `media/${name}`)];
    const read = async (path) => path.startsWith("media/") ? media.files.get(path.slice(6)) : folder.files.get(path);
    const inspected = await context.inspectPortableProject(read, paths);
    assert.equal(inspected.listed.size, 2, "saved GIF and video are importable");
    const savedProject = JSON.parse(await folder.files.get("project.json").text());
    assert.equal(savedProject.data.images.cover.storagePath, undefined);
    assert.equal(savedProject.data.images.cover.videoStoragePath, undefined);
    assert.match(await folder.files.get("content.md").text(), /media\/001\.gif/);
  }

  const partialDestination = new Directory();
  context.window.showDirectoryPicker = async () => partialDestination;
  context.portableCloudBlob = async (path) => {
    if (path === "cover-1") throw new Error("simulated asset failure");
    return path.startsWith("cover-") ? gif : video;
  };
  await context.migrateAllCloudProjects();
  assert.match(els.cloudMigrationStatus.textContent, /已保存 1\/2 篇，1 篇未完成/);
  assert.equal(percentages.at(-1), 100, "all attempted work reaches 100% even when a draft fails");
  assert.match(els.cloudMigrationProgressLabel.textContent, /部分原稿未完成/);
  assert.match(progressDetails.at(-1), /成功 1 篇 · 未完成 1 篇/);
  const partialBatch = [...partialDestination.directories.values()][0];
  const folders = [...partialBatch.directories.values()];
  assert.equal(folders.filter((folder) => folder.files.has("manifest.json")).length, 1,
    "a failed draft never receives a complete manifest");
  assert.match(await partialBatch.files.get("迁移说明.txt").text(), /simulated asset failure/);
  console.log("OK: one folder choice saves all drafts; GIF and video re-import; failures stay incomplete");
})().catch((error) => { console.error(error); process.exitCode = 1; });
