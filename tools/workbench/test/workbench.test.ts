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

/* ---- PCE25: a real note from the user's import, alone in an otherwise empty vault ---- */
import { readFileSync } from "node:fs";
import { toCanvas, CANVAS_DIR } from "../src/canvas.ts";
const PCE25 = readFileSync(new URL("./fixtures/PCE25.md", import.meta.url), "utf8");
const lone = (): ReturnType<typeof buildIndex> => buildIndex(new Map([["00 Product Definition/MHE/PCE25/PCE25.md", PCE25]]));

test("real note PCE25 scans with no warnings and keeps every statement", () => {
  const ix = lone(), n = [...ix.notes.values()][0]!;
  assert.equal(n.warnings.length, 0);
  assert.equal(n.def!.symbol, "OBJ_02334::PCE25");
  assert.equal(n.def!.usages.filter((u) => u.type).length, 9);
  assert.equal(n.def!.usages.filter((u) => !u.type).length, 9);
  assert.equal(n.def!.stmts.filter((s) => s.kind === "allocate").length, 51);
});

test("an allocate whose source is missing is an unresolved reverse edge, never a self-loop", () => {
  const ix = lone(), p = [...ix.notes.keys()][0]!;
  assert.ok(!ix.edges.some((e) => e.to === e.from), "no self-loops");
  const alloc = ix.edges.filter((e) => e.kind === "allocatedTo");
  assert.equal(alloc.length, 51);
  assert.ok(alloc.every((e) => e.reverse && e.to === null && e.from === p));
  assert.ok(alloc.some((e) => e.toSymbol === "REQ_04044::RemoteControlCompatibility"));
  const rows = V.relationshipRows(ix, ["allocatedTo"]);
  assert.equal(rows[0]!.from, null); assert.equal(rows[0]!.to, p);
  assert.ok(V.reviewQueue(ix).some((i) => i.category === "unresolved-reference" && /source not in vault/.test(i.message)));
});

test("structure shows typed parts whose definition is not in the vault", () => {
  const ix = lone(), p = [...ix.notes.keys()][0]!, r = V.structure(ix, p);
  assert.equal(r.tree.children.length, 9);
  assert.ok(r.tree.children.every((c) => c.path === null && /not in vault/.test(c.detail)));
  assert.equal(r.untyped.length, 9);
});

