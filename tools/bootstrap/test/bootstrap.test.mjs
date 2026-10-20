import test from "node:test";
import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allPayloads } from "../../base-vault/src/base_vault.ts";
import { buildBaseVault } from "../../base-vault/src/base_vault.ts";
import { deriveAuthorCode as importerDerive } from "../../importer/src/identity.ts";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(here, "../../..");
const require = createRequire(import.meta.url);
const classes = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/core/src/classes.json"), "utf8"));
const base = buildBaseVault({ root: ROOT, release: "0.0.0-dev", classes, plugins: allPayloads(ROOT) });

// A minimal stand-in for Obsidian so the plugin class loads.
class Plugin { constructor(app, manifest) { this.app = app; this.manifest = manifest; } addCommand() {} }
const origLoad = Module._load;
Module._load = function (req, ...r) { return req === "obsidian" ? { Plugin, Notice: class { constructor(m) { Notice.log.push(m); } }, Modal: class {}, Setting: class {} } : origLoad.call(this, req, ...r); };
const Notice = globalThis.__N ??= { log: [] }; Notice.log = [];
const BS = require("../src/main.js");

function fakeApp(files, enabled = []) {
  const f = new Map(Object.entries(files)), en = new Set(enabled), core = new Set(["file-explorer", "templates"]);
  return { f, en, app: {
    vault: { adapter: { exists: async (p) => f.has(p), read: async (p) => f.get(p), write: async (p, t) => { f.set(p, t); }, mkdir: async () => {} } },
    workspace: { onLayoutReady: (fn) => fn() },
    plugins: { enabledPlugins: en, enablePluginAndSave: async (id) => { en.add(id); } },
    internalPlugins: { getPluginById: () => ({}), getEnabledPluginById: (id) => core.has(id), enablePlugin: async (id) => { core.add(id); }, disablePlugin: async (id) => { core.delete(id); } } }, core };
}
const H = () => { const m = { exports: {} }; const src = fs.readFileSync(path.join(here, "../src/main.js"), "utf8"); new Function("module", "require", "crypto", "TextEncoder", src)(m, () => { throw new Error("no obsidian"); }, globalThis.crypto, TextEncoder); return m.exports; };

test("author code matches the importer's rule (MOD-002)", () => {
  const h = H();
  for (const n of ["Spencer Skelly", "Skelly, Spencer", "Madonna", "Jean-Luc Picard-Smith", "Bartholomew Featherstonehaugh"]) assert.equal(h.deriveAuthorCode(n), importerDerive(n), n);
  assert.equal(h.deriveAuthorCode("Spencer Skelly"), "skellyspencer");
});

test("the lock written by the base vault parses, and every shipped plugin verifies against it", async () => {
  const h = H(), lock = h.parseLock(base[".obsidian/plugin-lock.yaml"]);
  assert.deepEqual(Object.keys(lock.plugins), ["mdse-bootstrap", "mdse-workbench", "templater-obsidian", "obsidian-git", "advanced-canvas"]);
  assert.deepEqual(lock.requiredCorePlugins, ["bases", "canvas", "properties", "file-explorer", "command-palette"]);
  assert.deepEqual(lock.disabledCorePlugins, ["templates"]);
  assert.equal(lock.plugins["templater-obsidian"].settings.templates_folder, "99_System/05_Templates");
  assert.equal(lock.plugins["advanced-canvas"].settings, null);
  for (const [id, e] of Object.entries(lock.plugins)) {
    assert.equal(Object.keys(e.sha256).length, 3, id);
    assert.deepEqual(await h.verifyPlugin(async (p) => base[p] ?? null, id, e), [], id);
  }
  const lock2 = h.parseLock(base[".obsidian/plugin-lock.yaml"]);
  assert.deepEqual(await h.verifyPlugin(async (p) => p.endsWith("obsidian-git/main.js") ? "tampered" : base[p] ?? null, "obsidian-git", lock2.plugins["obsidian-git"]), ["main.js differs"]);
  assert.deepEqual(await h.verifyPlugin(async (p) => p.endsWith("styles.css") ? null : base[p] ?? null, "obsidian-git", lock2.plugins["obsidian-git"]), ["styles.css missing"]);
});

test("governed keys win, the person's other keys stay", () => {
  const h = H();
  const r = h.mergeGoverned({ templates_folder: "x", mine: 1 }, { templates_folder: "99_System/05_Templates", trigger_on_file_creation_mode: "none" });
  assert.deepEqual(r.next, { templates_folder: "99_System/05_Templates", mine: 1, trigger_on_file_creation_mode: "none" }); assert.ok(r.changed);
  assert.equal(h.mergeGoverned({ a: 1 }, { a: 1 }).changed, false);
});

test("run: enables verified plugins, applies governed settings, fixes core plugins, skips a tampered plugin", async () => {
  Module._load = origLoad;
  Module._load = function (req, ...r) { return req === "obsidian" ? { Plugin, Notice: class { constructor(m) { Notice.log.push(m); } }, Modal: class {}, Setting: class {} } : origLoad.call(this, req, ...r); };
  delete require.cache[require.resolve("../src/main.js")];
  const Mdse = require("../src/main.js"), files = { ...base, ".obsidian/plugins/obsidian-git/main.js": "tampered", ".obsidian/plugins/templater-obsidian/data.json": JSON.stringify({ templates_folder: "wrong", mine: 5 }) };
  const { app, en, f, core } = fakeApp(files, ["mdse-bootstrap"]);
  const p = new Mdse(app, { id: "mdse-bootstrap" }); Notice.log = [];
  await p.run(true);
  assert.ok(en.has("mdse-workbench") && en.has("templater-obsidian") && en.has("advanced-canvas"));
  assert.ok(!en.has("obsidian-git"), "tampered plugin stays off");
  assert.match(Notice.log.join("\n"), /obsidian-git: not enabled, main\.js differs/);
  const t = JSON.parse(f.get(".obsidian/plugins/templater-obsidian/data.json"));
  assert.equal(t.templates_folder, "99_System/05_Templates"); assert.equal(t.mine, 5);
  assert.ok(!core.has("templates") && core.has("file-explorer"));
  await p.run(true); Notice.log = []; await p.run(true);
  assert.match(Notice.log.join("\n"), /obsidian-git: not enabled/);   // still reported, nothing else to say
});

test("run: an author already in .vault.yaml is left alone", async () => {
  delete require.cache[require.resolve("../src/main.js")];
  const Mdse = require("../src/main.js"), files = { ...base, ".vault.yaml": "vault_uid: 1\nvault_name: A\nauthor: skellyspencer\n" };
  const { app, f } = fakeApp(files, ["mdse-bootstrap", "mdse-workbench", "templater-obsidian", "obsidian-git", "advanced-canvas"]);
  await new Mdse(app, { id: "mdse-bootstrap" }).ensureAuthor();
  assert.match(f.get(".vault.yaml"), /author: skellyspencer/);
});
