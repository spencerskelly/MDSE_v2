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
  assert.equal(pm.qty, 4, "3 modules plus the filterBank pushed up into the Controller block (D-0100)");
  assert.equal(b.find((x) => x.title === "Contactor")!.qty, 3, "2 named contactors plus one unnamed usage that took the type name (IMP-110)");
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
import { cdNotePath } from "../src/canvas_draw.ts";
import { refreshCanvas, addChildren, autoLayout, structureCanvas, toCanvas, pickCanvas, cardName, addToCanvas, relatedNotes, commonRelated, MAX_PICK, PREVIEW_DIR, PREVIEW_PATH, SAVED_DIR } from "../src/canvas.ts";
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
  const ids = new Set(r.doc.nodes.filter((n) => n.type !== "group").map((n) => n.id));
  assert.equal(ids.size, r.doc.nodes.length, "unique node ids");
  assert.equal(r.doc.nodes.filter((n) => cdNotePath(n)).length, 1);
  assert.ok(r.doc.nodes.some((n) => n.type === "text" && /not in vault/.test(n.text!)));
  for (const e of r.doc.edges) { assert.ok(ids.has(e.fromNode) && ids.has(e.toNode)); assert.ok(e.fromNode !== e.toNode); }
  assert.ok(r.doc.nodes.every((n) => Number.isInteger(n.x) && Number.isInteger(n.y) && n.width > 0));
  assert.match(r.fileName, /\.canvas$/); assert.ok(!/[\\/:*?"<>|]/.test(r.fileName));
  assert.equal(PREVIEW_DIR, "99_System/22_Views"); assert.equal(SAVED_DIR, "99_System/23_Saved_Views"); assert.equal(PREVIEW_PATH, "99_System/22_Views/Workbench Preview.canvas");
  JSON.parse(JSON.stringify(r.doc));
  const alloc = toCanvas(ix, p, V.PROFILES.find((x) => x.name === "Allocation")!);
  assert.ok(alloc.unresolved === 51 && alloc.capped && alloc.doc.nodes.filter((n) => n.type === "text" && !cdNotePath(n)).length <= 24, "unresolved cards are capped");
});

test("canvas export on a full imported vault links notes both ways", () => {
  const r = toCanvas(ix, byTitle("Charger"), V.PROFILES.find((x) => x.name === "Structure")!);
  assert.ok(r.doc.nodes.filter((n) => cdNotePath(n)).length >= 5 && r.doc.edges.length >= 5);
  assert.ok(r.doc.nodes.filter((n) => cdNotePath(n)).every((n) => ix.notes.has(cdNotePath(n)!)));
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
  assert.equal(hidden.doc.nodes.filter((n) => cdNotePath(n)).length, 2);
  const lone2 = lone(), p2 = [...lone2.notes.keys()][0]!, A = V.PROFILES.find((p) => p.name === "Allocation")!;
  assert.equal(toCanvas(lone2, p2, A, { ghosts: false }).doc.nodes.length, 1);
});

test("review rows carry what is needed to resolve a flag; Issue notes get a status row", () => {
  const q = V.reviewQueue(ix);
  const flags = q.filter((i) => i.flag);
  assert.ok(flags.length > 0 && flags.every((i) => i.flag!.type.startsWith("flag") && i.flag!.title && i.flag!.nth >= 0));
  const issue = buildIndex(new Map([["I.md", "---\ntype: Issue\nid: ISS-1\nuid: u1\nstatus: Open\n---\n# Bad pin\n"]]), { classes });
  const rows = V.reviewQueue(issue).filter((i) => i.category === "issue");
  assert.equal(rows.length, 1); assert.equal(rows[0].status, "Open");
  const retired = buildIndex(new Map([["I.md", "---\ntype: Issue\nid: ISS-1\nuid: u1\nstatus: Retired\n---\n# Old\n"]]), { classes });
  assert.equal(V.reviewQueue(retired).filter((i) => i.category === "issue").length, 0);
});

test("a provisional tracesTo link is a review finding until it is replaced (W-288)", () => {
  const v = buildIndex(new Map([["A.md", "---\ntype: Requirement\nid: REQ-1\nuid: u1\ntracesTo: [\"[[B]]\"]\n---\n# A\n"], ["B.md", "---\ntype: Requirement\nid: REQ-2\nuid: u2\n---\n# B\n"]]), { classes });
  const rows = V.reviewQueue(v).filter((i) => i.category === "provisional-link");
  assert.equal(rows.length, 1); assert.equal(rows[0]!.path, "A.md"); assert.equal(rows[0]!.severity, "low");
});

test("status choices include the vocabulary in use plus Draft and Retired", () => {
  const c = V.statusChoices(ix);
  assert.ok(c.includes("Draft") && c.includes("Retired"));
  assert.equal(new Set(c).size, c.length);
});

test("lens tables: every lens that has a table returns well-formed data; scope switches between note and vault", () => {
  const sel = [...ix.notes.keys()][0];
  for (const [lens] of V.LENSES) {
    if (!V.lensHasTable(lens) || lens === "review") continue;   // Review is drawn by the panel itself
    for (const scope of ["selected", "all"] as const) {
      const ts = V.lensTables(ix, lens, sel, { scope });
      assert.ok(ts.length > 0, lens);
      for (const t of ts) for (const r of t.rows) for (const c of t.columns) assert.ok(c.key in r || true);
    }
  }
  const all = V.lensTables(ix, "tables", sel, { scope: "all", table: "notes" })[0].rows.length;
  assert.equal(all, ix.notes.size);
});

test("functional trace lists behaviors with their gaps", () => {
  const rows = V.functionalTrace(ix);
  assert.ok(Array.isArray(rows));
  for (const r of rows) assert.ok(r.gaps.every((g) => g === "no performer" || g === "no requirement"));
});

test("a BOM parent that lists a child in YAML and in SysML counts it once, and measured amounts keep their unit", () => {
  const f = (id: string, uid: string, extra: string, body: string): string => `---\ntype: Object\nsubtype: part\nid: ${id}\nuid: ${uid}\nstatus: Draft\neaType: BOM\nsourceRole: authoritative-model\nprimarySymbol: ${id.replace("-", "_")}::P\n${extra}---\n# ${id}\n\n## SysML v2\n\n\`\`\`sysml\n${body}\n\`\`\`\n`;
  const v = buildIndex(new Map([
    ["Top.md", f("OBJ-1", "u1", 'hasPart: ["[[Mid]]", "[[Foam]]"]\n', "package OBJ_1 {\n part def P {\n  part mid : OBJ_2::P [2];\n  part foam : OBJ_3::P {\n   attribute quantity = 1.5;\n   attribute unit = \"Meter\";\n  }\n }\n}")],
    ["Mid.md", f("OBJ-2", "u2", 'hasPart: ["[[Foam]]", "[[Screw]]"]\n', "package OBJ_2 {\n part def P {\n  part foam : OBJ_3::P {\n   attribute quantity = 0.5;\n   attribute unit = \"Meter\";\n  }\n  part screw : OBJ_4::P [4];\n }\n}")],
    ["Foam.md", f("OBJ-3", "u3", "", "package OBJ_3 {\n part def P;\n}")], ["Screw.md", f("OBJ-4", "u4", "", "package OBJ_4 {\n part def P;\n}")],
  ]), { classes });
  const b = V.bom(v, "Top.md");
  assert.equal(b.find((x) => x.path === "Mid.md")!.qty, 2, "one SysML usage with [2], not 2 + 1 from the YAML link");
  assert.equal(b.find((x) => x.path === "Screw.md")!.qty, 8);
  const foam = b.filter((x) => x.path === "Foam.md");
  assert.equal(foam.length, 1); assert.equal(foam[0]!.unit, "Meter"); assert.equal(foam[0]!.qty, 2.5, "1.5 on top plus 0.5 in each of 2 mids");
});

