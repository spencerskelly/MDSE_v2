import test from "node:test";
import assert from "node:assert/strict";
import MDSE from "../../core/src/mdse_core.js";
import { buildIndex } from "../src/index.ts";
import type { ModelIndex } from "../src/index.ts";
import type { EditPlan } from "../src/edit.ts";
import * as M from "../src/merge_ops.ts";
import { buildBom, parseDelimited } from "../../importer/src/bom.ts";
import { importedVault, classes } from "./harness.ts";

const HEAD = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tParent Source\tParent State\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tChild Source\tChild State\tSSC\tReference Designator\tCild Notes\tFrom\tTO\tAmount\tUnit\tParentCL1CL2";
const row = (parent: string, line: number, child: string, name: string, qty: string): string =>
  [parent, "-A", "99", "CHARGER ASSEMBLY", "make", "PRODUCTION", String(line), child, "-0", "99", name, "buy", "PRODUCTION", "", "", "", "", "", qty, "ea", `${parent}-A99`].join("\t");
const GRID = [HEAD, row("ASM-100", 1, "SYN-CTRL-1", "CHARGE CONTROLLER BOARD", "1"), row("ASM-100", 2, "FAN-77", "FAN 40MM", "2")].join("\n");

const ea = await importedVault();
const bom = buildBom(parseDelimited(GRID), { sourceName: "bom.tsv", fingerprint: "a".repeat(64), runDate: "2026-10-20T10:00:00", authorCode: "skellyspencer", classes, existing: null, pending: [...ea] });
const base = new Map([...ea, ...bom.files.filter((f) => f.path.endsWith(".md")).map((f) => [f.path, f.content] as [string, string])]);
{ // a note that mentions the controller in its text and in a relationship field
  const t = base.get("02 Product/Charger.md")!;
  base.set("02 Product/Charger.md", t.replace(/\n---\n# /, '\ndependsOn: ["[[Controller~2]]"]\n---\n# ').replace(/(# Charger\n)/, "$1\nSee [[Controller~2]], [[Controller~2|the board]] and [[Controller~2#Notes]].\n"));
}
const build = (f: Map<string, string>): ModelIndex => buildIndex(f, { classes });
const apply = (f: Map<string, string>, p: EditPlan): Map<string, string> => {
  assert.deepEqual(p.problems, []);
  const m = new Map(f);
  for (const w of p.writes) { if (w.remove) m.delete(w.path); else m.set(w.path, w.after); }
  return m;
};
const ix0 = build(base);
const CTRL = "02 Product/Controller~2.md", PART = "BOM/Parts/SYN-CTRL-1.md";

test("the BOM part is named by its part number and the EA controller carries the same number", () => {
  assert.ok(base.has(PART), [...base.keys()].filter((k) => k.startsWith("BOM")).join());
  assert.match(base.get(CTRL)!, /^- PN: SYN-CTRL-1$/m);
});

test("suggestions match on the EA part number first, and are confident when one note fits", () => {
  const s = M.mgSuggest(ix0), hit = s.find((x) => x.pn === "SYN-CTRL-1")!;
  assert.deepEqual([hit.survivor, hit.candidates[0]!.path, hit.candidates[0]!.level, hit.confident], [PART, CTRL, "pn", true]);
  assert.ok(!s.some((x) => x.pn === "FAN-77" && x.confident), "no EA note carries that number");
});

test("an alias is written on the note that goes away, refused twice, and can be cleared", () => {
  const p = M.planAliasMark(ix0, base, CTRL, PART);
  assert.match(p.writes[0]!.after, /^aliasOf: \["\[\[SYN-CTRL-1\]\]"\]$/m);
  const f1 = apply(base, p), ix1 = build(f1);
  assert.deepEqual(M.mgAliasPairs(ix1).map((x) => [x.absorbed, x.survivor]), [[CTRL, PART]]);
  assert.match(M.planAliasMark(ix1, f1, CTRL, PART).problems[0]!, /already an alias/);
  assert.match(M.planAliasMark(ix1, f1, PART, CTRL).problems[0]!, /loop/);
  assert.match(M.planAliasMark(ix1, f1, CTRL, CTRL).problems[0]!, /itself/);
  assert.doesNotMatch(apply(f1, M.planAliasClear(ix1, f1, CTRL)).get(CTRL)!, /aliasOf/);
});

const f1 = apply(base, M.planAliasMark(ix0, base, CTRL, PART)), ix1 = build(f1);
const merge = M.planNoteMerge(ix1, f1);
const f2 = apply(f1, merge), ix2 = build(f2);

test("merging leaves one note per part: the BOM note keeps its identity and takes the EA note's content", () => {
  assert.equal(merge.merged, 1);
  assert.ok(!f2.has(CTRL) && f2.has(PART));
  const n = f2.get(PART)!, was = f1.get(PART)!;
  assert.equal(/^id: (.+)$/m.exec(n)![1], /^id: (.+)$/m.exec(was)![1]);
  assert.equal(/^uid: (.+)$/m.exec(n)![1], /^uid: (.+)$/m.exec(was)![1]);
  assert.match(n, /^subtype: .+$/m);
  assert.match(n, /^eaType: Class:Hardware Component$/m, "the EA class is kept");
  assert.match(n, /port ctrlIn : OBJ_\d{5}::ChargePortInterface;/);
  assert.match(n, /port auxIn : ~OBJ_\d{5}::ChargePortInterface\[0\.\.2\];/);
  assert.match(n, /connect ctrlIn to ctrlOut;/);
  assert.match(n, /attribute partNumber = "SYN-CTRL-1";/);
  assert.match(n, /part def P_SYN_CTRL_1 :> OBJ_\d{5}::GenericModule/);
  assert.match(n, /- EA GUID: \{O0000002/);
  assert.match(n, /- BOM Part Number: SYN-CTRL-1/);
  assert.match(n, /## Aliases\n\n- Controller\n/);
  assert.match(n, /## Former ids\n\n- OBJ-00005 \(uid 20210309180000000skellyspencer\)/);
  assert.match(n, /> \[!flagLink\] Port `spare` added from an assembly/, "the EA note's review flags survive");
  assert.doesNotMatch(n, /aliasOf/);
  assert.equal((n.match(/^## SysML v2/gm) ?? []).length, 1);
});

test("the merged vault is valid, scans clean, and nothing points at the removed note", () => {
  for (const n of ix2.notes.values()) { assert.deepEqual(n.warnings, [], n.path); assert.deepEqual(n.issues, [], n.path); }
  assert.deepEqual(MDSE.validate(f2.get(PART)!, classes), []);
  assert.deepEqual(ix2.duplicates, []);
  const charger = f2.get("02 Product/Charger.md")!;
  assert.match(f1.get("02 Product/Charger.md")!, /part controller : OBJ_00005::Controller/);
  const sym = ix2.notes.get(PART)!.def!.symbol;
  assert.ok(charger.includes(`part controller : ${sym}`), "typed usages now point at the surviving definition");
  assert.doesNotMatch(charger, /OBJ_00005::Controller/);
  assert.ok(ix2.edges.some((e) => e.kind === "hasPort" && e.from === PART), "its ports are in the model graph under the BOM note");
});

test("a link keeps its old words: [[Controller~2]] becomes [[SYN-CTRL-1|Controller]]; a relationship field takes the new name", () => {
  const c = f2.get("02 Product/Charger.md")!;
  assert.match(c, /^dependsOn: \["\[\[SYN-CTRL-1\]\]"\]$/m);
  assert.match(c, /See \[\[SYN-CTRL-1\|Controller\]\], \[\[SYN-CTRL-1\|the board\]\] and \[\[SYN-CTRL-1#Notes\|Controller\]\]\./);
  for (const [p, t] of f2) assert.doesNotMatch(t.split("## SysML v2")[0]!, /\[\[Controller~2/, p);
});

test("a member both notes define differently is kept apart and shown, not lost or overwritten", () => {
  const f = new Map(f1);
  f.set(PART, f.get(PART)!.replace("part def P_SYN_CTRL_1", "part def P_SYN_CTRL_1").replace(/(part def P_SYN_CTRL_1[^{]*\{\n)/, "$1        port ctrlIn : OBJ_00003::GenericModule;\n"));
  const ix = build(f), m = M.planNoteMerge(ix, f);
  assert.deepEqual(m.problems, []);
  assert.equal(m.notCarried, 1);
  const out = apply(f, m).get(PART)!;
  assert.match(out, /## Not carried over from Controller/);
  assert.match(out, /```sysml\nport ctrlIn : OBJ_\d{5}::ChargePortInterface;\n```/);
  assert.equal((out.match(/port ctrlIn :/g) ?? []).length, 2, "kept once in the block, once in the review text");
});

test("refusal: a different class", () => {
  const req = [...base.keys()].find((k) => /^type: Requirement$/m.test(base.get(k)!))!;
  assert.ok(req);
  assert.match(M.planAliasMark(ix0, base, CTRL, req).problems[0]!, /same class/);
});

test("re-merging an already merged vault finds nothing to do", () => {
  assert.match(M.planNoteMerge(ix2, f2).problems[0]!, /no aliases/);
});

test("two notes merged into one survivor in one batch, and an alias chain resolves to the end", () => {
  const extra = "02 Product/Power Train/Controller.md";
  let f = new Map(f1);
  f = apply(f, M.planAliasMark(build(f), f, extra, CTRL));          // extra -> CTRL -> PART
  const ix = build(f), m = M.planNoteMerge(ix, f);
  assert.equal(m.merged, 2);
  const out = apply(f, m);
  assert.ok(!out.has(extra) && !out.has(CTRL) && out.has(PART));
  const n = out.get(PART)!;
  assert.match(n, /OBJ-00004 \(uid /); assert.match(n, /OBJ-00005 \(uid /);
  for (const x of build(out).notes.values()) { assert.deepEqual(x.warnings, [], x.path); assert.deepEqual(x.issues, [], x.path); }
});

test("many aliases at once: every pair is checked, and one bad pair names itself", () => {
  const sug = M.mgSuggest(ix0).filter((x) => x.confident).map((x) => ({ absorbed: x.candidates[0]!.path, survivor: x.survivor }));
  assert.ok(sug.length >= 1);
  const p = M.planAliasMarkMany(ix0, base, sug);
  assert.deepEqual(p.problems, []);
  assert.equal(p.writes.length, sug.length);
  assert.match(M.planAliasMarkMany(ix0, base, [...sug, sug[0]!]).problems[0]!, /appears twice/);
});


/* ---- BOM update after the merge (D-0052): the importer changes only its own members and properties ---- */
import { scanBomUpdate, applyBomUpdate } from "../../importer/src/bom_update.ts";
import { bomOwnedHash } from "../../core/src/bom_own.ts";
const bomOpts = (files: Map<string, string>, extra: object = {}) => ({ sourceName: "bom2.tsv", fingerprint: "b".repeat(64), runDate: "2026-11-01T09:00:00", authorCode: "skellyspencer", classes, existing: { hasVault: true, files }, pending: [] as Array<[string, string]>, ...extra });
const gridV2 = (ctrlName: string, fanQty: string, ctrlRev = "-0"): string =>
  [HEAD, row("ASM-100", 1, "SYN-CTRL-1", ctrlName, "1").replace(/\t-0\t99\t/, `\t${ctrlRev}\t99\t`), row("ASM-100", 2, "FAN-77", "FAN 40MM", fanQty)].join("\n");
const modelOnly = (note: string): string[] => (MDSE.extractSysml(note) as string).split("\n").filter((l) => /^ {8}(port|satisfy|connect|bind|dependency from .*dependsOn)/.test(l));

test("the merge keeps the BOM note's description, manufacturer and import properties", () => {
  const m = f2.get(PART)!;
  assert.match(m, /^description: CHARGE CONTROLLER BOARD$/m);
  assert.match(m, /^importSource: bom\.tsv$/m); assert.match(m, /^importHash: [0-9a-f]{16}$/m);
});

test("after the merge the stamp still matches the importer's own members, so the part is not seen as edited", () => {
  const m = f2.get(PART)!;
  assert.equal(bomOwnedHash(m), /^importHash: (\w+)$/m.exec(m)![1]);
  const s = scanBomUpdate(parseDelimited(GRID), bomOpts(f2));
  assert.deepEqual(s.holds, []); assert.deepEqual(s.items, []);
});

test("a changed BOM updates a merged part without touching what the model added to it", () => {
  const before = modelOnly(f2.get(PART)!); assert.ok(before.length >= 5, "ports, satisfy, connect and bind came from the EA note");
  const s = scanBomUpdate(parseDelimited(gridV2("CONTROLLER BOARD V2", "2", "-1")), bomOpts(f2));
  assert.deepEqual(s.holds, []);
  const mine = s.items.filter((i) => i.pn === "SYN-CTRL-1"); assert.deepEqual(mine.map((i) => i.category).sort(), ["DESCRIPTION", "NEW_REVISION"]);
  const r = applyBomUpdate(s, { approved: new Set(mine.map((i) => i.id)), sourceName: "bom2.tsv", runDate: "2026-11-01T09:00:00" });
  const n = r.writes.find((w) => w.path === PART)!.content;
  assert.match(n, /^description: CONTROLLER BOARD V2$/m); assert.match(n, /attribute revision = "-199";/);
  assert.deepEqual(modelOnly(n), before, "the model's members are exactly as they were");
  assert.match(n, /:> OBJ_00003::GenericModule/, "the specialization added by the merge stays");
  assert.match(n, /## Merged from Controller/); assert.match(n, /Synthetic charge controller\./);
  assert.match(n, /^eaType: Class:Hardware Component$/m);
  assert.equal(bomOwnedHash(n), /^importHash: (\w+)$/m.exec(n)![1]);
  assert.match(n, /^importSource: bom2\.tsv$/m);
  assert.deepEqual(MDSE.validate(n, classes), []);
  // scanning again: nothing is left
  const f3 = new Map(f2); for (const w of r.writes) f3.set(w.path, w.content);
  assert.deepEqual(scanBomUpdate(parseDelimited(gridV2("CONTROLLER BOARD V2", "2", "-1")), bomOpts(f3)).items.filter((i) => i.pn === "SYN-CTRL-1"), []);
});

test("a person's change to a member the BOM owns is a conflict; a change to one the model owns is not", () => {
  const edited = new Map(f2), m = f2.get(PART)!;
  edited.set(PART, m.replace('attribute source = "buy";', 'attribute source = "make";'));
  assert.equal(scanBomUpdate(parseDelimited(gridV2("CONTROLLER BOARD V2", "2")), bomOpts(edited)).holds.map((h) => h.code).join(), "CONFLICT");
  const model = new Map(f2); model.set(PART, m.replace("port spare : OBJ_00010::CANInterface;", "port spare : OBJ_00010::CANInterface; // checked by me"));
  const s = scanBomUpdate(parseDelimited(gridV2("CONTROLLER BOARD V2", "2")), bomOpts(model));
  assert.deepEqual(s.holds, []); assert.ok(s.items.some((i) => i.category === "DESCRIPTION"));
});

/* ---- choosing the owner of each area at the merge (D-0053) ---- */
const withDup = new Map(f1); withDup.set(CTRL, f1.get(CTRL)!.replace("        port can :", "        part dup : OBJ_00003::GenericModule;\n        port can :"));
const ixDup = buildIndex(withDup, { classes });
const rowsDup = M.mgOwnerRows(withDup, CTRL, PART) as M.MgAreaRow[];
const recommended = (): M.MgOwners => Object.fromEntries(rowsDup.map((r) => [r.id, r.recommended])) as M.MgOwners;
const mergeWith = (over: Partial<M.MgOwners>): string => {
  const p = M.planNoteMerge(ixDup, withDup, undefined, new Map([[CTRL, { ...recommended(), ...over }]]));
  assert.deepEqual(p.problems, []); return p.writes.find((w) => w.path === PART)!.after;
};
const dupLine = /^ {8}part dup : OBJ_00003::GenericModule;$/m;
const inBlock = (n: string): string => MDSE.extractSysml(n) as string;

test("the owner table has seven areas and recommends the BOM note for part facts and structure, the EA note for the rest", () => {
  assert.deepEqual(rowsDup.map((r) => r.id), ["facts", "structure", "properties", "interfaces", "behavior", "requirements", "relationships"]);
  const by = Object.fromEntries(rowsDup.map((r) => [r.id, r])) as Record<string, M.MgAreaRow>;
  assert.equal(by.facts!.recommended, "survivor"); assert.equal(by.structure!.recommended, "survivor");
  for (const id of ["interfaces", "behavior", "requirements", "relationships"]) assert.equal(by[id]!.recommended, "absorbed", id);
  assert.ok(by.interfaces!.absorbed >= 5 && by.interfaces!.survivor === 0); assert.equal(by.structure!.absorbed, 1);
});

test("with the recommended owners the EA note's own structure stays out of the BOM note and nothing is lost", () => {
  const n = mergeWith({});
  assert.doesNotMatch(inBlock(n), dupLine);
  assert.match(n, /## Not carried over from Controller \(owned by|## Not carried over from Controller\n/);
  assert.match(n, /part dup : OBJ_00003::GenericModule;/, "it is kept in the note's text");
  assert.doesNotMatch(n, /^bomOwns:/m, "the BOM still owns facts and structure, which is the default");
  assert.equal(bomOwnedHash(n), /^importHash: (\w+)$/m.exec(n)![1]);
});

test("giving structure to the EA note keeps its usages, records that the BOM no longer owns structure, and a BOM update then leaves structure alone", () => {
  const n = mergeWith({ structure: "absorbed" });
  assert.match(inBlock(n), dupLine); assert.match(n, /^bomOwns: \[facts\]$/m);
  assert.equal(bomOwnedHash(n), /^importHash: (\w+)$/m.exec(n)![1]);
  const files = new Map(f1); files.set(PART, n); files.delete(CTRL);
  const s = scanBomUpdate(parseDelimited(gridV2("CONTROLLER BOARD V2", "2", "-1")), bomOpts(files));
  assert.deepEqual(s.holds, []);
  assert.deepEqual(s.items.filter((i) => i.pn === "SYN-CTRL-1").map((i) => i.category).sort(), ["DESCRIPTION", "NEW_REVISION"]);
  const r = applyBomUpdate(s, { approved: new Set(s.items.filter((i) => i.pn === "SYN-CTRL-1").map((i) => i.id)), sourceName: "bom2.tsv", runDate: "2026-11-01T09:00:00" });
  const u = r.writes.find((w) => w.path === PART)!.content;
  assert.match(inBlock(u), dupLine); assert.match(u, /^bomOwns: \[facts\]$/m); assert.match(u, /attribute revision = "-199";/);
  assert.equal(bomOwnedHash(u), /^importHash: (\w+)$/m.exec(u)![1]);
});

test("giving part facts to the EA note drops the BOM description from the note and a BOM update then ignores facts", () => {
  const n = mergeWith({ facts: "absorbed" });
  assert.doesNotMatch(n.split("\n---\n")[0]!, /^description: /m, "not in the properties"); assert.match(n, /^bomOwns: \[structure\]$/m); assert.match(n, /description: CHARGE CONTROLLER BOARD/, "kept in the note's text");
  assert.doesNotMatch(inBlock(n), /attribute partNumber/);
  const files = new Map(f1); files.set(PART, n); files.delete(CTRL);
  const s = scanBomUpdate(parseDelimited(gridV2("CONTROLLER BOARD V2", "2", "-1")), bomOpts(files));
  assert.deepEqual(s.holds, []); assert.deepEqual(s.items.filter((i) => i.pn === "SYN-CTRL-1"), []);
});

test("when the model owns every BOM area the update scan lists the note and changes nothing", () => {
  const n = mergeWith({ facts: "absorbed", structure: "absorbed" });
  assert.match(n, /^bomOwns: \[\]$/m);
  const files = new Map(f1); files.set(PART, n); files.delete(CTRL);
  const s = scanBomUpdate(parseDelimited(gridV2("CONTROLLER BOARD V2", "2", "-1")), bomOpts(files));
  assert.deepEqual(s.holds.map((h) => h.code), ["NOT_OWNED"]); assert.deepEqual(s.items.filter((i) => i.pn === "SYN-CTRL-1"), []);
});

test("a note edited before the merge is not made clean by it", () => {
  const edited = new Map(withDup); edited.set(PART, withDup.get(PART)!.replace('attribute source = "buy";', 'attribute source = "make";'));
  const p = M.planNoteMerge(buildIndex(edited, { classes }), edited, undefined, new Map([[CTRL, recommended()]]));
  const n = p.writes.find((w) => w.path === PART)!.after;
  assert.notEqual(bomOwnedHash(n), /^importHash: (\w+)$/m.exec(n)![1], "the change is still a conflict for the next BOM update");
});
