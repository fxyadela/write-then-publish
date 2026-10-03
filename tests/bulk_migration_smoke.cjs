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
const cloudState = { user: { id: "test-user" }, legacyProjects: projects, migrationBusy: false };
const els = {
  cloudMigrationList: { querySelectorAll: () => rows },
  cloudMigrationStatus: { textContent: "" },
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
};
vm.createContext(context);
vm.runInContext([
  section("function projectCreatedAt(", "function loadProjectStore("),
  section("function portableMediaExtension(", "async function portableCloudBlob("),
  section("async function writePortableProject(", "async function exportPortableProject("),
  section("async function inspectPortableProject(", "async function importPortableProject("),
  section("async function writePortableFileToDirectory(", "async function refreshCloudMigrationList("),
].join("\n"), context);

(async () => {
  await context.migrateAllCloudProjects();
  assert.equal(pickerCalls, 1, "one folder choice saves the whole account");
  assert.match(els.cloudMigrationStatus.textContent, /已写入 2 篇/);
  assert.equal(destination.directories.size, 1);
  const batch = [...destination.directories.values()][0];
  assert.equal(batch.directories.size, 2);
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
  const partialBatch = [...partialDestination.directories.values()][0];
  const folders = [...partialBatch.directories.values()];
  assert.equal(folders.filter((folder) => folder.files.has("manifest.json")).length, 1,
    "a failed draft never receives a complete manifest");
  assert.match(await partialBatch.files.get("迁移说明.txt").text(), /simulated asset failure/);
  console.log("OK: one folder choice saves all drafts; GIF and video re-import; failures stay incomplete");
})().catch((error) => { console.error(error); process.exitCode = 1; });