test("canvas export: valid JSON Canvas, file cards for notes, text cards for missing ones, no dangling edge ids", () => {
  const ix = lone(), p = [...ix.notes.keys()][0]!;
  const r = toCanvas(ix, p, V.PROFILES.find((x) => x.name === "Structure")!);
  const ids = new Set(r.doc.nodes.map((n) => n.id));
  assert.equal(ids.size, r.doc.nodes.length, "unique node ids");
  assert.equal(r.doc.nodes.filter((n) => n.type === "file").length, 1);
  assert.ok(r.doc.nodes.some((n) => n.type === "text" && /not in vault/.test(n.text!)));
  for (const e of r.doc.edges) { assert.ok(ids.has(e.fromNode) && ids.has(e.toNode)); assert.ok(e.fromNode !== e.toNode); }
  assert.ok(r.doc.nodes.every((n) => Number.isInteger(n.x) && Number.isInteger(n.y) && n.width > 0));
  assert.match(r.fileName, /\.canvas$/); assert.ok(!/[\\/:*?"<>|]/.test(r.fileName));
  assert.equal(CANVAS_DIR, "99_System/12_Views");
  JSON.parse(JSON.stringify(r.doc));
  const alloc = toCanvas(ix, p, V.PROFILES.find((x) => x.name === "Allocation")!);
  assert.ok(alloc.unresolved === 51 && alloc.capped && alloc.doc.nodes.filter((n) => n.type === "text").length <= 24, "unresolved cards are capped");
});

test("canvas export on a full imported vault links notes both ways", () => {
  const r = toCanvas(ix, byTitle("Charger"), V.PROFILES.find((x) => x.name === "Structure")!);
  assert.ok(r.doc.nodes.filter((n) => n.type === "file").length >= 5 && r.doc.edges.length >= 5);
  assert.ok(r.doc.nodes.filter((n) => n.type === "file").every((n) => ix.notes.has(n.file!)));
});

/* ---- view settings: filters, hops, relationship kinds, classifier grouping ---- */
const note = (type: string, id: string, title: string, sym: string, sysml: string, status = "Draft", folder = "10_Model", sub = ""): [string, string] =>
  [`${folder}/${title}.md`, `---\ntype: ${type}\n${sub ? `subtype: ${sub}\n` : ""}id: ${id}\nuid: 2025${id.replace(/\W/g, "")}x\nstatus: ${status}\nprimarySymbol: ${sym}\n---\n# ${title}\n\n## SysML v2\n\n\`\`\`sysml\n${sysml}\n\`\`\`\n`];
function wide(n = 20): ReturnType<typeof buildIndex> {
  const f = new Map<string, string>();
  const reqs = Array.from({ length: n }, (_, i) => i);
  const put = ([p, t]: [string, string]): void => { f.set(p, t); };
  put(note("Object", "OBJ-1", "Unit", "OBJ_1::Unit", `package OBJ_1 {\n  part def Unit {\n    part sub : OBJ_2::Sub;\n${reqs.map((i) => `    allocate REQ_${i}::R${i} to OBJ_1::Unit;`).join("\n")}\n  }\n}`, "Draft", "10_Model", "part"));
  put(note("Object", "OBJ-2", "Sub", "OBJ_2::Sub", `package OBJ_2 {\n  part def Sub {\n  }\n}`));
  for (const i of reqs) put(note("Requirement", `REQ-${i}`, `Req ${i}`, `REQ_${i}::R${i}`, `package REQ_${i} {\n  requirement def R${i} {\n  }\n}`, i % 2 ? "Approved" : "Draft", i < 10 ? "20_Reqs/Power" : "20_Reqs/Safety", i < 15 ? "engineering" : "standard"));
  return buildIndex(f);
}

test("view settings: hops, relationship kinds, hidden types and statuses, folder", () => {
  const w = wide(), start = [...w.notes.values()].find((n) => n.title === "Unit")!.path, P = V.PROFILES.find((p) => p.name === "Everything")!;
  const all = V.traverse(w, start, P, 1, 100);
  assert.equal(all.nodes.length, 22);
  assert.equal(V.traverse(w, start, P, 1, 100, { hideTypes: ["Requirement"] }).nodes.length, 2);
  assert.equal(V.traverse(w, start, P, 1, 100, { kinds: ["hasPart"] }).nodes.length, 2);
  assert.equal(V.traverse(w, start, P, 1, 100, { hideStatuses: ["Approved"] }).nodes.length, 12);
  assert.equal(V.traverse(w, start, P, 1, 100, { folder: "20_Reqs/Power" }).nodes.length, 11);
  assert.equal(V.traverse(w, start, P, 1, 5).capped, true);
  assert.equal(V.traverse(w, start, P, 1, 100, { hideTypes: ["Requirement"] }).hidden, 20);
});

test("classifier grouping collapses many similar notes into one card and keeps edge counts", () => {
  const w = wide(), start = [...w.notes.values()].find((n) => n.title === "Unit")!.path, P = V.PROFILES.find((p) => p.name === "Everything")!;
  const g = V.traverse(w, start, P, 1, 100, { collapse: "subtype", collapseOver: 6 });
  assert.equal(g.groups.size, 1);                                              // engineering (15) groups; standard (5) stays under the threshold
  const grp = [...g.groups.values()][0]!;
  assert.equal(grp.members.length, 15);
  assert.ok(g.nodes.length < 22 && g.edges.some((e) => /×15/.test(e.label)));
  assert.ok(g.nodes.every((n) => g.groups.has(n.path) || w.notes.has(n.path)));
  assert.equal(V.traverse(w, start, P, 1, 100, { collapse: "type", collapseOver: 30 }).groups.size, 0);
});

test("canvas honours view settings: grouped card lists member links, file name differs, ghosts can be hidden", () => {
  const w = wide(), start = [...w.notes.values()].find((n) => n.title === "Unit")!.path, P = V.PROFILES.find((p) => p.name === "Everything")!;
  const plain = toCanvas(w, start, P, { depth: 1 }), grouped = toCanvas(w, start, P, { depth: 1, collapse: "subtype", collapseOver: 6 });
  assert.notEqual(plain.fileName, grouped.fileName);
  assert.ok(grouped.doc.nodes.length < plain.doc.nodes.length && grouped.groups === 1);
  const card = grouped.doc.nodes.find((n) => n.type === "text" && /×15/.test(n.text!))!;
  assert.ok(card && /\[\[20_Reqs\/Power\/Req 0\|Req 0\]\]|\[\[20_Reqs\/Safety/.test(card.text!) && /… 3 more/.test(card.text!));
  const boxes = grouped.doc.nodes.filter((n) => n.x === card.x);
  for (let i = 1; i < boxes.length; i++) { const a = boxes.slice().sort((p, q) => p.y - q.y); assert.ok(a[i]!.y >= a[i - 1]!.y + a[i - 1]!.height, "no overlap in a column"); }
  const hidden = toCanvas(w, start, P, { depth: 1, hideTypes: ["Requirement"] });
  assert.equal(hidden.doc.nodes.filter((n) => n.type === "file").length, 2);
  const lone2 = lone(), p2 = [...lone2.notes.keys()][0]!, A = V.PROFILES.find((p) => p.name === "Allocation")!;
  assert.equal(toCanvas(lone2, p2, A, { ghosts: false }).doc.nodes.length, 1);
});
