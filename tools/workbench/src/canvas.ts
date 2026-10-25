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
export interface CanvasNode { id: string; type: "file" | "text" | "group"; x: number; y: number; width: number; height: number; color?: string; file?: string; text?: string; label?: string }
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

/** What a card calls a note (D-0081): its name, else its description (the shown title), and under it, smaller, its part number, else its id. */
export function cardName(n: { title: string; id: string; meta: Record<string, unknown> }): { name: string; sub: string } {
  const name = n.title.replace(/[|\[\]\n]/g, " ").replace(/\s+/g, " ").trim(), pn = String(n.meta.partNumber ?? "").trim(), sub = pn || n.id || "";
  return { name, sub: sub && sub !== name ? sub : "" };
}
/** The card for one note: a text card whose first line is the note's link, shown by name or description with the part number or id small beneath; a requirement also carries its subtype and wording (IMP-097). Position is set by the caller. */
function noteCard(ix: ModelIndex, path: string, key: string): CanvasNode {
  const base = { id: key, x: 0, y: 0, width: W, height: H }, n = ix.notes.get(path)!, color = TYPE_COLOR[n.type], { name, sub } = cardName(n);
  const link = `**[[${n.path.replace(/\.md$/i, "")}|${name}]]**`, small = sub ? `<br><small>${sub.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</small>` : "";
  if (isRequirement(n)) {
    const txt = requirementText(n), clip = txt.length > 600 ? txt.slice(0, 600).trimEnd() + " …" : txt;
    return { ...base, type: "text", height: Math.min(520, 110 + Math.ceil(clip.length / 38) * 22), text: `${link}${n.subtype ? ` · ${n.subtype}` : ""}${small}\n\n${clip || "_no requirement text_"}`, ...(color ? { color } : {}) };
  }
  return { ...base, type: "text", height: Math.max(H, 34 + Math.ceil(name.length / 24) * 26 + (sub ? 24 : 0)), text: `${link}${small}`, ...(color ? { color } : {}) };
}
/** Which sides a line leaves and enters by (D-0088): a card that is lower than the other is joined top to bottom, so a parent's line leaves its bottom and enters the top of each child; cards in the same row are joined side to side. */
const sideOf = (a: CanvasNode, b: CanvasNode): { fromSide: CanvasEdge["fromSide"]; toSide: CanvasEdge["toSide"] } =>
  b.y - a.y >= H ? { fromSide: "bottom", toSide: "top" } : a.y - b.y >= H ? { fromSide: "top", toSide: "bottom" } : b.x >= a.x ? { fromSide: "right", toSide: "left" } : { fromSide: "left", toSide: "right" };

