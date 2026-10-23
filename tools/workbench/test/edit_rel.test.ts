import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import type { ModelIndex, Edge } from "../src/index.ts";
import * as E from "../src/edit.ts";
import * as R from "../src/edit_rel.ts";
import { importedVault, classes } from "./harness.ts";

const base = await importedVault();
const build = (f: Map<string, string>): ModelIndex => buildIndex(f, { classes });
const apply = (f: Map<string, string>, p: E.EditPlan): Map<string, string> => { const m = new Map(f); for (const w of p.writes) m.set(w.path, w.after); return m; };
const ix0 = build(base);
const refEdges = (ix: ModelIndex): Edge[] => ix.edges.filter((e) => e.ref);
const count = (ix: ModelIndex, owner: string, key: string): number => ix.edges.filter((e) => e.ref?.owner === owner && e.ref.key === key).length;

test("every SysML edge names the member that holds it, and the member can be found", () => {
  const edges = refEdges(ix0);
  assert.ok(edges.length > 20);
  for (const e of edges) assert.ok(R.edRelInfo(ix0, e.ref!), `${e.kind} ${e.ref!.key}`);
});

test("reading a member back and writing it again changes nothing, for everything the importer writes", () => {
  for (const e of refEdges(ix0)) {
    const info = R.edRelInfo(ix0, e.ref!)!;
    if (info.why || !info.rel || !info.form.target) continue;
    const p = R.planUpdateRelationship(ix0, base, e.ref!, info.form);
    assert.deepEqual(p.problems, ["Nothing to change: the block already says this."].slice(0, p.problems.length) && p.problems, `${e.kind} ${e.ref!.key}`);
    assert.ok(p.writes.length === 0 && /Nothing to change/.test(p.problems[0] ?? ""), `${e.kind} ${e.ref!.key}: ${p.problems.join(";")}`);
  }
});

test("every relationship can be removed, leaving a block that still scans clean and one edge fewer", () => {
  let n = 0;
  for (const e of refEdges(ix0)) {
    const before = count(ix0, e.ref!.owner, e.ref!.key);
    const p = R.planRemoveRelationship(ix0, base, e.ref!);
    assert.deepEqual(p.problems, [], `${e.kind} ${e.ref!.key}`);
    const ix2 = build(apply(base, p)), note = ix2.notes.get(e.ref!.owner)!;
    assert.deepEqual(note.warnings, [], `${e.kind}: scans clean`);
    assert.deepEqual(note.issues, [], `${e.kind}: format check`);
    assert.equal(count(ix2, e.ref!.owner, e.ref!.key), before - 1, `${e.kind} ${e.ref!.key}: gone`);
    n++;
  }
  assert.ok(n > 20);
});

const owns = (): Edge => ix0.edges.find((e) => {
  if (!(e.ref?.kind === "member" && e.kind === "hasPart" && e.to)) return false;
  const i = R.edRelInfo(ix0, e.ref)!, blk = ix0.notes.get(e.ref.owner)!.block!;
  return !new RegExp(`\\b${i.form.name}\\b`).test(blk.replace(e.ref.key, ""));
})!;

test("a usage can be renamed, re-quantified, described and given attributes; it reads back the same", () => {
  const e = owns(), info = R.edRelInfo(ix0, e.ref!)!;
  const form: R.RelForm = { ...info.form, name: "renamedCell", mult: "4", ordered: true, doc: "Four cells, */ in series; really.", attrs: [{ name: "torque", value: "5" }, { name: "supplier", value: "Acme Ltd" }, { name: "note", value: "a; b } c // d */ e" }] };
  const p = R.planUpdateRelationship(ix0, base, e.ref!, form);
  assert.deepEqual(p.problems, []);
  const ix2 = build(apply(base, p)), n = ix2.notes.get(e.ref!.owner)!, u = n.def!.usages.find((x) => x.name === "renamedCell")!;
  assert.deepEqual(n.warnings, []);
  assert.ok(u, "usage present");
  assert.equal(u.mult, "[4]"); assert.deepEqual(u.mods, ["ordered"]); assert.equal(u.doc, "Four cells, * / in series; really.");
  assert.deepEqual(u.props, [{ name: "torque", value: "5" }, { name: "supplier", value: "Acme Ltd" }, { name: "note", value: "a; b } c // d * / e" }]);
  assert.equal(n.def!.usages.filter((x) => x.kind === "attribute").length, 0, "attributes are properties, not usages of the definition");
  assert.ok(ix2.edges.some((x) => x.from === e.from && x.to === e.to && x.kind === "hasPart"), "still the same edge");
  // and it can be edited again from its new form
  const again = R.edRelInfo(ix2, ix2.edges.find((x) => x.ref?.key === u.head)!.ref!)!;
  assert.deepEqual(again.form.attrs.length, 3);
  assert.match(R.planUpdateRelationship(ix2, apply(base, p), again.rel ? ix2.edges.find((x) => x.ref?.key === u.head)!.ref! : e.ref!, again.form).problems[0] ?? "", /Nothing to change/);
});

