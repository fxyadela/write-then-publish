const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const BrowserZip = require('./helpers/browser_zip.cjs');
const source = fs.readFileSync('src/app.js', 'utf8');
function section(start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, start);
  return source.slice(first, last);
}
const gif = new Blob([fs.readFileSync('tests/fixtures/portable/animated.gif')], { type: 'image/gif' });
const video = new Blob([fs.readFileSync('tests/fixtures/portable/source.mp4')], { type: 'video/mp4' });
const projects = [0, 1].map(index => ({
  id: `project_${Date.UTC(2026, 8, 29, 12, index).toString(36)}_abcde`,
  title: `旧稿 ${index+1}`, createdAt: Date.UTC(2026, 8, 29, 12, index), updatedAt: 1000,
  data: { content: `正文 ${index+1}\n[[image:cover]]`, images: { cover: {
    kind: 'live', name: '原动图.gif', storagePath: `cover-${index}`,
    videoName: '原视频.mp4', videoStoragePath: `video-${index}`,
  } } },
}));
const cloudState = { user: { id: 'test-user' }, legacyProjects: projects, legacyProjectsStatus: 'ready', migrationBusy: false };
const packaged = new Map(), written = new Map(), saved = new Map(), failed = new Map(), downloads = [], percentages = [];
const folderFiles = new Map();
const directory = {
  name: '我选的迁移文件夹',
  async getFileHandle(name, { create } = {}) {
    assert.equal(create, true);
    return {
      async createWritable() {
        let content;
        return {
          async write(blob) { content = blob; },
          async close() { folderFiles.set(name, content); },
          async abort() { content = null; },
        };
      },
      async getFile() { return folderFiles.get(name); },
    };
  },
};
let pickerCalls = 0, cloudReads = 0;
const els = {
  status: {}, cloudMigrationStatus: {}, cloudMigrationList: {},
  cloudMigrationBrowserDownload: { hidden: true },
  cloudMigrationProgress: { classList: { toggle() {} } },
  cloudMigrationProgressLabel: {}, cloudMigrationProgressDetail: {},
  cloudMigrationProgressPercent: { set textContent(value) { percentages.push(Number.parseInt(value)); } },
  cloudMigrationProgressTrack: { setAttribute() {} }, cloudMigrationProgressFill: { style: {} },
};
const context = {
  Blob, Date, Map, Math, String, Object, Number, JSON, Error,
  ACCOUNT_MAINTENANCE: true, MIGRATION_DEADLINE_NOTICE: '最迟 10 月 31 日完成',
  cloudState, els, window: {
    JSZip: BrowserZip,
    showDirectoryPicker: async () => { pickerCalls++; return directory; },
  }, cloudIsReady: () => true,
  isBuiltInProject: () => false,
  portableCloudBlob: async path => { cloudReads++; return path.startsWith('cover-') ? gif : video; },
  portableCoverBlob: async () => { throw new Error('must fetch original'); },
  portableVideoBlob: async () => { throw new Error('must fetch original'); },
  setMigrationBusy: busy => { cloudState.migrationBusy = busy; },
  renderCloudMigrationList() {}, updateMigrationTestUi() {}, updateCloudMigrationStatus() {},
  recordMigrationPackage: (project, archive) => packaged.set(project.id, archive),
  recordMigrationFolderSave: (project, folder, archive) => written.set(project.id, { folder, archive }),
  recordMigrationReceipt: (project, archive) => saved.set(project.id, archive),
  recordMigrationFailure: (project, reason) => failed.set(project.id, reason),
  savedMigrationCount: () => saved.size,
  saveBlob: async (blob, name) => downloads.push({ blob, name }),
};
vm.createContext(context);
vm.runInContext([
  section('function projectCreatedAt(', 'function loadProjectStore('),
  section('function portableMediaExtension(', 'async function portableCloudBlob('),
  section('function portableProjectMigrationUnits(', 'async function exportPortableProject('),
  section('async function inspectPortableProject(', 'async function importPortableProject('),
  section('async function inspectPortableZip(', 'async function inspectPortableFolder('),
  section('function recordImportedMigrationZip(', 'function setPortableImportStatus('),
  section('function updateMigrationProgress(', 'async function refreshCloudMigrationList('),
].join('\n'), context);
(async () => {
  context.window.showDirectoryPicker = async () => { pickerCalls++; const error = new Error('cancelled'); error.name = 'AbortError'; throw error; };
  await context.migrateAllCloudProjects();
  assert.equal(cloudReads, 0, 'cancelling picker must not start cloud reads');
  assert.equal(percentages.length, 0, 'cancelling picker must not show progress');
  assert.equal(folderFiles.size, 0);
  assert.equal(downloads.length, 0);
  assert.match(els.cloudMigrationStatus.textContent, /尚未开始迁移/);
  context.window.showDirectoryPicker = async () => { pickerCalls++; assert.equal(cloudReads, 0, 'folder is chosen before cloud reads'); return directory; };
  await context.migrateAllCloudProjects();
  assert.equal(pickerCalls, 2);
  assert.equal(folderFiles.size, 1, 'one click writes all drafts into the selected folder');
  assert.equal(downloads.length, 0, 'folder choice must not trigger browser downloads');
  assert.equal(written.size, 2, 'directly written drafts show a saved-to-folder status');
  assert.equal(packaged.size, 0);
  assert.equal(saved.size, 0);
  assert.equal(percentages[0], 0);
  assert.ok(percentages.some(v => v > 0 && v < 100));
  assert.ok(percentages.every((v, i) => !i || v >= percentages[i-1]));
  assert.equal(percentages.at(-1), 100);
  let [archiveName, archiveBlob] = folderFiles.entries().next().value;
  assert.match(archiveName, /\.zip$/);
  let zip = await BrowserZip.loadAsync(archiveBlob, { checkCRC32: true });
  const manifests = Object.keys(zip.files).filter(p => p.endsWith('/manifest.json'));
  assert.equal(manifests.length, 2);
  for (const manifest of manifests) {
    const root = manifest.slice(0, -'manifest.json'.length);
    assert.deepEqual(await zip.file(root+'media/001.gif').async('nodebuffer'), Buffer.from(await gif.arrayBuffer()));
    assert.deepEqual(await zip.file(root+'media/001-video.mp4').async('nodebuffer'), Buffer.from(await video.arrayBuffer()));
  }
  assert.match(await zip.file('迁移说明.txt').async('string'), /10 月 31 日/);
  archiveBlob.name = archiveName;
  const inspected = await context.inspectPortableZip(archiveBlob);
  assert.equal(context.recordImportedMigrationZip(inspected, archiveName, 'another-user'), 0);
  assert.equal(saved.size, 0, 'another account cannot confirm these drafts');
  assert.equal(context.recordImportedMigrationZip(inspected, archiveName, 'test-user'), 2);
  assert.equal(saved.size, 2, 'a real ZIP selected for import confirms all matching drafts');
  assert.equal(context.recordImportedMigrationZip(inspected, archiveName, 'test-user'), 2);
  assert.equal(saved.size, 2, 'repeat selection does not inflate saved draft count');
  context.window.showDirectoryPicker = undefined;
  const beforeFallback = cloudReads;
  await context.migrateAllCloudProjects();
  assert.equal(cloudReads, beforeFallback, 'unsupported browser does not start migration');
  assert.equal(downloads.length, 0, 'unsupported browser does not auto download');
  assert.equal(els.cloudMigrationBrowserDownload.hidden, false, 'explicit fallback appears');
  await context.migrateAllCloudProjects({ browserDownload: true });
  assert.equal(downloads.length, 1, 'fallback starts only after explicit click');
  assert.equal(packaged.size, 2, 'browser download remains pending until verified');
  downloads.length = 0; packaged.clear(); written.clear(); percentages.length = 0;
  context.portableCloudBlob = async path => {
    if (path === 'cover-1') throw new Error('Object not found');
    return path.startsWith('cover-') ? gif : video;
  };
  context.window.showDirectoryPicker = async () => directory;
  folderFiles.clear();
  await context.migrateAllCloudProjects();
  zip = await BrowserZip.loadAsync(folderFiles.values().next().value);
  assert.equal(Object.keys(zip.files).filter(p => p.endsWith('/manifest.json')).length, 1);
  assert.match(await zip.file('迁移说明.txt').async('string'), /Object not found/);
  assert.match(failed.get(projects[1].id), /Object not found/);
  assert.equal(percentages.at(-1), 100);
  assert.match(els.cloudMigrationProgressLabel.textContent, /部分原稿未完成/);
  context.ACCOUNT_MAINTENANCE = false;
  const count = folderFiles.size;
  await context.migrateAllCloudProjects();
  assert.equal(folderFiles.size, count, 'no new migration after cutoff');
  console.log('OK: picker before transfer, cancel and unsupported browser safety, selected-folder ZIP, GIF/MP4, progress and partial failure');
})().catch(error => { console.error(error); process.exitCode = 1; });
