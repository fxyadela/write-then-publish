const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const BrowserZip = require('./helpers/browser_zip.cjs');
const source = fs.readFileSync('src/app.js', 'utf8');
function section(start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first);
  return source.slice(first, last);
}
const fixture = name => fs.readFileSync(`tests/fixtures/portable/${name}`);
const media = {
  'media/001.gif': { bytes: fixture('animated.gif'), type: 'image/gif' },
  'media/002.png': { bytes: fixture('still.png'), type: 'image/png' },
  'media/003.png': { bytes: fixture('still.png'), type: 'image/png' },
  'media/003-video.mp4': { bytes: fixture('source.mp4'), type: 'video/mp4' },
};
const original = {
  id: 'source-qa', title: '原稿往返测试', createdAt: Date.UTC(2026, 9, 4, 4), updatedAt: Date.UTC(2026, 9, 4, 5),
  data: { content: '# 原稿往返测试\n\n**中文加粗**\n\n[[image:gif]]\n\n[[image:png]]\n\n[[image:live]]', fontSize: 32, lineHeight: 1.8,
    headerMode: 'first', accentColor: '#e11d48', articleTheme: 'wechat', articleFont: 'serif',
    images: {
      gif: { name: '两帧动图.gif', portableSrcPath: 'media/001.gif', layout: { widthPercent: 75, align: 'left' } },
      png: { name: '图片.png', portableSrcPath: 'media/002.png', crop: { x: 20, y: 8, width: 100, height: 80 } },
      live: { kind: 'live', name: '实况封面.png', portableSrcPath: 'media/003.png', portableVideoPath: 'media/003-video.mp4', videoName: '原视频.mp4', liveSettings: { duration: 3, sound: false, crop: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 } } },
    },
  },
};
const manifest = { format: 'write-then-publish', version: 1, media: Object.entries(media).map(([path, file]) => ({ path, size: file.bytes.length, type: file.type })) };
function addOriginal(zip, root) {
  zip.file(`${root}/manifest.json`, JSON.stringify(manifest));
  zip.file(`${root}/project.json`, JSON.stringify(original));
  zip.file(`${root}/content.md`, original.data.content);
  for (const [path, file] of Object.entries(media)) zip.file(`${root}/${path}`, file.bytes);
}
const imageStore = new Map(), videoStore = new Map(), liveMediaFiles = new Map();
const state = { projects: [], currentProjectId: null };
let cloudCalls = 0, nextId = 0;
const ctx = {
  Blob, fetch, Date, JSON, String, Number, Object, Map, Error,
  state, liveMediaFiles, activeStorageScope: 'guest', MAX_PROJECTS: 24,
  window: { JSZip: BrowserZip }, cloudState: { user: null }, els: { status: {} },
  isBuiltInProject: () => false,
  createProject: data => ({ id: `import-${++nextId}`, title: '测试', updatedAt: Date.now(), data: JSON.parse(JSON.stringify(data)) }),
  imageSourceKey: (project, image) => `${project}::${image}`,
  writeImageSource: async (key, data) => imageStore.set(key, data), readImageSource: async key => imageStore.get(key),
  readFileAsDataURL: async blob => `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`,
  writeLiveMediaBlob: async (key, blob) => videoStore.set(key, blob), readLiveMediaBlob: async key => videoStore.get(key),
  replaceLiveMediaCache: (key, blob) => liveMediaFiles.set(key, { blob }),
  cloudApi: () => { cloudCalls++; throw new Error('offline import cannot call cloud'); },
  saveState() {}, applyForm() {}, syncGuideReadOnlyMode() {}, resetTextHistory() {}, saveProjectStore() {}, updateProjectHistory() {}, render: async () => {},
};
vm.createContext(ctx);
vm.runInContext([
 section('function projectCreatedAt(', 'function loadProjectStore('),
 section('function portableMediaExtension(', 'async function portableCloudBlob('),
 section('async function portableCoverBlob(', 'function portableProjectMigrationUnits('),
 section('async function writePortableProject(', 'async function exportPortableProject('),
 section('async function inspectPortableProject(', 'async function inspectPortableFolder('),
 section('async function prepareDownloadZip(', 'async function saveBlob('),
].join('\n'), ctx);
(async () => {
  const zip = new BrowserZip();
  addOriginal(zip, '2026-10-04_12-00-00');
  const input = await zip.generateAsync({ type: 'blob' });
  await ctx.importPortableProject(await ctx.inspectPortableZip(input));
  const imported = state.projects[0];
  assert.equal(imported.data.content, original.data.content);
  assert.equal(imported.createdAt, original.createdAt);
  assert.equal(imported.data.fontSize, original.data.fontSize);
  for (const image of Object.values(imported.data.images)) image.src = '';
  liveMediaFiles.clear();
  // A publication download is a ZIP with both the PNG and editable source.
  const output = await ctx.prepareDownloadZip(new Blob([fixture('still.png')], { type: 'image/png' }), 'publication.png');
  assert.equal(output.filename, 'publication.zip');
  const restored = await ctx.inspectPortableZip(output.blob);
  assert.equal(restored.source.data.content, original.data.content);
  assert.equal(restored.source.data.articleFont, 'serif');
  for (const [id, image] of Object.entries(original.data.images)) {
    const result = restored.source.data.images[id];
    for (const key of ['crop', 'layout', 'liveSettings']) assert.deepEqual(JSON.parse(JSON.stringify(result[key] ?? null)), image[key] ?? null);
    assert.deepEqual(Buffer.from(await (await restored.read(result.portableSrcPath)).arrayBuffer()), media[image.portableSrcPath].bytes);
    if (image.kind === 'live') assert.deepEqual(Buffer.from(await (await restored.read(result.portableVideoPath)).arrayBuffer()), media[image.portableVideoPath].bytes);
  }
  assert.equal(cloudCalls, 0);
  const batch = new BrowserZip(); addOriginal(batch, '日期一'); addOriginal(batch, '日期二');
  const options = await ctx.inspectPortableZip(await batch.generateAsync({ type: 'blob' }));
  assert.equal(options.length, 2, 'batch ZIP offers a draft selection');
  zip.remove('2026-10-04_12-00-00/media/001.gif');
  await assert.rejects(ctx.inspectPortableZip(await zip.generateAsync({ type: 'blob' })), /文件缺失/);
  console.log('OK: publication and migration ZIPs import; real GIF/PNG/MP4 bytes, text/crop/settings/date; local media re-export without cloud');
})().catch(error => { console.error(error); process.exitCode = 1; });
