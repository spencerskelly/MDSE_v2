import test from "node:test";
import assert from "node:assert/strict";
import { parseDelimited } from "../src/bom.ts";
import { scanRevisionUpdate, applyRevisionUpdate } from "../src/bom_update.ts";
import { parseSales, salesProps, salesKeys, salesIsPart } from "../src/sales.ts";

/* Synthetic ledger (DAT-002): invented part numbers, customers and amounts. */
const HEAD = "Account,Subsidiary,Document Number,Date,Posting Period Name,Name,Description,Quantity,Item Rate,Amount,Currency,Customer External ID,Customer Companyname,Class";
const row = (acct: string, period: string, name: string, qty: string, amt: string, cur = "USD"): string =>
  `${acct},Top : Inc,IN1,2025-01-05,${period},${name},"desc, with comma",${qty},0,${amt},${cur},C_1,ACME TEST CUSTOMER,IPC : MHE`;
const ledger = (rows: string[]): string => [HEAD, ...rows].join("\n");
const A = "40100 Sales revenue finished goods", S = "40200 Sales revenue semi-finished goods", I = "40101 Sales revenue finished goods - ICO";

test("units and price over the whole file; returns net against units", () => {
  const t = parseSales(parseDelimited(ledger([
    row(A, "Jan 2025", "5910001A", "10", "10000"), row(A, "Jun 2025", "5910001A", "10", "11000"), row(A, "Dec 2025", "5910001A", "-2", "-2000"),
    row(S, "Dec 2026", "07802-0", "50", "25"),
  ])));
  assert.equal(t.months, 24); assert.equal(t.firstPeriod, "2025-01"); assert.equal(t.lastPeriod, "2026-12");
  const p = salesProps(t.items.get("5910001A")!, t.months);
  assert.equal(t.items.get("5910001A")!.netUnits, 18);
  assert.equal(p.avgSalePrice, 1055.56);          // 19000 / 18 units
  assert.equal(p.annualVolume, 9);                // 18 units over 24 months
  assert.equal(salesProps(t.items.get("07802-0")!, t.months).avgSalePrice, 0.5);
});

test("charge lines, other accounts, intercompany and non-USD are handled and reported", () => {
  const t = parseSales(parseDelimited(ledger([
    row(A, "Jan 2025", "Warranty Discount", "1", "-5"), row(A, "Jan 2025", "Freight Cost", "1", "40"),
    row("32000 Opening Balance", "Jan 2025", "Opening Balance Item AR", "-1", "-9"),
    row("12010 Inventory : Raw Materials", "Jan 2025", "11674-0", "100", "100"),
    row(I, "Jan 2025", "5910002A", "4", "400"),
    row(A, "Jan 2025", "5910003A", "2", "300000", "JPY"), row(A, "Jan 2025", "5910003A", "2", "400"),
  ])));
  assert.deepEqual(t.nonPart, ["Freight Cost", "Warranty Discount"]);
  assert.equal(t.items.has("11674-0"), false);                       // an inventory account is not a sale
  const ico = t.items.get("5910002A")!; assert.equal(ico.netUnits, 0); assert.equal(ico.intercompanyLines, 1);   // listed, not counted
  const j = t.items.get("5910003A")!; assert.equal(j.netUnits, 4); assert.equal(salesProps(j, t.months).avgSalePrice, 200);   // USD line only
  assert.deepEqual(t.findings.map((f) => f.code).sort(), ["SALES_CURRENCY", "SALES_INTERCOMPANY"]);
});

test("price is null when net units are zero or negative", () => {
  const t = parseSales(parseDelimited(ledger([row(A, "Jan 2025", "5910004A", "1", "100"), row(A, "Feb 2025", "5910004A", "-1", "-100")])));
  assert.equal(salesProps(t.items.get("5910004A")!, t.months).avgSalePrice, null);
});

test("no customer data reaches a result", () => {
  const t = parseSales(parseDelimited(ledger([row(A, "Jan 2025", "5910005A", "1", "10")])));
  const all = JSON.stringify([[...t.items.values()], t.nonPart, t.findings]);
  assert.equal(all.includes("ACME"), false); assert.equal(all.includes("C_1"), false); assert.equal(all.includes("desc"), false);
});

