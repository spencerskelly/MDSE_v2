/* Views over the index. Each function returns plain data; the page and the Obsidian shell draw it.
 * Ported from V1: view profiles are data (which relationship kinds to follow, in which direction), a traversal
 * with a node cap, and a drawn result that is presentation only. Rewritten for V2: the relationship kinds come
 * from the SysML v2 text, not from YAML fields. */
import type { Edge, EdgeRef, ModelIndex, Note } from "./index.ts";
import { incoming, outgoing } from "./index.ts";
import { compareNotes } from "./compare.ts";

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
export function structure(ix: ModelIndex, root: string, maxDepth = 6, perParent = 40, kinds: string[] = OWNED): StructureResult {
  const walk = (p: string, label: string, kind: string, mult: string, stack: string[]): TreeNode => {
    const n = ix.notes.get(p)!;
    const t = node(p, label || n.title, kind, mult, qtyOf(mult));
    if (stack.includes(p)) { t.cycle = true; return t; }
    if (stack.length >= maxDepth) return t;
    const kids = outgoing(ix, p).filter((e) => kinds.includes(e.kind));
    for (const e of kids.slice(0, perParent)) t.children.push(!e.to ? node(null, e.label.replace(/\[.*$/, "").replace(/^(in|out|inout) /, ""), e.kind, `: ${e.toSymbol} (not in vault)`, qtyOf(e.label)) : walk(e.to, e.label.replace(/\[.*$/, "").replace(/^(in|out|inout) /, ""), e.kind, (/\[.*\]/.exec(e.label) ?? [measuredText(e.detail)])[0], [...stack, p]));
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

/** A usage's `quantity` and `unit` attributes (the BOM importer writes them for material and for lines that are not whole counts). */
export function measuredOf(detail: string): { qty: number; unit: string } | null {
  const q = /(?:^|; )quantity=([^;]*)/.exec(detail), u = /(?:^|; )unit=([^;]*)/.exec(detail);
  if (!q) return null;
  const n = Number(q[1]!.trim()); if (!Number.isFinite(n)) return null;
  return { qty: n, unit: (u?.[1] ?? "").trim() };
}

/** "[1.5 Meter]" for a usage that carries a measured quantity, else "". Shown where a count would be. */
const measuredText = (detail: string): string => { const m = measuredOf(detail); return m ? `[${Math.round(m.qty * 1000) / 1000}${m.unit ? " " + m.unit : ""}]` : ""; };

/** Rolled-up parts list: how many of each definition sit under the root, multiplying through the assembly. Whole counts and measured amounts
 *  (4.318 Meter) are kept apart by unit, never added together. A quantity of 0 is a document line and adds nothing. */
export function bom(ix: ModelIndex, root: string, maxDepth = 12): Array<{ path: string; title: string; qty: number; depth: number; unit: string }> {
  const acc = new Map<string, { path: string; qty: number; depth: number; unit: string }>();
  const walk = (p: string, mult: number, depth: number, stack: string[]): void => {
    if (depth > maxDepth || stack.includes(p)) return;
    for (const e of outgoing(ix, p)) {
      if (e.kind !== "hasPart" || !e.to) continue;
      const m = measuredOf(e.detail), count = mult * qtyOf(e.label), q = m ? mult * m.qty : count, unit = m ? m.unit : "", key = e.to + "\u0000" + unit;
      const cur = acc.get(key);
      acc.set(key, { path: e.to, qty: (cur?.qty ?? 0) + q, depth: Math.min(cur?.depth ?? 99, depth), unit });
      walk(e.to, count, depth + 1, [...stack, p]);
    }
  };
  walk(root, 1, 1, []);
  return [...acc.values()].map((v) => ({ ...v, title: nm(ix, v.path, v.path) })).sort((a, b) => a.depth - b.depth || a.title.localeCompare(b.title) || a.unit.localeCompare(b.unit));
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
export interface TraceRow { path: string; id: string; title: string; subtype: string; text: string; status: string; satisfiedBy: string[]; verifiedBy: string[]; derivedFrom: string[]; derives: string[]; refines: string[]; refinedBy: string[]; allocatedTo: string[]; gaps: string[] }
/** The requirement's wording: the `doc` in its SysML block (IMP-097); older notes fall back to the first body paragraph. */
export function requirementText(n: Note): string { return (n.def?.doc ?? n.body.split(/\n\s*\n/)[0] ?? "").trim(); }
export function isRequirement(n: Note): boolean { return n.type === "Requirement" || n.def?.keyword === "requirement def"; }
export function traceMatrix(ix: ModelIndex): { rows: TraceRow[]; total: number; satisfied: number; verified: number } {
  const rows: TraceRow[] = [];
  for (const n of ix.notes.values()) {
    if (!isRequirement(n)) continue;
    const inn = incoming(ix, n.path), out = outgoing(ix, n.path);
    const from = (k: string): string[] => inn.filter((e) => e.kind === k).map((e) => e.from);
    const to = (k: string): string[] => out.filter((e) => e.kind === k && e.to).map((e) => e.to!);
    const r: TraceRow = { path: n.path, id: n.id, title: n.title, subtype: n.subtype, text: requirementText(n), status: n.status, satisfiedBy: from("satisfies"), verifiedBy: from("verifies"),
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
export interface FlowResult { kind: "actions" | "states" | "none"; nodes: FlowNode[]; edges: Array<{ from: string; to: string; kind: string }>; unresolved: string[]; triggers: string[]; /** transitions and guarded successions with their SysML trigger, guard and effect wording */ guards: Array<{ from: string; to: string; kind: string; trigger: string; guard: string; effect: string }> }
export function behavior(ix: ModelIndex, path: string, only?: "actions" | "states"): FlowResult {
  const n = ix.notes.get(path), d = n?.def;
  if (!n || !d) return { kind: "none", nodes: [], edges: [], unresolved: [], triggers: [], guards: [] };
  const flowKinds = new Set(only === "states" ? ["state"] : only === "actions" ? ["action", "fork", "join"] : ["action", "state", "fork", "join"]);
  const nodes: FlowNode[] = d.usages.filter((u) => flowKinds.has(u.kind)).map((u) => ({ name: u.name, kind: u.kind, type: u.type ?? "", path: u.type ? ix.bySymbol.get(u.type) ?? null : null, layer: 0 }));
  const names = new Set(nodes.map((x) => x.name));
  const edges: FlowResult["edges"] = [], unresolved: string[] = [];
  for (const s of d.stmts) if (s.kind === "succession" || s.kind === "transition") { if (names.has(s.a!) && names.has(s.b!)) edges.push({ from: s.a!, to: s.b!, kind: s.kind }); else unresolved.push(s.text); }
  // layers: longest path from any start, cycle safe
  const layer = new Map<string, number>(nodes.map((x) => [x.name, 0]));
  for (let pass = 0; pass < nodes.length; pass++) { let moved = false; for (const e of edges) { const v = (layer.get(e.from) ?? 0) + 1; if (v > (layer.get(e.to) ?? 0) && v <= nodes.length) { layer.set(e.to, v); moved = true; } } if (!moved) break; }
  for (const x of nodes) x.layer = layer.get(x.name) ?? 0;
  const triggers = n.sourceLines.filter((l) => l.startsWith("- Trigger:")).map((l) => l.replace(/ — EA GUID.*$/, "").slice(2));
  const words = (nm?: string): string => (nm ? d.notes[nm] ?? nm : "");
  const guards = d.stmts.filter((s) => (s.kind === "succession" || s.kind === "transition") && (s.trigger || s.guard || s.effect))
    .map((s) => ({ from: s.a!, to: s.b!, kind: s.kind, trigger: words(s.trigger), guard: words(s.guard), effect: words(s.effect) }));
  const kind = nodes.some((x) => x.kind === "state") ? "states" : nodes.length ? "actions" : "none";
  return { kind, nodes, edges, unresolved, triggers, guards };
}

/* ---- Design types: the specialization hierarchy, apart from composition and behavior ------------------------------- */
export interface DesignTypesResult { chain: string[]; tree: TreeNode; siblings: string[]; total: number }
/** What a definition specializes (root first), and the designs that specialize it, each with what it owns. */
export function designTypes(ix: ModelIndex, root: string, maxDepth = 8, cap = 400): DesignTypesResult {
  const chain: string[] = [], seen = new Set<string>([root]);
  for (let cur = root, guard = 0; guard < 30; guard++) { const e = outgoing(ix, cur).find((x) => x.kind === "specializes" && x.to && !seen.has(x.to)); if (!e) break; chain.unshift(e.to!); seen.add(e.to!); cur = e.to!; }
  const owns = (p: string): string => {
    const u = ix.notes.get(p)?.def?.usages ?? [], c = (k: string): number => u.filter((x) => x.kind === k).length;
    return [c("part") ? `${c("part")} parts` : "", c("port") ? `${c("port")} ports` : "", c("action") ? `${c("action")} actions` : "", c("state") ? `${c("state")} states` : ""].filter(Boolean).join(", ");
  };
  let count = 0;
  const walk = (p: string, stack: string[]): TreeNode => {
    const t = node(p, nm(ix, p, p), p === root ? "root" : "specializes", owns(p));
    if (stack.includes(p)) { t.cycle = true; return t; }
    if (stack.length >= maxDepth) return t;
    const subs = incoming(ix, p).filter((e) => e.kind === "specializes").map((e) => e.from).filter((x, i, a) => a.indexOf(x) === i).sort((a, b) => nm(ix, a, a).localeCompare(nm(ix, b, b)));
    for (const c of subs) { if (count++ >= cap) { t.more = (t.more ?? 0) + 1; continue; } t.children.push(walk(c, [...stack, p])); }
    return t;
  };
  const parent = chain[chain.length - 1];
  const siblings = parent ? incoming(ix, parent).filter((e) => e.kind === "specializes" && e.from !== root).map((e) => e.from) : [];
  const tree = walk(root, []);
  return { chain, tree, siblings, total: count };
}

/* ---- Internal structure: parts, their ports, and how they are wired ------------------------------------------------ */
export interface InternalEnd { text: string; type: string; path: string | null; ok: boolean }
export interface InternalResult {
  parts: Array<{ name: string; type: string; path: string | null; mult: string; ref: boolean; ports: Array<{ name: string; type: string; path: string | null; conj: boolean }> }>;
  boundary: Array<{ name: string; type: string; path: string | null; conj: boolean; mult: string }>;
  links: Array<{ kind: string; name: string; via: string; viaPath: string | null; a: InternalEnd; b: InternalEnd }>;
  untyped: string[];
}
/** The definition's parts with the ports each part's type offers (inherited ones included), its own boundary ports, and every
 *  connect, bind and flow with both ends resolved. An end that names a part or port that does not exist is marked, so a broken wire shows. */
export function internalStructure(ix: ModelIndex, path: string): InternalResult {
  const d = ix.notes.get(path)?.def, res = (s?: string): string | null => (s ? ix.bySymbol.get(s) ?? null : null);
  const out: InternalResult = { parts: [], boundary: [], links: [], untyped: [] };
  if (!d) return out;
  const portsOf = (p: string | null): Array<{ name: string; type: string; path: string | null; conj: boolean }> => {
    const got: Array<{ name: string; type: string; path: string | null; conj: boolean }> = [], seen = new Set<string>();
    for (let cur: string | null = p, guard = 0; cur && guard < 20 && !seen.has(cur); guard++) {
      seen.add(cur);
      for (const u of ix.notes.get(cur)?.def?.usages ?? []) if (u.kind === "port" && !u.end && !got.some((g) => g.name === u.name)) got.push({ name: u.name, type: u.type ?? "", path: res(u.type), conj: !!u.conj });
      cur = outgoing(ix, cur).find((e) => e.kind === "specializes" && e.to)?.to ?? null;
    }
    return got;
  };
  const partUsages = d.usages.filter((u) => u.kind === "part"), own = d.usages.filter((u) => u.kind === "port" && !u.end);
  for (const u of partUsages) { const tp = res(u.type); out.parts.push({ name: u.name, type: u.type ?? "", path: tp, mult: u.mult ?? "", ref: !!u.ref, ports: portsOf(tp) }); if (!u.type) out.untyped.push(`part ${u.name}`); }
  for (const u of own) { out.boundary.push({ name: u.name, type: u.type ?? "", path: res(u.type), conj: !!u.conj, mult: u.mult ?? "" }); if (!u.type) out.untyped.push(`port ${u.name}`); }
  const end = (ref: string): InternalEnd => {
    const segs = ref.split(".");
    if (segs.length === 1) { const p = own.find((x) => x.name === segs[0]); return p ? { text: ref, type: p.type ?? "", path: res(p.type), ok: true } : { text: ref, type: "", path: null, ok: !!partUsages.find((x) => x.name === segs[0]) }; }
    const part = partUsages.find((x) => x.name === segs[0]); if (!part) return { text: ref, type: "", path: null, ok: false };
    const port = portsOf(res(part.type)).find((x) => x.name === segs[1]);
    return port ? { text: ref, type: port.type, path: port.path, ok: segs.length === 2 } : { text: ref, type: "", path: null, ok: false };
  };
  for (const s of d.stmts) {
    if (s.kind !== "connect" && s.kind !== "bind" && s.kind !== "flow") continue;
    out.links.push({ kind: s.kind === "connect" ? s.form && s.form !== "plain" ? s.form : "connect" : s.kind, name: s.name ?? "", via: s.type ?? "", viaPath: res(s.type), a: end(s.a!), b: end(s.b!) });
  }
  return out;
}

/* ---- Interfaces ------------------------------------------------------------------------------------------------- */
export interface PortFeature { dir: string; kind: string; name: string; type: string; mult: string; path: string | null }
export interface InterfaceResult {
  /** port usages the selected definition owns; `features` are the directed features of the port definition that types each one, read through the conjugation */
  ports: Array<{ name: string; type: string; path: string | null; conj: boolean; mult: string; ref: boolean; features: PortFeature[] }>;
  /** items the selected definition owns (a port definition's directed flows) */
  flows: Array<{ name: string; dir: string; type: string; path: string | null }>;
  /** everything a port or interface definition owns besides ports: items, attributes, nested ports */
  features: PortFeature[];
  /** ends of an interface or connection definition */
  ends: Array<{ name: string; type: string; path: string | null; conj: boolean; mult: string }>;
  connections: Array<{ from: string; to: string; form: string; name: string; via: string; viaPath: string | null; endA: string; endB: string }>;
  /** `flow of T from a to b` statements */
  transfers: Array<{ from: string; to: string; type: string; typePath: string | null; name: string }>;
  binds: Array<{ a: string; b: string }>;
  users: string[];
}
const FLIP: Record<string, string> = { in: "out", out: "in" };
export function interfaces(ix: ModelIndex, path: string): InterfaceResult {
  const d = ix.notes.get(path)?.def;
  const res = (s?: string): string | null => (s ? ix.bySymbol.get(s) ?? null : null);
  const users = incoming(ix, path).filter((e) => e.kind === "hasPort").map((e) => e.from);
  const empty: InterfaceResult = { ports: [], flows: [], features: [], ends: [], connections: [], transfers: [], binds: [], users };
  if (!d) return empty;
  const featuresOf = (typeSym: string | undefined, conj: boolean): PortFeature[] => {
    const pd = ix.notes.get(res(typeSym) ?? "")?.def; if (!pd) return [];
    return pd.usages.map((u) => ({ dir: conj ? FLIP[u.dir ?? ""] ?? u.dir ?? "" : u.dir ?? "", kind: u.kind, name: u.name, type: u.type ?? "", mult: u.mult ?? "", path: res(u.type) }));   // conjugation reverses in and out (SysML v2 7.12)
  };
  return {
    ports: d.usages.filter((u) => u.kind === "port" && !u.end).map((u) => ({ name: u.name, type: u.type ?? "", path: res(u.type), conj: !!u.conj, mult: u.mult ?? "", ref: !!u.ref, features: featuresOf(u.type, !!u.conj) })),
    flows: d.usages.filter((u) => u.kind === "item").map((u) => ({ name: u.name, dir: u.dir ?? "", type: u.type ?? "", path: res(u.type) })),
    features: d.keyword === "port def" || d.keyword === "interface def" ? d.usages.filter((u) => !u.end && u.kind !== "port" || (u.kind === "port" && d.keyword === "port def")).map((u) => ({ dir: u.dir ?? "", kind: u.kind, name: u.name, type: u.type ?? "", mult: u.mult ?? "", path: res(u.type) })) : [],
    ends: d.usages.filter((u) => u.end).map((u) => ({ name: u.name, type: u.type ?? "", path: res(u.type), conj: !!u.conj, mult: u.mult ?? "" })),
    connections: d.stmts.filter((s) => s.kind === "connect").map((s) => ({ from: s.a!, to: s.b!, form: s.form ?? "plain", name: s.name ?? "", via: s.type ?? "", viaPath: res(s.type), endA: s.endA ?? "", endB: s.endB ?? "" })),
    transfers: d.stmts.filter((s) => s.kind === "flow").map((s) => ({ from: s.a!, to: s.b!, type: s.type ?? "", typePath: res(s.type), name: s.name ?? "" })),
    binds: d.stmts.filter((s) => s.kind === "bind").map((s) => ({ a: s.a!, b: s.b! })), users,
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
  { name: "Structure trace", description: "Down: parts, ports, specializations. Up: what owns or specializes it.", steps: both("hasPart", "hasPort", "specializes"), depth: 3, cap: 80 },
  { name: "Functional trace", description: "Functions with who performs them, what they satisfy, and where they are allocated.", steps: [...both("performs", "hasAction", "allocatedTo"), { kind: "includes", dir: "out" }, { kind: "extendedBy", dir: "out" }, { kind: "satisfies", dir: "out" }, { kind: "satisfies", dir: "in" }], depth: 2, cap: 80 },
  { name: "Requirements trace", description: "Requirements with what derives, refines, satisfies, verifies and is allocated against them.", steps: both("derivedFrom", "refines", "satisfies", "verifies", "allocatedTo"), depth: 2, cap: 80 },
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
export interface TableRow { path: string; file: string; id: string; type: string; subtype: string; title: string; status: string; folder: string; flags: number; block: boolean; out: number; inn: number; dangling: number }
export function tableRows(ix: ModelIndex, f: TableFilter = {}): TableRow[] {
  const q = (f.text ?? "").toLowerCase();
  const rows: TableRow[] = [];
  for (const n of ix.notes.values()) {
    if (f.type && n.type !== f.type) continue;
    if (f.status && n.status !== f.status) continue;
    if (f.flagged && !n.flags.length) continue;
    const dangling = outgoing(ix, n.path).filter((e) => !e.to).length;
    if (f.unresolved && !dangling) continue;
    if (q && !`${n.id} ${n.title} ${n.name} ${n.meta.aliases ?? ""} ${n.meta.partNumber ?? ""} ${n.def?.symbol ?? ""} ${n.type} ${n.subtype} ${n.folder}`.toLowerCase().includes(q)) continue;
    rows.push({ path: n.path, file: n.name, id: n.id, type: n.type, subtype: n.subtype, title: n.title, status: n.status, folder: n.folder, flags: n.flags.length, block: !!n.block, out: outgoing(ix, n.path).length, inn: incoming(ix, n.path).length, dangling });
  }
  const k = (f.sort ?? "id") as keyof TableRow;
  rows.sort((a, b) => { const x = a[k], y = b[k]; const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y)); return f.desc ? -c : c; });
  return rows;
}

export interface RelRow { from: string | null; fromTitle: string; kind: string; to: string | null; toTitle: string; label: string; via: string; resolved: boolean; ref?: EdgeRef }
export function relationshipRows(ix: ModelIndex, kinds: string[] = [], text = ""): RelRow[] {
  const q = text.toLowerCase();
  const rows: RelRow[] = [];
  for (const e of ix.edges) {
    if (kinds.length && !kinds.includes(e.kind)) continue;
    const fromTitle = e.reverse ? e.toSymbol : nm(ix, e.from, e.from), toTitle = e.reverse ? nm(ix, e.from, e.from) : e.to ? nm(ix, e.to, e.to) : e.toSymbol;
    if (q && !`${fromTitle} ${toTitle} ${e.kind} ${e.label}`.toLowerCase().includes(q)) continue;
    rows.push(e.reverse ? { from: null, fromTitle, kind: e.kind, to: e.from, toTitle, label: e.label, via: e.via, resolved: false, ...(e.ref ? { ref: e.ref } : {}) }
      : { from: e.from, fromTitle, kind: e.kind, to: e.to, toTitle, label: e.label, via: e.via, resolved: !!e.to, ...(e.ref ? { ref: e.ref } : {}) });
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
export interface ReviewItem { severity: "high" | "medium" | "low"; category: string; path: string; message: string; /** set on flag rows so the flag can be resolved */ flag?: { type: string; title: string; nth: number }; /** set on Issue notes */ status?: string }
export function reviewQueue(ix: ModelIndex): ReviewItem[] {
  const out: ReviewItem[] = [];
  for (const n of ix.notes.values()) {
    const seenFlag = new Map<string, number>();
    for (const f of n.flags) { const k = f.type + "\u0000" + f.title, nth = seenFlag.get(k) ?? 0; seenFlag.set(k, nth + 1); out.push({ severity: f.type === "flagConflict" ? "high" : f.type === "flagNote" ? "low" : "medium", category: f.type, path: n.path, message: f.title, flag: { type: f.type, title: f.title, nth } }); }
    if (n.type === "Issue" && n.status !== "Retired") out.push({ severity: "medium", category: "issue", path: n.path, message: n.title, status: n.status || "(none)" });
    for (const w of n.warnings) out.push({ severity: "medium", category: "sysml-not-recognized", path: n.path, message: w });
    // W-288: tracesTo is the importer's provisional link; each one is a finding until it is replaced by a stronger relationship.
    for (const l of n.links) if (l.field === "tracesTo") out.push({ severity: "low", category: "provisional-link", path: n.path, message: `tracesTo ${l.target}: replace with a stronger relationship (satisfies, refines, derives...) or confirm it` });
    for (const i of n.issues) out.push({ severity: "high", category: "format:" + i, path: n.path, message: i });
    for (const e of outgoing(ix, n.path)) if (!e.to && e.via === "sysml") out.push({ severity: "medium", category: "unresolved-reference", path: n.path, message: e.reverse ? `${e.kind} from ${e.toSymbol} (source not in vault)` : `${e.kind} → ${e.toSymbol}` });
  }
  const np = objectsWithoutPort(ix);
  if (np) out.push({ severity: "low", category: "objects-without-port", path: "", message: `${np} object${np === 1 ? " has" : "s have"} no port; the internal structure canvas shows a placeholder port for each (nothing is written to the vault)` });
  for (const d of ix.duplicates) out.push({ severity: "high", category: "duplicate-id", path: "", message: d });
  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || a.category.localeCompare(b.category) || a.path.localeCompare(b.path));
}

/** D-0097: Object notes (definitions) with no port of their own. Counted, never an error; the internal canvas draws a placeholder port for each. */
export function objectsWithoutPort(ix: ModelIndex): number {
  let k = 0;
  for (const n of ix.notes.values()) if (n.type === "Object" && !n.meta.mergedInto && !outgoing(ix, n.path).some((e) => e.kind === "hasPort")) k++;
  return k;
}

export interface Dashboard { notes: number; blocks: number; byType: Array<[string, number]>; byStatus: Array<[string, number]>; flags: Array<[string, number]>; edgeKinds: Array<[string, number]>; dangling: number; orphans: number; noPort: number; warnings: number; parser: string; skipped: number; requirements: { total: number; satisfied: number; verified: number } }
export function dashboard(ix: ModelIndex): Dashboard {
  const count = (f: (n: Note) => string[]): Array<[string, number]> => { const m = new Map<string, number>(); for (const n of ix.notes.values()) for (const k of f(n)) m.set(k, (m.get(k) ?? 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); };
  const t = traceMatrix(ix);
  let orphans = 0, warnings = 0;
  for (const n of ix.notes.values()) { if (!outgoing(ix, n.path).length && !incoming(ix, n.path).length) orphans++; warnings += n.warnings.length; }
  return { notes: ix.notes.size, blocks: [...ix.notes.values()].filter((n) => n.block).length, byType: count((n) => [n.type]), byStatus: count((n) => [n.status || "(none)"]), flags: count((n) => n.flags.map((f) => f.type)),
    edgeKinds: edgeKinds(ix), dangling: ix.edges.filter((e) => !e.to && e.via === "sysml").length, orphans, noPort: objectsWithoutPort(ix), warnings, parser: ix.parser, skipped: ix.skipped, requirements: { total: t.total, satisfied: t.satisfied, verified: t.verified } };
}

export function search(ix: ModelIndex, q: string, limit = 50): Note[] {
  const s = q.trim().toLowerCase(); if (!s) return [];
  const hits: Array<[number, Note]> = [];
  for (const n of ix.notes.values()) {
    const id = n.id.toLowerCase(), t = n.title.toLowerCase(), fn = n.name.toLowerCase(), al = String(n.meta.aliases ?? "").toLowerCase(), pn = String(n.meta.partNumber ?? "").toLowerCase();
    // WKB-028 (D-0068): the file name, the part number and any alias find the note as well as the id and the shown name
    const score = id === s || fn === s || pn === s ? 0 : id.startsWith(s) || fn.startsWith(s) ? 1 : t === s ? 2 : t.startsWith(s) ? 3 : t.includes(s) ? 4 : al.includes(s) || fn.includes(s) ? 4 : (n.def?.symbol ?? "").toLowerCase().includes(s) ? 5 : n.body.toLowerCase().includes(s) ? 6 : -1;
    if (score >= 0) hits.push([score, n]);
  }
  return hits.sort((a, b) => a[0] - b[0] || a[1].title.localeCompare(b[1].title)).slice(0, limit).map((h) => h[1]);
}

/** Notes to pick from for a canvas (D-0078): every note whose name, description, id, part number, alias or type holds each word of the text, in name order. `total` counts all matches; `notes` is cut at `limit`. */
export function pickRows(ix: ModelIndex, text: string, type = "", limit = 500): { notes: Note[]; total: number } {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean), out: Note[] = [];
  for (const n of ix.notes.values()) {
    if (type && n.type !== type) continue;
    if (n.meta.mergedInto) continue;                                                  // D-0091: a retired stub is not offered; its content is in the note it points at
    if (words.length) { const hay = `${n.title} ${n.name} ${n.meta.description ?? ""} ${n.id} ${n.meta.partNumber ?? ""} ${n.meta.aliases ?? ""}`.toLowerCase(); if (!words.every((w) => hay.includes(w))) continue; }
    out.push(n);
  }
  out.sort((a, b) => a.title.localeCompare(b.title) || a.path.localeCompare(b.path));
  return { notes: out.slice(0, limit), total: out.length };
}

/** Statuses a person can set: the ones already used in the vault plus the two the rules name (Draft is the template default, Retired is how a note ends). */
export const statusChoices = (ix: ModelIndex): string[] => [...new Set(["Draft", ...[...ix.notes.values()].map((n) => n.status).filter(Boolean), "Retired"])];

/* ---- Functional trace ------------------------------------------------------------------------------------------- */
export interface FuncRow { path: string; id: string; title: string; subtype: string; status: string; performedBy: string[]; actions: string[]; satisfies: string[]; satisfiesViaPerformer: string[]; verifiedBy: string[]; allocatedTo: string[]; gaps: string[] }
export function functionalTrace(ix: ModelIndex): FuncRow[] {
  const rows: FuncRow[] = [];
  const uniq = (a: string[]): string[] => [...new Set(a)];
  for (const n of ix.notes.values()) {
    if (n.type !== "Behavior" && n.def?.keyword !== "action def") continue;
    const inn = incoming(ix, n.path), out = outgoing(ix, n.path);
    const performedBy = uniq(inn.filter((e) => (e.kind === "performs" || e.kind === "hasAction") && e.to).map((e) => e.from));
    const direct = uniq(out.filter((e) => e.kind === "satisfies" && e.to).map((e) => e.to!));
    const via = uniq(performedBy.flatMap((p) => outgoing(ix, p).filter((e) => e.kind === "satisfies" && e.to).map((e) => e.to!))).filter((r) => !direct.includes(r));
    const r: FuncRow = { path: n.path, id: n.id, title: n.title, subtype: n.subtype, status: n.status, performedBy,
      actions: [...(n.def?.usages ?? []).filter((u) => u.kind === "action").map((u) => u.name), ...out.filter((e) => e.kind === "hasAction" && e.to).map((e) => nm(ix, e.to, e.toSymbol))],
      satisfies: direct, satisfiesViaPerformer: via, verifiedBy: uniq(inn.filter((e) => e.kind === "verifies").map((e) => e.from)),
      allocatedTo: uniq([...inn.filter((e) => e.kind === "allocatedTo").map((e) => e.from), ...out.filter((e) => e.kind === "allocatedTo" && e.to).map((e) => e.to!)]), gaps: [] };
    if (!performedBy.length) r.gaps.push("no performer");
    if (!direct.length && !via.length) r.gaps.push("no requirement");
    rows.push(r);
  }
  return rows.sort((a, b) => a.id.localeCompare(b.id) || a.title.localeCompare(b.title));
}
const funcRelated = (r: FuncRow, sel: string): boolean => r.path === sel || [r.performedBy, r.satisfies, r.satisfiesViaPerformer, r.verifiedBy, r.allocatedTo].some((l) => l.includes(sel));
const traceRelated = (r: TraceRow, sel: string): boolean => r.path === sel || [r.satisfiedBy, r.verifiedBy, r.derivedFrom, r.derives, r.refines, r.refinedBy, r.allocatedTo].some((l) => l.includes(sel));

/* ---- Lenses: the same data as plain tables, for the narrow panel and the main window ------------------------------ */
export type Lens = "dashboard" | "note" | "tables" | "structure" | "design" | "internal" | "functional" | "states" | "requirements" | "review" | "pick" | "common" | "layout" | "compare" | "merge" | "edit";
export const LENSES: Array<[Lens, string]> = [["dashboard", "Dashboard"], ["note", "Note"], ["tables", "Tables"], ["structure", "Structure"], ["design", "Design types"], ["internal", "Internal structure"], ["functional", "Function"], ["states", "States"], ["requirements", "Requirements"], ["review", "Review"], ["pick", "Pick notes"], ["common", "Common related"], ["layout", "Auto-layout and refresh"], ["compare", "Compare notes"], ["merge", "Merge notes"], ["edit", "Edit"]];
/** The three menus of the panel (D-0084): what to see of a note, what to see of the model, and the canvas tools. */
export const LENS_GROUPS: Array<{ id: "note" | "model" | "canvas"; label: string; lenses: Lens[] }> = [
  { id: "note", label: "Note", lenses: ["note", "structure", "design", "internal", "functional", "states", "requirements", "compare", "merge", "edit"] },
  { id: "model", label: "Model", lenses: ["dashboard", "tables", "review"] },
  { id: "canvas", label: "Canvas", lenses: ["pick", "common", "layout"] },
];
export const LENS_PROFILE: Record<Lens, string> = { dashboard: "Everything", note: "Everything", tables: "Everything", structure: "Structure trace", design: "Everything", internal: "Everything", functional: "Functional trace", states: "Everything", requirements: "Requirements trace", review: "Everything", pick: "Everything", common: "Everything", layout: "Everything", compare: "Everything", merge: "Everything", edit: "Everything" };
export const lensHasCanvas = (l: Lens): boolean => l === "structure" || l === "internal" || l === "functional" || l === "requirements" || l === "tables";
export const lensHasTable = (l: Lens): boolean => l !== "dashboard" && l !== "note" && l !== "edit" && l !== "pick" && l !== "common" && l !== "layout" && l !== "merge";

export interface Cell { text: string; path?: string | null; cls?: string; /** a button that opens this relationship in the Edit lens */ action?: EdgeRef }
export type TableCell = Cell | Cell[] | string;
export interface TableData { id: string; title: string; columns: Array<{ key: string; label: string; wide?: boolean }>; rows: Array<Record<string, TableCell>>; empty: string; note?: string }
const C = (ix: ModelIndex, path: string | null, fallback = ""): Cell => ({ text: path ? nm(ix, path, path) : fallback, path });
const Cs = (ix: ModelIndex, paths: string[]): Cell[] => paths.map((p) => C(ix, p));
export interface LensOptions { scope?: "selected" | "all"; table?: "notes" | "relationships" | "usages"; text?: string; /** structure lens: the whole tree (default) or only the direct parts (D-0085) */ tree?: "full" | "direct"; /** compare lens: the second note (D-0092) */ other?: string }

export function lensTables(ix: ModelIndex, lens: Lens, sel: string, o: LensOptions = {}): TableData[] {
  const scope = o.scope ?? (sel ? "selected" : "all"), has = !!sel && ix.notes.has(sel), n = has ? ix.notes.get(sel)! : null;
  const out: TableData[] = [];
  if (lens === "structure") {
    if (!n) return [{ id: "structure", title: "Structure trace", columns: [], rows: [], empty: "Select a note in Obsidian to trace its structure." }];
    const st = structure(ix, sel, o.tree === "direct" ? 1 : 6, 40, ["hasPart"]), flat: Array<Record<string, TableCell>> = [];
    const walk = (t: TreeNode, level: number): void => {
      flat.push({ level: String(level), name: { text: "\u00a0\u00a0".repeat(level) + t.label, path: t.path }, role: t.kind === "root" ? "this note" : t.kind.replace(/^has/, "").toLowerCase(), mult: t.detail && !t.path ? "" : t.detail, type: t.path ? (ix.notes.get(t.path)?.type ?? "") : "not in vault", id: t.path ? (ix.notes.get(t.path)?.id ?? "") : "", note: t.path ? "" : t.detail });
      for (const c of t.children) walk(c, level + 1);
    };
    walk(st.tree, 0);
    out.push({ id: "structure", title: `Structure of ${n.title}`, columns: [{ key: "name", label: "Element" }, { key: "role", label: "Role" }, { key: "mult", label: "Qty" }, { key: "type", label: "Type" }, { key: "id", label: "Id", wide: true }, { key: "note", label: "Note", wide: true }], rows: flat, empty: "This definition owns no parts. Ports are under Internal structure, actions under Function, states under States.",
      note: [st.supers.length ? "Specializes " + st.supers.map((p) => nm(ix, p, p)).join(" → ") : "", st.subs.length ? "Specialized by " + st.subs.map((p) => nm(ix, p, p)).join(", ") : "", st.untyped.length ? "Untyped: " + st.untyped.join(", ") : ""].filter(Boolean).join(" · ") });
    const direct = o.tree === "direct", b = bom(ix, sel, direct ? 1 : 12);
    out.push({ id: "bom", title: direct ? "Parts list (direct parts only)" : "Parts list (rolled up)", columns: [{ key: "part", label: "Part" }, { key: "qty", label: "Quantity" }, { key: "unit", label: "Unit" }, { key: "depth", label: "Depth" }], rows: b.map((x) => ({ part: C(ix, x.path), qty: String(Math.round(x.qty * 1000) / 1000), unit: x.unit, depth: String(x.depth) })), empty: "No resolved parts under this note." });
    const w = whereUsed(ix, sel), up: Array<Record<string, TableCell>> = [];
    const walkUp = (t: TreeNode, level: number): void => { for (const c of t.children) { up.push({ assembly: { text: "\u00a0\u00a0".repeat(level) + c.label, path: c.path }, via: c.kind.replace(/^has/, "").toLowerCase(), qty: c.detail }); if (!direct) walkUp(c, level + 1); } };
    walkUp(w.tree, 0);
    out.push({ id: "where", title: `Where ${n.title} is used`, columns: [{ key: "assembly", label: "Assembly" }, { key: "via", label: "Relationship" }, { key: "qty", label: "Qty" }], rows: up, empty: "Nothing owns, specializes or performs this note.", note: w.references.length ? `${w.references.length} other reference(s): ` + w.references.map((r) => `${r.kind} from ${nm(ix, r.path, r.path)}`).join("; ") : "" });
  } else if (lens === "compare") {
    if (!n) return [{ id: "compare", title: "Compare notes", columns: [], rows: [], empty: "Select a note, then choose the note to compare it with." }];
    const o2 = o.other && ix.notes.has(o.other) ? ix.notes.get(o.other)! : null;
    if (!o2) return [{ id: "compare", title: `Compare ${n.title}`, columns: [], rows: [], empty: "Choose the second note above." }];
    const r = compareNotes(ix, n.path, o2.path)!, A = n.title, B = o2.title, ind = (l: number): string => "\u00a0\u00a0".repeat(l);
    const plainRows = (l: Array<{ what: string; a: string; b: string }>): Array<Record<string, TableCell>> => l.map((x) => ({ what: x.what, a: x.a, b: x.b }));
    const cols = (w: string): TableData["columns"] => [{ key: "what", label: w }, { key: "a", label: A, wide: true }, { key: "b", label: B, wide: true }];
    out.push({ id: "compare-sum", title: `${A} and ${B}`, columns: [], rows: [], empty: r.same ? "No differences found in properties, members, relationships or structure." : `${r.differing} difference${r.differing === 1 ? "" : "s"}: ${r.props.length} propert${r.props.length === 1 ? "y" : "ies"}, ${r.members.length} other member${r.members.length === 1 ? "" : "s"}, ${r.links.length} relationship${r.links.length === 1 ? "" : "s"}, ${r.structure.length} structure row${r.structure.length === 1 ? "" : "s"}.` });
    out.push({ id: "compare-props", title: "Properties that differ", columns: cols("Property"), rows: plainRows(r.props), empty: "No property differs." });
    out.push({ id: "compare-structure", title: "Structure, down to the parts that differ", columns: [{ key: "a", label: A }, { key: "b", label: B }, { key: "diff", label: "Difference", wide: true }],
      rows: r.structure.map((x) => ({ a: x.pathA ? { text: ind(x.level) + x.a!, path: x.pathA } : "", b: x.pathB ? { text: ind(x.level) + x.b!, path: x.pathB } : "", diff: x.diff })), empty: "The parts match: same parts, quantities and revisions at every level." });
    out.push({ id: "compare-members", title: "Other SysML members that differ (ports, attributes, behavior, requirements)", columns: cols("Area"), rows: plainRows(r.members), empty: "No other member differs." });
    out.push({ id: "compare-links", title: "Relationships that differ", columns: cols("Kind"), rows: plainRows(r.links), empty: "No relationship differs." });
  } else if (lens === "design") {
    if (!n) return [{ id: "design", title: "Design types", columns: [], rows: [], empty: "Select a note in Obsidian to see its design types." }];
    const dt = designTypes(ix, sel), flat: Array<Record<string, TableCell>> = [];
    dt.chain.forEach((p, i) => flat.push({ name: { text: "  ".repeat(i) + nm(ix, p, p), path: p }, role: "specialized by the next row", owns: "" }));
    const walk = (t: TreeNode, level: number): void => { flat.push({ name: { text: "  ".repeat(level) + t.label, path: t.path }, role: t.kind === "root" ? "this note" : "design type", owns: t.detail }); for (const c of t.children) walk(c, level + 1); if (t.more) flat.push({ name: "  ".repeat(level + 1) + `… ${t.more} more`, role: "", owns: "" }); };
    walk(dt.tree, dt.chain.length);
    out.push({ id: "design", title: `Design types of ${n.title}`, columns: [{ key: "name", label: "Definition" }, { key: "role", label: "Role" }, { key: "owns", label: "Owns", wide: true }], rows: flat, empty: "This definition neither specializes nor is specialized.",
      note: dt.siblings.length ? `Siblings: ${dt.siblings.map((p) => nm(ix, p, p)).slice(0, 12).join(", ")}${dt.siblings.length > 12 ? ` … +${dt.siblings.length - 12}` : ""}` : "" });
  } else if (lens === "internal") {
    if (!n) return [{ id: "internal", title: "Internal structure", columns: [], rows: [], empty: "Select a note in Obsidian to see its internal structure." }];
    const r = internalStructure(ix, sel), typ = (type: string, path: string | null): Cell => (type ? { text: path ? nm(ix, path, type) : type + " (not in vault)", path, cls: path ? "" : "gap" } : { text: "untyped", cls: "gap" });
    out.push({ id: "parts", title: `Parts of ${n.title} and the ports they offer`, columns: [{ key: "part", label: "Part" }, { key: "type", label: "Type" }, { key: "qty", label: "Qty" }, { key: "ports", label: "Ports of that type", wide: true }],
      rows: r.parts.map((x) => ({ part: (x.ref ? "ref " : "") + x.name, type: typ(x.type, x.path), qty: x.mult, ports: x.ports.map((q) => q.name + (q.type ? " : " + (q.conj ? "~" : "") + (q.path ? nm(ix, q.path, q.type) : q.type) : "")).join(", ") })), empty: "This definition has no parts." });
    out.push({ id: "boundary", title: "Boundary ports", columns: [{ key: "port", label: "Port" }, { key: "type", label: "Type" }, { key: "conj", label: "Conjugated" }, { key: "qty", label: "Qty" }],
      rows: r.boundary.map((x) => ({ port: x.name, type: typ(x.type, x.path), conj: x.conj ? "~ yes" : "", qty: x.mult })), empty: "This definition has no ports of its own." });
    const endCell = (e: InternalEnd): Cell => ({ text: e.text + (e.type ? " : " + (e.path ? nm(ix, e.path, e.type) : e.type) : "") + (e.ok ? "" : " (not found)"), path: e.path, cls: e.ok ? "" : "gap" });
    out.push({ id: "links", title: "Connections, bindings and flows", columns: [{ key: "kind", label: "Kind" }, { key: "a", label: "From" }, { key: "b", label: "To" }, { key: "via", label: "Through", wide: true }],
      rows: r.links.map((x) => ({ kind: x.kind, a: endCell(x.a), b: endCell(x.b), via: x.via ? ({ text: x.viaPath ? nm(ix, x.viaPath, x.via) : x.via, path: x.viaPath } as Cell) : x.name })), empty: "No connections, bindings or flows.",
      note: r.untyped.length ? "Untyped: " + r.untyped.join(", ") : "" });
  } else if (lens === "states") {
    if (!n) return [{ id: "states", title: "States", columns: [], rows: [], empty: "Select a note in Obsidian to see its states." }];
    const f = behavior(ix, sel, "states");
    out.push({ id: "states", title: `States of ${n.title}`, columns: [{ key: "state", label: "State" }, { key: "type", label: "Type" }, { key: "layer", label: "Step" }],
      rows: f.nodes.map((x) => ({ state: x.name, type: x.path ? ({ text: nm(ix, x.path, x.type), path: x.path } as Cell) : x.type, layer: String(x.layer) })), empty: "This definition has no states.", note: f.triggers.length ? f.triggers.join("; ") : "" });
    out.push({ id: "transitions", title: "Transitions", columns: [{ key: "from", label: "From" }, { key: "to", label: "To" }, { key: "trigger", label: "Trigger (accept)", wide: true }, { key: "guard", label: "Guard (if)", wide: true }, { key: "effect", label: "Effect (do)", wide: true }],
      rows: f.edges.map((e) => { const g = f.guards.find((x) => x.from === e.from && x.to === e.to); return { from: e.from, to: e.to, trigger: g?.trigger ?? "", guard: g?.guard ?? "", effect: g?.effect ?? "" }; }), empty: "No transitions.", note: f.unresolved.length ? "Not drawn: " + f.unresolved.join("; ") : "" });
  } else if (lens === "functional") {
    const all = functionalTrace(ix), rows = scope === "selected" && has ? all.filter((r) => funcRelated(r, sel)) : all;
    out.push({ id: "functional", title: scope === "selected" && has ? `Functional trace around ${n!.title}` : "Functional trace (all functions)", columns: [{ key: "fn", label: "Function" }, { key: "by", label: "Performed by" }, { key: "sat", label: "Satisfies" }, { key: "ver", label: "Verified by", wide: true }, { key: "alloc", label: "Allocated to", wide: true }, { key: "act", label: "Actions", wide: true }, { key: "gaps", label: "Gaps" }],
      rows: rows.map((r) => ({ fn: { text: (r.id ? r.id + "  " : "") + r.title, path: r.path } as Cell, by: Cs(ix, r.performedBy), sat: [...Cs(ix, r.satisfies), ...Cs(ix, r.satisfiesViaPerformer).map((c) => ({ ...c, text: c.text + " (via performer)" }))], ver: Cs(ix, r.verifiedBy), alloc: Cs(ix, r.allocatedTo), act: r.actions.join(", "), gaps: { text: r.gaps.join(", "), cls: r.gaps.length ? "gap" : "" } }) as unknown as Record<string, TableCell>), empty: has && scope === "selected" ? "No functions are related to this note." : "No Behavior notes in the vault.",
      note: `${all.length} function(s) in the vault; ${all.filter((r) => r.gaps.length).length} with gaps.` });
  } else if (lens === "requirements") {
    const t = traceMatrix(ix), rows = scope === "selected" && has ? t.rows.filter((r) => traceRelated(r, sel)) : t.rows;
    out.push({ id: "requirements", title: scope === "selected" && has ? `Requirements trace around ${n!.title}` : "Requirements trace (all requirements)", columns: [{ key: "req", label: "Requirement" }, { key: "sub", label: "Subtype" }, { key: "txt", label: "Text", wide: true }, { key: "sat", label: "Satisfied by" }, { key: "ver", label: "Verified by" }, { key: "from", label: "Derived from", wide: true }, { key: "der", label: "Derives", wide: true }, { key: "alloc", label: "Allocated to", wide: true }, { key: "gaps", label: "Gaps" }],
      rows: rows.map((r) => ({ req: { text: (r.id ? r.id + "  " : "") + r.title, path: r.path } as Cell, sub: r.subtype, txt: r.text, sat: Cs(ix, r.satisfiedBy), ver: Cs(ix, r.verifiedBy), from: Cs(ix, r.derivedFrom), der: Cs(ix, r.derives), alloc: Cs(ix, r.allocatedTo), gaps: { text: r.gaps.join(", "), cls: r.gaps.length ? "gap" : "" } }) as unknown as Record<string, TableCell>), empty: has && scope === "selected" ? "No requirements are related to this note." : "No requirements in the vault.",
      note: `${t.total} requirement(s): ${t.satisfied} satisfied, ${t.verified} verified.` });
  } else if (lens === "tables") {
    const which = o.table ?? "relationships";
    if (which === "notes") {
      const rows = tableRows(ix, { ...(o.text ? { text: o.text } : {}), sort: "id" });
      out.push({ id: "notes", title: "Notes", columns: [{ key: "id", label: "Id" }, { key: "file", label: "File" }, { key: "title", label: "Title" }, { key: "type", label: "Type" }, { key: "status", label: "Status" }, { key: "folder", label: "Folder", wide: true }, { key: "flags", label: "Flags" }, { key: "dangling", label: "Unresolved", wide: true }], rows: rows.map((r) => ({ id: r.id, file: r.file, title: { text: r.title, path: r.path } as Cell, type: r.type + (r.subtype ? "/" + r.subtype : ""), status: r.status, folder: r.folder, flags: String(r.flags || ""), dangling: String(r.dangling || "") })), empty: "No notes match." });
    } else if (which === "usages") {
      const u = n?.def?.usages ?? [];
      out.push({ id: "usages", title: n ? `Usages in ${n.title}` : "Usages", columns: [{ key: "kind", label: "Kind" }, { key: "name", label: "Name" }, { key: "type", label: "Type" }, { key: "mult", label: "Multiplicity" }], rows: u.map((x) => ({ kind: (x.dir ? x.dir + " " : "") + x.kind, name: x.name, type: x.type ? ({ text: ix.bySymbol.get(x.type) ? nm(ix, ix.bySymbol.get(x.type)!, x.type) : x.type + " (not in vault)", path: ix.bySymbol.get(x.type) ?? null } as Cell) : { text: "untyped", cls: "gap" } as Cell, mult: x.mult ?? "" })), empty: n ? "No usages." : "Select a note." });
    } else {
      const rows = relationshipRows(ix, [], o.text ?? "").filter((r) => !sel || scope === "all" || r.from === sel || r.to === sel);
      out.push({ id: "relationships", title: sel && scope === "selected" ? `Relationships of ${n?.title ?? "note"}` : "All relationships", columns: [{ key: "from", label: "From" }, { key: "kind", label: "Kind" }, { key: "to", label: "To" }, { key: "label", label: "Label", wide: true }, { key: "edit", label: "" }], rows: rows.map((r) => ({ edit: r.ref ? { text: "Edit", action: r.ref } as Cell : "", from: r.from === null ? { text: r.fromTitle + " (not in vault)", cls: "gap" } as Cell : { text: r.fromTitle, path: r.from } as Cell, kind: r.kind, to: r.resolved || r.from === null ? { text: r.toTitle, path: r.to } as Cell : { text: r.toTitle + " (not in vault)", cls: "gap" } as Cell, label: r.label })), empty: "No relationships." });
    }
  }
  return out;
}
