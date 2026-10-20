/* Edit plans (D-0030): adding an element and adding a relationship. Pure functions: each takes the index and the person's
 * choices and returns an EditPlan (the files to write, with before and after text). Nothing is written here; the Obsidian
 * shell shows the preview and applies the plan (WKB-006). SysML-defined content goes only into the `## SysML v2` block
 * (D-0003); a new note gets uid, id, status and the SysML block, nothing else. */
import MDSE from "../../core/src/mdse_core.js";
import type { ModelIndex, Note } from "./index.ts";

export interface EditWrite { path: string; /** null = a new file */ before: string | null; after: string; /** the file is deleted (merge); `before` is what it held, so the undo can bring it back */ remove?: boolean }
export interface EditPlan { summary: string; writes: EditWrite[]; problems: string[] }
export interface EdClass { prefix: string; subtype: string[]; prefixBySubtype?: Record<string, string> }
export type EdClasses = Record<string, EdClass>;

const bad = (problem: string): EditPlan => ({ summary: "", writes: [], problems: [problem] });

/* ---- identifiers --------------------------------------------------------------------------------------------- */
const ED_KEYWORDS = new Set("about abstract accept action actor after alias all allocate allocation analysis and as assert assign assume at attribute bind binding by calc case comment concern connect connection constraint decide def default defined dependency derived do doc else end entry enum event exhibit exit expose false filter first flow for fork frame from if import in include individual inout interface join language merge message meta metadata nonunique not null objective occurrence of or ordered out package parallel part perform port private protected public redefines ref references render rendering rep require requirement return satisfy send snapshot specializes stakeholder state subject subsets succession then timeslice to transition true until use variant variation verification verify via view viewpoint when while xor".split(" "));
export function edIdent(raw: string, fallback = "Unnamed"): string {
  let s = raw.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").filter(Boolean).map((w) => w[0]!.toUpperCase() + w.slice(1)).join("");
  if (!s) s = fallback;
  if (/^[0-9]/.test(s)) s = "_" + s;
  return ED_KEYWORDS.has(s) ? s + "_" : s;
}
export const edUsageIdent = (raw: string, fallback = "item"): string => { const s = edIdent(raw, fallback); const l = s[0]!.toLowerCase() + s.slice(1); return ED_KEYWORDS.has(l) ? l + "_" : l; };
export function edFileName(raw: string): string {
  const s = raw.replace(/\r?\n/g, " ").replace(/\//g, "-").replace(/:/g, " -").replace(/[?*]/g, "").replace(/"/g, "''").replace(/[<>|\\]/g, "-").replace(/\[/g, "(").replace(/\]/g, ")").replace(/#/g, "no.").replace(/\^/g, "")
    .replace(/\s+/g, " ").trim().replace(/[. ]+$/, "");
  return s.length > 150 ? s.slice(0, 150).trim() : s;
}
/** `author: <code>` from .vault.yaml; "" when not set yet. */
export function edAuthor(vaultYaml: string): string { const a = /^author:\s*(\S+)/m.exec(vaultYaml)?.[1] ?? ""; return a === "UNINITIALIZED" || a.length !== 13 ? "" : a; }
/** yyyyMMddHHmmssSSS in LOCAL time (MOD-004) plus the 13-character author code; a repeat moves forward one millisecond. */
export function edUid(author: string, now: Date, taken: Set<string>): string {
  const p = (n: number, w = 2): string => String(n).padStart(w, "0");
  let t = now.getTime();
  for (;;) {
    const d = new Date(t), uid = `${p(d.getFullYear(), 4)}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${p(d.getMilliseconds(), 3)}${author}`;
    if (!taken.has(uid)) return uid;
    t++;
  }
}
/** Prefix plus the highest existing number plus one (MOD-007). */
export function edNextId(ix: ModelIndex, prefix: string): string {
  let max = 0;
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  for (const id of ix.byId.keys()) { const m = re.exec(id); if (m) max = Math.max(max, Number(m[1])); }
  return `${prefix}-${String(max + 1).padStart(5, "0")}`;
}

/* ---- element kinds ------------------------------------------------------------------------------------------- */
/** SysML definition keyword written for a new note of this class; null = the class has no SysML form (plain note). */
export function edKeyword(type: string, subtype: string): string | null {
  switch (type) {
    case "Object": return subtype === "interface" ? "interface def" : "part def";
    case "Actor": return "part def";
    case "Behavior": return "action def";
    case "Condition": return "state def";
    case "Requirement": return "requirement def";
    case "Use Case": return "use case def";
    case "Verification": return "verification def";
    case "Item Flow": return "item def";
    default: return null;
  }
}
/** Classes a person may add, with their subtypes (modelCheck is importer-only). */
export function edElementKinds(classes: EdClasses): Array<{ type: string; subtypes: string[]; keyword: string | null }> {
  return Object.keys(classes).filter((t) => t !== "modelCheck").sort().map((type) => ({ type, subtypes: classes[type]!.subtype, keyword: edKeyword(type, classes[type]!.subtype[0] ?? "") }));
}

export interface AddElement { type: string; subtype: string; title: string; folder: string; /** requirement wording or a short description */ text?: string; author: string; now?: Date }
export function planAddElement(ix: ModelIndex, classes: EdClasses, o: AddElement): EditPlan {
  const cls = classes[o.type];
  if (!cls) return bad(`Unknown class "${o.type}".`);
  if (cls.subtype.length && !cls.subtype.includes(o.subtype)) return bad(`"${o.subtype}" is not a subtype of ${o.type}.`);
  const title = o.title.replace(/\s+/g, " ").trim();
  if (!title) return bad("A name is required.");
  if (!o.author) return bad("No author code yet: set `author:` in .vault.yaml (the importer fills it on its first run).");
  const base = edFileName(title);
  if (!base) return bad("The name has no usable characters.");
  const folder = o.folder.replace(/^\/+|\/+$/g, "");
  const taken = new Set([...ix.notes.keys()].map((p) => p.toLowerCase())), names = new Set([...ix.notes.values()].map((n) => n.name.toLowerCase()));
  let name = base, n = 1;
  while (names.has(name.toLowerCase()) || taken.has(((folder ? folder + "/" : "") + name + ".md").toLowerCase())) { n++; name = `${base}~${n}`; }
  const path = (folder ? folder + "/" : "") + name + ".md";
  const prefix = cls.prefixBySubtype?.[o.subtype] ?? cls.prefix, id = edNextId(ix, prefix);
  const uid = edUid(o.author, o.now ?? new Date(), new Set([...ix.notes.values()].map((x) => x.uid)));
  const kw = edKeyword(o.type, o.subtype), pkg = id.replace(/-/g, "_"), ident = edIdent(title, "Unnamed"), text = (o.text ?? "").replace(/\r\n/g, "\n").trim();
  const fm = [`type: ${o.type}`, `subtype:${o.subtype ? " " + o.subtype : ""}`, `id: ${id}`, `uid: ${uid}`, "status: Draft", "tags: []"];
  if (kw) fm.push("sourceRole: authoritative-model", `primarySymbol: ${pkg}::${ident}`);
  let out = `---\n${fm.join("\n")}\n---\n# ${title}\n`;
  if (text && !(kw === "requirement def")) out += `\n${text}\n`;                                          // a requirement's wording lives in its doc (IMP-097)
  if (kw) {
    const doc = kw === "requirement def" && text ? `        doc /* ${text.replace(/\*\//g, "* /").split("\n").join("\n           ")} */\n` : "";
    const def = doc ? `    ${kw} ${ident} {\n${doc}    }` : `    ${kw} ${ident};`;
    out += `\n\n\n${MDSE.renderSysmlSection(`package ${pkg} {\n${def}\n}\n`)}`;
  }
  return { summary: `Add ${o.type}${o.subtype ? "/" + o.subtype : ""} "${title}" (${id}) as ${path}.`, writes: [{ path, before: null, after: out }], problems: [] };
}

/* ---- locating a definition in the block ------------------------------------------------------------------- */
/** Index just past the `}` that closes the brace at `open`, skipping comments and strings; -1 when unbalanced. */
export function edCloseOf(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const c = s[i]!;
    if (c === "/" && s[i + 1] === "*") { const e = s.indexOf("*/", i + 2); if (e < 0) return -1; i = e + 1; continue; }
    if (c === "/" && s[i + 1] === "/") { const e = s.indexOf("\n", i); if (e < 0) return -1; i = e; continue; }
    if (c === '"') { const e = s.indexOf('"', i + 1); if (e < 0) return -1; i = e; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return i + 1; }
  }
  return -1;
}
export interface DefSpot { indent: string; headEnd: number; nameEnd: number; term: number; open: boolean; close: number }
export function edFindDef(block: string, keyword: string, name: string): DefSpot | null {
  const re = new RegExp(`(^|\\n)([ \\t]*)((?:abstract\\s+)?${keyword.replace(/ /g, "\\s+")}\\s+)(${name})\\b([^{;\\n]*)([{;])`);
  const m = re.exec(block);
  if (!m) return null;
  const term = m.index + m[0]!.length - 1, nameEnd = m.index + m[1]!.length + m[2]!.length + m[3]!.length + m[4]!.length;
  if (m[6] === ";") return { indent: m[2]!, headEnd: term, nameEnd, term, open: false, close: -1 };
  const close = edCloseOf(block, term);
  return close < 0 ? null : { indent: m[2]!, headEnd: term, nameEnd, term, open: true, close: close - 1 };
}

