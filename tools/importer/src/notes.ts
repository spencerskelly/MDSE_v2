/* Note text in the ADR-V2-06 layout: frontmatter, title, user zone, three blank lines, `## Source: EA`, `## SysML v2` last. */
import MDSE from "../../core/src/mdse_core.js";

export type FlagType = "flagImport" | "flagConflict" | "flagLink" | "flagNote";

export interface NoteModel {
  type: string;
  subtype: string;
  id: string;
  uid: string;
  eaType: string;
  title: string;
  sourceRole?: string;
  primarySymbol?: string;
  /** MDSE-only relationship fields, written after tags (MOD-028). Values are note file names. */
  relFields: Array<[string, string[]]>;
  bodyText: string;
  flags: string[];               // already rendered callouts
  sourceLines: string[];         // lines of `## Source: EA`
  sysml: string | null;
}

/** A value safe as a plain YAML scalar, quoted when it would not be. */
export function yamlScalar(s: string): string {
  if (s === "") return "";
  if (/^[A-Za-z0-9_][^\n#]*$/.test(s) && !/: /.test(s) && !/\s$/.test(s) && !/^(true|false|null|yes|no|~)$/i.test(s)) return s;
  return JSON.stringify(s);
}

export function flagCallout(type: FlagType, title: string, sourceLink: string, detail: string[]): string {
  return [`> [!${type}] ${title}`, `> Source: ${sourceLink}.${detail.length ? " " + detail[0] : ""}`, ...detail.slice(1).map((l) => `> ${l}`)].join("\n");
}

/** Keeps free text from breaking the note structure: no stray `## ` heading, no unbalanced fence. */
export function safeBody(text: string): string {
  return text.replace(/\r\n?/g, "\n").split("\n").map((l) => (/^##\s/.test(l) ? "\\" + l : /^\s*```/.test(l) ? l.replace("```", "\\```") : l)).join("\n").trim();
}

export function renderNote(n: NoteModel): string {
  const fm: string[] = [
    `type: ${yamlScalar(n.type)}`, `subtype:${n.subtype ? " " + yamlScalar(n.subtype) : ""}`, `id: ${n.id}`, `uid: ${n.uid}`, `status: Draft`,
    `eaType: ${yamlScalar(n.eaType)}`, `tags: []`,
  ];
  if (n.sourceRole) fm.push(`sourceRole: ${n.sourceRole}`);
  if (n.primarySymbol) fm.push(`primarySymbol: ${yamlScalar(n.primarySymbol)}`);
  for (const [k, v] of n.relFields) if (v.length) fm.push(`${k}: [${v.map((x) => JSON.stringify(`[[${x}]]`)).join(", ")}]`);
  const zone: string[] = [`# ${n.title.replace(/\n/g, " ")}`];
  const body = safeBody(n.bodyText);
  if (body) zone.push("", body);
  for (const f of n.flags) zone.push("", f);
  let out = `---\n${fm.join("\n")}\n---\n${zone.join("\n")}\n\n\n\n## Source: EA\n\n${n.sourceLines.join("\n")}\n`;
  if (n.sysml !== null) out += `\n${MDSE.renderSysmlSection(n.sysml)}`;
  return out;
}
