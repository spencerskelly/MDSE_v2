/* D-0146: the keyword review reads real importer output. */
import test from "node:test";
import assert from "node:assert/strict";
import { buildBom, parseDelimited } from "../../importer/src/bom.ts";
import { buildIndex } from "../src/index.ts";
import { keywordGroups } from "../src/keywords.ts";
import { classes } from "./harness.ts";
const HEAD = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tParent Source\tParent State\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tChild Source\tChild State\tSSC\tReference Designator\tCild Notes\tFrom\tTO\tAmount\tUnit\tParent Rev";
const row = (n: number, pn: string, name: string): string => ["TOP-1", "-A", "01", "TOP ASSEMBLY", "make", "PRODUCTION", String(n), pn, "-A", "01", name, "buy", "PRODUCTION", "", "", "", "", "", "1", "ea", "TOP-1-A01"].join("\t");
test("uncategorized parts are grouped by their first word, with the category placed parts of the same start carry", async () => {
  const names = ["SCREW MACH 8-32", "SCREW MACH 6-32", "SCREW CAP M4", "SCREW CAP M5", "WIDGET TURBO", "WIDGET DELUXE", "GIZMO ONE"];
  const g = parseDelimited([HEAD, ...names.map((x, i) => row(i + 1, "P" + (i + 1), x))].join("\n"));
  const r = buildBom(g, { sourceName: "b.tsv", fingerprint: "a".repeat(64), runDate: "2026-11-08T10:00:00", authorCode: "skellyspencer", classes, existing: null, pending: [], revisionNotes: true });
  const ix = await buildIndex(new Map(r.files.map((f) => [f.path, f.content])), { classes });
  const k = keywordGroups(ix, { minEvidence: 2 });
  assert.ok(k.total >= 7);
  const widget = k.groups.find((x) => x.key === "WIDGET")!;
  assert.equal(widget.parts.length, 2); assert.equal(widget.suggested, null, "no placed WIDGET parts: no suggestion");
  assert.deepEqual(widget.examples.sort(), ["P5", "P6"]);
  assert.ok(!k.groups.some((x) => x.key === "SCREW"), "SCREW parts are placed by the table, so they are not open");
  assert.ok(k.byCategory.some((c) => c.category === "Screw" && c.count === 4));
});

import { previewWord } from "../src/keywords.ts";
import { DEFAULT_CATEGORY_RULES } from "../../importer/src/bom_category.ts";
test("a word's preview counts the uncategorized parts it places and the placed parts it would move", async () => {
  const names = ["SCREW MACH 8-32", "WIDGET TURBO", "WIDGET DELUXE", "WIDGET SCREW M4", "GIZMO ONE"];
  const g = parseDelimited([HEAD, ...names.map((x, i) => row(i + 1, "P" + (i + 1), x))].join("\n"));
  const r = buildBom(g, { sourceName: "b.tsv", fingerprint: "a".repeat(64), runDate: "2026-11-08T10:00:00", authorCode: "skellyspencer", classes, existing: null, pending: [], revisionNotes: true });
  const ix = await buildIndex(new Map(r.files.map((f) => [f.path, f.content])), { classes });
  const p = previewWord(ix, DEFAULT_CATEGORY_RULES, "WIDGET", "ME Part");
  assert.equal(p.placed, 2, "TURBO and DELUXE");
  assert.equal(p.movedTotal, 1, "WIDGET SCREW M4 is a Screw now (SCREW is later in the text, but WIDGET is first)");
  assert.deepEqual(p.moved, [{ from: "Screw", count: 1 }]);
  assert.equal(previewWord(ix, DEFAULT_CATEGORY_RULES, "NOTHING", "ME Part").placed, 0);
});
