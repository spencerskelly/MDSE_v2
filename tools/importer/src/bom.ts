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
import { renderNote, flagCallout } from "./notes.ts";
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
export interface Usage {
  parent: string; parentRev: string; line: string; child: string; childRev: string; childName: string; childSource: string; childState: string;
  amount: string; unit: string; refDes: string; from: string; to: string; ssc: string; notes: string; row: number; alternates: Src[]; ownSrc: Src | null; drawingLocation: string; prevChild: string;
}
export interface ParentObs { pn: string; rev: string; name: string; source: string; state: string; drawingLocation: string }
export interface Parsed { layout: "flat" | "redline"; usages: Usage[]; parents: ParentObs[]; findings: Finding[] }

function bomColMap(header: Array<Cell | null | undefined>): Map<string, number> {
  const m = new Map<string, number>(); header.forEach((c, i) => { const k = bomNorm(bomTxt(c)); if (k && !m.has(k)) m.set(k, i); }); return m;
}
const BOM_FLAT_REQ = ["parentpartnumber", "childpartnumber", "linenumber", "amount", "unit"];

export function detectLayout(grid: Grid): { layout: "flat" | "redline" | null; headerRow: number; missing: string[] } {
  for (let r = 0; r < Math.min(grid.length, 15); r++) {
    const m = bomColMap(grid[r] ?? []);
    if (m.has("parentpartnumber") && m.has("childpartnumber")) return { layout: "flat", headerRow: r, missing: BOM_FLAT_REQ.filter((k) => !m.has(k)) };
    if (m.has("number") && m.has("cl1") && m.has("cl2") && [...m.keys()].some((k) => /^[0-7]$/.test(k) || k === "structure")) return { layout: "redline", headerRow: r, missing: ["linenumber", "quantity", "unit"].filter((k) => !m.has(k)) };
  }
  return { layout: null, headerRow: -1, missing: [] };
}

const bomGet = (row: Array<Cell | null | undefined>, m: Map<string, number>, ...keys: string[]): string => { for (const k of keys) { const i = m.get(k); if (i !== undefined) { const v = bomTxt(row[i]); if (v) return v; } } return ""; };

