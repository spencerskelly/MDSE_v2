/* BOM import (BOM-001..014, ADR-V2-08). Input: a grid read from .xlsx, .csv or .tsv. Two layouts are understood:
 *   flat    one row per usage, parent and child both named (Parent Part Number ... Child Part Number ... Linenumber, Amount, Unit)
 *   redline one row per line with level columns 0..7 and red strike-through for the old value (a change set; .xlsx only)
 * Output: one `Object` note per part number (latest revision only), a `Document` note per drawing line, a findings note.
 * Parent-owned usages carry line, pinned child revision, quantity and unit. Nothing is guessed: a part number whose latest revision
 * cannot be told is reported and left out, and so are the usages that point at it (BOM-009).
 * The redline layout is INFERRED from a described sample, not from a real file; headers are matched by name, so a renamed column is
 * reported rather than misread. */
import { allocateIds, allocateUids } from "./identity.ts";
import { safeName, NameRegistry, IdentScope, usageIdent } from "./naming.ts";
import { renderNote, flagCallout, yamlScalar } from "./notes.ts";
import { bomOwnedHash } from "../../core/src/bom_own.ts";
import type { OutFile, ExistingVault } from "./merge.ts";

export interface Cell { v: string; runs?: Array<{ t: string; strike: boolean }> | null; struck?: boolean; kind?: string }
export type Grid = Array<Array<Cell | null | undefined>>;
export interface Finding { level: "error" | "warn" | "info"; code: string; message: string }

/** Cells of a .csv or .tsv text. The delimiter is the more frequent of tab and comma in the first line; quotes follow RFC 4180. */
export function parseDelimited(text: string): Grid {
  const t = text.replace(/^﻿/, ""), first = t.split(/\r?\n/, 1)[0] ?? "", delim = (first.match(/\t/g)?.length ?? 0) >= (first.match(/,/g)?.length ?? 0) ? "\t" : ",";
  const rows: Grid = []; let row: Cell[] = [], cur = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i]!;
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; continue; }
    if (c === '"' && cur === "") q = true;
    else if (c === delim) { row.push({ v: cur }); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push({ v: cur }); cur = ""; rows.push(row); row = []; }
    else cur += c;
  }
  if (cur !== "" || row.length) { row.push({ v: cur }); rows.push(row); }
  return rows;
}

const bomNorm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const bomTxt = (c: Cell | null | undefined): string => (c?.v ?? "").replace(/\s+$/g, "").replace(/^\s+/, "");
/** Redline cell: the unstruck text is current, the struck text is the previous value. A cell struck throughout has no current value. */
function bomCurPrev(c: Cell | null | undefined): { cur: string; prev: string } {
  if (!c) return { cur: "", prev: "" };
  if (c.runs && c.runs.some((r) => r.strike)) return { cur: c.runs.filter((r) => !r.strike).map((r) => r.t).join("").trim(), prev: c.runs.filter((r) => r.strike).map((r) => r.t).join("").trim() };
  if (c.struck) return { cur: "", prev: bomTxt(c) };
  return { cur: bomTxt(c), prev: "" };
}

export interface Src { mfr: string; mpn: string }
/** An alternate that has its own part number and sits on line 1xx beside line xx (BOM-003). */
export interface AltPart { pn: string; rev: string; name: string; line: string; amount: string; unit: string; mfr: string; mpn: string; row: number }
export interface Usage {
  parent: string; parentRev: string; line: string; child: string; childRev: string; childName: string; childSource: string; childState: string;
  amount: string; unit: string; refDes: string; from: string; to: string; ssc: string; notes: string; row: number; alternates: Src[]; /** D-0064: rows numbered 100 above this line that carry a part number of their own: alternates, not usages */ altParts: AltPart[]; ownSrc: Src | null; drawingLocation: string; prevChild: string;
}
export interface ParentObs { pn: string; rev: string; name: string; source: string; state: string; drawingLocation: string }
/** D-0059: a row the reader could not turn into a line is kept as its cell text (never just a count), so its content stays available to the person. */
export interface SkippedRow { row: number; code: string; cells: string }
export interface Parsed { layout: "flat" | "redline"; usages: Usage[]; parents: ParentObs[]; findings: Finding[]; skipped: SkippedRow[] }

function bomColMap(header: Array<Cell | null | undefined>): Map<string, number> {
  const m = new Map<string, number>(); header.forEach((c, i) => { const k = bomNorm(bomTxt(c)); if (k && !m.has(k)) m.set(k, i); }); return m;
}
const BOM_FLAT_REQ = ["parentpartnumber", "childpartnumber", "linenumber", "amount", "unit"];

/** The part-number column of a redline: `Number` (PLM export) or `Part Number` (the DVS 400 sheet). */
const bomNumKey = (m: Map<string, number>): string => (m.has("number") ? "number" : m.has("partnumber") ? "partnumber" : "");
/** Where a redline row's structure level is read from: the Structure/Structure Level/Level column, else the column just left of the part number when it holds only digits
 *  in the rows below the header (the real redlines have an unlabelled level column there), else the 0..7 level columns. */
function bomLevelSource(grid: Grid, header: number, m: Map<string, number>): { col: number; byDigits: boolean } {
  const named = m.get("structure") ?? m.get("structurelevel") ?? m.get("level");
  if (named !== undefined) return { col: named, byDigits: false };
  const nk = bomNumKey(m), left = nk ? (m.get(nk) ?? 0) - 1 : -1;
  if (left >= 0) {
    let seen = 0, bad = 0;
    for (let r = header + 1; r < Math.min(grid.length, header + 40); r++) { const v = bomTxt(grid[r]?.[left]); if (!v) continue; seen++; if (!/^\d$/.test(v)) bad++; }
    if (seen && !bad) return { col: left, byDigits: false };
  }
  return { col: -1, byDigits: [...m.keys()].some((k) => /^[0-7]$/.test(k)) };
}

export function detectLayout(grid: Grid): { layout: "flat" | "redline" | null; headerRow: number; missing: string[] } {
  for (let r = 0; r < Math.min(grid.length, 15); r++) {
    const m = bomColMap(grid[r] ?? []);
    if (m.has("parentpartnumber") && m.has("childpartnumber")) return { layout: "flat", headerRow: r, missing: BOM_FLAT_REQ.filter((k) => !m.has(k)) };
    if (bomNumKey(m) && m.has("cl1") && m.has("cl2")) {
      const lv = bomLevelSource(grid, r, m);
      if (lv.col >= 0 || lv.byDigits) return { layout: "redline", headerRow: r, missing: ["linenumber", "quantity", "unit"].filter((k) => !(k === "quantity" ? m.has("quantity") || m.has("amount") || (m.has("unit") && (m.has("unitofmeasure") || m.has("uom"))) : k === "unit" ? m.has("unit") || m.has("unitofmeasure") || m.has("uom") : m.has(k))) };
    }
  }
  return { layout: null, headerRow: -1, missing: [] };
}

