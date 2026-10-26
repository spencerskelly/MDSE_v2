import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import { uniqueParts } from "../src/compare.ts";
import { uniqueCanvas, cardNotePath, isInternalId } from "../src/canvas.ts";
import { lensTables } from "../src/views.ts";
import { classes } from "./harness.ts";

const o = (id: string, title: string, parts: string[] = [], pn = ""): [string, string] => [`${title}.md`, `---\ntype: Object\nid: ${id}\nuid: 20261025000000-${id}\nstatus: Draft\n${pn ? `partNumber: ${pn}\n` : ""}${parts.length ? `hasPart: [${parts.map((p) => `"[[${p}]]"`).join(", ")}]\n` : ""}tags: []\n---\n# ${title}\n`];

const ix = () => buildIndex(new Map([
  o("OBJ-00001", "Charger A", ["Power Module", "Cable Kit", "Fan"]), o("OBJ-00002", "Charger B", ["Power Module", "Cable Kit B", "Display"]),
  o("OBJ-00003", "Power Module", ["Rectifier", "Relay A"]), o("OBJ-00004", "Rectifier"), o("OBJ-00005", "Relay A"),
  o("OBJ-00006", "Cable Kit", ["Lug", "Cable"]), o("OBJ-00007", "Cable Kit B", ["Lug", "Shroud"]), o("OBJ-00008", "Lug"), o("OBJ-00009", "Cable"), o("OBJ-00010", "Shroud"), o("OBJ-00011", "Fan"), o("OBJ-00012", "Display"),
]), { classes });

test("unique parts: only the path down to each part the other assembly lacks (D-0104)", () => {
  const v = ix(), r = uniqueParts(v, "Charger A.md", "Charger B.md")!;
  const names = (t: typeof r.a): string[] => [t.label, ...t.children.flatMap(names)];
  assert.deepEqual(names(r.a), ["Charger A", "Cable Kit", "Cable", "Fan"], "Lug and Power Module are in B too; Cable Kit stays as the path to Cable");
  assert.deepEqual(names(r.b), ["Charger B", "Cable Kit B", "Shroud", "Display"]);
  assert.equal(r.uniqueA, 3); assert.equal(r.uniqueB, 3);
  const kit = r.a.children.find((c) => c.label === "Cable Kit")!; assert.equal(kit.unique, true, "Cable Kit is not in B (B has Cable Kit B)");
});

test("a shared assembly with a different part below is kept as a path only", () => {
  const v = buildIndex(new Map([o("OBJ-00001", "A", ["Mid"]), o("OBJ-00002", "B", ["Mid2"]), o("OBJ-00003", "Mid", ["X", "Y"], "PN-1"), o("OBJ-00004", "Mid2", ["Y"], "PN-1"), o("OBJ-00005", "X"), o("OBJ-00006", "Y")]), { classes });
  const r = uniqueParts(v, "A.md", "B.md")!, mid = r.a.children[0]!;
  assert.equal(mid.unique, false, "same part number, so the same assembly"); assert.deepEqual(mid.children.map((c) => c.label), ["X"]); assert.equal(r.b.children.length, 0);
});

test("table and canvas", () => {
  const v = ix(), t = lensTables(v, "compare", "Charger A.md", { other: "Charger B.md" }).find((x) => x.id === "compare-unique")!;
  assert.ok(t.rows.length >= 8);
  const c = uniqueCanvas(v, "Charger A.md", "Charger B.md");
  assert.equal(c.doc.nodes.length, 8); assert.equal(c.doc.edges.length, 6);
  assert.ok(c.doc.nodes.every((n) => isInternalId(n.id)) && c.doc.edges.every((e) => isInternalId(e.id)));
  const at = (n: string) => c.doc.nodes.find((x) => cardNotePath(x as never) === `${n}.md`)!;
  assert.ok(at("Cable Kit").y > at("Charger A").y && at("Cable").y > at("Cable Kit").y && at("Charger B").x > at("Fan").x);
  assert.equal(new Set(c.doc.nodes.map((n) => `${n.x},${n.y}`)).size, 8, "no card on another");
});
