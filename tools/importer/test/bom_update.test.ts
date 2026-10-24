import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import MDSE from "../../core/src/mdse_core.js";
import { buildBom, parseDelimited } from "../src/bom.ts";
import { bomOwnedHash } from "../../core/src/bom_own.ts";
import { scanBomUpdate, applyBomUpdate, closeApproval } from "../src/bom_update.ts";
import { ROOT } from "./harness.ts";

const classes = JSON.parse(readFileSync(ROOT + "tools/core/src/classes.json", "utf8"));
const HEAD = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tParent Source\tParent State\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tChild Source\tChild State\tSSC\tReference Designator\tCild Notes\tFrom\tTO\tAmount\tUnit\tParentCL1CL2";
type R = { p: string; pr?: string; pname?: string; line: string; c: string; cr?: string; cname?: string; q?: string; u?: string };
const row = (r: R): string => `${r.p}\t${(r.pr ?? "-A99").slice(0, 2)}\t${(r.pr ?? "-A99").slice(2)}\t${r.pname ?? "ASSY " + r.p}\tbuy\tX\t${r.line}\t${r.c}\t${(r.cr ?? "-A99").slice(0, 2)}\t${(r.cr ?? "-A99").slice(2)}\t${r.cname ?? "PART " + r.c}\tbuy\tX\t\t\t\t2/Jan/19\t\t${r.q ?? "1"}\t${r.u ?? "ea"}\t${r.p}`;
const bom = (rows: R[]): string => [HEAD, ...rows.map(row)].join("\n");
const V1: R[] = [{ p: "A-100", line: "1", c: "B-200", q: "2" }, { p: "A-100", line: "2", c: "C-300" }, { p: "A-100", line: "3", c: "D-400", q: "5", u: "m" }];
const opts = (existing: Map<string, string> | null, extra: object = {}) => ({ sourceName: "bom.tsv", fingerprint: "a".repeat(64), runDate: "2026-10-20T10:00:00", authorCode: "skellyspencer", classes, existing: existing ? { hasVault: true, files: existing } : null, pending: [] as Array<[string, string]>, ...extra });
function vaultFrom(text: string): Map<string, string> { const r = buildBom(parseDelimited(text), opts(null)); return new Map(r.files.filter((f) => f.path.startsWith("BOM/")).map((f) => [f.path, f.content])); }
const scan = (v: Map<string, string>, rows: R[], extra: object = {}) => scanBomUpdate(parseDelimited(bom(rows)), opts(v, { sourceName: "bom2.tsv", runDate: "2026-11-01T09:00:00", ...extra }));
const cats = (s: ReturnType<typeof scan>) => s.items.map((i) => i.category).sort();

test("re-scanning the same BOM finds nothing to change", () => {
  const v = vaultFrom(bom(V1)), s = scan(v, V1);
  assert.deepEqual(s.items, []); assert.deepEqual(s.holds, []); assert.ok(s.unchanged >= 4);
});

test("scan: changed quantity, added line, removed line, new part, description and manufacturer, each in its own category", () => {
  const v = vaultFrom(bom(V1));
  const v2: R[] = [{ p: "A-100", line: "1", c: "B-200", q: "3" }, { p: "A-100", line: "3", c: "D-400", q: "5", u: "m" }, { p: "A-100", line: "4", c: "E-500" }];
  const s = scan(v, v2.slice(0, 3));
  assert.deepEqual(cats(s), ["LINE_ADDED", "LINE_CHANGED", "LINE_REMOVED", "NEW_PART"]);
  const changed = s.items.find((i) => i.category === "LINE_CHANGED")!; assert.match(changed.summary, /line 1.*quantity "2" → "3"/);
  assert.match(s.items.find((i) => i.category === "LINE_REMOVED")!.summary, /line 2 C.300 no longer listed/);
  const s2 = scan(v, V1.map((r) => (r.c === "B-200" ? { ...r, cname: "B RENAMED" } : r)));
  assert.ok(s2.items.some((i) => i.category === "DESCRIPTION" && i.pn === "B-200" && i.after === "B RENAMED"));
});

