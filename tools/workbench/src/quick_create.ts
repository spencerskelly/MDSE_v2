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
  { id: "part", label: "Part / assembly definition", area: "structure", kind: "governed", type: "Object", subtype: "part" },
  { id: "interface", label: "Interface definition", area: "structure", kind: "governed", type: "Object", subtype: "interface" },
  { id: "configuration-procedure", label: "Configuration procedure", area: "structure", kind: "governed", type: "Procedure", subtype: "configuration" },
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
  if (parent.split("/").some((p) => p === "." || p === ".." || !p || /[\\:*?"<>|\[\]#^]/.test(p))) return invalid("Choose a vault folder, not a relative or invalid path.");
  const path = (parent ? parent + "/" : "") + name + ".md";
  if ([...existing].some((p) => p.toLowerCase() === path.toLowerCase())) return invalid("A note already exists at " + path + ".");
  const after = "# " + name + "\n\n" + (template.sections ?? []).map((x) => "## " + x + "\n\n").join("");
  return { summary: 'Create ordinary Markdown note "' + name + '" at ' + path + " (no SysML or governed UID).",
    writes: [{ path, before: null, after }], problems: [] };
}