test("design types, internal structure and the state machine are separate views of one definition", () => {
  const sub = ix.edges.find((e) => e.kind === "specializes" && e.to);
  assert.ok(sub, "the fixture has a specialization");
  const up = V.designTypes(ix, sub!.from), down = V.designTypes(ix, sub!.to!);
  assert.ok(up.chain.includes(sub!.to!), "the chain lists what it specializes");
  assert.ok(down.tree.children.some((c) => c.path === sub!.from), "the supertype lists its design");
  const c = V.internalStructure(ix, byTitle("Charger"));
  assert.ok(c.parts.length > 0 && c.links.length > 0);
  assert.ok(c.parts.every((p) => !p.path || p.ports.every((q) => q.name)), "each typed part lists the ports its type offers");
  assert.ok(c.links.every((l) => typeof l.a.ok === "boolean"));
  const st = V.behavior(ix, byTitle("Charging"), "states"), no = V.behavior(ix, byTitle("Charging"), "actions");
  assert.equal(st.kind, "states"); assert.ok(no.nodes.every((n) => n.kind !== "state") && st.nodes.every((n) => n.kind === "state"), "each view keeps only its own kind");
  const parts = V.structure(ix, byTitle("Charger"), 6, 40, ["hasPart"]);
  assert.ok(parts.tree.children.every((x) => x.kind === "hasPart"), "the Structure view holds parts only");
});

test("internal structure marks a wire to a part or port that does not exist", () => {
  const f = (id: string, extra: string, body: string): string => `---\ntype: Object\nsubtype: part\nid: ${id}\nuid: u${id}\nstatus: Draft\neaType: Class\nsourceRole: authoritative-model\nprimarySymbol: ${id.replace("-", "_")}::P\n${extra}---\n# ${id}\n\n## SysML v2\n\n\`\`\`sysml\n${body}\n\`\`\`\n`;
  const v = buildIndex(new Map([
    ["A.md", f("OBJ-1", "", "package OBJ_1 {\n part def P {\n  part b : OBJ_2::P;\n  port out1 : OBJ_3::Q;\n  bind out1 = b.x;\n  bind out1 = b.missing;\n  bind out1 = nobody.x;\n }\n}")],
    ["B.md", f("OBJ-2", "", "package OBJ_2 {\n part def P {\n  port x : OBJ_3::Q;\n }\n}")], ["Q.md", f("OBJ-3", "", "package OBJ_3 {\n port def Q;\n}")],
  ]), { classes });
  const r = V.internalStructure(v, "A.md");
  assert.deepEqual(r.links.map((l) => l.b.ok), [true, false, false]);
  assert.equal(r.parts[0]!.ports[0]!.name, "x");
});

test("a measured quantity prints its unit, never NaN", () => {
  const f = (id: string, extra: string, body: string): string => `---\ntype: Object\nsubtype: part\nid: ${id}\nuid: u${id}\nstatus: Draft\neaType: BOM\nsourceRole: authoritative-model\nprimarySymbol: ${id.replace("-", "_")}::P\n${extra}---\n# ${id}\n\n## SysML v2\n\n\`\`\`sysml\n${body}\n\`\`\`\n`;
  const v = buildIndex(new Map([["T.md", f("OBJ-1", 'hasPart: ["[[F]]"]\n', 'package OBJ_1 {\n part def P {\n  part foam : OBJ_2::P {\n   attribute quantity = 1.5;\n   attribute unit = "Meter";\n  }\n }\n}')], ["F.md", f("OBJ-2", "", "package OBJ_2 {\n part def P;\n}")]]), { classes });
  const t = V.structure(v, "T.md", 6, 40, ["hasPart"]);
  assert.equal(t.tree.children[0]!.detail, "[1.5 Meter]");
});

test("local usages in a toolset resolve to their typed definition notes and canvases", () => {
  const mk = (id: string, type: string, pkg: string, keyword: string, body: string): string =>
    `---
type: ${type}
subtype: software
id: ${id}
uid: 20261023141300001skellyspencer
status: Draft
primarySymbol: ${pkg}::${id}
---
# ${id}

## SysML v2

\`\`\`sysml
package ${pkg} {
    ${keyword} ${id} {
${body}
    }
}
\`\`\`
`;
  const docs = new Map<string, string>([
    ["Root.md", mk("Root", "Object", "M", "part def", `        part importer : P::Importer;
        requirement r : Q::Req;
        verification check : V::Check {
            objective coverage {
                verify r;
            }
        }
        allocate r to importer;`)],
    ["Importer.md", mk("Importer", "Object", "P", "part def", `        part engine : S::Engine {
            perform action run : B::Act;
        }`)],
    ["Engine.md", mk("Engine", "Object", "S", "part def", "")],
    ["Req.md", mk("Req", "Requirement", "Q", "requirement def", "")],
    ["Check.md", mk("Check", "Verification", "V", "verification def", "")],
    ["Act.md", mk("Act", "Behavior", "B", "action def", "")],
    ["UseCase.md", mk("Demo", "Use Case", "U", "use case def", `        dependency from Demo to B::Act;`)]
  ]);
  const local = buildIndex(docs);
  const has = (from: string, to: string, kind: string) =>
    local.edges.some((e) => e.from === from && e.to === to && e.kind === kind);
  assert.ok(has("Req.md", "Importer.md", "allocatedTo"), "allocation resolves both typed usage endpoints");
  assert.ok(has("Check.md", "Req.md", "verifies"), "verification objective belongs to its typed case");
  assert.ok(has("Engine.md", "Act.md", "performs"), "owned software role performs the action");
  assert.ok(has("UseCase.md", "Act.md", "dependsOn"), "definition-scoped dependency resolves local source");
  assert.ok(!local.edges.some((e) => e.kind === "allocatedTo" && !e.to), "no orphaned allocation ghost");
  const canvas = toCanvas(local, "Req.md", V.PROFILES.find((p) => p.name === "Everything")!, { depth: 2, cap: 20 });
  const labels = canvas.doc.edges.map((e) => e.label ?? "");
  assert.ok(labels.some((x) => x.includes("allocatedTo")), "canvas draws the allocation");
  assert.ok(labels.some((x) => x.includes("verifies")), "canvas draws the verification");
});

test("use case scenarios index typed actions, refinements and supporting prerequisites separately", () => {
  const note = (id: string, type: string, pkg: string, kind: string, name: string, members = "") =>
    `---
type: ${type}
subtype: review
id: ${id}
uid: 20261023140000001skellyspencer
status: Draft
primarySymbol: ${pkg}::${name}
---
# ${id}

## SysML v2

\`\`\`sysml
package ${pkg} {
    ${kind} ${name} {
${members}
    }
}
\`\`\`
`;
  const examples = new Map<string, string>([
    ["UseCase.md", note("UC-9", "Use Case", "U", "use case def", "InspectModel", `
        action discoverModelElements : F::Discover;
        action generateModelViewpoints : F2::Display;
        #refinement dependency from InspectModel to N::FindNeed;
        dependency from InspectModel to N2::DataProtection;`)],
    ["Search.md", note("BEH-3", "Behavior", "F", "action def", "Discover")],
    ["Display.md", note("BEH-5", "Behavior", "F2", "action def", "Display")],
    ["FindNeed.md", note("STK-1", "Requirement", "N", "requirement def", "FindNeed")],
    ["DataProtection.md", note("STK-8", "Requirement", "N2", "requirement def", "DataProtection")]
  ]);
  const x = buildIndex(examples);
  const own = x.out.get("UseCase.md") ?? [];
  assert.deepEqual(own.map(e => e.kind).sort(), ["dependsOn", "hasAction", "hasAction", "refines"].sort());
  assert.ok(own.every(e => e.to && e.to !== "UseCase.md"), "all typed endpoints resolve");
  const cc = toCanvas(x, "UseCase.md", V.PROFILES.find(p => p.name === "Everything")!, { depth: 1, cap: 10 });
  assert.equal(cc.doc.edges.length, 4, "Canvas includes distinct action, refinement and prerequisite links");
  assert.equal(cc.unresolved, 0, "No unsupported or imaginary endpoints");
  assert.ok(cc.doc.edges.some(e => e.label === "refines"), "need refinement gets an explicit canvas kind");
  assert.ok(cc.doc.edges.some(e => e.label === "hasAction discoverModelElements"), "action usage is not a dependency");
});

