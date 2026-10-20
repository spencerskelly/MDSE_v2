/* Views over the index. Each function returns plain data; the page and the Obsidian shell draw it.
 * Ported from V1: view profiles are data (which relationship kinds to follow, in which direction), a traversal
 * with a node cap, and a drawn result that is presentation only. Rewritten for V2: the relationship kinds come
 * from the SysML v2 text, not from YAML fields. */
import type { Edge, ModelIndex, Note } from "./index.ts";
import { incoming, outgoing } from "./index.ts";

export interface TreeNode { path: string | null; label: string; detail: string; kind: string; qty: number; children: TreeNode[]; cycle?: boolean; more?: number }
const node = (path: string | null, label: string, kind = "", detail = "", qty = 1): TreeNode => ({ path, label, detail, kind, qty, children: [] });
const nm = (ix: ModelIndex, p: string | null, fallback: string): string => (p ? ix.notes.get(p)?.title ?? fallback : fallback);

/** "[3]" -> 3, "[0..1]" -> 1 (upper bound), "[*]" -> 1 (unknown). */
export function qtyOf(label: string): number {
  const m = /\[(\d+)(?:\.\.(\d+|\*))?\]/.exec(label);
  if (!m) return 1;
  if (m[2] && m[2] !== "*") return +m[2];
  return m[2] === "*" ? 1 : +m[1]!;
}

const OWNED = ["hasPart", "hasPort", "hasAction", "hasState", "hasFlow"];
const CONTAIN = ["hasPart", "hasPort", "hasAction", "hasState", "specializes"];

