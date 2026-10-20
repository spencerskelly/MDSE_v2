/* Ports and their connections in full SysML v2 (D-0033). A port definition owns directed features (`in item x : T`,
 * `out attribute v`), a port usage is typed by a port definition or its conjugate (`port p : ~P [2] ordered`), an interface
 * definition owns ends (`end supplier : P`), and a part connects ports with `connect`, `connection`, `interface`, `flow` and
 * `bind` statements. These plans write only inside the `## SysML v2` block and check what the language checks: names, types,
 * multiplicity, conjugation pairing and flow direction (a conjugated port reverses its directed features). */
import type { Definition, Usage } from "./sysml_scan.ts";
import type { ModelIndex, Note } from "./index.ts";
import { edCloseOf, edFindDef, edInsert, edWithBlock } from "./edit.ts";
import type { EditPlan } from "./edit.ts";
import { edLineRange, edMembers } from "./edit_rel.ts";

export type PortKind = "feature" | "port" | "end" | "connect" | "flow" | "bind";
export interface PortSpec {
  kind: PortKind; name: string;
  /** feature: item | attribute | port. */ memberKind?: string; dir?: string;
  /** symbol of the port, item or end type (or a qualified library name for an attribute) */ type?: string;
  conj?: boolean; mult?: string; ordered?: boolean; nonunique?: boolean; ref?: boolean;
  /** connect: plain | connection | interface */ form?: string;
  /** symbol of the interface or connection definition */ def?: string;
  /** feature paths such as `charger.dcOut` or `charger.dcOut.current` */ a?: string; b?: string; endA?: string; endB?: string;
  /** flow: symbol of the item type carried (`flow of Current …`) */ item?: string;
}

const ptBad = (problem: string): EditPlan => ({ summary: "", writes: [], problems: [problem] });
const PT_ID = /^[A-Za-z_]\w*$/, PT_QNAME = /^[A-Za-z_]\w*(?:::[A-Za-z_]\w*)*$/, PT_PATH = /^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*$/;
export const ED_PORT_OWNERS: Record<PortKind, string[]> = {
  feature: ["port def"], port: ["part def", "item def", "port def"], end: ["interface def"],
  connect: ["part def", "item def"], flow: ["part def", "item def", "interface def"], bind: ["part def", "item def", "interface def"],
};
export const ED_PORT_LABEL: Record<PortKind, string> = { feature: "Port feature", port: "Port", end: "Interface end", connect: "Connection", flow: "Flow", bind: "Binding" };
/** Kinds a note's definition can own, for the "Add" list. */
export const edPortKindsFor = (n: Note | undefined): PortKind[] => (n?.def ? (Object.keys(ED_PORT_OWNERS) as PortKind[]).filter((k) => ED_PORT_OWNERS[k].includes(n.def!.keyword)) : []);

const ptFlip = (d: string | undefined): string => (d === "in" ? "out" : d === "out" ? "in" : d ?? "");
export const edMultText = (raw: string | undefined): string | null => {
  const m = (raw ?? "").trim().replace(/^\[|\]$/g, "").trim();
  if (!m || m === "1") return "";
  return /^(\d+|\*)(\.\.(\d+|\*))?$/.test(m) ? `[${m}]` : null;
};
const ptDefOf = (ix: ModelIndex, sym: string | undefined): Definition | null => { const p = sym ? ix.bySymbol.get(sym) : undefined; return p ? ix.notes.get(p)?.def ?? null : null; };

