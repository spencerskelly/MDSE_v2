/* Expand and collapse of the indented BOM (D-0150, WKB-069), and the notices when the Structure table leaves parts out. Synthetic notes only (DAT-002). */
import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import * as V from "../src/views.ts";
import * as OL from "../src/outline.ts";
import { classes } from "./harness.ts";

/* Root(0) > A(1) > A1(2) > A1a(3); A > A2(2); Root > B(1) > B1(2); Root > C(1) */
const ROWS: OL.OutlineInput[] = [
  { level: 0, id: "Root" }, { level: 1, id: "A" }, { level: 2, id: "A1" }, { level: 3, id: "A1a" }, { level: 2, id: "A2" },
  { level: 1, id: "B" }, { level: 2, id: "B1" }, { level: 1, id: "C" },
];
const ids = (o: OL.Outline, rows: number[]): string[] => rows.map((i) => ROWS[i]!.id);

test("with nothing collapsed every row is visible, and Expand all is the empty set", () => {
  const o = OL.buildOutline(ROWS);
  assert.deepEqual(OL.visibleRows(o, new Set()), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(o.max, 3);
  assert.deepEqual([...OL.collapseFromLevel(o, 99)], [], "nothing is deeper than the deepest level");
});

test("collapsing one assembly hides everything under it and nothing beside it", () => {
  const o = OL.buildOutline(ROWS), s = OL.toggled(o, new Set(), 1);        // A
  assert.deepEqual(ids(o, OL.visibleRows(o, s)), ["Root", "A", "B", "B1", "C"]);
  assert.deepEqual(OL.visibleRows(o, OL.toggled(o, s, 1)), [0, 1, 2, 3, 4, 5, 6, 7], "toggling again unfolds it");
});

test("a collapsed assembly keeps the folded state of the assemblies under it", () => {
  const o = OL.buildOutline(ROWS);
  let s = OL.toggled(o, new Set(), 2);                                       // A1 folded: A1a hidden
  s = OL.toggled(o, s, 1);                                                   // A folded: A1, A1a, A2 hidden
  s = OL.toggled(o, s, 1);                                                   // A unfolded again
  assert.deepEqual(ids(o, OL.visibleRows(o, s)), ["Root", "A", "A1", "A2", "B", "B1", "C"], "A1 is still folded");
});

test("a leaf does not toggle", () => {
  const o = OL.buildOutline(ROWS);
  assert.deepEqual([...OL.toggled(o, new Set(), 7)], [], "C has nothing under it");
  assert.deepEqual([...OL.toggled(o, new Set(), 3)], []);
});

test("Collapse all shows the root and its direct parts; the root itself is never folded", () => {
  const o = OL.buildOutline(ROWS), s = OL.collapseFromLevel(o, 1);
  assert.deepEqual(ids(o, OL.visibleRows(o, s)), ["Root", "A", "B", "C"]);
  assert.equal(s.has(o.key[0]!), false);
});

test("show to level n folds the assemblies at level n and deeper", () => {
  const o = OL.buildOutline(ROWS);
  assert.deepEqual(ids(o, OL.visibleRows(o, OL.collapseFromLevel(o, 2))), ["Root", "A", "A1", "A2", "B", "B1", "C"]);
  assert.deepEqual(ids(o, OL.visibleRows(o, OL.collapseFromLevel(o, 3))), ["Root", "A", "A1", "A1a", "A2", "B", "B1", "C"], "level 3 shows every row here");
  assert.equal(OL.shownDepth(o, OL.collapseFromLevel(o, 2)), 2);
});

test("the same part listed twice under one parent gets two keys, and a part under two parents gets separate keys", () => {
  const rows: OL.OutlineInput[] = [{ level: 0, id: "R" }, { level: 1, id: "X" }, { level: 2, id: "S" }, { level: 1, id: "X" }, { level: 2, id: "S" }, { level: 1, id: "Y" }, { level: 2, id: "S" }];
  const o = OL.buildOutline(rows);
  assert.equal(new Set(o.key).size, rows.length, "every row has its own key");
  const s = OL.toggled(o, new Set(), 1);                                    // the first X
  assert.deepEqual(OL.visibleRows(o, s), [0, 1, 3, 4, 5, 6], "only the first X is folded");
});

test("keys survive a re-read: the state is by path, not by row number", () => {
  const o1 = OL.buildOutline(ROWS), s = OL.toggled(o1, new Set(), 5);        // B folded
  const more: OL.OutlineInput[] = [{ level: 0, id: "Root" }, { level: 1, id: "Z" }, ...ROWS.slice(1)];   // a new first part shifts every row number
  const o2 = OL.buildOutline(more);
  const names = OL.visibleRows(o2, s).map((i) => more[i]!.id);
  assert.equal(names.includes("B"), true);
  assert.equal(names.includes("B1"), false, "B is still folded after the rows moved");
});

test("a notice row hides with its parent but does not make a leaf foldable", () => {
  const rows: OL.OutlineInput[] = [{ level: 0, id: "R" }, { level: 1, id: "P" }, { level: 2, id: "… 5 more", notice: true }, { level: 1, id: "Q" }, { level: 2, id: "q1" }, { level: 3, id: "… 2 more", notice: true }];
  const o = OL.buildOutline(rows);
  assert.equal(o.parts[1], 0, "P has only a notice under it");
  assert.deepEqual([...OL.toggled(o, new Set(), 1)], [], "so it does not fold");
  assert.equal(o.max, 2, "a notice does not add a level");
  const s = OL.toggled(o, new Set(), 3);                                     // Q
  assert.deepEqual(OL.visibleRows(o, s), [0, 1, 2, 3], "folding Q hides q1 and the notice under it");
});

/* ---- the Structure table ---- */
const f = (id: string, title: string, props = ""): [string, string] => [`${title}.md`, `---\ntype: Object\nid: ${id}\nuid: 2026110900000${id.replace(/\D/g, "").padStart(4, "0")}outline-test\nstatus: Draft\n${props}tags: []\n---\n# ${title}\n`];
const num = (n: number): string => String(n).padStart(5, "0");

test("the Structure table is an outline table, with the level on every row", () => {
  const v = buildIndex(new Map([f("OBJ-00001", "Top", 'hasPart: ["[[Mid]]"]\n'), f("OBJ-00002", "Mid", 'hasPart: ["[[Leaf]]"]\n'), f("OBJ-00003", "Leaf")]), { classes });
  const t = V.lensTables(v, "structure", "Top.md", { tree: "full" })[0]!;
  assert.equal(t.outline, true);
  assert.deepEqual(t.rows.map((r) => Number(r.level)), [0, 1, 2]);
  assert.equal(V.lensTables(v, "structure", "Top.md", { tree: "full" })[1]!.outline, undefined, "the rolled-up parts list is not an outline");
});

test("more parts than the limit under one assembly: the table says how many are not shown", () => {
  const kids = Array.from({ length: V.LIMIT_PER_PARENT + 5 }, (_, i) => `[[Part ${num(i + 1)}]]`);
  const v = buildIndex(new Map([f("OBJ-00001", "Big", `hasPart: [${kids.map((k) => `"${k}"`).join(", ")}]\n`), ...kids.map((_, i) => f(`OBJ-${num(i + 2)}`, `Part ${num(i + 1)}`))]), { classes });
  const rows = V.lensTables(v, "structure", "Big.md", { tree: "full" })[0]!.rows, last = rows[rows.length - 1]!, name = last.name as { text: string; cls?: string };
  assert.equal(rows.length, 1 + V.LIMIT_PER_PARENT + 1, "the root, the parts up to the limit and one notice");
  assert.equal(name.text.replace(/^\u00a0+/, ""), `… 5 more parts under this assembly not shown (limit ${V.LIMIT_PER_PARENT} per assembly)`);
  assert.equal(name.cls, "gap");
  assert.equal(Number(last.level), 1);
});

test("a tree deeper than the level limit: the last level says parts lie below it, and the direct view does not", () => {
  const depth = V.LIMIT_LEVELS + 2, chain = Array.from({ length: depth + 1 }, (_, i) => f(`OBJ-${num(i + 1)}`, `L${i}`, i < depth ? `hasPart: ["[[L${i + 1}]]"]\n` : ""));
  const v = buildIndex(new Map(chain), { classes });
  const full = V.lensTables(v, "structure", "L0.md", { tree: "full" })[0]!.rows, name = (full[full.length - 1]!.name as { text: string }).text;
  assert.equal(full.filter((r) => (r.name as { cls?: string }).cls !== "gap").length, V.LIMIT_LEVELS + 1, "the root and every level up to the limit");
  assert.equal(name.replace(/^\u00a0+/, ""), `… 1 parts under this one not shown (limit ${V.LIMIT_LEVELS} levels)`);
  const direct = V.lensTables(v, "structure", "L0.md", { tree: "direct" })[0]!.rows;
  assert.equal(direct.some((r) => (r.name as { cls?: string }).cls === "gap"), false, "the direct view stops at one level on purpose");
});

test("a short tree has no notice rows", () => {
  const v = buildIndex(new Map([f("OBJ-00001", "Top", 'hasPart: ["[[Mid]]"]\n'), f("OBJ-00002", "Mid")]), { classes });
  assert.equal(V.lensTables(v, "structure", "Top.md", { tree: "full" })[0]!.rows.some((r) => (r.name as { cls?: string }).cls === "gap"), false);
});

test("the limits are 10 levels and 200 parts under one assembly, and the default of structure() uses them (D-0151)", () => {
  assert.equal(V.LIMIT_LEVELS, 10); assert.equal(V.LIMIT_PER_PARENT, 200);
  const kids = Array.from({ length: 200 }, (_, i) => `[[Part ${num(i + 1)}]]`);
  const v = buildIndex(new Map([f("OBJ-00001", "Board", `hasPart: [${kids.map((k) => `"${k}"`).join(", ")}]\n`), ...kids.map((_, i) => f(`OBJ-${num(i + 2)}`, `Part ${num(i + 1)}`))]), { classes });
  const st = V.structure(v, "Board.md");
  assert.equal(st.tree.children.length, 200); assert.equal(st.tree.more, undefined, "exactly 200 parts is not a cut");
  assert.equal(V.lensTables(v, "structure", "Board.md", { tree: "full" })[0]!.rows.some((r) => (r.name as { cls?: string }).cls === "gap"), false);
});
