import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { d3dag, D3DAG_SHA256 } from "../src/dag_lib.ts";
import { buildIndex } from "../src/index.ts";
import { addToCanvas, autoLayout, cardNotePath, type CanvasDoc } from "../src/canvas.ts";
import { classes } from "./harness.ts";

/* D-0168: d3-dag 2.0.0 is vendored unmodified inside dag_lib.ts and orders the cards that have no parent on the canvas. */

test("the vendored d3-dag file is unmodified and pinned (D-0168)", () => {
  const src = readFileSync(new URL("../src/dag_lib.ts", import.meta.url), "utf8");
  const body = src.split("/*@@D3DAG-BEGIN@@*/\n")[1]!.split("\n/*@@D3DAG-END@@*/")[0]!;
  assert.equal(createHash("sha256").update(body).digest("hex"), D3DAG_SHA256);
  assert.ok(readFileSync(new URL("../vendor/d3-dag/README.md", import.meta.url), "utf8").includes(D3DAG_SHA256), "the vendor README names the same hash");
  for (const l of ["d3-dag", "d3-array", "javascript-lp-solver", "quadprog", "stringify-object"]) assert.ok(readFileSync(new URL(`../vendor/d3-dag/LICENSE-${l}`, import.meta.url), "utf8").length > 100, `licence of ${l}`);
});

test("loading d3-dag leaves no global behind (D-0168)", () => {
  assert.equal(typeof d3dag.sugiyama, "function");
  assert.equal(typeof d3dag.decrossTwoLayer, "function");
  assert.ok(!("d3" in globalThis) && !("solver" in globalThis), "the library's d3 and solver globals were put back");
});

let k = 0;
const f = (title: string, parts: string[] = []): [string, string] => { k++; return [`${title}.md`, `---\ntype: Object\nid: OBJ-${String(k).padStart(5, "0")}\nuid: 2026112400000${String(k).padStart(5, "0")}dag-order-\nstatus: Draft\n${parts.length ? `hasPart: [${parts.map((p) => `"[[${p}]]"`).join(", ")}]\n` : ""}tags: []\n---\n# ${title}\n`]; };

test("assemblies that share the most parts sit next to each other, so their shared parts are not under a third one (D-0168)", () => {
  const v = buildIndex(new Map([
    f("Asm A", ["A1", "AB", "AC1", "AC2"]), f("Asm B", ["AB", "B1", "B2", "BC"]), f("Asm C", ["BC", "AC1", "AC2", "C1"]),
    ...["A1", "AB", "AC1", "AC2", "B1", "B2", "BC", "C1"].map((t) => f(t)),
  ]), { classes });
  const d: CanvasDoc = autoLayout(addToCanvas({ nodes: [], edges: [] }, v, null, [...v.notes.keys()]).doc, v).doc;
  const top = d.nodes.filter((n) => /^Asm /.test(cardNotePath(n as never) ?? "")).sort((a, b) => a.x - b.x).map((n) => cardNotePath(n as never)!.replace(/\.md$/, ""));
  assert.equal(Math.abs(top.indexOf("Asm A") - top.indexOf("Asm C")), 1, `A and C adjacent: ${top.join(", ")}`);
  assert.equal(autoLayout(d, v).moved, 0, "idempotent");
});