/* ---- Structure ------------------------------------------------------------------------------------------------ */
export interface StructureResult { tree: TreeNode; supers: string[]; subs: string[]; untyped: string[] }
export function structure(ix: ModelIndex, root: string, maxDepth = 6, perParent = 40): StructureResult {
  const walk = (p: string, label: string, kind: string, mult: string, stack: string[]): TreeNode => {
    const n = ix.notes.get(p)!;
    const t = node(p, label || n.title, kind, mult, qtyOf(mult));
    if (stack.includes(p)) { t.cycle = true; return t; }
    if (stack.length >= maxDepth) return t;
    const kids = outgoing(ix, p).filter((e) => OWNED.includes(e.kind));
    for (const e of kids.slice(0, perParent)) t.children.push(!e.to ? node(null, e.label.replace(/\[.*$/, "").replace(/^(in|out|inout) /, ""), e.kind, `: ${e.toSymbol} (not in vault)`, qtyOf(e.label)) : walk(e.to, e.label.replace(/\[.*$/, "").replace(/^(in|out|inout) /, ""), e.kind, (/\[.*\]/.exec(e.label) ?? [""])[0], [...stack, p]));
    if (kids.length > perParent) t.more = kids.length - perParent;
    return t;
  };
  const n = ix.notes.get(root)!;
  const supers: string[] = [], seen = new Set<string>([root]);
  for (let cur = root, guard = 0; guard < 20; guard++) { const e = outgoing(ix, cur).find((x) => x.kind === "specializes" && x.to && !seen.has(x.to)); if (!e) break; supers.push(e.to!); seen.add(e.to!); cur = e.to!; }
  const subs = incoming(ix, root).filter((e) => e.kind === "specializes").map((e) => e.from);
  const untyped = (n.def?.usages ?? []).filter((u) => !u.type && u.kind !== "fork" && u.kind !== "join").map((u) => `${u.kind} ${u.name}`);
  return { tree: walk(root, n.title, "root", "", []), supers, subs, untyped };
}

/** Rolled-up parts list: how many of each definition sit under the root, multiplying through the assembly. */
export function bom(ix: ModelIndex, root: string, maxDepth = 12): Array<{ path: string; title: string; qty: number; depth: number }> {
  const acc = new Map<string, { qty: number; depth: number }>();
  const walk = (p: string, mult: number, depth: number, stack: string[]): void => {
    if (depth > maxDepth || stack.includes(p)) return;
    for (const e of outgoing(ix, p)) {
      if (e.kind !== "hasPart" || !e.to) continue;
      const q = mult * qtyOf(e.label), cur = acc.get(e.to);
      acc.set(e.to, { qty: (cur?.qty ?? 0) + q, depth: Math.min(cur?.depth ?? 99, depth) });
      walk(e.to, q, depth + 1, [...stack, p]);
    }
  };
  walk(root, 1, 1, []);
  return [...acc].map(([path, v]) => ({ path, title: nm(ix, path, path), ...v })).sort((a, b) => a.depth - b.depth || a.title.localeCompare(b.title));
}

/* ---- Where used ----------------------------------------------------------------------------------------------- */
export interface WhereUsedResult { tree: TreeNode; roots: string[]; references: Array<{ path: string; kind: string; label: string }> }
export function whereUsed(ix: ModelIndex, target: string, maxDepth = 8): WhereUsedResult {
  const roots: string[] = [];
  const up = (p: string, stack: string[]): TreeNode[] => {
    const kids: TreeNode[] = [];
    for (const e of incoming(ix, p)) {
      if (!CONTAIN.includes(e.kind)) continue;
      const c = node(e.from, nm(ix, e.from, e.from), e.kind, e.label, qtyOf(e.label));
      if (stack.includes(e.from)) c.cycle = true;
      else if (stack.length < maxDepth) c.children = up(e.from, [...stack, p]);
      if (!c.cycle && !c.children.length && !roots.includes(e.from)) roots.push(e.from);
      kids.push(c);
    }
    return kids;
  };
  const t = node(target, nm(ix, target, target), "root");
  t.children = up(target, []);
  const references = incoming(ix, target).filter((e) => !CONTAIN.includes(e.kind)).map((e) => ({ path: e.from, kind: e.kind, label: e.label }));
  return { tree: t, roots, references };
}

/* ---- Requirements and traceability ----------------------------------------------------------------------------- */
export interface TraceRow { path: string; id: string; title: string; subtype: string; status: string; satisfiedBy: string[]; verifiedBy: string[]; derivedFrom: string[]; derives: string[]; refines: string[]; refinedBy: string[]; allocatedTo: string[]; gaps: string[] }
export function isRequirement(n: Note): boolean { return n.type === "Requirement" || n.def?.keyword === "requirement def"; }
export function traceMatrix(ix: ModelIndex): { rows: TraceRow[]; total: number; satisfied: number; verified: number } {
  const rows: TraceRow[] = [];
  for (const n of ix.notes.values()) {
    if (!isRequirement(n)) continue;
    const inn = incoming(ix, n.path), out = outgoing(ix, n.path);
    const from = (k: string): string[] => inn.filter((e) => e.kind === k).map((e) => e.from);
    const to = (k: string): string[] => out.filter((e) => e.kind === k && e.to).map((e) => e.to!);
    const r: TraceRow = { path: n.path, id: n.id, title: n.title, subtype: n.subtype, status: n.status, satisfiedBy: from("satisfies"), verifiedBy: from("verifies"),
      derivedFrom: to("derivedFrom"), derives: from("derivedFrom"), refines: to("refines"), refinedBy: from("refines"), allocatedTo: [...from("allocatedTo")].concat(to("allocatedTo")), gaps: [] };
    if (!r.satisfiedBy.length) r.gaps.push("no satisfier");
    if (!r.verifiedBy.length) r.gaps.push("no verification");
    rows.push(r);
  }
  rows.sort((a, b) => a.id.localeCompare(b.id));
  return { rows, total: rows.length, satisfied: rows.filter((r) => r.satisfiedBy.length).length, verified: rows.filter((r) => r.verifiedBy.length).length };
}

/* ---- Behavior and states ---------------------------------------------------------------------------------------- */
export interface FlowNode { name: string; kind: string; type: string; path: string | null; layer: number }
export interface FlowResult { kind: "actions" | "states" | "none"; nodes: FlowNode[]; edges: Array<{ from: string; to: string; kind: string }>; unresolved: string[]; triggers: string[] }
export function behavior(ix: ModelIndex, path: string): FlowResult {
  const n = ix.notes.get(path), d = n?.def;
  if (!n || !d) return { kind: "none", nodes: [], edges: [], unresolved: [], triggers: [] };
  const flowKinds = new Set(["action", "state", "fork", "join"]);
  const nodes: FlowNode[] = d.usages.filter((u) => flowKinds.has(u.kind)).map((u) => ({ name: u.name, kind: u.kind, type: u.type ?? "", path: u.type ? ix.bySymbol.get(u.type) ?? null : null, layer: 0 }));
  const names = new Set(nodes.map((x) => x.name));
  const edges: FlowResult["edges"] = [], unresolved: string[] = [];
  for (const s of d.stmts) if (s.kind === "succession" || s.kind === "transition") { if (names.has(s.a!) && names.has(s.b!)) edges.push({ from: s.a!, to: s.b!, kind: s.kind }); else unresolved.push(s.text); }
  // layers: longest path from any start, cycle safe
  const layer = new Map<string, number>(nodes.map((x) => [x.name, 0]));
  for (let pass = 0; pass < nodes.length; pass++) { let moved = false; for (const e of edges) { const v = (layer.get(e.from) ?? 0) + 1; if (v > (layer.get(e.to) ?? 0) && v <= nodes.length) { layer.set(e.to, v); moved = true; } } if (!moved) break; }
  for (const x of nodes) x.layer = layer.get(x.name) ?? 0;
  const triggers = n.sourceLines.filter((l) => l.startsWith("- Trigger:")).map((l) => l.replace(/ — EA GUID.*$/, "").slice(2));
  const kind = nodes.some((x) => x.kind === "state") ? "states" : nodes.length ? "actions" : "none";
  return { kind, nodes, edges, unresolved, triggers };
}

/* ---- Interfaces ------------------------------------------------------------------------------------------------- */
export interface InterfaceResult { ports: Array<{ name: string; type: string; path: string | null }>; flows: Array<{ name: string; dir: string; type: string; path: string | null }>; connections: Array<{ from: string; to: string }>; users: string[] }
export function interfaces(ix: ModelIndex, path: string): InterfaceResult {
  const d = ix.notes.get(path)?.def;
  const res = (s?: string): string | null => (s ? ix.bySymbol.get(s) ?? null : null);
  const users = incoming(ix, path).filter((e) => e.kind === "hasPort").map((e) => e.from);
  if (!d) return { ports: [], flows: [], connections: [], users };
  return {
    ports: d.usages.filter((u) => u.kind === "port").map((u) => ({ name: u.name, type: u.type ?? "", path: res(u.type) })),
    flows: d.usages.filter((u) => u.kind === "item").map((u) => ({ name: u.name, dir: u.dir ?? "", type: u.type ?? "", path: res(u.type) })),
    connections: d.stmts.filter((s) => s.kind === "connect").map((s) => ({ from: s.a!, to: s.b! })), users,
  };
}

export const TYPE_COLOR: Record<string, string> = { Object: "#2557d6", Requirement: "#b25e00", Behavior: "#1b7a3a", Condition: "#7b3fb0", "Use Case": "#0e7490", Verification: "#a21caf", "Item Flow": "#64748b", Info: "#8a8f98", Actor: "#0e7490", Artifact: "#8a8f98" };

/* ---- Profiles and graph ---------------------------------------------------------------------------------------- */
export interface Step { kind: string; dir: "out" | "in" }
export interface Profile { name: string; description: string; steps: Step[]; depth: number; cap: number }
const both = (...kinds: string[]): Step[] => kinds.flatMap((kind) => [{ kind, dir: "out" as const }, { kind, dir: "in" as const }]);
export const PROFILES: Profile[] = [
  { name: "Structure", description: "Parts, ports, actions and states a definition owns, and what it specializes.", steps: [{ kind: "hasPart", dir: "out" }, { kind: "hasPort", dir: "out" }, { kind: "hasAction", dir: "out" }, { kind: "hasState", dir: "out" }, { kind: "specializes", dir: "out" }], depth: 3, cap: 80 },
  { name: "Where used", description: "Everything that owns, specializes or uses the note, upward.", steps: [{ kind: "hasPart", dir: "in" }, { kind: "hasPort", dir: "in" }, { kind: "hasAction", dir: "in" }, { kind: "hasState", dir: "in" }, { kind: "specializes", dir: "in" }, { kind: "performs", dir: "in" }], depth: 3, cap: 80 },
  { name: "Requirements", description: "A requirement with what derives, refines, satisfies and verifies it; or an element with its requirements.", steps: [...both("derivedFrom", "refines", "satisfies", "verifies")], depth: 2, cap: 80 },
  { name: "Verification", description: "Verification cases and the requirements they verify.", steps: both("verifies"), depth: 2, cap: 80 },
  { name: "Behavior", description: "What performs and owns actions.", steps: [{ kind: "performs", dir: "out" }, { kind: "performs", dir: "in" }, { kind: "hasAction", dir: "out" }, { kind: "hasAction", dir: "in" }, { kind: "includes", dir: "out" }, { kind: "extendedBy", dir: "out" }], depth: 2, cap: 80 },
  { name: "Interfaces", description: "Ports, the port definitions that type them, and the flows they carry.", steps: [{ kind: "hasPort", dir: "out" }, { kind: "hasPort", dir: "in" }, { kind: "hasFlow", dir: "out" }, { kind: "hasFlow", dir: "in" }], depth: 2, cap: 80 },
  { name: "Allocation", description: "Allocations between elements.", steps: both("allocatedTo"), depth: 2, cap: 80 },
  { name: "Dependencies", description: "Trace, refine, derive, depends-on and uses links.", steps: both("trace", "refines", "derivedFrom", "dependsOn", "uses"), depth: 2, cap: 80 },
  { name: "Documentation", description: "Info and other notes that describe an element.", steps: both("describes"), depth: 2, cap: 80 },
  { name: "Everything", description: "Every relationship, both directions.", steps: [], depth: 1, cap: 60 },
];

/** What the person chose to see. Empty lists mean "no restriction". Presentation only: it never changes the model. */
export type Classifier = "" | "type" | "subtype" | "status" | "folder" | "eaType";
export interface ViewSpec { kinds: string[]; hideTypes: string[]; hideStatuses: string[]; folder: string; depth: number; cap: number; collapse: Classifier; collapseOver: number; ghosts: boolean }
export const defaultSpec = (p?: Profile): ViewSpec => ({ kinds: [], hideTypes: [], hideStatuses: [], folder: "", depth: p?.depth ?? 2, cap: p?.cap ?? 80, collapse: "", collapseOver: 6, ghosts: true });
export const specIsDefault = (s: Partial<ViewSpec> | undefined, p: Profile): boolean => !s || JSON.stringify({ ...defaultSpec(p), ...s }) === JSON.stringify(defaultSpec(p));
export const CLASSIFIERS: Array<[Classifier, string]> = [["", "Don't group"], ["type", "Note type"], ["subtype", "Type and subtype"], ["status", "Status"], ["folder", "Folder"], ["eaType", "EA type"]];
export const classOf = (n: Note, by: Classifier): string => by === "type" ? n.type : by === "subtype" ? (n.subtype ? `${n.type}/${n.subtype}` : n.type) : by === "status" ? n.status || "no status" : by === "folder" ? n.folder || "(root)" : by === "eaType" ? n.eaType || "no EA type" : "";

export interface GroupInfo { label: string; members: string[]; type: string }
export interface GraphResult { nodes: Array<{ path: string; depth: number }>; edges: Edge[]; capped: boolean; groups: Map<string, GroupInfo>; hidden: number }

export function traverse(ix: ModelIndex, start: string, p: Profile, depth = p.depth, cap = p.cap, spec?: Partial<ViewSpec>): GraphResult {
  const sp = { ...defaultSpec(p), ...spec };
  const seen = new Map<string, number>([[start, 0]]), edges: Edge[] = [], used = new Set<Edge>();
  let frontier = [start], capped = false, hidden = 0;
  const allow = (e: Edge, dir: "out" | "in"): boolean => sp.kinds.length ? sp.kinds.includes(e.kind) : !p.steps.length || p.steps.some((s) => s.kind === e.kind && s.dir === dir);
  const visible = (path: string): boolean => { const n = ix.notes.get(path); return !!n && !sp.hideTypes.includes(n.type) && !sp.hideStatuses.includes(n.status || "no status") && (!sp.folder || n.folder === sp.folder || n.folder.startsWith(sp.folder.replace(/\/$/, "") + "/")); };
  for (let d = 1; d <= depth && frontier.length; d++) {
    const next: string[] = [];
    for (const cur of frontier) {
      for (const [list, dir] of [[outgoing(ix, cur), "out"], [incoming(ix, cur), "in"]] as Array<[Edge[], "out" | "in"]>) {
        for (const e of list) {
          if (!allow(e, dir) || !e.to || used.has(e)) continue;
          const other = dir === "out" ? e.to : e.from;
          if (!seen.has(other)) {
            if (!visible(other)) { hidden++; continue; }
            if (seen.size >= cap) { capped = true; continue; }
            seen.set(other, d); next.push(other);
          }
          used.add(e); edges.push(e);
        }
      }
    }
    frontier = next;
  }
  return collapseGraph(ix, { nodes: [...seen].map(([path, depth]) => ({ path, depth })), edges, capped, groups: new Map(), hidden }, sp);
}

/** Classifier grouping: at each distance from the start, notes that share a class collapse into one card once there are more than `collapseOver` of them. */
export function collapseGraph(ix: ModelIndex, g: GraphResult, sp: ViewSpec): GraphResult {
  if (!sp.collapse) return g;
  const buckets = new Map<string, string[]>();
  for (const n of g.nodes) { if (n.depth === 0) continue; const note = ix.notes.get(n.path); if (!note) continue; const k = `${n.depth}\u0000${classOf(note, sp.collapse)}`; (buckets.get(k) ?? buckets.set(k, []).get(k)!).push(n.path); }
  const into = new Map<string, string>(), groups = new Map<string, GroupInfo>();
  for (const [k, members] of buckets) {
    if (members.length <= Math.max(1, sp.collapseOver)) continue;
    const [d, label] = k.split("\u0000") as [string, string], id = `group:${d}:${label}`;
    groups.set(id, { label, members, type: ix.notes.get(members[0]!)?.type ?? "" });
    for (const m of members) into.set(m, id);
  }
  if (!groups.size) return g;
  const nodes = g.nodes.filter((n) => !into.has(n.path)).concat([...groups].map(([id]) => ({ path: id, depth: +id.split(":")[1]! })));
  const merged = new Map<string, { e: Edge; n: number }>(), map = (p: string): string => into.get(p) ?? p;
  for (const e of g.edges) {
    const from = map(e.from), to = map(e.to!);
    if (from === to) continue;
    const key = `${from}\u0000${to}\u0000${e.kind}`, cur = merged.get(key);
    if (cur) cur.n++; else merged.set(key, { e: { ...e, from, to }, n: 1 });
  }
  const edges = [...merged.values()].map(({ e, n }) => (n > 1 ? { ...e, label: `${e.label ? e.label + " " : ""}×${n}` } : e));
  return { ...g, nodes, edges, groups };
}

export interface Placed { path: string; x: number; y: number; depth: number }
/** Concentric rings around the start; presentation only. */
export function layoutRadial(g: GraphResult, ringGap = 150): Placed[] {
  const byDepth = new Map<number, string[]>();
  for (const n of g.nodes) (byDepth.get(n.depth) ?? byDepth.set(n.depth, []).get(n.depth)!).push(n.path);
  const out: Placed[] = [];
  for (const [d, list] of byDepth) {
    if (d === 0) { out.push({ path: list[0]!, x: 0, y: 0, depth: 0 }); continue; }
    const r = Math.max(ringGap * d, (list.length * 120) / (2 * Math.PI));
    list.forEach((p, i) => { const a = (2 * Math.PI * i) / list.length - Math.PI / 2; out.push({ path: p, x: Math.round(r * Math.cos(a)), y: Math.round(r * Math.sin(a)), depth: d }); });
  }
  return out;
}

/* ---- Tables, relationships, search, folders ----------------------------------------------------------------------- */
export interface TableFilter { text?: string; type?: string; status?: string; flagged?: boolean; unresolved?: boolean; sort?: string; desc?: boolean }
export interface TableRow { path: string; id: string; type: string; subtype: string; title: string; status: string; folder: string; flags: number; block: boolean; out: number; inn: number; dangling: number }
export function tableRows(ix: ModelIndex, f: TableFilter = {}): TableRow[] {
  const q = (f.text ?? "").toLowerCase();
  const rows: TableRow[] = [];
  for (const n of ix.notes.values()) {
    if (f.type && n.type !== f.type) continue;
    if (f.status && n.status !== f.status) continue;
    if (f.flagged && !n.flags.length) continue;
    const dangling = outgoing(ix, n.path).filter((e) => !e.to).length;
    if (f.unresolved && !dangling) continue;
    if (q && !`${n.id} ${n.title} ${n.name} ${n.def?.symbol ?? ""} ${n.type} ${n.subtype} ${n.folder}`.toLowerCase().includes(q)) continue;
    rows.push({ path: n.path, id: n.id, type: n.type, subtype: n.subtype, title: n.title, status: n.status, folder: n.folder, flags: n.flags.length, block: !!n.block, out: outgoing(ix, n.path).length, inn: incoming(ix, n.path).length, dangling });
  }
  const k = (f.sort ?? "id") as keyof TableRow;
  rows.sort((a, b) => { const x = a[k], y = b[k]; const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y)); return f.desc ? -c : c; });
  return rows;
}