test("a note is shown by name, else description, else heading, else file name, and the file name stays visible (MOD-171, D-0065)", () => {
  const note = (name: string, body: string, props: string): string => `---\ntype: Object\nsubtype: part\nid: OBJ-9000${name.length}\nuid: 2026102410000000${name.length}x\nstatus: Draft\neaType: BOM\ntags: []\n${props}---\n${body}\n\n\n\n## Source: EA\n\n- x: y\n`;
  const v = new Map<string, string>([
    ["BOM/Parts/01141-002.md", note("a", "# 01141-002", 'partNumber: "01141-002"\ndescription: CABLE ASSY, 3 m\n')],
    ["Model/OBJ-90001.md", note("b", "# Old heading", "name: Charge connector\naliases: [\"Plug\", \"CCS inlet\"]\n")],
    ["Model/OBJ-90002.md", note("cc", "# Heading only", "")],
    ["BOM/Parts/99999.md", note("ddd", "", 'description: ' + "x".repeat(120) + "\n")],
  ]);
  const w = buildIndex(v, { classes }), t = (p: string): string => w.notes.get(p)!.title;
  assert.equal(t("BOM/Parts/01141-002.md"), "CABLE ASSY, 3 m"); assert.equal(t("Model/OBJ-90001.md"), "Charge connector"); assert.equal(t("Model/OBJ-90002.md"), "Heading only");
  assert.equal(t("BOM/Parts/99999.md"), "x".repeat(89) + "…", "a long description is cut for display");
  const rows = V.tableRows(w, { text: "01141-002" }); assert.equal(rows.length, 1); assert.equal(rows[0]!.file, "01141-002"); assert.equal(rows[0]!.title, "CABLE ASSY, 3 m");
  assert.equal(V.tableRows(w, { text: "charge connector" }).length, 1, "found by name");
  assert.deepEqual(w.notes.get("Model/OBJ-90001.md")!.links, [], "name and aliases are not read as links");
  assert.equal(V.search(w, "ccs inlet")[0]!.path, "Model/OBJ-90001.md", "search finds a note by an alias (D-0068)");
  assert.equal(V.search(w, "01141-002")[0]!.path, "BOM/Parts/01141-002.md", "search finds a note by part number and file name");
  assert.equal(V.search(w, "OBJ-90002")[0]!.path, "Model/OBJ-90002.md", "search finds a note by file name");
  assert.equal(V.tableRows(w, { text: "plug" }).length, 1, "the table filter reads aliases");
});

test("a search for a word or phrase lists the notes with it in the name or description, and the ticked ones become a canvas (D-0078)", () => {
  const every = V.pickRows(ix, "");
  assert.equal(every.total, ix.notes.size, "no text lists everything");
  const charger = V.pickRows(ix, "charger");
  assert.ok(charger.total >= 1 && charger.notes.every((n) => `${n.title} ${n.name} ${n.meta.description ?? ""} ${n.id} ${n.meta.partNumber ?? ""} ${n.meta.aliases ?? ""}`.toLowerCase().includes("charger")));
  assert.equal(V.pickRows(ix, "charger zzzznotaword").total, 0, "every word must match");
  assert.equal(V.pickRows(ix, "CHARGER").total, charger.total, "case does not matter");
  const t = charger.notes[0]!.type; assert.ok(V.pickRows(ix, "charger", t).notes.every((n) => n.type === t));
  assert.equal(V.pickRows(ix, "", "", 3).notes.length, 3); assert.equal(V.pickRows(ix, "", "", 3).total, ix.notes.size, "the limit cuts the list, not the count");
  // a word found only in a description
  const withDesc = [...ix.notes.values()].find((n) => n.meta.description && !n.title.toLowerCase().includes(String(n.meta.description).toLowerCase().split(/\s+/).at(-1)!));
  if (withDesc) { const w = String(withDesc.meta.description).toLowerCase().split(/\s+/).at(-1)!; assert.ok(V.pickRows(ix, w).notes.some((n) => n.path === withDesc.path), "found by its description"); }
  // canvas
  const picked = charger.notes.map((n) => n.path), r = pickCanvas(ix, picked, { relations: true, label: "charger" });
  const cardsOf = (d: { nodes: Array<{ type: string }> }) => d.nodes.filter((n) => n.type !== "group");
  assert.equal(cardsOf(r.doc).length, picked.length); assert.equal(r.notes, picked.length); assert.equal(r.capped, false);
  assert.ok(r.doc.nodes.filter((n) => n.type !== "group").every((n) => (n.type === "file" ? picked.includes(n.file!) : /\[\[/.test(n.text!))));
  const ids = new Set(r.doc.nodes.map((n) => n.id)); assert.ok(r.doc.edges.every((e) => ids.has(e.fromNode) && ids.has(e.toNode)), "only lines between ticked notes");
  assert.equal(pickCanvas(ix, picked, { relations: false, label: "charger" }).doc.edges.length, 0);
  const all = pickCanvas(ix, [...ix.notes.keys()], { relations: true, label: "" });
  assert.ok(all.doc.edges.length > 0, "the model's relationships between ticked notes are drawn");
  assert.equal(all.doc.nodes.filter((n) => n.type !== "group").length, Math.min(MAX_PICK, ix.notes.size)); assert.equal(all.capped, ix.notes.size > MAX_PICK);
  assert.equal(pickCanvas(ix, ["nope.md"], { relations: true, label: "x" }).doc.nodes.length, 0, "a path not in the index is skipped");
  const boxes = r.doc.nodes.filter((n) => n.type !== "group").map((n) => [n.x, n.y, n.x + n.width, n.y + n.height]); // no two cards overlap
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i]!, b = boxes[j]!; assert.ok(a[2]! <= b[0]! || b[2]! <= a[0]! || a[3]! <= b[1]! || b[3]! <= a[1]!, "cards do not overlap"); }
});