test("apply writes only the approved items; the stamp then describes the merged note, so the rest is offered again", () => {
  const v = vaultFrom(bom(V1)), rows: R[] = [{ p: "A-100", line: "1", c: "B-200", q: "3" }, { p: "A-100", line: "3", c: "D-400", q: "5", u: "m" }, { p: "A-100", line: "4", c: "E-500" }];
  const s = scan(v, rows), pick = (c: string) => s.items.filter((i) => i.category === c).map((i) => i.id);
  const r = applyBomUpdate(s, { approved: new Set(pick("LINE_CHANGED")), sourceName: "bom2.tsv", runDate: "2026-11-01T09:00:00" });
  const note = r.writes.find((w) => w.path.endsWith("/A-100.md"))!.content;
  assert.match(note, /B_200 \[3\]/); assert.ok(!/E_500/.test(note), "the added line was not approved"); assert.match(note, /C_300/, "the removal was not approved");
  assert.match(note, /^importSource: bom2\.tsv$/m); assert.match(note, /^importedOn: 2026-11-01$/m); assert.equal(/^importHash: (\w+)$/m.exec(note)![1], bomOwnedHash(note));
  assert.equal(MDSE.validate(note, classes).length, 0);
  assert.ok(r.writes.some((w) => w.path.startsWith("99_System/11_Import/BOM Update ")), "a report note is written");
  // scan again on the updated vault: the quantity change is done, the rest is still proposed
  const v2 = new Map(v); for (const w of r.writes) v2.set(w.path, w.content);
  const s2 = scan(v2, rows); assert.deepEqual(cats(s2), ["LINE_ADDED", "LINE_REMOVED", "NEW_PART"]);
});

test("approving a line that names a new part also creates that part's note", () => {
  const v = vaultFrom(bom(V1)), rows: R[] = [...V1, { p: "A-100", line: "4", c: "E-500" }];
  const s = scan(v, rows), added = s.items.find((i) => i.category === "LINE_ADDED")!;
  const { extra } = closeApproval(s, new Set([added.id])); assert.deepEqual(extra.map((i) => i.pn), ["E-500"]);
  const r = applyBomUpdate(s, { approved: new Set([added.id]), sourceName: "bom2.tsv", runDate: "2026-11-01T09:00:00" });
  assert.ok(r.writes.some((w) => w.path.endsWith("/E-500.md"))); assert.equal(r.alsoAdded.length, 1);
  const files = new Map(v); for (const w of r.writes) files.set(w.path, w.content);
  assert.deepEqual(scan(files, rows).items, []);
});

test("a new revision replaces the assembly as one item; an older revision in the file is held back", () => {
  const v = vaultFrom(bom(V1));
  const rev2: R[] = [{ p: "A-100", pr: "-B99", line: "1", c: "B-200", q: "2" }, { p: "A-100", pr: "-B99", line: "2", c: "C-300" }];
  const s = scan(v, rev2); const nr = s.items.find((i) => i.category === "NEW_REVISION")!;
  assert.ok(nr); assert.match(nr.summary, /"-A99" → "-B99" \(3 → 2 lines\)/);
  const r = applyBomUpdate(s, { approved: new Set([nr.id]), sourceName: "bom2.tsv", runDate: "2026-11-01T09:00:00" });
  const note = r.writes.find((w) => w.path.endsWith("/A-100.md"))!.content;
  assert.match(note, /attribute revision = "-B99";/); assert.match(note, /- Replaced revision "-A99" on 2026-11-01/);
  const v2 = new Map(v); for (const w of r.writes) v2.set(w.path, w.content);
  const back = scan(v2, V1); assert.ok(back.holds.some((h) => h.code === "OLDER_IN_FILE" && h.pn === "A-100")); assert.ok(!back.items.some((i) => i.pn === "A-100" && i.category === "NEW_REVISION"));
});

