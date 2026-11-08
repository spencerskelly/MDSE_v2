/* D-0146: keyword review. The parts a BOM import left in Uncategorized, grouped by the word their description starts with (a description starts with what the part is), each group with the category the PLACED parts that start the same way carry.
 * Read-only and derived from the index: a suggestion is shown only with the evidence for it (how many placed parts, what share), never as a fact. */
import type { ModelIndex } from "./index.ts";

export const UNCATEGORIZED = "Uncategorized";
export interface KeywordGroup {
  /** The head word, or the first two words when the head word alone is not decisive. */
  key: string;
  /** Part-number notes (paths) of the uncategorized parts in this group. */
  parts: string[];
  examples: string[];
  /** The category most placed parts with this key carry, if at least `minEvidence` do. */
  suggested: string | null;
  /** Placed parts with this key, by category, most first. */
  evidence: Array<{ category: string; count: number }>;
  /** Share of the placed parts with this key that carry `suggested` (0 to 1). */
  share: number;
}
export interface KeywordResult { total: number; uncategorized: number; groups: KeywordGroup[]; byCategory: Array<{ category: string; count: number }> }

const WORD = /[A-Za-z][A-Za-z0-9]+/g;
export const wordsOf = (s: string): string[] => (s.toUpperCase().match(WORD) ?? []);

export function keywordGroups(ix: ModelIndex, o: { minEvidence?: number; splitBelow?: number; splitAt?: number } = {}): KeywordResult {
  const minEvidence = o.minEvidence ?? 3, splitBelow = o.splitBelow ?? 0.8, splitAt = o.splitAt ?? 10;
  // a part is a part-number note (it carries bomCategory); its description lives on the part number's own note or on a revision note
  const desc = new Map<string, string>(), cat = new Map<string, { path: string; category: string }>();
  for (const n of ix.notes.values()) {
    if (n.meta.mergedInto) continue;
    const pn = String(n.meta.partNumber ?? "").trim(); if (!pn) continue;
    const d = String(n.meta.description ?? "").trim(); if (d && !desc.has(pn)) desc.set(pn, d);
    const c = String(n.meta.bomCategory ?? "").trim(); if (c && !cat.has(pn)) cat.set(pn, { path: n.path, category: c });
  }
  const placed: Array<{ words: string[]; category: string }> = [], open: Array<{ pn: string; path: string; words: string[] }> = [];
  const byCategory = new Map<string, number>();
  for (const [pn, { path, category }] of cat) {
    byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
    const words = wordsOf(desc.get(pn) ?? "");
    if (category === UNCATEGORIZED) open.push({ pn, path, words }); else placed.push({ words, category });
  }
  const evidenceFor = (match: (w: string[]) => boolean): Array<{ category: string; count: number }> => {
    const m = new Map<string, number>(); for (const p of placed) if (match(p.words)) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return [...m].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
  };
  const head = new Map<string, typeof open>();
  for (const p of open) { const k = p.words[0] ?? "(no description)"; (head.get(k) ?? head.set(k, []).get(k)!).push(p); }
  const groups: KeywordGroup[] = [];
  const make = (key: string, items: typeof open, ev: Array<{ category: string; count: number }>): KeywordGroup => {
    const total = ev.reduce((a, e) => a + e.count, 0), top = ev[0];
    const ok = !!top && total >= minEvidence;
    return { key, parts: items.map((p) => p.path), examples: items.slice(0, 3).map((p) => p.pn), suggested: ok ? top!.category : null, evidence: ev, share: ok ? top!.count / total : 0 };
  };
  for (const [k, items] of head) {
    const ev = evidenceFor((w) => w[0] === k), total = ev.reduce((a, e) => a + e.count, 0), share = total ? ev[0]!.count / total : 1;
    if (items.length >= splitAt && total >= minEvidence && share < splitBelow) {   // the head word is not decisive: split by the second word
      const second = new Map<string, typeof open>(); for (const p of items) { const s = p.words[1] ?? ""; (second.get(s) ?? second.set(s, []).get(s)!).push(p); }
      for (const [s, sub] of second) groups.push(make(s ? `${k} ${s}` : k, sub, s ? evidenceFor((w) => w[0] === k && w[1] === s) : ev));
    } else groups.push(make(k, items, ev));
  }
  groups.sort((a, b) => b.parts.length - a.parts.length || a.key.localeCompare(b.key));
  return { total: cat.size, uncategorized: open.length, groups, byCategory: [...byCategory].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count) };
}

/* ---- What adding a word to a category would do ---------------------------------------------------------------- */
import { bomCategoryOf, NO_CATEGORY, type CategoryRule } from "../../importer/src/bom_category.ts";
export interface WordPreview {
  /** Uncategorized parts the word would place. */
  placed: number;
  /** Parts that carry another category now and would move, by from and to, most first. A part whose category came from the BOM's own category column keeps it on import; the notes do not record which. */
  moved: Array<{ from: string; count: number }>;
  movedTotal: number;
  /** Part-number note paths of the newly placed parts. */
  placedPaths: string[];
}
/** Add `word` to `category` in a copy of `rules` and count what the table would then do to every part (the same matching the import uses). */
export function previewWord(ix: ModelIndex, rules: CategoryRule[], word: string, category: string): WordPreview {
  const w = word.trim().toUpperCase(), next = rules.map((r) => ({ ...r, words: [...r.words] }));
  let target = next.find((r) => r.category === category); if (!target) { target = { category, words: [] }; next.push(target); }
  if (!target.words.includes(w)) target.words.push(w);
  const desc = new Map<string, string>(), cat = new Map<string, { path: string; category: string }>();
  for (const n of ix.notes.values()) {
    if (n.meta.mergedInto) continue;
    const pn = String(n.meta.partNumber ?? "").trim(); if (!pn) continue;
    const d = String(n.meta.description ?? "").trim(); if (d && !desc.has(pn)) desc.set(pn, d);
    const c = String(n.meta.bomCategory ?? "").trim(); if (c && !cat.has(pn)) cat.set(pn, { path: n.path, category: c });
  }
  const moved = new Map<string, number>(), placedPaths: string[] = []; let movedTotal = 0;
  for (const [pn, { path, category: now }] of cat) {
    const d = desc.get(pn) ?? ""; if (!wordsOf(d).includes(w)) continue;   // only a part with the word can change
    const was = bomCategoryOf(d, rules), will = bomCategoryOf(d, next);
    if (will === was || will !== category) continue;
    if (now === "Uncategorized" || now === NO_CATEGORY) placedPaths.push(path); else { moved.set(now, (moved.get(now) ?? 0) + 1); movedTotal++; }
  }
  return { placed: placedPaths.length, placedPaths, movedTotal, moved: [...moved].map(([from, count]) => ({ from, count })).sort((a, b) => b.count - a.count) };
}