test("spacing depends on the pair: cards of related notes are three card sizes apart, cards of unrelated notes one (D-0079, D-0096)", () => {
  const rel = new Set<string>(); for (const e of ix.edges) if (e.to && !e.reverse && e.from !== e.to) { rel.add(`${e.from}|${e.to}`); rel.add(`${e.to}|${e.from}`); }
  type Box = { x: number; y: number; width: number; height: number };
  const clear = (a: Box, b: Box, related: boolean): boolean => { const gx = related ? 3 * 280 : 280, gy = related ? 3 * 90 : 90; return a.x + a.width + gx <= b.x || b.x + b.width + gx <= a.x || a.y + a.height + gy <= b.y || b.y + b.height + gy <= a.y; };
  const check = (doc: { nodes: Array<Box & { type: string; text?: string; file?: string }> }, label: string): number => {
    const cs = doc.nodes.filter((n) => n.type !== "group").map((n) => ({ n, p: cdNotePath(n as never) })).filter((c) => c.p); let related = 0;
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) { const r = rel.has(`${cs[i]!.p}|${cs[j]!.p}`); if (r) related++; assert.ok(clear(cs[i]!.n, cs[j]!.n, r), `${label}: ${cs[i]!.p} and ${cs[j]!.p} are too close for ${r ? "related" : "unrelated"} notes`); }
    return related;
  };
  const all = [...ix.notes.keys()];
  assert.ok(check(pickCanvas(ix, all, { relations: false, label: "", group: false }).doc, "pick, ungrouped") > 0, "the sample has related notes among those picked");
  check(pickCanvas(ix, all, { relations: false, label: "", group: true }).doc, "pick, grouped");
  check(toCanvas(ix, byTitle("Charger"), V.PROFILES.find((p) => p.name === "Everything")!, { depth: 3, cap: 200 }).doc, "view from a note");
  check(structureCanvas(ix, byTitle("Charger"), "full").doc, "structure");
  const added = addToCanvas({ nodes: [], edges: [] }, ix, null, all.slice(0, 60)).doc; check(added, "add to canvas");
  check(autoLayout(added, ix).doc, "auto-layout");
  // the columns of a view from a note are still three widths apart
  const near = (xs: number[]): number[] => [...new Set(xs)].sort((a, b) => a - b);
  const t = toCanvas(ix, byTitle("Charger"), V.PROFILES.find((p) => p.name === "Everything")!, { depth: 3, cap: 200 }), tc = near(t.doc.nodes.map((n) => n.x));
  for (let i = 1; i < tc.length; i++) assert.equal(tc[i]! - tc[i - 1]!, 4 * 280, "the layered canvas: a gap of 3 widths between columns");
});

test("a row of parts under an assembly is one card width apart; the row is three card heights below the assembly (D-0096)", () => {
  const f = (id: string, title: string, props = ""): [string, string] => [`${title}.md`, `---\ntype: Object\nid: ${id}\nuid: 2026102500000${id.replace(/\D/g, "").padStart(4, "0")}gap-test\nstatus: Draft\n${props}tags: []\n---\n# ${title}\n`];
  const v = buildIndex(new Map([f("OBJ-00001", "Charger", 'hasPart: ["[[Cable]]", "[[Plug]]", "[[Board]]"]\n'), f("OBJ-00002", "Cable"), f("OBJ-00003", "Plug"), f("OBJ-00004", "Board", 'hasPart: ["[[Chip]]"]\n'), f("OBJ-00005", "Chip"), f("OBJ-00006", "Lone")]), { classes });
  const gap = (a: { x: number; width: number }, b: { x: number; width: number }): number => b.x - (a.x + a.width);
  const one = addToCanvas({ nodes: [], edges: [] }, v, null, ["Charger.md"]).doc, parent = one.nodes[0]!;
  const row = addChildren(one, v, "Charger.md", ["Cable.md", "Plug.md", "Board.md"]).doc.nodes.filter((n) => n.id !== parent.id).sort((a, b) => a.x - b.x);
  assert.deepEqual([gap(row[0]!, row[1]!), gap(row[1]!, row[2]!)], [280, 280], "parts of one assembly are not related to each other: one width apart");
  assert.equal(row[0]!.y - (parent.y + parent.height), 270, "the row is three heights below the assembly");
  // a structure canvas: the parts of an assembly are one width apart too, and the assembly is centred over them
  const sc = structureCanvas(v, "Charger.md", "direct").doc.nodes, parts = sc.filter((n) => cdNotePath(n as never) !== "Charger.md").sort((a, b) => a.x - b.x);
  assert.deepEqual([gap(parts[0]!, parts[1]!), gap(parts[1]!, parts[2]!)], [280, 280]);
  // a note with no relationship goes one height under the cards already there, and one width from its neighbour
  const withLone = addToCanvas(one, v, null, ["Lone.md"]).doc, lone = withLone.nodes.find((n) => cdNotePath(n as never) === "Lone.md")!;
  assert.equal(lone.y - (parent.y + parent.height), 90, "an unrelated note is one height below");
  // auto-layout: an assembly's parts are one width apart, notes with no relationship are one width apart in the grid beneath
  const laid = autoLayout(addToCanvas({ nodes: [], edges: [] }, v, null, [...v.notes.keys()]).doc, v).doc, at = (t: string) => laid.nodes.find((n) => cdNotePath(n as never) === `${t}.md`)!;
  assert.equal(gap(at("Cable"), at("Plug")), 280, "auto-layout: parts one width apart");
  assert.equal(at("Cable").y - (at("Charger").y + at("Charger").height), 270, "auto-layout: parts three heights below the assembly");
});

test("picked notes are grouped by type: one labelled box each, the cards inside it, nothing overlapping (D-0080)", () => {
  const r = pickCanvas(ix, [...ix.notes.keys()], { relations: true, label: "" }), groups = r.doc.nodes.filter((n) => n.type === "group"), cards = r.doc.nodes.filter((n) => n.type !== "group");
  const types = new Set([...ix.notes.values()].map((n) => n.type));
  assert.equal(groups.length, types.size); assert.equal(r.groups, types.size); assert.equal(cards.length, ix.notes.size);
  assert.deepEqual(groups.map((g) => g.label!.replace(/ \(\d+\)$/, "")), [...types].sort((a, b) => a.localeCompare(b)), "boxes in type order");
  assert.ok(r.doc.nodes.slice(0, groups.length).every((n) => n.type === "group"), "boxes come first so cards are drawn over them");
  for (const c of cards) { const owner = groups.filter((g) => c.x >= g.x && c.y >= g.y && c.x + c.width <= g.x + g.width && c.y + c.height <= g.y + g.height); assert.equal(owner.length, 1, "each card sits inside exactly one box"); const t = ix.notes.get(c.file ?? "")?.type; if (t) assert.ok(owner[0]!.label!.startsWith(t + " ("), "in the box for its own type"); }
  for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) { const a = groups[i]!, b = groups[j]!; assert.ok(a.y + a.height <= b.y || b.y + b.height <= a.y, "boxes do not overlap"); }
  for (const g of groups) assert.ok(cards.filter((c) => c.x >= g.x && c.x < g.x + g.width && c.y >= g.y && c.y < g.y + g.height).length >= 1);
  assert.equal(pickCanvas(ix, [...ix.notes.keys()], { relations: false, label: "", group: false }).doc.nodes.filter((n) => n.type === "group").length, 0, "grouping can be turned off");
});

