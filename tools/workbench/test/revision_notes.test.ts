/* The importer's revision notes (D-0127, D-0135) read by the Workbench: links resolve, the chain and the impact view work on real importer output. */
import test from "node:test";
import assert from "node:assert/strict";
import { buildBom, parseDelimited } from "../../importer/src/bom.ts";
import { buildIndex } from "../src/index.ts";
import * as P from "../src/edit_plm.ts";
import * as E from "../src/edit_eco.ts";
import * as V from "../src/views.ts";
import { classes } from "./harness.ts";
const FLAT_HEAD = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tParent Source\tParent State\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tChild Source\tChild State\tSSC\tReference Designator\tCild Notes\tFrom\tTO\tAmount\tUnit\tParentCL1CL2";
const FLAT_ROWS = [
  "01141-002\t-N\t99\tCABLE ASSY THERMISTOR 10.00IN PWRSTN\tbuy\tPRODUCTIONPREPARATION\t1\t01191\t-0\t99\tCONNECTOR HOUSING WIRE WIRE SHROUD 2PIN\tbuy\tPRODUCTIONPREPARATION\t\t\t\t2/Jan/19\t\t1\tea\t01141-002-N99",
  "01141-002\t-N\t99\tCABLE ASSY THERMISTOR 10.00IN PWRSTN\tbuy\tPRODUCTIONPREPARATION\t3\t01797\t-0\t99\tCONTACT CRIMP FEM 22-24AWG 250V 3A GOLD\tbuy\tPRODUCTIONPREPARATION\t\t\t\t2/Jan/19\t\t2\tea\t01141-002-N99",
  "01141-002\t-N\t99\tCABLE ASSY THERMISTOR 10.00IN PWRSTN\tbuy\tPRODUCTIONPREPARATION\t4\t01798-006-M\t-0\t01\tWIRE 22AWG 19-34 TN CU BLU IRR PVC 300V\tbuy\tPRODUCTIONPREPARATION\t\t\t\t2/Jan/19\t\t0.559\tM\t01141-002-N99",
  "01141-002\t-N\t99\tCABLE ASSY THERMISTOR 10.00IN PWRSTN\tbuy\tPRODUCTIONPREPARATION\t6\t02157-M\t-0\t99\tADHESIVE EPOxY DP-110 GRAY\tbuy\tPRODUCTIONPREPARATION\t\t\t\t2/Jan/19\t\t0.887\tML\t01141-002-N99",
  "01141-002\t-N\t99\tCABLE ASSY THERMISTOR 10.00IN PWRSTN\tbuy\tPRODUCTIONPREPARATION\t1001\t01141-91\t-M\t99\tDWG CABLE ASSY THERMISTOR PWRSTN\tbuy\tPRODUCTIONPREPARATION\t\t\t\t2/Jan/19\t\t0\tea\t01141-002-N99",
  "04270-001\t-D\t99\tPCBA GREEN LED SMARTGUARD\tbuy\tPRODUCTIONPREPARATION\t1\t04766\t-B\t99\tASSY MICROCONTROLLER SMARTGUARD\tbuy\tPRODUCTIONPREPARATION\t\tU3\t\t2/Jan/19\t\t1\tea\t04270-001-D99",
  // the assembly 04766 has its own lines at revision -C99, but 04270-001 pins -B99: BOM-012
  "04766\t-C\t99\tASSY MICROCONTROLLER SMARTGUARD\tbuy\tPRODUCTIONPREPARATION\t1\t01191\t-0\t99\tCONNECTOR HOUSING WIRE WIRE SHROUD 2PIN\tbuy\tPRODUCTIONPREPARATION\t\t\t\t2/Jan/19\t\t1\tea\t04766-C99",
];
const flatText = [FLAT_HEAD, ...FLAT_ROWS].join("\n");
const built = (): Map<string, string> => {
  const r = buildBom(parseDelimited(flatText), { sourceName: "bom.tsv", fingerprint: "a".repeat(64), runDate: "2026-10-20T10:00:00", authorCode: "skellyspencer", classes, existing: null, pending: [], revisionNotes: true });
  return new Map(r.files.map((f) => [f.path, f.content]));
};

test("importer revision notes: usages and specializations resolve, the chain lists every CL1, the ECO impact climbs through revision notes", () => {
  const f = built(), ix = buildIndex(f, { classes });
  const unresolved = ix.edges.filter((e) => (e.kind === "hasPart" || e.kind === "specializes") && !e.to);
  assert.deepEqual(unresolved.map((e) => `${e.kind} ${e.toSymbol}`), [], "every part usage and specialization points at a note");
  assert.ok(ix.edges.some((e) => e.kind === "specializes"), "a revision note specializes its part number's note");
  const pn = [...ix.notes.values()].find((n) => n.name === "04766")!;
  assert.deepEqual(P.plmRevisionChain(ix, pn).map((n) => n.name), ["04766", "04766 -B", "04766 -C"]);
  const b = [...ix.notes.values()].find((n) => n.name === "04766 -B")!;
  const impact = E.ecoImpact(ix, [b.path]);
  assert.ok(impact.some((x) => x.partNumber === "04270-001"), "04270-001 pins 04766 at -B99, so it is above the -B note");
  const c = [...ix.notes.values()].find((n) => n.name === "04766 -C")!;
  assert.equal(E.ecoImpact(ix, [c.path]).length, 0, "nothing pins -C99");
});

test("a revision note takes its category from its part number's note, and parts under an assembly can be listed by category (D-0141)", () => {
  const ix = buildIndex(built(), { classes });
  const rev = [...ix.notes.values()].find((n) => n.name === "01191 -0")!, pn = [...ix.notes.values()].find((n) => n.name === "01191")!;
  assert.ok(String(pn.meta.bomCategory ?? "") !== "", "the part number note carries the category");
  assert.equal(V.bomCategoryOfNote(ix, rev.path), String(pn.meta.bomCategory));
  const top = [...ix.notes.values()].find((n) => n.name === "01141-002 -N")!, r = V.bomByCategory(ix, top.path);
  assert.ok(r.rows.length > 0 && r.categories.reduce((a, c) => a + c.count, 0) === r.rows.length, "every part is in exactly one category");
});
