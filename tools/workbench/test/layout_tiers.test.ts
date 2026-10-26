import test from "node:test";
import assert from "node:assert/strict";
import { buildIndex } from "../src/index.ts";
import { addToCanvas, autoLayout, layoutTier, cardNotePath } from "../src/canvas.ts";
import { classes } from "./harness.ts";

const f = (type: string, id: string, title: string, props = "", sub = ""): [string, string] => [`${title}.md`, `---\ntype: ${type}\n${sub ? `subtype: ${sub}\n` : ""}id: ${id}\nuid: 2026102500000${id.replace(/\D/g, "").padStart(5, "0")}tiers-layout-\nstatus: Draft\n${props}tags: []\n---\n# ${title}\n`];

test("which row a kind of note is in (D-0102)", () => {
  assert.deepEqual(["Actor", "Use Case", "Requirement", "Behavior", "Condition", "Verification", "Procedure", "Object"].map((t) => layoutTier(t)), [0, 1, 2, 3, 3, 3, 3, 5]);
  assert.equal(layoutTier("Object", "interface"), 4); assert.equal(layoutTier("Object", "part"), 5);
  for (const t of ["Issue", "Info", "Document", "Artifact", "Diagram", "Item Flow", "Failure Mode", "modelCheck"]) assert.equal(layoutTier(t), undefined, t + " is a side note");
});

test("auto-layout: actor, use case, requirement, function row, object, top to bottom; a side note in a column to the right of its note", () => {
  const v = buildIndex(new Map([
    f("Actor", "ACT-00001", "Driver"), f("Use Case", "UC-00001", "Charge a truck", 'participants: ["[[Driver]]"]\n'),
    f("Requirement", "REQ-00001", "Charge fast", 'refines: ["[[Charge a truck]]"]\n'),
    f("Behavior", "BEH-00001", "Deliver power", 'satisfies: ["[[Charge fast]]"]\n'), f("Verification", "VER-00001", "Power test", 'verifies: ["[[Charge fast]]"]\n'),
    f("Object", "OBJ-00001", "Charger", 'performs: ["[[Deliver power]]"]\n'),
    f("Issue", "ISS-00001", "Overheats", 'affects: ["[[Charger]]"]\n'),
  ]), { classes });
  const doc = addToCanvas({ nodes: [], edges: [] }, v, null, [...v.notes.keys()]).doc;
  const r = autoLayout({ nodes: doc.nodes.map((n, i) => ({ ...n, x: (i * 37) % 5 * 50, y: (i * 53) % 3 * 40 })), edges: doc.edges }, v);
  const at = (t: string) => r.doc.nodes.find((n) => cardNotePath(n as never) === `${t}.md`)!;
  const ys = ["Driver", "Charge a truck", "Charge fast", "Deliver power", "Charger"].map((t) => at(t).y);
  assert.deepEqual(ys, [...ys].sort((a, b) => a - b)); assert.equal(new Set(ys).size, 5, "five different rows");
  assert.equal(at("Power test").y, at("Deliver power").y, "tests are in the row of the functions");
  assert.ok(at("Deliver power").x < at("Power test").x, "functions, then tests, left to right");
  const side = at("Overheats"), right = Math.max(...["Driver", "Charge a truck", "Charge fast", "Deliver power", "Power test", "Charger"].map((t) => at(t).x + at(t).width));
  assert.ok(side.x >= right + 3 * 280, "the issue is in a column to the right, a related gap from the cards"); assert.equal(side.y, Math.max(at("Charger").y, side.y)); assert.ok(side.y >= at("Charger").y, "level with the object it affects, or below");
  assert.equal(autoLayout(r.doc, v).moved, 0, "idempotent");
});
