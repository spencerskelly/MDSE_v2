/* SysML v2 text for one note: a standalone `package` holding one definition and the usages it owns (MOD-122, MOD-123).
 * Only constructs the approved family mapping allows are written. Anything else is a flagLink, never guessed (IMP-060). */

export interface UsageDecl {
  kind: "part" | "port" | "action" | "state";
  name: string;
  /** Qualified symbol of the definition this usage is typed by; absent = untyped (allowed with a review flag, IMP-089). */
  typeSymbol?: string;
  /** Already formatted, for example "[3]" or "[0..1]". */
  mult?: string;
}

export interface DefDecl {
  keyword: string;               // "part def", "requirement def", ...
  pkg: string;                   // package name, derived from the note id (stable across renames)
  name: string;                  // definition identifier
  specializes: string[];         // qualified symbols after :>
  usages: UsageDecl[];
  doc?: string;
}

/** Source multiplicity text -> "[n]" / "[a..b]"; null when it is not a plain multiplicity. "1" is the default and is omitted. */
export function parseMultiplicity(raw: string): { text: string | null; ok: boolean } {
  const s = raw.trim();
  if (!s) return { text: null, ok: true };
  const m = /^(\d+|\*)(?:\s*\.\.\s*(\d+|\*))?$/.exec(s);
  if (!m) return { text: null, ok: false };
  if (!m[2] && m[1] === "1") return { text: null, ok: true };
  return { text: m[2] ? `[${m[1]}..${m[2]}]` : `[${m[1]}]`, ok: true };
}

const docComment = (t: string): string => t.replace(/\r\n/g, "\n").replace(/\*\//g, "* /").trim();

export function renderBlock(d: DefDecl): string {
  const head = `${d.keyword} ${d.name}` + (d.specializes.length ? ` :> ${d.specializes.join(", ")}` : "");
  const body: string[] = [];
  for (const u of d.usages) body.push(`        ${u.kind} ${u.name}${u.typeSymbol ? ` : ${u.typeSymbol}` : ""}${u.mult ?? ""};`);
  if (d.doc && d.doc.trim()) body.push(`        doc /* ${docComment(d.doc).split("\n").join("\n           ")} */`);
  const def = body.length ? `    ${head} {\n${body.map((l) => l.slice(0)).join("\n")}\n    }` : `    ${head};`;
  return `package ${d.pkg} {\n${def}\n}\n`;
}

/** Every `Pkg::Name` reference in a block, for the assembled-model reference check. */
export function referencedSymbols(sysml: string): string[] {
  const src = sysml.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  return [...src.matchAll(/\b([A-Za-z_]\w*::[A-Za-z_]\w*)\b/g)].map((m) => m[1]!);
}
