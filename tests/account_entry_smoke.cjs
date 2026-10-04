const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/app.js', 'utf8');
function section(start,end) {
  const first=source.indexOf(start),last=source.indexOf(end,first);
  assert.ok(first>=0 && last>first);
  return source.slice(first,last);
}
const storage=new Map(),entries=[],notices=[];
let signups=0,migrations=0,loads=0;
const ctx={
  ACCOUNT_MAINTENANCE:true, accountAuthAddMode:false, MIGRATION_AUTH_PENDING_KEY:'migration-pending',
  LAST_ACCOUNT_EMAIL_KEY:'last-email', ENTRY_MODE_SESSION_KEY:'entry',
  cloudState:{user:null},els:{accountEmail:{value:'new@example.com'},accountPassword:{value:'example-password'},accountPasswordConfirm:{value:'example-password'}},
  localStorage:{setItem:(k,v)=>storage.set(k,v)},sessionStorage:{setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  cloudApi:()=>({signUp:async()=>{signups++;return{session:null};},signIn:async()=>({session:{user:{id:'old-owner'}}}),signInWithGoogle:async()=>{}}),
  setAccountBusy(){},setAccountNotice:message=>notices.push(message),setPendingConfirmation(){},setAccountAuthMode(){},
  handleCloudSession:async session=>{ctx.cloudState.user=session.user;},accountAuthErrorMessage:error=>error.message,
  finishEntryChoice:mode=>entries.push(mode),closeAccountModal(){},
  isMigrationTestUser:user=>Boolean(user?.id),loadCloudWorkspace:async()=>{loads++;},
  closeMigrationTestLogin(){},openCloudMigrationModal:()=>{migrations++;},updateMigrationTestUi(){},
  setMigrationTestBusy(){},setMigrationTestNotice(){},
};
vm.createContext(ctx);
vm.runInContext([
  section('async function signInAccount()', 'async function resendAccountConfirmation()'),
  section('async function finishMigrationTestLogin(', 'async function signInMigrationTestWithEmail('),
  section('async function signInMigrationTestWithGoogle()', 'async function signOutMigrationTest()'),
].join('\n'),ctx);
(async()=>{
  await ctx.signUpAccount();
  assert.equal(signups,1,'new registration is available during the migration window');
  assert.match(notices.at(-1),/确认链接/);
  assert.equal(migrations,0);
  ctx.els.accountPassword.value='example-password';
  await ctx.signInAccount();
  assert.equal(entries.at(-1),'account');
  assert.equal(migrations,0,'normal login enters the workspace without opening migration');
  await ctx.finishMigrationTestLogin({user:{id:'old-owner'}});
  assert.equal(loads,1);
  assert.equal(migrations,1,'migration login proceeds to the dedicated migration page');
  await ctx.signInMigrationTestWithGoogle();
  assert.equal(storage.get('migration-pending'),'1','migration intent survives asynchronous OAuth navigation');
  console.log('OK: registration always open; account and migration routes are separate; OAuth preserves migration intent');
})().catch(error=>{console.error(error);process.exitCode=1;});