/* ---- resolving a feature path ------------------------------------------------------------------------------- */
function ptLookup(ix: ModelIndex, def: Definition, name: string, seen = new Set<string>()): Usage | undefined {
  const u = def.usages.find((x) => x.name === name);
  if (u) return u;
  if (seen.has(def.symbol)) return undefined;
  seen.add(def.symbol);
  for (const s of def.specializes) { const d = ptDefOf(ix, s), r = d ? ptLookup(ix, d, name, seen) : undefined; if (r) return r; }
  return undefined;
}
export interface Resolved { usage: Usage; /** an odd number of conjugated ports on the way: directions are reversed */ flipped: boolean; /** direction as seen from the owner of the path */ dir: string }
/** Walks `a.b.c` from the owner. `null` = a segment's type is outside the vault, so nothing more can be checked; a string = the problem. */
export function edResolvePath(ix: ModelIndex, owner: Definition, path: string): Resolved | null | string {
  if (!PT_PATH.test(path)) return `"${path}" is not a path like charger.dcOut.`;
  const segs = path.split(".");
  let cur: Definition = owner, flipped = false, u: Usage | undefined;
  for (let i = 0; i < segs.length; i++) {
    u = ptLookup(ix, cur, segs[i]!);
    if (!u) return `"${segs[i]}" is not a member of ${cur.name}.`;
    if (i === segs.length - 1) break;
    const next = ptDefOf(ix, u.type);
    if (!next) return u.type ? null : `"${segs[i]}" has no type, so "${segs[i + 1]}" cannot be found.`;
    if (u.conj) flipped = !flipped;
    cur = next;
  }
  return { usage: u!, flipped, dir: flipped ? ptFlip(u!.dir) : u!.dir ?? "" };
}

/* ---- candidate paths for the UI ------------------------------------------------------------------------------ */
export interface PathChoice { path: string; kind: string; type: string; conj: boolean; dir: string }
/** Usages of the owner, the members of their types, and one level more: the paths a connection, flow or binding can name. */
export function edFeaturePaths(ix: ModelIndex, owner: Definition, depth = 3): PathChoice[] {
  const out: PathChoice[] = [];
  const walk = (def: Definition, prefix: string, flipped: boolean, level: number, seen: Set<string>): void => {
    const names = new Set<string>();
    const defs = [def, ...def.specializes.map((s) => ptDefOf(ix, s)).filter((x): x is Definition => !!x)];
    for (const d of defs) for (const u of d.usages) {
      if (names.has(u.name) || !PT_ID.test(u.name)) continue; names.add(u.name);
      const p = prefix + u.name, inner = ptDefOf(ix, u.type);
      out.push({ path: p, kind: (u.end ? "end " : "") + u.kind, type: u.type ? (u.conj ? "~" : "") + (ix.notes.get(ix.bySymbol.get(u.type) ?? "")?.title ?? u.type) : "", conj: !!u.conj, dir: flipped ? ptFlip(u.dir) : u.dir ?? "" });
      if (inner && level < depth && !seen.has(inner.symbol) && out.length < 600) walk(inner, p + ".", u.conj ? !flipped : flipped, level + 1, new Set([...seen, inner.symbol]));
    }
  };
  walk(owner, "", false, 1, new Set([owner.symbol]));
  return out;
}

/* ---- rendering and checking ---------------------------------------------------------------------------------- */
const ptKeywordOf = (ix: ModelIndex, sym: string): string | null => { const p = ix.bySymbol.get(sym); return p ? ix.notes.get(p)?.def?.keyword ?? null : null; };
export interface Checked { stmt: string; problems: string[]; notes: string[] }

