import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { deflateRawSync } from "node:zlib";
import MDSE from "../../core/src/mdse_core.js";
import { CATEGORY_RULES_PATH, DEFAULT_CATEGORY_RULES, renderCategoryRules, parseCategoryRules } from "../src/bom_category.ts";
import { buildBom, parseDelimited, detectLayout, parseBom, bomRevCompare, bomUnit, bomDate } from "../src/bom.ts";
import { bomOwnedHash } from "../../core/src/bom_own.ts";
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
  assert.match(a, /attribute quantity = 0\.559;\n\s+attribute unit = "m";/);              // measured -> quantity + raw unit
  assert.match(a, /attribute unit = "mL";/);                                              // case kept
  assert.doesNotMatch(a, /01141-91 \{|P_01141_91/);                                       // drawing line is not a usage
  assert.doesNotMatch(a, /^(hasPart|references):/m, "relationships are SysML text, not YAML (BOM-025)");
  const dwg = byTitle(r.files, "01141-91").content; assert.match(dwg, /^type: Document$/m); assert.match(dwg, /item def D_01141_91;/);
  assert.match(a, /ref item \w+ : DOC_\d{5}::D_01141_91;/);                              // the drawing is a SysML reference usage
  // leading zeros survive
  assert.match(byTitle(r.files, "01191").content, /BOM Part Number: 01191/);
  assert.equal(r.summary.drawings, 1);
});