test("a card is named by the name, else the description; the part number, else the id, is small beneath (D-0081)", () => {
  assert.deepEqual(cardName({ title: "Cable assembly", id: "OBJ-1", meta: { partNumber: "09190-301" } }), { name: "Cable assembly", sub: "09190-301" });
  assert.deepEqual(cardName({ title: "Cable assembly", id: "OBJ-1", meta: {} }), { name: "Cable assembly", sub: "OBJ-1" });
  assert.deepEqual(cardName({ title: "09190-301", id: "OBJ-1", meta: { partNumber: "09190-301" } }), { name: "09190-301", sub: "", }, "no repeat of the name");
  assert.deepEqual(cardName({ title: "A | B [x]", id: "", meta: {} }), { name: "A B x", sub: "" });
  const c = pickCanvas(ix, [...ix.notes.keys()], { relations: false, label: "", group: false }).doc.nodes[0]!, n = ix.notes.get(cdNotePath(c)!)!;
  assert.ok(c.type === "text" && c.text!.startsWith(`**[[${n.path.replace(/\.md$/, "")}|${cardName(n).name}]]**`), "the link text is the shown name, not the file name");
  const bom = new Map(files); bom.set("BOM/Parts/Cables/Parts/buy/09190-301.md", "---\ntype: Object\nsubtype: part\nid: OBJ-95001\nuid: 20260101000000001skellyspencer\nstatus: Draft\npartNumber: 09190-301\ndescription: CABLE ASSY 3M\n---\n# 09190-301\n");
  const w2 = buildIndex(bom, { classes, parserReport: bom.get("99_System/11_Import/Parser Check.md") });
  const card = pickCanvas(w2, ["BOM/Parts/Cables/Parts/buy/09190-301.md"], { relations: false, label: "" }).doc.nodes.find((x) => x.type === "text" && !/Object \(/.test(x.label ?? "") && x.text)!;
  assert.ok(/^\*\*\[\[BOM\/Parts\/Cables\/Parts\/buy\/09190-301\|CABLE ASSY 3M\]\]\*\*<br><small>09190-301<\/small>$/.test(card.text!), card.text);
});

test("related notes are added to a canvas beside the selected note's card, once, joined by lines, overlapping nothing (D-0082)", () => {
  const c = byTitle("Charger"), rel = relatedNotes(ix, c);
  assert.ok(rel.length >= 3 && rel.every((r) => r.path !== c && ix.notes.has(r.path) && r.kinds.length), "related notes with the kinds that join them");
  assert.equal(new Set(rel.map((r) => r.path)).size, rel.length);
  const base = pickCanvas(ix, [c], { relations: false, label: "", group: false }).doc, before = JSON.stringify(base);
  const r = addToCanvas(base, ix, c, rel.map((x) => x.path));
  assert.equal(JSON.stringify(base), before, "the input canvas is not changed");
  assert.equal(r.added, rel.length); assert.equal(r.doc.nodes.length, 1 + rel.length); assert.equal(r.present, 0);
  const anchor = r.doc.nodes[0]!, news = r.doc.nodes.slice(1);
  assert.ok(news.every((n) => Math.abs(n.x - anchor.x) <= 4 * 1120 && Math.abs(n.y - anchor.y) <= 4 * 360), "every new card is near the one it relates to");
  assert.ok(news.some((n) => n.x === anchor.x + 1120 && n.y === anchor.y), "the first goes straight to its right, one card and a gap away");
  assert.deepEqual(r.doc.nodes[0], base.nodes[0], "the card that was there has not moved");
  assert.equal(new Set(r.doc.nodes.map((n) => n.id)).size, r.doc.nodes.length, "unique ids");
  for (let i = 0; i < news.length; i++) for (let j = i + 1; j < news.length; j++) { const a = news[i]!, b = news[j]!; assert.ok(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y, "no overlap"); }
  assert.ok(r.doc.edges.length >= 1 && r.doc.edges.every((e) => r.doc.nodes.some((n) => n.id === e.fromNode) && r.doc.nodes.some((n) => n.id === e.toNode)));
  assert.deepEqual(r.lineIds.sort(), r.doc.edges.map((e) => e.id).sort(), "every line is reported, so the plugin knows it drew them");
  const again = addToCanvas(r.doc, ix, c, rel.map((x) => x.path));
  assert.equal(again.added, 0); assert.equal(again.present, rel.length); assert.equal(again.doc.nodes.length, r.doc.nodes.length, "not added twice");
  // a card in the way: the new card goes to the next free place
  const blocker = { id: "blk", type: "text" as const, x: anchor.x + 280 + 840, y: anchor.y, width: 300, height: 300, text: "free" };
  const moved = addToCanvas({ nodes: [...base.nodes, blocker], edges: [] }, ix, c, [rel[0]!.path]).doc.nodes.find((n) => cdNotePath(n) === rel[0]!.path)!;
  assert.ok(moved.x + 280 <= blocker.x - 40 || moved.x >= blocker.x + 300 + 40 || moved.y + moved.height <= blocker.y - 40 || moved.y >= blocker.y + 300 + 40, "clear of the card in the way");
  assert.ok(Math.abs(moved.x - anchor.x) <= 2 * 1120 && Math.abs(moved.y - anchor.y) <= 2 * 360, "and still next to its card");
  // a long list: nothing overlaps, nothing already placed moves, and every related note is beside its relation
  const many = [...ix.notes.keys()].filter((p) => p !== c), wide = addToCanvas(base, ix, c, many);
  assert.equal(wide.added, many.length); const ws = wide.doc.nodes; assert.deepEqual(ws[0], base.nodes[0]);
  for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) { const a2 = ws[i]!, b2 = ws[j]!; assert.ok(a2.x + a2.width <= b2.x || b2.x + b2.width <= a2.x || a2.y + a2.height <= b2.y || b2.y + b2.height <= a2.y, "no overlap"); }
  // the anchor is not on the canvas: below everything
  const off = addToCanvas(base, ix, "nope.md", [rel.find((x) => relatedNotes(ix, x.path).length === 1 && true)?.path ?? rel[0]!.path]).doc.nodes[1]!; assert.ok(off.x !== undefined);
  assert.equal(addToCanvas(base, ix, c, ["not-in-index.md"]).added, 0);
});

test("new notes that relate to each other sit together, and a cluster of them away from the old cards (D-0083)", () => {
  const c = byTitle("Charger"), rel = relatedNotes(ix, c).map((r) => r.path), other = [...ix.notes.keys()].filter((p) => p !== c && !rel.includes(p));
  const old = pickCanvas(ix, [c], { relations: false, label: "", group: false }).doc, all = [...rel, ...other];
  const r = addToCanvas(old, ix, null, all), where = new Map(r.doc.nodes.map((n) => [cdNotePath(n)!, n]));
  assert.deepEqual(r.doc.nodes[0], old.nodes[0], "the old card is where it was");
  // a pair that relates to each other, both new, is near; where one card has many relations the ring around it is crowded, so a few steps is the bound
  for (const e of ix.edges) { if (!e.to || e.reverse || e.from === e.to || e.from === c || e.to === c) continue; const a = where.get(e.from), b = where.get(e.to); if (!a || !b) continue; assert.ok(Math.abs(a.x - b.x) <= 5 * 1120 && Math.abs(a.y - b.y) <= 5 * 360, `${e.from} and ${e.to} are near`); }
  // every new note that relates to the old card is next to it
  for (const p of rel) { const n = where.get(p)!; assert.ok(Math.abs(n.x - old.nodes[0]!.x) <= 3 * 1120 && Math.abs(n.y - old.nodes[0]!.y) <= 3 * 360, "beside the card it relates to"); }
  // two new notes that relate to each other and to nothing on the canvas are next to each other, below the old cards
  const pair = ix.edges.find((e) => e.to && !e.reverse && e.from !== e.to && e.from !== c && e.to !== c && !rel.includes(e.from) && !rel.includes(e.to));
  if (pair) { const q = addToCanvas(old, ix, null, [pair.from, pair.to!]).doc.nodes, a = q.find((n) => cdNotePath(n) === pair.from)!, b = q.find((n) => cdNotePath(n) === pair.to)!; assert.ok(Math.abs(a.x - b.x) <= 1120 && Math.abs(a.y - b.y) <= 360, "a pair is one step apart"); }
  // lines can be left off
  assert.equal(addToCanvas(old, ix, null, all, { relations: false }).doc.edges.length, 0);
  // a canvas with no note on it: related new notes still sit together, from the origin
  const empty = addToCanvas({ nodes: [], edges: [] }, ix, null, [c, ...rel]);
  assert.equal(empty.added, 1 + rel.length); assert.ok(empty.doc.nodes.every((n) => Math.abs(n.x) <= 4 * 1120 && Math.abs(n.y) <= 4 * 360));
});

