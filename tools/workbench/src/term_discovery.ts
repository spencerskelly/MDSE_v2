/* Read-only discovery of terms across governed engineering notes.
 * Words are evidence for finding candidate relationships, never model relationships.
 * The browser builds this disposable index in batches; no persisted search database. */
import type { ModelIndex, Note } from "./index.ts";

export const TERM_FIELDS = ["name", "aliases", "description", "body", "sysml", "identity"] as const;
export type TermField = typeof TERM_FIELDS[number];
export interface TermEvidence { path: string; type: string; fields: TermField[]; score: number; excerpt: string }
export interface TermTypeGroup { type: string; total: number; matches: TermEvidence[] }
export interface TermSearch { terms: string[]; total: number; groups: TermTypeGroup[]; truncated: boolean }
export interface TermFrequency { word: string; notes: number; types: number; byType: Array<{ type: string; count: number }> }
export interface TermCatalog {
  postings: Map<string, Map<string, number>>;
  typeCounts: Map<string, Map<string, number>>;
  notes: Map<string, Note>;
  indexed: number;
}
const BIT: Record<TermField, number> = { name: 1, aliases: 2, description: 4, body: 8, sysml: 16, identity: 32 };
const WEIGHT: Record<TermField, number> = { name: 10, aliases: 8, description: 6, body: 2, sysml: 3, identity: 9 };
const STOP = new Set(("the and for from with into about above below when where what which while this that these those there their them then than " +
  "are was were has had have does did shall should would could will must can may not but all any one two each per using use used " +
  "sysml def part port item attribute requirement verification action state ref in out to of by at as is be on it its or an a a").split(/\s+/));
export function tokenizeTerms(text: string): string[] {
  const lower = text.normalize("NFKC").toLocaleLowerCase("en-US");
  const raw = lower.match(/[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*/gu) ?? [];
  const out: string[] = [];
  for (const w of raw) {
    out.push(w);
    if (w.includes("-") || w.includes("_")) out.push(...w.split(/[-_]+/).filter(Boolean));
  }
  return out;
}
function noteFields(n: Note): Record<TermField, string> {
  return { name: [n.title, String(n.meta.name ?? "")].join(" "), aliases: String(n.meta.aliases ?? ""),
    description: [String(n.meta.description ?? ""), n.def?.doc ?? ""].join(" "),
    body: n.body, sysml: n.block ?? "",
    identity: [n.id, n.uid, n.name, String(n.meta.partNumber ?? "")].join(" ") };
}
export function emptyTermCatalog(): TermCatalog {
  return { postings: new Map(), typeCounts: new Map(), notes: new Map(), indexed: 0 };
}
export function addTermNote(c: TermCatalog, n: Note): void {
  if (c.notes.has(n.path)) return;
  c.notes.set(n.path, n);
  c.indexed++;
  const fields = noteFields(n);
  const terms = new Map<string, number>();
  for (const field of TERM_FIELDS) {
    const words = new Set(tokenizeTerms(fields[field]));
    for (const word of words) terms.set(word, (terms.get(word) ?? 0) | BIT[field]);
  }
  for (const [word, mask] of terms) {
    (c.postings.get(word) ?? c.postings.set(word, new Map()).get(word)!).set(n.path, mask);
    const types = c.typeCounts.get(word) ?? new Map<string, number>();
    types.set(n.type, (types.get(n.type) ?? 0) + 1);
    c.typeCounts.set(word, types);
  }
}
export function buildTermCatalog(ix: ModelIndex): TermCatalog {
  const c = emptyTermCatalog();
  for (const n of ix.notes.values()) addTermNote(c, n);
  return c;
}
export function commonTerms(c: TermCatalog, max = 24, minNotes = 2, crossTypeOnly = true): TermFrequency[] {
  const found: TermFrequency[] = [];
  for (const [word, postings] of c.postings) {
    if (word.length < 3 || STOP.has(word) || postings.size < minNotes) continue;
    const types = c.typeCounts.get(word)!;
    if (crossTypeOnly && types.size < 2) continue;
    found.push({ word, notes: postings.size, types: types.size,
      byType: [...types].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)) });
  }
  found.sort((a, b) => b.types - a.types || b.notes - a.notes || a.word.localeCompare(b.word));
  return found.slice(0, Math.max(0, max));
}
function excerpt(n: Note, word: string, mask: number): string {
  const f = noteFields(n);
  const sources = TERM_FIELDS.filter((t) => mask & BIT[t]).sort((a, b) => WEIGHT[b] - WEIGHT[a]);
  const source = sources[0] ?? "body", raw = f[source].replace(/\s+/g, " ").trim();
  const at = raw.toLocaleLowerCase("en-US").indexOf(word);
  const start = Math.max(0, at < 0 ? 0 : at - 48);
  const text = raw.slice(start, start + 160);
  return (start ? "…" : "") + text + (start + 160 < raw.length ? "…" : "");
}
export function searchTermCatalog(c: TermCatalog, query: string, perType = 25, typeFilter = ""): TermSearch {
  const terms = [...new Set(tokenizeTerms(query))].filter(Boolean);
  if (!terms.length) return { terms, total: 0, groups: [], truncated: false };
  const postings = terms.map((w) => c.postings.get(w));
  if (postings.some((x) => !x)) return { terms, total: 0, groups: [], truncated: false };
  postings.sort((a, b) => a!.size - b!.size);
  const first = postings[0]!, totals = new Map<string, number>();
  const ranked = new Map<string, Array<{ path: string; score: number; fields: TermField[] }>>();
  const cap = Math.max(0, Math.floor(perType));
  const compare = (a: { path: string; score: number }, b: { path: string; score: number }): number =>
    b.score - a.score || a.path.localeCompare(b.path);
  for (const [path] of first) {
    const masks = postings.map((p) => p!.get(path));
    if (masks.some((m) => !m)) continue; // AND match: every requested term belongs to the same note
    const n = c.notes.get(path)!;
    if (typeFilter && n.type !== typeFilter) continue;
    totals.set(n.type, (totals.get(n.type) ?? 0) + 1);
    if (!cap) continue;
    const score = masks.reduce<number>((sum, m) => sum + Math.max(...TERM_FIELDS.filter((f) => m! & BIT[f]).map((f) => WEIGHT[f])), 0);
    const hits = ranked.get(n.type) ?? [];
    const hit = { path, score, fields: TERM_FIELDS.filter((field) => masks.some((m) => m! & BIT[field])) };
    // Bound the retained candidates per type: broad legacy searches must not
    // materialize excerpts or sort 100,000 matching records on every query.
    if (hits.length < cap || compare(hit, hits[hits.length - 1]!) < 0) {
      let i = 0; while (i < hits.length && compare(hits[i]!, hit) <= 0) i++;
      hits.splice(i, 0, hit);
      if (hits.length > cap) hits.pop();
      ranked.set(n.type, hits);
    }
  }
  const groups = [...totals].map(([type, total]) => ({
    type, total,
    matches: (ranked.get(type) ?? []).map((r): TermEvidence => ({
      ...r, type, excerpt: excerpt(c.notes.get(r.path)!, terms[0]!, c.postings.get(terms[0]!)!.get(r.path)!),
    })),
  })).sort((a, b) => b.total - a.total || a.type.localeCompare(b.type));
  const total = [...totals.values()].reduce((a, n) => a + n, 0);
  return { terms, total, groups, truncated: groups.some((g) => g.total > g.matches.length) };
}
