const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("index.html", "utf8");
assert.match(html, /id="migrationTestEmail" type="email"/);
assert.doesNotMatch(html, /value="heyfxyadela@gmail.com"/);
assert.doesNotMatch(html, /目前仅开放 heyfxyadela@gmail.com/);

const source = fs.readFileSync("src/app.js", "utf8");
function section(start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `missing ${start}`);
  return source.slice(first, last);
}

const notices = [];
const signIns = [];
const els = {
  migrationTestEmail: { value: "" },
  migrationTestPassword: { value: "example-password" },
};
const context = {
  MIGRATION_TEST_MODE: true,
  MIGRATION_TEST_USER_ID: "owner-id",
  MIGRATION_TEST_EMAIL: "heyfxyadela@gmail.com",
  PILOT_ONLY_NOTICE: "暂时不能测试",
  migrationTestAuthMode: "signin",
  els,
  setMigrationTestBusy: () => {},
  setMigrationTestNotice: (message) => notices.push(message),
  cloudApi: () => ({
    signIn: async (email, password) => {
      signIns.push({ email, password });
      return { session: { user: { id: "owner-id", email } } };
    },
  }),
  finishMigrationTestLogin: async () => {},
  isCloudRestrictedMessage: () => false,
};
vm.createContext(context);
vm.runInContext([
  section("function isMigrationTestUser(user)", "function scopedStorageKey("),
  section("async function signInMigrationTestWithEmail(event)", "async function signInMigrationTestWithGoogle()"),
].join("\n"), context);

(async () => {
  assert.equal(context.isMigrationTestUser({ id: "owner-id", email: "heyfxyadela@gmail.com" }), true);
  assert.equal(context.isMigrationTestUser({ id: "someone-else", email: "heyfxyadela@gmail.com" }), false);
  assert.equal(context.isMigrationTestUser({ id: "owner-id", email: "other@example.com" }), false);

  const event = { preventDefault() {} };
  els.migrationTestEmail.value = "other@example.com";
  await context.signInMigrationTestWithEmail(event);
  assert.equal(notices.at(-1), "暂时不能测试");
  assert.equal(signIns.length, 0, "non-test emails must not reach Auth");

  els.migrationTestEmail.value = "heyfxyadela@gmail.com";
  context.migrationTestAuthMode = "signup";
  await context.signInMigrationTestWithEmail(event);
  assert.match(notices.at(-1), /已有账号/);
  assert.equal(signIns.length, 0, "the existing account must not be signed up again");

  context.migrationTestAuthMode = "signin";
  await context.signInMigrationTestWithEmail(event);
  assert.deepEqual(signIns, [{ email: "heyfxyadela@gmail.com", password: "example-password" }]);
  console.log("OK: blank email field, exact pilot notice, allowlisted login only");
})().catch((error) => { console.error(error); process.exitCode = 1; });
