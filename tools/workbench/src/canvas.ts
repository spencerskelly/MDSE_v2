/* Obsidian Canvas export (JSON Canvas 1.0). A canvas is a generated, disposable picture of one traversal: file cards for
 * notes in the vault, text cards for references whose note is not in the vault. It carries no model meaning (D-0003);
 * regenerate it any time. Layout is layered left to right by distance from the start note. */
import type { Edge, ModelIndex } from "./index.ts";
import { outgoing } from "./index.ts";
import type { Profile, ViewSpec } from "./views.ts";
import { traverse, isRequirement, requirementText, TYPE_COLOR, defaultSpec, specIsDefault } from "./views.ts";

export interface CanvasNode { id: string; type: "file" | "text"; x: number; y: number; width: number; height: number; color?: string; file?: string; text?: string }
export interface CanvasEdge { id: string; fromNode: string; toNode: string; fromSide: "left" | "right" | "top" | "bottom"; toSide: "left" | "right" | "top" | "bottom"; toEnd: "arrow"; label?: string; color?: string }
export interface CanvasDoc { nodes: CanvasNode[]; edges: CanvasEdge[] }
export interface CanvasResult { doc: CanvasDoc; notes: number; unresolved: number; capped: boolean; fileName: string; groups: number; hidden: number }

/** Temporary views: one scratch file, overwritten by every preview and deleted when the plugin loads or unloads. Git-ignored. */
export const PREVIEW_DIR = "99_System/22_Views";
export const PREVIEW_PATH = `${PREVIEW_DIR}/Workbench Preview.canvas`;
/** Saved views: where Save canvas offers to put a canvas first (the person can pick any folder). Committed like any other file. */
export const SAVED_DIR = "99_System/23_Saved_Views";
const W = 280, H = 90, GX = 120, GY = 40, MAX_UNRESOLVED = 24;
const safe = (s: string): string => s.replace(/[\\/:*?"<>|#^[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Untitled";

const hash = (s: string): string => { let h = 5381; for (const c of s) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0; return h.toString(16).slice(0, 4); };

/** `spec` is the person's view settings (filters, hops, relationship kinds, grouping); omitted means the profile's defaults. */
export function toCanvas(ix: ModelIndex, start: string, profile: Profile, spec?: Partial<ViewSpec>): CanvasResult {
  const sp = { ...defaultSpec(profile), ...spec }, depth = sp.depth, cap = sp.cap;
  const note = ix.notes.get(start);
  if (!note) throw new Error(`Note not in index: ${start}`);
  const g = traverse(ix, start, profile, depth, cap, sp);
  const id = new Map<string, string>(g.nodes.map((n, i) => [n.path, `n${i}`]));
  const allow = (e: Edge, dir: "out" | "in"): boolean => sp.kinds.length ? sp.kinds.includes(e.kind) : !profile.steps.length || profile.steps.some((s) => s.kind === e.kind && s.dir === dir);

  // text cards for references whose note is not in the vault (partial vaults, dangling links)
  const ghosts: Array<{ key: string; text: string; anchor: string; edge: Edge }> = [];
  let unresolved = 0;
  for (const n of sp.ghosts ? g.nodes : []) {
    if (n.depth >= depth || g.groups.has(n.path)) continue;
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
  const make = (it: { key: string; path?: string; text?: string }): CanvasNode => {
    const base = { id: it.key, x: 0, y: 0, width: W, height: H };
    const grp = it.path ? g.groups.get(it.path) : undefined;
    if (grp) {
      const shown = grp.members.slice(0, 12).map((m) => `- [[${m.replace(/\.md$/i, "")}|${ix.notes.get(m)!.title.replace(/[|\]]/g, " ")}]]`), color = TYPE_COLOR[grp.type];
      return { ...base, type: "text", height: 70 + shown.length * 26 + (grp.members.length > 12 ? 26 : 0), text: `**${grp.label} ×${grp.members.length}**\n\n${shown.join("\n")}${grp.members.length > 12 ? `\n- … ${grp.members.length - 12} more` : ""}`, ...(color ? { color } : {}) };
    }
    if (it.path && isRequirement(ix.notes.get(it.path)!)) {                    // requirements show name, subtype and wording on the card (IMP-097)
      const n = ix.notes.get(it.path)!, txt = requirementText(n), color = TYPE_COLOR[n.type];
      const clip = txt.length > 600 ? txt.slice(0, 600).trimEnd() + " …" : txt;
      return { ...base, type: "text", height: Math.min(520, 110 + Math.ceil(clip.length / 38) * 22), text: `**[[${n.path.replace(/\.md$/i, "")}|${n.title.replace(/[|\]]/g, " ")}]]**${n.subtype ? ` · ${n.subtype}` : ""}\n\n${clip || "_no requirement text_"}`, ...(color ? { color } : {}) };
    }
    if (it.path) { const color = TYPE_COLOR[ix.notes.get(it.path)!.type]; return { ...base, type: "file", file: it.path, ...(color ? { color } : {}) }; }
    return { ...base, type: "text", text: `${it.text}\n\n_not in vault_`, color: "1" };
  };
  for (const [d, list] of [...cols].sort((a, b) => a[0] - b[0])) {
    const cards = list.map((it) => ({ it, cn: make(it) })), total = cards.reduce((s, c) => s + c.cn.height + GY, -GY);
    let y = -total / 2;
    for (const { it, cn } of cards) { cn.x = d * (W + GX); cn.y = Math.round(y); y += cn.height + GY; nodes.push(cn); at.set(it.key, cn); }
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

  return { doc: { nodes, edges }, notes: g.nodes.length, unresolved, capped: g.capped || unresolved > ghosts.length, fileName: `${safe(note.title)} - ${safe(profile.name)}${specIsDefault(spec, profile) ? "" : " [" + hash(JSON.stringify(sp)) + "]"}.canvas`, groups: g.groups.size, hidden: g.hidden };
}
