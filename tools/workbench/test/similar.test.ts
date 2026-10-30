import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import { findSimilar, similarKinds } from "../src/similar.ts";
import { classes } from "./harness.ts";

const o = (id: string, title: string, parts: string[] = [], extra = ""): [string, string] => [`${title}.md`, `---\ntype: Object\nid: ${id}\nuid: 20261025000000-${id}\nstatus: Draft\n${parts.length ? `hasPart: [${parts.map((p) => `"[[${p}]]"`).join(", ")}]\n` : ""}${extra}tags: []\n---\n# ${title}\n`];

const ix = () => buildIndex(new Map([
  o("OBJ-00001", "Charger A", ["Power Module", "Cable Kit", "Fan"]), o("OBJ-00002", "Charger B", ["Power Module", "Display"]),
  o("OBJ-00003", "Power Module"), o("OBJ-00004", "Cable Kit"), o("OBJ-00005", "Fan"), o("OBJ-00006", "Display"),
]), { classes });

test("a shared part lists the other assemblies that use it, and a part lists its siblings", () => {
  const v = ix(), pm = findSimilar(v, "Power Module.md");
  const g = pm.groups.find((x) => x.kind === "hasPart" && x.direction === "in" && x.via === "Charger A.md")!;
  assert.deepEqual(g.peers, ["Cable Kit.md", "Fan.md"], "siblings under the same parent");
  const g2 = pm.groups.find((x) => x.via === "Charger B.md")!;
  assert.deepEqual(g2.peers, ["Display.md"]);
  const asm = findSimilar(v, "Charger A.md"), up = asm.groups.find((x) => x.direction === "out" && x.via === "Power Module.md")!;
  assert.deepEqual(up.peers, ["Charger B.md"], "the other assembly that uses the same part");
});

test("peers are counted by how many relationships they share, most first; the note itself is never listed", () => {
  const v = ix(), r = findSimilar(v, "Charger A.md");
  assert.ok(r.peers.every((p) => p.path !== "Charger A.md"));
  assert.equal(r.peers[0]!.path, "Charger B.md");
  assert.equal(r.peers[0]!.shared, 1);
});

test("kind filter, no relationships, unknown note, retired notes", () => {
  const v = ix();
  assert.deepEqual(findSimilar(v, "Power Module.md", { kinds: ["satisfies"] }).groups, []);
  assert.deepEqual(similarKinds(findSimilar(v, "Power Module.md")), ["hasPart"]);
  assert.deepEqual(findSimilar(v, "nope.md"), { groups: [], peers: [] });
  const w = buildIndex(new Map([o("OBJ-00001", "A", ["P"]), o("OBJ-00002", "B", ["P"]), o("OBJ-00003", "C", ["P"], "mergedInto: \"[[B]]\"\n"), o("OBJ-00004", "P")]), { classes });
  assert.deepEqual(findSimilar(w, "A.md").groups[0]!.peers, ["B.md"], "a retired stub is not a peer");
});
