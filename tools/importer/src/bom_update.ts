/* BOM update scan and apply (D-0051). A later BOM import is read against the vault, the differences are listed by category, and only what the owner approves is written.
 * The scan never writes. A note that no longer matches its import stamp (BOM-031) was edited by a person: it is still compared, and its items are marked as edits (D-0054). A note with no stamp is reported and left alone. */
import MDSE from "../../core/src/mdse_core.js";
import { buildBom, bomRevCompare, parseBom } from "./bom.ts";
import { bomOwnedHash, bomSplitSysml, bomAttrOf, bomOwnsOf } from "../../core/src/bom_own.ts";
import type { BomArea } from "../../core/src/bom_own.ts";
import type { BomOptions, BomResult, Grid } from "./bom.ts";
import type { OutFile } from "./merge.ts";
import { yamlScalar } from "./notes.ts";

export type UpdateCategory = "NEW_PART" | "NEW_REVISION" | "DESCRIPTION" | "MANUFACTURER" | "PART_ATTRIBUTES" | "LINE_ADDED" | "LINE_REMOVED" | "LINE_CHANGED" | "DRAWING" | "SUPERSEDES" | "EARLIER_REVISIONS" | "PART_NUMBER";
export type HoldCode = "CONFLICT" | "NO_BASELINE" | "OLDER_IN_FILE" | "NOT_OWNED";
export const UPDATE_CATEGORY_TEXT: Record<UpdateCategory, string> = {
  NEW_PART: "New part (a note is created)", NEW_REVISION: "New revision of an assembly (becomes the active one)", DESCRIPTION: "Part description changed", MANUFACTURER: "Manufacturer data changed",
  PART_ATTRIBUTES: "Part source or drawing location changed", LINE_ADDED: "Assembly line added", LINE_REMOVED: "Assembly line no longer listed", LINE_CHANGED: "Assembly line changed (quantity, unit, revision, dates ...)",
  DRAWING: "Drawing reference added or removed", SUPERSEDES: "New part number replaces an old one", EARLIER_REVISIONS: "Lines of earlier assembly revisions added to the note body", PART_NUMBER: "partNumber property added (D-0065)",
};
export const HOLD_TEXT: Record<HoldCode, string> = {
  CONFLICT: "SysML block not in the layout the importer writes: left alone", NO_BASELINE: "No import stamp: left alone", OLDER_IN_FILE: "File has an older revision than the vault: left alone", NOT_OWNED: "The model owns every area of the note (set at merge): left alone",
};
export type UpdateKind = "add" | "change" | "remove";
export interface UpdateItem { id: string; /** D-0057: an addition puts data in the note that it lacks; a change replaces a value; a removal takes a line out. Additions are ticked by default in the page. */ kind: UpdateKind; category: UpdateCategory; path: string; pn: string; summary: string; before: string; after: string; /** the SysML entry the item concerns, "" for a whole-note item */ key: string; /** BOM-033: the note's BOM-owned content was edited after the last import; applying this item replaces that edit */ edited: boolean }
export interface UpdateHold { code: HoldCode; path: string; pn: string; message: string }
export interface UpdateScan {
  items: UpdateItem[]; holds: UpdateHold[]; unchanged: number; result: BomResult;
  /** Notes of the file as generated against the vault: path -> text. Used by apply. */
  generated: Map<string, string>;
  /** Existing notes the scan compared: path -> text. */
  current: Map<string, string>;
  /** NEW_REVISION: path -> the lines of the revision being replaced, as earlier-revision body lines (D-0058), so applying the new revision keeps them. */
  replaced: Map<string, string[]>;
}