export interface RelRow { from: string | null; fromTitle: string; kind: string; to: string | null; toTitle: string; label: string; via: string; resolved: boolean }
export function relationshipRows(ix: ModelIndex, kinds: string[] = [], text = ""): RelRow[] {
  const q = text.toLowerCase();
  const rows: RelRow[] = [];
  for (const e of ix.edges) {
    if (kinds.length && !kinds.includes(e.kind)) continue;
    const fromTitle = e.reverse ? e.toSymbol : nm(ix, e.from, e.from), toTitle = e.reverse ? nm(ix, e.from, e.from) : e.to ? nm(ix, e.to, e.to) : e.toSymbol;
    if (q && !`${fromTitle} ${toTitle} ${e.kind} ${e.label}`.toLowerCase().includes(q)) continue;
    rows.push(e.reverse ? { from: null, fromTitle, kind: e.kind, to: e.from, toTitle, label: e.label, via: e.via, resolved: false }
      : { from: e.from, fromTitle, kind: e.kind, to: e.to, toTitle, label: e.label, via: e.via, resolved: !!e.to });
  }
  return rows;
}
export const edgeKinds = (ix: ModelIndex): Array<[string, number]> => { const m = new Map<string, number>(); for (const e of ix.edges) m.set(e.kind, (m.get(e.kind) ?? 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); };

export function folderTree(ix: ModelIndex): TreeNode {
  const root = node(null, "(vault)", "folder");
  const dirs = new Map<string, TreeNode>([["", root]]);
  const dir = (p: string): TreeNode => {
    const hit = dirs.get(p); if (hit) return hit;
    const parent = dir(p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "");
    const t = node(null, p.split("/").pop()!, "folder"); parent.children.push(t); dirs.set(p, t); return t;
  };
  const sorted = [...ix.notes.values()].sort((a, b) => a.path.localeCompare(b.path));
  for (const n of sorted) dir(n.folder).children.push(node(n.path, n.title, n.type, n.id));
  const order = (t: TreeNode): void => { t.children.sort((a, b) => (a.kind === "folder" ? 0 : 1) - (b.kind === "folder" ? 0 : 1) || a.label.localeCompare(b.label)); t.children.forEach(order); };
  order(root);
  return root;
}

/* ---- Review and dashboard ----------------------------------------------------------------------------------------- */
export interface ReviewItem { severity: "high" | "medium" | "low"; category: string; path: string; message: string }
export function reviewQueue(ix: ModelIndex): ReviewItem[] {
  const out: ReviewItem[] = [];
  for (const n of ix.notes.values()) {
    for (const f of n.flags) out.push({ severity: f.type === "flagConflict" ? "high" : f.type === "flagNote" ? "low" : "medium", category: f.type, path: n.path, message: f.title });
    for (const w of n.warnings) out.push({ severity: "medium", category: "sysml-not-recognized", path: n.path, message: w });
    for (const i of n.issues) out.push({ severity: "high", category: "format:" + i, path: n.path, message: i });
    for (const e of outgoing(ix, n.path)) if (!e.to && e.via === "sysml") out.push({ severity: "medium", category: "unresolved-reference", path: n.path, message: e.reverse ? `${e.kind} from ${e.toSymbol} (source not in vault)` : `${e.kind} → ${e.toSymbol}` });
  }
  for (const d of ix.duplicates) out.push({ severity: "high", category: "duplicate-id", path: "", message: d });
  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || a.category.localeCompare(b.category) || a.path.localeCompare(b.path));
}