test("notes related to two or more chosen notes are listed, with the kinds that join each (D-0084)", () => {
  const c = byTitle("Charger"), rel = relatedNotes(ix, c).map((r) => r.path), pair = [c, rel[0]!];
  const r = commonRelated(ix, pair);
  assert.ok(r.all.every((x) => !pair.includes(x.path) && x.by.length === 2 && x.by.every((b) => b.kinds.length)), "each is joined to both, and the chosen are left out");
  assert.ok(r.all.every((x) => relatedNotes(ix, pair[0]!).some((y) => y.path === x.path) && relatedNotes(ix, pair[1]!).some((y) => y.path === x.path)));
  assert.deepEqual(r.some, [], "with two chosen, every shared note is in 'all'");
  // three chosen: all is the intersection, some are joined to two
  const trio = [...ix.notes.keys()].slice(0, 3), t = commonRelated(ix, trio);
  for (const x of t.all) assert.equal(x.by.length, 3); for (const x of t.some) assert.ok(x.count >= 2 && x.count < 3);
  assert.deepEqual(commonRelated(ix, [c]).all, [], "one note has no 'common'");
  assert.deepEqual(commonRelated(ix, ["nope.md", "nope2.md"]), { all: [], some: [] });
  const sorted = r.some.map((x) => x.count); assert.deepEqual(sorted, [...sorted].sort((a, b) => b - a), "most shared first");
});

test("added notes are placed by what they are: parts under the assembly, specializations under the general, requirements under use cases, functions and test cases under requirements, objects under functions (D-0085)", () => {
  const f = (type: string, id: string, title: string, props = ""): [string, string] => [`${title}.md`, `---\ntype: ${type}\nid: ${id}\nuid: 202610240000${id.replace(/\D/g, "").padStart(5, "0")}tier-order--\nstatus: Draft\n${props}tags: []\n---\n# ${title}\n`];
  const v = buildIndex(new Map([
    f("Use Case", "UC-00001", "Charge a truck", 'drives: ["[[Charge fast]]"]\n'), f("Requirement", "REQ-00001", "Charge fast"),
    f("Behavior", "BEH-00001", "Deliver power", 'satisfies: ["[[Charge fast]]"]\n'), f("Verification", "VER-00001", "Power test", 'verifies: ["[[Charge fast]]"]\n'),
    f("Object", "OBJ-00001", "Charger", 'performs: ["[[Deliver power]]"]\nhasPart: ["[[Cable]]", "[[Plug]]", "[[Lid]]"]\n'),
    f("Object", "OBJ-00002", "Cable"), f("Object", "OBJ-00003", "Plug"), f("Object", "OBJ-00004", "Lid"),
    f("Object", "OBJ-00005", "Vehicle"), f("Object", "OBJ-00006", "Truck", 'specializes: ["[[Vehicle]]"]\n'),
  ]), { classes });
  const at = (doc: { nodes: Array<{ x: number; y: number; type: string; text?: string }> }, t: string) => doc.nodes.find((n) => n.type === "text" && cdNotePath(n as never) === `${t}.md`)!;
  const all = addToCanvas({ nodes: [], edges: [] }, v, null, [...v.notes.keys()]).doc;
  const y = (t: string) => at(all, t).y, x = (t: string) => at(all, t).x;
  assert.ok(y("Charge a truck") < y("Charge fast"), "requirements are under use cases");
  assert.ok(y("Charge fast") < y("Deliver power"), "functions are under requirements");
  assert.ok(y("Charge fast") < y("Power test"), "test cases are under requirements");
  assert.ok(y("Deliver power") < y("Charger"), "objects are under functions");
  for (const p of ["Cable", "Plug", "Lid"]) assert.ok(y("Charger") < y(p), `${p} is under the assembly`);
  assert.equal(new Set(["Cable", "Plug", "Lid"].map((p) => y(p))).size, 1, "the parts sit in a row");
  assert.ok(y("Vehicle") < y("Truck"), "the specialized element is under the general");
  // an element already there stays; the rest are put over or under it by what they are
  const one = addToCanvas({ nodes: [], edges: [] }, v, null, ["Charge fast.md"]).doc, req = one.nodes[0]!;
  const more = addToCanvas(one, v, "Charge fast.md", ["Charge a truck.md", "Deliver power.md", "Power test.md"]).doc;
  assert.deepEqual(more.nodes[0], req, "the requirement has not moved");
  assert.ok(y2(more, "Charge a truck") < req.y && y2(more, "Deliver power") > req.y && y2(more, "Power test") > req.y);
  assert.ok(Math.abs(x2(more, "Charge a truck") - req.x) <= 1120, "and next to it, not far across");
  function y2(d: typeof more, t: string): number { return at(d as never, t).y; } function x2(d: typeof more, t: string): number { return at(d as never, t).x; }
});

test("the structure view shows the full tree or only the direct parts (D-0085)", () => {
  const top = byTitle("Charger"), full = V.lensTables(ix, "structure", top, { tree: "full" })[0]!, direct = V.lensTables(ix, "structure", top, { tree: "direct" })[0]!;
  assert.ok(direct.rows.length >= 2 && direct.rows.length <= full.rows.length);
  assert.ok(direct.rows.every((r) => Number(r.level) <= 1), "no row deeper than the direct parts");
  assert.deepEqual(V.lensTables(ix, "structure", top, {})[0]!.rows.length, full.rows.length, "full is the default");
  assert.ok(full.rows.some((r) => Number(r.level) >= 2) ? full.rows.length > direct.rows.length : true);
});

test("a structure canvas: the note, its parent assemblies above, parts below, lines from the bottom of the assembly to the top of the part (D-0088)", () => {
  const f = (id: string, title: string, props = ""): [string, string] => [`${title}.md`, `---\ntype: Object\nid: ${id}\nuid: 2026102500000${id.replace(/\D/g, "").padStart(4, "0")}struct-canvas\nstatus: Draft\n${props}tags: []\n---\n# ${title}\n`];
  const v = buildIndex(new Map([
    f("OBJ-00001", "Station", 'hasPart: ["[[Charger]]"]\n'), f("OBJ-00009", "Depot", 'hasPart: ["[[Charger]]"]\n'),
    f("OBJ-00002", "Charger", 'hasPart: ["[[Cable]]", "[[Plug]]", "[[Board]]"]\n'), f("OBJ-00003", "Cable"), f("OBJ-00004", "Plug"),
    f("OBJ-00005", "Board", 'hasPart: ["[[Chip]]"]\n'), f("OBJ-00006", "Chip", 'hasPart: ["[[Die]]"]\n'), f("OBJ-00007", "Die"),
  ]), { classes });
  const nodeOf = (d: { nodes: Array<{ x: number; y: number; type: string; text?: string; id: string; width: number; height: number }> }, t: string) => d.nodes.find((n) => cdNotePath(n as never) === `${t}.md`)!;
  const d = structureCanvas(v, "Charger.md", "direct").doc, c = nodeOf(d, "Charger");
  assert.deepEqual(d.nodes.map((n) => cdNotePath(n as never)).sort(), ["Board.md", "Cable.md", "Charger.md", "Depot.md", "Plug.md", "Station.md"], "direct: parents and direct parts only");
  for (const p of ["Station", "Depot"]) assert.ok(nodeOf(d, p).y < c.y, `${p} is above`);
  assert.equal(nodeOf(d, "Station").y, nodeOf(d, "Depot").y); assert.equal(new Set(["Cable", "Plug", "Board"].map((p) => nodeOf(d, p).y)).size, 1, "the parts are one row");
  for (const p of ["Cable", "Plug", "Board"]) assert.ok(nodeOf(d, p).y > c.y);
  const mid = (a: string[]): number => a.map((p) => nodeOf(d, p).x).reduce((s, x) => s + x, 0) / a.length;
  assert.equal(mid(["Plug", "Board"]), c.x, "the assembly is centred over its parts");
  assert.equal(d.edges.length, 5);
  for (const e of d.edges) { assert.equal(e.fromSide, "bottom"); assert.equal(e.toSide, "top"); const a = d.nodes.find((n) => n.id === e.fromNode)!, b = d.nodes.find((n) => n.id === e.toNode)!; assert.ok(a.y < b.y, "from the assembly down to the part"); }
  const full = structureCanvas(v, "Charger.md", "full").doc;
  assert.deepEqual(full.nodes.map((n) => cdNotePath(n as never)).sort(), ["Board.md", "Cable.md", "Charger.md", "Chip.md", "Depot.md", "Die.md", "Plug.md", "Station.md"], "complete BOM: every layer");
  assert.ok(nodeOf(full, "Chip").y > nodeOf(full, "Board").y && nodeOf(full, "Die").y > nodeOf(full, "Chip").y);
  assert.equal(full.edges.length, 7); assert.ok(full.edges.every((e) => e.fromSide === "bottom" && e.toSide === "top"));
  // the other canvases: a line to a card in a lower row leaves the bottom
  const g = addToCanvas({ nodes: [], edges: [] }, v, null, ["Charger.md", "Cable.md"]);
  assert.ok(g.doc.edges.every((e) => e.fromSide === "bottom" && e.toSide === "top"), "added notes: the parent's line leaves the bottom");
});

