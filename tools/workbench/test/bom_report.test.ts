/* The Product BOM report (D-0148) on importer output: indented rows in BOM order, per-parent quantities, attributes read from the revision note and the part number's note. Synthetic part numbers (DAT-002). */
import test from "node:test";
import assert from "node:assert/strict";
import { buildBom, parseDelimited } from "../../importer/src/bom.ts";
import { buildIndex } from "../src/index.ts";
import { bomReport, bomReportCsv } from "../src/bom_report.ts";
import { classes } from "./harness.ts";
const HEAD = "Parent Part Number	Parent CL1	Parent CL2	Parent Part Name	Parent Source	Parent State	Linenumber	Child Part Number	Child CL1	Child CL2	Child Name	Child Source	Child State	SSC	Reference Designator	Cild Notes	From	TO	Amount	Unit	Manufacturer	Manufacturer Part Number";
const line = (pp: string, pn: string, ln: number, cp: string, cn: string, q: string, u = "ea", src = "buy", mfr = "", mpn = ""): string => `${pp}\tA\t01\t${pn}\tmake\tR\t${ln}\t${cp}\tA\t01\t${cn}\t${src}\tR\t\t\t\t\t\t${q}\t${u}\t${mfr}\t${mpn}`;
const ROWS = [
  line("5910001", "PC EDGE9kW 3B 480V", 1, "5910002", "ASSY CONTROL BOX", "1", "ea", "make"),
  line("5910001", "PC EDGE9kW 3B 480V", 2, "07802", "SCREW MACH 10-32 PPH", "4"),
  line("5910001", "PC EDGE9kW 3B 480V", 3, "5910090", "DWG CHARGER", "0"),
  line("5910002", "ASSY CONTROL BOX", 1, "07802", "SCREW MACH 10-32 PPH", "6", "ea", "buy", "ACME FASTENERS", "AF-1032"),
  line("5910002", "ASSY CONTROL BOX", 2, "07900-M", "WIRE 22AWG BLU", "0.559", "M"),
];
const vault = (): Map<string, string> => new Map(buildBom(parseDelimited([HEAD, ...ROWS].join("\n")), { sourceName: "b.tsv", fingerprint: "a".repeat(64), runDate: "2026-11-08T10:00:00", authorCode: "x", classes, existing: null, pending: [], revisionNotes: true }).files.map((f) => [f.path, f.content] as [string, string]));
const pathOf = (ix: ReturnType<typeof buildIndex>, name: string): string => [...ix.notes.values()].find((n) => n.name === name)!.path;

test("indented rows in BOM order, quantity per parent, a shared part listed under each parent, a document line is not a row", () => {
  const ix = buildIndex(vault(), { classes }), r = bomReport(ix, pathOf(ix, "5910001"));
  assert.deepEqual(r.rows.map((x) => `${x.level}|${x.partNumber}|${x.qty}${x.unit ? " " + x.unit : ""}`), ["0|5910001|null", "1|5910002|1", "2|07802|6", "2|07900-M|0.559 m", "1|07802|4"]);
  assert.equal(r.rows.some((x) => x.partNumber === "5910090"), false, "the importer keeps a document line out of the part usages (a drawing reference), so it is not a row");
  assert.equal(r.truncated, false);
});

test("attributes: make/buy and category from the part number's note, description from the part", () => {
  const ix = buildIndex(vault(), { classes }), r = bomReport(ix, pathOf(ix, "5910001")), by = (pn: string) => r.rows.find((x) => x.partNumber === pn)!;
  assert.equal(by("5910002").makeBuy, "make"); assert.equal(by("07802").makeBuy, "buy");
  assert.match(by("07802").description, /SCREW/); assert.ok(by("5910002").category !== "");
});

test("a usage naming a part with no note is a row marked not in vault; the depth cap is reported, not silent", () => {
  const v = vault(), ix0 = buildIndex(v, { classes });
  for (const n of [...ix0.notes.values()]) if (n.meta.partNumber === "07802" || n.name === "07802") v.delete(n.path);
  const ix = buildIndex(v, { classes }), r = bomReport(ix, pathOf(ix, "5910001"));
  const gone = r.rows.filter((x) => x.partNumber.includes("07802"));
  assert.ok(gone.length >= 2 && gone.every((x) => x.problem === "not in vault" && x.path === null));
  assert.equal(bomReport(ix, pathOf(ix, "5910001"), { maxDepth: 1 }).truncated, true);
});

test("the manufacturer and part number of a line are on its row", () => {
  const ix = buildIndex(vault(), { classes }), r = bomReport(ix, pathOf(ix, "5910001"));
  const screw = r.rows.find((x) => x.level === 2 && x.partNumber === "07802")!;
  assert.deepEqual(screw.sources, [{ manufacturer: "ACME FASTENERS", mpn: "AF-1032" }]);
});

test("CSV for Excel: byte-order mark, quoted fields, part numbers that Excel would change are kept as text", () => {
  const ix = buildIndex(vault(), { classes }), csv = bomReportCsv(bomReport(ix, pathOf(ix, "5910001")));
  assert.ok(csv.startsWith("﻿\"Level\",\"Part Number\""));
  assert.ok(csv.includes('="07802"'), "07802 would lose its zero in Excel");
  assert.ok(csv.includes('="5910001"'));
  assert.ok(!csv.includes('"="'), "a protected value is not also quoted");
  assert.equal(csv.split("\r\n").filter(Boolean).length, 6);   // header + 5 rows
  assert.ok(csv.includes('"0.559","m"'));
});
test("CSV: quotes and commas in a description do not break the row", () => {
  const r = { root: "x", truncated: true, documentLines: 0, rows: [{ level: 0, path: "x", partNumber: "A-1", description: 'CABLE, 3" "BLUE"', qty: null, unit: "", revision: "", category: "", makeBuy: "", sources: [], problem: "" as const }] };
  const csv = bomReportCsv(r);
  assert.ok(csv.includes('"CABLE, 3"" ""BLUE"""')); assert.ok(csv.includes("cut off"));
});
