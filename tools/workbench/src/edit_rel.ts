/* Change and remove relationships, and their properties (D-0031). A relationship is a member of a note's `## SysML v2`
 * block (a usage, a statement, a `:>` entry or a `verify` line); the index gives each edge an EdgeRef naming the note and
 * the member. These functions read the member back into a form, validate a changed form, and produce an EditPlan. */
import MDSE from "../../core/src/mdse_core.js";
import type { EdgeRef, ModelIndex, Note } from "./index.ts";
import type { Prop } from "./sysml_scan.ts";
import { ED_RELS, edCloseOf, edFindDef, edUsageKinds, edIdent, edWithBlock } from "./edit.ts";
import type { EditPlan, EdRel } from "./edit.ts";

const relBad = (problem: string): EditPlan => ({ summary: "", writes: [], problems: [problem] });

/* ---- members of a definition body ---------------------------------------------------------------------------- */
export interface EdMem { start: number; end: number; head: string; body: string | null; bodyStart: number; tag: string }
/** The members directly inside s[from, to): each runs to its `;`, its matching `}` or the end of its `doc` comment, plus a trailing `// tag`. */
export function edMembers(s: string, from: number, to: number): EdMem[] {
  const out: EdMem[] = [];
  let i = from;
  while (i < to) {
    while (i < to && /\s/.test(s[i]!)) i++;
    if (i >= to) break;
    if (s[i] === "/" && s[i + 1] === "/") { const e = s.indexOf("\n", i); i = e < 0 ? to : e + 1; continue; }
    if (s[i] === "/" && s[i + 1] === "*") { const e = s.indexOf("*/", i + 2); i = e < 0 ? to : e + 2; continue; }
    const start = i; let head = "", end = -1, body: string | null = null, bodyStart = -1;
    for (let j = i; j < to; j++) {
      const c = s[j]!;
      if (c === "/" && s[j + 1] === "*") { const e = s.indexOf("*/", j + 2); if (e < 0) { j = to; break; } if (head.trim() === "doc") { end = e + 2; break; } j = e + 1; continue; }
      if (c === "/" && s[j + 1] === "/") { const e = s.indexOf("\n", j); j = e < 0 ? to : e; continue; }
      if (c === '"') { const e = s.indexOf('"', j + 1); head += s.slice(j, e + 1); j = e < 0 ? to : e; continue; }
      if (c === ";") { end = j + 1; break; }
      if (c === "{") { const close = edCloseOf(s, j); if (close < 0) { j = to; break; } end = close; body = s.slice(j + 1, close - 1); bodyStart = j + 1; break; }
      head += c;
    }
    if (end < 0) break;
    const tm = /^[ \t]*\/\/[ \t]*([A-Za-z]+)[ \t]*(?=\r?\n|$)/.exec(s.slice(end, to));
    const tag = tm ? tm[1]! : "";
    if (tm) end += tm[0].length;
    out.push({ start, end, head: head.replace(/\s+/g, " ").trim(), body, bodyStart, tag });
    i = end;
  }
  return out;
}
/** Range to delete for a member: its whole line(s) when it stands alone on them. */
export function edLineRange(s: string, m: EdMem): [number, number] {
  let a = m.start; while (a > 0 && (s[a - 1] === " " || s[a - 1] === "\t")) a--;
  if (a > 0 && s[a - 1] !== "\n") a = m.start;
  let b = m.end; while (b < s.length && (s[b] === " " || s[b] === "\t")) b++;
  if (s[b] === "\r") b++;
  if (s[b] === "\n") b++; else b = m.end;
  return [a, b];
}

/* ---- the form ---------------------------------------------------------------------------------------------- */
export interface RelForm {
  rel: string; /** dependency kinds: derivedFrom | refines | trace | dependsOn */ depKind: string; target: string;
  usageKind: string; name: string; mult: string; dir: string; ordered: boolean; nonunique: boolean; doc: string; attrs: Prop[]; ownerFirst: boolean;
  /** kept as read so a change does not drop them: `ref port p : ~P :> q :>> r` */ conj: boolean; ref: boolean; subsets: string[]; redefines: string[];
}
export interface RelInfo { ref: EdgeRef; owner: Note; form: RelForm; rel: EdRel | null; /** why the member cannot be changed (it can still be removed) */ why: string }
export const ED_DEP_KINDS = ["derivedFrom", "refines", "trace", "dependsOn"];
const emptyForm = (rel: string): RelForm => ({ rel, depKind: "", target: "", usageKind: "", name: "", mult: "", dir: "", ordered: false, nonunique: false, doc: "", attrs: [], ownerFirst: true, conj: false, ref: false, subsets: [], redefines: [] });