export function edCheckPortSpec(ix: ModelIndex, owner: Note, s: PortSpec, ignoreName = ""): Checked {
  const problems: string[] = [], notes: string[] = [], def = owner.def;
  const r: Checked = { stmt: "", problems, notes };
  if (!def) { problems.push(`"${owner.title}" has no SysML definition.`); return r; }
  if (!ED_PORT_OWNERS[s.kind].includes(def.keyword)) { problems.push(`A ${ED_PORT_LABEL[s.kind].toLowerCase()} goes in ${ED_PORT_OWNERS[s.kind].join(" or ")}, not in a ${def.keyword}.`); return r; }
  const name = (s.name ?? "").trim(), taken = new Set(def.usages.map((u) => u.name).concat(def.stmts.map((x) => x.name ?? "").filter(Boolean)));
  if (ignoreName) taken.delete(ignoreName);
  const typeRef = (sym: string | undefined, allowed: string[], what: string, required: boolean): string => {
    const t = (sym ?? "").trim();
    if (!t) { if (required) problems.push(`Pick the ${what}.`); return ""; }
    if (!PT_QNAME.test(t)) { problems.push(`"${t}" is not a type name.`); return ""; }
    const kw = ptKeywordOf(ix, t);
    if (kw && !allowed.includes(kw)) problems.push(`The ${what} must be a ${allowed.join(" or ")}; "${t}" is a ${kw}.`);
    if (!kw && allowed.includes("port def") && allowed.length === 1) notes.push(`"${t}" is not a note in this vault; it is written as given.`);
    return t;
  };
  const mult = edMultText(s.mult);
  if (mult === null) problems.push(`Quantity "${s.mult}" is not like 3 or 0..1 or 1..*.`);
  const mods = `${s.ordered ? " ordered" : ""}${s.nonunique ? " nonunique" : ""}`;

  if (s.kind === "feature" || s.kind === "port" || s.kind === "end") {
    if (!PT_ID.test(name)) problems.push(name ? `"${name}" is not a valid name (letters, digits, underscore).` : "A name is required.");
    else if (taken.has(name)) problems.push(`"${name}" is already a member of ${def.name}.`);
    const mk = s.kind === "feature" ? s.memberKind ?? "item" : s.kind === "port" ? "port" : "end";
    if (s.kind === "feature" && !["item", "attribute", "port"].includes(mk)) problems.push(`A port feature is an item, attribute or port, not "${mk}".`);
    const dir = s.dir ?? "";
    if (dir && !["in", "out", "inout"].includes(dir)) problems.push(`Direction "${dir}" is not in, out or inout.`);
    if (dir && !["item", "attribute"].includes(mk)) problems.push("Only an item or attribute has a direction.");
    const t = mk === "item" ? typeRef(s.type, ["item def", "part def"], "item type", false) : mk === "attribute" ? typeRef(s.type, ["item def", "part def", "port def"], "attribute type", false) : typeRef(s.type, ["port def"], "port definition", true);
    if (s.conj && !["port", "end"].includes(mk)) problems.push("Only a port or an interface end can be conjugated.");
    if (s.ref && mk !== "port") problems.push("Only a port can be a reference.");
    if (problems.length) return r;
    const type = t ? ` : ${s.conj ? "~" : ""}${t}${mult}` : mult ? ` ${mult}` : "";
    r.stmt = mk === "end" ? `end ${name}${type}${mods};` : `${s.ref ? "ref " : ""}${dir ? dir + " " : ""}${mk} ${name}${type}${mods};`;
    return r;
  }

  const paths: Array<[string, string | undefined]> = [["first", s.a], ["second", s.b]];
  const res: Array<Resolved | null> = [];
  for (const [which, p] of paths) {
    const pa = (p ?? "").trim();
    if (!pa) { problems.push(`Pick the ${which} end.`); res.push(null); continue; }
    const x = edResolvePath(ix, def, pa);
    if (typeof x === "string") { problems.push(x); res.push(null); } else res.push(x);
  }
  if (s.name?.trim()) { if (!PT_ID.test(s.name.trim())) problems.push(`"${s.name}" is not a valid name.`); else if (taken.has(s.name.trim())) problems.push(`"${s.name.trim()}" is already used in ${def.name}.`); }
  const nm = s.name?.trim() ? s.name.trim() + " " : "";
  if (problems.length) return r;
  const [A, B] = [res[0], res[1]], a = s.a!.trim(), b = s.b!.trim();

  if (s.kind === "bind") {
    if (a === b) problems.push("A feature cannot be bound to itself.");
    if (A && B && A.usage.type && B.usage.type && A.usage.type !== B.usage.type) notes.push(`Bound features have different types (${A.usage.type}, ${B.usage.type}).`);
    if (problems.length) return r;
    r.stmt = `bind ${a} = ${b};`; return r;
  }

  if (s.kind === "flow") {
    const item = s.item?.trim() ? typeRef(s.item, ["item def", "part def"], "item type", false) : "";
    if (A && !["", "out", "inout"].includes(A.dir)) problems.push(`"${a}" is ${A.dir}${A.flipped ? " after the port is conjugated" : ""}: a flow starts at an out or inout feature.`);
    if (B && !["", "in", "inout"].includes(B.dir)) problems.push(`"${b}" is ${B.dir}${B.flipped ? " after the port is conjugated" : ""}: a flow ends at an in or inout feature.`);
    if (A && B && A.usage.type && B.usage.type && A.usage.type !== B.usage.type) notes.push(`The ends have different types (${A.usage.type}, ${B.usage.type}).`);
    if (item && A?.usage.type && A.usage.type !== item) notes.push(`The first end is typed ${A.usage.type}, not ${item}.`);
    if (problems.length) return r;
    r.stmt = `flow ${nm}${item ? `of ${item} ` : ""}from ${a} to ${b};`; return r;
  }

  /* connect */
  const form = s.form ?? "plain";
  if (!["plain", "connection", "interface"].includes(form)) { problems.push(`Unknown connection form "${form}".`); return r; }
  if (a === b) problems.push("A port cannot be connected to itself.");
  if (form === "interface") for (const [p, x] of [[a, A], [b, B]] as Array<[string, Resolved | null]>) if (x && x.usage.kind !== "port") problems.push(`"${p}" is a ${x.usage.kind}; an interface connects ports.`);
  const defSym = s.def?.trim() ?? "";
  let dsym = "";
  if (defSym) {
    dsym = typeRef(defSym, form === "interface" ? ["interface def"] : ["interface def", "connection def"], form === "interface" ? "interface definition" : "connection definition", false);
    const dd = ptDefOf(ix, dsym), ends = dd?.usages.filter((u) => u.end) ?? [];
    const endA = s.endA?.trim() ?? "", endB = s.endB?.trim() ?? "";
    if (!!endA !== !!endB) problems.push("Name both ends or neither.");
    if (dd && !problems.length) {
      let ea: Usage | undefined, eb: Usage | undefined;
      if (endA) {
        ea = ends.find((u) => u.name === endA); eb = ends.find((u) => u.name === endB);
        if (!ea) problems.push(`"${endA}" is not an end of ${dd.name}.`); if (!eb) problems.push(`"${endB}" is not an end of ${dd.name}.`);
        if (ea && eb && ea === eb) problems.push("The two connected ports need two different ends.");
      } else if (ends.length === 2) { ea = ends[0]; eb = ends[1]; notes.push(`Ends taken in order: ${ea!.name}, ${eb!.name}.`); }
      else if (ends.length) problems.push(`${dd.name} has ${ends.length} ends; name the two this connects.`);
      for (const [e, x, p] of [[ea, A, a], [eb, B, b]] as Array<[Usage | undefined, Resolved | null, string]>) {
        if (!e || !x || !x.usage.type || !e.type) continue;
        if (x.usage.type !== e.type) problems.push(`"${p}" is typed ${x.usage.type}, but end ${e.name} is typed ${e.type}.`);
        else if (!!x.usage.conj !== !!e.conj) problems.push(`"${p}" is ${x.usage.conj ? "conjugated (~)" : "not conjugated"}, but end ${e.name} is ${e.conj ? "conjugated (~)" : "not conjugated"}.`);
      }
    }
  } else if (s.endA?.trim() || s.endB?.trim()) problems.push("End names need an interface or connection definition.");
  if (!defSym && A && B && A.usage.type && A.usage.type === B.usage.type && !!A.usage.conj === !!B.usage.conj && A.usage.kind === "port" && B.usage.kind === "port")
    notes.push(`Both ports are ${A.usage.conj ? "~" : ""}${A.usage.type}; a connection normally pairs a port with its conjugate (~).`);
  if (problems.length) return r;
  const ends = s.endA?.trim() ? [`${s.endA.trim()} ::> `, `${s.endB!.trim()} ::> `] : ["", ""];
  const head = form === "plain" ? "" : `${form} ${nm}${dsym ? `: ${dsym} ` : ""}`;
  r.stmt = `${head}connect ${ends[0]}${a} to ${ends[1]}${b};`;
  return r;
}