/** A canvas of one assembly's structure (D-0088). `direct`: the note, the assemblies it is directly in on a row above it, and its direct parts on a row below. `full`: every layer of parts under it, one row per layer, each assembly centred over its parts. A line leaves the bottom of the assembly and enters the top of the part. A part used in several assemblies has one card and a line from each. */
export function structureCanvas(ix: ModelIndex, root: string, mode: "direct" | "full"): CanvasResult {
  const rn = ix.notes.get(root);
  if (!rn) return { doc: { nodes: [], edges: [] }, notes: 0, unresolved: 0, capped: false, fileName: "Structure.canvas", groups: 0, hidden: 0 };
  const kids = new Map<string, Array<{ to: string; e: ModelIndex["edges"][number] }>>(), parentsOf: Array<{ from: string; e: ModelIndex["edges"][number] }> = [];
  for (const e of ix.edges) {
    if (e.kind !== "hasPart" || !e.to || e.reverse || e.from === e.to || !ix.notes.has(e.from) || !ix.notes.has(e.to)) continue;
    (kids.get(e.from) ?? kids.set(e.from, []).get(e.from)!).push({ to: e.to, e });
    if (e.to === root) parentsOf.push({ from: e.from, e });
  }
  const name = (p: string): string => ix.notes.get(p)!.title;
  const order = (a: { to: string }, b: { to: string }): number => name(a.to).localeCompare(name(b.to)) || a.to.localeCompare(b.to);
  for (const l of kids.values()) l.sort(order);
  /* the spanning tree: each part under the first assembly that reaches it, breadth first, to the depth asked for */
  const depth = new Map<string, number>([[root, 0]]), tree = new Map<string, string[]>(), queue = [root];
  let capped = false;
  while (queue.length) {
    const p = queue.shift()!, d = depth.get(p)!;
    if (mode === "direct" && d >= 1) continue;
    for (const k of kids.get(p) ?? []) {
      if (depth.has(k.to)) continue;
      if (depth.size >= MAX_PICK) { capped = true; continue; }
      depth.set(k.to, d + 1); (tree.get(p) ?? tree.set(p, []).get(p)!).push(k.to); queue.push(k.to);
    }
  }
  const CX = W + GX, CY = H + GY, x = new Map<string, number>(); let slot = 0;
  const lay = (p: string): void => { const c = tree.get(p) ?? []; if (!c.length) { x.set(p, slot++ * CX); return; } c.forEach(lay); x.set(p, (x.get(c[0]!)! + x.get(c[c.length - 1]!)!) / 2); };
  lay(root);
  const nodes: CanvasNode[] = [], at = new Map<string, CanvasNode>(); let n = 0;
  for (const [p, d] of depth) { const c = noteCard(ix, p, `n${n++}`); c.x = Math.round(x.get(p)!); c.y = d * CY; nodes.push(c); at.set(p, c); }
  const above = [...new Map(parentsOf.map((q) => [q.from, q])).values()].filter((q) => !at.has(q.from)).sort((a, b) => name(a.from).localeCompare(name(b.from)) || a.from.localeCompare(b.from));
  const mid = at.get(root)!.x, left = mid - ((above.length - 1) * CX) / 2;
  above.forEach((q, i) => { const c = noteCard(ix, q.from, `n${n++}`); c.x = Math.round(left + i * CX); c.y = -CY; nodes.push(c); at.set(q.from, c); });
  const edges: CanvasEdge[] = [], aboveSet = new Set(above.map((q) => q.from));
  for (const [from, list] of kids) {
    const f = at.get(from); if (!f) continue;
    for (const k of list) {
      const t = at.get(k.to); if (!t) continue;
      if (aboveSet.has(from) ? k.to !== root : (depth.get(k.to) ?? 0) <= (depth.get(from) ?? 0)) continue;       // above: only the line down to the note; below: only lines that go down a layer
      edges.push({ id: `e${edges.length}${k.e.ref ? EDGE_REF_SEP + encodeURIComponent(JSON.stringify(k.e.ref)) : ""}`, fromNode: f.id, toNode: t.id, fromSide: "bottom", toSide: "top", toEnd: "arrow", label: [k.e.kind, k.e.label].filter(Boolean).join(" ").slice(0, 60) });
    }
  }
  return { doc: { nodes, edges }, notes: nodes.length, unresolved: 0, capped, fileName: `Structure - ${safe(rn.title)} (${mode === "direct" ? "direct parts" : "complete BOM"}).canvas`, groups: 0, hidden: 0 };
}

/** Notes the person picked from a search, as a canvas (D-0078): the relationships between the picked notes drawn when asked.
 * Grouped (the default, D-0080): one labelled box per note type, the boxes stacked top to bottom, each a grid at most 4 across; the cards inside are in subtype then name order.
 * Not grouped: one grid, at most 6 across. At most MAX_PICK cards; `capped` says some were left off. */