export interface Dashboard { notes: number; blocks: number; byType: Array<[string, number]>; byStatus: Array<[string, number]>; flags: Array<[string, number]>; edgeKinds: Array<[string, number]>; dangling: number; orphans: number; warnings: number; parser: string; skipped: number; requirements: { total: number; satisfied: number; verified: number } }
export function dashboard(ix: ModelIndex): Dashboard {
  const count = (f: (n: Note) => string[]): Array<[string, number]> => { const m = new Map<string, number>(); for (const n of ix.notes.values()) for (const k of f(n)) m.set(k, (m.get(k) ?? 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); };
  const t = traceMatrix(ix);
  let orphans = 0, warnings = 0;
  for (const n of ix.notes.values()) { if (!outgoing(ix, n.path).length && !incoming(ix, n.path).length) orphans++; warnings += n.warnings.length; }
  return { notes: ix.notes.size, blocks: [...ix.notes.values()].filter((n) => n.block).length, byType: count((n) => [n.type]), byStatus: count((n) => [n.status || "(none)"]), flags: count((n) => n.flags.map((f) => f.type)),
    edgeKinds: edgeKinds(ix), dangling: ix.edges.filter((e) => !e.to && e.via === "sysml").length, orphans, warnings, parser: ix.parser, skipped: ix.skipped, requirements: { total: t.total, satisfied: t.satisfied, verified: t.verified } };
}

export function search(ix: ModelIndex, q: string, limit = 50): Note[] {
  const s = q.trim().toLowerCase(); if (!s) return [];
  const hits: Array<[number, Note]> = [];
  for (const n of ix.notes.values()) {
    const id = n.id.toLowerCase(), t = n.title.toLowerCase();
    const score = id === s ? 0 : id.startsWith(s) ? 1 : t === s ? 2 : t.startsWith(s) ? 3 : t.includes(s) ? 4 : (n.def?.symbol ?? "").toLowerCase().includes(s) ? 5 : n.body.toLowerCase().includes(s) ? 6 : -1;
    if (score >= 0) hits.push([score, n]);
  }
  return hits.sort((a, b) => a[0] - b[0] || a[1].title.localeCompare(b[1].title)).slice(0, limit).map((h) => h[1]);
}