/* ---- plans --------------------------------------------------------------------------------------------------- */
const ptFinish = (summary: string, c: Checked): string => summary + (c.notes.length ? "  Note: " + c.notes.join(" ") : "");
const ptLabel = (s: PortSpec): string => `${ED_PORT_LABEL[s.kind]}${s.name ? " " + s.name : ""}`;

export function planPortAdd(ix: ModelIndex, files: Map<string, string>, ownerPath: string, s: PortSpec): EditPlan {
  const owner = ix.notes.get(ownerPath), text = files.get(ownerPath);
  if (!owner || text === undefined) return ptBad("The note is not loaded.");
  const c = edCheckPortSpec(ix, owner, s);
  if (c.problems.length) return { summary: "", writes: [], problems: c.problems };
  const r = edWithBlock(owner, text, (block) => (block.includes(c.stmt) ? block : edInsert(block, owner.def!, c.stmt)));
  if ("problem" in r) return ptBad(r.problem);
  return { summary: ptFinish(`${owner.title}: add ${ptLabel(s).toLowerCase()}.`, c), writes: [{ path: ownerPath, before: text, after: r.text }], problems: [] };
}

function ptWithMember(owner: Note, text: string, head: string, fn: (block: string, m: ReturnType<typeof edMembers>[number]) => string | null): { text: string } | { problem: string } {
  const r = edWithBlock(owner, text, (block) => {
    const at = edFindDef(block, owner.def!.keyword, owner.def!.name);
    if (!at || !at.open) return null;
    const m = edMembers(block, at.term + 1, at.close).find((x) => x.head === head);
    return m ? fn(block, m) : null;
  });
  return "problem" in r && r.problem.startsWith("Could not find") ? { problem: "That member is no longer in the note. Refresh and try again." } : r;
}

