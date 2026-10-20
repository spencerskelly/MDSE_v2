/* Obsidian Canvas export (JSON Canvas 1.0). A canvas is a generated, disposable picture of one traversal: file cards for
 * notes in the vault, text cards for references whose note is not in the vault. It carries no model meaning (D-0003);
 * regenerate it any time. Layout is layered left to right by distance from the start note. */
import type { Edge, ModelIndex } from "./index.ts";
import { outgoing } from "./index.ts";
import type { Profile } from "./views.ts";
import { traverse, TYPE_COLOR } from "./views.ts";

export interface CanvasNode { id: string; type: "file" | "text"; x: number; y: number; width: number; height: number; color?: string; file?: string; text?: string }
export interface CanvasEdge { id: string; fromNode: string; toNode: string; fromSide: "left" | "right" | "top" | "bottom"; toSide: "left" | "right" | "top" | "bottom"; toEnd: "arrow"; label?: string; color?: string }
export interface CanvasDoc { nodes: CanvasNode[]; edges: CanvasEdge[] }
export interface CanvasResult { doc: CanvasDoc; notes: number; unresolved: number; capped: boolean; fileName: string }

export const CANVAS_DIR = "99_System/12_Views";
const W = 280, H = 90, GX = 120, GY = 40, MAX_UNRESOLVED = 24;
const safe = (s: string): string => s.replace(/[\\/:*?"<>|#^[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Untitled";

export function toCanvas(ix: ModelIndex, start: string, profile: Profile, depth = profile.depth, cap = profile.cap): CanvasResult {
  const note = ix.notes.get(start);
  if (!note) throw new Error(`Note not in index: ${start}`);
  const g = traverse(ix, start, profile, depth, cap);
  const id = new Map<string, string>(g.nodes.map((n, i) => [n.path, `n${i}`]));
  const allow = (e: Edge, dir: "out" | "in"): boolean => !profile.steps.length || profile.steps.some((s) => s.kind === e.kind && s.dir === dir);

  // text cards for references whose note is not in the vault (partial vaults, dangling links)
  const ghosts: Array<{ key: string; text: string; anchor: string; edge: Edge }> = [];
  let unresolved = 0;
  for (const n of g.nodes) {
    if (n.depth >= depth) continue;
    for (const e of outgoing(ix, n.path)) {
      if (e.to || !allow(e, e.reverse ? "in" : "out")) continue;
      unresolved++;
      if (ghosts.length < MAX_UNRESOLVED) ghosts.push({ key: `g${ghosts.length}`, text: e.toSymbol, anchor: n.path, edge: e });
    }
  }

  // layered layout: one column per depth, rows stacked and centred
  const cols = new Map<number, Array<{ key: string; path?: string; text?: string }>>();
  for (const n of g.nodes) (cols.get(n.depth) ?? cols.set(n.depth, []).get(n.depth)!).push({ key: id.get(n.path)!, path: n.path });
  const depthOf = new Map(g.nodes.map((n) => [n.path, n.depth]));
  for (const x of ghosts) (cols.get((depthOf.get(x.anchor) ?? 0) + 1) ?? cols.set((depthOf.get(x.anchor) ?? 0) + 1, []).get((depthOf.get(x.anchor) ?? 0) + 1)!).push({ key: x.key, text: x.text });
  const nodes: CanvasNode[] = [], at = new Map<string, CanvasNode>();
  for (const [d, list] of [...cols].sort((a, b) => a[0] - b[0])) {
    const top = -((list.length * (H + GY) - GY) / 2);
    list.forEach((it, i) => {
      const base = { id: it.key, x: d * (W + GX), y: Math.round(top + i * (H + GY)), width: W, height: H };
      let cn: CanvasNode;
      if (it.path) { const nn = ix.notes.get(it.path)!; const color = TYPE_COLOR[nn.type]; cn = { ...base, type: "file", file: it.path, ...(color ? { color } : {}) }; }
      else cn = { ...base, type: "text", text: `${it.text}\n\n_not in vault_`, color: "1" };
      nodes.push(cn); at.set(it.key, cn);
    });
  }

  const edges: CanvasEdge[] = [];
  const side = (a: CanvasNode, b: CanvasNode): { fromSide: CanvasEdge["fromSide"]; toSide: CanvasEdge["toSide"] } =>
    b.x > a.x ? { fromSide: "right", toSide: "left" } : b.x < a.x ? { fromSide: "left", toSide: "right" } : b.y >= a.y ? { fromSide: "bottom", toSide: "top" } : { fromSide: "top", toSide: "bottom" };
  const push = (from: string, to: string, e: Edge): void => {
    const a = at.get(from), b = at.get(to); if (!a || !b) return;
    edges.push({ id: `e${edges.length}`, fromNode: from, toNode: to, ...side(a, b), toEnd: "arrow", label: [e.kind, e.label].filter(Boolean).join(" ").slice(0, 60) });
  };
  for (const e of g.edges) push(id.get(e.from)!, id.get(e.to!)!, e);
  for (const x of ghosts) { const anchor = id.get(x.anchor)!; if (x.edge.reverse) push(x.key, anchor, x.edge); else push(anchor, x.key, x.edge); }

  return { doc: { nodes, edges }, notes: g.nodes.length, unresolved, capped: g.capped || unresolved > ghosts.length, fileName: `${safe(note.title)} - ${safe(profile.name)}.canvas` };
}
