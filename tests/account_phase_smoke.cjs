const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/app.js', 'utf8');
function section(start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first);
  return source.slice(first, last);
}
const cutoff = Date.parse('2026-11-01T00:00:00+08:00');
const timers = new Map(), storage = new Map([
  ['sessions', 'saved credentials'], ['last-email', 'old@example.com'],
]);
let policy = { migration_open: true, server_time: '2026-10-31T23:59:30+08:00' };
let signouts = 0, guestActivations = 0, nextTimer = 0;
const ctx = {
  LOCAL_DEPLOYMENT_MODE: false, ACCOUNT_MAINTENANCE: false,
  MIGRATION_END_AT: cutoff, URLSearchParams, cloudState: { user: { id: 'owner' } },
  ACCOUNT_SESSIONS_STORAGE_KEY: 'sessions', LAST_ACCOUNT_EMAIL_KEY: 'last-email', ENTRY_MODE_SESSION_KEY: 'entry',
  cloudApi: () => ({ getAccountPolicy: async () => policy, signOutLocal: async () => { signouts++; } }),
  window: {
    location: { hostname: 'fawen.fun', search: '?account-preview=profile', reload() {} },
    setTimeout(fn, delay) { const id=++nextTimer; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  },
  localStorage: { removeItem: key => storage.delete(key) },
  sessionStorage: { setItem: (key, value) => storage.set(key, value) },
  handleCloudSession: async () => { ctx.cloudState.user = null; },
  activateGuestWorkspace: async () => { guestActivations++; },
  finishEntryChoice: mode => { ctx.entryMode = mode; }, els: { status: {} }, saveState() {},
};
vm.createContext(ctx);
vm.runInContext([
  section('async function resolveAccountPolicy()', 'function scopedStorageKey('),
  section('async function chooseGuestMode()', 'function showMaintenanceWelcomeOnce('),
].join('\n'), ctx);
(async () => {
  await ctx.resolveAccountPolicy();
  assert.equal(ctx.ACCOUNT_MAINTENANCE, true, 'server time overrides client date and production ignores preview overrides');
  assert.ok([...timers.values()].some(timer => timer.delay === 31000), 'cutover timer follows server time');
  timers.clear();
  policy = { migration_open: false, server_time: '2026-11-01T00:00:00+08:00' };
  await ctx.resolveAccountPolicy();
  assert.equal(ctx.ACCOUNT_MAINTENANCE, false);
  assert.equal(timers.size, 0);
  await ctx.chooseGuestMode();
  assert.equal(signouts, 1);
  assert.equal(ctx.cloudState.user, null);
  assert.equal(storage.has('sessions'), false);
  assert.equal(storage.has('last-email'), false);
  assert.equal(storage.get('entry'), 'guest');
  assert.equal(guestActivations, 1);
  assert.equal(ctx.entryMode, 'guest');
  console.log('OK: server-driven cutoff; guest mode signs out and removes remembered account credentials without creating an account');
})().catch(error => { console.error(error); process.exitCode=1; });
