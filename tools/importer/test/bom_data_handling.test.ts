/* D-0172: BOM import data handling. Effectivity and the active pin (BOM-045), document lines (BOM-069), struck cells (BOM-015),
 * standard values (BOM-070), make or buy (BOM-061), revision marks (BOM-071), ECO per part (BOM-072), prototypes (BOM-064),
 * CL1 -0 (BOM-073) and Z revisions (BOM-018). Every part number, name and ECO number here is made up (DAT-002). */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildBom, parseDelimited, parseBom } from "../src/bom.ts";
import { scanBomUpdate } from "../src/bom_update.ts";
import { bomDocType, bomNumberText, bomMpnText, bomMfrSpellings } from "../src/bom_docs.ts";
import { xlsxOf, gridOf } from "./xlsx_fixture.ts";
import { ROOT } from "./harness.ts";

const classes = JSON.parse(readFileSync(ROOT + "tools/core/src/classes.json", "utf8"));
const HEAD = ["Parent Part Number", "Parent CL1", "Parent CL2", "Parent Part Name", "Parent Source", "Parent State", "Linenumber", "Child Part Number", "Child CL1", "Child CL2", "Child Name", "Child Source", "Child State", "SSC", "Reference Designator", "Cild Notes", "From", "TO", "Amount", "Unit", "ParentCL1CL2", "Manufacturer", "Manufacturer Part Number"].join("\t");
type R = { p: string; pc1?: string; pc2?: string; pn?: string; ps?: string; line: string; c: string; cc1?: string; cc2?: string; cn?: string; cs?: string; from?: string; to?: string; q?: string; u?: string; mfr?: string; mpn?: string };
const row = (r: R): string => [r.p, r.pc1 ?? "A", r.pc2 ?? "01", r.pn ?? "ASSY " + r.p, r.ps ?? "make", "X", r.line, r.c, r.cc1 ?? "A", r.cc2 ?? "01", r.cn ?? "PART " + r.c, r.cs ?? "buy", "X", "", "", "", r.from ?? "", r.to ?? "", r.q ?? "1", r.u ?? "ea", "x", r.mfr ?? "", r.mpn ?? ""].join("\t");
const flat = (rows: R[]): string => [HEAD, ...rows.map(row)].join("\n");
const opts = (extra: object = {}) => ({ sourceName: "bom.tsv", fingerprint: "a".repeat(64), runDate: "2026-11-26T10:00:00", authorCode: "skellyspencer", classes, existing: null, pending: [] as Array<[string, string]>, revisionNotes: true, ...extra });
const run = (rows: R[], extra: object = {}) => buildBom(parseDelimited(flat(rows)), opts(extra) as never);
const note = (r: { files: Array<{ path: string; content: string }> }, name: string): string => r.files.find((f) => f.path.split("/").pop() === name + ".md")?.content ?? "";
const code = (r: { findings: Array<{ code: string; message: string }> }, c: string) => r.findings.find((f) => f.code === c);

