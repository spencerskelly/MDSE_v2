/* Alias and merge (D-0034). Two notes that describe the same part are first joined by an alias (`aliasOf` on the note that
 * will go away, pointing at the note that stays), reviewed, and then merged: one note per part holding both notes' content.
 * Pure functions over the vault's text; the Obsidian shell shows the preview and applies it (WKB-006). Nothing here uses
 * the index for the content of a merge, only for names, so a batch can merge many notes into the same one. */
import MDSE from "../../core/src/mdse_core.js";
import { scanSysml } from "./sysml_scan.ts";
import type { ModelIndex, Note } from "./index.ts";
import { edFindDef, edInsert } from "./edit.ts";
import type { EditPlan, EditWrite } from "./edit.ts";
import { edMembers } from "./edit_rel.ts";
import { bomAreaOfMember, bomOwnsOf, bomOwnedHash, BOM_AREAS } from "../../core/src/bom_own.ts";
import type { AreaId } from "../../core/src/bom_own.ts";

const mgBad = (problem: string): EditPlan => ({ summary: "", writes: [], problems: [problem] });
const MG_CORE = new Set(["type", "subtype", "id", "uid", "status", "eaType", "tags", "sourceRole", "primarySymbol"]);
const MG_GENERIC = new Set(["", "part"]);
const mgEsc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const mgBase = (target: string): string => (target.trim().replace(/\.md$/i, "").split("/").pop() ?? "").trim();

