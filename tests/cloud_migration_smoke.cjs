const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const rows = Array.from({ length: 227 }, (_, index) => ({ id: `old-${index}` }));
const ranges = [];
let signupsDisabled = false;
let oauthCalls = 0;
let hookPolicy = null;
const client = {
  async rpc() { return { data: hookPolicy, error: null }; },
  auth: {
    async signInWithOAuth() { oauthCalls += 1; return { error: null }; },
  },
  from(table) {
    assert.equal(table, "projects");
    return {
      select() { return this; },
      order() { return this; },
      async range(first, last) {
        ranges.push([first, last]);
        return { data: rows.slice(first, last + 1), error: null };
      },
    };
  },
};
const window = {
  WRITE_THEN_PUBLISH_SUPABASE: { url: "https://example.supabase.co", publishableKey: "x".repeat(30) },
  supabase: { createClient: () => client },
  location: { protocol: "https:", hostname: "fawen.fun", origin: "https://fawen.fun", pathname: "/" },
};
async function fetch(url) {
  if (url.includes("/auth/v1/settings")) {
    return { ok: true, status: 200, json: async () => ({ external: { google: true }, disable_signup: signupsDisabled }) };
  }
  assert.equal(url, "https://accounts.google.com/generate_204");
  return {};
}
vm.runInNewContext(fs.readFileSync("src/supabase.js", "utf8"), { window, fetch, AbortController, setTimeout, clearTimeout });
(async () => {
  const result = await window.WriteThenPublishCloud.listProjects();
  assert.equal(result.length, 227);
  assert.deepEqual(ranges, [[0, 199], [200, 399]]);
  assert.equal(await window.WriteThenPublishCloud.googleSignInAvailable(true), false);
  await assert.rejects(window.WriteThenPublishCloud.signInWithGoogle(true), /迁移暂未开放/);
  assert.equal(oauthCalls, 0);
  hookPolicy = { migration_open: true, registration_open: true };
  await window.WriteThenPublishCloud.signInWithGoogle(true);
  assert.equal(oauthCalls, 1);
  assert.equal(await window.WriteThenPublishCloud.googleSignInAvailable(true), true);
  hookPolicy = { migration_open: false, registration_open: true };
  await assert.rejects(window.WriteThenPublishCloud.signInWithGoogle(true), /迁移暂未开放/);
  assert.equal(oauthCalls, 1);
  await window.WriteThenPublishCloud.signInWithGoogle();
  assert.equal(oauthCalls, 2, "normal login and registration keep working after migration closes");
  console.log("OK: 227 drafts; migration OAuth follows the server deadline while normal registration stays open");
})().catch((error) => { console.error(error); process.exitCode = 1; });
