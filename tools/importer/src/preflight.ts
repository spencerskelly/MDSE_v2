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
/** What becomes of the source rows. `nonStandard` rows are imported, but a value did not follow the standard (a subtype or author that had to be defaulted, a type
 *  that did not resolve, a link only provisionally placed): nothing is lost, something is a guess. `mayBeLost` rows are not in the model at all: only a flag or the
 *  holding note keeps them, so they are lost if nobody resolves the flag. */
export interface Fate {
  clean: number; merged: number;
  nonStandard: { total: number; codes: Array<{ code: string; count: number }> };
  mayBeLost: { total: number; deferred: number; skippedByError: number };
  textOnly: number; excludedByPolicy: number;
}
/** Where the model notes would sit (MOD-174): how deep the folders go, what a depth cap would move, and how long the paths are. BOM notes are flat and left out. */
export interface Layout {
  notes: number;
  byDepth: Array<{ depth: number; notes: number }>;
  caps: Array<{ cap: number; moved: number; folders: number }>;
  longest: { length: number; path: string };
  over260: number; over400: number;
}
export interface Preflight {
  fate: Fate;
  layout: Layout;
  verdict: "BLOCKED" | "REVIEW" | "FLAGS" | "CLEAN";
  reasons: string[];
  flagTotal: number;
  byType: Record<string, number>;
  groups: FlagGroup[];
  deferred: Array<{ code: string; kind: string; count: number }>;
  rows: Array<{ type: string; title: string; path: string }>;
}

/** Diagnostic codes on a native row that mean a value was defaulted, guessed or left unresolved. Others on native rows (UNVERIFIED_SYNTAX, AUTHOR_DERIVED, ...) are bookkeeping. */
export const NON_STANDARD = /^(SUBTYPE_DEFAULTED_|AUTHOR_FALLBACK|UNRESOLVED_|MULTIPLICITY_UNPARSED|PROVISIONAL_LINK|REVIEW$|PORT_ADDED_TO_BLOCK|DIRECTION_)/;
const FLAG = /^> \[!(flag\w+)\] (.*)$/gm;
/** The same kind of flag with a different name in it is one group: names in backticks and numbers are blanked. */
export const flagShape = (title: string): string => title.replace(/`[^`]*`/g, "`…`").replace(/^(Unresolved \S+ link) to .*$/, "$1").replace(/\d+/g, "#").trim();

/** Paths are relative to the vault, so the real length is longer by the vault's own location. */
export function layoutOf(files: OutFile[]): Layout {
  const model = files.filter((f) => !f.bytes && /\.md$/i.test(f.path) && !/^(99_System|BOM)\//.test(f.path)), depthOf = (p: string): number => p.split("/").length - 1;
  const hist = new Map<number, number>(); let longest = { length: 0, path: "" }, over260 = 0, over400 = 0;
  for (const f of model) { const d = depthOf(f.path); hist.set(d, (hist.get(d) ?? 0) + 1); if (f.path.length > longest.length) longest = { length: f.path.length, path: f.path }; if (f.path.length > 260) over260++; if (f.path.length > 400) over400++; }
  const caps = [2, 3, 4, 5, 6].map((cap) => ({ cap, moved: model.filter((f) => depthOf(f.path) > cap).length, folders: new Set(model.map((f) => f.path.split("/").slice(0, Math.min(cap, depthOf(f.path))).join("/"))).size }));
  return { notes: model.length, byDepth: [...hist].map(([depth, notes]) => ({ depth, notes })).sort((a, b) => a.depth - b.depth), caps, longest, over260, over400 };
}

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
  const fate: Fate = { clean: 0, merged: 0, nonStandard: { total: 0, codes: [] }, mayBeLost: { total: 0, deferred: 0, skippedByError: 0 }, textOnly: 0, excludedByPolicy: 0 }, ns = new Map<string, number>();
  for (const r of i.ledger) {
    const code = (r.diagnostic_code || "").split(":")[0]!;
    if (r.disposition === "deferred_review") { fate.mayBeLost.deferred++; fate.mayBeLost.total++; }
    else if (r.disposition === "error") { fate.mayBeLost.skippedByError++; fate.mayBeLost.total++; }
    else if (r.disposition === "evidence_only") fate.textOnly++;
    else if (r.disposition === "excluded_by_policy") fate.excludedByPolicy++;
    else if (r.disposition === "alias_merged") fate.merged++;
    else if (NON_STANDARD.test(code)) { fate.nonStandard.total++; ns.set(code, (ns.get(code) ?? 0) + 1); }
    else fate.clean++;
  }
  fate.nonStandard.codes = [...ns].map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count);
  const deferred = [...def.values()].sort((a, b) => b.count - a.count);
  const deferredTotal = deferred.reduce((a, d) => a + d.count, 0);
  const reasons: string[] = [], block: string[] = [], review: string[] = [];
  if (i.status === "FAILED") block.push("The EA translation failed and would write nothing.");
  for (const p of i.problems) block.push(p);
  for (const e of i.bomErrors) block.push("BOM: " + e);
  if (i.badPaths.length) block.push(`${i.badPaths.length} file name(s) the browser or Windows would refuse, for example ${i.badPaths[0]}.`);
  if (i.errors) review.push(`${i.errors} EA row(s) raised an exception and would be skipped.`);
  if (i.conflicts) review.push(`${i.conflicts} note(s) were edited in the vault and in the source; the vault copy would stay and a conflict flag be written.`);
  if (i.existingDiffers) review.push(`${i.existingDiffers} BOM part(s) already in the vault differ from this sheet; the vault copy would stay. To bring the sheet's changes in, use "Update an existing vault from a BOM".`);
  if (i.elements > 0 && deferredTotal / i.elements > 0.1) review.push(`${deferredTotal} of ${i.elements} EA elements (${Math.round((100 * deferredTotal) / i.elements)}%) would be deferred for review. That is more than 10%, which usually means the wrong export or an unexpected model shape.`);
  if (i.bomSkipped) review.push(`${i.bomSkipped} BOM part(s) or line(s) would be skipped (an undetermined revision, a repeated line or competing BOMs). The findings file lists them.`);
  if (i.bomWarnings > 50) review.push(`${i.bomWarnings} BOM warnings; open the findings list before importing.`);
  reasons.push(...block, ...review);
  const verdict = block.length ? "BLOCKED" : review.length ? "REVIEW" : rows.length || deferredTotal ? "FLAGS" : "CLEAN";
  return { fate, layout: layoutOf(i.files), verdict, reasons, flagTotal: rows.length, byType, groups: [...groups.values()].sort((a, b) => b.count - a.count), deferred, rows };
}

/** CSV of every flag the run would write, for review before the import. */
export function preflightCsv(p: Preflight): string {
  const q = (v: string): string => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return ["flag,title,note", ...p.rows.map((r) => [r.type, r.title, r.path].map(q).join(","))].join("\n") + "\n";
}