/* ---- reading a note into its parts --------------------------------------------------------------------------- */
interface MgFm { key: string; lines: string[] }
export interface MgNote { fm: MgFm[]; meta: Record<string, string>; zone: string; src: string[] | null; block: string | null; crlf: boolean }
export function mgRead(text: string): MgNote | null {
  const crlf = text.includes("\r\n"), norm = text.replace(/\r\n/g, "\n");
  let n;
  try { n = MDSE.parse(norm); } catch { return null; }
  const fm: MgFm[] = [];
  for (const line of norm.slice(4, n.fmBlockEnd).split("\n")) {
    const m = /^([A-Za-z][\w-]*):/.exec(line);
    if (m) fm.push({ key: m[1]!, lines: [line] }); else if (fm.length) fm[fm.length - 1]!.lines.push(line);
  }
  const managed = n.h2.filter(([, h]: [number, string]) => h === MDSE.SOURCE_HEADING || h === MDSE.SYSML_HEADING);
  const cut = managed.length ? managed[0][0] : norm.length;
  let src: string[] | null = null;
  const at = n.h2.findIndex(([, h]: [number, string]) => h === MDSE.SOURCE_HEADING);
  if (at >= 0) {
    const from = n.h2[at][0] + n.h2[at][1].length, stop = at + 1 < n.h2.length ? n.h2[at + 1][0] : norm.length;
    src = norm.slice(from, stop).split("\n"); while (src.length && !src[0]!.trim()) src.shift(); while (src.length && !src[src.length - 1]!.trim()) src.pop();
  }
  return { fm, meta: n.meta, zone: norm.slice(n.fmEnd, cut).replace(/\s+$/, ""), src, block: MDSE.extractSysml(norm) as string | null, crlf };
}
/** The user zone split into the text, its `## Aliases` bullets and its `## Former ids` bullets. */
function mgZone(zone: string): { main: string; aliases: string[]; former: string[] } {
  const main: string[] = [], aliases: string[] = [], former: string[] = [];
  let into = main;
  for (const line of zone.split("\n")) {
    if (/^## Aliases\s*$/.test(line)) { into = aliases; continue; }
    if (/^## Former ids\s*$/.test(line)) { into = former; continue; }
    if (/^## /.test(line)) into = main;
    if (into !== main && !line.trim()) continue;
    into.push(line);
  }
  return { main: main.join("\n").replace(/\s+$/, ""), aliases, former };
}
const mgWithoutTitle = (main: string): string => main.replace(/^# .*(\n|$)/, "").replace(/^\n+/, "").replace(/\s+$/, "");
const mgTitle = (main: string, fallback: string): string => /^# (.*)$/m.exec(main)?.[1]?.trim() || fallback;

/* ---- links ---------------------------------------------------------------------------------------------------- */
/** Rewrites `[[Absorbed]]` to the survivor. In the text the old name stays as the shown text; in frontmatter lists it does not. */
function mgRewriteLinks(text: string, map: Map<string, string>, display: Map<string, string>, yaml: boolean): string {
  if (!map.size) return text;
  return text.replace(/(!?)\[\[([^\]|#\n]+)((?:#[^\]|\n]*)?)(?:\|([^\]\n]*))?\]\]/g, (all, bang: string, target: string, head: string, alt: string | undefined) => {
    const key = mgBase(target).toLowerCase(), to = map.get(key);
    if (to === undefined) return all;
    const shown = alt ?? (yaml ? "" : display.get(key) ?? "");
    return `${bang}[[${to}${head}${shown && shown !== to ? "|" + shown : ""}]]`;
  });
}
function mgRewriteSymbols(block: string, map: Map<string, string>): string {
  if (!map.size) return block;
  const re = new RegExp(`(?<![\\w:.])(${[...map.keys()].map(mgEsc).join("|")})(?![\\w])`, "g");
  return block.replace(re, (m) => map.get(m) ?? m);
}

/* ---- aliases -------------------------------------------------------------------------------------------------- */
export interface AliasPair { absorbed: string; survivor: string | null; /** the name written in aliasOf */ target: string }
/** Notes that carry `aliasOf`, with the note it points at (null when that note is not in the vault). */
export function mgAliasPairs(ix: ModelIndex): AliasPair[] {
  const out: AliasPair[] = [];
  for (const n of ix.notes.values()) {
    const l = n.links.find((x) => x.field === "aliasOf");
    if (l) out.push({ absorbed: n.path, survivor: ix.byName.get(l.target.toLowerCase()) ?? null, target: l.target });
  }
  return out.sort((a, b) => a.absorbed.localeCompare(b.absorbed));
}
/** Follows aliasOf to the note that stays. Returns a problem text for a loop or a dangling target. */
function mgRoots(ix: ModelIndex, pairs: AliasPair[]): Map<string, string> | string {
  const next = new Map(pairs.map((p) => [p.absorbed, p.survivor]));
  const out = new Map<string, string>();
  for (const p of pairs) {
    let cur = p.absorbed; const seen = new Set<string>();
    while (next.has(cur)) {
      if (seen.has(cur)) return `Aliases of "${ix.notes.get(p.absorbed)?.title}" loop back on themselves.`;
      seen.add(cur); const to = next.get(cur);
      if (!to) return `"${ix.notes.get(cur)?.title}" is an alias of "${pairs.find((x) => x.absorbed === cur)?.target}", which is not in the vault.`;
      cur = to;
    }
    out.set(p.absorbed, cur);
  }
  return out;
}

const mgSetAlias = (text: string, target: string | null): string => {
  const nl = text.includes("\r\n") ? "\r\n" : "\n", n = MDSE.parse(text.replace(/\r\n/g, "\n"));
  const lines = n.text.slice(4, n.fmBlockEnd).split("\n").filter(Boolean), keep: string[] = [];
  for (let i = 0; i < lines.length; i++) { if (/^aliasOf:/.test(lines[i]!)) { while (i + 1 < lines.length && /^(\s+|- )/.test(lines[i + 1]!)) i++; continue; } keep.push(lines[i]!); }
  if (target !== null) keep.push(`aliasOf: [${JSON.stringify(`[[${target}]]`)}]`);
  return (`---\n${keep.join("\n")}\n---\n` + n.text.slice(n.fmEnd)).replace(/\n/g, nl);
};

export function planAliasMark(ix: ModelIndex, files: Map<string, string>, absorbedPath: string, survivorPath: string): EditPlan {
  const a = ix.notes.get(absorbedPath), s = ix.notes.get(survivorPath), text = files.get(absorbedPath);
  if (!a || !s || text === undefined) return mgBad("Both notes must be in the vault.");
  if (a.path === s.path) return mgBad("A note cannot be an alias of itself.");
  if (a.type !== s.type) return mgBad(`"${a.title}" is a ${a.type} and "${s.title}" is a ${s.type}; only notes of the same class are merged.`);
  if (a.type !== "Object") return mgBad("Alias and merge are for Object notes (parts).");
  const have = a.links.find((x) => x.field === "aliasOf");
  if (have && ix.byName.get(have.target.toLowerCase()) === s.path) return mgBad("Nothing to change: it is already an alias of that note.");
  if (have) return mgBad(`"${a.title}" is already an alias of "${have.target}". Clear that first.`);
  const roots = mgRoots(ix, [...mgAliasPairs(ix), { absorbed: a.path, survivor: s.path, target: s.name }]);
  if (typeof roots === "string") return mgBad(roots);
  return { summary: `"${a.title}" is the same part as "${s.title}": ${a.title} will be merged into ${s.title}.`, writes: [{ path: a.path, before: text, after: mgSetAlias(text, s.name) }], problems: [] };
}
export function planAliasClear(ix: ModelIndex, files: Map<string, string>, absorbedPath: string): EditPlan {
  const a = ix.notes.get(absorbedPath), text = files.get(absorbedPath);
  if (!a || text === undefined || !a.links.some((x) => x.field === "aliasOf")) return mgBad("That note has no alias.");
  return { summary: `Clear the alias on "${a.title}".`, writes: [{ path: a.path, before: text, after: mgSetAlias(text, null) }], problems: [] };
}
/** Many aliases at once (from the suggestions). Each pair is checked alone and against the ones before it. */
export function planAliasMarkMany(ix: ModelIndex, files: Map<string, string>, pairs: Array<{ absorbed: string; survivor: string }>): EditPlan {
  const writes: EditWrite[] = [], problems: string[] = [], working = new Map(files), seen = new Set<string>();
  const known = mgAliasPairs(ix);
  for (const p of pairs) {
    if (seen.has(p.absorbed)) { problems.push(`"${ix.notes.get(p.absorbed)?.title}" appears twice.`); continue; }
    seen.add(p.absorbed);
    const one = planAliasMark(ix, working, p.absorbed, p.survivor);
    if (one.problems.length) { problems.push(one.problems[0]!); continue; }
    const w = one.writes[0]!; working.set(w.path, w.after); writes.push(w);
    known.push({ absorbed: p.absorbed, survivor: p.survivor, target: ix.notes.get(p.survivor)!.name });
  }
  const roots = mgRoots(ix, known);
  if (typeof roots === "string") problems.push(roots);
  if (problems.length) return { summary: "", writes: [], problems };
  return { summary: `Mark ${writes.length} alias${writes.length === 1 ? "" : "es"}.`, writes, problems: [] };
}

/* ---- matching: which EA notes are the BOM parts ---------------------------------------------------------------- */
export interface MgSuggestion { survivor: string; pn: string; candidates: Array<{ path: string; level: "pn" | "title" | "name"; score: number }>; confident: boolean }
const MG_PN_LINE = /^- (?:PN|Part ?Number|Part number):\s*(.+?)\s*$/;
const mgTokens = (s: string): string[] => (s.toLowerCase().match(/[a-z0-9][a-z0-9._-]*[a-z0-9]|[a-z0-9]/g) ?? []);
const mgPnKey = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
/** BOM part notes (`- BOM Part Number:`) against the other Object notes: by the EA part number, by the number inside the title, by a close name. */
export function mgSuggest(ix: ModelIndex): MgSuggestion[] {
  const bom: Array<{ n: Note; pn: string; name: string }> = [], ea: Note[] = [];
  const taken = new Set(mgAliasPairs(ix).flatMap((p) => [p.absorbed]));
  for (const n of ix.notes.values()) {
    if (n.type !== "Object" || n.meta.mergedInto) continue;
    const pn = n.sourceLines.map((l) => /^- BOM Part Number:\s*(.+?)\s*$/.exec(l)?.[1]).find(Boolean);
    if (pn) bom.push({ n, pn, name: n.sourceLines.map((l) => /^- Name:\s*(.+?)\s*$/.exec(l)?.[1]).find(Boolean) ?? "" });
    else if (!taken.has(n.path)) ea.push(n);
  }
  const byPn = new Map<string, Note[]>(), byTok = new Map<string, Note[]>(), tokensOf = new Map<string, Set<string>>();
  const add = (m: Map<string, Note[]>, k: string, n: Note): void => { const l = m.get(k); if (l) { if (!l.includes(n)) l.push(n); } else m.set(k, [n]); };
  for (const n of ea) {
    for (const l of n.sourceLines) { const v = MG_PN_LINE.exec(l)?.[1]; if (v) add(byPn, mgPnKey(v), n); }
    const toks = new Set(mgTokens(n.title)); tokensOf.set(n.path, toks);
    for (const t of toks) add(byTok, t, n);
  }
  const out: MgSuggestion[] = [];
  const claims = new Map<string, number>();
  for (const b of bom) {
    const cands = new Map<string, { path: string; level: "pn" | "title" | "name"; score: number }>();
    for (const n of byPn.get(mgPnKey(b.pn)) ?? []) cands.set(n.path, { path: n.path, level: "pn", score: 1 });
    for (const n of byTok.get(b.pn.toLowerCase()) ?? []) if (!cands.has(n.path)) cands.set(n.path, { path: n.path, level: "title", score: 0.9 });
    if (!cands.size && b.name) {
      const bt = new Set(mgTokens(b.name)), pool = new Map<string, number>();
      for (const t of bt) if ((byTok.get(t)?.length ?? 0) <= 25) for (const n of byTok.get(t) ?? []) pool.set(n.path, (pool.get(n.path) ?? 0) + 1);
      for (const [path, hit] of pool) {
        const et = tokensOf.get(path)!, uni = new Set([...bt, ...et]).size, score = hit / uni;
        if (hit >= 2 && score >= 0.6) cands.set(path, { path, level: "name", score: Math.round(score * 100) / 100 });
      }
    }
    const list = [...cands.values()].sort((x, y) => y.score - x.score).slice(0, 5);
    if (list.length) out.push({ survivor: b.n.path, pn: b.pn, candidates: list, confident: false });
    for (const c of list.slice(0, 1)) claims.set(c.path, (claims.get(c.path) ?? 0) + 1);
  }
  for (const s of out) { const c = s.candidates; s.confident = (c.length === 1 && c[0]!.level !== "name") || (c.length > 1 && c[0]!.level === "pn" && c[1]!.level !== "pn"); if (s.confident && (claims.get(c[0]!.path) ?? 0) > 1) s.confident = false; }
  return out.sort((x, y) => Number(y.confident) - Number(x.confident) || x.pn.localeCompare(y.pn));
}

/* ---- who owns which area (D-0053) ---------------------------------------------------------------------------------- */
export type MgOwner = "survivor" | "absorbed" | "both";
export type MgOwners = Record<AreaId, MgOwner>;
export interface MgAreaRow { id: AreaId; label: string; hint: string; bom: boolean; survivor: number; absorbed: number; recommended: MgOwner }
const MG_FACT_KEY = /^(description|manufacturer\d+|mfgPn\d+)$/;
const mgIsBomNote = (n: MgNote): boolean => n.fm.some((f) => f.key === "importHash") || !!n.src?.some((l) => /^- BOM Part Number:/.test(l));
export interface MgMem { start: number; end: number; area: AreaId; text: string }
/** The members of the one definition in a block, each with its area. null when the block has no single definition this can read. */
export function mgMembers(block: string | null): MgMem[] | null {
  if (block === null) return [];
  const S = scanSysml(block); if (S.defs.length !== 1) return null;
  const d = S.defs[0]!, at = edFindDef(block, d.keyword, d.name); if (!at?.open) return [];
  return edMembers(block, at.term + 1, at.close).map((m) => { const text = block.slice(m.start, m.end); return { start: m.start, end: m.end, text, area: bomAreaOfMember(m.head + (m.tag ? " // " + m.tag : ""), text) }; });
}
/** The block without the given members (each whole line removed). */
function mgDrop(block: string, drop: MgMem[]): string {
  let out = block;
  for (const m of [...drop].sort((a, b) => b.start - a.start)) {
    const ls = out.lastIndexOf("\n", m.start - 1) + 1, le = out.indexOf("\n", m.end);
    if (out.slice(ls, m.start).trim() === "" && le >= 0 && out.slice(m.end, le).trim() === "") out = out.slice(0, ls) + out.slice(le + 1); else out = out.slice(0, m.start) + out.slice(m.end);
  }
  return out;
}
/** The recommended owner of every area: both (D-0087). Everything either note has moves into the surviving note; a member or property that both have with different values keeps the surviving note's and the other is written out under "Not carried over", never dropped. Giving an area to one note is still a choice in the owners table. */
function mgRecommend(_S: MgNote, _A: MgNote, _sm: MgMem[], _am: MgMem[]): MgOwners {
  const out = {} as MgOwners;
  for (const a of BOM_AREAS) out[a.id] = "both";
  return out;
}
/** The table the merge dialog shows for one alias pair: per area, how many members each note has and the recommended owner. */
export function mgOwnerRows(files: Map<string, string>, absorbedPath: string, survivorPath: string): MgAreaRow[] | string {
  const S = mgRead(files.get(survivorPath) ?? ""), A = mgRead(files.get(absorbedPath) ?? "");
  if (!S || !A) return "Both notes need readable frontmatter.";
  const sm = mgMembers(S.block), am = mgMembers(A.block);
  if (sm === null || am === null) return "Notes with more than one definition are not merged yet.";
  const rec = mgRecommend(S, A, sm, am), yamlN = (n: MgNote): number => n.fm.filter((f) => MG_FACT_KEY.test(f.key)).length;
  return BOM_AREAS.map((a) => ({ id: a.id, label: a.label, hint: a.hint, bom: a.bom, survivor: sm.filter((m) => m.area === a.id).length + (a.id === "facts" ? yamlN(S) : 0), absorbed: am.filter((m) => m.area === a.id).length + (a.id === "facts" ? yamlN(A) : 0), recommended: rec[a.id] }));
}

/* ---- merging two blocks ------------------------------------------------------------------------------------------ */
const mgNorm = (s: string): string => s.replace(/\s+/g, " ").trim();
interface MgBlock { block: string; carried: number; notCarried: string[]; specialized: string[] }
function mgMergeBlocks(sBlock: string, aBlock: string, addSpecializations = true): MgBlock | string {
  const S = scanSysml(sBlock), A = scanSysml(aBlock);
  if (S.defs.length !== 1 || A.defs.length !== 1) return "Notes with more than one definition are not merged yet.";
  if (S.warnings.length || A.warnings.length) return "A SysML block has statements the scanner does not read; fix it first.";
  const sd = S.defs[0]!, ad = A.defs[0]!;
  if (sd.keyword !== ad.keyword) return `The two definitions are different kinds (${sd.keyword}, ${ad.keyword}).`;
  const rename = new Map([[ad.symbol, sd.symbol]]);
  let block = sBlock, carried = 0;
  const notCarried: string[] = [], specialized: string[] = [];
  const sAt = edFindDef(sBlock, sd.keyword, sd.name), aAt = edFindDef(aBlock, ad.keyword, ad.name);
  const sMems = sAt?.open ? edMembers(sBlock, sAt.term + 1, sAt.close) : [], aMems = aAt?.open ? edMembers(aBlock, aAt.term + 1, aAt.close) : [];
  const sHeads = new Set(sMems.map((m) => mgNorm(m.head))), sFull = new Map(sMems.map((m) => [mgNorm(m.head), mgNorm(sBlock.slice(m.start, m.end))]));
  const sAttr = new Map(sMems.map((m) => [/^attribute\s+(\w+)\s*=/.exec(m.head)?.[1] ?? "", m]).filter(([k]) => k) as Array<[string, (typeof sMems)[number]]>);
  const sNames = new Set(sd.usages.map((u) => u.name));
  for (const m of aMems) {
    const raw = aBlock.slice(m.start, m.end), text = mgRewriteSymbols(raw, rename), head = mgNorm(mgRewriteSymbols(m.head, rename));
    const isDoc = /^doc\b/.test(m.head);
    const usage = ad.usages.find((u) => u.head === m.head);
    const attr = /^attribute\s+(\w+)\s*=/.exec(m.head)?.[1];
    if (isDoc) { if (sMems.some((x) => /^doc\b/.test(x.head))) { if (!sHeads.has(head)) notCarried.push(text); continue; } }
    else if (sHeads.has(head)) { if (sFull.get(head) !== mgNorm(text)) notCarried.push(text); continue; }
    else if (usage && sNames.has(usage.name)) { notCarried.push(text); continue; }
    else if (attr && sAttr.has(attr)) { notCarried.push(text); continue; }
    const next = edInsert(block, sd, text);
    if (next === null) return `Could not find "${sd.keyword} ${sd.name}" in the surviving block.`;
    block = next; carried++;
  }
  for (const sym of addSpecializations ? ad.specializes : []) {
    const t = rename.get(sym) ?? sym;
    if (t === sd.symbol || sd.specializes.includes(t) || specialized.includes(t)) continue;
    const at = edFindDef(block, sd.keyword, sd.name);
    if (!at) return `Could not find "${sd.keyword} ${sd.name}" in the surviving block.`;
    const rest = block.slice(at.nameEnd, at.headEnd);
    block = /:>/.test(rest) ? block.slice(0, at.headEnd).replace(/\s*$/, "") + `, ${t}` + (at.open ? " " : "") + block.slice(at.headEnd) : block.slice(0, at.nameEnd) + ` :> ${t}` + block.slice(at.nameEnd);
    specialized.push(t);
  }
  const check = scanSysml(block);
  if (check.warnings.length) return `The merged block does not scan clean: ${check.warnings[0]}`;
  return { block, carried, notCarried, specialized };
}

/* ---- merging frontmatter ------------------------------------------------------------------------------------------ */
const mgLinks = (lines: string[]): string[] => [...lines.join("\n").matchAll(/\[\[([^\]|#\n]+)/g)].map((m) => m[1]!.trim());
interface MgFactsCtx { facts: MgOwner; dropped: { survivor: string[]; absorbed: string[] } }
function mgMergeFrontmatter(s: MgNote, a: MgNote, names: Map<string, string>, survName: string, notes: string[], symbol: string, ctx: MgFactsCtx = { facts: "both", dropped: { survivor: [], absorbed: [] } }): string[] {
  const out: string[] = [];
  const rel = (f: MgFm[]) => f.filter((x) => !MG_CORE.has(x.key) && x.key !== "aliasOf");
  const merged = new Map<string, string[]>();
  for (const f of [...rel(s.fm), ...rel(a.fm)]) {
    const cur = merged.get(f.key) ?? [];
    for (const l of mgLinks(f.lines)) {
      const to = names.get(mgBase(l).toLowerCase()) ?? mgBase(l);
      if (to.toLowerCase() !== survName.toLowerCase() && !cur.some((x) => x.toLowerCase() === to.toLowerCase())) cur.push(to);
    }
    merged.set(f.key, cur);
  }
  const done = new Set<string>();
  const lacksSymbol = !s.fm.some((x) => x.key === "primarySymbol");
  for (const f of s.fm) {
    if (f.key === "aliasOf") continue;
    if (MG_CORE.has(f.key)) {
      if (f.key === "subtype" && MG_GENERIC.has(s.meta.subtype ?? "") && !MG_GENERIC.has(a.meta.subtype ?? "")) { out.push(`subtype: ${a.meta.subtype}`); notes.push(`subtype ${s.meta.subtype || "(none)"} -> ${a.meta.subtype}`); continue; }
      if (f.key === "eaType" && s.meta.eaType === "BOM" && a.meta.eaType && a.meta.eaType !== "BOM") { out.push(`eaType: ${a.fm.find((x) => x.key === "eaType")!.lines[0]!.replace(/^eaType:\s*/, "")}`); continue; }
      if (f.key === "tags") {
        const t = (x: MgNote): string[] | null => { const m = /^\[(.*)\]\s*$/.exec((x.meta.tags ?? "").trim()); return m ? m[1]!.split(",").map((y) => y.trim()).filter(Boolean) : null; };
        const ts = t(s), ta = t(a);
        if (ts && ta) { out.push(`tags: [${[...new Set([...ts, ...ta])].join(", ")}]`); continue; }
        if (!ts || !ta) { if (ta && ta.length) notes.push("tags of the merged note were not combined (not a simple list)"); }
      }
      if (f.key === "status" && s.meta.status !== a.meta.status) notes.push(`status ${a.meta.status} kept as ${s.meta.status}`);
      out.push(...f.lines);
      if (f.key === "tags" && lacksSymbol && symbol) out.push("sourceRole: authoritative-model", `primarySymbol: ${symbol}`);          // an older BOM note had none
      continue;
    }
    if (MG_FACT_KEY.test(f.key) && ctx.facts === "absorbed") { ctx.dropped.survivor.push(...f.lines); continue; }     // part facts are owned by the other note
    if (!f.lines.some((x) => x.includes("[["))) { out.push(...f.lines); done.add(f.key); continue; }   // WKB-026: a plain property of the surviving note (BOM description, manufacturers, import stamp) is kept as it is
    const l = merged.get(f.key);
    if (l && l.length) out.push(`${f.key}: [${l.map((x) => JSON.stringify(`[[${x}]]`)).join(", ")}]`);
    done.add(f.key);
  }
  for (const f of a.fm) {   // plain properties only the removed note has are carried over; the import stamp never is, it describes the survivor's own content
    if (done.has(f.key) || MG_CORE.has(f.key) || f.key === "aliasOf" || f.key === "bomOwns" || (/^import(Source|edOn|Hash)$/.test(f.key) && s.fm.some((x) => x.key === "importHash")) || f.lines.some((x) => x.includes("[["))) continue;
    if (MG_FACT_KEY.test(f.key) && ctx.facts === "survivor") { ctx.dropped.absorbed.push(...f.lines); continue; }
    const same = s.fm.find((x) => x.key === f.key);
    if (same && !(MG_FACT_KEY.test(f.key) && ctx.facts === "absorbed")) { if (mgNorm(same.lines.join(" ")) !== mgNorm(f.lines.join(" "))) ctx.dropped.absorbed.push(...f.lines); continue; }      // same property, different value: the surviving note's stays, the other is written out
    out.push(...f.lines); done.add(f.key); notes.push(`property ${f.key} carried over`);
  }
  for (const f of a.fm) if (["status", "eaType", "subtype", "sourceRole"].includes(f.key)) { const mine = s.fm.find((x) => x.key === f.key); if (mine && mgNorm(mine.lines.join(" ")) !== mgNorm(f.lines.join(" ")) && !out.includes(f.lines[0]!)) ctx.dropped.absorbed.push(...f.lines); }
  for (const [k, l] of merged) if (!done.has(k) && l.length) out.push(`${k}: [${l.map((x) => JSON.stringify(`[[${x}]]`)).join(", ")}]`);
  return out;
}

/** The note a merge retires (D-0091, and the rule that a note is never deleted): only its identity, `status: Retired` and a link to the note that kept its content. Its SysML, text and source lines are all in the surviving note. */
function mgRetired(text: string, survivorName: string): string {
  const nl = text.includes("\r\n") ? "\r\n" : "\n", n = MDSE.parse(text.replace(/\r\n/g, "\n"));
  const keep = ["type", "subtype", "id", "uid"], fm: string[] = [];
  for (const k of keep) if (n.meta[k] !== undefined && String(n.meta[k]) !== "") fm.push(`${k}: ${n.meta[k]}`);
  fm.push("status: Retired", "tags: [retired]", `mergedInto: [${JSON.stringify(`[[${survivorName}]]`)}]`);
  return `---\n${fm.join("\n")}\n---\n`.replace(/\n/g, nl);
}
/** Merges the given pairs straight away, without an `aliasOf` line first (D-0091). */
export function planMergePairs(ix: ModelIndex, files: Map<string, string>, pairs: Array<{ absorbed: string; survivor: string }>, chosen?: Map<string, MgOwners>): MergeResult {
  return planNoteMerge(ix, files, pairs.map((p) => ({ absorbed: p.absorbed, survivor: p.survivor, target: ix.notes.get(p.survivor)?.name ?? p.survivor })), chosen);
}

/* ---- the merge ------------------------------------------------------------------------------------------------------- */
export interface MergeResult extends EditPlan { merged: number; carried: number; notCarried: number; rewritten: number }
/** Merges every absorbed note into its survivor (the end of its alias chain) and rewrites the links and symbols that named it. */
export function planNoteMerge(ix: ModelIndex, files: Map<string, string>, pairs?: AliasPair[], chosen?: Map<string, MgOwners>): MergeResult {
  const fail = (p: string): MergeResult => ({ ...mgBad(p), merged: 0, carried: 0, notCarried: 0, rewritten: 0 });
  const list = pairs ?? mgAliasPairs(ix);
  if (!list.length) return fail("There are no aliases to merge.");
  const known = mgAliasPairs(ix).filter((k) => !list.some((p) => p.absorbed === k.absorbed)), roots = mgRoots(ix, [...known, ...list]);       // D-0091: a pair given here needs no alias in the file first
  if (typeof roots === "string") return fail(roots);
  const abs = list.map((p) => p.absorbed), surv = new Set<string>();
  for (const a of abs) {
    const s = roots.get(a)!, an = ix.notes.get(a), sn = ix.notes.get(s);
    if (!an || !sn) return fail("Both notes must be in the vault.");
    if (an.type !== sn.type) return fail(`"${an.title}" and "${sn.title}" are different classes.`);
    if (abs.includes(s)) return fail(`"${sn.title}" is merged away in the same batch.`);
    surv.add(s);
  }
  const work = new Map<string, string>(), notes: string[] = [];
  let carried = 0, notCarried = 0;
  const nameMap = new Map<string, string>(), display = new Map<string, string>(), symMap = new Map<string, string>();
  for (const a of abs) {
    const an = ix.notes.get(a)!, sn = ix.notes.get(roots.get(a)!)!;
    nameMap.set(an.name.toLowerCase(), sn.name); display.set(an.name.toLowerCase(), an.title);
    if (an.def && sn.def) symMap.set(an.def.symbol, sn.def.symbol);
  }
  /* one merged text per survivor, absorbed notes folded in one at a time */
  for (const s of surv) {
    let text = files.get(s)!;
    const sn = ix.notes.get(s)!;
    for (const a of abs.filter((x) => roots.get(x) === s)) {
      const at = files.get(a)!, an = ix.notes.get(a)!;
      const S = mgRead(text), A = mgRead(at);
      if (!S || !A) return fail(`"${an.title}" or "${sn.title}" does not have readable frontmatter.`);
      if (S.meta.type !== A.meta.type) return fail(`"${an.title}" and "${sn.title}" are different classes.`);
      let block = S.block, extra = "";
      const sm0 = mgMembers(S.block), am0 = mgMembers(A.block);
      if (sm0 === null || am0 === null) return fail(`${an.title} into ${sn.title}: Notes with more than one definition are not merged yet.`);
      const owners = chosen?.get(a) ?? mgRecommend(S, A, sm0, am0), own = (m: MgMem): MgOwner => owners[m.area];
      const sDrop = sm0.filter((m) => own(m) === "absorbed"), aDrop = am0.filter((m) => own(m) === "survivor"), sGone = sDrop.map((m) => m.text), aGone = aDrop.map((m) => m.text);
      const dropped = { survivor: [] as string[], absorbed: [] as string[] };
      if (A.block !== null) {
        if (S.block === null) return fail(`"${sn.title}" has no SysML block to merge "${an.title}" into. Keep "${an.title}" instead.`);
        const r = mgMergeBlocks(mgDrop(S.block, sDrop), mgDrop(A.block, aDrop), owners.relationships !== "survivor");
        if (typeof r === "string") return fail(`${an.title} into ${sn.title}: ${r}`);
        block = r.block; carried += r.carried; notCarried += r.notCarried.length + sGone.length + aGone.length;
        if (r.notCarried.length) extra = `## Not carried over from ${an.title}\n\nThe surviving note already had these with a different value. Decide which to keep.\n\n\`\`\`sysml\n${r.notCarried.join("\n")}\n\`\`\``;
      }
      const fmCtx: MgFactsCtx = { facts: owners.facts, dropped };
      const own2 = (title: string, owner: string, owners: MgOwners, sysml: string[], yaml: string[]): string => `## Not carried over from ${title}\n\n${Object.values(owners).some((v) => v !== "both") ? `The owner of these areas was set to ${owner} at the merge.` : `${owner} already has a different value for these, and its value was kept.`} Move a member back by hand if it should stay.\n\n` + (sysml.length ? `\`\`\`sysml\n${sysml.join("\n")}\n\`\`\`` : "") + (sysml.length && yaml.length ? "\n\n" : "") + (yaml.length ? `\`\`\`yaml\n${yaml.join("\n")}\n\`\`\`` : "");
      const sz = mgZone(S.zone), az = mgZone(A.zone);
      const aTitle = mgTitle(az.main, an.title), sTitle = mgTitle(sz.main, sn.title), aBody = mgWithoutTitle(az.main);
      const zoneParts = [sz.main];
      if (aBody && !sz.main.includes(aBody)) zoneParts.push(`## Merged from ${aTitle}\n\n${aBody}`);
      if (extra) zoneParts.push(extra);
      const aliases = [...new Set([...sz.aliases, ...az.aliases, ...(aTitle.toLowerCase() !== sTitle.toLowerCase() ? [`- ${aTitle}`] : [])])];
      const former = [...new Set([...sz.former, ...az.former, `- ${A.meta.id} (uid ${A.meta.uid})`])];
      if (aliases.length) zoneParts.push(`## Aliases\n\n${aliases.join("\n")}`);
      zoneParts.push(`## Former ids\n\n${former.join("\n")}`);
      let fm = mgMergeFrontmatter(S, A, nameMap, sn.name, notes, block !== null ? scanSysml(block).defs[0]?.symbol ?? "" : "", fmCtx);
      if (aGone.length || dropped.absorbed.length) zoneParts.push(own2(an.title, sn.title, owners, aGone, dropped.absorbed));
      if (sGone.length || dropped.survivor.length) zoneParts.push(own2(sn.title, an.title, owners, sGone, dropped.survivor));
      const bomIsS = mgIsBomNote(S), bomSide = bomIsS ? S : mgIsBomNote(A) ? A : null, bomText = bomIsS ? text : at;
      const stampM = bomSide && /^importHash: ([0-9a-f]{16})$/m.exec(bomText), stampOk = !!stampM && bomOwnedHash(bomText) === stampM[1];
      if (bomSide && fm.some((l) => l.startsWith("importHash:"))) {      // D-0053: which areas a later BOM update may still change
        const side = bomIsS ? "survivor" : "absorbed", prev = bomOwnsOf(bomText), owns = (["facts", "structure"] as const).filter((id) => prev.has(id) && (owners[id] === side || owners[id] === "both"));
        fm = fm.filter((l) => !/^bomOwns:/.test(l)); if (owns.length < 2) fm.push(`bomOwns: [${owns.join(", ")}]`);
      }
      const srcLines = S.src || A.src ? [...new Set([...(S.src ?? []), ...(A.src ?? [])])] : null;
      let out = `---\n${fm.join("\n")}\n---\n${zoneParts.filter(Boolean).join("\n\n")}`;
      if (srcLines) out += `\n\n\n\n${MDSE.SOURCE_HEADING}\n\n${srcLines.join("\n")}\n`;
      if (block !== null) out += (srcLines ? "\n" : "\n\n\n\n") + MDSE.renderSysmlSection(block);
      else out += "\n";
      if (stampOk && /^importHash: /m.test(out)) out = out.replace(/^importHash: .*$/m, `importHash: ${bomOwnedHash(out)}`);     // the merge itself is not an edit: the stamp now describes the merged content
      text = S.crlf ? out.replace(/\n/g, "\r\n") : out;
    }
    work.set(s, text);
  }
  /* every other note: links and symbols that named an absorbed note now name the survivor */
  const writes: EditWrite[] = [];
  let rewritten = 0;
  const nameRe = new RegExp(`\\[\\[\\s*(?:[^\\]|#\\n]*/)?(?:${[...nameMap.keys()].map(mgEsc).join("|")})(?:\\.md)?\\s*[#|\\]]`, "i");
  const symRe = symMap.size ? new RegExp(`(?<![\\w:.])(?:${[...symMap.keys()].map(mgEsc).join("|")})(?![\\w])`) : null;
  for (const [path, before] of files) {
    if (abs.includes(path)) continue;
    let text = work.get(path) ?? before;
    const hit = nameRe.test(text) || (symRe !== null && symRe.test(text));
    if (hit) {
      const cut = text.search(/^## SysML v2\s*$/m), headEnd = cut < 0 ? text.length : cut;
      const fmEnd = text.indexOf("\n---", 3), head = text.slice(0, headEnd), tail = text.slice(headEnd);
      const fmPart = fmEnd >= 0 ? head.slice(0, fmEnd + 4) : "", rest = head.slice(fmPart.length);
      text = mgRewriteLinks(fmPart, nameMap, display, true) + mgRewriteLinks(rest, nameMap, display, false) + tail;
      if (symRe) { const blk = MDSE.extractSysml(text) as string | null; if (blk !== null) { const nb = mgRewriteSymbols(blk, symMap); if (nb !== blk) text = MDSE.replaceSysmlBlock(text, nb); } }
    }
    if (text !== before) { writes.push({ path, before, after: text }); if (!work.has(path)) rewritten++; }
  }
  for (const [path, after] of work) {
    const t = after; const before = files.get(path)!;
    const i = writes.findIndex((w) => w.path === path);
    const final = i >= 0 ? writes[i]!.after : t;
    if (i >= 0) writes[i] = { path, before, after: final }; else writes.push({ path, before, after: final });
  }
  for (const a of abs) writes.push({ path: a, before: files.get(a)!, after: mgRetired(files.get(a)!, ix.notes.get(roots.get(a)!)!.name) });     // D-0091: the removed note stays as a retired stub that points at the note that kept its content
  void notes;
  return { summary: `Merge ${abs.length} note${abs.length === 1 ? "" : "s"} into ${surv.size}: ${[...surv].slice(0, 3).map((s) => ix.notes.get(s)!.title).join(", ")}${surv.size > 3 ? "…" : ""}. ${carried} SysML member${carried === 1 ? "" : "s"} carried over${notCarried ? `, ${notCarried} kept apart for review` : ""}; links and references updated in ${rewritten} other note${rewritten === 1 ? "" : "s"}.`,
    writes, problems: [], merged: abs.length, carried, notCarried, rewritten };
}