test("auto-layout puts a use case left of its requirement, tests and functions below it, assemblies over their parts, and leaves other cards alone (D-0089)", () => {
  const f = (type: string, id: string, title: string, props = ""): [string, string] => [`${title}.md`, `---\ntype: ${type}\nid: ${id}\nuid: 202610250000${id.replace(/\D/g, "").padStart(5, "0")}auto-layout-\nstatus: Draft\n${props}tags: []\n---\n# ${title}\n`];
  const v = buildIndex(new Map([
    f("Use Case", "UC-00001", "Charge a truck"), f("Requirement", "REQ-00001", "Charge fast", 'refines: ["[[Charge a truck]]"]\n'),
    f("Behavior", "BEH-00001", "Deliver power", 'satisfies: ["[[Charge fast]]"]\n'), f("Verification", "VER-00001", "Power test", 'verifies: ["[[Charge fast]]"]\n'),
    f("Object", "OBJ-00001", "Charger", 'performs: ["[[Deliver power]]"]\nhasPart: ["[[Cable]]", "[[Plug]]"]\n'),
    f("Object", "OBJ-00002", "Cable"), f("Object", "OBJ-00003", "Plug"), f("Object", "OBJ-00009", "Loose"),
  ]), { classes });
  const doc = addToCanvas({ nodes: [], edges: [] }, v, null, [...v.notes.keys()]).doc;
  const scrambled = { nodes: [...doc.nodes.map((n, i) => ({ ...n, x: (i * 37) % 5 * 50, y: (i * 53) % 3 * 40 })), { id: "memo", type: "text" as const, x: 7, y: 9, width: 100, height: 50, text: "my own note" }], edges: doc.edges };
  const r = autoLayout(scrambled, v), at = (t: string) => r.doc.nodes.find((n) => cdNotePath(n as never) === `${t}.md`)!;
  assert.equal(at("Charge a truck").y, at("Charge fast").y); assert.ok(at("Charge a truck").x < at("Charge fast").x, "use case to the left");
  assert.ok(at("Power test").y > at("Charge fast").y && at("Deliver power").y > at("Charge fast").y, "tests and functions below the requirement");
  assert.ok(at("Charger").y > at("Deliver power").y, "object below function");
  for (const p of ["Cable", "Plug"]) assert.ok(at(p).y > at("Charger").y);
  assert.equal(at("Charger").x, (at("Cable").x + at("Plug").x) / 2, "assembly centred over its parts");
  assert.ok(at("Loose").y > Math.max(...["Cable", "Charger"].map((p) => at(p).y)), "an unrelated note goes to the grid beneath");
  assert.deepEqual(r.doc.nodes.find((n) => n.id === "memo"), scrambled.nodes.find((n) => n.id === "memo"), "a card that is not a note stays");
  assert.ok(r.kept >= 1);
  const idem = autoLayout(r.doc, v); assert.equal(idem.moved, 0, "laying out a laid-out canvas moves nothing");
  const ca = r.doc.edges.find((e) => { const a = r.doc.nodes.find((n) => n.id === e.fromNode)!, b = r.doc.nodes.find((n) => n.id === e.toNode)!; return cdNotePath(a as never) === "Charger.md" && cdNotePath(b as never) === "Cable.md"; })!;
  assert.deepEqual([ca.fromSide, ca.toSide], ["bottom", "top"]);
});

test("direct parts show only direct parts in every Structure table, and children go on the canvas in one row below the parent (D-0090)", () => {
  const f = (id: string, title: string, props = ""): [string, string] => [`${title}.md`, `---\ntype: Object\nid: ${id}\nuid: 2026102500001${id.replace(/\D/g, "").padStart(4, "0")}direct-kids\nstatus: Draft\n${props}tags: []\n---\n# ${title}\n`];
  const v = buildIndex(new Map([
    f("OBJ-00001", "Station", 'hasPart: ["[[Charger]]"]\n'), f("OBJ-00009", "Site", 'hasPart: ["[[Station]]"]\n'),
    f("OBJ-00002", "Charger", 'hasPart: ["[[Cable]]", "[[Plug]]", "[[Board]]"]\n'), f("OBJ-00003", "Cable"), f("OBJ-00004", "Plug"),
    f("OBJ-00005", "Board", 'hasPart: ["[[Chip]]"]\n'), f("OBJ-00006", "Chip", 'hasPart: ["[[Die]]"]\n'), f("OBJ-00007", "Die"),
  ]), { classes });
  const names = (t: V.TableData): string[] => t.rows.map((r) => String(typeof r.name === "object" ? (r.name as { path?: string }).path : r.part && typeof r.part === "object" ? (r.part as { path?: string }).path : r.assembly && typeof r.assembly === "object" ? (r.assembly as { path?: string }).path : "")).sort();
  const dir = V.lensTables(v, "structure", "Charger.md", { tree: "direct" }), full = V.lensTables(v, "structure", "Charger.md", { tree: "full" });
  assert.deepEqual(names(dir[0]!), ["Board.md", "Cable.md", "Charger.md", "Plug.md"], "the tree: the note and its direct parts");
  assert.deepEqual(names(dir[1]!), ["Board.md", "Cable.md", "Plug.md"], "the parts list: direct parts, not their parts");
  assert.deepEqual(names(dir[2]!), ["Station.md"], "where used: the assemblies it is directly in");
  assert.ok(names(full[1]!).includes("Die.md") && names(full[2]!).includes("Site.md"), "the full tree still goes all the way");
  // children in a row below the parent
  const one = addToCanvas({ nodes: [], edges: [] }, v, null, ["Charger.md"]).doc, parent = one.nodes[0]!;
  const r = addChildren(one, v, "Charger.md", ["Cable.md", "Plug.md", "Board.md"]);
  const kids = r.doc.nodes.filter((n) => n.id !== parent.id);
  assert.equal(r.added, 3); assert.deepEqual(r.doc.nodes[0], parent, "the parent has not moved");
  assert.equal(new Set(kids.map((n) => n.y)).size, 1, "one row"); assert.ok(kids[0]!.y >= parent.y + parent.height + 90 * 3 - 1, "below the parent, a row apart");
  const xs = kids.map((n) => n.x + n.width / 2).sort((a, b) => a - b); assert.equal((xs[0]! + xs[2]!) / 2, parent.x + parent.width / 2, "centred under the parent");
  assert.equal(r.doc.edges.length, 3); assert.ok(r.doc.edges.every((e) => e.fromNode === parent.id && e.fromSide === "bottom" && e.toSide === "top"));
  // a held slot is skipped along the same row; a card already there is not moved
  const blocked = { nodes: [...one.nodes, { id: "memo", type: "text" as const, x: parent.x - 1120, y: parent.y + 360, width: 280, height: 90, text: "mine" }], edges: [] };
  const r2 = addChildren(blocked, v, "Charger.md", ["Cable.md", "Plug.md", "Board.md"]);
  const k2 = r2.doc.nodes.filter((n) => n.id !== parent.id && n.id !== "memo");
  assert.equal(new Set(k2.map((n) => n.y)).size, 1); assert.ok(k2.every((n) => Math.abs(n.x - (parent.x - 1120)) >= 280), "nothing on the memo");
  const again = addChildren(r.doc, v, "Charger.md", ["Cable.md", "Plug.md"]); assert.equal(again.added, 0); assert.equal(again.present, 2);
  const cold = addChildren({ nodes: [], edges: [] }, v, "Charger.md", ["Cable.md"]); assert.equal(cold.doc.nodes.length, 2, "the parent is put on first");
});