test("a missing column stops the read with one error", () => {
  const t = parseSales(parseDelimited("Account,Name,Quantity\n40100,5910001A,1"));
  assert.equal(t.items.size, 0); assert.equal(t.findings[0]!.code, "SALES_COLUMNS");
});

test("item name to part number candidates, and what counts as a part", () => {
  assert.deepEqual(salesKeys("5910560A"), ["5910560A", "5910560"]);
  assert.deepEqual(salesKeys("07802-0"), ["07802-0", "07802"]);
  assert.deepEqual(salesKeys("09525-002-G"), ["09525-002-G", "09525-002"]);
  assert.deepEqual(salesKeys("01141-002"), ["01141-002"]);
  assert.equal(salesIsPart("5910560A"), true); assert.equal(salesIsPart("Bank Fees"), false); assert.equal(salesIsPart("Subscription"), false);
});

import { productFamilyOf, salesRoleOf, salesCategoryOf } from "../src/sales_role.ts";

test("product family: kit first, then BMID, then charger (synthetic descriptions)", () => {
  assert.equal(productFamilyOf("KIT FLOOR STAND PROCORE EDGE"), "Kit");
  assert.equal(productFamilyOf("PC EDGE9kW 3B 480V"), "Charger");
  assert.equal(productFamilyOf("DVS330 380V EPO IP55"), "Charger");
  assert.equal(productFamilyOf("MVS-800 POWER SERVER"), "Charger");
  assert.equal(productFamilyOf("PWR STN ADK"), "Charger");
  assert.equal(productFamilyOf("CAN BMID WEBASTO"), "BMID");
  assert.equal(productFamilyOf("POSIGUARD GATEWAY"), "BMID");
  assert.equal(productFamilyOf("KIT POSIGUARD BMID WITH LORA COMM"), "BMID");        // the word after KIT is a family word: the kit is the product
  assert.equal(productFamilyOf("KIT TEMP SENSOR POSIGUARD"), "Kit");
  assert.equal(productFamilyOf("KIT DONGLE BMID III-B USB CBL"), "Kit");
  assert.equal(productFamilyOf("KIT PRGM PCBA CONT III MVS"), "Kit");
  assert.equal(productFamilyOf("CBL ASY 4_0 A320 TO A320"), null);
  assert.equal(productFamilyOf("CABLE ASSY PWR GSE"), "Charger");   // why the family is only applied to sold top-level parts
});

test("sales role: product, spare, PIA, none", () => {
  const base = { sold: true, inBom: true, hasParent: false, description: "PC EDGE9kW 3B" };
  assert.equal(salesRoleOf(base), "product");
  assert.equal(salesRoleOf({ ...base, description: "KIT PEDESTAL FLOOR STAND" }), "product");          // a kit in no BOM as a child is a product
  assert.equal(salesRoleOf({ ...base, hasParent: true, description: "KIT PEDESTAL" }), "spare");       // a kit used in an assembly is not
  assert.equal(salesRoleOf({ ...base, description: "CBL ASY 4_0 A320 TO A320" }), "spare");            // sold top-level, no family
  assert.equal(salesRoleOf({ ...base, inBom: false, description: "" }), "spare");                      // sold, in no BOM
  assert.equal(salesRoleOf({ sold: false, inBom: true, hasParent: true, description: "SCREW" }), "PIA");
  assert.equal(salesRoleOf({ sold: false, inBom: true, hasParent: false, description: "CABLE ASSY" }), null);
  assert.equal(salesCategoryOf(base), "Charger");
  assert.equal(salesCategoryOf({ ...base, hasParent: true }), null);
  assert.equal(salesCategoryOf({ ...base, sold: false }), null);
});

import { readFileSync } from "node:fs";
import { buildBom } from "../src/bom.ts";
import { ROOT } from "./harness.ts";

