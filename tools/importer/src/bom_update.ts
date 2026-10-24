/* BOM update scan and apply (D-0051). A later BOM import is read against the vault, the differences are listed by category, and only what the owner approves is written.
 * The scan never writes. A note is only proposed for change when it still matches its import stamp (BOM-031); a note a person changed, or one with no stamp, is reported and left alone. */
import MDSE from "../../core/src/mdse_core.js";
import { buildBom, bomOwnedHash, bomRevCompare, parseBom } from "./bom.ts";
import type { BomOptions, BomResult, Grid } from "./bom.ts";
import type { OutFile } from "./merge.ts";
import { yamlScalar } from "./notes.ts";

export type UpdateCategory = "NEW_PART" | "NEW_REVISION" | "DESCRIPTION" | "MANUFACTURER" | "PART_ATTRIBUTES" | "LINE_ADDED" | "LINE_REMOVED" | "LINE_CHANGED" | "DRAWING" | "SUPERSEDES";
export type HoldCode = "CONFLICT" | "NO_BASELINE" | "OLDER_IN_FILE";
export const UPDATE_CATEGORY_TEXT: Record<UpdateCategory, string> = {
  NEW_PART: "New part (a note is created)", NEW_REVISION: "New revision of an assembly (becomes the active one)", DESCRIPTION: "Part description changed", MANUFACTURER: "Manufacturer data changed",
  PART_ATTRIBUTES: "Part source or drawing location changed", LINE_ADDED: "Assembly line added", LINE_REMOVED: "Assembly line no longer listed", LINE_CHANGED: "Assembly line changed (quantity, unit, revision, dates ...)",
  DRAWING: "Drawing reference added or removed", SUPERSEDES: "New part number replaces an old one",
};
export const HOLD_TEXT: Record<HoldCode, string> = {
  CONFLICT: "Edited since the last import: left alone", NO_BASELINE: "No import stamp: left alone", OLDER_IN_FILE: "File has an older revision than the vault: left alone",
};
export interface UpdateItem { id: string; category: UpdateCategory; path: string; pn: string; summary: string; before: string; after: string; /** the SysML entry the item concerns, "" for a whole-note item */ key: string }
export interface UpdateHold { code: HoldCode; path: string; pn: string; message: string }
export interface UpdateScan {
  items: UpdateItem[]; holds: UpdateHold[]; unchanged: number; result: BomResult;
  /** Notes of the file as generated against the vault: path -> text. Used by apply. */
  generated: Map<string, string>;
  /** Existing notes the scan compared: path -> text. */
  current: Map<string, string>;
}

/* ---- reading the SysML declaration of a part note ---- */
interface Decl { key: string; kind: "attr" | "usage" | "ref" | "dep"; lines: string[] }
interface Parts { head: string[]; decl: Decl[]; tail: string[] }
const ATTR = (lines: string[], k: string): string => { const m = new RegExp(`attribute ${k} = (?:"((?:[^"\\\\]|\\\\.)*)"|([^;]+));`).exec(lines.join("\n")); return m ? (m[1] ?? m[2] ?? "").trim() : ""; };

