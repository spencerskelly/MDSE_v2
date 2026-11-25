import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import { addToCanvas, addChildren, autoLayout, cardNotePath, type CanvasDoc } from "../src/canvas.ts";
import { classes } from "./harness.ts";

/* D-0166: children with the same parents on the canvas are one block; blocks go left to right in the order of their parents, so the parts unique
   to the left parent are at the left, shared parts between, the parts unique to the right parent at the right. Stacked parents: the higher one
   counts as the left one. */

let k = 0;
const f = (title: string, parts: string[] = []): [string, string] => {
  k++;
  return [`${title}.md`, `---\ntype: Object\nid: OBJ-${String(k).padStart(5, "0")}\nuid: 2026112400000${String(k).padStart(5, "0")}shared-parts-\nstatus: Draft\n${parts.length ? `hasPart: [${parts.map((p) => `"[[${p}]]"`).join(", ")}]\n` : ""}tags: []\n---\n# ${title}\n`];
};
const card = (d: CanvasDoc, t: string) => d.nodes.find((n) => cardNotePath(n as never) === `${t}.md`)!;
const rowOf = (d: CanvasDoc, names: string[]): string[] => names.map((t) => card(d, t)).sort((a, b) => a.x - b.x).map((n) => cardNotePath(n as never)!.replace(/\.md$/, ""));
const contiguous = (order: string[], block: string[]): boolean => { const ix = block.map((b) => order.indexOf(b)).sort((a, b) => a - b); return ix[ix.length - 1]! - ix[0]! === block.length - 1; };

/* names chosen so that alphabetical order would mix the blocks */
const UNIQUE = ["Bolt", "Cover", "Fan", "Hinge", "Nut", "Rail"], SHARED = ["Breaker", "Fuse", "Meter", "Relay"];

test("auto-layout, parents side by side: unique parts toward their parent, shared parts between (D-0166)", () => {
  const v = buildIndex(new Map([
    f("Zeta assembly", ["c part", "d part", "Shared one", "Shared two"]), f("Alpha assembly", ["Shared one", "Shared two", "a part", "b part"]),
    ...["a part", "b part", "c part", "d part", "Shared one", "Shared two"].map((t) => f(t)),
  ]), { classes });
  const d = autoLayout(addToCanvas({ nodes: [], edges: [] }, v, null, [...v.notes.keys()]).doc, v).doc;
  const left = card(d, "Alpha assembly").x < card(d, "Zeta assembly").x ? ["a part", "b part"] : ["c part", "d part"];
  const right = left[0] === "a part" ? ["c part", "d part"] : ["a part", "b part"];
  assert.deepEqual(rowOf(d, [...left, "Shared one", "Shared two", ...right]), [...left, "Shared one", "Shared two", ...right]);
});

test("auto-layout, subassembly under its assembly: shared parts left, the subassembly's own parts right, never mixed by name (D-0166)", () => {
  const v = buildIndex(new Map([
    f("Top assembly", ["Sub assembly", "Zed own part", ...SHARED]), f("Sub assembly", [...UNIQUE, ...SHARED]),
    ...[...UNIQUE, ...SHARED, "Zed own part"].map((t) => f(t)),
  ]), { classes });
  const d = autoLayout(addToCanvas({ nodes: [], edges: [] }, v, null, ["Top assembly.md"]).doc, v).doc;
  const placed = addChildren(addToCanvas(d, v, "Top assembly.md", ["Sub assembly.md", "Zed own part.md"]).doc, v, "Sub assembly.md", [...UNIQUE, ...SHARED].map((t) => `${t}.md`)).doc;
  const laid = autoLayout(placed, v).doc;
  const order = rowOf(laid, [...UNIQUE, ...SHARED]);
  assert.deepEqual(order, [...SHARED, ...UNIQUE], "shared block left of the subassembly's own parts, each in name order");
  assert.ok(card(laid, "Zed own part").x < card(laid, "Sub assembly").x, "the top assembly's own part is left of the subassembly, whatever its name");
  assert.ok(card(laid, "Top assembly").x < card(laid, "Sub assembly").x, "the top assembly ends up to the left, over its own and the shared parts");
  assert.equal(autoLayout(laid, v).moved, 0, "idempotent");
});

test("add children: shared parts go toward the other parent on the canvas; stacked parents put them left (D-0166)", () => {
  const v = buildIndex(new Map([
    f("Top assembly", ["Sub assembly", ...SHARED]), f("Sub assembly", [...UNIQUE, ...SHARED]), ...[...UNIQUE, ...SHARED].map((t) => f(t)),
  ]), { classes });
  const kids = [...UNIQUE, ...SHARED].map((t) => `${t}.md`);
  const base = addToCanvas(addToCanvas({ nodes: [], edges: [] }, v, null, ["Top assembly.md"]).doc, v, "Top assembly.md", ["Sub assembly.md"]).doc;
  const moveTop = (dx: number): CanvasDoc => ({ nodes: base.nodes.map((n) => cardNotePath(n as never) === "Top assembly.md" ? { ...n, x: card(base, "Sub assembly").x + dx } : { ...n }), edges: base.edges });
  const right = addChildren(moveTop(1500), v, "Sub assembly.md", kids).doc;
  assert.deepEqual(rowOf(right, [...UNIQUE, ...SHARED]), [...UNIQUE, ...SHARED], "assembly to the right: shared parts at the right");
  const left = addChildren(moveTop(-1500), v, "Sub assembly.md", kids).doc;
  assert.deepEqual(rowOf(left, [...UNIQUE, ...SHARED]), [...SHARED, ...UNIQUE], "assembly to the left: shared parts at the left");
  const stacked = addChildren(moveTop(0), v, "Sub assembly.md", kids).doc;
  const order = rowOf(stacked, [...UNIQUE, ...SHARED]);
  assert.deepEqual(order, [...SHARED, ...UNIQUE], "stacked: the higher parent counts as the left one");
  assert.ok(contiguous(order, SHARED) && contiguous(order, UNIQUE));
  for (const t of ["Top assembly", "Sub assembly"]) assert.deepEqual([card(stacked, t).x, card(stacked, t).y], [card(moveTop(0), t).x, card(moveTop(0), t).y], "cards already there do not move");
});
