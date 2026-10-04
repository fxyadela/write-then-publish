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
  ['oauth-pending', '1'], ['add-pending', '1'], ['migration-pending', '1'],
]);
const bodyClasses = new Set();
let policy = { migration_open: true, server_time: '2026-10-31T23:59:30+08:00' };
let signouts = 0, guestActivations = 0, nextTimer = 0;
const els = {
  status: {},
  accountEmail: { value: 'old@example.com' }, accountPassword: { value: 'secret' },
  accountPasswordConfirm: { value: 'secret' }, accountNewPassword: { value: 'secret' },
  migrationTestEmail: { value: 'old@example.com' }, migrationTestPassword: { value: 'secret' },
};
const ctx = {
  LOCAL_DEPLOYMENT_MODE: false, ACCOUNT_MAINTENANCE: false,
  MIGRATION_END_AT: cutoff, URLSearchParams, cloudState: { user: { id: 'owner' } },
  ACCOUNT_SESSIONS_STORAGE_KEY: 'sessions', LAST_ACCOUNT_EMAIL_KEY: 'last-email', ENTRY_MODE_SESSION_KEY: 'entry',
  GOOGLE_OAUTH_PENDING_SESSION_KEY: 'oauth-pending', ACCOUNT_ADD_PENDING_SESSION_KEY: 'add-pending', MIGRATION_AUTH_PENDING_KEY: 'migration-pending',
  cloudApi: () => ({ getAccountPolicy: async () => policy, signOutLocal: async () => { signouts++; } }),
  window: {
    location: { hostname: 'fawen.fun', search: '?account-preview=profile', reload() {} },
    setTimeout(fn, delay) { const id=++nextTimer; timers.set(id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  },
  localStorage: { removeItem: key => storage.delete(key) },
  document: { body: { classList: {
    add: name => bodyClasses.add(name), remove: name => bodyClasses.delete(name),
    toggle: (name, enabled) => enabled ? bodyClasses.add(name) : bodyClasses.delete(name),
  } } },
  sessionStorage: { setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
  setHistoryOpen() {}, activeStorageScope: 'user_owner',
  handleCloudSession: async () => { ctx.cloudState.user = null; },
  activateGuestWorkspace: async () => { guestActivations++; },
  finishEntryChoice: mode => { ctx.entryMode = mode; }, els, saveState() {},
  closeAccountMenu() {}, closeAccountModal() {}, setAccountBusy() {},
  activateWorkspaceScope: async scope => { ctx.activeStorageScope = scope; },
  showEntryChoice: message => { ctx.welcomeMessage = message; },
};
vm.createContext(ctx);
vm.runInContext([
  section('async function resolveAccountPolicy()', 'function scopedStorageKey('),
  section('function syncHistoryAvailability()', 'async function activateWorkspaceScope('),
  section('function clearRememberedAccountIdentity()', 'function showMaintenanceWelcomeOnce('),
  section('async function signOutAccount()', 'function scheduleCloudProfileSync('),
].join('\n'), ctx);
(async () => {
  await ctx.resolveAccountPolicy();
  assert.equal(ctx.ACCOUNT_MAINTENANCE, true, 'server time overrides client date and production ignores preview overrides');
  ctx.syncHistoryAvailability();
  assert.equal(bodyClasses.has('history-disabled'), false, 'signed-in history remains available during migration');
  assert.ok([...timers.values()].some(timer => timer.delay === 31000), 'cutover timer follows server time');
  timers.clear();
  policy = { migration_open: false, server_time: '2026-11-01T00:00:00+08:00' };
  await ctx.resolveAccountPolicy();
  assert.equal(ctx.ACCOUNT_MAINTENANCE, false);
  ctx.syncHistoryAvailability();
  assert.equal(bodyClasses.has('history-disabled'), true, 'signed-in history sidebar closes after cutoff');
  ctx.LOCAL_DEPLOYMENT_MODE = true;
  ctx.activeStorageScope = 'local';
  ctx.syncHistoryAvailability();
  assert.equal(bodyClasses.has('history-disabled'), false, 'standalone local edition keeps its existing history');
  ctx.LOCAL_DEPLOYMENT_MODE = false;
  assert.equal(timers.size, 0);
  await ctx.chooseGuestMode();
  assert.equal(signouts, 1);
  assert.equal(ctx.cloudState.user, null);
  assert.equal(storage.has('sessions'), false);
  assert.equal(storage.has('last-email'), false);
  assert.equal(storage.has('oauth-pending'), false);
  assert.equal(storage.has('add-pending'), false);
  assert.equal(storage.has('migration-pending'), false);
  assert.equal(els.accountEmail.value, '');
  assert.equal(els.migrationTestEmail.value, '');
  assert.equal(storage.get('entry'), 'guest');
  assert.equal(guestActivations, 1);
  assert.equal(ctx.entryMode, 'guest');
  ctx.cloudState.user = { id: 'owner' };
  storage.set('sessions', 'another remembered account');
  storage.set('last-email', 'old@example.com');
  els.accountEmail.value = 'old@example.com';
  els.accountPassword.value = 'secret';
  els.migrationTestEmail.value = 'old@example.com';
  await ctx.signOutAccount();
  assert.equal(signouts, 2, 'normal signout uses local auth signout');
  assert.equal(ctx.cloudState.user, null);
  assert.equal(storage.has('sessions'), false, 'other remembered sessions must also disappear');
  assert.equal(storage.has('last-email'), false, 'welcome page cannot show previous email');
  assert.equal(storage.has('entry'), false);
  assert.equal(els.accountEmail.value, '');
  assert.equal(els.accountPassword.value, '');
  assert.equal(els.migrationTestEmail.value, '');
  assert.match(ctx.welcomeMessage, /已退出登录/);
  console.log('OK: cutoff and guest behavior; signout clears all remembered accounts and opens a clean welcome page');
})().catch(error => { console.error(error); process.exitCode=1; });