const bomGet = (row: Array<Cell | null | undefined>, m: Map<string, number>, ...keys: string[]): string => { for (const k of keys) { const i = m.get(k); if (i !== undefined) { const v = bomTxt(row[i]); if (v) return v; } } return ""; };

/** BOM-003 / D-0064: a row on line 1xx whose line xx exists under the same parent and revision is an alternate of line xx, not a usage: it adds no quantity and is listed under that line. Every case is reported for review. */
function foldAltLines(usages: Usage[], findings: Finding[]): Usage[] {
  const base = new Map<string, Usage>(); for (const u of usages) if (bomIsNum(u.line) && +u.line < 100) { const k = `${u.parent}\0${u.parentRev}\0${+u.line}`; if (!base.has(k)) base.set(k, u); }
  return usages.filter((u) => {
    if (!bomIsNum(u.line) || +u.line < 101 || +u.line > 199) return true;
    const b = base.get(`${u.parent}\0${u.parentRev}\0${+u.line - 100}`); if (!b) return true;
    b.altParts.push({ pn: u.child, rev: u.childRev, name: u.childName, line: u.line, amount: u.amount, unit: u.unit, mfr: u.ownSrc?.mfr ?? "", mpn: u.ownSrc?.mpn ?? "", row: u.row });
    findings.push({ level: "warn", code: "ALT_BY_LINE", message: `Row ${u.row}: line ${u.line} (${u.child}) under ${u.parent} is read as an alternate of line ${b.line} (${b.child}) because the line numbers are 100 apart (BOM-003). It adds no quantity. Check that it is not a real line.` });
    return false;
  });
}
export function parseBom(grid: Grid): Parsed {
  const d = detectLayout(grid), findings: Finding[] = [];
  if (!d.layout) return { layout: "flat", usages: [], parents: [], skipped: [], findings: [{ level: "error", code: "BOM_LAYOUT", message: "No header row found. A flat BOM needs Parent Part Number and Child Part Number columns; a redline needs Number, CL1, CL2 and level columns 0..7 or Structure." }] };
  const skipped: SkippedRow[] = [], hdr = grid[d.headerRow] ?? [];
  const skip = (r: number, code: string): void => { const row = grid[r] ?? [], cells: string[] = []; row.forEach((c, i) => { const x = bomCurPrev(c); if (!x.cur && !x.prev) return; cells.push(`${bomTxt(hdr[i]) || "column " + (i + 1)}: ${x.cur}${x.prev ? (x.cur ? ` (was ${x.prev})` : `(struck: ${x.prev})`) : ""}`); }); skipped.push({ row: r + 1, code, cells: cells.join("; ") }); };
  if (d.missing.length) findings.push({ level: "error", code: "BOM_COLUMNS", message: `Missing column(s): ${d.missing.join(", ")}.` });
  const m = bomColMap(grid[d.headerRow]!), usages: Usage[] = [], parents: ParentObs[] = [];
  const blank = (u: Partial<Usage>): Usage => ({ parent: "", parentRev: "", line: "", child: "", childRev: "", childName: "", childSource: "", childState: "", amount: "", unit: "", refDes: "", from: "", to: "", ssc: "", notes: "", row: 0, alternates: [], altParts: [], ownSrc: null, drawingLocation: "", prevChild: "", ...u });
  if (d.layout === "flat") {
    let last: Usage | null = null;
    for (let r = d.headerRow + 1; r < grid.length; r++) {
      const row = grid[r] ?? []; if (!row.some((c) => bomTxt(c))) continue;
      { const cells = row.map(bomTxt).filter(Boolean); if (cells.length > 4 && cells.every((t) => t === "x")) { findings.push({ level: "info", code: "END_MARKER", message: `Row ${r + 1}: every cell is "x", an end-of-data marker in the export; skipped.` }); continue; } }
      const parent = bomGet(row, m, "parentpartnumber"), child = bomGet(row, m, "childpartnumber"), mfr = bomGet(row, m, "manufacturer", "childmanufacturer"), mpn = bomGet(row, m, "manufacturerpartnumber", "childmanufacturerpartnumber");
      if (!child) {   // BOM-003 / BOM-013: blank PN + manufacturer part number = alternate of the line above
        if (mpn && last && last.parent === parent && last.parentRev === bomGet(row, m, "parentcl1") + bomGet(row, m, "parentcl2")) { last.alternates.push({ mfr, mpn }); continue; }
        findings.push({ level: "warn", code: mpn ? "ALT_NO_PRIMARY" : "ROW_NO_CHILD", message: `Row ${r + 1}: no child part number${mpn ? " and no unambiguous primary line above; review only" : ""}.` }); skip(r, mpn ? "ALT_NO_PRIMARY" : "ROW_NO_CHILD"); continue;
      }
      const u = blank({ parent, parentRev: bomGet(row, m, "parentcl1") + bomGet(row, m, "parentcl2"), line: bomGet(row, m, "linenumber"), child, childRev: bomGet(row, m, "childcl1") + bomGet(row, m, "childcl2"), childName: bomGet(row, m, "childname"),
        childSource: bomGet(row, m, "childsource"), childState: bomGet(row, m, "childstate"), amount: bomGet(row, m, "amount", "quantity"), unit: bomGet(row, m, "unit"), refDes: bomGet(row, m, "referencedesignator"), from: bomGet(row, m, "from"), to: bomGet(row, m, "to"),
        ssc: bomGet(row, m, "ssc"), notes: bomGet(row, m, "cildnotes", "childnotes"), row: r + 1, ownSrc: mpn || mfr ? { mfr, mpn } : null });
      if (!parent) { findings.push({ level: "warn", code: "ROW_NO_PARENT", message: `Row ${r + 1}: no parent part number; skipped.` }); skip(r, "ROW_NO_PARENT"); continue; }
      parents.push({ pn: parent, rev: u.parentRev, name: bomGet(row, m, "parentpartname"), source: bomGet(row, m, "parentsource"), state: bomGet(row, m, "parentstate"), drawingLocation: "" });
      usages.push(u); last = u;
    }
    return { layout: "flat", usages: foldAltLines(usages, findings), parents, findings, skipped };
  }
  // redline: the parent of a row is the nearest row above it one level up (the 0..7 columns match Structure)
  const levelCols = [...m.entries()].filter(([k]) => /^[0-7]$/.test(k)).map(([k, i]) => [+k, i] as const).sort((a, b) => a[0] - b[0]), lvl = bomLevelSource(grid, d.headerRow, m);
  const stack: Array<{ pn: string; rev: string } | undefined> = []; let last: Usage | null = null;
  for (let r = d.headerRow + 1; r < grid.length; r++) {
    const row = grid[r] ?? []; if (!row.some((c) => bomTxt(c))) continue;
    let level = levelCols.find(([, i]) => bomTxt(row[i]))?.[0] ?? -1;
    if (level < 0 && lvl.col >= 0) { const s = bomTxt(row[lvl.col]); if (/^\d+$/.test(s)) level = +s; }
    const num = bomCurPrev(row[m.get(bomNumKey(m)) ?? -1]), mfr = bomGet(row, m, "manufacturer"), mpn = bomGet(row, m, "manufacturerpartnumber", "manufacturerpartnubmer");
    if (!num.cur && !num.prev) {   // blank number: an alternate source of the line above (BOM-013)
      if ((mfr || mpn) && last) last.alternates.push({ mfr, mpn }); else findings.push({ level: "warn", code: "ALT_NO_PRIMARY", message: `Row ${r + 1}: blank part number and nothing above it to attach to; review only.` }); skip(r, "ALT_NO_PRIMARY"); continue;
    }
    if (level < 0) { findings.push({ level: "warn", code: "ROW_NO_LEVEL", message: `Row ${r + 1}: no level; skipped.` }); skip(r, "ROW_NO_LEVEL"); continue; }
    if (!num.cur) { findings.push({ level: "info", code: "LINE_REMOVED", message: `Row ${r + 1}: part number ${num.prev} is struck out with no replacement; the line is removed in this release and was not imported.` }); skip(r, "LINE_REMOVED"); stack[level] = undefined; continue; }
    const name = bomCurPrev(row[m.get("name") ?? -1]).cur, cl1 = bomCurPrev(row[m.get("cl1") ?? -1]).cur, cl2 = bomCurPrev(row[m.get("cl2") ?? -1]).cur, rev = cl1 + cl2;
    stack.length = level + 1; stack[level] = { pn: num.cur, rev };
    const dl = bomGet(row, m, "drawinglocation");
    if (level === 0) { parents.push({ pn: num.cur, rev, name, source: "", state: "", drawingLocation: dl }); last = null; continue; }
    const p = stack[level - 1];
    if (!p) { findings.push({ level: "warn", code: "ROW_NO_PARENT", message: `Row ${r + 1}: level ${level} with no row above at level ${level - 1}; skipped.` }); skip(r, "ROW_NO_PARENT"); continue; }
    const unitCol = m.get("unitofmeasure") ?? m.get("uom") ?? m.get("unit"), qtyCol = m.get("quantity") ?? m.get("amount") ?? (m.has("unitofmeasure") || m.has("uom") ? m.get("unit") : undefined);   // the DVS 400 sheet calls the quantity "Unit" and the unit "Unit Of Measure"
    const q = bomCurPrev(row[qtyCol ?? -1]), un = bomCurPrev(row[unitCol ?? -1]);
    const u = blank({ parent: p.pn, parentRev: p.rev, line: bomCurPrev(row[m.get("linenumber") ?? -1]).cur, child: num.cur, childRev: rev, childName: name, amount: q.cur, unit: un.cur, row: r + 1, ownSrc: mpn || mfr ? { mfr, mpn } : null, drawingLocation: dl, prevChild: num.prev });
    usages.push(u); last = u;
    // a child that has lines below it is a parent of those; its own attributes are the ones just read
    parents.push({ pn: num.cur, rev, name, source: "", state: "", drawingLocation: dl });
  }
  // keep a parent observation only for part numbers that really have lines below them
  const hasKids = new Set(usages.map((u) => u.parent + "\0" + u.parentRev));
  return { layout: "redline", usages: foldAltLines(usages, findings), parents: parents.filter((p) => hasKids.has(p.pn + "\0" + p.rev)), findings, skipped };
}