export function parseBom(grid: Grid): Parsed {
  const d = detectLayout(grid), findings: Finding[] = [];
  if (!d.layout) return { layout: "flat", usages: [], parents: [], findings: [{ level: "error", code: "BOM_LAYOUT", message: "No header row found. A flat BOM needs Parent Part Number and Child Part Number columns; a redline needs Number, CL1, CL2 and level columns 0..7 or Structure." }] };
  if (d.missing.length) findings.push({ level: "error", code: "BOM_COLUMNS", message: `Missing column(s): ${d.missing.join(", ")}.` });
  const m = bomColMap(grid[d.headerRow]!), usages: Usage[] = [], parents: ParentObs[] = [];
  const blank = (u: Partial<Usage>): Usage => ({ parent: "", parentRev: "", line: "", child: "", childRev: "", childName: "", childSource: "", childState: "", amount: "", unit: "", refDes: "", from: "", to: "", ssc: "", notes: "", row: 0, alternates: [], ownSrc: null, drawingLocation: "", prevChild: "", ...u });
  if (d.layout === "flat") {
    let last: Usage | null = null;
    for (let r = d.headerRow + 1; r < grid.length; r++) {
      const row = grid[r] ?? []; if (!row.some((c) => bomTxt(c))) continue;
      const parent = bomGet(row, m, "parentpartnumber"), child = bomGet(row, m, "childpartnumber"), mfr = bomGet(row, m, "manufacturer", "childmanufacturer"), mpn = bomGet(row, m, "manufacturerpartnumber", "childmanufacturerpartnumber");
      if (!child) {   // BOM-003 / BOM-013: blank PN + manufacturer part number = alternate of the line above
        if (mpn && last && last.parent === parent && last.parentRev === bomGet(row, m, "parentcl1") + bomGet(row, m, "parentcl2")) { last.alternates.push({ mfr, mpn }); continue; }
        findings.push({ level: "warn", code: mpn ? "ALT_NO_PRIMARY" : "ROW_NO_CHILD", message: `Row ${r + 1}: no child part number${mpn ? " and no unambiguous primary line above; review only" : ""}.` }); continue;
      }
      const u = blank({ parent, parentRev: bomGet(row, m, "parentcl1") + bomGet(row, m, "parentcl2"), line: bomGet(row, m, "linenumber"), child, childRev: bomGet(row, m, "childcl1") + bomGet(row, m, "childcl2"), childName: bomGet(row, m, "childname"),
        childSource: bomGet(row, m, "childsource"), childState: bomGet(row, m, "childstate"), amount: bomGet(row, m, "amount", "quantity"), unit: bomGet(row, m, "unit"), refDes: bomGet(row, m, "referencedesignator"), from: bomGet(row, m, "from"), to: bomGet(row, m, "to"),
        ssc: bomGet(row, m, "ssc"), notes: bomGet(row, m, "cildnotes", "childnotes"), row: r + 1, ownSrc: mpn || mfr ? { mfr, mpn } : null });
      if (!parent) { findings.push({ level: "warn", code: "ROW_NO_PARENT", message: `Row ${r + 1}: no parent part number; skipped.` }); continue; }
      parents.push({ pn: parent, rev: u.parentRev, name: bomGet(row, m, "parentpartname"), source: bomGet(row, m, "parentsource"), state: bomGet(row, m, "parentstate"), drawingLocation: "" });
      usages.push(u); last = u;
    }
    return { layout: "flat", usages, parents, findings };
  }
  // redline: the parent of a row is the nearest row above it one level up (the 0..7 columns match Structure)
  const levelCols = [...m.entries()].filter(([k]) => /^[0-7]$/.test(k)).map(([k, i]) => [+k, i] as const).sort((a, b) => a[0] - b[0]);
  const stack: Array<{ pn: string; rev: string } | undefined> = []; let last: Usage | null = null;
  for (let r = d.headerRow + 1; r < grid.length; r++) {
    const row = grid[r] ?? []; if (!row.some((c) => bomTxt(c))) continue;
    let level = levelCols.find(([, i]) => bomTxt(row[i]))?.[0] ?? -1;
    if (level < 0) { const s = bomGet(row, m, "structure"); if (/^\d+$/.test(s)) level = +s; }
    const num = bomCurPrev(row[m.get("number") ?? -1]), mfr = bomGet(row, m, "manufacturer"), mpn = bomGet(row, m, "manufacturerpartnumber");
    if (!num.cur && !num.prev) {   // blank number: an alternate source of the line above (BOM-013)
      if ((mfr || mpn) && last) last.alternates.push({ mfr, mpn }); else findings.push({ level: "warn", code: "ALT_NO_PRIMARY", message: `Row ${r + 1}: blank part number and nothing above it to attach to; review only.` }); continue;
    }
    if (level < 0) { findings.push({ level: "warn", code: "ROW_NO_LEVEL", message: `Row ${r + 1}: no level; skipped.` }); continue; }
    if (!num.cur) { findings.push({ level: "info", code: "LINE_REMOVED", message: `Row ${r + 1}: part number ${num.prev} is struck out with no replacement; the line is removed in this release and was not imported.` }); stack[level] = undefined; continue; }
    const name = bomCurPrev(row[m.get("name") ?? -1]).cur, cl1 = bomCurPrev(row[m.get("cl1") ?? -1]).cur, cl2 = bomCurPrev(row[m.get("cl2") ?? -1]).cur, rev = cl1 + cl2;
    stack.length = level + 1; stack[level] = { pn: num.cur, rev };
    const dl = bomGet(row, m, "drawinglocation");
    if (level === 0) { parents.push({ pn: num.cur, rev, name, source: "", state: "", drawingLocation: dl }); last = null; continue; }
    const p = stack[level - 1];
    if (!p) { findings.push({ level: "warn", code: "ROW_NO_PARENT", message: `Row ${r + 1}: level ${level} with no row above at level ${level - 1}; skipped.` }); continue; }
    const q = bomCurPrev(row[m.get("quantity") ?? m.get("amount") ?? -1]), un = bomCurPrev(row[m.get("unit") ?? -1]);
    const u = blank({ parent: p.pn, parentRev: p.rev, line: bomCurPrev(row[m.get("linenumber") ?? -1]).cur, child: num.cur, childRev: rev, childName: name, amount: q.cur, unit: un.cur, row: r + 1, ownSrc: mpn || mfr ? { mfr, mpn } : null, drawingLocation: dl, prevChild: num.prev });
    usages.push(u); last = u;
    // a child that has lines below it is a parent of those; its own attributes are the ones just read
    parents.push({ pn: num.cur, rev, name, source: "", state: "", drawingLocation: dl });
  }
  // keep a parent observation only for part numbers that really have lines below them
  const hasKids = new Set(usages.map((u) => u.parent + "\0" + u.parentRev));
  return { layout: "redline", usages, parents: parents.filter((p) => hasKids.has(p.pn + "\0" + p.rev)), findings };
}