export const MAX_PICK = 200;
const GROUP_PAD = 80, GROUP_COLS = 4;
export function pickCanvas(ix: ModelIndex, paths: string[], opts: { relations: boolean; label: string; group?: boolean }): CanvasResult {
  const chosen = paths.filter((p) => ix.notes.has(p)), use = chosen.slice(0, MAX_PICK);
  const nodes: CanvasNode[] = [], cards: CanvasNode[] = [], at = new Map<string, CanvasNode>();
  const grid = (list: string[], cols: number, x0: number, y0: number, key: number): number => {      // lays one grid of cards; returns the y below it
    let y = y0;
    for (let i = 0; i < list.length; i += cols) {
      const row = list.slice(i, i + cols).map((p, j) => { const cn = noteCard(ix, p, `n${key + i + j}`); at.set(p, cn); return cn; }), rowH = Math.max(...row.map((c) => c.height));
      row.forEach((cn, j) => { cn.x = x0 + j * (W + GX); cn.y = y; cards.push(cn); });
      y += rowH + GY;
    }
    return y - GY;
  };
  let groups = 0;
  if (opts.group === false) grid(use, Math.min(6, Math.max(1, Math.ceil(Math.sqrt(use.length)))), 0, 0, 0);
  else {
    const byType = new Map<string, string[]>();
    for (const p of use) { const t = ix.notes.get(p)!.type || "(no type)"; (byType.get(t) ?? byType.set(t, []).get(t)!).push(p); }
    let y = 0, key = 0;
    for (const [t, list] of [...byType].sort((a, b) => a[0].localeCompare(b[0]))) {
      list.sort((a, b) => ix.notes.get(a)!.subtype.localeCompare(ix.notes.get(b)!.subtype) || ix.notes.get(a)!.title.localeCompare(ix.notes.get(b)!.title) || a.localeCompare(b));
      const cols = Math.min(GROUP_COLS, Math.max(1, Math.ceil(Math.sqrt(list.length)))), bottom = grid(list, cols, GROUP_PAD, y + GROUP_PAD, key), color = TYPE_COLOR[t];
      nodes.push({ id: `g${groups++}`, type: "group", x: 0, y, width: cols * W + (cols - 1) * GX + 2 * GROUP_PAD, height: bottom + GROUP_PAD - y, label: `${t} (${list.length})`, ...(color ? { color } : {}) });
      y = bottom + GROUP_PAD + GY; key += list.length;
    }
  }
  nodes.push(...cards);          // groups first, so the cards are drawn over them
  const edges: CanvasEdge[] = [];
  if (opts.relations) for (const e of ix.edges) {
    if (!e.to || e.reverse) continue;
    const a = at.get(e.from), b = at.get(e.to); if (!a || !b || a === b) continue;
    edges.push({ id: `e${edges.length}${e.ref ? EDGE_REF_SEP + encodeURIComponent(JSON.stringify(e.ref)) : ""}`, fromNode: a.id, toNode: b.id, ...sideOf(a, b), toEnd: "arrow", label: [e.kind, e.label].filter(Boolean).join(" ").slice(0, 60) });
  }
  return { doc: { nodes, edges }, notes: use.length, unresolved: 0, capped: chosen.length > use.length, fileName: `Search - ${safe(opts.label || "picked notes")} [${hash(use.join("|"))}]`, groups, hidden: 0 };
}