function sysmlOf(note: string): string | null { return MDSE.extractSysml(note) as string | null; }
function splitSysml(sysml: string): Parts | null {
  const lines = sysml.replace(/\n+$/, "").split("\n"), open = lines.findIndex((l) => /^ {4}part def \w+ \{$/.test(l));
  if (open < 0) return { head: lines, decl: [], tail: [] };
  let close = -1; for (let i = lines.length - 1; i > open; i--) if (lines[i] === "    }") { close = i; break; }
  if (close < 0) return null;
  const decl: Decl[] = [], body = lines.slice(open + 1, close), seen = new Map<string, number>();
  for (let i = 0; i < body.length; i++) {
    const first = body[i]!; if (!/^ {8}\S/.test(first)) return null;
    const blk = [first];
    if (/\{$/.test(first)) { while (++i < body.length && body[i] !== "        }") blk.push(body[i]!); if (i >= body.length) return null; blk.push("        }"); }
    let key = "", kind: Decl["kind"];
    const am = /^ {8}attribute (\w+) /.exec(first), um = /^ {8}part (\w+) : (\S+)/.exec(first), rm = /^ {8}ref item (\w+) : (\S+);/.exec(first), dm = /^ {8}dependency from (\S+) to (\S+);/.exec(first);
    if (am) { kind = "attr"; key = "attr:" + am[1]; }
    else if (um) { kind = "usage"; const line = ATTR(blk, "line"); key = line ? "usage:" + line : "usage:~" + um[2]; }
    else if (rm) { kind = "ref"; key = "ref:" + rm[2]; }
    else if (dm) { kind = "dep"; key = "dep:" + dm[2]; }
    else return null;
    const n = seen.get(key) ?? 0; seen.set(key, n + 1); if (n) key += "#" + n;
    decl.push({ key, kind, lines: blk });
  }
  return { head: lines.slice(0, open + 1), decl, tail: lines.slice(close) };
}
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
const lineWord = (d: Decl): string => { const l = ATTR(d.lines, "line"); const m = /^ {8}(?:part \w+ : (\S+)|ref item \w+ : (\S+))/.exec(d.lines[0]!); return `${l ? "line " + l + " " : ""}${(m?.[1] ?? m?.[2] ?? "").replace(/^.*::[PD]_/, "")}`; };
const mfrText = (m: Array<[string, string]>): string => m.map(([k, v]) => `${k}: ${v}`).join("; ") || "(none)";

/* ---- the scan ---- */
export function scanBomUpdate(grid: Grid, o: BomOptions): UpdateScan {
  const result = buildBom(grid, { ...o, update: true }), dir = o.dir ?? "BOM";
  const out: UpdateScan = { items: [], holds: [], unchanged: 0, result, generated: new Map(), current: new Map() };
  if (result.status !== "WRITE_READY") return out;
  const vault = new Map<string, string>(o.existing?.files ?? []);
  const parsed = parseBom(grid), asParent = new Set(parsed.usages.map((u) => u.parent));
  const pnOf = (t: string): string => /^- BOM Part Number: (.+)$/m.exec(t)?.[1]?.trim() ?? "";
  let n = 0; const add = (category: UpdateCategory, path: string, pn: string, summary: string, before: string, after: string, key = ""): void => { out.items.push({ id: `u${++n}`, category, path, pn, summary, before, after, key }); };
  for (const f of result.files) {
    if (!f.path.startsWith(dir + "/")) continue;
    out.generated.set(f.path, f.content);
    const old = vault.get(f.path), pn = pnOf(f.content);
    if (old === undefined) { add("NEW_PART", f.path, pn, `${pn}: new note`, "", f.content); continue; }
    out.current.set(f.path, old);
    const stamp = importHashOf(old);
    if (!stamp) { out.holds.push({ code: "NO_BASELINE", path: f.path, pn, message: `${pn}: the note has no import stamp, so the scan cannot tell a BOM change from an edit.` }); continue; }
    if (bomOwnedHash(old) !== stamp) { out.holds.push({ code: "CONFLICT", path: f.path, pn, message: `${pn}: the description, manufacturer data or SysML was changed in the vault after the last import (stamp ${stamp}).` }); continue; }
    if (bomOwnedHash(f.content) === stamp) { out.unchanged++; continue; }
    const so = sysmlOf(old), sn = sysmlOf(f.content), po = so ? splitSysml(so) : null, pnw = sn ? splitSysml(sn) : null;
    if (!po || !pnw) { out.holds.push({ code: "CONFLICT", path: f.path, pn, message: `${pn}: the SysML block is not in the layout the importer writes, so it is not compared.` }); continue; }
    const yo = yamlOwned(old), yn = yamlOwned(f.content);
    if (yn.description && yn.description !== yo.description) add("DESCRIPTION", f.path, pn, `${pn}: description`, yo.description || "(none)", yn.description);
    if (yn.mfr.length && mfrText(yn.mfr) !== mfrText(yo.mfr)) add("MANUFACTURER", f.path, pn, `${pn}: manufacturer data`, mfrText(yo.mfr), mfrText(yn.mfr));
    const ro = revOf(po), rn = revOf(pnw), isAssembly = asParent.has(pn);
    if (rn !== ro && !(rn === "" && ro !== "")) {
      if (ro && rn && bomRevCompare(rn, ro) < 0) { out.holds.push({ code: "OLDER_IN_FILE", path: f.path, pn, message: `${pn}: the vault has revision ${JSON.stringify(ro)}, this file's latest is ${JSON.stringify(rn)}.` }); continue; }
      const uo = po.decl.filter((d) => d.kind === "usage" || d.kind === "ref").length, un = pnw.decl.filter((d) => d.kind === "usage" || d.kind === "ref").length;
      add("NEW_REVISION", f.path, pn, `${pn}: revision ${ro ? JSON.stringify(ro) : "(none)"} → ${JSON.stringify(rn)} (${uo} → ${un} lines)`, `revision ${ro || "(none)"}, ${uo} lines`, `revision ${rn}, ${un} lines`);
      continue;
    }
    const mo = new Map(po.decl.map((d) => [d.key, d])), mn = new Map(pnw.decl.map((d) => [d.key, d]));
    for (const d of pnw.decl) {
      const was = mo.get(d.key);
      if (d.kind === "attr") { if (d.key === "attr:revision") continue; if (!was) add("PART_ATTRIBUTES", f.path, pn, `${pn}: ${d.key.slice(5)} added`, "(none)", ATTR(d.lines, d.key.slice(5)), d.key); else if (bodyOf(was) !== bodyOf(d)) add("PART_ATTRIBUTES", f.path, pn, `${pn}: ${d.key.slice(5)}`, ATTR(was.lines, d.key.slice(5)), ATTR(d.lines, d.key.slice(5)), d.key); continue; }
      if (d.kind === "dep") { if (!was) add("SUPERSEDES", f.path, pn, `${pn}: replaces ${d.key.slice(4).replace(/^.*::P_/, "")}`, "", d.lines[0]!.trim(), d.key); continue; }
      if (d.kind === "ref") { if (!was) add("DRAWING", f.path, pn, `${pn}: drawing ${lineWord(d)} added`, "", d.lines[0]!.trim(), d.key); continue; }
      if (!was) { add("LINE_ADDED", f.path, pn, `${pn}: ${lineWord(d)} added`, "", d.lines.join("\n"), d.key); continue; }
      if (bodyOf(was) !== bodyOf(d)) {
        const mult = (x: Decl): Array<[string, string]> => { const m = /^ {8}part \w+ : \S+ \[(\d+)\]/.exec(x.lines[0]!); return m ? [["quantity", m[1]!]] : []; }, a = new Map([...attrsOf(was), ...mult(was)]), b = [...attrsOf(d), ...mult(d)], diffs = [...new Set([...a.keys(), ...b.map(([k]) => k)])].filter((k) => (a.get(k) ?? "") !== (b.find(([x]) => x === k)?.[1] ?? "")).map((k) => `${k} ${JSON.stringify(a.get(k) ?? "")} → ${JSON.stringify(b.find(([x]) => x === k)?.[1] ?? "")}`);
        const typeChanged = /^ {8}part \w+ : (\S+)/.exec(was.lines[0]!)?.[1] !== /^ {8}part \w+ : (\S+)/.exec(d.lines[0]!)?.[1];
        add("LINE_CHANGED", f.path, pn, `${pn}: ${lineWord(d)}: ${[typeChanged ? "part changed" : "", ...diffs].filter(Boolean).join("; ") || "multiplicity"}`, was.lines.join("\n"), d.lines.join("\n"), d.key);
      }
    }
    if (isAssembly) for (const d of po.decl) if (!mn.has(d.key) && (d.kind === "usage" || d.kind === "ref")) add(d.kind === "ref" ? "DRAWING" : "LINE_REMOVED", f.path, pn, `${pn}: ${lineWord(d)} no longer listed`, d.lines.join("\n"), "", d.key);
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

function renameClashes(decl: Decl[]): void {
  const seen = new Set<string>();
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
    const old = scan.current.get(path)!, cats = new Set(items.map((i) => i.category)), po = splitSysml(sysmlOf(old)!)!, pnw = splitSysml(sysmlOf(gen)!)!;
    let note = old, decl: Decl[];
    if (cats.has("NEW_REVISION")) decl = pnw.decl.map((d) => ({ ...d, lines: [...d.lines] }));
    else {
      decl = po.decl.map((d) => ({ ...d, lines: [...d.lines] }));
      const newKeys = pnw.decl.map((d) => d.key), keyed = new Map(items.filter((i) => i.key).map((i) => [i.key, i]));
      for (const d of pnw.decl) {
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
      for (const it of items) if (it.key && (it.category === "LINE_REMOVED" || (it.category === "DRAWING" && !pnw.decl.some((x) => x.key === it.key)))) decl = decl.filter((x) => x.key !== it.key);
    }
    renameClashes(decl);
    const sysml = [...(po.head), ...decl.flatMap((d) => d.lines), ...po.tail].join("\n") + "\n";
    note = MDSE.replaceSysmlBlock(note, sysml);
    const yo = yamlOwned(gen);
    if (cats.has("DESCRIPTION")) note = setYamlOwned(note, yo.description, null);
    if (cats.has("MANUFACTURER")) note = setYamlOwned(note, null, yo.mfr);
    // the Source section is the importer's own: refresh it, keeping a line about a replaced revision
    const gs = sourceSection(gen), prev = cats.has("NEW_REVISION") ? `- Replaced revision ${JSON.stringify(ATTR(po.decl.filter((d) => d.key === "attr:revision").flatMap((d) => d.lines), "revision"))} on ${on} by \`${o.sourceName}\`` : "";
    const keep = sourceSection(old).split("\n").filter((l) => /^- Replaced revision /.test(l));
    note = note.replace(/(\n## Source: EA\n)[\s\S]*?(?=\n## SysML v2)/, `$1\n${[gs, ...keep, prev].filter(Boolean).join("\n")}\n`);
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