test("rename is refused for a clash or a name used elsewhere in the block; bad quantity and bad attribute names are refused", () => {
  const e = owns(), info = R.edRelInfo(ix0, e.ref!)!, d = ix0.notes.get(e.ref!.owner)!.def!;
  const other = d.usages.find((u) => u.name !== info.form.name);
  if (other) assert.equal(R.planUpdateRelationship(ix0, base, e.ref!, { ...info.form, name: other.name }).problems.length, 1);
  assert.equal(R.planUpdateRelationship(ix0, base, e.ref!, { ...info.form, name: "1bad" }).problems.length, 1);
  assert.equal(R.planUpdateRelationship(ix0, base, e.ref!, { ...info.form, mult: "x" }).problems.length, 1);
  assert.equal(R.planUpdateRelationship(ix0, base, e.ref!, { ...info.form, attrs: [{ name: "doc", value: "x" }] }).problems.length, 1);
  assert.equal(R.planUpdateRelationship(ix0, base, e.ref!, { ...info.form, attrs: [{ name: "a b", value: "x" }] }).problems.length, 1);
});

test("a dependency changes kind and gains a description; the kind survives the body", () => {
  const e = ix0.edges.find((x) => x.ref?.kind === "member" && x.kind === "refines" && x.to) ?? ix0.edges.find((x) => x.ref?.kind === "member" && ["trace", "dependsOn", "derivedFrom"].includes(x.kind) && x.to)!;
  const info = R.edRelInfo(ix0, e.ref!)!, kind = info.form.depKind === "trace" ? "refines" : "trace";
  const p = R.planUpdateRelationship(ix0, base, e.ref!, { ...info.form, depKind: kind, doc: "Because of the standard." });
  assert.deepEqual(p.problems, []);
  const ix2 = build(apply(base, p));
  assert.ok(ix2.edges.some((x) => x.from === e.from && x.to === e.to && x.kind === kind), "new kind");
  assert.ok(!ix2.edges.some((x) => x.from === e.from && x.to === e.to && x.kind === e.kind && x.ref?.key === e.ref!.key && e.kind !== kind), "old kind gone");
  assert.deepEqual(ix2.notes.get(e.ref!.owner)!.warnings, []);
});

test("a target can be changed to another eligible note; an ineligible one is refused", () => {
  const e = ix0.edges.find((x) => x.kind === "satisfies" && x.ref && x.to)!, info = R.edRelInfo(ix0, e.ref!)!, owner = ix0.notes.get(e.ref!.owner)!;
  const other = E.edTargets(ix0, info.rel!, owner).find((n) => n.path !== info.form.target);
  if (other) {
    const p = R.planUpdateRelationship(ix0, base, e.ref!, { ...info.form, target: other.path });
    assert.deepEqual(p.problems, []);
    const ix2 = build(apply(base, p));
    assert.ok(ix2.edges.some((x) => x.from === owner.path && x.to === other.path && x.kind === "satisfies"));
  }
  const part = [...ix0.notes.values()].find((n) => n.def?.keyword === "part def")!;
  assert.equal(R.planUpdateRelationship(ix0, base, e.ref!, { ...info.form, target: part.path }).problems.length, 1);
});

