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
const packaged = new Map(), saved = new Map(), failed = new Map(), downloads = [], percentages = [];
const els = {
  status: {}, cloudMigrationStatus: {}, cloudMigrationList: {},
  cloudMigrationProgress: { classList: { toggle() {} } },
  cloudMigrationProgressLabel: {}, cloudMigrationProgressDetail: {},
  cloudMigrationProgressPercent: { set textContent(value) { percentages.push(Number.parseInt(value)); } },
  cloudMigrationProgressTrack: { setAttribute() {} }, cloudMigrationProgressFill: { style: {} },
};
const context = {
  Blob, Date, Map, Math, String, Object, Number, JSON, Error,
  ACCOUNT_MAINTENANCE: true, MIGRATION_DEADLINE_NOTICE: '最迟 10 月 31 日完成',
  cloudState, els, window: { JSZip: BrowserZip }, cloudIsReady: () => true,
  isBuiltInProject: () => false,
  portableCloudBlob: async path => path.startsWith('cover-') ? gif : video,
  portableCoverBlob: async () => { throw new Error('must fetch original'); },
  portableVideoBlob: async () => { throw new Error('must fetch original'); },
  setMigrationBusy: busy => { cloudState.migrationBusy = busy; },
  renderCloudMigrationList() {}, updateMigrationTestUi() {},
  recordMigrationPackage: (project, archive) => packaged.set(project.id, archive),
  recordMigrationReceipt: (project, archive) => saved.set(project.id, archive),
  recordMigrationFailure: (project, reason) => failed.set(project.id, reason),
  savedMigrationCount: () => saved.size,
  saveBlob: async (blob, name) => downloads.push({ blob, name }),
  writePortableFileToDirectory: async (directory, name, blob) => directory.set(name, blob),
};
vm.createContext(context);
vm.runInContext([
  section('function projectCreatedAt(', 'function loadProjectStore('),
  section('function portableMediaExtension(', 'async function portableCloudBlob('),
  section('function portableProjectMigrationUnits(', 'async function exportPortableProject('),
  section('async function inspectPortableProject(', 'async function importPortableProject('),
  section('async function inspectPortableZip(', 'async function inspectPortableFolder('),
  section('function updateMigrationProgress(', 'async function refreshCloudMigrationList('),
].join('\n'), context);
(async () => {
  await context.migrateAllCloudProjects();
  assert.equal(downloads.length, 1, 'one click saves all drafts as one ZIP');
  assert.match(downloads[0].name, /\.zip$/);
  assert.equal(packaged.size, 2, 'browser downloads stay pending until verified');
  assert.equal(saved.size, 0);
  assert.equal(percentages[0], 0);
  assert.ok(percentages.some(v => v > 0 && v < 100));
  assert.ok(percentages.every((v, i) => !i || v >= percentages[i-1]));
  assert.equal(percentages.at(-1), 100);
  let zip = await BrowserZip.loadAsync(downloads[0].blob, { checkCRC32: true });
  const manifests = Object.keys(zip.files).filter(p => p.endsWith('/manifest.json'));
  assert.equal(manifests.length, 2);
  for (const manifest of manifests) {
    const root = manifest.slice(0, -'manifest.json'.length);
    assert.deepEqual(await zip.file(root+'media/001.gif').async('nodebuffer'), Buffer.from(await gif.arrayBuffer()));
    assert.deepEqual(await zip.file(root+'media/001-video.mp4').async('nodebuffer'), Buffer.from(await video.arrayBuffer()));
  }
  assert.match(await zip.file('迁移说明.txt').async('string'), /10 月 31 日/);
  downloads[0].blob.name = downloads[0].name;
  await context.verifySavedMigrationZip([downloads[0].blob, downloads[0].blob]);
  assert.equal(saved.size, 2, 'only real complete ZIPs mark drafts as verified');
  assert.match(els.cloudMigrationStatus.textContent, /已核对 2 篇/, 'duplicate selected files do not inflate the count');
  downloads.length = 0; packaged.clear(); percentages.length = 0;
  context.portableCloudBlob = async path => {
    if (path === 'cover-1') throw new Error('Object not found');
    return path.startsWith('cover-') ? gif : video;
  };
  await context.migrateAllCloudProjects();
  zip = await BrowserZip.loadAsync(downloads[0].blob);
  assert.equal(Object.keys(zip.files).filter(p => p.endsWith('/manifest.json')).length, 1);
  assert.match(await zip.file('迁移说明.txt').async('string'), /Object not found/);
  assert.match(failed.get(projects[1].id), /Object not found/);
  assert.equal(percentages.at(-1), 100);
  assert.match(els.cloudMigrationProgressLabel.textContent, /部分原稿未完成/);
  context.ACCOUNT_MAINTENANCE = false;
  const count = downloads.length;
  await context.migrateAllCloudProjects();
  assert.equal(downloads.length, count, 'no new migration after cutoff');
  console.log('OK: all drafts in ZIP, real GIF/MP4 bytes, progress, ZIP verification and partial failure');
})().catch(error => { console.error(error); process.exitCode = 1; });