/* ---- reading the SysML declaration of a part note (members come from bom.ts; only the importer's own are compared or changed) ---- */
type Decl = { key: string; kind: "attr" | "usage" | "ref" | "dep" | "other"; owned: boolean; lines: string[] };
interface Parts { head: string[]; decl: Decl[]; tail: string[] }
const ATTR = bomAttrOf;
function sysmlOf(note: string): string | null { return MDSE.extractSysml(note) as string | null; }
function splitSysml(sysml: string): Parts | null { const r = bomSplitSysml(sysml); return r ? { head: r.head, decl: r.members, tail: r.tail } : null; }
/** The text of an entry with its own name blanked, so a renamed usage with the same content does not count as a change. */
const bodyOf = (d: Decl): string => d.lines.map((l, i) => (i === 0 ? l.replace(/^( {8}(?:part|ref item) )\w+/, "$1_") : l)).join("\n");
const attrsOf = (d: Decl): Array<[string, string]> => [...d.lines.join("\n").matchAll(/attribute (\w+) = (?:"((?:[^"\\]|\\.)*)"|([^;]+));/g)].map((m) => [m[1]!, (m[2] ?? m[3] ?? "").trim()]);
function yamlOwned(note: string): { description: string; mfr: Array<[string, string]> } {
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(note.replace(/\r\n?/g, "\n"))?.[1] ?? "", mfr: Array<[string, string]> = []; let description = "";
  for (const l of fm.split("\n")) { const m = /^(description|manufacturer\d+|mfgPn\d+):\s*(.*)$/.exec(l); if (!m) continue; const v = m[2]!.startsWith('"') ? (() => { try { return JSON.parse(m[2]!); } catch { return m[2]!; } })() : m[2]!; if (m[1] === "description") description = v; else mfr.push([m[1]!, v]); }
  return { description, mfr };
}
const importHashOf = (note: string): string | null => /^importHash: ([0-9a-f]{16})$/m.exec(note)?.[1] ?? null;
const revOf = (p: Parts): string => ATTR(p.decl.filter((d) => d.key === "attr:revision").flatMap((d) => d.lines), "revision");
const ownedOf = (p: Parts, owns: Set<BomArea>): Decl[] => p.decl.filter((d) => d.owned && owns.has(d.area as BomArea));
const lineWord = (d: Decl): string => { const l = ATTR(d.lines, "line"); const m = /^ {8}(?:part \w+ : (\S+)|ref item \w+ : (\S+))/.exec(d.lines[0]!); return `${l ? "line " + l + " " : ""}${(m?.[1] ?? m?.[2] ?? "").replace(/^.*::[PD]_/, "")}`; };
/** True when every manufacturer / part number pair of the vault note is still in the file, so applying only adds pairs (the numbering may shift). */
const mfrPairs = (m: Array<[string, string]>): string[] => { const num = (k: string): string => k.replace(/^\D+/, ""), by = new Map<string, { m: string; p: string }>(); for (const [k, v] of m) { const e = by.get(num(k)) ?? by.set(num(k), { m: "", p: "" }).get(num(k))!; if (/^manufacturer/.test(k)) e.m = v; else e.p = v; } return [...by.values()].map((e) => `${e.m.toLowerCase()}\0${e.p.toLowerCase()}`); };
const mfrAdds = (was: Array<[string, string]>, now: Array<[string, string]>): boolean => { const n = new Set(mfrPairs(now)); return mfrPairs(was).every((x) => n.has(x)); };
/* ---- earlier-revision lines in the note body (D-0056, D-0058) ---- */
const EARLIER_HEAD = "**Earlier revisions of this assembly**";
const EARLIER_INTRO = "Lines the BOM gives for revisions older than the latest one above. They are kept as data from the file and are not part of the SysML structure.";
/** The bullet lines of the "Earlier revisions of this assembly" block of a note. */
function earlierLines(note: string): string[] { const ls = note.replace(/\r\n?/g, "\n").split("\n"), at = ls.indexOf(EARLIER_HEAD); if (at < 0) return []; const out: string[] = []; for (let i = at + 1; i < ls.length; i++) { if (/^- Revision /.test(ls[i]!)) out.push(ls[i]!); else if (ls[i]!.trim() === "" || i === at + 2 || /^Lines the BOM gives/.test(ls[i]!)) continue; else break; } return out; }
/** Revision, line and child identify a line; the row number and the wording after the child differ between files. */
const earlierKey = (l: string): string => { const m = /^- Revision ("(?:[^"\\]|\\.)*"), line (.*?): (\S+)/.exec(l); return m ? `${m[1]}\0${m[2]}\0${m[3]!.replace(/[^A-Za-z0-9]/g, "_").toLowerCase()}` : l; };
/** Puts lines into the block, which is created before the Source section when the note has none. */
function addEarlierLines(note: string, lines: string[]): string {
  if (!lines.length) return note;
  const ls = note.split("\n"), at = ls.indexOf(EARLIER_HEAD);
  if (at >= 0) { let last = at; for (let i = at + 1; i < ls.length; i++) { if (/^- Revision /.test(ls[i]!)) last = i; else if (ls[i]!.trim() === "" || /^Lines the BOM gives/.test(ls[i]!)) continue; else break; } ls.splice(last + 1, 0, ...lines); return ls.join("\n"); }
  const block = `\n${EARLIER_HEAD}\n\n${EARLIER_INTRO}\n\n${lines.join("\n")}\n`;
  const i = note.indexOf("\n\n\n\n## Source: EA"), j = i >= 0 ? i : note.indexOf("\n## Source: EA");
  return j >= 0 ? note.slice(0, j) + "\n" + block + note.slice(j) : note + "\n" + block;
}
/** The lines of the revision a new one replaces, written as earlier-revision lines, so they stay in the note as data. */
function replacedLines(po: Parts, owns: Set<BomArea>, rev: string, nameOfId: (id: string) => string): string[] {
  return ownedOf(po, owns).filter((d) => d.kind === "usage" || d.kind === "ref").map((d) => {
    const head = d.lines[0]!, ty = /^ {8}(?:part|ref item) \w+ : (\S+?)(?: \[\d+\])?(?: \{|;)/.exec(head)?.[1] ?? "", id = /^(OBJ_\d+|DOC_\d+)::/.exec(ty)?.[1] ?? "", a = new Map(attrsOf(d)), mult = /\[(\d+)\]/.exec(head)?.[1];
    const child = (id && nameOfId(id.replace("_", "-"))) || ty.replace(/^.*::[PD]_/, "");
    const q = a.get("quantity") ?? mult ?? (d.kind === "usage" ? "1" : ""), u = a.get("unit") ?? "";
    return `- Revision ${JSON.stringify(rev)}, line ${a.get("line") || "?"}: ${child}${a.get("childRevision") ? " at revision " + JSON.stringify(a.get("childRevision")) : ""}${q ? ", quantity " + q + (u ? " " + u : "") : ""}${a.get("refDes") ? ", reference " + a.get("refDes") : ""}${a.get("effectiveFrom") ? ", from " + a.get("effectiveFrom") : ""}${a.get("effectiveTo") ? ", to " + a.get("effectiveTo") : ""}`;
  });
}
const mfrText = (m: Array<[string, string]>): string => m.map(([k, v]) => `${k}: ${v}`).join("; ") || "(none)";

/* ---- the scan ---- */
export function scanBomUpdate(grid: Grid, o: BomOptions): UpdateScan {
  const result = buildBom(grid, { ...o, update: true }), dir = o.dir ?? "BOM";
  const out: UpdateScan = { items: [], holds: [], unchanged: 0, result, generated: new Map(), current: new Map(), replaced: new Map() };
  if (result.status !== "WRITE_READY") return out;
  const vault = new Map<string, string>(o.existing?.files ?? []);
  const parsed = parseBom(grid), asParent = new Set(parsed.usages.map((u) => u.parent));
  const pnOf = (t: string): string => /^- BOM Part Number: (.+)$/m.exec(t)?.[1]?.trim() ?? "";
  let idPn: Map<string, string> | null = null;   // note id -> part number, read from the vault only when a revision is replaced
  const nameOfId = (id: string): string => { if (!idPn) { idPn = new Map(); for (const [, t] of vault) { const i = /^id: (\S+)$/m.exec(t)?.[1]; if (i) idPn.set(i, pnOf(t)); } for (const f of result.files) { const i = /^id: (\S+)$/m.exec(f.content)?.[1]; if (i && !idPn.has(i)) idPn.set(i, pnOf(f.content)); } } return idPn.get(id) ?? ""; };
  let n = 0, curEdited = false; const add = (category: UpdateCategory, path: string, pn: string, summary: string, before: string, after: string, key = "", kind: UpdateKind = "change"): void => { out.items.push({ id: `u${++n}`, kind, category, path, pn, summary: curEdited ? `${summary} [edited since last import]` : summary, before, after, key, edited: curEdited }); };
  for (const f of result.files) {
    if (!f.path.startsWith(dir + "/")) continue;
    curEdited = false;
    out.generated.set(f.path, f.content);
    const old = vault.get(f.path), pn = pnOf(f.content);
    if (old === undefined) { add("NEW_PART", f.path, pn, `${pn}: new note`, "", f.content, "", "add"); continue; }
    out.current.set(f.path, old);
    const stamp = importHashOf(old);
    if (!stamp) { out.holds.push({ code: "NO_BASELINE", path: f.path, pn, message: `${pn}: the note has no import stamp, so the scan cannot tell a BOM change from an edit.` }); continue; }
    const owns = bomOwnsOf(old);
    // D-0058: lines of earlier assembly revisions the file gives and the note lacks are offered as additions to the note body (not part of the hash, so a body edit is not an "edit")
    const earlierItem = (): boolean => {
      if (!owns.has("structure")) return false;
      const have = new Set(earlierLines(old).map(earlierKey)), miss = earlierLines(f.content).filter((l) => !have.has(earlierKey(l)));
      if (!miss.length) return false;
      const revs = [...new Set(miss.map((l) => /^- Revision ("(?:[^"\\]|\\.)*")/.exec(l)?.[1] ?? ""))].join(", "), was = curEdited; curEdited = false;
      add("EARLIER_REVISIONS", f.path, pn, `${pn}: ${miss.length} line(s) of earlier revision(s) ${revs} added to the note body`, "", miss.join("\n"), "", "add"); curEdited = was; return true;
    };
    const pnItem = (): boolean => {   // D-0065: notes written before the partNumber property get it as an addition; it is identity, not BOM-owned content, so the hash is unaffected
      const want = /^partNumber: (.+)$/m.exec(f.content)?.[1]; if (!want || /^partNumber:/m.test(old)) return false;
      const was = curEdited; curEdited = false; add("PART_NUMBER", f.path, pn, `${pn}: partNumber property added`, "", `partNumber: ${want}`, "", "add"); curEdited = was; return true;
    };
    if (!owns.size) { out.holds.push({ code: "NOT_OWNED", path: f.path, pn, message: `${pn}: at the merge the model was given every area of this note (bomOwns is empty), so BOM changes are not applied.` }); continue; }
    // BOM-033: a hand edit to BOM-owned content no longer parks the note. The note is compared with the file as usual, so the file's value is offered
    // back (nothing is ticked by default) and every item carries the marker. The shortcut below is skipped for an edited note: an unchanged file still differs from the edit.
    curEdited = bomOwnedHash(old) !== stamp;
    if (!curEdited && bomOwnedHash(f.content) === stamp) { const e1 = earlierItem(), e2 = pnItem(); if (!e1 && !e2) out.unchanged++; continue; }
    const so = sysmlOf(old), sn = sysmlOf(f.content), po = so ? splitSysml(so) : null, pnw = sn ? splitSysml(sn) : null;
    if (!po || !pnw) { out.holds.push({ code: "CONFLICT", path: f.path, pn, message: `${pn}: the SysML block is not in the layout the importer writes, so it is not compared.` }); continue; }
    const yo = yamlOwned(old), yn = yamlOwned(f.content);
    if (owns.has("facts") && yn.description && yn.description !== yo.description) add("DESCRIPTION", f.path, pn, `${pn}: description`, yo.description || "(none)", yn.description, "", yo.description ? "change" : "add");
    if (owns.has("facts") && yn.mfr.length && mfrText(yn.mfr) !== mfrText(yo.mfr)) add("MANUFACTURER", f.path, pn, `${pn}: manufacturer data`, mfrText(yo.mfr), mfrText(yn.mfr), "", mfrAdds(yo.mfr, yn.mfr) ? "add" : "change");
    const ro = revOf(po), rn = revOf(pnw), isAssembly = asParent.has(pn);
    if (owns.has("facts") && rn !== ro && !(rn === "" && ro !== "")) {
      if (ro && rn && bomRevCompare(rn, ro) < 0) { out.holds.push({ code: "OLDER_IN_FILE", path: f.path, pn, message: `${pn}: the vault has revision ${JSON.stringify(ro)}, this file's latest is ${JSON.stringify(rn)}.` }); continue; }
      const uo = ownedOf(po, owns).filter((d) => d.kind === "usage" || d.kind === "ref").length, un = ownedOf(pnw, owns).filter((d) => d.kind === "usage" || d.kind === "ref").length;
      add("NEW_REVISION", f.path, pn, `${pn}: revision ${ro ? JSON.stringify(ro) : "(none)"} → ${JSON.stringify(rn)} (${uo} → ${un} lines)`, `revision ${ro || "(none)"}, ${uo} lines`, `revision ${rn}, ${un} lines`);
      out.replaced.set(f.path, replacedLines(po, owns, ro, nameOfId)); earlierItem(); pnItem();
      continue;
    }
    const mo = new Map(ownedOf(po, owns).map((d) => [d.key, d])), mn = new Map(ownedOf(pnw, owns).map((d) => [d.key, d]));
    for (const d of ownedOf(pnw, owns)) {
      const was = mo.get(d.key);
      if (d.kind === "attr") { if (d.key === "attr:revision") continue; if (!was) add("PART_ATTRIBUTES", f.path, pn, `${pn}: ${d.key.slice(5)} added`, "(none)", ATTR(d.lines, d.key.slice(5)), d.key, "add"); else if (bodyOf(was) !== bodyOf(d)) add("PART_ATTRIBUTES", f.path, pn, `${pn}: ${d.key.slice(5)}`, ATTR(was.lines, d.key.slice(5)), ATTR(d.lines, d.key.slice(5)), d.key); continue; }
      if (d.kind === "dep") { if (!was) add("SUPERSEDES", f.path, pn, `${pn}: replaces ${d.key.slice(4).replace(/^.*::P_/, "")}`, "", d.lines[0]!.trim(), d.key, "add"); continue; }
      if (d.kind === "ref") { if (!was) add("DRAWING", f.path, pn, `${pn}: drawing ${lineWord(d)} added`, "", d.lines[0]!.trim(), d.key, "add"); continue; }
      if (!was) { add("LINE_ADDED", f.path, pn, `${pn}: ${lineWord(d)} added`, "", d.lines.join("\n"), d.key, "add"); continue; }
      if (bodyOf(was) !== bodyOf(d)) {
        const mult = (x: Decl): Array<[string, string]> => { const m = /^ {8}part \w+ : \S+ \[(\d+)\]/.exec(x.lines[0]!); return m ? [["quantity", m[1]!]] : []; }, a = new Map([...attrsOf(was), ...mult(was)]), b = [...attrsOf(d), ...mult(d)], diffs = [...new Set([...a.keys(), ...b.map(([k]) => k)])].filter((k) => (a.get(k) ?? "") !== (b.find(([x]) => x === k)?.[1] ?? "")).map((k) => `${k} ${JSON.stringify(a.get(k) ?? "")} → ${JSON.stringify(b.find(([x]) => x === k)?.[1] ?? "")}`);
        const typeChanged = /^ {8}part \w+ : (\S+)/.exec(was.lines[0]!)?.[1] !== /^ {8}part \w+ : (\S+)/.exec(d.lines[0]!)?.[1];
        add("LINE_CHANGED", f.path, pn, `${pn}: ${lineWord(d)}: ${[typeChanged ? "part changed" : "", ...diffs].filter(Boolean).join("; ") || "multiplicity"}`, was.lines.join("\n"), d.lines.join("\n"), d.key);
      }
    }
    earlierItem(); pnItem();
    if (isAssembly) for (const d of ownedOf(po, owns)) if (!mn.has(d.key) && (d.kind === "usage" || d.kind === "ref")) add(d.kind === "ref" ? "DRAWING" : "LINE_REMOVED", f.path, pn, `${pn}: ${lineWord(d)} no longer listed`, d.lines.join("\n"), "", d.key, "remove");
    if (!out.items.some((x) => x.path === f.path) && !out.holds.some((x) => x.path === f.path)) out.unchanged++;
  }
  return out;
}

/* ---- apply ---- */
export interface ApplyOptions { approved: Set<string>; sourceName: string; runDate: string }
export interface ApplyResult { writes: OutFile[]; applied: UpdateItem[]; alsoAdded: UpdateItem[]; report: string }

/** The approved items plus the new-part notes they point to, so an approved line never names a part that has no note. */
export function closeApproval(scan: UpdateScan, approved: Set<string>): { all: Set<string>; extra: UpdateItem[] } {
  const all = new Set(approved), idToItem = new Map<string, UpdateItem>();
  for (const it of scan.items) if (it.category === "NEW_PART") { const id = /^id: (\S+)$/m.exec(it.after)?.[1]; if (id) idToItem.set(id.replace("-", "_"), it); }
  const extra: UpdateItem[] = []; let grew = true;
  while (grew) {
    grew = false;
    for (const it of scan.items) {
      if (!all.has(it.id)) continue;
      const text = it.category === "NEW_PART" ? it.after : it.category === "NEW_REVISION" ? (scan.generated.get(it.path) ?? "") : it.after;
      for (const m of text.matchAll(/\b((?:OBJ|DOC)_\d{5})::[PD]_/g)) { const dep = idToItem.get(m[1]!); if (dep && !all.has(dep.id)) { all.add(dep.id); extra.push(dep); grew = true; } }
    }
  }
  return { all, extra };
}

const FOREIGN_NAME = /^ {8}(?:#\w+ )?(?:(?:in|out|inout|ref|abstract|readonly|derived|conjugated)\s+)*(?:port|part|attribute|item|action|state|constraint|requirement|calc|connection|interface|allocation|flow|perform|exhibit|occurrence|individual|snapshot|timeslice|enum|metadata|view|viewpoint|concern|verification|analysis|use case|satisfy|connect|bind|succession|transition|then|first|doc)\s+~?(\w+)/;
function renameClashes(decl: Decl[]): void {
  const seen = new Set<string>(decl.filter((d) => !d.owned).map((d) => FOREIGN_NAME.exec(d.lines[0]!)?.[1] ?? "").filter(Boolean));   // a usage must not take a name the model already uses in the same definition
  for (const d of decl) {
    if (d.kind !== "usage" && d.kind !== "ref") continue;
    const m = /^( {8}(?:part|ref item) )(\w+)/.exec(d.lines[0]!)!; let name = m[2]!, k = 2;
    while (seen.has(name)) name = `${m[2]}_${k++}`;
    seen.add(name); if (name !== m[2]) d.lines[0] = d.lines[0]!.replace(/^( {8}(?:part|ref item) )\w+/, `$1${name}`);
  }
}
function setYamlOwned(note: string, desc: string | null, mfr: Array<[string, string]> | null): string {
  let lines = note.split("\n"); const close = lines.indexOf("---", 1);
  let fm = lines.slice(1, close);
  if (mfr) fm = fm.filter((l) => !/^(manufacturer\d+|mfgPn\d+):/.test(l));
  if (desc !== null) { const at = fm.findIndex((l) => l.startsWith("description:")); const line = `description: ${yamlScalar(desc)}`; if (at >= 0) fm[at] = line; else { const t = fm.findIndex((l) => l.startsWith("tags:")); fm.splice(t >= 0 ? t + 1 : fm.length, 0, line); } }
  if (mfr) { let at = fm.findIndex((l) => /^(sourceRole|primarySymbol|importSource):/.test(l)); if (at < 0) at = fm.length; fm.splice(at, 0, ...mfr.map(([k, v]) => `${k}: ${yamlScalar(v)}`)); }
  lines = [lines[0]!, ...fm, ...lines.slice(close)]; return lines.join("\n");
}
function sourceSection(note: string): string { const m = /\n## Source: EA\n([\s\S]*?)(?=\n## SysML v2|\s*$)/.exec(note); return m ? m[1]!.replace(/^\n+|\n+$/g, "") : ""; }
function callouts(note: string): string[] { return [...note.matchAll(/^> \[!(?:flag\w+)\][^\n]*(?:\n> [^\n]*)*/gm)].map((m) => m[0]); }

export function applyBomUpdate(scan: UpdateScan, o: ApplyOptions): ApplyResult {
  const { all, extra } = closeApproval(scan, o.approved), on = o.runDate.slice(0, 10), writes: OutFile[] = [], applied: UpdateItem[] = [];
  const byPath = new Map<string, UpdateItem[]>();
  for (const it of scan.items) if (all.has(it.id)) { applied.push(it); (byPath.get(it.path) ?? byPath.set(it.path, []).get(it.path)!).push(it); }
  for (const [path, items] of byPath) {
    const gen = scan.generated.get(path)!;
    if (items.some((i) => i.category === "NEW_PART")) { writes.push({ path, content: gen }); continue; }
    const old = scan.current.get(path)!, owns = bomOwnsOf(old), cats = new Set(items.map((i) => i.category)), po = splitSysml(sysmlOf(old)!)!, pnw = splitSysml(sysmlOf(gen)!)!;
    let note = old, decl: Decl[];
    if (cats.has("NEW_REVISION")) {   // the importer's members are replaced as a set, at the place of the first one; the model's members stay where they are
      const fresh = ownedOf(pnw, owns).map((d) => ({ ...d, lines: [...d.lines] })), firstOwned = po.decl.findIndex((d) => d.owned && owns.has(d.area as BomArea)); decl = [];
      po.decl.forEach((d, i) => { if (i === firstOwned || (firstOwned < 0 && i === 0)) decl.push(...fresh); if (!(d.owned && owns.has(d.area as BomArea))) decl.push({ ...d, lines: [...d.lines] }); });
      if (!decl.length || po.decl.length === 0) decl.push(...fresh);
    }
    else {
      decl = po.decl.map((d) => ({ ...d, lines: [...d.lines] }));
      const newKeys = ownedOf(pnw, owns).map((d) => d.key), keyed = new Map(items.filter((i) => i.key).map((i) => [i.key, i]));
      for (const d of ownedOf(pnw, owns)) {
        const it = keyed.get(d.key); if (!it || it.category === "LINE_REMOVED") continue;
        const at = decl.findIndex((x) => x.key === d.key);
        if (at >= 0) {   // changed in place: the new text, under the name the note already uses
          const name = /^ {8}(?:part|ref item) (\w+)/.exec(decl[at]!.lines[0]!)?.[1];
          decl[at] = { ...d, lines: [name ? d.lines[0]!.replace(/^( {8}(?:part|ref item) )\w+/, `$1${name}`) : d.lines[0]!, ...d.lines.slice(1)] };
        } else {          // added: after the entry that precedes it in the new note
          let before = -1; for (let i = newKeys.indexOf(d.key) - 1; i >= 0 && before < 0; i--) before = decl.findIndex((x) => x.key === newKeys[i]);
          decl.splice(before + 1, 0, { ...d, lines: [...d.lines] });
        }
      }
      for (const it of items) if (it.key && (it.category === "LINE_REMOVED" || (it.category === "DRAWING" && !ownedOf(pnw, owns).some((x) => x.key === it.key)))) decl = decl.filter((x) => x.key !== it.key);
    }
    renameClashes(decl);
    const sysml = [...(po.head), ...decl.flatMap((d) => d.lines), ...po.tail].join("\n") + "\n";
    note = MDSE.replaceSysmlBlock(note, sysml);
    // D-0058: the lines of a replaced revision stay in the note as data, then the approved earlier-revision lines from the file; a line already in the block is not repeated
    const haveE = new Set(earlierLines(note).map(earlierKey)), addE: string[] = [];
    const takeE = (l: string): void => { const k = earlierKey(l); if (!haveE.has(k)) { haveE.add(k); addE.push(l); } };
    if (cats.has("NEW_REVISION")) for (const l of scan.replaced.get(path) ?? []) takeE(`${l} (replaced on ${on} by \`${o.sourceName}\`)`);
    for (const it of items) if (it.category === "EARLIER_REVISIONS") for (const l of it.after.split("\n")) takeE(l);
    note = addEarlierLines(note, addE);
    const yo = yamlOwned(gen);
    if (cats.has("PART_NUMBER")) { const line = /^partNumber: .+$/m.exec(gen)![0]; if (!/^partNumber:/m.test(note)) { const ls = note.split("\n"), close = ls.indexOf("---", 1); let at = ls.findIndex((l, i) => i < close && /^tags:/.test(l)); at = at < 0 ? close : at + 1; while (at < close && /^(name|aliases):/.test(ls[at]!)) at++; ls.splice(at, 0, line); note = ls.join("\n"); } }
    if (cats.has("DESCRIPTION")) note = setYamlOwned(note, yo.description, null);
    if (cats.has("MANUFACTURER")) note = setYamlOwned(note, null, yo.mfr);
    // the Source section is the importer's own: refresh it, keeping a line about a replaced revision
    const gs = sourceSection(gen), prev = cats.has("NEW_REVISION") ? `- Replaced revision ${JSON.stringify(ATTR(po.decl.filter((d) => d.key === "attr:revision").flatMap((d) => d.lines), "revision"))} on ${on} by \`${o.sourceName}\`` : "";
    const keep = sourceSection(old).split("\n").filter((l) => /^- Replaced revision /.test(l));
    // D-0060: a Source line the importer does not write (a line from an EA merge, a note a person added) stays; only the importer's own lines are refreshed
    const mine = /^- (BOM Part Number:|Name:|BOM source:|Revision:|No BOM lists this part|Source:|Revisions in the BOM:|Drawing location:|Alternates for line |Line \S+: part number was |On part |Replaced revision )/;
    const others = sourceSection(old).split("\n").filter((l) => !mine.test(l)).join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\n+|\n+$/g, "");
    note = note.replace(/(\n## Source: EA\n)[\s\S]*?(?=\n## SysML v2)/, `$1\n${[gs, ...keep, prev].filter(Boolean).join("\n")}${others ? "\n" + others : ""}\n`);
    // callouts the new BOM raises that the note does not have yet
    const have = new Set(callouts(note).map((c) => c.split("\n")[0]));
    for (const c of callouts(gen)) if (!have.has(c.split("\n")[0])) { const at = note.indexOf("\n\n\n\n## Source: EA"); note = at >= 0 ? note.slice(0, at) + "\n\n" + c + note.slice(at) : note + "\n\n" + c + "\n"; }
    // the stamp now describes the merged content, so anything not approved shows up again on the next scan
    note = note.replace(/^importSource: .*$/m, `importSource: ${yamlScalar(o.sourceName)}`).replace(/^importedOn: .*$/m, `importedOn: ${on}`).replace(/^importHash: .*$/m, `importHash: ${bomOwnedHash(note)}`);
    writes.push({ path, content: note });
  }
  const label = o.runDate.slice(0, 16).replace("T", " ").replace(":", ".");
  const rows = applied.map((i) => `| ${i.category} | [[${i.path.split("/").pop()!.replace(/\.md$/i, "")}]] | ${i.summary.replace(/\|/g, "\\|")} |`);
  const report = `# BOM Update ${label}\n\nSource \`${o.sourceName}\`. ${applied.length} change(s) applied to ${byPath.size} note(s)${extra.length ? `, of which ${extra.length} new part note(s) were added because an approved change refers to them` : ""}.\n\n| Category | Note | Change |\n|---|---|---|\n${rows.join("\n") || "| | | none |"}\n`;
  return { writes: [...writes, { path: `99_System/11_Import/BOM Update ${label}.md`, content: report }], applied, alsoAdded: extra, report };
}
