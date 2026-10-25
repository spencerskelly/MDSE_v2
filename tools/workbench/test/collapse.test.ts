import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import { addToCanvas, addChildren, collapseCard, expandCard, toggleCard, isCollapsed, refreshCanvas, cardNotePath } from "../src/canvas.ts";
import { classes } from "./harness.ts";

const f = (id: string, title: string, props = ""): [string, string] => [`${title}.md`, `---\ntype: Object\nid: ${id}\nuid: 20261025000${id.replace(/\D/g, "").padStart(4, "0")}collapse-test\nstatus: Draft\n${props}tags: []\n---\n# ${title}\n`];
const v = buildIndex(new Map([
  f("OBJ-00001", "Charger", 'hasPart: ["[[Cable]]", "[[Board]]"]\n'), f("OBJ-00002", "Cable"),
  f("OBJ-00003", "Board", 'hasPart: ["[[Chip]]"]\n'), f("OBJ-00004", "Chip"),
  f("OBJ-00005", "Rack", 'hasPart: ["[[Cable]]"]\n'),
]), { classes });
const at = (d: { nodes: Array<{ text?: string; type: string; file?: string }> }, t: string) => d.nodes.find((n) => cardNotePath(n as never) === `${t}.md`) as never as { id: string; text: string; x: number; y: number; type: "text" };
const names = (d: { nodes: unknown[] }) => d.nodes.map((n) => cardNotePath(n as never)!.replace(".md", "")).sort();

// Charger with its whole structure on the canvas
const full = addToCanvas({ nodes: [], edges: [] }, v, null, ["Charger.md", "Cable.md", "Board.md", "Chip.md"]).doc;

test("collapse removes the branch and its lines and marks the card (D-0094)", () => {
  const r = collapseCard(full, v, "Charger.md");
  assert.deepEqual(names(r.doc), ["Charger"], "Cable, Board and Chip are gone");
  assert.equal(r.doc.edges.length, 0, "their lines are gone");
  assert.equal(r.hidden, 3);
  assert.ok(isCollapsed(at(r.doc, "Charger") as never)); assert.match(at(r.doc, "Charger").text, /▸ \+2 hidden/);
  assert.equal(full.nodes.length, 4, "the input is not changed");
});

test("a part joined to a shown card outside the branch stays, so does what hangs below it", () => {
  const withRack = addToCanvas(full, v, null, ["Rack.md"]).doc;       // Rack also holds Cable, so Cable has a line from a shown card outside Charger's branch
  const r = collapseCard(withRack, v, "Charger.md");
  assert.deepEqual(names(r.doc), ["Cable", "Charger", "Rack"]);
  assert.match(at(r.doc, "Charger").text, /▸ \+1 hidden/, "only Board is hidden; Cable is still shown");
  assert.equal(r.doc.edges.length, 2, "Rack to Cable and Charger to Cable remain; Board lines are gone");
});

test("expand adds the direct parts again, one layer, and a part with parts returns collapsed (D-0094)", () => {
  const c = collapseCard(full, v, "Charger.md").doc, e = expandCard(c, v, "Charger.md");
  assert.deepEqual(names(e.doc), ["Board", "Cable", "Charger"], "direct parts only; Chip stays hidden");
  assert.ok(!isCollapsed(at(e.doc, "Charger") as never));
  assert.ok(isCollapsed(at(e.doc, "Board") as never)); assert.match(at(e.doc, "Board").text, /\+1 hidden/);
  assert.ok(!isCollapsed(at(e.doc, "Cable") as never), "a part with no parts has no marker");
  assert.equal(e.doc.edges.length, 2);
  const e2 = expandCard(e.doc, v, "Board.md"); assert.deepEqual(names(e2.doc), ["Board", "Cable", "Charger", "Chip"]);
  assert.equal(JSON.stringify(expandCard(e2.doc, v, "Charger.md").doc.nodes.map((n) => n.id).sort()), JSON.stringify(e2.doc.nodes.map((n) => n.id).sort()), "expanding an expanded card adds nothing");
});

test("toggle collapses, then expands; a card with no parts is left alone", () => {
  const t1 = toggleCard(full, v, "Charger.md"); assert.equal(t1.action, "collapsed");
  const t2 = toggleCard(t1.doc, v, "Charger.md"); assert.equal(t2.action, "expanded");
  assert.equal(toggleCard(full, v, "Cable.md").action, "none");
  assert.equal(toggleCard(full, v, "Missing.md").action, "none");
});

test("Refresh keeps a collapsed card collapsed and does not move anything", () => {
  const c = collapseCard(full, v, "Charger.md").doc, pos = JSON.stringify(c.nodes.map((n) => [n.id, n.x, n.y]));
  const r = refreshCanvas(c, v);
  assert.equal(JSON.stringify(r.doc.nodes.map((n) => [n.id, n.x, n.y])), pos);
  assert.match(at(r.doc, "Charger").text, /▸ \+2 hidden/);
});

test("collapse on a cold canvas of one assembly built with addChildren round-trips", () => {
  const one = addToCanvas({ nodes: [], edges: [] }, v, null, ["Charger.md"]).doc, kids = addChildren(one, v, "Charger.md", ["Cable.md", "Board.md"]).doc;
  const c = collapseCard(kids, v, "Charger.md").doc;
  assert.deepEqual(names(c), ["Charger"]);
  assert.deepEqual(names(expandCard(c, v, "Charger.md").doc), ["Board", "Cable", "Charger"]);
});
