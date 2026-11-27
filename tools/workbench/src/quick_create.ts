/* Contextual "New" choices for the four Workbench workflows.
 * A governed record uses the existing planAddElement() writer and its ID/UID/SysML checks.
 * An ordinary document is deliberately plain Markdown: never assign model identity implicitly. */
export type QuickArea = "document" | "define" | "structure" | "verify";
export interface QuickTemplate {
  id: string; label: string; area: QuickArea; kind: "plain" | "governed";
  type?: string; subtype?: string; sections?: readonly string[];
}
/** Exact types/subtypes from governance/schemas/element-types.yaml (do not invent model classes). */
export const QUICK_TEMPLATES: readonly QuickTemplate[] = [
  { id: "daily", label: "Daily note", area: "document", kind: "plain", sections: ["Priorities", "Activity", "Follow-up"] },
  { id: "meeting", label: "Meeting note", area: "document", kind: "plain", sections: ["Participants", "Agenda", "Discussion", "Decisions", "Actions"] },
  { id: "transcript", label: "Transcript", area: "document", kind: "plain", sections: ["Source", "Transcript", "Summary"] },
  { id: "engineering-note", label: "Engineering note", area: "document", kind: "plain", sections: ["Context", "Findings", "References"] },
  { id: "governed-document", label: "Governed document", area: "document", kind: "governed", type: "Document", subtype: "" },
  { id: "stakeholder-need", label: "Stakeholder need", area: "define", kind: "governed", type: "Requirement", subtype: "stakeholder" },
  { id: "use-case", label: "Use case", area: "define", kind: "governed", type: "Use Case", subtype: "what" },
  { id: "requirement", label: "Requirement", area: "define", kind: "governed", type: "Requirement", subtype: "functional" },
  { id: "function", label: "Function", area: "define", kind: "governed", type: "Behavior", subtype: "function" },
  { id: "design", label: "Design", area: "define", kind: "governed", type: "Condition", subtype: "design" },
  { id: "state", label: "State", area: "define", kind: "governed", type: "Condition", subtype: "state" },
  { id: "part", label: "Part / assembly definition", area: "structure", kind: "governed", type: "Object", subtype: "part" },
  { id: "part-replacement", label: "Replace selected part (copy definition)", area: "structure", kind: "governed", type: "Object", subtype: "part" },
  { id: "part-obsolete", label: "Mark selected part obsolete", area: "structure", kind: "governed", type: "Object", subtype: "part" },
  { id: "part-current", label: "Mark selected part current", area: "structure", kind: "governed", type: "Object", subtype: "part" },
  { id: "interface", label: "Interface definition", area: "structure", kind: "governed", type: "Object", subtype: "interface" },
  { id: "configuration-procedure", label: "Configuration procedure", area: "structure", kind: "governed", type: "Procedure", subtype: "configuration" },
  { id: "verify-requirement", label: "Requirement", area: "verify", kind: "governed", type: "Requirement", subtype: "functional" },
  { id: "verification-case", label: "Verification case (test)", area: "verify", kind: "governed", type: "Verification", subtype: "test" },
  { id: "test-plan", label: "Test plan", area: "verify", kind: "governed", type: "Plan", subtype: "" },
  { id: "test-procedure", label: "Test procedure", area: "verify", kind: "governed", type: "Procedure", subtype: "test" },
  { id: "test-result", label: "Test result record", area: "verify", kind: "governed", type: "Result", subtype: "" },
];
export function quickTemplatesFor(area: QuickArea): QuickTemplate[] {
  return QUICK_TEMPLATES.filter((t) => t.area === area);
}
export function quickTemplate(id: string): QuickTemplate | undefined { return QUICK_TEMPLATES.find((t) => t.id === id); }
export interface PlainNotePlan { summary: string; writes: Array<{ path: string; before: null; after: string }>; problems: string[] }
const invalid = (message: string): PlainNotePlan => ({ summary: "", writes: [], problems: [message] });
export function planPlainNote(template: QuickTemplate, title: string, folder: string, existing: ReadonlySet<string>): PlainNotePlan {
  if (template.kind !== "plain") return invalid("A governed model note must use the governed element writer.");
  const name = title.trim().replace(/\s+/g, " ");
  if (!name || name === "." || name === ".." || /[\\/:*?"<>|\[\]#^]/.test(name)) return invalid("Enter a file-safe note title without path separators or reserved characters.");
  const parent = folder.trim().replace(/^\/+|\/+$/g, "");
  if (parent && parent.split("/").some((p) => p === "." || p === ".." || !p || /[\\:*?"<>|\[\]#^]/.test(p))) return invalid("Choose a vault folder, not a relative or invalid path.");
  const path = (parent ? parent + "/" : "") + name + ".md";
  if ([...existing].some((p) => p.toLowerCase() === path.toLowerCase())) return invalid("A note already exists at " + path + ".");
  const after = "# " + name + "\n\n" + (template.sections ?? []).map((x) => "## " + x + "\n\n").join("");
  return { summary: 'Create ordinary Markdown note "' + name + '" at ' + path + " (no SysML or governed UID).",
    writes: [{ path, before: null, after }], problems: [] };
}

/** Eligible context relationships are proposals only; nothing is written until a second
 * explicit preview + Apply. Both native directions are considered because SysML relationship
 * ownership and endpoint order depend on the two modeled definitions. */
import type { ModelIndex } from "./index.ts";
import { cdChoices } from "./canvas_draw.ts";
export interface ContextLinkChoice { rel: string; label: string; from: string; to: string; help: string; inputs: readonly string[]; usageKind: string }
export function contextLinkChoices(ix: ModelIndex, files: Map<string, string>, origin: string, created: string): ContextLinkChoice[] {
  if (!origin || !created || origin === created || !ix.notes.has(origin) || !ix.notes.has(created)) return [];
  const out: ContextLinkChoice[] = [];
  for (const [from, to] of [[origin, created], [created, origin]] as Array<[string, string]>) {
    for (const choice of cdChoices(ix, files, from, to)) {
      if (!choice.ok) continue;
      out.push({ rel: choice.rel.id, label: choice.rel.label, from, to,
        help: choice.rel.help, inputs: choice.rel.inputs, usageKind: choice.usageKind });
    }
  }
  return out;
}

/** Evaluate a *proposed*, not-yet-written governed note against the selected existing note.
 * Parse only the source and hypothetical target into a two-note index. This avoids rescanning
 * a vault with tens of thousands of notes on every modal Preview. Neither the cached index nor
 * the vault file map is mutated. Eligibility is re-evaluated after creation.
 * No relationship is automatically attached or stored in the proposed note. */
import { buildIndex } from "./index.ts";
export interface PreviewContextLinkResult { choices: ContextLinkChoice[]; message: string; createdPath: string | null }
export function previewContextLinks(ix: ModelIndex, files: Map<string, string>, origin: string,
  plan: { writes: Array<{ path: string; before: string | null; after: string }>; problems: string[] }): PreviewContextLinkResult {
  const none = (message: string): PreviewContextLinkResult => ({ choices: [], message, createdPath: null });
  if (plan.problems.length || plan.writes.length !== 1 || plan.writes[0]!.before !== null)
    return none("Preview a valid new governed element before checking relationships.");
  if (!origin || !ix.notes.has(origin) || !files.has(origin))
    return none("No governed source element selected. This new note will remain independent.");
  const candidate = plan.writes[0]!;
  if (files.has(candidate.path)) return none("The proposed note already exists. Preview again.");
  const simulated = new Map<string, string>([
    [origin, files.get(origin)!], [candidate.path, candidate.after],
  ]);
  const stagedIndex = buildIndex(simulated);
  if (!stagedIndex.notes.has(candidate.path) || !stagedIndex.notes.get(candidate.path)?.def)
    return none("The proposed note has no native SysML definition to relate.");
  const choices = contextLinkChoices(stagedIndex, simulated, origin, candidate.path);
  const priority: Record<string, number> = { verify: 0, satisfy: 1, derivedFrom: 2, perform: 3,
    owns: 4, specializes: 5, include: 6, extend: 7, allocate: 8, refines: 9, dependsOn: 10 };
  choices.sort((a, b) => (priority[a.rel] ?? 50) - (priority[b.rel] ?? 50) ||
    a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.rel.localeCompare(b.rel));
  return { choices, createdPath: candidate.path, message: choices.length
    ? "Potential native relationships (not saved). Choose Create, then separately review and Apply a relationship."
    : "No native SysML relationship is currently eligible. You can create the note independently." };
}


/* Part replacement is engineering change, not a SysML generalization or an automatic BOM edit.
 * Keeping the old and new part definitions distinct preserves as-built configuration history.
 * partLifecycle is separate from note review status (Draft/Approved/Retired). */
import MDSE from "../../core/src/mdse_core.js";
import { planAddElement, edFindDef, type EdClasses } from "./edit.ts";
export type PartLifecycle = "proposed" | "current" | "obsolete";
export const partLifecycle = (n: { type: string; subtype: string; status: string; meta: Record<string, unknown> }): PartLifecycle => {
  if (String(n.meta.partLifecycle ?? "").toLowerCase() === "obsolete" || n.status === "Retired" || n.meta.mergedInto) return "obsolete";
  if (String(n.meta.partLifecycle ?? "").toLowerCase() === "proposed") return "proposed";
  return "current"; // legacy parts without an explicit lifecycle remain visible by default
};
export const isPartNote = (n: { type: string; subtype: string; def?: { keyword: string } | null }): boolean =>
  n.type === "Object" && (n.subtype === "part" || n.def?.keyword === "part def");
const qcYamlScalar = (s: string): string => JSON.stringify(s);
const qcReplaceFm = (text: string, key: string, value: string): string => {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!fm) throw new Error("The governed note has no YAML frontmatter.");
  const re = new RegExp("^" + key + ":[^\\r\\n]*$", "m");
  const current = fm[1]!;
  const next = re.test(current) ? current.replace(re, key + ": " + value) : current + "\n" + key + ": " + value;
  return text.replace(fm[0], "---\n" + next + "\n---");
};
export interface PartReplaceOptions { title: string; folder: string; change: string; partNumber?: string; author: string; now?: Date }
/** Preview-first clone: new identity and SysML namespace, copied engineering definition,
 * explicit native dependency tagged supersedes, unchanged predecessor. */
export function planReplacePart(ix: ModelIndex, files: Map<string, string>, classes: EdClasses,
  sourcePath: string, o: PartReplaceOptions): { summary: string; writes: Array<{ path: string; before: string | null; after: string }>; problems: string[] } {
  const bad = (why: string) => ({ summary: "", writes: [], problems: [why] });
  const source = ix.notes.get(sourcePath), original = files.get(sourcePath);
  if (!source || !isPartNote(source) || !original || source.def?.keyword !== "part def")
    return bad("Select a governed Object/part containing a native SysML part definition.");
  if (partLifecycle(source) === "obsolete") return bad("Select a current or proposed source part; obsolete parts require an explicit exception.");
  if (!o.change.trim()) return bad("Document what is changing before previewing the replacement.");
  const partNumber = (o.partNumber ?? "").trim();
  if (partNumber && (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(partNumber) ||
    [...ix.notes.values()].some((n) => String(n.meta.partNumber ?? "").toLowerCase() === partNumber.toLowerCase())))
    return bad("A new part number must be file-safe and not already assigned to another modeled part.");
  const plan = planAddElement(ix, classes, { type: source.type, subtype: source.subtype, title: o.title,
    folder: o.folder || source.folder, text: "", author: o.author, now: o.now });
  if (plan.problems.length || !plan.writes.length) return plan;
  const record = plan.writes[0]!;
  const oldBlock = MDSE.extractSysml(original) as string | null;
  const newBlock = MDSE.extractSysml(record.after) as string | null;
  const oldSpot = oldBlock && edFindDef(oldBlock, source.def.keyword, source.def.name);
  const newName = /part def\s+([A-Za-z_]\w*)\s*;/.exec(newBlock ?? "")?.[1] ?? "";
  const newSpot = newBlock && edFindDef(newBlock, "part def", newName);
  if (!oldBlock || !newBlock || !oldSpot || !newSpot) return bad("Could not safely locate both native part definitions. No copy was made.");
  const oldStart = oldBlock.lastIndexOf("\n", oldSpot.nameEnd) + 1;
  const oldEnd = oldSpot.open ? oldSpot.close + 1 : oldSpot.term + 1;
  const oldDef = oldBlock.slice(oldStart, oldEnd);
  const clone = oldDef.replace(/\bpart\s+def\s+[A-Za-z_]\w*/, "part def " + newName);
  if (clone === oldDef && source.def.name !== newName) return bad("Could not rename the copied definition.");
  const newStart = newBlock.lastIndexOf("\n", newSpot.nameEnd) + 1;
  const newEnd = newSpot.open ? newSpot.close + 1 : newSpot.term + 1;
  const dependency = "dependency from " + record.after.match(/^primarySymbol:\s*(.+)$/m)![1] +
    " to " + source.def.symbol + "; // supersedes";
  // Place dependency INSIDE the part definition: the current scanner associates statements
  // with the containing definition, not with a package-level trailing statement.
  const closeAt = clone.lastIndexOf("}");
  const joined = oldSpot.open && closeAt >= 0
    ? clone.slice(0, closeAt).replace(/[ \t]*$/, "") + "\n        " + dependency + "\n    " + clone.slice(closeAt)
    : clone.replace(/;\s*$/, " {\n        " + dependency + "\n    }");
  let after = MDSE.replaceSysmlBlock(record.after, newBlock.slice(0, newStart) +
    joined + newBlock.slice(newEnd));
  if (partNumber) after = qcReplaceFm(after, "partNumber", qcYamlScalar(partNumber));
  after = qcReplaceFm(after, "partLifecycle", "proposed");
  after = qcReplaceFm(after, "replaces", qcYamlScalar("[[" + sourcePath.replace(/\.md$/i, "") + "]]"));
  after = qcReplaceFm(after, "changeSummary", qcYamlScalar(o.change.trim()));
  record.after = after;
  plan.summary = "Create proposed replacement " + record.path + " from " + sourcePath +
    ". Definition copied with fresh ID/UID/symbol; the predecessor stays current and every BOM usage remains unchanged.";
  return plan;
}
/** Lifecycle update does not rewrite model status, replace part usages, or delete history. */
export function planPartLifecycle(ix: ModelIndex, files: Map<string, string>, path: string,
  next: "current" | "obsolete", replacement?: string): { summary: string; writes: Array<{ path: string; before: string | null; after: string }>; problems: string[] } {
  const bad = (why: string) => ({ summary: "", writes: [], problems: [why] });
  const n = ix.notes.get(path), before = files.get(path);
  if (!n || !isPartNote(n) || !before) return bad("Select a governed Object/part.");
  if (replacement && (!ix.notes.has(replacement) || !isPartNote(ix.notes.get(replacement)!)))
    return bad("The replacement must be an existing governed part.");
  if (replacement === path) return bad("A part cannot replace itself.");
  let after = qcReplaceFm(before, "partLifecycle", next);
  if (replacement && next === "obsolete") after = qcReplaceFm(after, "replacedBy", qcYamlScalar("[[" + replacement.replace(/\.md$/i, "") + "]]"));
  if (after === before) return bad("The part already has the requested lifecycle.");
  const whereUsed = ix.edges.filter((e) => e.to === path && e.kind === "hasPart" && !e.reverse);
  return { summary: "Set part " + n.title + " to " + next +
    (whereUsed.length ? ". ATTENTION: used by " + whereUsed.length + " modeled assemblies; their usage remains unchanged." : ".") +
    " No BOM is rewritten.", writes: [{ path, before, after }], problems: [] };
}
