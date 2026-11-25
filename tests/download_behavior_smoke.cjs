const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const BrowserZip = require('./helpers/browser_zip.cjs');
const source = fs.readFileSync('src/app.js', 'utf8');
const section = (start, end) => {
  const first = source.indexOf(start), last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first);
  return source.slice(first, last);
};
const png = new Blob([fs.readFileSync('tests/fixtures/portable/still.png')], { type: 'image/png' });
const canvas = () => ({ _imageHits: [] });
const downloads = [], prompts = [];
let chosenName, started = 0, handoffs = 0;
const state = { canvases: [canvas()], images: {} };
const ctx = {
  Blob, Uint8Array, String, Number, Object, Promise, console,
  state, window: { JSZip: BrowserZip }, EXPORT_ZIP_COMPRESSION: 'STORE', els: { status: {} },
  readForm: () => ({ content: '# 今天的发布内容' }),
  blockBuiltInGuideDownload: () => false,
  needsLivePhotoStaticFallback: () => false,
  showPendingLivePhotoBatchHandoff: () => { handoffs++; },
  beginExportProgress: () => { started++; return true; },
  updateExportProgress() {}, finishExportProgress() {},
  canvasToLosslessPngBlob: async () => png,
  saveBlob: async (blob, filename) => downloads.push({ blob, filename }),
};
vm.createContext(ctx);
vm.runInContext([
  section('function projectTitleFromData(', 'function formatProjectTime('),
  section('function liveImageHitsForCanvas(', 'function createLiveWellMaskBlob('),
  section('function sanitizeExportBaseName(', 'async function prepareDownloadZip('),
  section('async function isZipBlob(', 'const requestRender ='),
].join('\n'), ctx);
ctx.requestExportFilename = async (suggestion, description) => {
  prompts.push({ suggestion, description });
  return chosenName;
};
function reset(name, canvases = [canvas()], images = {}) {
  chosenName = name; state.canvases = canvases; state.images = images;
  downloads.length = 0; prompts.length = 0; started = 0; handoffs = 0;
}
(async () => {
  assert.equal(ctx.sanitizeExportBaseName('  中文:稿件/测试.png  '), '中文稿件测试');
  assert.equal(ctx.sanitizeExportBaseName('... /\\|?*'), '');
  assert.equal(ctx.sanitizeExportBaseName('内容.zip'), '内容');
  assert.equal(ctx.sanitizeExportBaseName('字'.repeat(120)).length, 100);

  reset('我的单图.png');
  ctx.window.JSZip = null;
  await ctx.downloadAll();
  assert.equal(prompts[0].suggestion, '今天的发布内容.png');
  assert.equal(downloads.length, 1);
  assert.equal(downloads[0].filename, '我的单图.png');
  assert.equal(downloads[0].blob, png, 'single static PNG is neither re-encoded nor zipped');
  ctx.window.JSZip = BrowserZip;

  reset('含动图.zip', [{ _imageHits: [{ imageId: 'gif' }] }], { gif: { name: '动画.GIF' } });
  await ctx.downloadAll();
  assert.ok(prompts[0].suggestion.endsWith('.zip'));
  const gifPackage = await BrowserZip.loadAsync(downloads[0].blob);
  assert.ok(gifPackage.file('含动图.png'), 'a GIF card remains an explicit source-preserving package');

  reset('无动图.png', [canvas()], { unused: { name: '历史动图.gif' } });
  await ctx.downloadAll();
  assert.equal(downloads[0].filename, '无动图.png', 'unused GIF attachments do not force a ZIP');

  reset('我的整组.zip', [canvas(), canvas()]);
  await ctx.downloadAll();
  assert.equal(prompts.length, 1, 'batch export asks for one name');
  assert.equal(downloads.length, 1);
  assert.equal(downloads[0].filename, '我的整组.zip');
  const batch = await BrowserZip.loadAsync(downloads[0].blob);
  assert.deepEqual(Object.keys(batch.files).filter(name => name.endsWith('.png')), ['我的整组-01.png', '我的整组-02.png']);
  assert.deepEqual(Buffer.from(await batch.file('我的整组-02.png').async('uint8array')), Buffer.from(await png.arrayBuffer()));

  reset('单独第二页.png', [canvas(), canvas()]);
  await ctx.exportCanvasAutomatically(state.canvases[1], '', 1);
  assert.equal(prompts[0].suggestion, '今天的发布内容-02.png');
  assert.equal(downloads[0].filename, '单独第二页.png');

  for (const pages of [[canvas()], [canvas(), canvas()]]) {
    reset(null, pages);
    await ctx.downloadAll();
    assert.equal(downloads.length, 0, 'cancelling never starts a download');
    assert.equal(started, 0, 'cancelling does not start rendering or compression');
  }

  reset('不应使用.png', [{ _imageHits: [{ imageId: 'live' }] }], { live: { kind: 'live' } });
  await ctx.downloadAll();
  assert.equal(handoffs, 1, 'live media still uses the Live Photo handoff');
  assert.equal(prompts.length, 0, 'Live Photo naming happens at its final download button');
  assert.equal(downloads.length, 0);
  console.log('OK: single PNG, GIF package, named batch entries, per-page download, cancellation and Live Photo routing');
})().catch(error => { console.error(error); process.exitCode = 1; });