// ---- resolve and render ---------------------------------------------------------------------------------------------------
const BOM_DISCRETE = new Set(["", "ea", "each", "piece", "pieces", "pc", "pcs"]);
const bomIsDrawing = (u: Usage): boolean => /^dwg\b/i.test(u.childName);
const bomIsNum = (s: string): boolean => /^-?\d+(\.\d+)?$/.test(s);
const bomAttr = (name: string, v: string): string => `attribute ${name} = ${bomIsNum(v) && !/^-?0\d/.test(v) ? v : JSON.stringify(v)};`;
const bomSymOf = (id: string, pn: string): string => `${id.replace("-", "_")}::P_${pn.replace(/[^A-Za-z0-9]/g, "_")}`;
/** camelCase usage name from a part name. ALL-CAPS words are lowered first (CONNECTOR HOUSING -> connectorHousing); at most 40 characters. */
export function bomIdent(name: string, pn: string): string {
  const words = name.normalize("NFKD").replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").filter(Boolean).map((w) => (w === w.toUpperCase() ? w.toLowerCase() : w));
  let s = words.map((w, i) => (i ? w[0]!.toUpperCase() + w.slice(1) : w)).join("").slice(0, 40);
  if (!s) s = "p" + pn.replace(/[^A-Za-z0-9]/g, "");
  return usageIdent(/^[0-9]/.test(s) ? "p" + s : s, "part");
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
}
export interface BomResult {
  status: "WRITE_READY" | "FAILED"; files: OutFile[]; findings: Finding[]; problems: string[];
  summary: { layout: string; rows: number; parts: number; usages: number; drawings: number; alternates: number; skippedParts: number; existing: number; conflicts: number; eaMatched: number; bomOnly: number };
}