export function planPortRemove(ix: ModelIndex, files: Map<string, string>, ownerPath: string, head: string): EditPlan {
  const owner = ix.notes.get(ownerPath), text = files.get(ownerPath);
  if (!owner?.def || text === undefined) return ptBad("The note is not loaded.");
  const r = ptWithMember(owner, text, head, (block, m) => { const [a, b] = edLineRange(block, m); return block.slice(0, a) + block.slice(b); });
  return "problem" in r ? ptBad(r.problem) : { summary: `${owner.title}: remove \`${head}\`.`, writes: [{ path: ownerPath, before: text, after: r.text }], problems: [] };
}

/** Rewrites one member from a spec. A member with a body (properties, doc) is not rewritten: it would lose them. */
export function planPortReplace(ix: ModelIndex, files: Map<string, string>, ownerPath: string, head: string, s: PortSpec): EditPlan {
  const owner = ix.notes.get(ownerPath), text = files.get(ownerPath);
  if (!owner?.def || text === undefined) return ptBad("The note is not loaded.");
  const old = owner.def.usages.find((u) => u.head === head);
  const c = edCheckPortSpec(ix, owner, s, old && s.kind !== "connect" && s.kind !== "flow" && s.kind !== "bind" ? old.name : (owner.def.stmts.find((x) => x.text === head)?.name ?? ""));
  if (c.problems.length) return { summary: "", writes: [], problems: c.problems };
  let hasBody = false;
  const r = ptWithMember(owner, text, head, (block, m) => {
    if (m.body !== null) { hasBody = true; return block; }
    return block.slice(0, m.start) + c.stmt + block.slice(m.end);
  });
  if (hasBody) return ptBad("This member has properties or a description written inside it; change it in the note so they are kept.");
  if ("problem" in r) return ptBad(r.problem);
  return { summary: ptFinish(`${owner.title}: change \`${head}\`.`, c), writes: [{ path: ownerPath, before: text, after: r.text }], problems: [] };
}

/** The spec a member reads back as, for the edit form. null when the member is not one of these kinds. */
export function edSpecOfMember(ix: ModelIndex, ownerPath: string, head: string): PortSpec | null {
  const d = ix.notes.get(ownerPath)?.def;
  if (!d) return null;
  const u = d.usages.find((x) => x.head === head);
  if (u) {
    const kind: PortKind = u.end ? "end" : d.keyword === "port def" ? "feature" : "port";
    if (kind === "port" && u.kind !== "port") return null;
    return { kind, name: u.name, memberKind: u.kind, dir: u.dir ?? "", type: u.type ?? "", conj: !!u.conj, mult: (u.mult ?? "").replace(/^\[|\]$/g, ""), ordered: !!u.mods?.includes("ordered"), nonunique: !!u.mods?.includes("nonunique"), ref: !!u.ref };
  }
  const s = d.stmts.find((x) => x.text === head);
  if (!s) return null;
  if (s.kind === "connect") return { kind: "connect", name: s.name ?? "", form: s.form ?? "plain", def: s.type ?? "", a: s.a ?? "", b: s.b ?? "", endA: s.endA ?? "", endB: s.endB ?? "" };
  if (s.kind === "flow") return { kind: "flow", name: s.name ?? "", a: s.a ?? "", b: s.b ?? "", item: s.type ?? "" };
  if (s.kind === "bind") return { kind: "bind", name: "", a: s.a ?? "", b: s.b ?? "" };
  return null;
}