/** Appends one member statement inside the definition (turning `kw Name;` into `kw Name { … }`). */
export function edInsert(block: string, d: NonNullable<Note["def"]>, stmt: string): string | null {
  const at = edFindDef(block, d.keyword, d.name);
  if (!at) return null;
  const pad = at.indent + "    ";
  if (!at.open) return block.slice(0, at.term) + ` {\n${pad}${stmt}\n${at.indent}}` + block.slice(at.term + 1);
  const before = block.slice(0, at.close).replace(/[ \t]*$/, "");
  return before + (before.endsWith("\n") ? "" : "\n") + `${pad}${stmt}\n${at.indent}` + block.slice(at.close);
}

export function edWithBlock(note: Note, text: string, fn: (block: string) => string | null): { text: string } | { problem: string } {
  const block = MDSE.extractSysml(text) as string | null;
  if (!block || !note.def) return { problem: `"${note.title}" has no SysML block to edit.` };
  const next = fn(block);
  if (next === null) return { problem: `Could not find "${note.def.keyword} ${note.def.name}" in the SysML block of "${note.title}".` };
  if (next === block) return { problem: "Nothing to change: the block already says this." };
  return { text: MDSE.replaceSysmlBlock(text, next) };
}

/* ---- relationships ---------------------------------------------------------------------------------------- */
export interface EdRel {
  id: string; label: string; help: string;
  from: (n: Note) => boolean; to: (n: Note, from: Note) => boolean;
  /** which extra inputs the form shows */
  inputs: Array<"usageKind" | "name" | "mult" | "dir" | "guard">;
}
const kw = (n: Note): string => n.def?.keyword ?? "";
const anyDef = (n: Note): boolean => !!n.def;
const USAGE_FOR_TARGET: Record<string, string[]> = { "part def": ["part"], "port def": ["port"], "interface def": ["port"], "item def": ["item"], "action def": ["action"], "state def": ["state"] };
const OWNS: Record<string, string[]> = { "part def": ["part def", "port def", "interface def", "item def"], "action def": ["action def", "item def"], "state def": ["state def"] };