// ---- resolve and render ---------------------------------------------------------------------------------------------------
/** D-0059: every row the reader skipped, with its content, not capped (the table above lists at most 40 findings per code). */
const skippedSection = (s: SkippedRow[]): string => s.length ? `\n## Skipped rows\n\nThese rows were not turned into lines. Their content is kept here (D-0059), so nothing in the file is lost.\n\n| Row | Code | Content |\n|---|---|---|\n${s.map((x) => `| ${x.row} | ${x.code} | ${x.cells.replace(/\|/g, "\\|") || "(blank)"} |`).join("\n")}\n` : "";

/** Appended to the findings that say an earlier BOM's note was left as it is: the way to change it is the update scan, not another import. */
const HINT_UPDATE = ` To bring this file's changes in, use "Update an existing vault from a BOM" (D-0051).`;
const BOM_DISCRETE = new Set(["", "ea", "each", "piece", "pieces", "pc", "pcs"]);
const bomIsDrawing = (u: Usage): boolean => /^dwg\b/i.test(u.childName);
const bomIsNum = (s: string): boolean => /^-?\d+(\.\d+)?$/.test(s);
/** Revisions are labels, never numbers: "-199" is revision "-1" at level 99, so it is always text. Quantities and line numbers stay numbers. */
const BOM_TEXT_ATTRS = new Set(["revision", "childRevision", "partNumber", "source", "drawingLocation", "refDes", "ssc", "notes", "effectiveFrom", "effectiveTo", "unit"]);
const bomAttr = (name: string, v: string): string => `attribute ${name} = ${!BOM_TEXT_ATTRS.has(name) && bomIsNum(v) && !/^-?0\d/.test(v) ? v : JSON.stringify(v)};`;
const bomSymOf = (id: string, pn: string): string => `${id.replace("-", "_")}::P_${pn.replace(/[^A-Za-z0-9]/g, "_")}`;
const bomDocSymOf = (id: string, pn: string): string => `${id.replace("-", "_")}::D_${pn.replace(/[^A-Za-z0-9]/g, "_")}`;
/** camelCase usage name from a part name. ALL-CAPS words are lowered first (CONNECTOR HOUSING -> connectorHousing); at most 40 characters. */
export function bomIdent(name: string, pn: string): string {
  const words = name.normalize("NFKD").replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").filter(Boolean).map((w) => (w === w.toUpperCase() ? w.toLowerCase() : w));
  let s = words.map((w, i) => (i ? w[0]!.toUpperCase() + w.slice(1) : w)).join("").slice(0, 40);
  if (!s) s = "p" + pn.replace(/[^A-Za-z0-9]/g, "");
  return usageIdent(/^[0-9]/.test(s) ? "p" + s : s, "part");
}
/** Revision order (D-0047). A placeholder revision (`-099`, `_99`, `Z99`: a part nobody revises) ranks below every real one. Otherwise the letters compare first and the trailing number second, so `A02` < `B01` < `B02` and `-V01` < `-V02`. */
const bomPlaceholder = (rev: string): boolean => /^(?:-0|_|Z)99$/.test(rev);
export function bomRevCompare(a: string, b: string): number {
  const pa = bomPlaceholder(a), pb = bomPlaceholder(b);
  if (pa !== pb) return pa ? -1 : 1;
  const ma = /^(.*?)(\d+)$/.exec(a), mb = /^(.*?)(\d+)$/.exec(b);
  if (ma && mb) { if (ma[1] !== mb[1]) return ma[1]! < mb[1]! ? -1 : 1; if (+ma[2]! !== +mb[2]!) return +ma[2]! < +mb[2]! ? -1 : 1; }
  return a === b ? 0 : a < b ? -1 : 1;
}