const BOM_HEAD = "Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tParent Source\tParent State\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tChild Source\tChild State\tSSC\tReference Designator\tCild Notes\tFrom\tTO\tAmount\tUnit\tManufacturer\tManufacturer Part Number";
const bline = (parent: string, pname: string, line: number, child: string, cname: string, qty: number): string =>
  `${parent}\tA\t01\t${pname}\tmake\tR\t${line}\t${child}\tA\t01\t${cname}\tbuy\tR\t\t\t\t\t\t${qty}\tea\t\t`;
const BOM = [
  bline("5910001", "PC EDGE9kW 3B 480V", 1, "5910002", "PCBA CONTROL BOARD", 1), bline("5910001", "PC EDGE9kW 3B 480V", 2, "07802", "SCREW MACH 10-32 PPH", 4),
  bline("5910003", "KIT FLOOR STAND PROCORE", 1, "07802", "SCREW MACH 10-32 PPH", 8),
  bline("5910009", "CBL ASY 4_0 A320", 1, "07802", "SCREW MACH 10-32 PPH", 2),
  bline("5910020", "ASSY CABLE EXT OUTPUT SVS", 1, "07802", "SCREW MACH 10-32 PPH", 2),
].join("\n");
const LEDGER = ledger([
  row(A, "Jan 2025", "5910001A", "4", "4000"), row(A, "Dec 2025", "5910001A", "2", "2000"),   // product: 6 units over 12 months, price 1000
  row(A, "Mar 2025", "5910003A", "3", "300"),                                                   // kit that is no one's child: product, family Kit
  row(A, "Mar 2025", "5910002A", "10", "500"),                                                  // sold component: spare
  row(A, "Mar 2025", "5910009A", "1", "90"),                                                    // sold top-level cable, no family: spare, word-table category
  row(A, "Mar 2025", "5910099A", "1", "10"),                                                    // in no BOM: reported
]);
const run = (sales: ReturnType<typeof parseSales> | null) => buildBom(parseDelimited(BOM_HEAD + "\n" + BOM), { sourceName: "b.tsv", fingerprint: "a".repeat(64), runDate: "2026-11-08T10:00:00", authorCode: "x", classes: JSON.parse(readFileSync(ROOT + "tools/core/src/classes.json", "utf8")), existing: null, pending: [], sales } as any);
const noteOf = (files: Array<{ path: string; content: string }>, pn: string) => files.find((f) => f.path.endsWith(`/${pn}.md`))!;
const prop = (f: { content: string }, k: string): string | undefined => new RegExp(`^${k}: (.*)$`, "m").exec(f.content)?.[1];