// ---- BOM-045: dates and the active pin ---------------------------------------------------------------------------------
test("a line repeated per child revision is pinned to the revision in effect; the others are its history, with dates (BOM-045)", () => {
  const r = run([
    { p: "TOP-1", line: "10", c: "KID-1", cc1: "A", cc2: "01", from: "1/Jan/20", to: "31/Dec/20" },
    { p: "TOP-1", line: "10", c: "KID-1", cc1: "B", cc2: "02", from: "1/Jan/21", to: "" },
    { p: "TOP-1", line: "10", c: "KID-1", cc1: "C", cc2: "03" },   // not yet in effect: no dates
  ]);
  const top = note(r, "TOP-1 A");
  assert.match(top, /part \w+ : \w+::P_KID_1_B \{/, "typed by the revision in effect, not the first row and not the pending one");
  assert.match(top, /attribute childRevision = "B02";/); assert.match(top, /attribute effectiveFrom = "2021-01-01";/);
  assert.equal((top.match(/^\s+part \w+ : /gm) ?? []).length, 1, "one usage for the line");
  assert.match(top, /\*\*Child revision history\*\*/); assert.match(top, /pin "B02" \(from 2021-01-01\); also "A01" \(from 2020-01-01 to 2020-12-31\)[^\n]*"C03"/);
  assert.ok(note(r, "KID-1 A") && note(r, "KID-1 B") && note(r, "KID-1 C"), "every revision keeps its note");
  assert.ok(code(r, "REV_PENDING"), "the higher revision with no dates is counted");
  assert.ok(!code(r, "DUP_LINE"), "revision history is not a conflict");
});

test("several rows in effect take the highest; none in effect takes the highest; both are reported (BOM-045)", () => {
  const several = run([{ p: "TOP-2", line: "1", c: "K2", cc1: "A", from: "1/Jan/20" }, { p: "TOP-2", line: "1", c: "K2", cc1: "B", cc2: "02", from: "1/Jun/20" }]);
  assert.match(note(several, "TOP-2 A"), /::P_K2_B \{/); assert.ok(code(several, "PIN_SEVERAL_OPEN"));
  const none = run([{ p: "TOP-3", line: "1", c: "K3", cc1: "B", cc2: "02", from: "1/Jan/20", to: "1/Feb/20" }, { p: "TOP-3", line: "1", c: "K3", cc1: "A", from: "1/Jan/19", to: "31/Dec/19" }]);
  assert.match(note(none, "TOP-3 A"), /::P_K3_B \{/); assert.ok(code(none, "PIN_NONE_OPEN"));
  assert.doesNotMatch(note(run([{ p: "TOP-4", line: "1", c: "K4", from: "1/Jan/20" }], { dates: false }), "TOP-4 A"), /effectiveFrom/, "dates: false leaves them out");
});

// ---- BOM-069: documents --------------------------------------------------------------------------------------------------
test("document lines: a document word, or a document suffix with quantity zero or ZST; software stays a part (BOM-069)", () => {
  assert.deepEqual(bomDocType("WIRE LIST MAIN", "70001", "1", false), { type: "WL", suffixCheck: false });
  assert.deepEqual(bomDocType("PACKING INSTR TOP", "70002", "0", false).type, "WI");
  assert.deepEqual(bomDocType("SOFTWARE CONTROL BOARD", "70003-11", "0", true), { type: null, suffixCheck: false });
  assert.deepEqual(bomDocType("CABLE ASSY", "70004-91", "0", false), { type: "DWG", suffixCheck: false });
  assert.deepEqual(bomDocType("CABLE ASSY", "70004-91", "2", false), { type: null, suffixCheck: true });
  assert.deepEqual(bomDocType("BRACKET", "70005-30", "1", true).type, "SCH", "ZST with a suffix is a document");
  const r = run([
    { p: "TOP-5", line: "1", c: "70010-30", cn: "SCH POWER BOARD", q: "0" },
    { p: "TOP-5", line: "2", c: "70011", cn: "PROCEDURE END OF LINE TEST", q: "0" },
    { p: "TOP-5", line: "3", c: "70012-60", cn: "LABEL WARNING", q: "1" },
    { p: "TOP-5", line: "4", c: "70013-60", cn: "DWG PANEL", q: "1" },
  ]);
  const sch = r.files.find((f) => f.path.endsWith("/70010-30.md"))!;
  assert.equal(sch.path, "BOM/Documents/SCH/70010-30.md"); assert.match(sch.content, /^type: Document$/m); assert.match(sch.content, /^docType: SCH$/m);
  assert.ok(r.files.some((f) => f.path === "BOM/Documents/WI/70011.md"));
  assert.ok(r.files.some((f) => f.path === "BOM/Drawings/70013-60.md"), "a drawing with quantity 1 is still a document");
  assert.ok(r.files.some((f) => f.path.startsWith("BOM/Parts/") && f.path.endsWith("/70012-60.md")), "a label with a drawing suffix and a quantity stays a part");
  assert.match(code(r, "DOC_SUFFIX_CHECK")!.message, /70012-60/);
  const top = note(r, "TOP-5 A");
  assert.equal((top.match(/^\s+ref item /gm) ?? []).length, 3); assert.equal((top.match(/^\s+part \w+ : /gm) ?? []).length, 1);
  assert.ok(!r.findings.some((f) => f.code === "QTY_ZERO"), "document lines raise no QTY_ZERO");
});

// ---- BOM-070: standard values --------------------------------------------------------------------------------------------
test("standard values: thousands separators, manufacturer spellings, extra spaces, or-equivalent part numbers (BOM-070)", () => {
  assert.equal(bomNumberText("1,000"), "1000"); assert.equal(bomNumberText("12,500.25"), "12500.25"); assert.equal(bomNumberText("1,5"), "1,5", "a decimal comma is not a thousands separator");
  assert.deepEqual(bomMpnText("AB-12 OR EQUIVALENT"), { mpn: "AB-12", equivalent: true }); assert.deepEqual(bomMpnText("AB-12"), { mpn: "AB-12", equivalent: false });
  assert.equal(bomMfrSpellings(["ACME PARTS", "Acme  Parts", "ACME PARTS"]).get("acmeparts")!.use, "ACME PARTS");
  const r = run([
    { p: "TOP-6", line: "1,000", c: "P-61", cn: "SCREW  M4   PAN", mfr: "ACME PARTS", mpn: "S-4 OR EQUIVALENT" },
    { p: "TOP-6", line: "1,010", c: "P-62", mfr: "Acme Parts", mpn: "N-4" },
    { p: "TOP-6", line: "1,020", c: "P-63", mfr: "ACME PARTS", mpn: "W-4" },
  ]);
  const top = note(r, "TOP-6 A"), p61 = note(r, "P-61 A");
  assert.match(top, /attribute line = 1000;/); assert.doesNotMatch(top, /1,000/);
  assert.match(p61, /^description: SCREW M4 PAN$/m);
  assert.match(p61, /^mfgPn1: S-4$/m); assert.match(p61, /An equivalent is accepted for ACME PARTS S-4/);
  assert.match(note(r, "P-62 A"), /^manufacturer1: ACME PARTS$/m, "the spelling used most is written");
  assert.match(code(r, "MFR_SPELLING")!.message, /"Acme Parts" 1/);
  assert.match(code(r, "STANDARD_VALUES")!.message, /3 number\(s\)[^;]*1 name\(s\)[^;]*1 manufacturer/);
  const v = run([{ p: "TOP-7", line: "1", c: "P-71", cc1: "-F", cc2: "01" }, { p: "TOP-8", line: "1", c: "P-71", cc1: "F", cc2: "01" }]);
  assert.match(code(v, "REV_LABEL_VARIANT")!.message, /P-71: "-F01" and "F01"/);
});

// ---- BOM-061: make or buy ------------------------------------------------------------------------------------------------
test("make or buy follows the first source that gives one; none without a value; a different value is an unticked change (BOM-061)", () => {
  const r = run([{ p: "TOP-9", line: "1", c: "P-91", cs: "null" }, { p: "TOP-9", line: "2", c: "P-92", cs: "" }, { p: "TOP-9", line: "3", c: "P-93", cs: "buy" }]);
  assert.doesNotMatch(note(r, "P-91"), /^makeBuy:/m); assert.doesNotMatch(note(r, "P-92"), /^makeBuy:/m); assert.match(note(r, "P-93"), /^makeBuy: buy$/m);
  assert.ok(!code(r, "MAKEBUY_OTHER"), "null and blank are not other");
  const vault = new Map(r.files.filter((f) => f.path.startsWith("BOM/")).map((f) => [f.path, f.content]));
  const s = scanBomUpdate(parseDelimited(flat([{ p: "TOP-9", line: "1", c: "P-91", cs: "make" }, { p: "TOP-9", line: "2", c: "P-92", cs: "" }, { p: "TOP-9", line: "3", c: "P-93", cs: "make" }])), { ...opts(), existing: { hasVault: true, files: vault, allPaths: new Set(vault.keys()) }, sourceName: "bom2.tsv", runDate: "2026-11-27T10:00:00" } as never);
  const mb = s.items.filter((i) => i.key === "makeBuy");
  assert.deepEqual(mb.map((i) => [i.pn, i.kind, i.after]).sort(), [["P-91", "add", "make"], ["P-93", "change", "make"]]);
});

// ---- redlines: struck cells, empty rows, marks, ECO ------------------------------------------------------------------------
const RL = ["0", "1", "2", "Structure", "Number", "Name", "CL1", "CL2", "New Rev", "Manufacturer", "Manufacturer Part Number", "Drawing Location", "Line Number", "Quantity", "Unit", "Category"];
test("redline: struck text is never current, a struck alternate is removed, a level-only row is empty, marks and ECO numbers are kept (BOM-015, BOM-071, BOM-072)", async () => {
  const rows = [RL,
    ["0", null, null, "0", "80000", "TOP UNIT", "B", "02", "REV B02", null, null, "ECO-9001/Unit", null, null, null, null],
    [null, "1", null, "1", "80001", "BRACKET MOUNT", "C", "03", "REV C04", "MAKER ONE", "M1-1", "ECO-9001/Unit", "10", "1", "Piece", { runs: [["Adhesive", true]] }],
    [null, null, null, null, null, null, null, null, null, { runs: [["OLD MAKER", true]] }, { runs: [["OM-1", true]] }, null, null, null, null, null],
    [null, "1", null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, "1", null, "1", "80002", "NUT M4", "A", "01", null, { runs: [["GONE INC", true], ["NEW INC", false]] }, "N-4", null, "1,000", "2", "Piece", "Nut"]];
  const g = await gridOf(xlsxOf(rows)), p = parseBom(g);
  assert.equal(p.usages[0]!.alternates.length, 0, "a struck alternate is not attached");
  assert.equal(p.usages[0]!.childCategory, "", "a struck category is not the category"); assert.equal(p.usages[1]!.ownSrc!.mfr, "NEW INC");
  assert.ok(p.findings.some((f) => f.code === "ALT_REMOVED")); assert.ok(p.skipped.some((s) => s.code === "EMPTY_ROW")); assert.ok(!p.findings.some((f) => f.code === "ALT_NO_PRIMARY"));
  assert.equal(p.usages[1]!.line, "1000");
  const r = buildBom(g, opts() as never), bracket = note(r, "80001 C"), top = note(r, "80000 B");
  assert.doesNotMatch(note(r, "80001"), /^bomCategory: Adhesive$/m);
  assert.match(bracket, /^noteReview: \["\[\[BOM Revision Marks\]\]"\]$/m); assert.match(bracket, /^bomEco: \["ECO-9001"\]$/m);
  assert.match(top, /^bomEco: \["ECO-9001"\]$/m); assert.doesNotMatch(top, /drawingLocation/);
  const marks = r.files.find((f) => f.path === "99_System/11_Import/BOM Revision Marks.md")!.content;
  assert.match(marks, /\[\[80001 C\]\] row 3: marked "REV C04", revision read "C03", differs/); assert.match(marks, /\[\[80000 B\]\] row 2: marked "REV B02", revision read "B02", agrees/);
  assert.equal(code(r, "REV_MARKS")!.message.startsWith("2 line(s)"), true);
});

// ---- BOM-064, BOM-073, BOM-018 ---------------------------------------------------------------------------------------------
test("prototypes are CL1 #: one PROTO note, ranked below released revisions, reported on production lines (BOM-064)", () => {
  const r = run([
    { p: "TOP-P", line: "1", c: "PR-1", cc1: "#", cc2: "01", from: "1/Jan/24" },
    { p: "TOP-P", line: "2", c: "PR-2", cc1: "#", cc2: "02", from: "1/Jan/24", to: "1/Jun/24" },
    { p: "TOP-P", line: "2", c: "PR-2", cc1: "A", cc2: "03", from: "2/Jun/24" },
    { p: "OLD-P", line: "1", c: "PR-2", cc1: "#", cc2: "01" },
  ]);
  const proto = note(r, "PR-1 PROTO");
  assert.ok(proto, "the prototype revisions of a part share a note named <PN> PROTO"); assert.match(proto, /part def P_PR_1_PROTO :> /);
  assert.match(note(r, "TOP-P A"), /::P_PR_2_A \{/, "the released revision is the pin");
  assert.match(code(r, "PROTO_IN_PRODUCTION")!.message, /PR-1 "#01" \(no released revision\)/);
  assert.match(code(r, "PROTO_ONLY")!.message, /PR-1/); assert.doesNotMatch(code(r, "PROTO_ONLY")!.message, /PR-2/);
  assert.ok(!r.findings.some((f) => f.code === "REV_SCHEME" && /#/.test(f.message)), "a prototype is not checked against the released scheme");
});

test("CL1 -0 is not a revision: no note, pins the part number, a -0 assembly's lines are its part number note's structure (BOM-073)", () => {
  const r = run([
    { p: "OLD-ASM", pc1: "-0", pc2: "01", line: "1", c: "OLD-KID", cc1: "-0", cc2: "99" },
    { p: "NEW-ASM", line: "1", c: "OLD-ASM", cc1: "-0", cc2: "01" },
    { p: "NEW-ASM", line: "2", c: "MIX-1", cc1: "-0", cc2: "01" },
    { p: "NEW-ASM2", line: "1", c: "MIX-1", cc1: "A", cc2: "02" },
  ]);
  assert.equal(note(r, "OLD-ASM -0"), ""); assert.equal(note(r, "OLD-KID -0"), "");
  assert.match(note(r, "NEW-ASM A"), /part \w+ : \w+::P_OLD_ASM \{\n\s+attribute line = 1;\n\s+attribute childRevision = "-001";/);
  const old = note(r, "OLD-ASM");
  assert.match(old, /part \w+ : \w+::P_OLD_KID \{/, "the -0 assembly keeps its structure"); assert.match(old, /CL1 -0 is not a revision/); assert.match(old, /^description: ASSY OLD-ASM$/m);
  assert.match(code(r, "REV_DASH0")!.message, /^3 part number\(s\)[^]*1 of them also have another revision: MIX-1 \(-0 as "-001"; also "A02"\)/);
  assert.ok(!r.findings.some((f) => f.code === "REV_SCHEME" && /-001|-099/.test(f.message)));
});

test("Z99 marks a migrated part; any other Z revision is reported for checking (BOM-018)", () => {
  const r = run([{ p: "TOP-Z", line: "1", c: "100001", cc1: "Z", cc2: "99" }, { p: "TOP-Z", line: "2", c: "100002", cc1: "Z", cc2: "01" }, { p: "TOP-Z2", line: "1", c: "100002", cc1: "Z", cc2: "02" }]);
  const z = code(r, "REV_Z_CHECK")!;
  assert.match(z.message, /^1 part number/); assert.match(z.message, /100002: "Z01", "Z02"/); assert.doesNotMatch(z.message, /100001/);
});
