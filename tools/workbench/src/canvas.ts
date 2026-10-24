/* Obsidian Canvas export (JSON Canvas 1.0). A canvas is a generated, disposable picture of one traversal: file cards for
 * notes in the vault, text cards for references whose note is not in the vault. It carries no model meaning (D-0003);
 * regenerate it any time. Layout is layered left to right by distance from the start note. */
import type { Edge, EdgeRef, ModelIndex } from "./index.ts";
import { outgoing } from "./index.ts";
import type { Profile, ViewSpec } from "./views.ts";
import { traverse, isRequirement, requirementText, TYPE_COLOR, defaultSpec, specIsDefault } from "./views.ts";

/** A canvas edge id carries the relationship it draws, so a selected line can be edited (D-0031). */
export const EDGE_REF_SEP = "~r~";
export function edgeRefOfId(id: string): EdgeRef | null {
  const i = id.indexOf(EDGE_REF_SEP);
  if (i < 0) return null;
  try { const r = JSON.parse(decodeURIComponent(id.slice(i + EDGE_REF_SEP.length))); return r && typeof r.owner === "string" && typeof r.key === "string" && typeof r.kind === "string" ? r as EdgeRef : null; } catch { return null; }
}
export interface CanvasNode { id: string; type: "file" | "text"; x: number; y: number; width: number; height: number; color?: string; file?: string; text?: string }
export interface CanvasEdge { id: string; fromNode: string; toNode: string; fromSide: "left" | "right" | "top" | "bottom"; toSide: "left" | "right" | "top" | "bottom"; toEnd: "arrow"; label?: string; color?: string }
export interface CanvasDoc { nodes: CanvasNode[]; edges: CanvasEdge[] }
export interface CanvasResult { doc: CanvasDoc; notes: number; unresolved: number; capped: boolean; fileName: string; groups: number; hidden: number }