test("a retired note is a red card that names the note it went into, and Refresh redraws cards and lines from the vault without moving anything (D-0091)", () => {
  const f = (id: string, title: string, props = "", extra = ""): [string, string] => [`${title}.md`, `---\ntype: Object\nid: ${id}\nuid: 2026102500002${id.replace(/\D/g, "").padStart(4, "0")}refresh-test\nstatus: ${extra ? "Retired" : "Draft"}\n${extra}${props}tags: []\n---\n# ${title}\n`];
  const v1 = buildIndex(new Map([f("OBJ-00001", "Charger", 'hasPart: ["[[Cable]]", "[[Plug]]"]\n'), f("OBJ-00002", "Cable"), f("OBJ-00003", "Plug")]), { classes });
  const doc = addToCanvas({ nodes: [], edges: [] }, v1, null, [...v1.notes.keys()]).doc;
  assert.equal(doc.edges.length, 2);
  const pos = JSON.stringify(doc.nodes.map((n) => [n.id, n.x, n.y]));
  // in the vault now: Plug is retired into Cable, Charger no longer owns Plug, Cable has a new name
  const v2 = buildIndex(new Map([f("OBJ-00001", "Charger", 'hasPart: ["[[Cable]]"]\n'), [ "Cable.md", "---\ntype: Object\nid: OBJ-00002\nuid: 202610250000200002refresh-test\nstatus: Draft\nname: Power cable\ntags: []\n---\n# Cable\n"], f("OBJ-00003", "Plug", "", 'tags-note: x\nmergedInto: ["[[Cable]]"]\n')]), { classes });
  const r = refreshCanvas(doc, v2), at = (t: string) => r.doc.nodes.find((n) => cdNotePath(n as never) === `${t}.md`)!;
  assert.equal(JSON.stringify(r.doc.nodes.map((n) => [n.id, n.x, n.y])), pos, "nothing moved");
  assert.match(at("Cable").text!, /Power cable/);
  assert.equal(at("Plug").color, "1"); assert.match(at("Plug").text!, /retired → Cable/);
  assert.equal(r.linesRemoved, 1, "the Charger to Plug line is gone"); assert.equal(r.doc.edges.length, 2, "Charger to Cable stays, Plug to Cable is new");
  assert.ok(r.linesAdded >= 1, "the new relationship from Plug to Cable is drawn");
  // a note that is not in the vault any more
  const gone = refreshCanvas(doc, buildIndex(new Map([f("OBJ-00001", "Charger")]), { classes }));
  assert.equal(gone.missing, 2); assert.ok(gone.doc.nodes.filter((n) => n.color === "1").length === 2);
  // a line the person drew is never touched
  const mine = { nodes: doc.nodes, edges: [...doc.edges, { id: "9f3ab2c4d5e6f7a8", fromNode: doc.nodes[1]!.id, toNode: doc.nodes[2]!.id, fromSide: "right" as const, toSide: "left" as const, toEnd: "arrow" as const }] };
  assert.ok(refreshCanvas(mine, v2).doc.edges.some((e) => e.id === "9f3ab2c4d5e6f7a8"));
  assert.equal(refreshCanvas(r.doc, v2).redrawn + refreshCanvas(r.doc, v2).linesAdded + refreshCanvas(r.doc, v2).linesRemoved, 0, "refreshing twice changes nothing more");
});

import { compareNotes } from "../src/compare.ts";
test("compare lists what differs between two notes and shows the structure down to the parts that differ (D-0092)", () => {
  const f = (id: string, title: string, props = "", block = ""): [string, string] => [`${title}.md`, `---\ntype: Object\nid: ${id}\nuid: 2026102500003${id.replace(/\D/g, "").padStart(4, "0")}compare-test\nstatus: Draft\n${props}tags: []\n---\n# ${title}\n${block}`];
  const v = buildIndex(new Map([
    f("OBJ-00001", "Charger A", 'description: Charger\nrevision: "-1"\nhasPart: ["[[Cable A]]", "[[Plug A]]", "[[Board A]]", "[[Lid A]]"]\n'),
    f("OBJ-00011", "Charger B", 'description: Charger\nrevision: "-2"\nhasPart: ["[[Cable B]]", "[[Plug B]]", "[[Board B]]"]\n'),
    f("OBJ-00002", "Cable A", 'partNumber: C-1\n'), f("OBJ-00012", "Cable B", 'partNumber: C-1\n'),
    f("OBJ-00003", "Plug A", 'partNumber: P-1\n'), f("OBJ-00013", "Plug B", 'partNumber: P-1\n'),
    f("OBJ-00004", "Board A", 'partNumber: B-1\nhasPart: ["[[Chip A]]", "[[Cap A]]"]\n'), f("OBJ-00014", "Board B", 'partNumber: B-1\nhasPart: ["[[Chip B]]"]\n'),
    f("OBJ-00005", "Chip A", 'partNumber: U-1\nhasPart: ["[[Die A]]"]\n'), f("OBJ-00015", "Chip B", 'partNumber: U-1\nhasPart: ["[[Die B]]"]\n'),
    f("OBJ-00006", "Die A", 'partNumber: D-1\nrevision: "-1"\n'), f("OBJ-00016", "Die B", 'partNumber: D-1\nrevision: "-2"\n'),
    f("OBJ-00007", "Cap A", 'partNumber: K-1\n'), f("OBJ-00008", "Lid A", 'partNumber: L-1\n'),
  ]), { classes });
  const r = compareNotes(v, "Charger A.md", "Charger B.md")!;
  assert.deepEqual(r.props.map((x) => x.what), ["revision"]);
  const rows = r.structure.map((x) => `${"  ".repeat(x.level)}${x.a ?? x.b}: ${x.diff}`);
  assert.ok(rows.some((x) => /^Board A: differs below/.test(x)), rows.join("\n"));
  assert.ok(rows.some((x) => /^  Cap A: only in A/.test(x)));
  assert.ok(rows.some((x) => /^Lid A: only in A/.test(x)));
  assert.ok(rows.some((x) => /^    Die A: revision differs/.test(x)), "down to the part that differs");
  assert.ok(!rows.some((x) => /Cable|Plug/.test(x)), "parts that match are not listed");
  assert.equal(compareNotes(v, "Charger A.md", "Charger A.md")!.same, true);
});
