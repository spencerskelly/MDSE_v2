import test from "node:test";
import assert from "node:assert/strict";
import { planVaultUpdate, classifyBasePath } from "../src/vault_update.ts";
import { buildBaseVault, allPayloads } from "../../base-vault/src/base_vault.ts";
import { sha256Text } from "../src/sha256.ts";
import { readFileSync } from "node:fs";
import { ROOT } from "./harness.ts";

const classes = JSON.parse(readFileSync(new URL("../../core/src/classes.json", import.meta.url), "utf8"));

const base = buildBaseVault({ root: ROOT, release: "0.0.0-dev", classes, plugins: allPayloads(ROOT) });
const when = "2026-10-19T21:40:00";
const asRead = (m: Map<string, string>) => async (p: string): Promise<string | null> => m.get(p) ?? null;
const apply = (m: Map<string, string>, files: Array<{ path: string; content: string }>): void => { for (const f of files) m.set(f.path, f.content); };

test("an empty folder gets the whole base vault, including the Workbench plugin and its hashes", async () => {
  const r = await planVaultUpdate({ base, read: asRead(new Map()), runDate: when });
  assert.equal(r.status, "WRITE_READY");
  assert.equal(r.summary.add, Object.keys(base).length);
  const get = (p: string): string => r.files.find((f) => f.path === p)!.content;
  assert.ok(r.files.some((f) => f.path === ".obsidian/plugins/mdse-workbench/main.js"));
  assert.deepEqual(JSON.parse(get(".obsidian/community-plugins.json")), ["mdse-bootstrap", "mdse-workbench", "templater-obsidian", "obsidian-git", "advanced-canvas"]);
  const lock = get(".obsidian/plugin-lock.yaml"), main = get(".obsidian/plugins/mdse-workbench/main.js");
  assert.ok(lock.includes(`main.js: ${sha256Text(main)}`), "lock carries the real hash");
  assert.doesNotMatch(lock, /PARTIAL|not_bundled/);
  assert.match(lock, /templates_folder":"99_System\/05_Templates"/);
  assert.match(get(".obsidian/plugins/templater-obsidian/data.json"), /"trigger_on_file_creation_mode": "none"/);
  assert.match(get("99_System/THIRD_PARTY_NOTICES.md"), /AGPL-3.0/);
  assert.ok(!JSON.parse(get(".obsidian/core-plugins.json")).includes("templates"));
});

test("updating an existing vault: controlled files replaced with a saved copy, yours merged or left, identity kept", async () => {
  const v = new Map(Object.entries(base));
  // an older vault: stale template and schema, user edits everywhere else
  v.set("99_System/05_Templates/Template - Requirement.md", "old template\n");
  v.set("99_System/03_Schemas/element-types.yaml", "old: schema\n");
  v.set(".obsidian/plugins/mdse-workbench/main.js", "// old build\n");
  v.set(".obsidian/community-plugins.json", JSON.stringify(["templater-obsidian"]));
  v.set(".obsidian/core-plugins.json", JSON.stringify(["file-explorer", "daily-notes"]));
  v.set(".obsidian/app.json", JSON.stringify({ newLinkFormat: "absolute", vimMode: true, alwaysUpdateLinks: true }));
  v.set(".gitignore", "my-private/\n.DS_Store\n");
  v.set("README.md", "# My own readme\n");
  v.set(".vault.yaml", "vault_uid: 20250101000000000\nvault_name: Acme\nauthor: pat\nmdse_release: 0.0.0-old\nschema: mdse-vault/0.0\n");
  v.set(".obsidian/plugins/mdse-workbench/data.json", '{"defaultFolder":"Projects/Views"}');
  v.set("10_Model/Charger.md", "my note\n"); v.set("Attachments/x.pdf", "pdf");
  const before = new Map(v);
  const r = await planVaultUpdate({ base, read: asRead(v), runDate: when });
  assert.equal(r.status, "WRITE_READY");
  const act = (p: string): string => r.rows.find((x) => x.path === p)!.action;
  assert.equal(act("99_System/05_Templates/Template - Requirement.md"), "replace");
  assert.equal(act("99_System/03_Schemas/element-types.yaml"), "replace");
  assert.equal(act(".obsidian/plugins/mdse-workbench/main.js"), "replace");
  assert.equal(act("README.md"), "left");
  const wrote = new Map(r.files.map((f) => [f.path, f.content]));
  // a copy of every replaced template and schema is saved first; plugin builds are reproducible, so none
  assert.equal(wrote.get("99_System/11_Import/Update 2026-10-19 21.40/Replaced/99_System/05_Templates/Template - Requirement.md"), "old template\n");
  assert.equal(wrote.get("99_System/11_Import/Update 2026-10-19 21.40/Replaced/99_System/03_Schemas/element-types.yaml"), "old: schema\n");
  assert.ok(![...wrote.keys()].some((k) => k.includes("/Replaced/.obsidian/plugins")));
  assert.equal(r.summary.backups, 2);
  assert.deepEqual(JSON.parse(wrote.get(".obsidian/community-plugins.json")!), ["templater-obsidian", "mdse-bootstrap", "mdse-workbench", "obsidian-git", "advanced-canvas"]);
  assert.deepEqual(JSON.parse(wrote.get(".obsidian/core-plugins.json")!).slice(0, 2), ["file-explorer", "daily-notes"]);
  const app = JSON.parse(wrote.get(".obsidian/app.json")!); assert.equal(app.newLinkFormat, "shortest"); assert.equal(app.vimMode, true);
  const ig = wrote.get(".gitignore")!; assert.ok(ig.startsWith("my-private/\n.DS_Store\n")); assert.match(ig, /99_System\/22_Views\/\*/);
  const y = wrote.get(".vault.yaml")!; assert.match(y, /vault_uid: 20250101000000000/); assert.match(y, /vault_name: Acme/); assert.match(y, /mdse_release: 0\.0\.0-dev/); assert.match(y, /schema: mdse-vault\/0\.1/);
  assert.ok(wrote.has("99_System/11_Import/Vault Update 2026-10-19 21.40.md"));
  // never touched: notes, attachments, plugin settings, the readme
  for (const p of ["10_Model/Charger.md", "Attachments/x.pdf", ".obsidian/plugins/mdse-workbench/data.json", "README.md"]) assert.ok(!wrote.has(p), p);
  // applying it makes the next run a no-op, and nothing the user had is lost
  apply(v, r.files);
  for (const [p, t] of before) if (!wrote.has(p)) assert.equal(v.get(p), t, p);
  const again = await planVaultUpdate({ base, read: asRead(v), runDate: "2026-10-19T21:41:00" });
  assert.equal(again.status, "NO_CHANGES"); assert.equal(again.files.length, 0);
});

test("malformed JSON config is left alone, not overwritten", async () => {
  const v = new Map(Object.entries(base)); v.set(".obsidian/app.json", "{not json"); v.set(".obsidian/community-plugins.json", '{"a":1}');
  const r = await planVaultUpdate({ base, read: asRead(v), runDate: when });
  assert.equal(r.rows.find((x) => x.path === ".obsidian/app.json")!.action, "left");
  assert.equal(r.rows.find((x) => x.path === ".obsidian/community-plugins.json")!.action, "left");
  assert.ok(!r.files.some((f) => f.path.startsWith(".obsidian/app.json")));
});

test("file classes: what is controlled, merged or seeded", () => {
  const k = classifyBasePath;
  assert.equal(k("99_System/05_Templates/Template - Info.md"), "controlled"); assert.equal(k(".obsidian/plugin-lock.yaml"), "controlled");
  assert.equal(k(".obsidian/plugins/mdse-workbench/main.js"), "plugin"); assert.equal(k(".obsidian/plugins/mdse-workbench/data.json"), "seed");
  assert.equal(k("README.md"), "seed"); assert.equal(k("99_System/22_Views/README.md"), "seed"); assert.equal(k(".gitignore"), "lines-union"); assert.equal(k(".vault.yaml"), "vault-yaml");
});
