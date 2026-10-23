#!/usr/bin/env node
// Builds a small synthetic BOM through the real importer and writes every `## SysML v2` block it produced as ONE SysML file,
// for the independent parser gate (BOM-025, D-0048). Synthetic part numbers only: no real data belongs in this repository.
//   node testing/fixtures/bom-sample/assemble_bom_sysml.mjs OUTPUT.sysml
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const ROOT = new URL("../../../", import.meta.url).pathname;
const require = createRequire(import.meta.url);
const MDSE = require(ROOT + "tools/core/src/mdse_core.js");
const { buildBom, parseDelimited } = await import(ROOT + "tools/importer/src/bom.ts");
const classes = JSON.parse(readFileSync(ROOT + "tools/core/src/classes.json", "utf8"));
const out = process.argv[2];
if (!out) { console.error("usage: assemble_bom_sysml.mjs OUTPUT.sysml"); process.exit(2); }

const opts = { sourceName: "sample", fingerprint: "a".repeat(64), runDate: "2026-10-23T10:00:00", authorCode: "sampleauthor", classes, existing: null, pending: [] };
const c = (v, strike) => ({ v, runs: strike === undefined ? null : [{ t: v, strike }] });
const struck = (oldV, newV) => ({ v: oldV + newV, runs: [{ t: oldV, strike: true }, { t: newV, strike: false }] });
// Redline layout: a top assembly, a renumbered part, a bulk-material line, a drawing line, an alternate source, a repeated line with other values.
const H = ["Structure Level", "Number", "CL1", "CL2", "Name", "Line Number", "Quantity", "Unit", "Manufacturer", "Manufacturer Part Number", "Drawing Location"];
const row = (...x) => x.map((v) => (typeof v === "string" ? c(v) : v));
const redline = [H.map((h) => c(h)),
  row("0", "SAMPLE-TOP", "A", "01", "SAMPLE TOP ASSEMBLY", "", "", "", "", "", "ECO-0001"),
  row("1", struck("SAMPLE-OLD", "SAMPLE-NEW"), "A", "02", "SAMPLE BRACKET", "10", "2", "Piece", "ACME", "AC-100", ""),
  row("1", "", "", "", "", "", "", "", "BOLT CO", "BC-200", ""),
  row("1", "SAMPLE-WIRE-M", "-0", "01", "WIRE 22AWG", "20", "0.559", "Meter", "", "", ""),
  row("1", "SAMPLE-WIRE-M", "-0", "01", "WIRE 22AWG", "20", "0.700", "Meter", "", "", ""),
  row("1", "SAMPLE-ADH", "-0", "99", "ADHESIVE", "30", "12.5", "Milliliters", "", "", ""),
  row("1", "DWG SAMPLE-DWG", "A", "01", "DWG SAMPLE TOP", "1001", "0", "Piece", "", "", "")];
const flat = parseDelimited(["Parent Part Number\tParent CL1\tParent CL2\tParent Part Name\tLinenumber\tChild Part Number\tChild CL1\tChild CL2\tChild Name\tAmount\tUnit",
  "SAMPLE-NEW\tA\t01\tSAMPLE BRACKET\t1\tSAMPLE-SCREW\t-0\t99\tSCREW M4\t4\tea",
  "SAMPLE-NEW\tA\t01\tSAMPLE BRACKET\t2\tSAMPLE-WASHER\tZ\t99\tWASHER\t4\tea"].join("\n"));

const blocks = [], files = new Map();
const first = buildBom(redline, opts);
for (const f of first.files) if (f.path.endsWith(".md") && f.path.startsWith("BOM/")) files.set(f.path, f.content);
const second = buildBom(flat, { ...opts, existing: { hasVault: true, files: new Map(files) } });   // the second file, imported after the first
for (const f of second.files) if (f.path.endsWith(".md") && f.path.startsWith("BOM/")) files.set(f.path, f.content);
for (const [path, text] of [...files].sort(([a], [b]) => (a < b ? -1 : 1))) { const b = MDSE.extractSysml(text); if (b) blocks.push(`// ${path}\n${b.trimEnd()}\n`); }
const model = blocks.join("\n") + "\n";
writeFileSync(out, model);
console.log(`${files.size} notes, ${blocks.length} SysML blocks, sha256 ${createHash("sha256").update(model).digest("hex")}`);