/** One spelling per unit (D-0047): ea for a count, SI and common abbreviations otherwise. `ZST`, `Null` and `x` are not units and are dropped; null in the result means "no unit". */
const BOM_UNITS: Record<string, string> = { ea: "ea", each: "ea", piece: "ea", pieces: "ea", pc: "ea", pcs: "ea", m: "m", meter: "m", meters: "m", metre: "m", metres: "m", mm: "mm", millimeter: "mm", millimeters: "mm", cm: "cm", centimeter: "cm", in: "in", inch: "in", inches: "in", ft: "ft", foot: "ft", feet: "ft", yd: "yd", yard: "yd", yards: "yd",
  ml: "mL", milliliter: "mL", milliliters: "mL", l: "L", liter: "L", liters: "L", litre: "L", g: "g", gram: "g", grams: "g", kg: "kg", kilogram: "kg", kilograms: "kg", oz: "oz", ounce: "oz", ounces: "oz", lb: "lb", lbs: "lb", pound: "lb", pounds: "lb", m2: "m2", m3: "m3" };
export function bomUnit(raw: string): { unit: string; known: boolean } {
  const t = raw.replace(/\(\s*zst\s*\)/gi, "").trim().toLowerCase();
  if (!t || t === "zst" || t === "null" || t === "x") return { unit: "", known: true };
  const u = BOM_UNITS[t];
  return u ? { unit: u, known: true } : { unit: raw.replace(/\(\s*zst\s*\)/gi, "").trim(), known: false };
}

/** A BOM date as `YYYY-MM-dd` text (D-0047). Reads `2/Jan/19` with English or German month abbreviations and a two-digit year; anything else is returned as exported. */
const BOM_MONTHS: Record<string, string> = { jan: "01", feb: "02", mar: "03", mrz: "03", apr: "04", may: "05", mai: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", okt: "10", nov: "11", dec: "12", dez: "12" };
export function bomDate(raw: string): string {
  const m = /^(\d{1,2})\/([A-Za-z]{3})\/(\d{2}|\d{4})$/.exec(raw.trim()), mo = m ? BOM_MONTHS[m[2]!.toLowerCase()] : undefined;
  if (m && mo) return `${m[3]!.length === 4 ? m[3] : (+m[3]! <= 69 ? "20" : "19") + m[3]}-${mo}-${m[1]!.padStart(2, "0")}`;
  return raw;
}
const bomStampOf = (iso: string): string => iso.replace(/[-:T]/g, "").slice(0, 14) + "000";

export interface BomOptions {
  sourceName: string; fingerprint: string; runDate: string; authorCode: string;
  classes: Record<string, { prefix: string; subtype: string[] }>;
  /** What is already in the vault, plus the files an EA run is about to write in the same pass. */
  existing: ExistingVault | null; pending: Array<[string, string]>;
  /** EA note titles for the part-number join, from the EA run. Optional. */
  eaTitles?: string[];
  dir?: string;
  /** Update scan (D-0051): every part is generated again, including those already in the vault, keeping their id, uid and path. The caller compares and decides what to write. */
  update?: boolean;
  /** D-0056: what to do with the lines a file gives for an assembly at a revision older than its latest. "keep" (the default) writes them into the note body; "drop" skips them and says how many. */
  earlierRevisions?: "keep" | "drop";
}
export interface BomResult {
  status: "WRITE_READY" | "FAILED"; files: OutFile[]; findings: Finding[]; problems: string[];
  summary: { layout: string; rows: number; parts: number; usages: number; drawings: number; alternates: number; skippedParts: number; existing: number; conflicts: number; eaMatched: number; bomOnly: number };
}

/** Adds the three stamp properties at the end of the frontmatter of a freshly rendered BOM note. */
function bomStamp(noteText: string, source: string, on: string): string {
  const stamp = [`importSource: ${yamlScalar(source)}`, `importedOn: ${on}`, `importHash: ${bomOwnedHash(noteText)}`].join("\n");
  return noteText.replace(/\n---\n/, `\n${stamp}\n---\n`);
}
/** What an earlier BOM note says about its lines: line -> "child revision|count or quantity unit". Used to tell a second BOM that agrees from one that does not. */
function bomLinesOfNote(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of text.matchAll(/^\s*part\s+\w+\s*:\s*[\w:]+(?:\s*\[(\d+)\])?\s*(?:\{([^}]*)\}|;)/gm)) {
    const body = m[2] ?? "", at = (k: string): string => { const x = new RegExp(`attribute ${k} = (?:"([^"]*)"|([^;]+));`).exec(body); return x ? (x[1] ?? x[2] ?? "").trim() : ""; };
    out.set(at("line"), `${at("childRevision")}|${m[1] ?? (at("quantity") ? at("quantity") + " " + at("unit") : "1")}`.trim());
  }
  return out;
}
/** What differs between two rows for the same line of the same assembly, in words; "" when they agree. */
function bomUsageDiff(a: Usage, b: Usage): string {
  const f: Array<[string, string, string]> = [["child", a.child, b.child], ["child revision", a.childRev, b.childRev], ["quantity", a.amount, b.amount], ["unit", a.unit, b.unit], ["reference designator", a.refDes, b.refDes], ["from", a.from, b.from], ["to", a.to, b.to]];
  return f.filter(([, x, y]) => x !== y).map(([n, x, y]) => `${n} ${JSON.stringify(x)} kept, ${JSON.stringify(y)} other`).join("; ");
}
const bomUsageSig = (u: Usage): string => `${u.childRev}|${BOM_DISCRETE.has(u.unit.toLowerCase()) && /^\d+$/.test(u.amount) && +u.amount > 0 ? (+u.amount === 1 ? "1" : u.amount) : u.amount ? u.amount + " " + u.unit : "1"}`.trim();