test("a note without a stamp is held back and never proposed", () => {
  const v = vaultFrom(bom(V1)), bpath = [...v.keys()].find((k) => k.endsWith("/B-200.md"))!;
  v.set(bpath, v.get(bpath)!.replace(/^importHash: .*\n/m, ""));
  const s = scan(v, [{ p: "A-100", line: "1", c: "B-200", q: "9" }, { p: "A-100", line: "2", c: "C-300" }, { p: "A-100", line: "3", c: "D-400", q: "5", u: "m" }]);
  assert.deepEqual(s.holds.map((h) => h.code), ["NO_BASELINE"]); assert.ok(!s.items.some((i) => i.pn === "B-200"));
});

test("a note edited by hand is still scanned: the file's value is offered back, marked as an edit, never ticked, and applying restamps it (BOM-033)", () => {
  const v = vaultFrom(bom(V1)), path = [...v.keys()].find((k) => k.endsWith("/A-100.md"))!;
  v.set(path, v.get(path)!.replace(/B_200 \[2\]/, "B_200 [9]").replace(/^description: .*$/m, "description: MY OWN NAME"));
  assert.notEqual(bomOwnedHash(v.get(path)!), /^importHash: (\w+)$/m.exec(v.get(path)!)![1], "the edit is visible to the stamp");
  const s = scan(v, V1);   // the file is unchanged since the import, but it no longer agrees with the note
  assert.deepEqual(s.holds, []); assert.deepEqual(cats(s), ["DESCRIPTION", "LINE_CHANGED"]);
  for (const i of s.items) { assert.equal(i.edited, true); assert.match(i.summary, /\[edited since last import\]$/); }
  assert.ok(s.items.every((i) => i.before !== "" && i.pn === "A-100"), "the item shows what is in the vault now");
  const r = applyBomUpdate(s, { approved: new Set(s.items.map((i) => i.id)), sourceName: "bom2.tsv", runDate: "2026-11-01T09:00:00" });
  const note = r.writes.find((w) => w.path.endsWith("/A-100.md"))!.content;
  assert.match(note, /B_200 \[2\]/); assert.match(note, /^description: ASSY A-100$/m); assert.equal(/^importHash: (\w+)$/m.exec(note)![1], bomOwnedHash(note)); assert.equal(MDSE.validate(note, classes).length, 0);
  const v2 = new Map(v); for (const w of r.writes) v2.set(w.path, w.content); assert.deepEqual(scan(v2, V1).items, [], "nothing is left to offer");
});

test("an edited note still gets a newer file's other changes, and an unedited note's items carry no marker", () => {
  const v = vaultFrom(bom(V1)), path = [...v.keys()].find((k) => k.endsWith("/A-100.md"))!;
  v.set(path, v.get(path)!.replace(/B_200 \[2\]/, "B_200 [9]"));
  const s = scan(v, [{ p: "A-100", line: "1", c: "B-200", q: "2" }, { p: "A-100", line: "2", c: "C-300" }, { p: "A-100", line: "3", c: "D-400", q: "6", u: "m" }, { p: "A-100", line: "4", c: "E-500" }]);
  assert.ok(s.items.some((i) => i.category === "LINE_CHANGED" && /line 3/.test(i.summary) && i.edited), "the line the file changed is offered");
  assert.ok(s.items.some((i) => i.category === "LINE_ADDED" && i.edited));
  assert.ok(s.items.filter((i) => i.pn !== "A-100").every((i) => !i.edited && !/edited since/.test(i.summary)));
});

test("a file that lists a part only as a child does not remove that part's lines", () => {
  const v = vaultFrom(bom(V1)), s = scan(v, [{ p: "TOP-1", line: "1", c: "A-100", cname: "ASSY A-100" }]);
  assert.ok(!s.items.some((i) => i.category === "LINE_REMOVED"), "A-100 has no lines in this file, so none can be missing");
  assert.deepEqual(cats(s), ["NEW_PART"]);
});