/** The note a card stands for: a file card, or a text card whose first line is the note's link. Group, "not in vault" and free text cards stand for none. */
export function cardNotePath(node: CanvasNode | undefined): string | null {
  if (!node) return null;
  if (node.type === "file") return node.file && /\.md$/i.test(node.file) ? node.file : null;
  const m = /^\*\*\[\[([^\]|]+)/.exec(node.text ?? "");
  return m ? (/\.md$/i.test(m[1]!) ? m[1]! : m[1] + ".md") : null;
}

/** Notes related to `path` (D-0082): every resolved relationship either way, as the other note's path with the kinds that join them. */
export function relatedNotes(ix: ModelIndex, path: string): Array<{ path: string; kinds: string[] }> {
  const by = new Map<string, Set<string>>();
  for (const e of ix.edges) {
    if (!e.to || e.reverse) continue;
    const other = e.from === path ? e.to : e.to === path ? e.from : null;
    if (other && other !== path && ix.notes.has(other)) (by.get(other) ?? by.set(other, new Set()).get(other)!).add(e.kind);
  }
  return [...by].map(([p, k]) => ({ path: p, kinds: [...k].sort() })).sort((a, b) => ix.notes.get(a.path)!.title.localeCompare(ix.notes.get(b.path)!.title) || a.path.localeCompare(b.path));
}

/** Notes related to two or more of the given notes (D-0084). `all` are related to every one of them, with the kinds that join each; `some` are related to at least two but not all, most first. The given notes themselves are left out. */
export function commonRelated(ix: ModelIndex, paths: string[]): { all: Array<{ path: string; by: Array<{ from: string; kinds: string[] }> }>; some: Array<{ path: string; count: number; by: Array<{ from: string; kinds: string[] }> }> } {
  const given = [...new Set(paths)].filter((p) => ix.notes.has(p)), per = given.map((p) => [p, new Map(relatedNotes(ix, p).map((r) => [r.path, r.kinds] as const))] as const);
  const count = new Map<string, Array<{ from: string; kinds: string[] }>>();
  for (const [p, m] of per) for (const [q, kinds] of m) if (!given.includes(q)) (count.get(q) ?? count.set(q, []).get(q)!).push({ from: p, kinds });
  const rows = [...count].map(([path, by]) => ({ path, count: by.length, by })).filter((r) => r.count >= 2 || given.length === 1).sort((a, b) => b.count - a.count || ix.notes.get(a.path)!.title.localeCompare(ix.notes.get(b.path)!.title) || a.path.localeCompare(b.path));
  return { all: given.length >= 2 ? rows.filter((r) => r.count === given.length).map(({ path, by }) => ({ path, by })) : [], some: rows.filter((r) => r.count < given.length) };
}

/** The tier of a kind of note on a canvas, top first (D-0085): use cases, then requirements, then functions and test cases, then objects. */
const LAYER: Record<string, number | undefined> = { "Use Case": 0, Requirement: 1, Behavior: 2, Verification: 2, Object: 3 };

/** Adds notes to a canvas that already holds cards (D-0082, D-0083). Cards already there are never moved. Each new note goes beside a note it relates to: next to that note's card when it is on the canvas, else next to the new note it relates to, so related notes sit together and a chain or tree spreads outward from where it joins. Direction counts (D-0085): a part goes under its assembly, a specialized element under the general one, an owned element (requirement, action, state, child) under its owner, and by kind of note a requirement goes under a use case, a function and a test case under a requirement, an object under a function. A new note related to nothing placed goes in the free space below the existing cards, one cluster of related notes after another. Cards are one card size plus a gap (D-0079) apart and overlap nothing. A note already on the canvas is not added twice. With `relations` (the default) lines are drawn between each new card and every note on the canvas it relates to. The input is not changed. */
export function addToCanvas(doc: CanvasDoc, ix: ModelIndex, anchor: string | null, paths: string[], opts: { relations?: boolean } = {}): { doc: CanvasDoc; added: number; present: number; lineIds: string[] } {
  const out: CanvasDoc = { nodes: doc.nodes.map((n) => ({ ...n })), edges: doc.edges.map((e) => ({ ...e })) };
  const onCanvas = new Map<string, CanvasNode>();
  for (const n of out.nodes) { const p = cardNotePath(n); if (p && !onCanvas.has(p)) onCanvas.set(p, n); }
  const fresh = [...new Set(paths)].filter((p) => ix.notes.has(p) && !onCanvas.has(p)), present = new Set(paths.filter((p) => onCanvas.has(p))).size;
  if (!fresh.length) return { doc: out, added: 0, present, lineIds: [] };
  const taken = new Set(out.nodes.map((n) => n.id)); let k = 0;
  const freshId = (pre: string): string => { while (taken.has(pre + k)) k++; taken.add(pre + k); return pre + k; };
  const cardOf = new Map(fresh.map((p) => [p, noteCard(ix, p, freshId("p"))] as const));
  const solids = out.nodes.filter((n) => n.type !== "group"), at = new Map<string, CanvasNode>(onCanvas), isFresh = new Set(fresh);
  const nb = new Map<string, Set<string>>();                                          // who relates to whom, among the new notes and those already on the canvas
  for (const e of ix.edges) {
    if (!e.to || e.reverse || e.from === e.to || !(isFresh.has(e.from) || isFresh.has(e.to)) || !(isFresh.has(e.from) || onCanvas.has(e.from)) || !(isFresh.has(e.to) || onCanvas.has(e.to))) continue;
    (nb.get(e.from) ?? nb.set(e.from, new Set()).get(e.from)!).add(e.to); (nb.get(e.to) ?? nb.set(e.to, new Set()).get(e.to)!).add(e.from);
  }
  const CX = W + GX, CY = H + GY, title = (p: string): string => ix.notes.get(p)!.title;
  const rel2 = new Map<string, "below" | "above">();                                   // where `a` goes relative to `b`, from how they are joined
  const OWNS = new Set(["hasPart", "hasChild", "hasAction", "hasState", "hasRequirement"]);
  for (const e of ix.edges) {
    if (!e.to || e.reverse || e.from === e.to) continue;
    if (OWNS.has(e.kind)) { rel2.set(`${e.to}|${e.from}`, "below"); rel2.set(`${e.from}|${e.to}`, "above"); }
    else if (e.kind === "specializes") { rel2.set(`${e.from}|${e.to}`, "below"); rel2.set(`${e.to}|${e.from}`, "above"); }
  }
  const dirOf = (a: string, b: string): "below" | "above" | "side" => {
    const d = rel2.get(`${a}|${b}`); if (d) return d;
    const ra = LAYER[ix.notes.get(a)!.type], rb = LAYER[ix.notes.get(b)!.type];
    return ra !== undefined && rb !== undefined && ra !== rb ? (ra > rb ? "below" : "above") : "side";
  };
  const aboveCount = (p: string): number => [...(nb.get(p) ?? [])].filter((q) => dirOf(p, q) === "below").length;   // how many notes must sit over this one
  const tier = (sign: 1 | -1): Array<[number, number]> => { const l: Array<[number, number]> = []; for (let dy = 1; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) l.push([dx, sign * dy]); return l.sort((p, q) => Math.abs(p[1]) + 0.45 * Math.abs(p[0]) - Math.abs(q[1]) - 0.45 * Math.abs(q[0]) || (p[0] > 0 ? 0 : 1) - (q[0] > 0 ? 0 : 1) || p[0] - q[0]); };
  const tiers = { below: tier(1), above: tier(-1) };
  const free = (c: CanvasNode, x: number, y: number): boolean => !solids.some((n) => x < n.x + n.width + 40 && n.x < x + c.width + 40 && y < n.y + n.height + 40 && n.y < y + c.height + 40);
  const put = (p: string, x: number, y: number): CanvasNode => { const c = cardOf.get(p)!; c.x = Math.round(x); c.y = Math.round(y); solids.push(c); out.nodes.push(c); at.set(p, c); return c; };
  const base = { x: solids.length ? Math.min(...solids.map((n) => n.x)) : 0, y: solids.length ? Math.max(...solids.map((n) => n.y + n.height)) + GY : 0 };
  const rings: Array<Array<[number, number]>> = [];                                  // grid steps around a card, nearest first, right before left
  for (let r = 1; r <= 30; r++) { const ring: Array<[number, number]> = []; for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) ring.push([dx, dy]); ring.sort((p, q) => Math.abs(p[0]) + Math.abs(p[1]) - Math.abs(q[0]) - Math.abs(q[1]) || (p[0] > 0 ? 0 : 1) - (q[0] > 0 ? 0 : 1) || Math.abs(p[1]) - Math.abs(q[1]) || p[1] - q[1]); rings.push(ring); }
  const placeNear = (p: string, ref: CanvasNode, refPath: string): void => {          // beside, under or over `refPath`'s card by how they are joined, and as close as it can be to every other placed note this one relates to
    const c = cardOf.get(p)!, others = [...(nb.get(p) ?? [])].map((q) => [q, at.get(q)] as const).filter((o): o is readonly [string, CanvasNode] => !!o[1]), d = dirOf(p, refPath);
    if (others.length > 1) {
      let best: { x: number; y: number; score: number } | null = null;
      for (const [, o] of others) for (const ring of rings.slice(0, 3)) for (const [dx, dy] of ring) {
        const x = o.x + dx * CX, y = o.y + dy * CY; if (!free(c, x, y)) continue;
        const score = others.reduce((sum, [q, n]) => { const w = dirOf(p, q), off = (w === "below" && y < n.y + n.height) || (w === "above" && y + c.height > n.y) ? 4 : 0; return sum + off + Math.abs(n.x - x) / CX + Math.abs(n.y - y) / CY; }, 0);
        if (!best || score < best.score - 1e-9) best = { x, y, score };
      }
      if (best) { put(p, best.x, best.y); return; }
    }
    if (d !== "side") for (const [dx, dy] of tiers[d]) if (free(c, ref.x + dx * CX, ref.y + dy * CY)) { put(p, ref.x + dx * CX, ref.y + dy * CY); return; }
    for (const ring of rings) for (const [dx, dy] of ring) if (free(c, ref.x + dx * CX, ref.y + dy * CY)) { put(p, ref.x + dx * CX, ref.y + dy * CY); return; }
    put(p, ref.x + 31 * CX, ref.y);
  };
  const spread = (queue: string[]): void => {                                       // breadth first: each new note beside the one it relates to
    while (queue.length) {
      const from = queue.shift()!, ref = at.get(from)!;
      for (const q of [...(nb.get(from) ?? [])].filter((x) => isFresh.has(x) && !at.has(x) ).sort((x, y) => title(x).localeCompare(title(y)) || x.localeCompare(y))) { placeNear(q, ref, from); queue.push(q); }
    }
  };
  const around = [...onCanvas.keys()].filter((p) => [...(nb.get(p) ?? [])].some((q) => isFresh.has(q)));
  around.sort((x, y) => (x === anchor ? -1 : 0) - (y === anchor ? -1 : 0));
  spread(around);
  let cursor = 0;                                                                   // free space below the existing cards for notes related to nothing placed
  const seed = (p: string): void => { const c = cardOf.get(p)!; for (;; cursor++) { const x = base.x + (cursor % 6) * CX, y = base.y + Math.floor(cursor / 6) * CY; if (free(c, x, y)) { put(p, x, y); cursor++; return; } } };
  const left = fresh.filter((p) => !at.has(p)).sort((x, y) => aboveCount(x) - aboveCount(y) || (nb.get(y)?.size ?? 0) - (nb.get(x)?.size ?? 0) || title(x).localeCompare(title(y)) || x.localeCompare(y));
  for (const p of left) { if (at.has(p)) continue; seed(p); spread([p]); }
  const lineIds: string[] = [];
  if (opts.relations !== false) for (const e of ix.edges) {
    if (!e.to || e.reverse || !(isFresh.has(e.from) || isFresh.has(e.to))) continue;
    const f = at.get(e.from), t = at.get(e.to); if (!f || !t || f === t) continue;
    const id = freshId("a") + (e.ref ? EDGE_REF_SEP + encodeURIComponent(JSON.stringify(e.ref)) : "");
    out.edges.push({ id, fromNode: f.id, toNode: t.id, ...sideOf(f, t), toEnd: "arrow", label: [e.kind, e.label].filter(Boolean).join(" ").slice(0, 60) }); lineIds.push(id);
  }
  return { doc: out, added: fresh.length, present, lineIds };
}

