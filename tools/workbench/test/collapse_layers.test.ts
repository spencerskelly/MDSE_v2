import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import { addToCanvas, cardAction, collapseLayer, expandLayer, expandAll, cardNotePath, isCollapsed } from "../src/canvas.ts";
import type { CanvasDoc } from "../src/canvas.ts";
import { classes } from "./harness.ts";

const f = (id: string, title: string, props = ""): [string, string] => [`${title}.md`, `---\ntype: Object\nid: ${id}\nuid: 20261025${id.replace(/\D/g, "").padStart(9, "0")}layers-test\nstatus: Draft\n${props}tags: []\n---\n# ${title}\n`];
const parts = (...n: string[]): string => `hasPart: [${n.map((x) => `"[[${x}]]"`).join(", ")}]\n`;
const v = buildIndex(new Map([
  f("OBJ-00001", "Plant", parts("Charger")), f("OBJ-00002", "Charger", parts("Cable", "Board")), f("OBJ-00003", "Cable"),
  f("OBJ-00004", "Board", parts("Chip", "Die")), f("OBJ-00005", "Chip"), f("OBJ-00006", "Die"), f("OBJ-00007", "Rack", parts("Chip")),
]), { classes });
const names = (d: CanvasDoc) => d.nodes.map((n) => cardNotePath(n)!.replace(".md", "")).sort();
const at = (d: CanvasDoc, t: string) => d.nodes.find((n) => cardNotePath(n) === `${t}.md`)!;
const full = addToCanvas({ nodes: [], edges: [] }, v, null, ["Plant.md", "Charger.md", "Cable.md", "Board.md", "Chip.md", "Die.md"]).doc;

test("collapse one layer removes only the deepest layer, layer after layer (D-0095)", () => {
  const a = collapseLayer(full, v, "Plant.md");
  assert.deepEqual(names(a.doc), ["Board", "Cable", "Charger", "Plant"], "Chip and Die are gone");
  assert.match(at(a.doc, "Board").text!, /▸ \+2 hidden/); assert.ok(!isCollapsed(at(a.doc, "Charger")));
  const b = collapseLayer(a.doc, v, "Plant.md"); assert.deepEqual(names(b.doc), ["Charger", "Plant"]); assert.match(at(b.doc, "Charger").text!, /▸ \+2 hidden/);
  const c = collapseLayer(b.doc, v, "Plant.md"); assert.deepEqual(names(c.doc), ["Plant"]); assert.match(at(c.doc, "Plant").text!, /▸ \+1 hidden/);
  assert.equal(collapseLayer(c.doc, v, "Plant.md").hidden, 0, "nothing shown below the card");
  assert.equal(full.nodes.length, 6, "the input is not changed");
});

test("collapse one layer keeps a card that a shown assembly outside the branch holds", () => {
  const withRack = addToCanvas(full, v, null, ["Rack.md"]).doc;           // Rack holds Chip
  const a = collapseLayer(withRack, v, "Plant.md");
  assert.deepEqual(names(a.doc), ["Board", "Cable", "Charger", "Chip", "Plant", "Rack"], "Chip stays, Die goes");
  assert.match(at(a.doc, "Board").text!, /▸ \+1 hidden/);
});

test("expand one layer grows each branch by one layer, then stops when everything is shown", () => {
  const closed = cardAction(full, v, "Plant.md", "collapseAll").doc;
  const l1 = expandLayer(closed, v, "Plant.md"); assert.deepEqual(names(l1.doc), ["Charger", "Plant"]);
  const l2 = expandLayer(l1.doc, v, "Plant.md"); assert.deepEqual(names(l2.doc), ["Board", "Cable", "Charger", "Plant"]);
  const l3 = expandLayer(l2.doc, v, "Plant.md"); assert.deepEqual(names(l3.doc), ["Board", "Cable", "Charger", "Chip", "Die", "Plant"]);
  assert.equal(expandLayer(l3.doc, v, "Plant.md").added, 0, "all layers are open");
  assert.ok(l3.doc.nodes.every((n) => !isCollapsed(n)), "no marker is left");
});

test("expand all opens every layer in one go; collapse all closes the card", () => {
  const closed = cardAction(full, v, "Plant.md", "collapseAll");
  assert.equal(closed.action, "collapsed"); assert.deepEqual(names(closed.doc), ["Plant"]);
  const open = cardAction(closed.doc, v, "Plant.md", "expandAll");
  assert.equal(open.action, "expanded"); assert.equal(open.capped, false); assert.deepEqual(names(open.doc), names(full));
  assert.equal(open.doc.edges.length, full.edges.length, "every part line is back");
  assert.equal(cardAction(open.doc, v, "Plant.md", "expandAll").action, "none", "already open");
  assert.equal(cardAction(open.doc, v, "Cable.md", "expandAll").action, "none", "a card with no parts");
});

test("expand all stops at the card limit and says so", () => {
  const files = new Map<string, string>([f("OBJ-09000", "Big", parts(...Array.from({ length: 70 }, (_, i) => `A${i}`)))]);
  for (let i = 0; i < 70; i++) {
    files.set(...f(`OBJ-0${1000 + i}`, `A${i}`, parts(`B${i}x`, `B${i}y`)));
    for (const s of ["x", "y"]) files.set(...f(`OBJ-0${2000 + i * 2 + (s === "x" ? 0 : 1)}`, `B${i}${s}`, parts(`C${i}${s}`)));
  }
  for (let i = 0; i < 70; i++) for (const s of ["x", "y"]) files.set(...f(`OBJ-0${4000 + i * 2 + (s === "x" ? 0 : 1)}`, `C${i}${s}`));
  const big = buildIndex(files, { classes });
  const one = addToCanvas({ nodes: [], edges: [] }, big, null, ["Big.md"]).doc;
  const r = expandAll(one, big, "Big.md");
  assert.equal(r.capped, true); assert.ok(r.doc.nodes.length >= 200 && r.doc.nodes.length < 400);
});
