import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const M = require("../src/mdse_core.js");
const classes = require("../src/classes.json");
const dir = fileURLToPath(new URL("../../../testing/fixtures/golden-charger/", import.meta.url));
const read = (n) => fs.readFileSync(dir + n, "utf8");
const codes = (t) => M.validate(t, classes).map((i) => i.code);

test("golden fixtures validate clean", () => {
  for (const n of ["Charger.md", "Controller.md", "Power Module.md"]) assert.deepEqual(codes(read(n)), [], n);
});

const NOTE = `---
type: Object
subtype: part
id: OBJ-00042
uid: 20261018230000001skellyspencer
status: Draft
eaType: Hardware Component
tags: []
sourceRole: authoritative-model
primarySymbol: P::Thing
---
# Thing

My own words about the thing.

## Notes
- keep me



## Source: EA

EA GUID: {AAA}
- PN: 1

## SysML v2

`;
const gen = (sysml, extra = {}) => {
  const base = { subtype: "part", eaType: "Hardware Component", ...extra };
  return `---\ntype: Object\nsubtype: ${base.subtype}\nid: OBJ-00042\nuid: 20261018230000001skellyspencer\nstatus: Draft\neaType: ${base.eaType}\ntags: []\nsourceRole: authoritative-model\nprimarySymbol: P::Thing\n---\n# Thing\n\n\n\n\n## Source: EA\n\nEA GUID: {AAA}\n- PN: ${extra.pn ?? 1}\n\n` + M.renderSysmlSection(sysml);
};
const SYS1 = "package P { part def Thing; }", SYS2 = "package P { part def Thing { attribute x; } }";
const existing = () => {
  let t = gen(SYS1);
  t = t.replace("# Thing\n\n\n\n\n", "# Thing\n\nMy own words about the thing.\n\n## Notes\n- keep me\n\n\n\n").replace("status: Draft", "status: Reviewed").replace("tags: []", "tags: [charger]");
  return t;
};

test("generated sample is valid", () => assert.deepEqual(codes(gen(SYS1)), []));

test("rerun with identical source is a no-op", () => {
  const e = existing(); const r = M.mergeNote(e, gen(SYS1));
  assert.equal(r.action, "unchanged"); assert.equal(r.text, e);
});

test("rerun refreshes SysML and Source, keeps user zone, status and tags", () => {
  const e = existing(); const r = M.mergeNote(e, gen(SYS2, { pn: 2 }));
  assert.equal(r.action, "merge");
  assert.ok(r.text.includes("My own words about the thing.\n\n## Notes\n- keep me"));
  assert.ok(r.text.includes("status: Reviewed") && r.text.includes("tags: [charger]"));
  assert.ok(r.text.includes("attribute x;") && r.text.includes("- PN: 2"));
  assert.deepEqual(codes(r.text), []);
});

test("merge is idempotent", () => {
  const e = existing(); const once = M.mergeNote(e, gen(SYS2)).text;
  assert.equal(M.mergeNote(once, gen(SYS2)).action, "unchanged");
});

test("EA-owned keys refresh and are logged; id and uid never change", () => {
  const r = M.mergeNote(existing(), gen(SYS1, { eaType: "Software Component" }));
  assert.deepEqual(r.log, ["eaType: Hardware Component -> Software Component"]);
  assert.ok(r.text.includes("eaType: Software Component") && r.text.includes("id: OBJ-00042"));
});

test("a missing EA-owned key is inserted in order", () => {
  let e = existing().replace("eaType: Hardware Component\n", "");
  const r = M.mergeNote(e, gen(SYS1));
  assert.ok(r.text.indexOf("status: Reviewed") < r.text.indexOf("eaType: Hardware Component"));
  assert.ok(r.text.indexOf("eaType: Hardware Component") < r.text.indexOf("tags: [charger]"));
});

test("type change and uid mismatch are conflicts and write nothing", () => {
  const e = existing();
  const t = M.mergeNote(e, gen(SYS1).replace("type: Object", "type: Actor"));
  assert.equal(t.action, "conflict"); assert.equal(t.text, e); assert.match(t.reason, /TYPE_CHANGED/);
  const u = M.mergeNote(e, gen(SYS1).replace("skellyspencer", "someoneelse---"));
  assert.equal(u.reason, "UID_MISMATCH");
});

test("CRLF notes stay CRLF", () => {
  const e = existing().replace(/\n/g, "\r\n"); const r = M.mergeNote(e, gen(SYS2));
  assert.ok(!/[^\r]\n/.test(r.text));
});

test("a note with no footer gets one appended; user text untouched", () => {
  const bare = "---\ntype: Object\nsubtype: part\nid: OBJ-00042\nuid: 20261018230000001skellyspencer\nstatus: Draft\ntags: []\n---\n# Thing\n\nhand-written\n";
  const r = M.mergeNote(bare, gen(SYS1));
  assert.ok(r.text.includes("# Thing\n\nhand-written\n"));
  assert.deepEqual(codes(r.text), []);
});

test("mutation guard: merging must change the SysML block", () => {
  const r = M.mergeNote(existing(), gen(SYS2));
  assert.notEqual(M.extractSysml(r.text), M.extractSysml(existing()));
});

test("indexByUid finds notes that were moved", () => {
  const idx = M.indexByUid([["a/moved.md", existing()], ["b/x.md", "no frontmatter"]]);
  assert.equal(idx.get("20261018230000001skellyspencer"), "a/moved.md");
});

test("crc32 known vector", () => assert.equal(M.crc32(new TextEncoder().encode("123456789")), 0xCBF43926));