test("sales wired into the BOM notes: role, family category, price and volume", () => {
  const r = run(parseSales(parseDelimited(LEDGER)));
  assert.equal(r.status, "WRITE_READY");
  const prod = noteOf(r.files, "5910001"), kit = noteOf(r.files, "5910003"), comp = noteOf(r.files, "5910002"), cable = noteOf(r.files, "5910009"), pia = noteOf(r.files, "07802"), none = noteOf(r.files, "5910020");
  assert.match(prod.path, /^BOM\/Parts\/Product\/Charger\/5910001\.md$/); assert.equal(prop(prod, "salesRole"), "product");
  assert.equal(prop(prod, "avgSalePrice"), "1000"); assert.equal(prop(prod, "annualVolume"), "6"); assert.equal(prop(prod, "level"), "product");
  assert.match(kit.path, /^BOM\/Parts\/Product\/Kit\//); assert.equal(prop(kit, "salesRole"), "product");
  assert.equal(prop(comp, "salesRole"), "spare"); assert.match(comp.path, /\/Parts\/Part\//); assert.equal(prop(comp, "level"), "part");   // a sold component keeps its structural level and word-table category
  assert.equal(prop(cable, "salesRole"), "spare"); assert.match(cable.path, /\/Parts\/Product\/Cable ASM\//);
  assert.equal(prop(pia, "salesRole"), "PIA"); assert.equal(prop(pia, "avgSalePrice"), undefined);
  assert.equal(prop(none, "salesRole"), undefined);                                                // unsold top-level part: no role
  assert.ok(r.findings.some((f) => f.code === "SALES_NO_BOM" && f.message.includes("5910099")));
  const sold = noteOf(r.files, "5910099");                                                         // in no BOM: a spare note of its own, flagged
  assert.match(sold.path, /^BOM\/Parts\/Part\/Uncategorized\/5910099\.md$/); assert.equal(prop(sold, "salesRole"), "spare"); assert.equal(prop(sold, "level"), "part");
  assert.equal(prop(sold, "annualVolume"), "1"); assert.match(sold.content, /flagImport/); assert.match(sold.content, /"5910099A"/);
  assert.equal(r.files.some((f) => /ACME/.test(f.content)), false);
  const dict = JSON.parse(readFileSync(ROOT + "governance/schemas/properties.json", "utf8")) as { order: string[]; properties: Array<{ name: string }> };
  for (const f of r.files.filter((x) => x.path.startsWith("BOM/Parts/"))) {
    const keys = [...(/^---\n([\s\S]*?)\n---\n/.exec(f.content)?.[1] ?? "").matchAll(/^([A-Za-z]\w*):/gm)].map((m) => m[1]!);
    for (const k of keys.filter((k) => ["salesRole", "avgSalePrice", "annualVolume"].includes(k))) assert.ok(dict.properties.some((p) => p.name === k), k);
    const pos = keys.map((k) => dict.order.indexOf(k)).filter((i) => i >= 0); assert.deepEqual(pos, [...pos].sort((a, b) => a - b), `${f.path} order`);
  }
});

test("without a ledger nothing changes: no sales property, word-table folders", () => {
  const r = run(null);
  for (const f of r.files.filter((x) => x.path.startsWith("BOM/Parts/"))) assert.equal(/^(salesRole|avgSalePrice|annualVolume):/m.test(f.content), false);
  assert.match(noteOf(r.files, "5910001").path, /\/Parts\/Product\/(?!Charger\/)/);
});

test("a repeat import with the same BOM and ledger adds no note, and a sales-only part already in the vault is not made twice", () => {
  const sales = parseSales(parseDelimited(LEDGER));
  const first = run(sales), vault = new Map(first.files.map((f) => [f.path, f.content] as [string, string]));
  const again = buildBom(parseDelimited(BOM_HEAD + "\n" + BOM), { sourceName: "b.tsv", fingerprint: "a".repeat(64), runDate: "2026-11-09T10:00:00", authorCode: "x", classes: JSON.parse(readFileSync(ROOT + "tools/core/src/classes.json", "utf8")), existing: { hasVault: true, files: vault }, pending: [], sales } as any);
  assert.equal(again.files.filter((x) => x.path.startsWith("BOM/")).length, 0);
  assert.ok(again.findings.some((f) => f.code === "SALES_IN_VAULT"));
});

test("the update scan adds the sales properties to a note already in the vault, and applies them", () => {
  const vault = new Map(run(null).files.map((f) => [f.path, f.content] as [string, string]));
  const o = { sourceName: "b.tsv", fingerprint: "a".repeat(64), runDate: "2026-11-09T10:00:00", authorCode: "x", classes: JSON.parse(readFileSync(ROOT + "tools/core/src/classes.json", "utf8")), existing: { hasVault: true, files: vault }, pending: [], sales: parseSales(parseDelimited(LEDGER)) } as any;
  const grid = parseDelimited(BOM_HEAD + "\n" + BOM), sc = scanRevisionUpdate(grid, o);
  const keys = sc.items.filter((i) => i.pn === "5910001" && i.category === "PART_ATTRIBUTES").map((i) => i.key).sort();
  assert.deepEqual(keys, ["annualVolume", "avgSalePrice", "salesRole"]);
  const res = applyRevisionUpdate(sc, { approved: new Set(sc.items.map((i) => i.id)), sourceName: "b.tsv", runDate: "2026-11-09T10:00:00" });
  const w = res.writes.find((x) => x.path.endsWith("/5910001.md"))!;
  assert.match(w.content as string, /^salesRole: product$/m); assert.match(w.content as string, /^avgSalePrice: 1000$/m);
});
