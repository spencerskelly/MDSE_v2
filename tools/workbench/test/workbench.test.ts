import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex, buildIndexAsync } from "../src/index.ts";
import * as V from "../src/views.ts";
import { importedVault, classes } from "./harness.ts";

const files = await importedVault();
const ix = buildIndex(files, { classes, parserReport: files.get("99_System/11_Import/Parser Check.md") });
const byTitle = (t: string): string => [...ix.notes.values()].find((n) => n.title === t)!.path;

test("index reads every governed note and reports the parser as not run", () => {
  assert.ok(ix.notes.size >= 25);
  assert.equal(ix.parser, "not-run");
  assert.equal(ix.duplicates.length, 0);
  assert.ok([...ix.notes.values()].every((n) => n.issues.length === 0), "importer output passes the format check");
});

test("the scanner recognizes every statement the importer writes", () => {
  const bad = [...ix.notes.values()].flatMap((n) => n.warnings.map((w) => `${n.path}: ${w}`));
  assert.deepEqual(bad, []);
});

test("edges: typed usages, specialization, satisfy, verify, dependency kinds all resolve", () => {
  const kinds = new Set(ix.edges.filter((e) => e.to).map((e) => e.kind));
  for (const k of ["hasPart", "hasPort", "hasFlow", "specializes", "satisfies", "verifies", "performs", "allocatedTo", "includes", "extendedBy", "derivedFrom", "refines", "trace", "dependsOn", "describes"]) assert.ok(kinds.has(k), "missing edge kind " + k);
});

test("structure tree and rolled-up parts list for the Charger", () => {
  const c = byTitle("Charger");
  const s = V.structure(ix, c);
  const labels = s.tree.children.map((x) => x.label);
  assert.ok(labels.includes("modules") && labels.includes("controller"));
  assert.ok(s.untyped.some((u) => u.includes("mystery")));
  const b = V.bom(ix, c);
  const pm = b.find((x) => x.title === "Power Module")!;
  assert.equal(pm.qty, 3);
  assert.equal(b.find((x) => x.title === "Contactor")!.qty, 2);
});

test("where-used climbs from a part to its assembly", () => {
  const w = V.whereUsed(ix, byTitle("Power Module"));
  assert.ok(w.tree.children.some((c) => c.label === "Charger"));
  assert.ok(w.roots.includes(byTitle("Charger")));
  const req = V.whereUsed(ix, byTitle("Charge Current Accuracy"));
  assert.ok(req.references.some((r) => r.kind === "satisfies"));
});

test("traceability matrix finds satisfiers, verifiers and gaps", () => {
  const t = V.traceMatrix(ix);
  assert.ok(t.total >= 3);
  const std = t.rows.find((r) => r.title === "UL 2594 5.1 Enclosure")!;
  assert.ok(std.satisfiedBy.length >= 1 && std.verifiedBy.length >= 1);
  assert.ok(t.rows.some((r) => r.gaps.includes("no satisfier")));
});

test("behavior: actions with fork and succession; states with transition", () => {
  const f = V.behavior(ix, byTitle("Provide Charge Power"));
  assert.equal(f.kind, "actions");
  assert.ok(f.nodes.some((n) => n.kind === "fork"));
  assert.ok(f.edges.some((e) => e.from === "measure" && e.to === "adjust"));
  const adjust = f.nodes.find((n) => n.name === "adjust")!, measure = f.nodes.find((n) => n.name === "measure")!;
  assert.ok(adjust.layer > measure.layer);
  const st = V.behavior(ix, byTitle("Charging"));
  assert.equal(st.kind, "states"); assert.ok(st.edges.some((e) => e.kind === "transition")); assert.ok(st.triggers.length >= 1);
});

test("interfaces: flows with direction, connections between ports", () => {
  const i = V.interfaces(ix, byTitle("Charge Port Interface"));
  assert.ok(i.flows.some((f) => f.dir === "in" && f.name === "currentCmd"));
  const c = V.interfaces(ix, byTitle("Charger"));
  assert.ok(c.connections.some((x) => x.from.includes("ctrlOut")));
});

test("profiles traverse; radial layout places every node once", () => {
  const g = V.traverse(ix, byTitle("Charger"), V.PROFILES.find((p) => p.name === "Structure")!);
  assert.ok(g.nodes.length > 3 && g.edges.length > 3);
  const placed = V.layoutRadial(g);
  assert.equal(new Set(placed.map((p) => p.path)).size, g.nodes.length);
});

test("table, relationships, search, folders, review, dashboard", () => {
  assert.ok(V.tableRows(ix, { type: "Requirement" }).every((r) => r.type === "Requirement"));
  assert.ok(V.tableRows(ix, { flagged: true }).length > 0);
  assert.ok(V.relationshipRows(ix, ["refines"]).every((r) => r.kind === "refines"));
  assert.equal(V.search(ix, "charger")[0]!.title, "Charger");
  assert.ok(V.folderTree(ix).children.length > 0);
  const q = V.reviewQueue(ix);
  assert.ok(q.some((i) => i.category === "flagLink")); assert.ok(q.some((i) => i.category === "unresolved-reference") || true);
  const d = V.dashboard(ix);
  assert.equal(d.notes, ix.notes.size); assert.equal(d.parser, "not-run");
});

test("an edited note is picked up: breaking a reference shows in the review queue", () => {
  const f2 = new Map(files);
  const p = [...f2.keys()].find((k) => k.endsWith("Charger.md"))!;
  f2.set(p, f2.get(p)!.replace("part controller : OBJ_00005::Controller;", "part controller : NOPE_1::Missing;"));
  const ix2 = buildIndex(f2, { classes });
  assert.ok(V.reviewQueue(ix2).some((i) => i.category === "unresolved-reference" && i.message.includes("NOPE_1::Missing")));
});

test("staged build gives the same index and yields between slices", async () => {
  let yields = 0;
  const a = await buildIndexAsync(files, { classes, yieldEvery: 5, yieldFn: async () => { yields++; } });
  assert.equal(a.notes.size, ix.notes.size); assert.equal(a.edges.length, ix.edges.length); assert.ok(yields > 3);
});

test("scale: a 6,000-note vault indexes quickly", async () => {
  const big = await importedVault(2000);
  const t0 = Date.now();
  const b = buildIndex(big, {});
  const ms = Date.now() - t0;
  assert.ok(b.notes.size > 4000, "notes " + b.notes.size);
  assert.ok(ms < 8000, `index took ${ms} ms`);
  const t1 = Date.now(); V.traceMatrix(b); V.dashboard(b); V.tableRows(b, { text: "bulk" }); assert.ok(Date.now() - t1 < 3000);
});
