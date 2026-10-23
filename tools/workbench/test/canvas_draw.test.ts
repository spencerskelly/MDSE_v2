import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex, outgoing } from "../src/index.ts";
import type { ModelIndex } from "../src/index.ts";
import { toCanvas } from "../src/canvas.ts";
import type { CanvasDoc } from "../src/canvas.ts";
import { PROFILES } from "../src/views.ts";
import { planAddRelationship } from "../src/edit.ts";
import { cdEdgeIds, cdDrawnLines, cdNotePath, cdChoices, cdWhyNot, cdOtherWay, cdDropLine, cdLabelLine } from "../src/canvas_draw.ts";
import { importedVault, classes } from "./harness.ts";

const base = await importedVault();
const ix: ModelIndex = buildIndex(base, { classes });
const kw = (k: string) => [...ix.notes.values()].filter((n) => n.def?.keyword === k);
const reqs = kw("requirement def"), parts = kw("part def");
// a part and a requirement the part does not satisfy yet
const part = parts.find((p) => reqs.some((r) => !outgoing(ix, p.path).some((e) => e.kind === "satisfies" && e.to === r.path)))!;
const req = reqs.find((r) => !outgoing(ix, part.path).some((e) => e.kind === "satisfies" && e.to === r.path))!;

/** A canvas holding both notes, then a line the person drew between them (an id the Workbench never wrote, like Obsidian's). */
function withDrawnLine(from: string, to: string): { doc: CanvasDoc; known: Set<string> } {
  const r = toCanvas(ix, part.path, PROFILES.find((x) => x.name === "Everything") ?? PROFILES[0]!, { depth: 3, cap: 200 });
  const doc: CanvasDoc = JSON.parse(JSON.stringify(r.doc));
  const cardOf = (p: string): string => { const c = doc.nodes.find((n) => cdNotePath(n) === p); if (c) return c.id; doc.nodes.push({ id: "x" + doc.nodes.length, type: "file", x: 0, y: 900, width: 280, height: 90, file: p }); return doc.nodes[doc.nodes.length - 1]!.id; };
  const known = cdEdgeIds(doc);
  doc.edges.push({ id: "9f3a1c7e5b2d4a60", fromNode: cardOf(from), toNode: cardOf(to), fromSide: "right", toSide: "left", toEnd: "arrow" });
  return { doc, known };
}

test("only a line the Workbench did not draw is the person's, and each end is the note behind the card (D-0043)", () => {
  const { doc, known } = withDrawnLine(part.path, req.path);
  const lines = cdDrawnLines(doc, known);
  assert.equal(lines.length, 1);
  assert.deepEqual([lines[0]!.id, lines[0]!.from, lines[0]!.to], ["9f3a1c7e5b2d4a60", part.path, req.path]);
  assert.deepEqual(cdDrawnLines(doc, cdEdgeIds(doc)), [], "a known line is never offered again");
  assert.equal(cdNotePath({ id: "t", type: "text", x: 0, y: 0, width: 1, height: 1, text: "Free note" }), null, "a free text card is not a note");
  assert.equal(cdNotePath({ id: "g", type: "text", x: 0, y: 0, width: 1, height: 1, text: "**Part ×3**\n\n- [[a|A]]" }), null, "a group card is not one note");
  assert.equal(cdNotePath({ id: "q", type: "text", x: 0, y: 0, width: 1, height: 1, text: `**[[${req.path.replace(/\.md$/, "")}|R]]** · functional\n\ntext` }), req.path, "a requirement card is its note");
});

test("the dropdown lists only kinds the source allows and that can be written now", () => {
  const ch = cdChoices(ix, base, part.path, req.path);
  assert.ok(ch.some((c) => c.rel.id === "satisfy" && c.ok), "a part can satisfy a requirement");
  assert.ok(!ch.some((c) => c.rel.id === "verify"), "a part cannot verify");
  assert.equal(cdWhyNot(ix, base, part.path, req.path), "");
  assert.deepEqual(cdChoices(ix, base, part.path, part.path), [], "no line from a note to itself");
  assert.match(cdWhyNot(ix, base, part.path, part.path), /two different notes/);
});

test("a line drawn backwards still offers the generic kinds and tells the person what the other way would allow", () => {
  assert.equal(cdWhyNot(ix, base, req.path, part.path), "", "a requirement can still trace to a part");
  assert.ok(!cdChoices(ix, base, req.path, part.path).some((c) => c.rel.id === "satisfy"), "but it cannot satisfy");
  assert.ok(cdOtherWay(ix, base, req.path, part.path).includes("satisfies requirement"));
  assert.deepEqual(cdOtherWay(ix, base, part.path, req.path).includes("satisfies requirement"), false, "nothing to say when it is drawn the right way");
});

test("applying the chosen kind writes it once; drawing it again is refused", () => {
  const plan = planAddRelationship(ix, base, { rel: "satisfy", from: part.path, to: req.path });
  assert.deepEqual(plan.problems, []);
  const after = new Map(base); for (const w of plan.writes) after.set(w.path, w.after);
  const ix2 = buildIndex(after, { classes });
  assert.ok(outgoing(ix2, part.path).some((e) => e.kind === "satisfies" && e.to === req.path));
  assert.ok(!cdChoices(ix2, after, part.path, req.path).find((c) => c.rel.id === "satisfy")!.ok, "already written");
});

test("a cancelled line is removed and an applied one is labelled; nothing else on the canvas changes", () => {
  const { doc } = withDrawnLine(part.path, req.path), text = JSON.stringify(doc);
  const dropped = JSON.parse(cdDropLine(text, "9f3a1c7e5b2d4a60")!) as CanvasDoc;
  assert.equal(dropped.edges.length, doc.edges.length - 1);
  assert.deepEqual(dropped.nodes, doc.nodes);
  const labelled = JSON.parse(cdLabelLine(text, "9f3a1c7e5b2d4a60", "satisfies requirement")!) as CanvasDoc;
  assert.equal(labelled.edges.find((e) => e.id === "9f3a1c7e5b2d4a60")!.label, "satisfies requirement");
  assert.equal(labelled.edges.length, doc.edges.length);
  assert.equal(cdDropLine(text, "nope"), null);
  assert.equal(cdDropLine("not json", "x"), null);
});
