/* Find similar (feature request 2026-10-29): notes that share a relationship with the selected note.
 * Read-only and derived from the index edges (SysML block plus the YAML links it does not state, WKB-020).
 * For each relationship the selected note has, the peers are the other notes joined to the SAME note by the SAME kind:
 *   out: the selected note --kind--> T, so the peers are the other notes that also --kind--> T
 *        (other assemblies that use the same part, other functions that satisfy the same requirement).
 *   in:  S --kind--> the selected note, so the peers are the other notes S also --kind-->
 *        (the other parts of the same parent, the other requirements the same function satisfies).
 * Nothing is inferred: a peer is listed only because a resolved relationship says so. */
import type { ModelIndex } from "./index.ts";

export interface SimilarGroup {
  kind: string;
  /** "out": the selected note points at `via`. "in": `via` points at the selected note. */
  direction: "out" | "in";
  /** The shared note (path). */
  via: string;
  peers: string[];
}
export interface SimilarResult {
  groups: SimilarGroup[];
  /** Every peer once, with how many groups it appears in, most shared first. */
  peers: Array<{ path: string; shared: number }>;
}

const live = (ix: ModelIndex, p: string): boolean => ix.notes.has(p) && !ix.notes.get(p)!.meta.mergedInto;

export function findSimilar(ix: ModelIndex, path: string, opt: { kinds?: string[] } = {}): SimilarResult {
  const empty: SimilarResult = { groups: [], peers: [] };
  if (!ix.notes.has(path)) return empty;
  const want = opt.kinds?.length ? new Set(opt.kinds) : null, groups = new Map<string, SimilarGroup>();
  const add = (kind: string, direction: "out" | "in", via: string, peerEdges: Array<{ peer: string }>): void => {
    const peers = [...new Set(peerEdges.map((x) => x.peer))].filter((p) => p !== path && p !== via && live(ix, p));
    if (!peers.length) return;
    peers.sort((a, b) => ix.notes.get(a)!.title.localeCompare(ix.notes.get(b)!.title) || a.localeCompare(b));
    groups.set(`${direction}|${kind}|${via}`, { kind, direction, via, peers });
  };
  const seen = new Set<string>();
  for (const e of ix.out.get(path) ?? []) {                                            // path --kind--> T: others that also reach T
    if (!e.to || e.reverse || e.to === path || !live(ix, e.to) || (want && !want.has(e.kind))) continue;
    const k = `out|${e.kind}|${e.to}`; if (seen.has(k)) continue; seen.add(k);
    add(e.kind, "out", e.to, (ix.inn.get(e.to) ?? []).filter((x) => x.kind === e.kind && !x.reverse).map((x) => ({ peer: x.from })));
  }
  for (const e of ix.inn.get(path) ?? []) {                                            // S --kind--> path: others S also reaches
    if (e.reverse || e.from === path || !live(ix, e.from) || (want && !want.has(e.kind))) continue;
    const k = `in|${e.kind}|${e.from}`; if (seen.has(k)) continue; seen.add(k);
    add(e.kind, "in", e.from, (ix.out.get(e.from) ?? []).filter((x) => x.kind === e.kind && x.to && !x.reverse).map((x) => ({ peer: x.to! })));
  }
  const list = [...groups.values()].sort((a, b) => a.kind.localeCompare(b.kind) || (a.direction === b.direction ? 0 : a.direction === "out" ? -1 : 1) || ix.notes.get(a.via)!.title.localeCompare(ix.notes.get(b.via)!.title) || a.via.localeCompare(b.via));
  const count = new Map<string, number>();
  for (const g of list) for (const p of g.peers) count.set(p, (count.get(p) ?? 0) + 1);
  const peers = [...count].map(([p, shared]) => ({ path: p, shared })).sort((a, b) => b.shared - a.shared || ix.notes.get(a.path)!.title.localeCompare(ix.notes.get(b.path)!.title) || a.path.localeCompare(b.path));
  return { groups: list, peers };
}

/** The kinds that have at least one similar note, for the lens's kind filter. */
export const similarKinds = (r: SimilarResult): string[] => [...new Set(r.groups.map((g) => g.kind))].sort();