export function buildBom(grid: Grid, o: BomOptions): BomResult {
  const parsed = parseBom(grid), findings = [...parsed.findings], problems: string[] = [];
  const unknownUnits = new Map<string, number>();
  for (const u of parsed.usages) {
    const un = bomUnit(u.unit); if (!un.known) unknownUnits.set(un.unit, (unknownUnits.get(un.unit) ?? 0) + 1);
    u.unit = un.unit; u.from = bomDate(u.from); u.to = bomDate(u.to);
  }
  for (const [x, n] of [...unknownUnits].sort()) findings.push({ level: "warn", code: "UNIT_UNKNOWN", message: `Unit ${JSON.stringify(x)} (${n} line${n === 1 ? "" : "s"}) is not in the unit list; kept as exported. Add it to the list.` });
  const blocking = findings.some((f) => f.level === "error");
  const empty = { layout: parsed.layout, rows: parsed.usages.length, parts: 0, usages: 0, drawings: 0, alternates: 0, skippedParts: 0, existing: 0, conflicts: 0, eaMatched: 0, bomOnly: 0 };
  if (blocking || !parsed.usages.length) { if (!blocking) findings.push({ level: "error", code: "BOM_EMPTY", message: "The sheet has a header but no usable lines." }); return { status: "FAILED", files: [], findings, problems: findings.filter((f) => f.level === "error").map((f) => f.message), summary: empty }; }

  // observations per part number
  type Obs = { rev: string; name: string; source: string; state: string; drawingLocation: string };
  const asParent = new Map<string, Map<string, Obs>>(), asChild = new Map<string, Map<string, Obs>>();
  // BOM-037: one part number at one revision that is named two ways on the same side (as a child, or as a parent) keeps the first name and says so.
  // A difference of case or spacing only is not a conflict. The key is side, part number and revision.
  const nameKey = (s: string): string => s.toLowerCase().replace(/\s+/g, " ").trim();
  const nameSeen = new Map<string, { side: string; pn: string; rev: string; first: string; firstRow: number | null; others: Map<string, number> }>();
  const put = (m: Map<string, Map<string, Obs>>, pn: string, rev: string, ob: Obs, side: string, row: number | null): void => {
    const r = m.get(pn) ?? m.set(pn, new Map()).get(pn)!; const cur = r.get(rev), k0 = `${side}\0${pn}\0${rev}`;
    if (!cur) { r.set(rev, ob); if (ob.name) nameSeen.set(k0, { side, pn, rev, first: ob.name, firstRow: row, others: new Map() }); return; }
    if (ob.name) { const seen = nameSeen.get(k0); if (!seen) nameSeen.set(k0, { side, pn, rev, first: ob.name, firstRow: row, others: new Map() }); else if (nameKey(seen.first) !== nameKey(ob.name)) seen.others.set(ob.name, (seen.others.get(ob.name) ?? 0) + 1); }
    for (const k of Object.keys(ob) as Array<keyof Obs>) if (!cur[k] && ob[k]) cur[k] = ob[k];
  };
  for (const p of parsed.parents) put(asParent, p.pn, p.rev, { rev: p.rev, name: p.name, source: p.source, state: p.state, drawingLocation: p.drawingLocation }, "parent", null);
  for (const u of parsed.usages) put(asChild, u.child, u.childRev, { rev: u.childRev, name: u.childName, source: u.childSource, state: u.childState, drawingLocation: u.drawingLocation }, "child", u.row);
  const nameConflicts = [...nameSeen.values()].filter((x) => x.others.size).sort((a, b) => (a.pn < b.pn ? -1 : a.pn > b.pn ? 1 : a.rev < b.rev ? -1 : a.rev > b.rev ? 1 : a.side < b.side ? -1 : 1));
  const allPns = new Set([...asParent.keys(), ...asChild.keys()]);

  // D-0047: the latest revision is the highest by bomRevCompare, among the revisions the part has as an assembly, else among those its parents pin.
  const latest = new Map<string, Obs>(), undetermined = new Set<string>(), revsSeen = new Map<string, string[]>();
  for (const pn of [...allPns].sort()) {
    const pr = asParent.get(pn), cr = asChild.get(pn);
    const revs = (pr ? [...pr.keys()] : cr ? [...cr.keys()] : []).sort(bomRevCompare), top = revs[revs.length - 1]!;
    const base = (pr ?? cr)!.get(top)!, name = base.name || cr?.get(top)?.name || pr?.get(top)?.name || "";
    latest.set(pn, { ...base, name, source: base.source || cr?.get(top)?.source || "", state: "" });
    const all = [...new Set([...(pr?.keys() ?? []), ...(cr?.keys() ?? [])])].sort(bomRevCompare);
    if (all.length > 1) revsSeen.set(pn, all);
    if (revs.length > 1) findings.push({ level: "info", code: "REV_BY_ORDER", message: `${pn}: revisions ${revs.map((x) => JSON.stringify(x)).join(", ")} seen${pr ? " as assembly" : " as pinned child"}; ${JSON.stringify(top)} taken as the latest by revision order.` });
  }
  // A part number a redline struck out and replaced is named by the BOM, so it gets a note too (BOM-022); without one the supersedes dependency would point at nothing.
  const stubs = new Map<string, string[]>();
  for (const u of parsed.usages) if (u.prevChild && u.prevChild !== u.child && !allPns.has(u.prevChild)) (stubs.get(u.prevChild) ?? stubs.set(u.prevChild, []).get(u.prevChild)!).push(u.child);
  for (const pn of [...stubs.keys()].sort()) { allPns.add(pn); latest.set(pn, { rev: "", name: "", source: "", state: "", drawingLocation: "" }); }
  const drawingPns = new Set(parsed.usages.filter(bomIsDrawing).map((u) => u.child));
  // existing notes by part number
  const existingBy = new Map<string, { id: string; base: string; text: string; path: string; uid: string }>();
  for (const [p, t] of [...(o.existing?.files ?? []), ...o.pending]) {
    const m = /^- BOM Part Number: (.+)$/m.exec(t); if (!m) continue;
    const id = /^id: (\S+)$/m.exec(t)?.[1]; if (id) existingBy.set(m[1]!.trim(), { id, base: p.split("/").pop()!.replace(/\.md$/i, ""), text: t, path: p, uid: /^uid: (\S+)$/m.exec(t)?.[1] ?? "" });
  }
  // BOM-037, reported after the vault is read: a part number that already has a note is left as it is (BOM-026) and raises nothing here, except in an update scan.
  for (const s of nameConflicts) {
    if (!o.update && existingBy.has(s.pn)) continue;
    findings.push({ level: "warn", code: "NAME_CONFLICT", message: `${s.pn} revision ${JSON.stringify(s.rev)} is named ${JSON.stringify(s.first)}${s.firstRow ? ` (row ${s.firstRow})` : ""} and also ${[...s.others].map(([n, c]) => `${JSON.stringify(n)} (${c} more row${c === 1 ? "" : "s"})`).join(", ")} as a ${s.side}; the first name was used. Review which is right.` });
  }
  const earlierOf = new Map<string, Usage[]>();   // D-0056 (BOM-038): lines of an assembly at a revision older than its latest
  // usages that can be written: parent and child both determined, no duplicate (parent, line)
  const okUsage: Usage[] = [], seenLine = new Set<string>(), firstOf = new Map<string, Usage>(), existingUsages = new Map<string, Usage[]>(), otherRev = new Set<string>(), dupes = new Map<string, Array<{ kept: Usage; other: Usage; diff: string }>>(); let alternates = 0;
  for (const u of parsed.usages) {
    if (undetermined.has(u.parent) || (undetermined.has(u.child) && !bomIsDrawing(u))) continue;
    const lp = latest.get(u.parent)!;
    if (lp.rev !== u.parentRev) { (earlierOf.get(u.parent) ?? earlierOf.set(u.parent, []).get(u.parent)!).push(u); continue; }   // D-0056: kept in the note body, never dropped without a decision
    const k = u.parent + "\0" + u.line;
    const exP = existingBy.get(u.parent);
    if (exP && !o.update) {   // BOM-026: an assembly already in the vault is not re-read line by line; only its lines are kept to say where this file disagrees
      const vr = /attribute revision = (?:"([^"]*)"|([^;]+));/.exec(exP.text), vaultRev = vr ? (vr[1] ?? vr[2] ?? "").trim() : "";
      if (vaultRev !== lp.rev) { otherRev.add(u.parent); continue; }
      if (!bomIsDrawing(u) && !(u.line && seenLine.has(k))) { seenLine.add(k); (existingUsages.get(u.parent) ?? existingUsages.set(u.parent, []).get(u.parent)!).push(u); }
      continue;
    }
    if (u.line && seenLine.has(k)) { const first = firstOf.get(k)!; const diff = bomUsageDiff(first, u); if (diff) { (dupes.get(u.parent) ?? dupes.set(u.parent, []).get(u.parent)!).push({ kept: first, other: u, diff }); findings.push({ level: "warn", code: "DUP_LINE", message: `Row ${u.row}: parent ${u.parent} line ${u.line} appears again with different values (${diff}); the first (row ${first.row}) was kept and the other flagged in the note (D-0047).` }); } continue; }
    seenLine.add(k); firstOf.set(k, u); okUsage.push(u); alternates += u.alternates.length + u.altParts.length;
    if (!u.line) findings.push({ level: "warn", code: "NO_LINE", message: `Row ${u.row}: no line number for ${u.child} under ${u.parent}; the usage cannot be identified by line (BOM-008).` });
  }

  // identity: ids continue after the highest in the vault and in the pending EA files; uids avoid every uid there
  const highest = new Map<string, number>(), taken = new Set<string>();
  for (const [, t] of [...(o.existing?.files ?? []), ...o.pending]) {
    const id = /^id: ([A-Z]+)-(\d{5})\s*$/m.exec(t), uid = /^uid: (\d{17}\S{13})\s*$/m.exec(t);
    if (id) highest.set(id[1]!, Math.max(highest.get(id[1]!) ?? 0, +id[2]!)); if (uid) taken.add(uid[1]!);
  }
  const partPns = [...latest.keys()].filter((pn) => !drawingPns.has(pn) || okUsage.some((u) => u.child === pn && !bomIsDrawing(u))).sort();
  const newParts = partPns.filter((pn) => !existingBy.has(pn)), newDrawings = [...drawingPns].filter((pn) => (o.update || !existingBy.has(pn)) && latest.has(pn)).sort();
  const idReq = [...newParts.map((pn) => ({ key: "p:" + pn, prefix: o.classes["Object"]!.prefix, created: "", guid: pn })), ...newDrawings.filter((pn) => !existingBy.has(pn)).map((pn) => ({ key: "d:" + pn, prefix: o.classes["Document"]!.prefix, created: "", guid: pn }))];
  const ids = allocateIds(idReq, highest);
  const uids = allocateUids(idReq.map((r) => ({ key: r.key, created: "", guid: r.guid, author: "" })), { authorMap: {}, fallbackCode: o.authorCode, unmappedNames: [""] }, taken, bomStampOf(o.runDate));
  const names = new NameRegistry([...(o.existing?.allPaths ?? []), ...(o.existing?.files.keys() ?? []), ...o.pending.map(([p]) => p)]);
  const dir = o.dir ?? "BOM";
  const info = new Map<string, { id: string; base: string; path: string; fresh: boolean }>();
  for (const pn of [...partPns, ...newDrawings.filter((x) => !partPns.includes(x))]) {
    const ex = existingBy.get(pn);
    if (ex) { info.set(pn, { id: ex.id, base: ex.base, path: o.update ? ex.path : "", fresh: !!o.update }); continue; }
    const l = latest.get(pn)!, key = (drawingPns.has(pn) && !partPns.includes(pn) ? "d:" : "p:") + pn;
    const path = names.claim(key.startsWith("d:") ? `${dir}/Drawings` : `${dir}/Parts`, safeName(pn, pn), ".md");
    info.set(pn, { id: ids.get(key)!, base: path.split("/").pop()!.replace(/\.md$/i, ""), path, fresh: true });
  }

  // children per parent, usage names, conflicts, older-revision users
  const link = `\`${o.sourceName}\``, files: OutFile[] = [];
  const byParent = new Map<string, Usage[]>(); for (const u of okUsage) (byParent.get(u.parent) ?? byParent.set(u.parent, []).get(u.parent)!).push(u);
  // A part number that an earlier BOM already put in the vault is kept as it is; say so when this file does not agree with it (same part number and revision, different lines).
  for (const pn of partPns) {
    const ex = existingBy.get(pn), kids = existingUsages.get(pn); if (o.update || !ex || !kids?.length) continue;
    const old = bomLinesOfNote(ex.text), diffs: string[] = [];
    for (const u of kids) { if (bomIsDrawing(u)) continue; const was = old.get(u.line); const now = bomUsageSig(u); if (was === undefined) diffs.push(`line ${u.line || "?"} (${u.child}) is new`); else if (was !== now) diffs.push(`line ${u.line} (${u.child}): ${was.replace("|", " pinned, qty ")} in the vault, ${now.replace("|", " pinned, qty ")} here`); }
    if (diffs.length) findings.push({ level: "warn", code: "EXISTING_DIFFERS", message: `${pn} is already in the vault from an earlier BOM and was left as it is, but this file disagrees on ${diffs.length} line(s): ${diffs.join("; ")}.${HINT_UPDATE}` });
  }
  const lineKey = (u: Usage): number => (bomIsNum(u.line) ? +u.line : 1e12);
  let conflicts = 0;   // D-0063: a child note carries nothing about the assemblies above it; the pin is on the parent's usage and in its flagConflict callout
  for (const u of okUsage) {
    const l = latest.get(u.child); if (!l || bomIsDrawing(u)) continue;
    if (l.rev !== u.childRev) conflicts++;
  }
  const replaces = new Map<string, Set<string>>();
  for (const u of okUsage) if (u.prevChild && u.prevChild !== u.child) (replaces.get(u.child) ?? replaces.set(u.child, new Set()).get(u.child)!).add(u.prevChild);
  // D-0056 (BOM-038): the lines of earlier revisions are data and are kept by default. Dropping them is a choice made at import and is counted.
  const earlierKeep = (o.earlierRevisions ?? "keep") === "keep";
  const earlierRows = (pn: string): Usage[] => { const seen = new Set<string>(), out: Usage[] = []; for (const u of (earlierOf.get(pn) ?? []).slice().sort((a, b) => bomRevCompare(b.parentRev, a.parentRev) || lineKey(a) - lineKey(b) || a.row - b.row)) { const k = [u.parentRev, u.line, u.child, u.childRev, u.amount, u.unit, u.refDes, u.from, u.to].join("\0"); if (!seen.has(k)) { seen.add(k); out.push(u); } } return out; };
  const earlierText = (pn: string): string[] => earlierRows(pn).map((u) => `- Revision ${JSON.stringify(u.parentRev)}, line ${u.line || "?"}: ${u.child}${u.childName ? " (" + u.childName + ")" : ""}${u.childRev ? " at revision " + JSON.stringify(u.childRev) : ""}${u.amount ? ", quantity " + u.amount + (u.unit ? " " + u.unit : "") : ""}${u.refDes ? ", reference " + u.refDes : ""}${u.from ? ", from " + u.from : ""}${u.to ? ", to " + u.to : ""} (row ${u.row})`);
  for (const pn of [...earlierOf.keys()].sort()) {
    const n = earlierRows(pn).length, revs = [...new Set(earlierRows(pn).map((u) => u.parentRev))].map((r) => JSON.stringify(r)).join(", "), ex = existingBy.has(pn) && !o.update;
    if (!n) continue;
    if (!earlierKeep) findings.push({ level: "warn", code: "EARLIER_REV_DROPPED", message: `${pn}: ${n} line(s) of earlier revision(s) ${revs} were skipped, as chosen for this import.` });
    else if (ex) findings.push({ level: "warn", code: "EARLIER_REV_NOT_ADDED", message: `${pn}: the file has ${n} line(s) of earlier revision(s) ${revs}, but the note is already in the vault and was left as it is (BOM-026), so they were not added. Nothing was dropped from the file: \"Update an existing vault from a BOM\" lists them as an addition to the note body.` });
    else findings.push({ level: "info", code: "EARLIER_REV_KEPT", message: `${pn}: ${n} line(s) of earlier revision(s) ${revs} are kept in the note under "Earlier revisions of this assembly" (D-0056).` });
  }
  let usageCount = 0, drawingCount = 0;
  for (const pn of [...partPns, ...newDrawings.filter((x) => !partPns.includes(x))]) {
    const inf = info.get(pn)!; if (!inf.fresh) continue;
    const l = latest.get(pn)!, isDoc = !partPns.includes(pn), cls = isDoc ? "Document" : "Object";
    const kids = (byParent.get(pn) ?? []).slice().sort((a, b) => lineKey(a) - lineKey(b) || a.row - b.row), scope = new IdentScope();
    const body: string[] = [], flags: string[] = [], srcLines: string[] = [];
    const decl: string[] = [];
    if (!isDoc) {
      decl.push(`        attribute partNumber = ${JSON.stringify(pn)};`); if (l.rev) decl.push(`        ${bomAttr("revision", l.rev)}`);
      if (l.source) decl.push(`        ${bomAttr("source", l.source)}`);
      if (l.drawingLocation) decl.push(`        ${bomAttr("drawingLocation", l.drawingLocation)}`);
      for (const u of kids) {
        if (bomIsDrawing(u)) { drawingCount++; const dn = info.get(u.child); if (dn) decl.push(`        ref item ${scope.take(bomIdent(u.childName, u.child))} : ${bomDocSymOf(dn.id, u.child)};`); continue; }
        usageCount++;
        const cinf = info.get(u.child), name = scope.take(bomIdent(u.childName, u.child)), discrete = BOM_DISCRETE.has(u.unit.toLowerCase()) && /^\d+$/.test(u.amount) && +u.amount > 0;
        const props: string[] = [];
        if (u.line) props.push(bomAttr("line", u.line)); props.push(bomAttr("childRevision", u.childRev));
        if (!discrete && u.amount) { props.push(bomAttr("quantity", u.amount)); if (u.unit) props.push(bomAttr("unit", u.unit)); else if (!/^\d+$/.test(u.amount)) findings.push({ level: "warn", code: "QTY_NO_UNIT", message: `Row ${u.row}: quantity ${u.amount} for ${u.child} has no unit; none was assumed.` }); }
        if (!discrete && u.amount === "0") findings.push({ level: "warn", code: "QTY_ZERO", message: `Row ${u.row}: ${u.child} under ${u.parent} has quantity 0 and is not a drawing line.` });
        if (u.refDes) props.push(bomAttr("refDes", u.refDes)); if (u.from) props.push(bomAttr("effectiveFrom", u.from)); if (u.to) props.push(bomAttr("effectiveTo", u.to));
        if (u.ssc) props.push(bomAttr("ssc", u.ssc)); if (u.notes) props.push(bomAttr("notes", u.notes));
        const mult = discrete && u.amount !== "1" ? ` [${u.amount}]` : "";
        decl.push(`        part ${name} : ${cinf ? bomSymOf(cinf.id, u.child) : "P_" + u.child.replace(/[^A-Za-z0-9]/g, "_")}${mult} {`, ...props.map((p) => `            ${p}`), "        }");
        const lc = latest.get(u.child);
        if (lc && lc.rev !== u.childRev) flags.push(flagCallout("flagConflict", `Pins ${u.child} at an older revision`, link, [`Line ${u.line || "?"} pins revision ${JSON.stringify(u.childRev)} of ${u.child}; its latest revision is ${JSON.stringify(lc.rev)}.`]));
        if (u.alternates.length || u.altParts.length) srcLines.push(`- Alternates for line ${u.line || "?"} (${u.child}): ${[...u.alternates.map((a) => [a.mfr, a.mpn].filter(Boolean).join(" ")), ...u.altParts.map((a) => `part ${a.pn}${a.rev ? " revision " + JSON.stringify(a.rev) : ""}${a.name ? " (" + a.name + ")" : ""}${[a.mfr, a.mpn].some(Boolean) ? ", " + [a.mfr, a.mpn].filter(Boolean).join(" ") : ""}${a.amount ? ", quantity " + a.amount + (a.unit ? " " + a.unit : "") : ""}, line ${a.line}, row ${a.row}`)].join("; ")}`);
        if (u.prevChild) srcLines.push(`- Line ${u.line || "?"}: part number was ${u.prevChild} before this release (struck out in the redline); now ${u.child}.`);
      }
    }
    if (!isDoc) for (const old of [...(replaces.get(pn) ?? [])].sort()) decl.push(`        dependency from ${bomSymOf(inf.id, pn)} to ${info.get(old) ? bomSymOf(info.get(old)!.id, old) : "P_" + old.replace(/[^A-Za-z0-9]/g, "_")}; // supersedes`);
    // D-0056 (BOM-028): manufacturer data is added from every line that uses the part, not only the first. Number 1 stays the first line's own manufacturer; an exact repeat of a pair is written once.
    const srcSeen = new Set<string>(), srcAll: Src[] = [];
    for (const u of parsed.usages) if (u.child === pn) for (const s of [...(u.ownSrc ? [u.ownSrc] : []), ...u.alternates]) { if (!s.mfr && !s.mpn) continue; const k = `${s.mfr.toLowerCase()}\0${s.mpn.toLowerCase()}`; if (!srcSeen.has(k)) { srcSeen.add(k); srcAll.push(s); } }
    const sources = srcAll;
    const sysml = isDoc ? `package ${inf.id.replace("-", "_")} {\n    item def D_${pn.replace(/[^A-Za-z0-9]/g, "_")};\n}\n` : `package ${inf.id.replace("-", "_")} {\n    part def P_${pn.replace(/[^A-Za-z0-9]/g, "_")} {\n${decl.join("\n")}\n    }\n}\n`;
    const head = [`- BOM Part Number: ${pn}`, ...(l.name ? [`- Name: ${l.name}`] : []), `- BOM source: ${o.sourceName} (SHA-256 ${o.fingerprint})`, ...(l.rev ? [`- Revision: ${JSON.stringify(l.rev)} (as exported)`] : [`- No BOM lists this part number; it is named as the previous number of ${[...new Set(stubs.get(pn) ?? [])].join(", ")}.`])];
    if (l.source) head.push(`- Source: ${l.source}`);
    const rs = revsSeen.get(pn); if (rs) head.push(`- Revisions in the BOM: ${rs.map((x) => JSON.stringify(x)).join(", ")}; the latest is ${JSON.stringify(l.rev)}`);
    if (l.drawingLocation) head.push(`- Drawing location: ${l.drawingLocation}`);
    const extra: Array<[string, string]> = [];
    sources.forEach((src, i) => { if (src.mfr) extra.push([`manufacturer${i + 1}`, src.mfr]); if (src.mpn) extra.push([`mfgPn${i + 1}`, src.mpn]); });
    if (!isDoc && earlierKeep) { const e = earlierText(pn); if (e.length) body.push("**Earlier revisions of this assembly**", "", "Lines the BOM gives for revisions older than the latest one above. They are kept as data from the file and are not part of the SysML structure.", "", ...e, ""); }
    for (const d of dupes.get(pn) ?? []) flags.push(flagCallout("flagValue", `Line ${d.kept.line} has two sets of values`, link, [`Kept (row ${d.kept.row}): ${d.kept.child} revision ${JSON.stringify(d.kept.childRev)}, quantity ${d.kept.amount || "-"} ${d.kept.unit}, from ${d.kept.from || "-"}, to ${d.kept.to || "-"}.`, `Other (row ${d.other.row}): ${d.other.child} revision ${JSON.stringify(d.other.childRev)}, quantity ${d.other.amount || "-"} ${d.other.unit}, from ${d.other.from || "-"}, to ${d.other.to || "-"}.`, `Review which applies.`]));
    files.push({ path: inf.path, content: bomStamp(renderNote({ type: cls, subtype: isDoc ? "" : "part", id: inf.id, uid: (o.update && existingBy.get(pn)?.uid) || uids.get((isDoc ? "d:" : "p:") + pn)!.uid, eaType: "BOM", title: pn,
      relFields: [], extraFields: extra, bodyText: body.join("\n"), ...(l.name ? { description: l.name } : {}), flags, sourceLines: [...head, ...srcLines], sysml,
      sourceRole: "authoritative-model", primarySymbol: isDoc ? bomDocSymOf(inf.id, pn) : bomSymOf(inf.id, pn) }), o.sourceName, o.runDate.slice(0, 10)) });
  }

  // EA <-> BOM join on part number: a report only, nothing is corrected on either side (BOM-004). The EA key is not settled, so
  // a title that contains the part number as a whole token counts as a match.
  let eaMatched = 0;
  if (o.eaTitles && o.eaTitles.length) {
    const lower = o.eaTitles.map((t) => t.toLowerCase());
    const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const pn of partPns) { const re = new RegExp(`(^|[^a-z0-9])${esc(pn.toLowerCase())}($|[^a-z0-9])`); const hit = lower.filter((t) => re.test(t)).length; if (hit === 1) eaMatched++; else if (hit > 1) findings.push({ level: "warn", code: "EA_AMBIGUOUS", message: `${pn} appears in ${hit} EA element names; no join was made.` }); }
    findings.push({ level: "info", code: "EA_JOIN", message: `EA to BOM: ${eaMatched} of ${partPns.length} BOM part numbers appear in exactly one EA element name, alias or PN tag; ${partPns.length - eaMatched} are BOM-only by that test. The EA-side key for a part number is not decided, so this is a report, not a link.` });
  }
  const existingN = new Set([...partPns, ...[...drawingPns].filter((x) => latest.has(x))].filter((pn) => existingBy.has(pn))).size;
  if (otherRev.size && !o.update) findings.push({ level: "info", code: "EXISTING_OTHER_REV", message: `${otherRev.size} assembl${otherRev.size === 1 ? "y is" : "ies are"} already in the vault at a different revision than this file's latest; their lines were not compared.${HINT_UPDATE}` });
  if (existingN && !o.update) findings.push({ level: "info", code: "EXISTING", message: `${existingN} part number(s) already have a note in the vault and were left as they are.` });
  const label = o.runDate.slice(0, 16).replace("T", " ").replace(":", ".");
  const order = { error: 0, warn: 1, info: 2 } as const;
  const sorted = findings.slice().sort((a, b) => order[a.level] - order[b.level]);
  // BOM-027: the findings note shows the first 40 rows of each code and the count of the rest; the callouts in the notes hold the detail
  const shown = new Map<string, number>(), total = new Map<string, number>(); for (const f of sorted) total.set(f.code, (total.get(f.code) ?? 0) + 1);
  const grouped: Finding[] = [];
  for (const f of sorted) { const n = (shown.get(f.code) ?? 0) + 1; shown.set(f.code, n); if (n <= 40) grouped.push(f); else if (n === 41) grouped.push({ level: f.level, code: f.code, message: `… and ${total.get(f.code)! - 40} more with this code (not listed; the count is in the summary).` }); }
  files.push({ path: `99_System/11_Import/BOM Findings ${label}.md`, content: `# BOM Findings ${label}\n\nSource \`${o.sourceName}\` (${parsed.layout} layout), SHA-256 \`${o.fingerprint}\`.\n\n| Level | Code | Finding |\n|---|---|---|\n${grouped.map((f) => `| ${f.level} | ${f.code} | ${f.message.replace(/\|/g, "\\|")} |`).join("\n") || "| | | none |"}\n${skippedSection(parsed.skipped)}` });
  const freshParts = newParts.length;
  return { status: "WRITE_READY", files, findings: sorted, problems,
    summary: { layout: parsed.layout, rows: parsed.usages.length, parts: freshParts, usages: usageCount, drawings: drawingCount, alternates, skippedParts: undetermined.size, existing: existingN, conflicts, eaMatched, bomOnly: eaMatched ? partPns.length - eaMatched : 0 } };
}
