/* Compare two notes (D-0092): what differs in their properties, their other SysML members, their relationships, and their structure down to
 * the parts that differ. Parts are matched between the two trees by note, else by part number, else by name, so two copies of the same assembly
 * kept as separate notes (a BOM note and a modeled note) line up. Pure functions over the index. */
import type { ModelIndex, Note } from "./index.ts";
import { outgoing } from "./index.ts";
import { qtyOf, measuredOf } from "./views.ts";
import { mgMembers } from "./merge_ops.ts";

export interface CmpRow { level: number; a: string | null; b: string | null; /** note paths for the two sides */ pathA: string | null; pathB: string | null; diff: string }
export interface CmpPlain { what: string; a: string; b: string }
export interface CmpResult { props: CmpPlain[]; members: CmpPlain[]; links: CmpPlain[]; structure: CmpRow[]; same: boolean; differing: number }

const SKIP = new Set(["id", "uid", "primarySymbol", "sourceRole", "importHash", "importedOn", "importSource", "bomOwns", "tags"]);
const FACT = /^(description|partNumber|revision|name|manufacturer\d+|mfgPn\d+)$/;
const norm = (s: string): string => s.replace(/\s+/g, " ").trim();
const pnOf = (n: Note): string => String(n.meta.partNumber ?? "").trim() || (n.sourceLines.map((l) => /^- BOM Part Number:\s*(.+?)\s*$/.exec(l)?.[1]).find(Boolean) ?? "") || "";
const titleKey = (n: Note): string => n.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Properties and members that differ between two notes. */
function plain(ix: ModelIndex, a: Note, b: Note): Pick<CmpResult, "props" | "members" | "links"> {
  const props: CmpPlain[] = [], keys = [...new Set([...Object.keys(a.meta), ...Object.keys(b.meta)])].filter((k) => !SKIP.has(k)).sort();
  if (a.type !== b.type) props.push({ what: "type", a: a.type, b: b.type });
  for (const k of keys) {
    if (k === "type") continue;
    const x = a.meta[k], y = b.meta[k];
    const isLinks = (v: unknown): boolean => typeof v === "string" && v.includes("[[");
    if (isLinks(x) || isLinks(y)) continue;                                                // relationship fields are compared below
    if (norm(String(x ?? "")) !== norm(String(y ?? ""))) props.push({ what: k, a: String(x ?? ""), b: String(y ?? "") });
  }
  const members: CmpPlain[] = [];
  /* other members come from the SysML block's own lines */
  const lines = (n: Note): Map<string, string> => {
    const out = new Map<string, string>(); if (!n.block) return out;
    const mems = mgMembers(n.block) ?? [];
    for (const m of mems) { if (m.area === "structure") continue; const t = norm(m.text.replace(n.def?.symbol ?? "\u0000", "SELF").replace(/\/\/.*$/gm, "")); out.set(t, m.area); }
    return out;
  };
  const la = lines(a), lb = lines(b);
  for (const [t, area] of la) if (!lb.has(t)) members.push({ what: area, a: t, b: "" });
  for (const [t, area] of lb) if (!la.has(t)) members.push({ what: area, a: "", b: t });
  members.sort((x, y) => x.what.localeCompare(y.what) || (x.a || x.b).localeCompare(y.a || y.b));
  /* relationships other than parts, by kind and the name of what they point at */
  const rel = (n: Note): Map<string, number> => { const m = new Map<string, number>(); for (const e of outgoing(ix, n.path)) { if (e.kind === "hasPart" || !e.to || e.reverse || e.kind === "mergedInto") continue; const k = `${e.kind} ${ix.notes.get(e.to)?.title ?? e.to}`; m.set(k, (m.get(k) ?? 0) + 1); } return m; };
  const ra = rel(a), rb = rel(b), links: CmpPlain[] = [];
  for (const [k, n] of ra) if ((rb.get(k) ?? 0) < n) links.push({ what: k.split(" ")[0]!, a: k.slice(k.indexOf(" ") + 1), b: "" });
  for (const [k, n] of rb) if ((ra.get(k) ?? 0) < n) links.push({ what: k.split(" ")[0]!, a: "", b: k.slice(k.indexOf(" ") + 1) });
  links.sort((x, y) => x.what.localeCompare(y.what) || (x.a || x.b).localeCompare(y.a || y.b));
  return { props, members, links };
}