export const ED_RELS: EdRel[] = [
  { id: "owns", label: "has part / port / action / state / item (typed by)", help: "An owned usage inside this definition, typed by the target: `part cell : Cell[4];`.",
    from: (n) => !!OWNS[kw(n)], to: (n, f) => !!n.def && (OWNS[kw(f)] ?? []).includes(kw(n)), inputs: ["name", "mult", "dir"] },
  { id: "satisfy", label: "satisfies requirement", help: "`satisfy <requirement>;` inside a part, action or state definition.",
    from: (n) => ["part def", "action def", "state def"].includes(kw(n)), to: (n) => kw(n) === "requirement def", inputs: [] },
  { id: "verify", label: "verifies requirement", help: "`objective { verify <requirement>; }` inside a verification definition.",
    from: (n) => kw(n) === "verification def", to: (n) => kw(n) === "requirement def", inputs: [] },
  { id: "allocate", label: "allocated to", help: "`allocate <this> to <target>;` (for example a function to a part).",
    from: anyDef, to: (n, f) => !!n.def && n.path !== f.path, inputs: [] },
  { id: "perform", label: "performs action", help: "`perform action <name> : <action>;` inside a part definition.",
    from: (n) => kw(n) === "part def", to: (n) => kw(n) === "action def", inputs: ["name"] },
  { id: "derivedFrom", label: "derived from", help: "`dependency from <this> to <target>; // derivedFrom` between two requirements.",
    from: (n) => kw(n) === "requirement def", to: (n, f) => kw(n) === "requirement def" && n.path !== f.path, inputs: [] },
  { id: "refines", label: "refines", help: "`dependency … // refines`: this adds precision to the target.",
    from: anyDef, to: (n, f) => !!n.def && n.path !== f.path, inputs: [] },
  { id: "trace", label: "traces to", help: "`dependency … // trace`: related, relationship not chosen yet.",
    from: anyDef, to: (n, f) => !!n.def && n.path !== f.path, inputs: [] },
  { id: "dependsOn", label: "depends on", help: "`dependency … // dependsOn`.",
    from: anyDef, to: (n, f) => !!n.def && n.path !== f.path, inputs: [] },
  { id: "specializes", label: "specializes", help: "Adds the target to this definition's `:>` list. Same kind of definition only.",
    from: anyDef, to: (n, f) => kw(n) === kw(f) && n.path !== f.path && !f.def!.specializes.includes(n.def!.symbol), inputs: [] },
  { id: "include", label: "includes use case", help: "`include use case <name> : <use case>;`",
    from: (n) => kw(n) === "use case def", to: (n, f) => kw(n) === "use case def" && n.path !== f.path, inputs: ["name"] },
  { id: "extend", label: "is extended by use case", help: "Writes an optional use case `[0..1]` typed by the extension into this (base) use case.",
    from: (n) => kw(n) === "use case def", to: (n, f) => kw(n) === "use case def" && n.path !== f.path, inputs: ["name"] },
];
export const edRelsFor = (from: Note): EdRel[] => ED_RELS.filter((r) => r.from(from));
export const edTargets = (ix: ModelIndex, rel: EdRel, from: Note): Note[] => [...ix.notes.values()].filter((n) => n.path !== from.path && rel.to(n, from));
/** Usage kinds a target allows for the `owns` relationship. */
export const edUsageKinds = (target: Note): string[] => USAGE_FOR_TARGET[kw(target)] ?? [];

