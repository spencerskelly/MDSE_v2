/* The Product BOM report (D-0148): an indented bill of materials for one product, read from the vault notes. Plain data; the Excel writer and the Workbench command draw it.
 * It reads what the notes hold and computes nothing the BOM does not state: quantities are per parent (as in the BOM), not rolled up. */
import type { ModelIndex, Note } from "./index.ts";
import { outgoing } from "./index.ts";
import { qtyOf, measuredOf } from "./views.ts";
import { plmRevisionChain } from "./edit_plm.ts";

export interface BomSource { manufacturer: string; mpn: string }
export interface BomReportRow {
  /** 0 for the product itself, 1 for its direct parts, and so on */
  level: number; path: string | null; partNumber: string; description: string;
  /** quantity of this line in its parent; null for the product row */
  qty: number | null; unit: string; revision: string; category: string; makeBuy: string; sources: BomSource[];
  /** why the row is not a normal part: "not in vault" (a usage names a part with no note) or "cycle" (the part contains itself; not expanded) */
  problem: "" | "not in vault" | "cycle";
}
export interface BomReport { rows: BomReportRow[]; root: string; truncated: boolean; documentLines: number }
export interface BomReportOptions { maxDepth?: number; maxRows?: number }

const text = (v: unknown): string => String(v ?? "").trim();
/** The part number's own note: the note whose file name is the part number (a revision note carries `partNumber` and specializes it). */
const pnNote = (ix: ModelIndex, n: Note): Note | undefined => { const pn = text(n.meta.partNumber); return pn ? ix.notes.get(ix.byName.get(pn.toLowerCase()) ?? "") : undefined; };
/** A property from the note, else from the note of its part number (BOM-035 splits them: the revision note holds description and sources, the part number's note holds category and make/buy). */
const attr = (ix: ModelIndex, n: Note, k: string): string => text(n.meta[k]) || text(pnNote(ix, n)?.meta[k]);
export function sourcesOf(n: Note): BomSource[] {
  const out: BomSource[] = [];
  for (let i = 1; i <= 20; i++) { const m = text(n.meta[`manufacturer${i}`]), p = text(n.meta[`mfgPn${i}`]); if (m || p) out.push({ manufacturer: m, mpn: p }); }
  return out;
}
const rowOf = (ix: ModelIndex, n: Note, level: number, qty: number | null, unit: string): BomReportRow => ({
  level, path: n.path, partNumber: text(n.meta.partNumber) || n.name, description: attr(ix, n, "description") || n.title, qty, unit,
  revision: text(n.meta.revision), category: attr(ix, n, "bomCategory"), makeBuy: attr(ix, n, "makeBuy"),
  sources: sourcesOf(n).length ? sourcesOf(n) : sourcesOf(pnNote(ix, n) ?? n), problem: "",
});

/** The note that holds a part's structure lines: the note itself, or, for a part number's note, its highest revision that has parts (BOM-047: structure lives in the revision notes). */
const holder = (ix: ModelIndex, path: string): string => {
  const hasParts = (p: string): boolean => (ix.out.get(p) ?? []).some((e) => e.kind === "hasPart");
  if (hasParts(path)) return path;
  const n = ix.notes.get(path); if (!n) return path;
  const chain = plmRevisionChain(ix, n).filter((x) => x.path !== path && hasParts(x.path));
  return chain.length ? chain[chain.length - 1]!.path : path;
};

/** Lines with a quantity of 0 are document lines (drawings) and are left out and counted. */
export function bomReport(ix: ModelIndex, root: string, o: BomReportOptions = {}): BomReport {
  const maxDepth = o.maxDepth ?? 20, maxRows = o.maxRows ?? 50000, rn = ix.notes.get(root);
  if (!rn) throw new Error(`No note at ${root}`);
  const rows: BomReportRow[] = [rowOf(ix, rn, 0, null, "")]; let truncated = false, documentLines = 0;
  const walk = (p: string, level: number, stack: string[]): void => {
    for (const e of outgoing(ix, holder(ix, p))) {
      if (e.kind !== "hasPart") continue;
      const m = measuredOf(e.detail), qty = m ? m.qty : qtyOf(e.label), unit = m ? m.unit : "";
      if (qty === 0) { documentLines++; continue; }
      if (rows.length >= maxRows) { truncated = true; return; }
      if (!e.to) { rows.push({ level, path: null, partNumber: e.toSymbol, description: "", qty, unit, revision: "", category: "", makeBuy: "", sources: [], problem: "not in vault" }); continue; }
      const n = ix.notes.get(e.to); if (!n) continue;
      const row = rowOf(ix, n, level, qty, unit);
      if (stack.includes(e.to) || p === e.to) { row.problem = "cycle"; rows.push(row); continue; }
      rows.push(row);
      if (level < maxDepth) walk(e.to, level + 1, [...stack, p]); else truncated = true;
    }
  };
  walk(root, 1, [root]);
  return { rows, root, truncated, documentLines };
}

export const BOM_REPORT_COLUMNS = ["Level", "Part Number", "Description", "Qty", "Unit", "Revision", "Category", "Make/Buy", "Manufacturer", "Manufacturer Part Number", "Note"] as const;
/** Excel turns 07802 into 7802 and 5-10 into a date when it opens a CSV. A value Excel would read as a number or date is written as ="value", which Excel keeps as text. */
const REPORT_EXCEL_RISK = /^[0-9.\-\/:+ ]+$|^[0-9.]+e[+-]?\d+$/i;
const reportCell = (v: string | number, text = false): string => { const s = String(v), q = `"${s.replace(/"/g, '""')}"`; return text && REPORT_EXCEL_RISK.test(s) ? `="${s.replace(/"/g, '""')}"` : q; };
/** The report as CSV for Excel: a UTF-8 byte-order mark, CRLF lines, every field quoted, part numbers kept as text. Several sources on one line are joined with "; " in the same order in both columns. */
export function bomReportCsv(r: BomReport): string {
  const lines = [BOM_REPORT_COLUMNS.map((c) => reportCell(c)).join(",")];
  for (const x of r.rows) {
    lines.push([reportCell(x.level), reportCell(x.partNumber, true), reportCell(x.description), reportCell(x.qty ?? ""), reportCell(x.unit), reportCell(x.revision, true), reportCell(x.category), reportCell(x.makeBuy),
      reportCell(x.sources.map((s) => s.manufacturer).join("; ")), reportCell(x.sources.map((s) => s.mpn).join("; "), true), reportCell(x.problem)].join(","));
  }
  if (r.truncated) lines.push(reportCell("The report is cut off: the row or depth limit was reached."));
  return "﻿" + lines.join("\r\n") + "\r\n";
}