test("verify lines inside an objective are removed one at a time, and the empty objective goes with the last", () => {
  const ver = [...ix0.notes.values()].find((n) => n.def?.keyword === "verification def" && n.def.stmts.some((s) => s.kind === "verify"))!;
  const reqs = [...ix0.notes.values()].filter((n) => n.def?.keyword === "requirement def" && n.path !== "");
  let files = base, ix = ix0;
  for (const r of reqs.slice(0, 2)) if (!ver.def!.stmts.some((s) => s.kind === "verify" && s.a === r.def!.symbol)) { files = apply(files, E.planAddRelationship(ix, files, { rel: "verify", from: ver.path, to: r.path })); ix = build(files); }
  const refs = ix.edges.filter((x) => x.ref?.kind === "verify" && x.ref.owner === ver.path).map((x) => x.ref!);
  assert.ok(refs.length >= 2);
  for (const ref of refs) {
    const p = R.planRemoveRelationship(ix, files, ref);
    assert.deepEqual(p.problems, []);
    files = apply(files, p); ix = build(files);
    assert.deepEqual(ix.notes.get(ver.path)!.warnings, []);
  }
  assert.equal(ix.edges.filter((x) => x.ref?.kind === "verify" && x.ref.owner === ver.path).length, 0);
  assert.doesNotMatch(files.get(ver.path)!, /objective/);
});

test("specialization can be changed and removed", () => {
  const e = ix0.edges.find((x) => x.ref?.kind === "specializes" && x.to);
  if (!e) return;
  const info = R.edRelInfo(ix0, e.ref!)!, owner = ix0.notes.get(e.ref!.owner)!;
  const other = E.edTargets(ix0, info.rel!, owner).find((n) => n.path !== info.form.target);
  if (other) { const p = R.planUpdateRelationship(ix0, base, e.ref!, { ...info.form, target: other.path }); assert.deepEqual(p.problems, []); assert.ok(build(apply(base, p)).edges.some((x) => x.from === owner.path && x.to === other.path && x.kind === "specializes")); }
  const r = R.planRemoveRelationship(ix0, base, e.ref!), ix2 = build(apply(base, r));
  assert.ok(!ix2.edges.some((x) => x.from === owner.path && x.kind === "specializes" && x.to === e.to));
  assert.deepEqual(ix2.notes.get(owner.path)!.warnings, []);
});

test("a BOM note's relationships are all read from SysML: usages, a drawing reference, a supersedes dependency (BOM-025)", async () => {
  const { buildBom } = await import("../../importer/src/bom.ts");
  const g = (rows: string[][]) => rows.map((r) => r.map((v) => (v === "" ? null : { v })));
  const grid = g([["Parent Part Number", "Parent CL1", "Parent CL2", "Parent Part Name", "Linenumber", "Child Part Number", "Child CL1", "Child CL2", "Child Name", "Amount", "Unit"],
    ["A-1", "A", "01", "TOP", "1", "B-2", "A", "01", "SCREW", "2", "ea"], ["A-1", "A", "01", "TOP", "2", "DWG-9", "A", "01", "DWG TOP", "0", "ea"]]);
  const r = buildBom(grid as any, { sourceName: "t", fingerprint: "a".repeat(64), runDate: "2026-10-23T10:00:00", authorCode: "skellyspencer", classes: classes as any, existing: null, pending: [] });
  const files = new Map(r.files.filter((f) => f.path.endsWith(".md") && f.path.startsWith("BOM/")).map((f) => [f.path, f.content] as [string, string]));
  const ix = buildIndex(files, { classes });
  const top = [...ix.notes.values()].find((n) => n.title === "A-1")!;
  assert.ok(!/^(hasPart|references):/m.test(files.get(top.path)!), "no relationship in YAML");
  const kinds = ix.edges.filter((e) => e.from === top.path).map((e) => e.kind).sort();
  assert.deepEqual(kinds, ["hasPart", "references"]);
  assert.ok(ix.edges.every((e) => e.via === "sysml"));
  assert.deepEqual(ix.notes.get(top.path)!.warnings, []);
});
