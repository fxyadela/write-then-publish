const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const rows = Array.from({ length: 227 }, (_, index) => ({ id: `old-${index}` }));
const ranges = [];
const client = {
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
};
vm.runInNewContext(fs.readFileSync("src/supabase.js", "utf8"), { window });
window.WriteThenPublishCloud.listProjects().then((result) => {
  assert.equal(result.length, 227);
  assert.deepEqual(ranges, [[0, 199], [200, 399]]);
  console.log("OK: cloud list includes all 227 drafts without downloading media");
}).catch((error) => { console.error(error); process.exitCode = 1; });
