import test from "node:test";
import assert from "node:assert/strict";
import MDSE from "../../core/src/mdse_core.js";
import { buildIndex } from "../src/index.ts";
import type { ModelIndex } from "../src/index.ts";
import * as E from "../src/edit.ts";
import { importedVault, classes } from "./harness.ts";

const base = await importedVault();
const build = (f: Map<string, string>): ModelIndex => buildIndex(f, { classes });
const apply = (f: Map<string, string>, p: E.EditPlan): Map<string, string> => { const m = new Map(f); for (const w of p.writes) m.set(w.path, w.after); return m; };
const AUTHOR = "skellyspencer";

test("a new element gets id, uid, status and a SysML block, and passes the format check (D-0030)", () => {
  const ix = build(base);
  const plan = E.planAddElement(ix, classes, { type: "Requirement", subtype: "functional", title: "Stop at 80 % */ charge", folder: "01 New", text: "The charger shall stop at 80 %. */ done", author: AUTHOR, now: new Date(2026, 9, 20, 9, 42, 1, 5) });
  assert.deepEqual(plan.problems, []);
  assert.equal(plan.writes.length, 1);
  const w = plan.writes[0]!;
  assert.equal(w.before, null);
  assert.match(w.path, /^01 New\/Stop at 80 % \* charge\.md$|^01 New\/Stop at 80 %/);
  const f2 = apply(base, plan), ix2 = build(f2), n = ix2.notes.get(w.path)!;
  assert.ok(n, "indexed");
  assert.match(n.id, /^REQ-\d{5}$/);
  assert.match(n.uid, /^20261020094201005skellyspencer$/);
  assert.equal(n.status, "Draft");
  assert.deepEqual(n.issues, [], "format check");
  assert.deepEqual(n.warnings, []);
  assert.equal(n.def!.doc, "The charger shall stop at 80 %. * / done");
  assert.equal(n.body, "", "wording is not repeated in the body");
});

test("ids continue from the highest number; uids never repeat", () => {
  const ix = build(base);
  const a = E.planAddElement(ix, classes, { type: "Object", subtype: "part", title: "Fan", folder: "", author: AUTHOR, now: new Date(2026, 0, 1, 0, 0, 0, 0) });
  const f2 = apply(base, a), ix2 = build(f2);
  const b = E.planAddElement(ix2, classes, { type: "Object", subtype: "part", title: "Fan", folder: "", author: AUTHOR, now: new Date(2026, 0, 1, 0, 0, 0, 0) });
  const n1 = ix2.notes.get(a.writes[0]!.path)!, f3 = apply(f2, b), n2 = build(f3).notes.get(b.writes[0]!.path)!;
  assert.notEqual(n1.id, n2.id); assert.notEqual(n1.uid, n2.uid); assert.notEqual(n1.path, n2.path);
  assert.equal(Number(n2.id.slice(-5)), Number(n1.id.slice(-5)) + 1);
});

test("an element is refused without a name, an author or a valid subtype", () => {
  const ix = build(base);
  for (const o of [{ title: "  ", author: AUTHOR, subtype: "part" }, { title: "X", author: "", subtype: "part" }, { title: "X", author: AUTHOR, subtype: "nope" }])
    assert.equal(E.planAddElement(ix, classes, { type: "Object", folder: "", ...o }).problems.length, 1);
});

const EDGE: Record<string, string[]> = { owns: ["hasPart", "hasPort", "hasAction", "hasState", "hasFlow"], satisfy: ["satisfies"], verify: ["verifies"], allocate: ["allocatedTo"], perform: ["performs"],
  derivedFrom: ["derivedFrom"], refines: ["refines"], trace: ["trace"], dependsOn: ["dependsOn"], specializes: ["specializes"], include: ["includes"], extend: ["extendedBy"] };

test("every relationship kind writes valid SysML the index reads back as the same edge", () => {
  const ix = build(base), done: string[] = [];
  for (const rel of E.ED_RELS) {
    const froms = [...ix.notes.values()].filter((n) => rel.from(n));
    let hit = false;
    for (const from of froms) {
      const to = E.edTargets(ix, rel, from).find((t) => !ix.edges.some((e) => e.from === from.path && e.to === t.path && EDGE[rel.id]!.includes(e.kind)));
      if (!to) continue;
      const plan = E.planAddRelationship(ix, base, { rel: rel.id, from: from.path, to: to.path, name: "", mult: rel.id === "owns" ? "3" : "" });
      assert.deepEqual(plan.problems, [], `${rel.id} ${from.title} -> ${to.title}`);
      const f2 = apply(base, plan), ix2 = build(f2), n = ix2.notes.get(from.path)!;
      assert.deepEqual(n.warnings, [], `${rel.id}: block still scans clean`);
      assert.deepEqual(n.issues, [], `${rel.id}: format check`);
      assert.ok(ix2.edges.some((e) => e.from === from.path && e.to === to.path && EDGE[rel.id]!.includes(e.kind)), `${rel.id}: edge present`);
      assert.equal(E.planAddRelationship(ix2, f2, { rel: rel.id, from: from.path, to: to.path, name: "x" }).problems.length > 0 || rel.id === "owns", true, "a repeat is refused except owned usages");
      hit = true; done.push(rel.id); break;
    }
    assert.ok(hit, `fixture offers an eligible pair for ${rel.id}`);
  }
  assert.equal(done.length, E.ED_RELS.length);
});

test("ineligible pairs and unknown relationships are refused", () => {
  const ix = build(base), req = [...ix.notes.values()].find((n) => n.def?.keyword === "requirement def")!, part = [...ix.notes.values()].find((n) => n.def?.keyword === "part def")!;
  assert.equal(E.planAddRelationship(ix, base, { rel: "satisfy", from: req.path, to: part.path }).problems.length, 1);
  assert.equal(E.planAddRelationship(ix, base, { rel: "verify", from: part.path, to: req.path }).problems.length, 1);
  assert.equal(E.planAddRelationship(ix, base, { rel: "nope", from: part.path, to: req.path }).problems.length, 1);
  assert.equal(E.planAddRelationship(ix, base, { rel: "owns", from: part.path, to: part.path, mult: "x" }).problems.length, 1);
});

test("requirement text is replaced in place, helper docs are untouched, hostile text is escaped", () => {
  const ix = build(base), req = [...ix.notes.values()].find((n) => n.def?.keyword === "requirement def" && n.def.doc)!;
  const plan = E.planSetRequirementText(ix, base, req.path, "New wording */ with a closer");
  assert.deepEqual(plan.problems, []);
  const n = build(apply(base, plan)).notes.get(req.path)!;
  assert.equal(n.def!.doc, "New wording * / with a closer");
  assert.equal((MDSE.extractSysml(plan.writes[0]!.after) as string).match(/\bdoc\b/g)!.length, (MDSE.extractSysml(base.get(req.path)!) as string).match(/\bdoc\b/g)!.length, "still one doc");
  assert.equal(E.planSetRequirementText(ix, base, [...ix.notes.values()].find((x) => x.def?.keyword === "part def")!.path, "x").problems.length, 1);
});

test("the diff shows only the lines that changed", () => {
  assert.deepEqual(E.edDiff("a\nb\nc", "a\nB\nc"), { removed: ["b"], added: ["B"] });
  assert.deepEqual(E.edDiff(null, "x\ny"), { removed: [], added: ["x", "y"] });
});
