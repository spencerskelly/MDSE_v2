import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const bump = fileURLToPath(new URL("./bump.mjs", import.meta.url));
const put = (root, p, v) => { const f = join(root, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, v); };
const git = (root, ...a) => { const r = spawnSync("git", a, { cwd: root, encoding: "utf8" }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
const run = (root, ...a) => spawnSync(process.execPath, [bump, ...a, "--base", "main", "--no-build"], { cwd: root, encoding: "utf8", env: { ...process.env, MDSE_BUMP_ROOT: root } });
const ver = (root, p) => JSON.parse(readFileSync(join(root, p), "utf8")).version;

test("bump raises only the components whose source changed, once, with history and changelog", () => {
  const dir = mkdtempSync(join(tmpdir(), "mdse-bump-"));
  try {
    git(dir, "init", "-q", "-b", "main"); git(dir, "config", "user.email", "ci@example.invalid"); git(dir, "config", "user.name", "Bump");
    put(dir, "package.json", JSON.stringify({ version: "0.13.2" }) + "\n");
    put(dir, "tools/importer/version.json", JSON.stringify({ version: "0.13.2", history: [{ version: "0.13.2", date: "2026-11-26", status: "candidate", summary: "old" }] }, null, 2) + "\n");
    put(dir, "tools/workbench/manifest.json", JSON.stringify({ id: "mdse-workbench", version: "0.12.2" }, null, 2) + "\n");
    put(dir, "tools/bootstrap/manifest.json", JSON.stringify({ version: "0.1.0" }) + "\n");
    put(dir, "tools/testbench/manifest.json", JSON.stringify({ version: "0.1.2" }) + "\n");
    put(dir, "tools/workbench/src/a.ts", "// a\n");
    put(dir, "CHANGELOG.md", "# Changelog\n\n## Unreleased\n\n### Candidate toolset 0.13.2 — earlier (2026-11-26)\n\n- earlier\n");
    git(dir, "add", "."); git(dir, "commit", "-qm", "base");
    git(dir, "checkout", "-qb", "work");
    put(dir, "tools/workbench/src/a.ts", "// changed\n");
    let r = run(dir, "patch", "Fix the thing.");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(ver(dir, "tools/workbench/manifest.json"), "0.12.3");
    assert.equal(ver(dir, "tools/importer/version.json"), "0.13.3");
    assert.equal(ver(dir, "package.json"), "0.13.3");
    assert.equal(ver(dir, "tools/testbench/manifest.json"), "0.1.2", "untouched component stays");
    assert.equal(ver(dir, "tools/bootstrap/manifest.json"), "0.1.0");
    const h = JSON.parse(readFileSync(join(dir, "tools/importer/version.json"), "utf8")).history;
    assert.deepEqual(h.map((x) => [x.version, x.summary]), [["0.13.3", "Fix the thing."], ["0.13.2", "old"]]);
    let cl = readFileSync(join(dir, "CHANGELOG.md"), "utf8");
    assert.match(cl, /## Unreleased\n\n### Candidate toolset 0.13.3 — Fix the thing \(\d{4}-\d{2}-\d{2}\)\n\n- \*\*Workbench 0\.12\.3 \/ Importer and toolset 0\.13\.3:\*\* Fix the thing\.\n/);
    // a second run after more work moves nothing again and adds the new summary to the same entry
    r = run(dir, "patch", "And another fix.");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(ver(dir, "tools/workbench/manifest.json"), "0.12.3");
    cl = readFileSync(join(dir, "CHANGELOG.md"), "utf8");
    assert.equal(cl.match(/### Candidate toolset 0\.13\.3/g).length, 1);
    assert.match(cl, /And another fix\./);
    assert.equal(JSON.parse(readFileSync(join(dir, "tools/importer/version.json"), "utf8")).history[0].summary, "And another fix.");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("bump refuses without a level and a summary", () => {
  const r = spawnSync(process.execPath, [bump, "patch"], { encoding: "utf8" });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Usage/);
});