test("pinned child revision that is not the child's latest: flagConflict on the parent, older users listed on the child (BOM-011/012)", () => {
  const r = buildBom(parseDelimited(flatText), baseOpts);
  const parent = byTitle(r.files, "04270-001").content, child = byTitle(r.files, "04766").content;
  assert.doesNotMatch(parent, /\[!flag/, "D-0098: no flag; the latest revision is always the one the property shows");
  assert.match(parent, /attribute childRevision = "-C99";/); assert.match(parent, /\*\*Older revision usages\*\*/); assert.match(parent, /pinned at "-B99"/);
  assert.doesNotMatch(child, /older revision|04270-001/, "a child note names no assembly above it (D-0063)");
  assert.match(child, /attribute revision = "-C99";/);                                    // latest wins the properties (BOM-007)
  assert.equal(r.summary.conflicts, 0);
});

test("explicit BOM CURRENT designation selects authoritative revision and consolidates pinned usage", () => {
  const withCurrent = flatText.replace("04766\t-C\t99\tASSY MICROCONTROLLER SMARTGUARD\tbuy\tPRODUCTIONPREPARATION", "04766\t-C\t99\tASSY MICROCONTROLLER SMARTGUARD\tbuy\tCURRENT");
  const r = buildBom(parseDelimited(withCurrent), baseOpts);
  const parent = byTitle(r.files, "04270-001").content;
  assert.match(parent, /^noteReview: \["\[\[Old Revision Usage\]\]"\]$/m);
  assert.match(parent, /\*\*Older revision usages\*\*/);
  assert.doesNotMatch(parent, /\[!flagConflict\] Pins 04766/);
  assert.equal(r.summary.conflicts, 0);
  const index = r.files.find((f) => f.path === "99_System/11_Import/Old Revision Usage.md");
  assert.ok(index);
  assert.match(index.content, /\[\[04270-001\]\]/);
  assert.match(index.content, /04766 pinned "-B99"/);
});

test("the latest revision is the highest by revision order, and the part is imported with the other revisions named (D-0047)", () => {
  const extra = "01653\t-C\t99\tTANK\tbuy\tP\t1\t05274\t-0\t99\tTANK EXP\tbuy\tP\t\t\t\t\t\t1\tea\t01653-C99\n01654\t-C\t99\tTANK2\tbuy\tP\t1\t05274\tA\t01\tTANK EXP\tbuy\tP\t\t\t\t\t\t1\tea\t01654-C99";
  const r = buildBom(parseDelimited(flatText + "\n" + extra), baseOpts);
  const t = byTitle(r.files, "05274").content;
  assert.match(t, /attribute revision = "A01";/);                                           // the placeholder -099 ranks below a real revision
  assert.match(t, /Revisions in the BOM: "-099", "A01"; the latest is "A01"/);
  assert.match(byTitle(r.files, "01653").content, /pinned at "-099"/);       // the assembly that pins the placeholder lists it as an older revision (D-0098)
  assert.ok(r.findings.some((f) => f.code === "REV_SELECTION" && f.message.startsWith("05274")));
  assert.equal(r.summary.skippedParts, 0);
  assert.deepEqual([["-099", "A01"], ["A01", "B02"], ["-V01", "-V02"], ["A02", "A10"], ["Z99", "A01"]].map(([a, b]) => bomRevCompare(a!, b!)), [-1, -1, -1, -1, -1]);
});

test("units are standard, ZST is dropped, dates are YYYY-MM-dd text, states are not written, the description is YAML (D-0047)", () => {
  assert.deepEqual(["ea", "Piece", "Piece (ZST)", "M", "Meter", "Milliliters", "ML", "ZST", "Null", "x", "Furlong"].map((u) => bomUnit(u).unit), ["ea", "ea", "ea", "m", "m", "mL", "mL", "", "", "", "Furlong"]);
  assert.equal(bomUnit("Furlong").known, false);
  assert.deepEqual(["2/Jan/19", "10/Mrz/24", "4/Nov/21", "2024-03-10", "n/a"].map(bomDate), ["2019-01-02", "2024-03-10", "2021-11-04", "2024-03-10", "n/a"]);
  const a = byTitle(buildBom(parseDelimited(flatText), baseOpts).files, "01141-002").content;
  assert.doesNotMatch(a, /lifecycleState|PRODUCTIONPREPARATION/);
  assert.match(a, /^description: CABLE ASSY THERMISTOR 10\.00IN PWRSTN$/m);
  assert.doesNotMatch(a, /effectiveFrom|effectiveTo/, "D-0098: dates are not imported by default");
  assert.match(byTitle(buildBom(parseDelimited(flatText), { ...baseOpts, dates: true }).files, "01141-002").content, /attribute effectiveFrom = "2019-01-02";/, "...but are when asked for");
});

test("a line that appears twice in one assembly keeps the first and flags the other with flagValue (D-0047)", () => {
  const second = FLAT_ROWS[2]!.replace("\t0.559\t", "\t0.700\t");
  const r = buildBom(parseDelimited([FLAT_HEAD, ...FLAT_ROWS, second].join("\n")), baseOpts);
  const a = byTitle(r.files, "01141-002").content;
  assert.match(a, /attribute quantity = 0\.559;/); assert.doesNotMatch(a, /attribute quantity = 0\.7;/);
  assert.match(a, /> \[!flagValue\] Line 4 has two sets of values/); assert.match(a, /quantity 0\.700 m/);
  assert.ok(r.findings.some((f) => f.code === "DUP_LINE" && f.level === "warn"));
  const same = buildBom(parseDelimited([FLAT_HEAD, ...FLAT_ROWS, FLAT_ROWS[2]!].join("\n")), baseOpts);
  assert.ok(!same.findings.some((f) => f.code === "DUP_LINE"), "an identical repeat is dropped silently");
});

test("D-0098: an exact repeat of a line is dropped even when its dates differ; the same child at another revision is history, not a flag", () => {
  const dup = FLAT_ROWS[2]!.replace("2/Jan/19", "5/Mar/20");                                    // same child, revision, quantity, unit: only the date differs
  const r1 = buildBom(parseDelimited([FLAT_HEAD, ...FLAT_ROWS, dup].join("\n")), baseOpts);
  assert.ok(!r1.findings.some((f) => f.code === "DUP_LINE"));
  assert.ok(r1.findings.some((f) => f.code === "DUP_LINE_IDENTICAL" && /^1 repeated line/.test(f.message)));
  assert.doesNotMatch(byTitle(r1.files, "01141-002").content, /\[!flag/);
  // 04270-001 line 1 uses 04766 at -B99 and again at -A99 with other dates; 04766's latest is -C99
  const hist = FLAT_ROWS[5]!.replace("\t-B\t99\t", "\t-A\t99\t").replace("2/Jan/19", "1/Jan/18");
  const r2 = buildBom(parseDelimited([FLAT_HEAD, ...FLAT_ROWS, hist].join("\n")), baseOpts), p = byTitle(r2.files, "04270-001").content;
  assert.ok(!r2.findings.some((f) => f.code === "DUP_LINE")); assert.ok(r2.findings.some((f) => f.code === "DUP_LINE_REVISIONS"));
  assert.doesNotMatch(p, /\[!flag/, "no flag");
  assert.equal(p.match(/attribute childRevision = /g)!.length, 1); assert.match(p, /attribute childRevision = "-C99";/, "the property is the latest revision");
  assert.match(p, /pinned at "-B99"/); assert.match(p, /pinned at "-A99"/);                    // older revisions in use are listed in the assembly's body
  // quantity differing is still a real conflict, and the callout no longer shows dates
  const q = buildBom(parseDelimited([FLAT_HEAD, ...FLAT_ROWS, FLAT_ROWS[2]!.replace("\t0.559\t", "\t0.700\t")].join("\n")), baseOpts);
  assert.match(byTitle(q.files, "01141-002").content, /\[!flagValue\]/); assert.doesNotMatch(byTitle(q.files, "01141-002").content, /, from /);
});

test("blank part number + manufacturer part number is an alternate of the line above, not a part (BOM-003/013)", () => {
  const head = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tManufacturer\tManufacturer Part Number\tAmount\tUnit";
  const rows = ["PC-0\tA\t1\tFRAME\t1\tPC-100\tA\t1\tPLATE\tCIRCLE AW\tAW 250\t2\tea", "PC-0\tA\t1\tFRAME\t\t\t\t\t\tEATON B-LINE\tAW250\t\t", "PC-0\tA\t1\tFRAME\t\t\t\t\t\tOTHER\tX1\t\t"];
  const r = buildBom(parseDelimited([head, ...rows].join("\n")), baseOpts);
  const plate = byTitle(r.files, "PC-100").content, frame = byTitle(r.files, "PC-0").content;
  assert.match(plate, /^manufacturer1: CIRCLE AW$/m); assert.match(plate, /^mfgPn1: AW 250$/m); assert.match(plate, /^manufacturer2: EATON B-LINE$/m); assert.match(plate, /^mfgPn2: AW250$/m); assert.match(plate, /^manufacturer3: OTHER$/m); assert.match(plate, /^mfgPn3: X1$/m);
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
  const sk = p.skipped.find((s) => s.code === "LINE_REMOVED")!; assert.ok(sk, "the struck-out line is kept as a skipped row (D-0059)"); assert.match(sk.cells, /struck: 07777/); assert.match(sk.cells, /GONE/);
  const r = buildBom(g, baseOpts), top = byTitle(r.files, "5913538").content;
  assert.match(top, /: OBJ_\d{5}::P_6100148 \{\n\s+attribute line = 8;\n\s+attribute childRevision = "A02";\n\s+attribute quantity = 4\.318;\n\s+attribute unit = "m";/);
  assert.match(top, /\[2\]/); assert.match(top, /was 06991 before this release/);
  assert.match(top, /Drawing location: ECO-0437\/Power Station/); assert.match(top, /attribute revision = "B03";/);
  assert.match(byTitle(r.files, "6100148").content, /^manufacturer1: CIRCLE AW$/m);
  assert.match(byTitle(r.files, "6100148").content, /dependency from OBJ_\d{5}::P_6100148 to OBJ_\d{5}::P_06991; \/\/ supersedes/);   // the renumbered part says what it replaces, in SysML (BOM-023)
  assert.match(byTitle(r.files, "6100148").content, /^aliases: \["06991"\]$/m);   // D-0068: the replaced number is an alias, so the old number finds the new part
  assert.match(byTitle(r.files, "06991").content, /No BOM lists this part number; it is named as the previous number of 6100148/);   // the old number gets a note, so the reference resolves
});

test("the stored importer fingerprint helper is available to the BOM path", () => { assert.equal(sha256Text("a").length, 64); });

import { scanSysml } from "../../workbench/src/sysml_scan.ts";
test("the Workbench scanner reads a BOM block: usages with pinned revision, quantity and unit as properties", () => {
  const note = byTitle(buildBom(parseDelimited(flatText), { ...baseOpts, dates: true }).files, "01141-002").content;
  const block = /```sysml\n([\s\S]*?)```/.exec(note)![1]!, s = scanSysml(block);
  assert.deepEqual(s.warnings ?? [], []);
  const def = s.defs[0]!; assert.equal(def.name, "P_01141_002"); assert.equal(def.usages.length, 5);   // four parts and the drawing reference
  const wire = def.usages.find((u: any) => u.type?.endsWith("P_01798_006_M"))!;
  assert.deepEqual((wire as any).props.map((p: any) => [p.name, p.value]), [["line", "4"], ["childRevision", "-001"], ["quantity", "0.559"], ["unit", "m"], ["effectiveFrom", "2019-01-02"]]);
});

// The three real redlines that the first version could not read (header below a preamble, level column with no header, "Part Number", "Unit" as the quantity, "UOM").
const cell = (v: string) => ({ v });
const grid = (rows: string[][]): Grid => rows.map((r) => r.map((v) => (v === "" ? null : cell(v))));
test("redline variants: preamble rows, unlabelled level column, Part Number, UOM, Unit as quantity", () => {
  // DVS 400 style: three preamble rows, headers 0..6 + 7, 'Part Number', 'CL 1', 'CL 2', 'Unit' (quantity) and 'Unit Of Measure'
  const dvs = grid([["ConfigSpec"], ["View"], ["Life Cycle State"], [""],
    ["Update Drawing", "0", "1", "2", "", "", "Part Number", "CL 1", "CL 2", "Part Name", "Line Number", "Unit", "Unit Of Measure"],
    ["REV B03", "0", "", "", "", "", "100", "A", "01", "TOP ASSY", "", "", ""],
    ["", "", "1", "", "", "", "200", "A", "01", "SUB ASSY", "1", "2", "Piece"],
    ["", "", "", "2", "", "", "300", "A", "01", "WASHER", "1", "8", "Piece"]]);
  assert.equal(detectLayout(dvs).layout, "redline");
  const a = parseBom(dvs); assert.equal(a.findings.filter((f) => f.level === "error").length, 0);
  assert.deepEqual(a.usages.map((u) => [u.parent, u.child, u.amount, u.unit]), [["100", "200", "2", "Piece"], ["200", "300", "8", "Piece"]]);
  // MVS 800 style: header on row 2, level columns with no header, the structure level just left of Number, 'UOM', misspelt 'Manufacturer Part Nubmer'
  const mvs = grid([[""],
    ["New Rev", "", "", "", "", "", "Number", "CL1", "CL2", "Name", "Line Number", "Find Number", "Quantity", "UOM", "Manufacturer", "Manufacturer Part Nubmer"],
    ["REV D04", "0", "", "", "", "0", "100", "C", "03", "TOP", "", "", "", "", "", ""],
    ["", "", "1", "", "", "1", "    200", "B", "02", "PANEL", "3", "", "1", "Piece", "", ""],
    ["", "", "", "2", "", "2", "        300", "A", "01", "WIRE", "1", "", "29.573", "Milliliters", "ACME", "W-1"]]);
  const b = parseBom(mvs); assert.equal(b.layout, "redline");
  assert.deepEqual(b.usages.map((u) => [u.parent, u.child, u.amount, u.unit, u.ownSrc?.mpn ?? ""]), [["100", "200", "1", "Piece", ""], ["200", "300", "29.573", "Milliliters", "W-1"]]);
  // DVS 330 style: the level columns have no header at all; only 'Structure Level' names the level
  const d3 = grid([["New Rev", "", "", "", "Structure Level", "Number", "CL1", "CL2", "Name", "Line Number", "Quantity", "Unit"],
    ["", "0", "", "", "0", "100", "B", "01", "TOP", "", "", ""], ["", "", "1", "", "1", "200", "B", "01", "SUB", "1", "2", "Piece"]]);
  assert.equal(parseBom(d3).usages.length, 1);
});

test("a second BOM that disagrees with a part already in the vault says so and leaves the note as it is", () => {
  const head = ["New Rev", "0", "1", "Structure Level", "Number", "CL1", "CL2", "Name", "Line Number", "Quantity", "Unit"];
  const g = (qty: string): Grid => grid([head, ["", "0", "", "0", "100", "A", "01", "TOP", "", "", ""], ["", "", "1", "1", "200", "A", "01", "WIRE", "1", qty, "Meter"]]);
  const first = buildBom(g("1.5"), baseOpts); assert.equal(first.status, "WRITE_READY");
  const existing = { hasVault: true, files: new Map(first.files.filter((f) => f.path.endsWith(".md")).map((f) => [f.path, f.content] as [string, string])) };
  const second = buildBom(g("2.5"), { ...baseOpts, existing });
  const f = second.findings.find((x) => x.code === "EXISTING_DIFFERS");
  assert.ok(f, "the disagreement is reported"); assert.match(f!.message, /100 is already in the vault/); assert.match(f!.message, /1\.5 m in the vault, .*2\.5 m here/); assert.match(f!.message, /use "Update an existing vault from a BOM"/, "the message names the way to change the note");
  assert.equal(second.files.filter((x) => x.path.startsWith("BOM/")).length, 0, "nothing is rewritten");
  const same = buildBom(g("1.5"), { ...baseOpts, existing });
  assert.equal(same.findings.some((x) => x.code === "EXISTING_DIFFERS"), false);
});

test("an all-x end marker row is skipped, and a part number is always a quoted string (D-0046)", () => {
  const marker = Array(FLAT_HEAD.split("\t").length).fill("x").join("\t");
  const r = buildBom(parseDelimited([FLAT_HEAD, ...FLAT_ROWS, marker].join("\n")), baseOpts);
  assert.ok(r.findings.some((f) => f.code === "END_MARKER"));
  assert.ok(!r.files.some((f) => /\/x\.md$/.test(f.path)), "no part note named x");
  assert.match(byTitle(r.files, "01191").content, /attribute partNumber = "01191";/);
});

test("an assembly already in the vault is not re-read: no repeat flags, only a comparison when the revision is the same (BOM-026)", () => {
  const first = buildBom(parseDelimited(flatText), baseOpts);
  const existing = { hasVault: true, files: new Map(first.files.filter((f) => f.path.endsWith(".md")).map((f) => [f.path, f.content] as [string, string])) };
  const dup = FLAT_ROWS[2]!.replace("\t0.559\t", "\t0.700\t");
  const again = buildBom(parseDelimited([FLAT_HEAD, ...FLAT_ROWS, dup].join("\n")), { ...baseOpts, existing });
  assert.equal(again.files.filter((f) => f.path.startsWith("BOM/")).length, 0, "nothing new to write");
  assert.ok(!again.findings.some((f) => f.code === "DUP_LINE" || f.code === "QTY_ZERO"), "no per-line findings for notes already in the vault");
  const other = buildBom(parseDelimited([FLAT_HEAD, ...FLAT_ROWS.map((r) => r.replace(/^01141-002\t-N\t99/, "01141-002\t-N\t98"))].join("\n")), { ...baseOpts, existing });
  assert.ok(other.findings.some((f) => f.code === "EXISTING_OTHER_REV" && /Update an existing vault from a BOM/.test(f.message)));
});

test("the findings note lists at most 40 rows per code and counts the rest (BOM-027)", () => {
  const rows = Array.from({ length: 60 }, (_, i) => `ASM-${i}\tA\t01\tASM\tbuy\tP\t1\tP-${i}\tA\t01\tPART\tbuy\tP\t\t\t\t\t\t0\tea\tx`);
  const r = buildBom(parseDelimited([FLAT_HEAD, ...rows].join("\n")), baseOpts);
  const note = r.files.find((f) => f.path.startsWith("99_System/11_Import/BOM Findings"))!.content;
  assert.equal((note.match(/\| QTY_ZERO \|/g) ?? []).length, 41);
  assert.match(note, /and 20 more with this code/);
  assert.equal(r.findings.filter((f) => f.code === "QTY_ZERO").length, 60);
});

test("every BOM note carries an import stamp whose hash covers only what the importer owns (BOM-031)", () => {
  const r = buildBom(parseDelimited(flatText), baseOpts);
  const notes = r.files.filter((f) => f.path.startsWith("BOM/"));
  assert.ok(notes.length > 3);
  for (const f of notes) {
    assert.match(f.content, /^importSource: bom\.tsv$/m); assert.match(f.content, /^importedOn: 2026-10-20$/m);
    const h = /^importHash: ([0-9a-f]{16})$/m.exec(f.content)?.[1]; assert.ok(h, f.path);
    assert.equal(bomOwnedHash(f.content), h, "the stamp is recomputable from the note as written");
    assert.equal(MDSE.validate(f.content, classes).length, 0, f.path);
  }
  const n = notes.find((f) => f.path.endsWith("/01141-002.md"))!.content, h = bomOwnedHash(n);
  // a person's edits to prose, status, tags and a callout do not change the hash ...
  const edited = n.replace("status: Draft", "status: Approved").replace("tags: []", "tags: [reviewed]").replace(/\n\n\n\n## Source: EA/, "\n\nMy own note about this part.\n\n\n\n## Source: EA");
  assert.notEqual(edited, n); assert.equal(bomOwnedHash(edited), h);
  // ... a change to the description, a manufacturer property or the SysML does
  assert.notEqual(bomOwnedHash(n.replace(/^description: .*$/m, "description: Something else")), h);
  assert.notEqual(bomOwnedHash(n.replace("attribute partNumber", "attribute partNumberX")), h);
  // the same BOM imported again stamps the same hash; a different run date changes only importedOn
  const again = buildBom(parseDelimited(flatText), { ...baseOpts, runDate: "2026-11-01T09:00:00" });
  const n2 = again.files.find((f) => f.path.endsWith("/01141-002.md"))!.content;
  assert.match(n2, /^importedOn: 2026-11-01$/m); assert.equal(bomOwnedHash(n2), h);
});

/* ---- BOM-037: one part number at one revision named two ways on the same side ---- */
const nameRow = (p: string, pname: string, line: string, c: string, cname: string, crev = "-A01"): string => [p, "-A", "99", pname, "buy", "X", line, c, crev.slice(0, 2), crev.slice(2), cname, "buy", "X", "", "", "", "", "", "1", "ea", p + "-A99"].join("\t");
const nameOpts = (existing: Map<string, string> | null, update = false) => ({ sourceName: "n.tsv", fingerprint: "a".repeat(64), runDate: "2026-10-23T10:00:00", authorCode: "skellyspencer", classes, existing: existing ? { hasVault: true, files: existing } : null, pending: [] as Array<[string, string]>, ...(update ? { update: true } : {}) });
const nameGrid = (rows: string[]) => parseDelimited([FLAT_HEAD, ...rows].join("\n"));

test("a part number at one revision named two ways as a child keeps the first name and raises NAME_CONFLICT (BOM-037)", () => {
  const r = buildBom(nameGrid([nameRow("A-1", "ASSY A-1", "1", "B-2", "NAME ONE"), nameRow("X-1", "ASSY X-1", "1", "B-2", "NAME TWO"), nameRow("Z-1", "ASSY Z-1", "1", "B-2", "NAME TWO")]), nameOpts(null));
  const f = r.findings.filter((x) => x.code === "NAME_CONFLICT");
  assert.equal(f.length, 1); assert.equal(f[0]!.level, "warn");
  assert.match(f[0]!.message, /^B-2 revision "-A01" is named "NAME ONE" \(row 2\) and also "NAME TWO" \(2 more rows\) as a child; the first name was used/);
  const note = r.files.find((x) => /\/B-2\.md$/.test(x.path))!.content;
  assert.match(note, /^description: NAME ONE$/m); assert.doesNotMatch(note, /NAME TWO/);
});

test("names that differ only in case or spacing, or between the parent and child side, are not a conflict (BOM-037)", () => {
  const r = buildBom(nameGrid([nameRow("A-1", "ASSY A-1", "1", "B-2", "Name  One"), nameRow("X-1", "ASSY X-1", "1", "B-2", "NAME ONE"), nameRow("B-2", "B-2 ASSEMBLY", "1", "C-3", "PART C")]), nameOpts(null));
  assert.deepEqual(r.findings.filter((x) => x.code === "NAME_CONFLICT"), []);
});

test("a part number already in the vault raises no NAME_CONFLICT in an import, but does in an update scan (BOM-037, BOM-026)", () => {
  const rows = [nameRow("A-1", "ASSY A-1", "1", "B-2", "NAME ONE"), nameRow("X-1", "ASSY X-1", "1", "B-2", "NAME TWO")];
  const first = buildBom(nameGrid(rows), nameOpts(null)), vault = new Map(first.files.map((f) => [f.path, f.content] as [string, string]));
  assert.equal(first.findings.filter((x) => x.code === "NAME_CONFLICT").length, 1);
  assert.deepEqual(buildBom(nameGrid(rows), nameOpts(vault)).findings.filter((x) => x.code === "NAME_CONFLICT"), []);
  assert.equal(buildBom(nameGrid(rows), nameOpts(vault, true)).findings.filter((x) => x.code === "NAME_CONFLICT").length, 1);
});

/* ---- BOM-038: lines of an assembly at an older revision are kept, never dropped without a decision ---- */
const earlyRow = (p: string, pr: string, l: string, c: string, q = "1"): string => [p, pr.slice(0, 2), pr.slice(2), "ASSY " + p, "buy", "X", l, c, "-A", "99", "PART " + c, "buy", "X", "", "", "", "2/Jan/19", "", q, "ea", p + pr].join("\t");
const earlyRows = [earlyRow("A-1", "-A01", "1", "B-2"), earlyRow("A-1", "-A01", "2", "C-3", "4"), earlyRow("A-1", "-A01", "3", "D-4"), earlyRow("A-1", "-A02", "1", "B-2", "5"), earlyRow("A-1", "-A02", "2", "E-5")];
const earlyOpts = (extra: object = {}) => ({ sourceName: "e.tsv", fingerprint: "a".repeat(64), runDate: "2026-10-23T10:00:00", authorCode: "skellyspencer", classes, existing: null, pending: [] as Array<[string, string]>, ...extra });

test("lines of an assembly at an older revision are kept in the note body, not in the SysML structure (BOM-038)", () => {
  const r = buildBom(parseDelimited([FLAT_HEAD, ...earlyRows].join("\n")), earlyOpts());
  const note = r.files.find((f) => /\/A-1\.md$/.test(f.path))!.content;
  assert.match(note, /^\*\*Earlier revisions of this assembly\*\*$/m);
  assert.match(note, /^- Revision "-A01", line 2: C-3 \(PART C-3\) at revision "-A99", quantity 4 ea, from 2019-01-02 \(row 3\)$/m);
  assert.equal((note.match(/^- Revision "-A01", line /gm) ?? []).length, 3);
  assert.equal((note.match(/attribute line = /g) ?? []).length, 2, "the SysML block holds only the latest revision's lines");
  assert.equal(MDSE.validate(note, classes).length, 0);
  const f = r.findings.find((x) => x.code === "EARLIER_REV_KEPT")!; assert.equal(f.level, "info"); assert.match(f.message, /^A-1: 3 line\(s\) of earlier revision\(s\) "-A01" are kept/);
  assert.equal(r.findings.some((x) => /DROPPED|NOT_ADDED/.test(x.code)), false);
  const vault = new Map(r.files.map((x) => [x.path, x.content] as [string, string]));
  assert.equal(buildBom(parseDelimited([FLAT_HEAD, ...earlyRows].join("\n")), earlyOpts({ existing: { hasVault: true, files: vault } })).files.filter((x) => x.path.startsWith("BOM/")).length, 0, "a repeat import changes nothing");
});

test("dropping earlier-revision lines is a choice, and it is counted (BOM-038)", () => {
  const r = buildBom(parseDelimited([FLAT_HEAD, ...earlyRows].join("\n")), earlyOpts({ earlierRevisions: "drop" }));
  assert.doesNotMatch(r.files.find((f) => /\/A-1\.md$/.test(f.path))!.content, /Earlier revisions of this assembly\*\*/);
  const f = r.findings.find((x) => x.code === "EARLIER_REV_DROPPED")!; assert.equal(f.level, "warn"); assert.match(f.message, /^A-1: 3 line\(s\) of earlier revision\(s\) "-A01" were skipped, as chosen/);
});

test("an assembly already in the vault gets a warning that its earlier-revision lines were not added, never silence (BOM-038, BOM-026)", () => {
  const first = buildBom(parseDelimited([FLAT_HEAD, earlyRows[3]!, earlyRows[4]!].join("\n")), earlyOpts());
  const vault = new Map(first.files.map((x) => [x.path, x.content] as [string, string]));
  const r = buildBom(parseDelimited([FLAT_HEAD, ...earlyRows].join("\n")), earlyOpts({ existing: { hasVault: true, files: vault } }));
  const f = r.findings.find((x) => x.code === "EARLIER_REV_NOT_ADDED")!; assert.equal(f.level, "warn"); assert.match(f.message, /A-1: the file has 3 line\(s\)/);
});

/* ---- BOM-028: manufacturer data is added from every line that uses the part ---- */
const MFR_HEAD = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tParent Source\tParent State\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tChild Source\tChild State\tSSC\tReference Designator\tCild Notes\tFrom\tTO\tAmount\tUnit\tManufacturer\tManufacturer Part Number";
const mfrRow = (p: string, l: string, c: string, m: string, mpn: string): string => [p, "-A", "99", "ASSY " + p, "buy", "X", l, c, "-A", "99", "PART " + c, "buy", "X", "", "", "", "", "", "1", "ea", m, mpn].join("\t");
const mfrAlt = (p: string, m: string, mpn: string): string => [p, "-A", "99", "ASSY " + p, "buy", "X", "", "", "", "", "", "", "", "", "", "", "", "", "", "", m, mpn].join("\t");

test("manufacturer data from every line that uses a part is added, first line first, exact repeats once (BOM-028, D-0056)", () => {
  const rows = [mfrRow("A-1", "1", "B-2", "ACME", "ACM-1"), mfrAlt("A-1", "ALPHA", "ALP-1"), mfrRow("X-1", "1", "B-2", "BETA", "BET-9"), mfrAlt("X-1", "GAMMA", "GAM-7"), mfrRow("Z-1", "1", "B-2", "acme", "acm-1")];
  const r = buildBom(parseDelimited([MFR_HEAD, ...rows].join("\n")), { sourceName: "m.tsv", fingerprint: "a".repeat(64), runDate: "2026-10-23T10:00:00", authorCode: "skellyspencer", classes, existing: null, pending: [] as Array<[string, string]> });
  const note = r.files.find((f) => /\/B-2\.md$/.test(f.path))!.content;
  const got = note.split("\n").filter((l) => /^(manufacturer|mfgPn)\d+:/.test(l));
  assert.deepEqual(got, ["manufacturer1: ACME", "mfgPn1: ACM-1", "manufacturer2: ALPHA", "mfgPn2: ALP-1", "manufacturer3: BETA", "mfgPn3: BET-9", "manufacturer4: GAMMA", "mfgPn4: GAM-7"]);
  assert.equal(MDSE.validate(note, classes).length, 0);
});

test("rows that are skipped keep their content in the findings note, not capped at 40 (D-0059)", () => {
  const rows = Array.from({ length: 50 }, (_, i) => `\tA\t01\tORPHAN-NAME-${i}\tbuy\tP\t1\tP-${i}\tA\t01\tPART ${i}\tbuy\tP\t\t\t\t\t\t2\tea\tx`);
  const r = buildBom(parseDelimited([FLAT_HEAD, ...FLAT_ROWS, ...rows].join("\n")), baseOpts);
  const note = r.files.find((f) => f.path.startsWith("99_System/11_Import/BOM Findings"))!.content;
  assert.match(note, /## Skipped rows/); assert.equal((note.match(/\| ROW_NO_PARENT \| [^|\n]*Parent Part Name: ORPHAN-NAME-\d+/g) ?? []).length, 50, "every skipped row is listed with its content");
  assert.match(note, /Child Part Number: P-49/);
  const clean = buildBom(parseDelimited([FLAT_HEAD, ...FLAT_ROWS].join("\n")), baseOpts);
  assert.doesNotMatch(clean.files.find((f) => f.path.startsWith("99_System/11_Import/BOM Findings"))!.content, /Skipped rows/);
});

test("a row on line 1xx beside line xx is an alternate of that line, not a usage (BOM-003, D-0064)", () => {
  const row = (line: string, child: string, q: string, parent = "ASM-1") => `${parent}\tA\t01\tASM\tbuy\tP\t${line}\t${child}\tA\t01\tNAME ${child}\tbuy\tP\t\t\t\t\t\t${q}\tea\tx`;
  const rows = [row("1", "P-1", "2"), row("2", "P-2", "1"), row("101", "P-1ALT", "2"), row("150", "P-150", "1"), row("1", "P-9", "1", "ASM-2"), row("101", "P-9ALT", "1", "ASM-2")];
  const r = buildBom(parseDelimited([FLAT_HEAD, ...rows].join("\n")), baseOpts), asm = byTitle(r.files, "ASM-1").content;
  assert.equal(r.findings.filter((f) => f.code === "ALT_BY_LINE").length, 2, "one finding per folded row");
  assert.match(asm, /Alternates for line 1 \(P-1\): part P-1ALT.*quantity 2 ea, line 101, row 4/);
  assert.doesNotMatch(asm, /P_1ALT|partP1ALT/, "the alternate is not a usage");
  assert.match(asm, /P_150/, "line 150 has no line 50, so it stays a usage");
  assert.equal(r.summary.alternates, 2); assert.ok(!r.files.some((f) => /P-1ALT/.test(f.path)), "no note is created for an alternate-only part");
});

test("a part is sorted into a folder by description words, child lines and make or buy, and carries bomCategory and bomRole (D-0072)", () => {
  const H = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tParent Source\tParent State\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tChild Source\tChild State\tSSC\tReference Designator\tCild Notes\tFrom\tTO\tAmount\tUnit\tParentCL1CL2";
  const row = (p: string, pn: string, l: string, c: string, cn: string, cs: string): string => [p, "-A", "01", pn, "make", "PRODUCTION", l, c, "-A", "01", cn, cs, "PRODUCTION", "", "", "", "", "", "1", "ea", p + "-A01"].join("\t");
  const g = parseDelimited([H, row("TOP-1", "CHARGER ASSY", "1", "CAB-1", "CABLE ASSY 3M", "make"), row("TOP-1", "CHARGER ASSY", "2", "SCR-1", "SCREW M4", "buy"), row("CAB-1", "CABLE ASSY 3M", "1", "ODD-1", "THINGAMAJIG", "")].join("\n"));
  const r = buildBom(g, baseOpts), f = (pn: string) => r.files.find((x) => x.path.endsWith(`/${pn}.md`))!;
  assert.equal(f("TOP-1").path, "BOM/Parts/Chargers and systems/Assemblies/make/TOP-1.md");
  assert.equal(f("CAB-1").path, "BOM/Parts/Cables and harnesses/Assemblies/make/CAB-1.md");
  assert.equal(f("SCR-1").path, "BOM/Parts/Fasteners/Parts/buy/SCR-1.md");
  assert.equal(f("ODD-1").path, "BOM/Parts/Uncategorized/Parts/other/ODD-1.md");
  assert.match(f("TOP-1").content, /^bomCategory: Chargers and systems\nbomRole: final$/m);
  assert.match(f("CAB-1").content, /^bomRole: sub$/m); assert.match(f("SCR-1").content, /^bomRole: part$/m);
  assert.ok(r.findings.some((x) => x.code === "CATEGORIES" && /Uncategorized 1/.test(x.message)));
});

test("the vault's own category list sorts the parts; a bad list is ignored with a warning (D-0076)", () => {
  const H = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tParent Source\tParent State\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tChild Source\tChild State\tSSC\tReference Designator\tCild Notes\tFrom\tTO\tAmount\tUnit\tParent Rev";
  const row = (p: string, pn: string, l: string, c: string, cn: string): string => [p, "-A", "01", pn, "make", "PRODUCTION", l, c, "-A", "01", cn, "buy", "PRODUCTION", "", "", "", "", "", "1", "ea", p + "-A01"].join("\t");
  const g = parseDelimited([H, row("TOP-1", "CHARGER ASSY", "1", "GRM-1", "GIZMO WIDGET")].join("\n"));
  const find = (r: { files: Array<{ path: string }> }, pn: string): string => r.files.find((x) => x.path.endsWith(`/${pn}.md`))!.path;
  const rt = parseCategoryRules(renderCategoryRules());
  assert.deepEqual(rt.rules, DEFAULT_CATEGORY_RULES.map((r) => ({ category: r.category, words: r.words })), "the shipped file reads back to the built-in table");
  const vault = (text: string) => ({ ...baseOpts, existing: { hasVault: true, files: new Map([[CATEGORY_RULES_PATH, text]]) } });
  assert.equal(find(buildBom(g, baseOpts), "GRM-1"), "BOM/Parts/Uncategorized/Parts/buy/GRM-1.md");
  const own = buildBom(g, vault(renderCategoryRules([{ category: "Widgets", words: ["WIDGET"] }, ...DEFAULT_CATEGORY_RULES])));
  assert.equal(find(own, "GRM-1"), "BOM/Parts/Widgets/Parts/buy/GRM-1.md");
  assert.match(own.files.find((x) => x.path.endsWith("/GRM-1.md"))!.content, /^bomCategory: Widgets$/m);
  const bad = buildBom(g, vault("# x\n- Widgets: WIDGET\n- Bad/Name: FOO\n- Empty: \n"));
  assert.equal(find(bad, "GRM-1"), "BOM/Parts/Uncategorized/Parts/buy/GRM-1.md", "one bad line and none of the file is used");
  assert.ok(bad.findings.some((x) => x.code === "CATEGORY_RULES_BAD" && x.level === "warn" && /Bad\/Name/.test(x.message)));
  assert.equal(parseCategoryRules("nothing here").rules, null);
  assert.ok(parseCategoryRules("- Uncategorized: FOO").problems.length === 1 && parseCategoryRules("- Parts: A").rules === null, "words need two characters");
});