/** Puts notes on a canvas as one row directly below a parent's card (D-0090), nearest the parent's centre first, each joined by a line from the bottom of the parent to its top. A card that is already on the canvas stays where it is and only gets its line. A slot that another card holds is skipped along the same row. The parent is added first when it is not there. */
export function addChildren(doc: CanvasDoc, ix: ModelIndex, parent: string, paths: string[], opts: { relations?: boolean } = {}): { doc: CanvasDoc; added: number; present: number; lineIds: string[] } {
  let cur: CanvasDoc = { nodes: doc.nodes.map((n) => ({ ...n })), edges: doc.edges.map((e) => ({ ...e })) }, extra = 0;
  const find = (d: CanvasDoc, p: string): CanvasNode | undefined => d.nodes.find((n) => n.type !== "group" && cardNotePath(n) === p);
  if (!ix.notes.has(parent)) return { doc: cur, added: 0, present: 0, lineIds: [] };
  if (!find(cur, parent)) { const r = addToCanvas(cur, ix, null, [parent], { relations: false }); cur = r.doc; extra = r.added; }
  const pc = find(cur, parent)!, kids = [...new Set(paths)].filter((p) => p !== parent && ix.notes.has(p)).sort((a, b) => ix.notes.get(a)!.title.localeCompare(ix.notes.get(b)!.title) || a.localeCompare(b));
  const there = new Set(kids.filter((p) => find(cur, p))), fresh = kids.filter((p) => !there.has(p));
  const taken = new Set(cur.nodes.map((n) => n.id)); let k = 0; const nid = (pre: string): string => { while (taken.has(pre + k)) k++; taken.add(pre + k); return pre + k; };
  const CX = W + GX, CY = H + GY, solids = cur.nodes.filter((n) => n.type !== "group");
  const free = (x: number, y: number, w: number, h: number): boolean => !solids.some((n) => x < n.x + n.width + 40 && n.x < x + w + 40 && y < n.y + n.height + 40 && n.y < y + h + 40);
  const y0 = pc.y + pc.height + GY, n = fresh.length;
  const cards = fresh.map((p) => noteCard(ix, p, nid("c")));
  /* the wanted slots are centred under the parent; a held slot moves to the nearest free one on the same row, and the row is pushed down only when the row cannot hold them */
  const cx0 = pc.x + pc.width / 2, slots: number[] = []; let y = y0;
  for (let tries = 0; tries < 20; tries++, y += CY) {
    slots.length = 0; const used = new Set<number>(), order = cards.map((_, i) => i);
    const want = (i: number): number => cx0 + (i - (n - 1) / 2) * CX - cards[i]!.width / 2;
    let ok = true;
    for (const i of order) {
      let best: number | null = null;
      for (let d = 0; d <= 80 && best === null; d++) for (const sgn of d === 0 ? [0] : [1, -1]) { const x = Math.round(want(i) + sgn * d * CX); if (!used.has(x) && free(x, y, cards[i]!.width, cards[i]!.height)) { best = x; break; } }
      if (best === null) { ok = false; break; }
      used.add(best); slots[i] = best;
    }
    if (ok) break;
  }
  cards.forEach((c, i) => { c.x = slots[i]!; c.y = Math.round(y); cur.nodes.push(c); solids.push(c); });
  const lineIds: string[] = [];
  if (opts.relations !== false) {
    const on = new Map(kids.map((p) => [p, find(cur, p)!] as const));
    for (const e of ix.edges) {
      if (e.kind !== "hasPart" || !e.to || e.reverse || e.from !== parent || !on.has(e.to)) continue;
      const c = on.get(e.to)!, label = [e.kind, e.label].filter(Boolean).join(" ").slice(0, 60);
      if (cur.edges.some((x) => x.fromNode === pc.id && x.toNode === c.id && (x.label ?? "") === label)) continue;
      const id = nid("a") + (e.ref ? EDGE_REF_SEP + encodeURIComponent(JSON.stringify(e.ref)) : "");
      cur.edges.push({ id, fromNode: pc.id, toNode: c.id, fromSide: "bottom", toSide: "top", toEnd: "arrow", label }); lineIds.push(id);
    }
  }
  return { doc: cur, added: fresh.length + extra, present: there.size, lineIds };
}

