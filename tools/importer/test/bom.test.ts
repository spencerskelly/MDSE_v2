import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { deflateRawSync } from "node:zlib";
import MDSE from "../../core/src/mdse_core.js";
import { buildBom, parseDelimited, detectLayout, parseBom } from "../src/bom.ts";
import type { Grid } from "../src/bom.ts";
import { sha256Text } from "../src/sha256.ts";
import { ROOT } from "./harness.ts";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { readXlsx } = require("../src/xlsx_reader.js");
const classes = JSON.parse(readFileSync(ROOT + "tools/core/src/classes.json", "utf8"));

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
const baseOpts = { sourceName: "bom.tsv", fingerprint: "a".repeat(64), runDate: "2026-10-20T10:00:00", authorCode: "skellyspencer", classes, existing: null, pending: [] as Array<[string, string]> };
const byTitle = (files: Array<{ path: string; content: string }>, pn: string) => files.find((f) => f.path.startsWith("BOM/") && f.path.endsWith("/" + pn + ".md"))!;

test("flat BOM: one note per part number, parent-owned usages, pinned revision, units kept", () => {
  const r = buildBom(parseDelimited(flatText), baseOpts);
  assert.equal(r.status, "WRITE_READY");
  const notes = r.files.filter((f) => f.path.startsWith("BOM/")), pns = notes.map((f) => /BOM Part Number: (.+)/.exec(f.content)![1]).sort();
  assert.deepEqual(pns, ["01141-002", "01141-91", "01191", "01797", "01798-006-M", "02157-M", "04270-001", "04766"]);   // 01191 once, however many parents
  const a = byTitle(r.files, "01141-002").content;
  assert.match(a, /^type: Object$/m); assert.match(a, /^subtype: part$/m); assert.match(a, /^id: OBJ-\d{5}$/m); assert.match(a, /^uid: \d{17}skellyspencer$/m);
  assert.match(a, /attribute revision = "-N99";/);
  assert.match(a, /part connectorHousingWireWireShroud2pin : OBJ_\d{5}::P_01191 \{\n\s+attribute line = 1;\n\s+attribute childRevision = "-099";/);
  assert.match(a, /: OBJ_\d{5}::P_01797 \[2\] \{/);                                       // discrete count -> multiplicity
  assert.match(a, /attribute quantity = 0\.559;\n\s+attribute unit = "M";/);              // measured -> quantity + raw unit
  assert.match(a, /attribute unit = "ML";/);                                              // case kept
  assert.doesNotMatch(a, /01141-91 \{|P_01141_91/);                                       // drawing line is not a usage
  assert.match(a, /^references: \["\[\[01141-91\]\]"\]$/m);
  assert.match(a, /^hasPart: \[/m);
  const dwg = byTitle(r.files, "01141-91").content; assert.match(dwg, /^type: Document$/m); assert.doesNotMatch(dwg, /## SysML v2/);
  // leading zeros survive
  assert.match(byTitle(r.files, "01191").content, /BOM Part Number: 01191/);
  assert.equal(r.summary.drawings, 1);
});

test("pinned child revision that is not the child's latest: flagConflict on the parent, older users listed on the child (BOM-011/012)", () => {
  const r = buildBom(parseDelimited(flatText), baseOpts);
  const parent = byTitle(r.files, "04270-001").content, child = byTitle(r.files, "04766").content;
  assert.match(parent, /\[!flagConflict\] Pins 04766 at an older revision/); assert.match(parent, /"-B99"/); assert.match(parent, /"-C99"/);
  assert.match(child, /## Used at an older revision\n\n- \[\[04270-001\]\] line 1 pins revision "-B99"/);
  assert.match(child, /attribute revision = "-C99";/);                                    // latest wins the properties (BOM-007)
  assert.equal(r.summary.conflicts, 1);
});

test("a part number whose latest revision cannot be told is reported and not imported, with its usages (BOM-009)", () => {
  const extra = "01653\t-C\t99\tTANK\tbuy\tP\t1\t05274\t-0\t99\tTANK EXP\tbuy\tP\t\t\t\t\t\t1\tea\t01653-C99\n01654\t-C\t99\tTANK2\tbuy\tP\t1\t05274\t-1\t99\tTANK EXP\tbuy\tP\t\t\t\t\t\t1\tea\t01654-C99";
  const r = buildBom(parseDelimited(flatText + "\n" + extra), baseOpts);
  assert.ok(!r.files.some((f) => f.path.startsWith("BOM/") && f.content.includes("BOM Part Number: 05274")));
  assert.ok(r.findings.some((f) => f.code === "REV_UNDETERMINED" && f.message.startsWith("05274")));
  assert.ok(!byTitle(r.files, "01653").content.includes("05274"));
  assert.equal(r.summary.skippedParts, 1);
});

test("blank part number + manufacturer part number is an alternate of the line above, not a part (BOM-003/013)", () => {
  const head = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tManufacturer\tManufacturer Part Number\tAmount\tUnit";
  const rows = ["PC-0\tA\t1\tFRAME\t1\tPC-100\tA\t1\tPLATE\tCIRCLE AW\tAW 250\t2\tea", "PC-0\tA\t1\tFRAME\t\t\t\t\t\tEATON B-LINE\tAW250\t\t", "PC-0\tA\t1\tFRAME\t\t\t\t\t\tOTHER\tX1\t\t"];
  const r = buildBom(parseDelimited([head, ...rows].join("\n")), baseOpts);
  const plate = byTitle(r.files, "PC-100").content, frame = byTitle(r.files, "PC-0").content;
  assert.match(plate, /Manufacturer sources: 1\. CIRCLE AW AW 250; 2\. EATON B-LINE AW250 \(alternate\); 3\. OTHER X1 \(alternate\)/);
  assert.match(frame, /: OBJ_\d{5}::P_PC_100 \[2\] \{/); assert.equal(r.summary.usages, 1);   // 2 occurrences, not 3
  assert.equal(r.files.filter((f) => f.path.startsWith("BOM/")).length, 2);
});

test("generated notes pass the vault validator and re-import into a vault that has them changes nothing", () => {
  const r = buildBom(parseDelimited(flatText), baseOpts);
  for (const f of r.files.filter((x) => x.path.startsWith("BOM/"))) assert.deepEqual(MDSE.validate(f.content, classes), [], f.path);
  const ex = { hasVault: true, files: new Map(r.files.map((f) => [f.path, f.content] as [string, string])) };
  const again = buildBom(parseDelimited(flatText), { ...baseOpts, existing: ex });
  assert.equal(again.files.filter((f) => f.path.startsWith("BOM/")).length, 0);
  assert.equal(again.summary.existing, 8);
  const ids = r.files.filter((f) => f.path.startsWith("BOM/")).map((f) => /^id: (\S+)/m.exec(f.content)![1]); assert.equal(new Set(ids).size, ids.length);
});

test("ids and uids continue after the vault's and after pending EA files", () => {
  const pending: Array<[string, string]> = [["x.md", "---\ntype: Object\nid: OBJ-00041\nuid: 20240101000000000someoneelse-\n---\n"]];
  const r = buildBom(parseDelimited(flatText), { ...baseOpts, pending });
  const ids = r.files.filter((f) => f.path.startsWith("BOM/Parts")).map((f) => /^id: (\S+)/m.exec(f.content)![1]).sort();
  assert.equal(ids[0], "OBJ-00042");
});

test("EA to BOM join is a report: names containing the part number count, nothing is linked", () => {
  const r = buildBom(parseDelimited(flatText), { ...baseOpts, eaTitles: ["04766 Micro", "Charger", "01191 housing", "01191 housing copy"] });
  assert.equal(r.summary.eaMatched, 1);
  assert.ok(r.findings.some((f) => f.code === "EA_AMBIGUOUS")); assert.ok(r.findings.some((f) => f.code === "EA_JOIN"));
});

test("a sheet with no usable header is refused with a reason", () => {
  const r = buildBom(parseDelimited("a,b\n1,2"), baseOpts);
  assert.equal(r.status, "FAILED"); assert.match(r.problems[0]!, /No header row/);
  assert.equal(detectLayout(parseDelimited("a,b\n1,2")).layout, null);
});

// ---- xlsx ------------------------------------------------------------------------------------------------------------
function zipOf(entries: Record<string, string>, deflate: boolean): Uint8Array {
  const enc = new TextEncoder(), parts: Uint8Array[] = [], central: Uint8Array[] = []; let off = 0;
  const w16 = (n: number) => [n & 255, (n >> 8) & 255], w32 = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  for (const [name, text] of Object.entries(entries)) {
    const raw = enc.encode(text), data = deflate ? new Uint8Array(deflateRawSync(raw)) : raw, nm = enc.encode(name), crc = MDSE.crc32(raw) >>> 0, m = deflate ? 8 : 0;
    const local = Uint8Array.from([...w32(0x04034b50), ...w16(20), ...w16(0), ...w16(m), ...w16(0), ...w16(0), ...w32(crc), ...w32(data.length), ...w32(raw.length), ...w16(nm.length), ...w16(0), ...nm]);
    parts.push(local, data);
    central.push(Uint8Array.from([...w32(0x02014b50), ...w16(20), ...w16(20), ...w16(0), ...w16(m), ...w16(0), ...w16(0), ...w32(crc), ...w32(data.length), ...w32(raw.length), ...w16(nm.length), ...w16(0), ...w16(0), ...w16(0), ...w16(0), ...w32(0), ...w32(off), ...nm]));
    off += local.length + data.length;
  }
  const cd = central.reduce((n, c) => n + c.length, 0);
  const end = Uint8Array.from([...w32(0x06054b50), ...w16(0), ...w16(0), ...w16(central.length), ...w16(central.length), ...w32(cd), ...w32(off), ...w16(0)]);
  const all = [...parts, ...central, end], out = new Uint8Array(all.reduce((n, p) => n + p.length, 0)); let p = 0; for (const a of all) { out.set(a, p); p += a.length; }
  return out;
}
const colName = (i: number) => String.fromCharCode(65 + i);
/** rows of cells: a string, a number, or {runs:[[text, strike]]} */
function xlsxOf(rows: Array<Array<string | number | { runs: Array<[string, boolean]> } | null>>, deflate = true): Uint8Array {
  const shared: string[] = [];
  const sheetRows = rows.map((r, ri) => `<row r="${ri + 1}">${r.map((c, ci) => {
    if (c === null || c === "") return "";
    const ref = colName(ci) + (ri + 1);
    if (typeof c === "number") return `<c r="${ref}"><v>${c}</v></c>`;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const si = typeof c === "string" ? `<si><t xml:space="preserve">${esc(c)}</t></si>` : `<si>${c.runs.map(([t, s]) => `<r><rPr>${s ? "<strike/>" : ""}<sz val="11"/></rPr><t xml:space="preserve">${esc(t)}</t></r>`).join("")}</si>`;
    shared.push(si); return `<c r="${ref}" t="s"><v>${shared.length - 1}</v></c>`;
  }).join("")}</row>`).join("");
  return zipOf({
    "[Content_Types].xml": "<Types/>", "xl/workbook.xml": '<workbook><sheets><sheet name="BOM" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels": '<Relationships><Relationship Id="rId1" Type="x" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/sharedStrings.xml": `<sst>${shared.join("")}</sst>`, "xl/worksheets/sheet1.xml": `<worksheet><sheetData>${sheetRows}</sheetData></worksheet>`,
  }, deflate);
}
const gridOf = async (bytes: Uint8Array): Promise<Grid> => (await readXlsx(bytes)).sheets[0].rows;

test("xlsx: the same flat BOM reads from a compressed or stored workbook, text kept as text", async () => {
  const table = [FLAT_HEAD, ...FLAT_ROWS].map((l) => l.split("\t"));
  for (const deflate of [true, false]) {
    const g = await gridOf(xlsxOf(table, deflate)), r = buildBom(g, baseOpts);
    assert.equal(r.status, "WRITE_READY"); assert.equal(r.files.filter((f) => f.path.startsWith("BOM/")).length, 8);
    assert.match(byTitle(r.files, "01191").content, /BOM Part Number: 01191/);
  }
  const wb = await readXlsx(xlsxOf([["a", 1.5], ["b"]]));
  assert.equal(wb.sheets[0].rows[0][1].v, "1.5"); assert.equal(wb.sheets[0].name, "BOM");
});

const RL_HEAD = ["0", "1", "2", "Structure", "Number", "Name", "CL1", "CL2", "New Rev", "Manufacturer", "Manufacturer Part Number", "Drawing Location", "Line Number", "Quantity", "Unit"];
test("redline xlsx: unstruck text is current, struck text is the previous value; blank-number rows are alternates", async () => {
  const rows = [RL_HEAD,
    ["0", null, null, "0", "5913538", "BRACKET ASSY", "B", "03", null, null, null, "ECO-0437/Power Station", null, null, null],
    [null, "1", null, "1", { runs: [["06991", true], ["6100148", false]] }, "SUPPORT AW", "A", "02", "x", "CIRCLE AW", "AW 250", null, "8", "4.318", "Meter"],
    [null, null, null, null, null, null, null, null, null, "EATON B-LINE", "AW250", null, null, null, null],
    [null, "1", null, "1", { runs: [["07777", true]] }, "GONE", "A", "01", null, null, null, null, "10", "1", "Piece"],
    [null, "1", null, "1", "6100149", "NUT", "A", "01", null, null, null, null, "11", "2", "Piece"]];
  const g = await gridOf(xlsxOf(rows)), p = parseBom(g);
  assert.equal(p.layout, "redline"); assert.equal(p.usages.length, 2);
  assert.equal(p.usages[0]!.child, "6100148"); assert.equal(p.usages[0]!.prevChild, "06991"); assert.equal(p.usages[0]!.alternates.length, 1);
  assert.ok(p.findings.some((f) => f.code === "LINE_REMOVED" && f.message.includes("07777")));
  const r = buildBom(g, baseOpts), top = byTitle(r.files, "5913538").content;
  assert.match(top, /: OBJ_\d{5}::P_6100148 \{\n\s+attribute line = 8;\n\s+attribute childRevision = "A02";\n\s+attribute quantity = 4\.318;\n\s+attribute unit = "Meter";/);
  assert.match(top, /\[2\]/); assert.match(top, /was 06991 before this release/);
  assert.match(top, /Drawing location: ECO-0437\/Power Station/); assert.match(top, /attribute revision = "B03";/);
  assert.match(byTitle(r.files, "6100148").content, /Manufacturer sources: 1\. CIRCLE AW AW 250; 2\. EATON B-LINE AW250 \(alternate\)/);
});

test("the stored importer fingerprint helper is available to the BOM path", () => { assert.equal(sha256Text("a").length, 64); });

import { scanSysml } from "../../workbench/src/sysml_scan.ts";
test("the Workbench scanner reads a BOM block: usages with pinned revision, quantity and unit as properties", () => {
  const note = byTitle(buildBom(parseDelimited(flatText), baseOpts).files, "01141-002").content;
  const block = /```sysml\n([\s\S]*?)```/.exec(note)![1]!, s = scanSysml(block);
  assert.deepEqual(s.warnings ?? [], []);
  const def = s.defs[0]!; assert.equal(def.name, "P_01141_002"); assert.equal(def.usages.length, 4);
  const wire = def.usages.find((u: any) => u.type?.endsWith("P_01798_006_M"))!;
  assert.deepEqual((wire as any).props.map((p: any) => [p.name, p.value]), [["line", "4"], ["childRevision", "-001"], ["quantity", "0.559"], ["unit", "M"], ["effectiveFrom", "2/Jan/19"]]);
});