/** Temporary views: one scratch file, overwritten by every preview and deleted when the plugin loads or unloads. Git-ignored. */
export const PREVIEW_DIR = "99_System/22_Views";
export const PREVIEW_PATH = `${PREVIEW_DIR}/Workbench Preview.canvas`;
/** Saved views: where Save canvas offers to put a canvas first (the person can pick any folder). Committed like any other file. */
export const SAVED_DIR = "99_System/23_Saved_Views";
/** Card size and the space between cards: three times the card width across and three times the card height down (D-0079). */
export const SPACING = 3;
const W = 280, H = 90, GX = SPACING * W, GY = SPACING * H, MAX_UNRESOLVED = 24;
const safe = (s: string): string => s.replace(/[\\/:*?"<>|#^[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Untitled";

const hash = (s: string): string => { let h = 5381; for (const c of s) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0; return h.toString(16).slice(0, 4); };

/** The card for one note: a file card, or for a requirement a text card carrying its name, subtype and wording (IMP-097). Position is set by the caller. */
function noteCard(ix: ModelIndex, path: string, key: string): CanvasNode {
  const base = { id: key, x: 0, y: 0, width: W, height: H }, n = ix.notes.get(path)!, color = TYPE_COLOR[n.type];
  if (isRequirement(n)) {
    const txt = requirementText(n), clip = txt.length > 600 ? txt.slice(0, 600).trimEnd() + " …" : txt;
    return { ...base, type: "text", height: Math.min(520, 110 + Math.ceil(clip.length / 38) * 22), text: `**[[${n.path.replace(/\.md$/i, "")}|${n.title.replace(/[|\]]/g, " ")}]]**${n.subtype ? ` · ${n.subtype}` : ""}\n\n${clip || "_no requirement text_"}`, ...(color ? { color } : {}) };
  }
  return { ...base, type: "file", file: path, ...(color ? { color } : {}) };
}
const sideOf = (a: CanvasNode, b: CanvasNode): { fromSide: CanvasEdge["fromSide"]; toSide: CanvasEdge["toSide"] } =>
  b.x > a.x ? { fromSide: "right", toSide: "left" } : b.x < a.x ? { fromSide: "left", toSide: "right" } : b.y >= a.y ? { fromSide: "bottom", toSide: "top" } : { fromSide: "top", toSide: "bottom" };

/** Notes the person picked from a search, as a canvas (D-0078): a grid of cards, the relationships between the picked notes drawn when asked.
 * At most MAX_PICK cards; `capped` says some were left off. */
export const MAX_PICK = 200;
export function pickCanvas(ix: ModelIndex, paths: string[], opts: { relations: boolean; label: string }): CanvasResult {
  const chosen = paths.filter((p) => ix.notes.has(p)), use = chosen.slice(0, MAX_PICK), cols = Math.min(6, Math.max(1, Math.ceil(Math.sqrt(use.length))));
  const nodes: CanvasNode[] = [], at = new Map<string, CanvasNode>();
  let y = 0;
  for (let i = 0; i < use.length; i += cols) {
    const row = use.slice(i, i + cols).map((p, j) => { const cn = noteCard(ix, p, `n${i + j}`); at.set(p, cn); return cn; }), rowH = Math.max(...row.map((c) => c.height));
    row.forEach((cn, j) => { cn.x = j * (W + GX); cn.y = y; nodes.push(cn); });
    y += rowH + GY;
  }
  const edges: CanvasEdge[] = [];
  if (opts.relations) for (const e of ix.edges) {
    if (!e.to || e.reverse) continue;
    const a = at.get(e.from), b = at.get(e.to); if (!a || !b || a === b) continue;
    edges.push({ id: `e${edges.length}${e.ref ? EDGE_REF_SEP + encodeURIComponent(JSON.stringify(e.ref)) : ""}`, fromNode: a.id, toNode: b.id, ...sideOf(a, b), toEnd: "arrow", label: [e.kind, e.label].filter(Boolean).join(" ").slice(0, 60) });
  }
  return { doc: { nodes, edges }, notes: use.length, unresolved: 0, capped: chosen.length > use.length, fileName: `Search - ${safe(opts.label || "picked notes")} [${hash(use.join("|"))}]`, groups: 0, hidden: 0 };
}

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
    if (it.path) return noteCard(ix, it.path, it.key);
    return { ...base, type: "text", text: `${it.text}\n\n_not in vault_`, color: "1" };
  };
  for (const [d, list] of [...cols].sort((a, b) => a[0] - b[0])) {
    const cards = list.map((it) => ({ it, cn: make(it) })), total = cards.reduce((s, c) => s + c.cn.height + GY, -GY);
    let y = -total / 2;
    for (const { it, cn } of cards) { cn.x = d * (W + GX); cn.y = Math.round(y); y += cn.height + GY; nodes.push(cn); at.set(it.key, cn); }
  }

  const edges: CanvasEdge[] = [];
  const push = (from: string, to: string, e: Edge): void => {
    const a = at.get(from), b = at.get(to); if (!a || !b) return;
    edges.push({ id: `e${edges.length}${e.ref ? EDGE_REF_SEP + encodeURIComponent(JSON.stringify(e.ref)) : ""}`, fromNode: from, toNode: to, ...sideOf(a, b), toEnd: "arrow", label: [e.kind, e.label].filter(Boolean).join(" ").slice(0, 60) });
  };
  for (const e of g.edges) push(id.get(e.from)!, id.get(e.to!)!, e);
  for (const x of ghosts) { const anchor = id.get(x.anchor)!; if (x.edge.reverse) push(x.key, anchor, x.edge); else push(anchor, x.key, x.edge); }

  return { doc: { nodes, edges }, notes: g.nodes.length, unresolved, capped: g.capped || unresolved > ghosts.length, fileName: `${safe(note.title)} - ${safe(profile.name)}${specIsDefault(spec, profile) ? "" : " [" + hash(JSON.stringify(sp)) + "]"}.canvas`, groups: g.groups.size, hidden: g.hidden };
}
