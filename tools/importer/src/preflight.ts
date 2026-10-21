/* Preflight: what an import would flag, found before anything is written. Pure: it reads the files, ledger and findings a dry run already
 * produced, so the list is exactly what the real run writes. The verdict says whether to import, look first, or stop (IMP-124). */
import type { OutFile } from "./merge.ts";

export interface FlagGroup { type: string; title: string; count: number; example: string }
export interface PreflightInput {
  files: OutFile[];
  ledger: Array<{ disposition: string; diagnostic_code: string; ea_type: string }>;
  status: string;                                   // the EA run's status, or "" when there is no QEAX
  elements: number;
  errors: number;                                   // EA rows that raised an exception and were skipped
  problems: string[];                               // EA and BOM problems that stop the run
  bomErrors: string[];                              // the sheet cannot be read at all (layout, columns, empty)
  bomSkipped?: number;                              // lines or parts the sheet describes but the import would skip
  bomWarnings: number;
  conflicts: number;                                // EA notes edited in the vault and in the source
  existingDiffers: number;                          // BOM parts already in the vault that the sheet describes differently
  badPaths: string[];                               // names the browser or Windows would refuse
}
export interface Preflight {
  verdict: "BLOCKED" | "REVIEW" | "FLAGS" | "CLEAN";
  reasons: string[];
  flagTotal: number;
  byType: Record<string, number>;
  groups: FlagGroup[];
  deferred: Array<{ code: string; kind: string; count: number }>;
  rows: Array<{ type: string; title: string; path: string }>;
}

const FLAG = /^> \[!(flag\w+)\] (.*)$/gm;
/** The same kind of flag with a different name in it is one group: names in backticks and numbers are blanked. */
export const flagShape = (title: string): string => title.replace(/`[^`]*`/g, "`…`").replace(/^(Unresolved \S+ link) to .*$/, "$1").replace(/\d+/g, "#").trim();

export function preflight(i: PreflightInput): Preflight {
  const rows: Preflight["rows"] = [], groups = new Map<string, FlagGroup>(), byType: Record<string, number> = {};
  for (const f of i.files) {
    if (f.bytes || !/\.md$/i.test(f.path) || /^99_System\//.test(f.path)) continue;
    for (const m of f.content.matchAll(FLAG)) {
      const type = m[1]!.replace(/^flag/, ""), title = m[2]!.trim();
      rows.push({ type, title, path: f.path }); byType[type] = (byType[type] ?? 0) + 1;
      const key = type + "|" + flagShape(title), g = groups.get(key);
      if (g) g.count++; else groups.set(key, { type, title: flagShape(title), count: 1, example: f.path });
    }
  }
  const def = new Map<string, { code: string; kind: string; count: number }>();
  for (const r of i.ledger) if (r.disposition === "deferred_review" || r.disposition === "error") {
    const code = r.diagnostic_code || "(no code)", k = code + "|" + r.ea_type, cur = def.get(k);
    if (cur) cur.count++; else def.set(k, { code, kind: r.ea_type, count: 1 });
  }
  const deferred = [...def.values()].sort((a, b) => b.count - a.count);
  const deferredTotal = deferred.reduce((a, d) => a + d.count, 0);
  const reasons: string[] = [], block: string[] = [], review: string[] = [];
  if (i.status === "FAILED") block.push("The EA translation failed and would write nothing.");
  for (const p of i.problems) block.push(p);
  for (const e of i.bomErrors) block.push("BOM: " + e);
  if (i.badPaths.length) block.push(`${i.badPaths.length} file name(s) the browser or Windows would refuse, for example ${i.badPaths[0]}.`);
  if (i.errors) review.push(`${i.errors} EA row(s) raised an exception and would be skipped.`);
  if (i.conflicts) review.push(`${i.conflicts} note(s) were edited in the vault and in the source; the vault copy would stay and a conflict flag be written.`);
  if (i.existingDiffers) review.push(`${i.existingDiffers} BOM part(s) already in the vault differ from this sheet; the vault copy would stay.`);
  if (i.elements > 0 && deferredTotal / i.elements > 0.1) review.push(`${deferredTotal} of ${i.elements} EA elements (${Math.round((100 * deferredTotal) / i.elements)}%) would be deferred for review. That is more than 10%, which usually means the wrong export or an unexpected model shape.`);
  if (i.bomSkipped) review.push(`${i.bomSkipped} BOM part(s) or line(s) would be skipped (an undetermined revision, a repeated line or competing BOMs). The findings file lists them.`);
  if (i.bomWarnings > 50) review.push(`${i.bomWarnings} BOM warnings; open the findings list before importing.`);
  reasons.push(...block, ...review);
  const verdict = block.length ? "BLOCKED" : review.length ? "REVIEW" : rows.length || deferredTotal ? "FLAGS" : "CLEAN";
  return { verdict, reasons, flagTotal: rows.length, byType, groups: [...groups.values()].sort((a, b) => b.count - a.count), deferred, rows };
}

/** CSV of every flag the run would write, for review before the import. */
export function preflightCsv(p: Preflight): string {
  const q = (v: string): string => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return ["flag,title,note", ...p.rows.map((r) => [r.type, r.title, r.path].map(q).join(","))].join("\n") + "\n";
}