/** The relationship an edge ref names, read back from the index as a form. null when the member is not found. */
export function edRelInfo(ix: ModelIndex, ref: EdgeRef): RelInfo | null {
  const owner = ix.notes.get(ref.owner), d = owner?.def;
  if (!owner || !d) return null;
  const path = (sym: string): string => ix.bySymbol.get(sym) ?? "";
  const mk = (relId: string, f: Partial<RelForm>, why = ""): RelInfo => ({ ref, owner, form: { ...emptyForm(relId), ...f }, rel: ED_RELS.find((r) => r.id === relId) ?? null, why });
  if (ref.kind === "specializes") return d.specializes.includes(ref.key) ? mk("specializes", { target: path(ref.key) }) : null;
  if (ref.kind === "verify") return d.stmts.some((s) => s.kind === "verify" && s.a === ref.key) ? mk("verify", { target: path(ref.key) }) : null;
  const u = d.usages.find((x) => x.head === ref.key);
  if (u) {
    const kinds = u.type ? [u.kind] : [];
    return mk("owns", { target: u.type ? path(u.type) : "", usageKind: u.kind, name: u.name, mult: (u.mult ?? "").replace(/^\[|\]$/g, ""), dir: u.dir ?? "", ordered: !!u.mods?.includes("ordered"), nonunique: !!u.mods?.includes("nonunique"),
      doc: u.doc ?? "", attrs: u.props ?? [], conj: !!u.conj, ref: !!u.ref, subsets: u.subsets ?? [], redefines: u.redefines ?? [] },
      u.end ? "An interface end. Change it in the Ports tab." : kinds.length ? "" : "This usage has no type, so it is not a relationship yet. Edit it in the note.");
  }
  const s = d.stmts.find((x) => x.text === ref.key);
  if (!s) return null;
  const base = { doc: s.doc ?? "", attrs: s.props ?? [] };
  if (s.kind === "satisfy") return mk("satisfy", { ...base, target: path(s.a!) }, s.b ? "This satisfy names a `by` element; edit it in the note." : "");
  if (s.kind === "allocate") { const first = s.a === d.symbol; return mk("allocate", { ...base, ownerFirst: first, target: path(first ? s.b! : s.a!) }); }
  if (s.kind === "perform") return mk("perform", { ...base, name: s.name ?? "", target: path(s.b!) });
  if (s.kind === "include") return mk("include", { ...base, name: s.name ?? "", target: path(s.b!) });
  if (s.kind === "optionalUseCase") return mk("extend", { ...base, name: s.name ?? "", target: path(s.b!) });
  if (s.kind === "dependency" && s.tag && !ED_DEP_KINDS.includes(s.tag)) return mk("", { doc: s.doc ?? "", attrs: s.props ?? [] }, `A dependency tagged "${s.tag}" is edited in the note, not here.`);
  if (s.kind === "dependency") { const first = s.a === d.symbol; const dn = /^#derivation connection (\w+)$/.exec(s.text ?? "")?.[1] ?? ""; return mk(s.tag && ED_DEP_KINDS.includes(s.tag) ? s.tag : "dependsOn", { ...base, depKind: s.tag && ED_DEP_KINDS.includes(s.tag) ? s.tag : "dependsOn", name: dn, ownerFirst: first, target: path(first ? s.b! : s.a!) }); }
  return mk("", base, "This kind of statement is not edited here.");
}

/* ---- properties each relationship offers ------------------------------------------------------------------- */
export type PropId = "name" | "mult" | "dir" | "ordered" | "nonunique" | "doc";
/** Properties a relationship has as named options, and whether free-form attributes are allowed on it. */
export function edPropsFor(rel: string, usageKind = ""): { options: PropId[]; custom: boolean } {
  switch (rel) {
    case "owns": return { options: ["name", "mult", ...(usageKind === "item" ? ["dir" as PropId] : []), "ordered", "nonunique", "doc"], custom: true };
    case "perform": case "include": return { options: ["name", "doc"], custom: true };
    case "extend": return { options: ["name", "doc"], custom: true };
    case "derivedFrom": return { options: [], custom: false };                              // the two ends are the whole relationship
    case "satisfy": case "allocate": case "refines": case "trace": case "dependsOn": return { options: ["doc"], custom: true };
    default: return { options: [], custom: false };                                    // specializes, verify: the head is the whole relationship
  }
}

/* ---- rendering ------------------------------------------------------------------------------------------ */
const ATTR_NAME = /^[A-Za-z_]\w*$/;
const SAFE_VALUE = /^(?:-?\d+(?:\.\d+)?|"[A-Za-z0-9 _.,:%+()-]*")$/;
const edDocComment = (t: string, pad: string): string => `doc /* ${t.replace(/\r\n/g, "\n").trim().replace(/\*\//g, "* /").split("\n").join("\n" + pad + "   ")} */`;
function attrLine(a: Prop, pad: string): string {
  const v = a.value.replace(/\s+/g, " ").trim();
  if (/^-?\d+(\.\d+)?$/.test(v)) return `attribute ${a.name} = ${v};`;
  if (/^[A-Za-z0-9 _.,:%+()-]*$/.test(v) && !/\/\//.test(v)) return `attribute ${a.name} = "${v}";`;
  return `attribute ${a.name} { ${edDocComment(v, pad)} }`;
}
/** The member as it is written for this form. `pad` is the member's own indentation. */
export function edRenderMember(f: RelForm, ownerSym: string, targetSym: string, pad: string): string {
  let head: string;
  switch (f.rel) {
    case "owns": head = `${f.ref ? "ref " : ""}${f.dir ? f.dir + " " : ""}${f.usageKind} ${f.name} : ${f.conj ? "~" : ""}${targetSym}${f.mult ? `[${f.mult}]` : ""}${f.subsets.length ? ` :> ${f.subsets.join(", ")}` : ""}${f.redefines.length ? ` :>> ${f.redefines.join(", ")}` : ""}${f.ordered ? " ordered" : ""}${f.nonunique ? " nonunique" : ""}`; break;
    case "satisfy": head = `satisfy ${targetSym}`; break;
    case "allocate": head = f.ownerFirst ? `allocate ${ownerSym} to ${targetSym}` : `allocate ${targetSym} to ${ownerSym}`; break;
    case "perform": head = `perform action ${f.name} : ${targetSym}`; break;
    case "include": head = `include use case ${f.name} : ${targetSym}`; break;
    case "extend": head = `use case ${f.name} : ${targetSym}[0..1]`; break;
    case "refines": head = f.ownerFirst ? `#refinement dependency from ${ownerSym} to ${targetSym}` : `#refinement dependency from ${targetSym} to ${ownerSym}`; break;
    case "derivedFrom": {                                                                      // native: the connection is named, its two ends carry the roles (D-0045)
      const [orig, der] = f.ownerFirst ? [targetSym, ownerSym] : [ownerSym, targetSym];
      return `#derivation connection ${f.name || "derive_" + orig.replace(/[^A-Za-z0-9_]/g, "_")} {\n${pad}    end #original ::> ${orig};\n${pad}    end #derive ::> ${der};\n${pad}}`;
    }
    default: head = f.ownerFirst ? `dependency from ${ownerSym} to ${targetSym}` : `dependency from ${targetSym} to ${ownerSym}`;
  }
  const dep = f.rel === "trace" || f.rel === "dependsOn" ? ` // ${f.depKind || f.rel}` : "";
  const inner = [...(f.doc.trim() ? [edDocComment(f.doc, pad + "    ")] : []), ...f.attrs.map((a) => attrLine(a, pad + "    "))];
  if (!inner.length) return `${head};${dep}`;
  return `${head} {\n${inner.map((l) => `${pad}    ${l}`).join("\n")}\n${pad}}${dep}`;
}

/* ---- plans ---------------------------------------------------------------------------------------------- */
function withMember(ix: ModelIndex, files: Map<string, string>, ref: EdgeRef, fn: (block: string, mem: EdMem, all: EdMem[], pad: string, defStart: number) => string | null): { owner: Note; text: string; after: string } | { problem: string } {
  const owner = ix.notes.get(ref.owner), text = files.get(ref.owner);
  if (!owner?.def || text === undefined) return { problem: "The note that holds this relationship is not loaded." };
  const r = edWithBlock(owner, text, (block) => {
    const at = edFindDef(block, owner.def!.keyword, owner.def!.name);
    if (!at || !at.open) return null;
    const mems = edMembers(block, at.term + 1, at.close);
    const mem = mems.find((m) => m.head === ref.key);
    if (!mem) return null;
    const line = block.lastIndexOf("\n", mem.start) + 1, pad = /^[ \t]*/.exec(block.slice(line, mem.start + 1))![0];
    return fn(block, mem, mems, pad, at.term);
  });
  return "problem" in r ? { problem: r.problem.startsWith("Could not find") ? "That relationship is no longer in the note. Refresh and try again." : r.problem } : { owner, text, after: r.text };
}

/** Removes the relationship (and any properties written inside it). */
export function planRemoveRelationship(ix: ModelIndex, files: Map<string, string>, ref: EdgeRef): EditPlan {
  const info = edRelInfo(ix, ref);
  if (!info) return relBad("That relationship is no longer in the note. Refresh and try again.");
  const owner = ix.notes.get(ref.owner)!, text = files.get(ref.owner)!;
  const label = `${owner.title}: ${ref.kind === "member" ? ref.key : ref.kind + " " + ref.key}`;
  if (ref.kind === "specializes" || ref.kind === "verify") {
    const r = edWithBlock(owner, text, (block) => {
      const at = edFindDef(block, owner.def!.keyword, owner.def!.name);
      if (!at) return null;
      if (ref.kind === "specializes") {
        const rest = block.slice(at.nameEnd, at.headEnd), list = (/:>\s*([^{;]*)$/.exec(rest)?.[1] ?? "").split(",").map((x) => x.trim()).filter(Boolean).filter((x) => x !== ref.key);
        const cut = rest.search(/\s*:>/);
        return block.slice(0, at.nameEnd + (cut < 0 ? 0 : cut)) + (list.length ? ` :> ${list.join(", ")}` : "") + (at.open ? " " : "") + block.slice(at.headEnd);
      }
      if (!at.open) return null;
      const mems = edMembers(block, at.term + 1, at.close), obj = mems.find((m) => /^objective\b/.test(m.head) && m.body !== null);
      if (!obj) return null;
      const inner = edMembers(block, obj.bodyStart, obj.bodyStart + obj.body!.length), mine = inner.find((m) => new RegExp(`^verify\\s+(?:requirement\\s+)?${ref.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`).test(m.head));
      if (!mine) return null;
      if (inner.length === 1) { const [a, b] = edLineRange(block, obj); return block.slice(0, a) + block.slice(b); }
      const [a, b] = edLineRange(block, mine);
      return block.slice(0, a) + block.slice(b);
    });
    return "problem" in r ? relBad(r.problem) : { summary: `Remove ${label}.`, writes: [{ path: ref.owner, before: text, after: r.text }], problems: [] };
  }
  const r = withMember(ix, files, ref, (block, mem) => { const [a, b] = edLineRange(block, mem); return block.slice(0, a) + block.slice(b); });
  return "problem" in r ? relBad(r.problem) : { summary: `Remove ${label}.`, writes: [{ path: ref.owner, before: text, after: r.after }], problems: [] };
}

/** Writes a changed form back over the member. */
export function planUpdateRelationship(ix: ModelIndex, files: Map<string, string>, ref: EdgeRef, form: RelForm): EditPlan {
  const info = edRelInfo(ix, ref);
  if (!info) return relBad("That relationship is no longer in the note. Refresh and try again.");
  if (info.why) return relBad(info.why);
  if (info.form.depKind === "trace") return relBad("Existing trace dependencies are historical. Keep them readable, or remove/reclassify manually after semantic review (D-0073).");
  if (form.depKind === "trace" && info.form.depKind !== "trace") return relBad("Cannot retag a relationship as an unresolved trace; use flagLink review evidence (D-0073).");
  const owner = info.owner, rel = info.rel;
  if (!rel) return relBad("This kind of relationship is not edited here.");
  const target = ix.notes.get(form.target);
  if (!target?.def) return relBad("Pick a target that is a note with a SysML definition.");
  if (!rel.to(target, owner) && target.path !== info.form.target) return relBad(`"${target.title}" is not an eligible target of "${rel.label}".`);
  const kindOk = ED_DEP_KINDS.includes(info.form.rel) ? ED_DEP_KINDS.includes(form.depKind) : true;
  if (!kindOk) return relBad("Unknown dependency kind.");
  const f: RelForm = { ...info.form, ...form, rel: ED_DEP_KINDS.includes(info.form.rel) ? form.depKind : info.form.rel };
  if (info.form.rel === "owns" && !edUsageKinds(target).includes(f.usageKind)) { f.usageKind = edUsageKinds(target)[0] ?? f.usageKind; if (f.usageKind !== "item") f.dir = ""; }
  const props = edPropsFor(info.form.rel, f.usageKind);
  if (props.options.includes("name") && f.name !== info.form.name) {
    if (!ATTR_NAME.test(f.name)) return relBad(`"${f.name}" is not a SysML name (letters, digits, underscore; not starting with a digit).`);
    if (owner.def!.usages.some((u) => u.name === f.name) || Object.keys(owner.def!.notes).includes(f.name)) return relBad(`"${f.name}" is already used in this definition.`);
    const block0 = MDSE.extractSysml(files.get(owner.path)!) as string;
    if (info.form.name && new RegExp(`\\b${info.form.name}\\b`).test(block0.replace(ref.key, ""))) return relBad(`"${info.form.name}" is referred to elsewhere in the block; rename it in the note.`);
  }
  if (f.mult && !/^(\d+|\*)(\.\.(\d+|\*))?$/.test(f.mult)) return relBad(`Quantity "${f.mult}" is not like 3 or 0..1 or 1..*.`);
  if (f.mult === "1") f.mult = "";
  if (f.dir && !["in", "out", "inout"].includes(f.dir)) return relBad("Direction must be in, out or inout.");
  const seen = new Set<string>();
  for (const a of f.attrs) {
    if (!ATTR_NAME.test(a.name) || edIdent(a.name) === "") return relBad(`Attribute name "${a.name}" is not a SysML name.`);
    if (["doc", "ordered", "nonunique", "name"].includes(a.name)) return relBad(`"${a.name}" is a built-in option; choose it from the list instead of typing it.`);
    if (seen.has(a.name)) return relBad(`Attribute "${a.name}" appears twice.`);
    seen.add(a.name);
  }
  if (f.attrs.length && !props.custom) return relBad("This relationship does not take extra attributes.");
  if (!props.options.includes("doc") && f.doc.trim()) return relBad("This relationship does not take a description.");
  const sym = target.def.symbol, ownerSym = owner.def!.symbol;
  if (ref.kind === "specializes" || ref.kind === "verify") {
    if (target.path === info.form.target) return relBad("Nothing to change.");
    const text = files.get(owner.path)!;
    const r = edWithBlock(owner, text, (block) => {
      if (ref.kind === "verify") return block.replace(new RegExp(`(verify\\s+(?:requirement\\s+)?)${ref.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`), `$1${sym}`);
      const at = edFindDef(block, owner.def!.keyword, owner.def!.name);
      if (!at) return null;
      const head = block.slice(at.nameEnd, at.headEnd).replace(new RegExp(`(:>[^{;]*?)\\b${ref.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`), `$1${sym}`);
      return block.slice(0, at.nameEnd) + head + block.slice(at.headEnd);
    });
    return "problem" in r ? relBad(r.problem) : { summary: `${owner.title}: ${ref.kind} ${ref.key} → ${sym}`, writes: [{ path: owner.path, before: text, after: r.text }], problems: [] };
  }
  const text = files.get(owner.path)!;
  const r = withMember(ix, files, ref, (block, mem, _all, pad) => {
    const next = edRenderMember(f, ownerSym, sym, pad);
    if (block.slice(mem.start, mem.end) === next) return block;
    return block.slice(0, mem.start) + next + block.slice(mem.end);
  });
  if ("problem" in r) return relBad(r.problem);
  return { summary: `${owner.title}: changed ${ref.key}`, writes: [{ path: owner.path, before: text, after: r.after }], problems: [] };
}