/** Auto-layout (D-0089): moves the cards that stand for notes into rows by the layout rules and leaves every other card (text notes, groups, images) where it is. Rules: an assembly is above its parts and a general element above the specialized one; a requirement and use case share a row with the use case to the left; a function and a test case are below the requirement they relate to; an object is below the function. Where rules would contradict each other, ownership and specialization win. Each assembly is centred over its parts; related notes are kept together and notes with no relationship are in a grid beneath. Lines between moved cards are re-attached bottom to top. */
export function autoLayout(doc: CanvasDoc, ix: ModelIndex): { doc: CanvasDoc; moved: number; kept: number } {
  const out: CanvasDoc = { nodes: doc.nodes.map((n) => ({ ...n })), edges: doc.edges.map((e) => ({ ...e })) };
  const node = new Map<string, CanvasNode>();
  for (const n of out.nodes) { if (n.type === "group") continue; const p = cardNotePath(n); if (p && ix.notes.has(p) && !node.has(p)) node.set(p, n); }
  const paths = [...node.keys()], inSet = new Set(paths), CX = W + GX;
  if (!paths.length) return { doc: out, moved: 0, kept: out.nodes.length };
  const title = (p: string): string => ix.notes.get(p)!.title, typeOf = (p: string): string => ix.notes.get(p)!.type;
  const TIER: Record<string, number | undefined> = { "Use Case": 0, Requirement: 0, Behavior: 1, Verification: 1, Object: 2 };
  const OWNS = new Set(["hasPart", "hasChild", "hasAction", "hasState", "hasRequirement"]);
  const rel = new Map<string, Set<string>>(), down = new Map<string, Set<string>>(), up = new Map<string, Set<string>>();
  const link = (m: Map<string, Set<string>>, a: string, b: string): void => { (m.get(a) ?? m.set(a, new Set()).get(a)!).add(b); };
  const reaches = (a: string, b: string): boolean => { const seen = new Set<string>(), st = [a]; while (st.length) { const x = st.pop()!; if (x === b) return true; if (seen.has(x)) continue; seen.add(x); for (const y of down.get(x) ?? []) st.push(y); } return false; };
  const above = (a: string, b: string): void => { if (a === b || down.get(a)?.has(b) || reaches(b, a)) return; link(down, a, b); link(up, b, a); };
  const edges = ix.edges.filter((e) => e.to && !e.reverse && e.from !== e.to && inSet.has(e.from) && inSet.has(e.to));
  for (const e of edges) { link(rel, e.from, e.to!); link(rel, e.to!, e.from); }
  for (const e of edges) { if (OWNS.has(e.kind)) above(e.from, e.to!); else if (e.kind === "specializes") above(e.to!, e.from); }
  for (const e of edges) { if (OWNS.has(e.kind) || e.kind === "specializes") continue; const ta = TIER[typeOf(e.from)], tb = TIER[typeOf(e.to!)]; if (ta !== undefined && tb !== undefined && ta !== tb) ta < tb ? above(e.from, e.to!) : above(e.to!, e.from); }
  const row = new Map<string, number>(), rowOf = (p: string): number => { const k = row.get(p); if (k !== undefined) return k; const r = Math.max(-1, ...[...(up.get(p) ?? [])].map(rowOf)) + 1; row.set(p, r); return r; };
  for (const p of paths) rowOf(p);
  /* connected groups of notes; a note with no relationship to any other on the canvas goes to the grid */
  const comp = new Map<string, number>(); let nc = 0;
  for (const p of paths) { if (comp.has(p) || !rel.get(p)?.size) continue; const st = [p]; comp.set(p, nc); while (st.length) for (const q of rel.get(st.pop()!) ?? []) if (!comp.has(q)) { comp.set(q, nc); st.push(q); } nc++; }
  const pos = new Map<string, { x: number; y: number }>();
  const box = paths.map((p) => node.get(p)!), ox = Math.min(...box.map((n) => n.x)), oy = Math.min(...box.map((n) => n.y));
  let cursorX = ox, bottom = oy;
  const comps = [...Array(nc).keys()].map((c) => paths.filter((p) => comp.get(p) === c)).sort((a, b) => b.length - a.length || title(a[0]!).localeCompare(title(b[0]!)));
  for (const members of comps) {
    const rows = new Map<number, string[]>(); for (const p of members) (rows.get(row.get(p)!) ?? rows.set(row.get(p)!, []).get(row.get(p)!)!).push(p);
    const keys = [...rows.keys()].sort((a, b) => a - b), px = new Map<string, number>();
    const sweep = (list: string[], want: Map<string, number>): void => { let prev = -Infinity; for (const p of list) { const x = prev === -Infinity ? (want.get(p) ?? 0) : Math.max(prev + CX, want.get(p) ?? prev + CX); px.set(p, x); prev = x; } };
    const bary = (p: string, side: Map<string, Set<string>>): number | undefined => { const xs = [...(side.get(p) ?? [])].filter((q) => px.has(q)).map((q) => px.get(q)!); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined; };
    for (const r of keys) {
      const list = rows.get(r)!, want = new Map<string, number>();
      for (const p of list) { const b = bary(p, up); if (b !== undefined) want.set(p, b); }
      list.sort((a, b) => (want.has(a) && want.has(b) ? want.get(a)! - want.get(b)! : Number(want.has(b)) - Number(want.has(a))) || (TIER[typeOf(a)] ?? 9) - (TIER[typeOf(b)] ?? 9) || (typeOf(a) === "Use Case" ? 0 : 1) - (typeOf(b) === "Use Case" ? 0 : 1) || title(a).localeCompare(title(b)) || a.localeCompare(b));
      for (const uc of list.filter((p) => typeOf(p) === "Use Case")) {        // a use case sits to the left of the requirements it relates to
        const reqs = list.filter((q) => typeOf(q) === "Requirement" && rel.get(uc)?.has(q)), first = reqs.length ? Math.min(...reqs.map((q) => list.indexOf(q))) : -1;
        if (first >= 0 && list.indexOf(uc) > first) { list.splice(list.indexOf(uc), 1); list.splice(first, 0, uc); }
      }
      sweep(list, want);
    }
    for (const r of [...keys].reverse()) {                                   // centre each assembly over its parts
      const list = rows.get(r)!, want = new Map<string, number>();
      for (const p of list) { const b = bary(p, down); if (b !== undefined) want.set(p, b); }
      sweep(list, new Map([...list].map((p) => [p, want.get(p) ?? px.get(p)!] as const)));
    }
    const minX = Math.min(...members.map((p) => px.get(p)!)), maxX = Math.max(...members.map((p) => px.get(p)!));
    let y = oy;
    for (const r of keys) { for (const p of rows.get(r)!) pos.set(p, { x: cursorX + px.get(p)! - minX, y }); y += Math.max(...rows.get(r)!.map((p) => node.get(p)!.height)) + GY; }
    bottom = Math.max(bottom, y - GY); cursorX += maxX - minX + CX;
  }
  const alone = paths.filter((p) => !comp.has(p)).sort((a, b) => (TIER[typeOf(a)] ?? 9) - (TIER[typeOf(b)] ?? 9) || typeOf(a).localeCompare(typeOf(b)) || title(a).localeCompare(title(b)) || a.localeCompare(b));
  if (alone.length) { const y0 = comps.length ? bottom + GY : oy; for (let i = 0; i < alone.length; i += 6) { const rowP = alone.slice(i, i + 6); rowP.forEach((p, j) => pos.set(p, { x: ox + j * CX, y: y0 + (i / 6) * (Math.max(...alone.map((q) => node.get(q)!.height)) + GY) })); } }
  let moved = 0;
  for (const [p, at] of pos) { const n = node.get(p)!; if (n.x !== Math.round(at.x) || n.y !== Math.round(at.y)) moved++; n.x = Math.round(at.x); n.y = Math.round(at.y); }
  const byId = new Map(out.nodes.map((n) => [n.id, n])), done = new Set([...node.values()].map((n) => n.id));
  for (const e of out.edges) { const a = byId.get(e.fromNode), b = byId.get(e.toNode); if (a && b && done.has(a.id) && done.has(b.id)) Object.assign(e, sideOf(a, b)); }
  return { doc: out, moved, kept: out.nodes.length - node.size };
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