export interface AddRelationship { rel: string; from: string; to: string; name?: string; mult?: string; usageKind?: string; dir?: string }
export function planAddRelationship(ix: ModelIndex, files: Map<string, string>, o: AddRelationship): EditPlan {
  const rel = ED_RELS.find((r) => r.id === o.rel), from = ix.notes.get(o.from), to = ix.notes.get(o.to);
  if (!rel) return bad(`Unknown relationship "${o.rel}".`);
  if (!from || !to) return bad("Both notes must be in the vault.");
  if (!rel.from(from)) return bad(`A ${from.type}${from.subtype ? "/" + from.subtype : ""} (${kw(from) || "no SysML block"}) cannot be the source of "${rel.label}".`);
  if (!rel.to(to, from)) return bad(`"${to.title}" is not an eligible target of "${rel.label}" from "${from.title}".`);
  const text = files.get(from.path);
  if (text === undefined) return bad("The source note is not loaded.");
  const A = from.def!, B = to.def!;
  const used = new Set<string>([...A.usages.map((u) => u.name), ...Object.keys(A.notes)]);
  const uniq = (want: string): string => { let n = 1, nm = want; while (used.has(nm)) { n++; nm = `${want}${n}`; } return nm; };
  const dupKind: Record<string, string> = { perform: "perform", include: "include", extend: "optionalUseCase" };
  if (dupKind[rel.id] && A.stmts.some((x) => x.kind === dupKind[rel.id] && x.b === B.symbol)) return bad("Nothing to change: that relationship is already written.");
  let stmt = "";
  let headEdit: ((block: string) => string | null) | null = null;
  switch (rel.id) {
    case "owns": {
      const kinds = edUsageKinds(to), kind = o.usageKind && kinds.includes(o.usageKind) ? o.usageKind : kinds[0];
      if (!kind) return bad("No usage kind fits that target.");
      const mult = (o.mult ?? "").trim();
      if (mult && !/^\[?(\d+|\*)(\.\.(\d+|\*))?\]?$/.test(mult)) return bad(`Multiplicity "${mult}" is not like 3 or 0..1 or 1..*.`);
      const m = mult && mult !== "1" ? `[${mult.replace(/^\[|\]$/g, "")}]` : "";
      const dir = kind === "item" && o.dir && ["in", "out", "inout"].includes(o.dir) ? o.dir + " " : "";
      stmt = `${dir}${kind} ${uniq(edUsageIdent(o.name?.trim() || to.title, kind))} : ${B.symbol}${m};`; break;
    }
    case "satisfy": stmt = `satisfy ${B.symbol};`; break;
    case "allocate": stmt = `allocate ${A.symbol} to ${B.symbol};`; break;
    case "perform": stmt = `perform action ${uniq(edUsageIdent(o.name?.trim() || to.title, "action"))} : ${B.symbol};`; break;
    case "derivedFrom": case "refines": case "trace": case "dependsOn": stmt = `dependency from ${A.symbol} to ${B.symbol}; // ${rel.id}`; break;
    case "include": stmt = `include use case ${uniq(edUsageIdent(o.name?.trim() || to.title, "include"))} : ${B.symbol};`; break;
    case "extend": stmt = `use case ${uniq(edUsageIdent(o.name?.trim() || to.title, "extension"))} : ${B.symbol}[0..1];`; break;
    case "verify": {
      if (A.stmts.some((x) => x.kind === "verify" && x.a === B.symbol)) return bad("Nothing to change: it already verifies that requirement.");
      headEdit = (block) => {
        const at = edFindDef(block, A.keyword, A.name);
        if (!at) return null;
        if (at.open) {
          const body = block.slice(at.term, at.close + 1), om = /\bobjective\s*\{/.exec(body);
          if (om) {
            const oc = edCloseOf(body, om.index + om[0].length - 1);
            if (oc > 0) { const p = at.term + body.slice(0, oc - 1).replace(/\s*$/, "").length; return block.slice(0, p) + ` verify ${B.symbol};` + block.slice(p); }
          }
        }
        return edInsert(block, A, `objective { verify ${B.symbol}; }`);
      };
      break;
    }
    case "specializes": {
      headEdit = (block) => {
        const at = edFindDef(block, A.keyword, A.name);
        if (!at) return null;
        const rest = block.slice(at.nameEnd, at.headEnd);
        if (/:>/.test(rest)) return block.slice(0, at.headEnd).replace(/\s*$/, "") + `, ${B.symbol}` + (at.open ? " " : "") + block.slice(at.headEnd);
        return block.slice(0, at.nameEnd) + ` :> ${B.symbol}` + block.slice(at.nameEnd);
      };
      break;
    }
  }
  const r = edWithBlock(from, text, headEdit ?? ((block) => {
    if (block.includes(stmt)) return block;                                            // already there: reported as "nothing to change"
    return edInsert(block, A, stmt);
  }));
  if ("problem" in r) return bad(r.problem);
  return { summary: `${from.title} — ${rel.label} — ${to.title}`, writes: [{ path: from.path, before: text, after: r.text }], problems: [] };
}

/** Sets the wording of a requirement: replaces its own doc comment, or adds one. Helper docs deeper in the block are left alone. */
export function planSetRequirementText(ix: ModelIndex, files: Map<string, string>, path: string, wording: string): EditPlan {
  const n = ix.notes.get(path), text = files.get(path);
  if (!n || text === undefined || !n.def) return bad("That note has no SysML block.");
  if (n.def.keyword !== "requirement def") return bad("Only a requirement definition carries requirement text.");
  const t = wording.replace(/\r\n/g, "\n").trim();
  if (!t) return bad("The requirement text is empty.");
  const doc = `doc /* ${t.replace(/\*\//g, "* /").split("\n").join("\n           ")} */`;
  const r = edWithBlock(n, text, (block) => {
    const at = edFindDef(block, n.def!.keyword, n.def!.name);
    if (!at) return null;
    if (!at.open) return edInsert(block, n.def!, doc);
    let depth = 0;
    for (let i = at.term; i < at.close; i++) {
      const c = block[i]!;
      if (c === "/" && block[i + 1] === "*") {
        const e = block.indexOf("*/", i + 2);
        if (depth === 1 && /\bdoc\s*$/.test(block.slice(Math.max(0, i - 12), i))) { const ds = block.lastIndexOf("doc", i); return block.slice(0, ds) + doc + block.slice(e + 2); }
        i = e + 1; continue;
      }
      if (c === "/" && block[i + 1] === "/") { i = block.indexOf("\n", i); continue; }
      if (c === "{") depth++; else if (c === "}") depth--;
    }
    return edInsert(block, n.def!, doc);
  });
  if ("problem" in r) return bad(r.problem);
  return { summary: `Set the text of "${n.title}".`, writes: [{ path, before: text, after: r.text }], problems: [] };
}

/** Lines that differ, for the preview: common leading and trailing lines are dropped. */
export function edDiff(before: string | null, after: string): { removed: string[]; added: string[] } {
  if (before === null) return { removed: [], added: after.split("\n") };
  const a = before.split("\n"), b = after.split("\n");
  let s = 0; while (s < a.length && s < b.length && a[s] === b[s]) s++;
  let ea = a.length, eb = b.length; while (ea > s && eb > s && a[ea - 1] === b[eb - 1]) { ea--; eb--; }
  return { removed: a.slice(s, ea), added: b.slice(s, eb) };
}