export function buildBom(grid: Grid, o: BomOptions): BomResult {
  const parsed = parseBom(grid), findings = [...parsed.findings], problems: string[] = [];
  const blocking = findings.some((f) => f.level === "error");
  const empty = { layout: parsed.layout, rows: parsed.usages.length, parts: 0, usages: 0, drawings: 0, alternates: 0, skippedParts: 0, existing: 0, conflicts: 0, eaMatched: 0, bomOnly: 0 };
  if (blocking || !parsed.usages.length) { if (!blocking) findings.push({ level: "error", code: "BOM_EMPTY", message: "The sheet has a header but no usable lines." }); return { status: "FAILED", files: [], findings, problems: findings.filter((f) => f.level === "error").map((f) => f.message), summary: empty }; }

  // observations per part number
  type Obs = { rev: string; name: string; source: string; state: string; drawingLocation: string };
  const asParent = new Map<string, Map<string, Obs>>(), asChild = new Map<string, Map<string, Obs>>();
  const put = (m: Map<string, Map<string, Obs>>, pn: string, rev: string, ob: Obs): void => { const r = m.get(pn) ?? m.set(pn, new Map()).get(pn)!; const cur = r.get(rev); if (!cur) r.set(rev, ob); else for (const k of Object.keys(ob) as Array<keyof Obs>) if (!cur[k] && ob[k]) cur[k] = ob[k]; };
  for (const p of parsed.parents) put(asParent, p.pn, p.rev, { rev: p.rev, name: p.name, source: p.source, state: p.state, drawingLocation: p.drawingLocation });
  for (const u of parsed.usages) put(asChild, u.child, u.childRev, { rev: u.childRev, name: u.childName, source: u.childSource, state: u.childState, drawingLocation: u.drawingLocation });
  const allPns = new Set([...asParent.keys(), ...asChild.keys()]);

  // BOM-006/007/009: the latest revision is the one the part has as an assembly; a leaf part has the one every parent pins
  const latest = new Map<string, Obs>(), undetermined = new Set<string>();
  for (const pn of [...allPns].sort()) {
    const pr = asParent.get(pn), cr = asChild.get(pn);
    const revs = pr ? [...pr.keys()] : cr ? [...cr.keys()] : [];
    if (revs.length === 1) {
      const base = (pr ?? cr)!.get(revs[0]!)!, name = base.name || cr?.get(revs[0]!)?.name || "";
      latest.set(pn, { ...base, name, source: base.source || cr?.get(revs[0]!)?.source || "", state: base.state || cr?.get(revs[0]!)?.state || "" });
    } else { undetermined.add(pn); findings.push({ level: "error", code: pr ? "COMPETING_BOMS" : "REV_UNDETERMINED", message: `${pn}: ${revs.length} revisions (${revs.map((x) => JSON.stringify(x)).join(", ")}) ${pr ? "are each the revision of an assembly with its own lines (BOM-002)" : "are pinned by different parents and the part is not an assembly here"}. The latest cannot be told, so the part and the lines that use or belong to it were not imported (BOM-009).` }); }
  }
  const drawingPns = new Set(parsed.usages.filter(bomIsDrawing).map((u) => u.child));
  // usages that can be written: parent and child both determined, no duplicate (parent, line)
  const okUsage: Usage[] = [], seenLine = new Set<string>(); let alternates = 0;
  for (const u of parsed.usages) {
    if (undetermined.has(u.parent) || (undetermined.has(u.child) && !bomIsDrawing(u))) continue;
    const lp = latest.get(u.parent)!;
    if (lp.rev !== u.parentRev) continue;
    const k = u.parent + "\0" + u.line;
    if (u.line && seenLine.has(k)) { findings.push({ level: "error", code: "DUP_LINE", message: `Row ${u.row}: parent ${u.parent} already has a line ${u.line}; the second was not imported (BOM-008).` }); continue; }
    seenLine.add(k); okUsage.push(u); alternates += u.alternates.length;
    if (!u.line) findings.push({ level: "warn", code: "NO_LINE", message: `Row ${u.row}: no line number for ${u.child} under ${u.parent}; the usage cannot be identified by line (BOM-008).` });
  }

  // existing notes by part number
  const existingBy = new Map<string, { id: string; base: string }>();
  for (const [p, t] of [...(o.existing?.files ?? []), ...o.pending]) {
    const m = /^- BOM Part Number: (.+)$/m.exec(t); if (!m) continue;
    const id = /^id: (\S+)$/m.exec(t)?.[1]; if (id) existingBy.set(m[1]!.trim(), { id, base: p.split("/").pop()!.replace(/\.md$/i, "") });
  }
  // identity: ids continue after the highest in the vault and in the pending EA files; uids avoid every uid there
  const highest = new Map<string, number>(), taken = new Set<string>();
  for (const [, t] of [...(o.existing?.files ?? []), ...o.pending]) {
    const id = /^id: ([A-Z]+)-(\d{5})\s*$/m.exec(t), uid = /^uid: (\d{17}\S{13})\s*$/m.exec(t);
    if (id) highest.set(id[1]!, Math.max(highest.get(id[1]!) ?? 0, +id[2]!)); if (uid) taken.add(uid[1]!);
  }
  const partPns = [...latest.keys()].filter((pn) => !drawingPns.has(pn) || okUsage.some((u) => u.child === pn && !bomIsDrawing(u))).sort();
  const newParts = partPns.filter((pn) => !existingBy.has(pn)), newDrawings = [...drawingPns].filter((pn) => !existingBy.has(pn) && latest.has(pn)).sort();
  const idReq = [...newParts.map((pn) => ({ key: "p:" + pn, prefix: o.classes["Object"]!.prefix, created: "", guid: pn })), ...newDrawings.map((pn) => ({ key: "d:" + pn, prefix: o.classes["Document"]!.prefix, created: "", guid: pn }))];
  const ids = allocateIds(idReq, highest);
  const uids = allocateUids(idReq.map((r) => ({ key: r.key, created: "", guid: r.guid, author: "" })), { authorMap: {}, fallbackCode: o.authorCode, unmappedNames: [""] }, taken, bomStampOf(o.runDate));
  const names = new NameRegistry([...(o.existing?.allPaths ?? []), ...(o.existing?.files.keys() ?? []), ...o.pending.map(([p]) => p)]);
  const dir = o.dir ?? "BOM";
  const info = new Map<string, { id: string; base: string; path: string; fresh: boolean }>();
  for (const pn of [...partPns, ...newDrawings.filter((x) => !partPns.includes(x))]) {
    const ex = existingBy.get(pn);
    if (ex) { info.set(pn, { id: ex.id, base: ex.base, path: "", fresh: false }); continue; }
    const l = latest.get(pn)!, key = (drawingPns.has(pn) && !partPns.includes(pn) ? "d:" : "p:") + pn;
    const path = names.claim(key.startsWith("d:") ? `${dir}/Drawings` : `${dir}/Parts`, safeName(pn, pn), ".md");
    info.set(pn, { id: ids.get(key)!, base: path.split("/").pop()!.replace(/\.md$/i, ""), path, fresh: true });
  }

  // children per parent, usage names, conflicts, older-revision users
  const link = `\`${o.sourceName}\``, files: OutFile[] = [];
  const byParent = new Map<string, Usage[]>(); for (const u of okUsage) (byParent.get(u.parent) ?? byParent.set(u.parent, []).get(u.parent)!).push(u);
  const lineKey = (u: Usage): number => (bomIsNum(u.line) ? +u.line : 1e12);
  const olderUsers = new Map<string, string[]>(); let conflicts = 0;
  for (const u of okUsage) {
    const l = latest.get(u.child); if (!l || bomIsDrawing(u)) continue;
    if (l.rev !== u.childRev) { conflicts++; (olderUsers.get(u.child) ?? olderUsers.set(u.child, []).get(u.child)!).push(`- [[${info.get(u.parent)?.base ?? u.parent}]] line ${u.line || "?"} pins revision ${JSON.stringify(u.childRev)}; the latest is ${JSON.stringify(l.rev)}.`); }
  }
  let usageCount = 0, drawingCount = 0;
  for (const pn of [...partPns, ...newDrawings.filter((x) => !partPns.includes(x))]) {
    const inf = info.get(pn)!; if (!inf.fresh) continue;
    const l = latest.get(pn)!, isDoc = !partPns.includes(pn), cls = isDoc ? "Document" : "Object";
    const kids = (byParent.get(pn) ?? []).slice().sort((a, b) => lineKey(a) - lineKey(b) || a.row - b.row), scope = new IdentScope();
    const body: string[] = [], flags: string[] = [], hasPart: string[] = [], refs: string[] = [], srcLines: string[] = [];
    const decl: string[] = [];
    if (!isDoc) {
      decl.push(`        ${bomAttr("partNumber", pn)}`, `        ${bomAttr("revision", l.rev)}`);
      if (l.source) decl.push(`        ${bomAttr("source", l.source)}`); if (l.state) decl.push(`        ${bomAttr("lifecycleState", l.state)}`);
      if (l.drawingLocation) decl.push(`        ${bomAttr("drawingLocation", l.drawingLocation)}`);
      for (const u of kids) {
        if (bomIsDrawing(u)) { drawingCount++; const dn = info.get(u.child); if (dn) refs.push(dn.base); continue; }
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
        if (cinf) hasPart.push(cinf.base);
        const lc = latest.get(u.child);
        if (lc && lc.rev !== u.childRev) flags.push(flagCallout("flagConflict", `Pins ${u.child} at an older revision`, link, [`Line ${u.line || "?"} pins revision ${JSON.stringify(u.childRev)} of ${u.child}; its latest revision is ${JSON.stringify(lc.rev)}.`]));
        if (u.alternates.length) srcLines.push(`- Alternates for line ${u.line || "?"} (${u.child}): ${u.alternates.map((a) => [a.mfr, a.mpn].filter(Boolean).join(" ")).join("; ")}`);
        if (u.prevChild) srcLines.push(`- Line ${u.line || "?"}: part number was ${u.prevChild} before this release (struck out in the redline); now ${u.child}.`);
      }
    }
    const firstUse = parsed.usages.find((u) => u.child === pn), own = firstUse?.ownSrc ?? null, alts = firstUse?.alternates ?? [];
    const sources = [...(own ? [own] : []), ...alts].filter((s) => s.mfr || s.mpn);
    const sysml = isDoc ? null : `package ${inf.id.replace("-", "_")} {\n    part def P_${pn.replace(/[^A-Za-z0-9]/g, "_")} {\n${decl.join("\n")}\n    }\n}\n`;
    const head = [`- BOM Part Number: ${pn}`, ...(l.name ? [`- Name: ${l.name}`] : []), `- BOM source: ${o.sourceName} (SHA-256 ${o.fingerprint})`, `- Revision: ${JSON.stringify(l.rev)} (as exported)`];
    if (l.source || l.state) head.push(`- Source / state: ${l.source || "-"} / ${l.state || "-"}`);
    if (l.drawingLocation) head.push(`- Drawing location: ${l.drawingLocation}`);
    if (sources.length) head.push(`- Manufacturer sources: ${sources.map((s, i) => `${i + 1}. ${[s.mfr, s.mpn].filter(Boolean).join(" ")}${i ? " (alternate)" : ""}`).join("; ")}`);
    if (l.name) body.push(l.name, "");
    const old = olderUsers.get(pn); if (old) body.push("## Used at an older revision", "", ...old);
    files.push({ path: inf.path, content: renderNote({ type: cls, subtype: isDoc ? "" : "part", id: inf.id, uid: uids.get((isDoc ? "d:" : "p:") + pn)!.uid, eaType: "BOM", title: pn,
      relFields: [...(hasPart.length ? [["hasPart", [...new Set(hasPart)]] as [string, string[]]] : []), ...(refs.length ? [["references", [...new Set(refs)]] as [string, string[]]] : [])], bodyText: body.join("\n"), flags, sourceLines: [...head, ...srcLines], sysml }) });
  }

  // EA <-> BOM join on part number: a report only, nothing is corrected on either side (BOM-004). The EA key is not settled, so
  // a title that contains the part number as a whole token counts as a match.
  let eaMatched = 0;
  if (o.eaTitles && o.eaTitles.length) {
    const lower = o.eaTitles.map((t) => t.toLowerCase());
    const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const pn of partPns) { const re = new RegExp(`(^|[^a-z0-9])${esc(pn.toLowerCase())}($|[^a-z0-9])`); const hit = lower.filter((t) => re.test(t)).length; if (hit === 1) eaMatched++; else if (hit > 1) findings.push({ level: "warn", code: "EA_AMBIGUOUS", message: `${pn} appears in ${hit} EA element names; no join was made.` }); }
    findings.push({ level: "info", code: "EA_JOIN", message: `EA to BOM: ${eaMatched} of ${partPns.length} BOM part numbers appear in exactly one EA element name; ${partPns.length - eaMatched} are BOM-only by that test. The EA-side key for a part number is not decided, so this is a report, not a link.` });
  }
  const existingN = new Set([...partPns, ...[...drawingPns].filter((x) => latest.has(x))].filter((pn) => existingBy.has(pn))).size;
  if (existingN) findings.push({ level: "info", code: "EXISTING", message: `${existingN} part number(s) already have a note in the vault and were left as they are.` });
  const label = o.runDate.slice(0, 16).replace("T", " ").replace(":", ".");
  const order = { error: 0, warn: 1, info: 2 } as const;
  const sorted = findings.slice().sort((a, b) => order[a.level] - order[b.level]);
  files.push({ path: `99_System/11_Import/BOM Findings ${label}.md`, content: `# BOM Findings ${label}\n\nSource \`${o.sourceName}\` (${parsed.layout} layout), SHA-256 \`${o.fingerprint}\`.\n\n| Level | Code | Finding |\n|---|---|---|\n${sorted.map((f) => `| ${f.level} | ${f.code} | ${f.message.replace(/\|/g, "\\|")} |`).join("\n") || "| | | none |"}\n` });
  const freshParts = newParts.length;
  return { status: "WRITE_READY", files, findings: sorted, problems,
    summary: { layout: parsed.layout, rows: parsed.usages.length, parts: freshParts, usages: usageCount, drawings: drawingCount, alternates, skippedParts: undetermined.size, existing: existingN, conflicts, eaMatched, bomOnly: eaMatched ? partPns.length - eaMatched : 0 } };
}