interface Kid { path: string; qty: number; unit: string; label: string }
function kidsOf(ix: ModelIndex, p: string): Kid[] {
  const acc = new Map<string, Kid>();
  for (const e of outgoing(ix, p)) {
    if (e.kind !== "hasPart" || !e.to || e.reverse || !ix.notes.has(e.to)) continue;
    const m = measuredOf(e.detail), q = m ? m.qty : qtyOf(e.label), unit = m ? m.unit : "", key = e.to + "\u0000" + unit, cur = acc.get(key);
    acc.set(key, { path: e.to, qty: (cur?.qty ?? 0) + q, unit, label: ix.notes.get(e.to)!.title });
  }
  return [...acc.values()].sort((x, y) => x.label.localeCompare(y.label) || x.path.localeCompare(y.path));
}
const countBelow = (ix: ModelIndex, p: string, stack: string[] = []): number => stack.includes(p) || stack.length > 12 ? 0 : kidsOf(ix, p).reduce((n, k) => n + 1 + countBelow(ix, k.path, [...stack, p]), 0);
const qtyText = (k: Kid): string => `${Math.round(k.qty * 1000) / 1000}${k.unit ? " " + k.unit : ""}`;

function factsDiffer(a: Note, b: Note): string[] {
  const out: string[] = [];
  for (const k of new Set([...Object.keys(a.meta), ...Object.keys(b.meta)])) if (FACT.test(k) && k !== "name" && a.meta[k] !== undefined && b.meta[k] !== undefined && norm(String(a.meta[k])) !== norm(String(b.meta[k]))) out.push(k);
  return out;
}

/** The structure of two notes side by side, only where they differ; the rows above a difference are kept so it can be found. */
function tree(ix: ModelIndex, pa: string, pb: string, level: number, stack: string[]): CmpRow[] {
  const ka = kidsOf(ix, pa), kb = kidsOf(ix, pb), usedB = new Set<number>(), pairs: Array<[Kid | null, Kid | null]> = [];
  const take = (k: Kid, test: (o: Kid) => boolean): Kid | null => { const i = kb.findIndex((o, j) => !usedB.has(j) && test(o)); if (i < 0) return null; usedB.add(i); return kb[i]!; };
  const matched = ka.map((k): [Kid, Kid | null] => [k, take(k, (o) => o.path === k.path)]);                          // same note
  for (const m of matched) if (!m[1]) { const pn = pnOf(ix.notes.get(m[0].path)!); if (pn) m[1] = take(m[0], (o) => pnOf(ix.notes.get(o.path)!).toLowerCase() === pn.toLowerCase()); }   // same part number
  for (const m of matched) if (!m[1]) { const t = titleKey(ix.notes.get(m[0].path)!); if (t) m[1] = take(m[0], (o) => titleKey(ix.notes.get(o.path)!) === t); }                                        // same name
  for (const [x, y] of matched) pairs.push([x, y]);
  kb.forEach((k, j) => { if (!usedB.has(j)) pairs.push([null, k]); });
  const out: CmpRow[] = [];
  for (const [x, y] of pairs) {
    if (x && !y) { out.push({ level, a: x.label, b: null, pathA: x.path, pathB: null, diff: `only in A (${qtyText(x)}${countBelow(ix, x.path) ? `, ${countBelow(ix, x.path)} part${countBelow(ix, x.path) === 1 ? "" : "s"} below` : ""})` }); continue; }
    if (!x && y) { out.push({ level, a: null, b: y.label, pathA: null, pathB: y.path, diff: `only in B (${qtyText(y)}${countBelow(ix, y.path) ? `, ${countBelow(ix, y.path)} part${countBelow(ix, y.path) === 1 ? "" : "s"} below` : ""})` }); continue; }
    if (!x || !y) continue;
    const own: string[] = [];
    if (qtyText(x) !== qtyText(y)) own.push(`quantity ${qtyText(x)} vs ${qtyText(y)}`);
    const f = factsDiffer(ix.notes.get(x.path)!, ix.notes.get(y.path)!); if (f.length) own.push(`${f.join(", ")} differ${f.length === 1 ? "s" : ""}`);
    const below = stack.length < 12 && !stack.includes(x.path + "|" + y.path) ? tree(ix, x.path, y.path, level + 1, [...stack, x.path + "|" + y.path]) : [];
    if (own.length || below.length) { out.push({ level, a: x.label, b: y.label, pathA: x.path, pathB: y.path, diff: own.length ? own.join("; ") + (below.length ? "; differs below" : "") : "differs below" }); out.push(...below); }
  }
  return out;
}

export function compareNotes(ix: ModelIndex, pa: string, pb: string): CmpResult | null {
  const a = ix.notes.get(pa), b = ix.notes.get(pb); if (!a || !b) return null;
  const p = plain(ix, a, b), structure = tree(ix, pa, pb, 0, [pa + "|" + pb]);
  const differing = p.props.length + p.members.length + p.links.length + structure.length;
  return { ...p, structure, same: differing === 0, differing };
}
