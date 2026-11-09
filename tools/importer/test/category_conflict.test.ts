/* D-0149: a part number with different categories on different BOM lines is reported, not silently resolved. Synthetic part numbers (DAT-002). */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildBom, parseDelimited } from "../src/bom.ts";
const HEAD = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tParent Source\tParent State\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tChild Source\tChild State\tSSC\tReference Designator\tCild Notes\tFrom\tTO\tAmount\tUnit\tManufacturer\tManufacturer Part Number\tChild Category";
const line = (p: string, ln: number, c: string, q: string, cat: string): string => `${p}\tA\t01\tASSY ${p}\tmake\tR\t${ln}\t${c}\tA\t01\tPART ${c}\tbuy\tR\t\t\t\t\t\t${q}\tea\t\t\t${cat}`;
const classes = JSON.parse(readFileSync(new URL("../../core/src/classes.json", import.meta.url), "utf8"));
const run = (rows: string[]) => buildBom(parseDelimited([HEAD, ...rows].join("\n")), { sourceName: "b.tsv", fingerprint: "a".repeat(64), runDate: "2026-11-08T10:00:00", authorCode: "x", classes, existing: null, pending: [] } as any);

test("the same part with two categories gets a CATEGORY_CONFLICT finding naming the lines; a part with one category does not", () => {
  const r = run([line("1000", 1, "2000", "1", "Cable Mgmt"), line("1001", 1, "2000", "1", "Cable Mgmt"), line("1002", 1, "2000", "1", "Cable ASM"), line("1000", 2, "3000", "1", "Screw"), line("1001", 2, "3000", "2", "Screw")]);
  const f = r.findings.filter((x) => x.code === "CATEGORY_CONFLICT");
  assert.equal(f.length, 1);
  assert.match(f[0]!.message, /^1 part number\(s\)/); assert.match(f[0]!.message, /2000 \(filed [^)]+\): Cable Mgmt on 2 lines, Cable ASM on 1 line/);
  assert.doesNotMatch(f[0]!.message, /3000/);
});
test("no finding when every line agrees, or the category is spelled in a different case", () => {
  assert.equal(run([line("1000", 1, "2000", "1", "Screw"), line("1001", 1, "2000", "1", "SCREW")]).findings.some((x) => x.code === "CATEGORY_CONFLICT"), false);
});
