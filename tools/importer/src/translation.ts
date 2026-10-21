/* The translation table: how every EA family comes over, and every exception code the importer can write.
 * One source for the ledger's wording, the generated TRANSLATION.md and the tests that stop this table drifting from
 * governance/schemas/ea-family-mapping.json and from the code. Provisional until OD-01 / OD-03 close (D-0016). */
import type { FamilyMapping } from "./ea_mapping.ts";

export interface Rule { outcome: string; how: string; exceptions: string[] }

/** Elements, grouped by the mapping's native_kind or disposition. */
export const ELEMENT_RULES: Record<string, Rule> = {
  RequirementDefinition: { outcome: "Note, `requirement def`", how: "MDSE class Requirement. Subtype from the EA package path (standard, stakeholder, functional, design, else engineering). EA note text becomes the note body.", exceptions: ["SUBTYPE_DEFAULTED_ENGINEERING"] },
  ActionDefinition: { outcome: "Note, `action def`", how: "MDSE class Behavior (function when the stereotype ends in Function, else activity).", exceptions: [] },
  UseCaseDefinition: { outcome: "Note, `use case def`", how: "MDSE class Use Case, subtype what.", exceptions: ["SUBTYPE_DEFAULTED_WHAT"] },
  StateDefinition: { outcome: "Note, `state def`", how: "MDSE class Condition, subtype state.", exceptions: [] },
  PartDefinition: { outcome: "Note, `part def`", how: "MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor.", exceptions: ["SUBTYPE_DEFAULTED_PART", "REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW", "REVIEW:CONTEXT_KIND_EVIDENCE"] },
  InterfaceDefinition: { outcome: "Note, `port def` (IMP-104)", how: "MDSE class Object, subtype interface. An EA interface Class is what ports are typed by, so it is written as a port definition (V1 W-120); it owns the flow items declared inside it.", exceptions: [] },
  PortDefinition: { outcome: "Note, `port def`", how: "MDSE class Object, subtype interface. Owns the flow items declared inside it.", exceptions: ["REVIEW:OWNING_PORT_USAGE_REVIEW"] },
  ItemDefinition: { outcome: "Note, `item def`", how: "MDSE class Item Flow (material when the stereotype says physical, else information). This is the type a flow carries.", exceptions: [] },
  AttributeDefinition: { outcome: "Note, `attribute def`", how: "MDSE class Item Flow, subtype information.", exceptions: [] },
  VerificationCaseDefinition: { outcome: "Note, `verification def`", how: "MDSE class Verification, subtype test.", exceptions: [] },
  ConstraintDefinition: { outcome: "Note, `constraint def`", how: "MDSE class Info.", exceptions: [] },
  OccurrenceDefinition: { outcome: "Note, `occurrence def`", how: "MDSE class modelCheck, subtype Event.", exceptions: [] },
  PartUsage: { outcome: "`part` usage inside the owning definition's block", how: "Owner is the parent definition. Typed by PDATA1, a GUID (IMP-105). Multiplicity from the EA Multiplicity field, `1` omitted. Inside an action or state definition a Part that points at another action or state is that action or state used there (IMP-107).", exceptions: ["USAGE_WITHOUT_NOTE_OWNER", "USAGE_OWNER_KIND_MISMATCH", "UNRESOLVED_PART_TYPE", "MULTIPLICITY_UNPARSED"] },
  PortUsage: { outcome: "`port` usage inside the owning definition's block", how: "Typed by PDATA1 (the EA interface Class, a port definition). A Port under a Part is the Part's block's own port: merged by PDATA3, else by a unique same name, else added to the block with a review flag (IMP-106). Connectors between such ports connect through the Parts.", exceptions: ["USAGE_WITHOUT_NOTE_OWNER", "USAGE_OWNER_KIND_MISMATCH", "UNRESOLVED_PORT_TYPE", "MERGED_INTO_BLOCK_PORT", "PORT_ADDED_TO_BLOCK"] },
  ActionUsage: { outcome: "`action` usage inside the owning action def", how: "Typed by the EA Classifier when it is an action definition.", exceptions: ["USAGE_WITHOUT_NOTE_OWNER", "USAGE_OWNER_KIND_MISMATCH", "UNRESOLVED_ACTION_TYPE"] },
  StateUsage: { outcome: "`state` usage inside the owning state def", how: "Untyped.", exceptions: ["USAGE_WITHOUT_NOTE_OWNER", "USAGE_OWNER_KIND_MISMATCH"] },
  ItemUsage: { outcome: "`in` / `out` / `inout` `item` usage inside a port def", how: "FlowProperty. Owner is the port definition (directly, or through the port usage it sits under). Direction comes from the EA tag `direction`. Typed by PDATA1 (a Signal item def).", exceptions: ["DIRECTION_EVIDENCE_MISSING", "FLOW_OWNER_NOT_PORT_DEF", "UNRESOLVED_FLOW_TYPE"] },
  Synchronization: { outcome: "`fork` or `join` usage in the owning action def", how: "Fork when more than one control flow leaves it and at most one enters; join for the reverse. Control flows then connect to it like to an action.", exceptions: ["FORK_JOIN_AMBIGUOUS", "USAGE_WITHOUT_NOTE_OWNER", "USAGE_OWNER_KIND_MISMATCH"] },
  Trigger: { outcome: "`- Trigger:` line in the owning state def's Source section", how: "A trigger is recorded on the state definition it sits in. It is not wired to a particular transition (the EA data does not say which); the StateFlow name carries the trigger text.", exceptions: ["TRIGGER_RECORDED_ON_OWNER", "LEGAL_TRANSITION_CONTEXT"] },
  conditional_review: { outcome: "Review row; no note", how: "Fork/join and trigger nodes are not translated until the evidence named in the diagnostic exists.", exceptions: ["FORK_JOIN_CONTROL_FLOW_EVIDENCE", "LEGAL_TRANSITION_CONTEXT"] },
  mdse_note: { outcome: "Note, no SysML block", how: "Info (Note, Text, InformationItem), Issue, or modelCheck (Change, Decision). Text stays in the body.", exceptions: [] },
  folder_only: { outcome: "Folder", how: "Package becomes a folder; root packages named in the run options are left out of the path.", exceptions: [] },
  attachment_link: { outcome: "Artifact note + file in `Attachments/`", how: "Content is read from t_document (ElementID = the element GUID). Images are embedded in the note body. A file already in the vault is never overwritten. Files over 25 MB are skipped.", exceptions: ["ATTACHMENT_BYTES_NOT_FOUND", "ATTACHMENT_TOO_LARGE"] },
  reference_only: { outcome: "Ledger row only", how: "No note. The row is kept as evidence.", exceptions: ["REFERENCE_ONLY"] },
  aggregate_boundary_note: { outcome: "One shared note `Boundaries`", how: "Every Boundary is a line in one aggregate note.", exceptions: ["BOUNDARY_GROUPED"] },
};

/** Relationships, per family. The mapping file's `approved_direction` is the contract; this says what the code does today. */
export const RELATIONSHIP_RULES: Record<string, Rule> = {
  Generalization: { outcome: "`:>` on the specific definition", how: "Both ends must be the same kind of definition.", exceptions: ["GENERALIZATION_ENDPOINT_KIND"] },
  Aggregation: { outcome: "Owned `part` usage in the whole", how: "Whole is the end marked composite or shared; both must be part defs. A part usage already owned by the whole and typed by the same part wins, and the aggregation becomes alias_merged.", exceptions: ["USAGE_WINS", "AGGREGATION_BOTH_ENDS_AGGREGATE", "AGGREGATION_WHOLE_NOT_EVIDENCED", "AGGREGATION_ENDPOINT_KIND"] },
  "Dependency:satisfy": { outcome: "`satisfy` in the satisfier's block", how: "One end a requirement def; the other a part, action or state def. Direction is normalized.", exceptions: ["SATISFY_ENDPOINT_KIND"] },
  "Dependency:verify": { outcome: "`objective { verify }` in the verification def", how: "One end a verification def, the other a requirement def.", exceptions: ["VERIFY_ENDPOINT_KIND"] },
  "Abstraction:allocate": { outcome: "`allocate A to B` in A's block", how: "Both ends definitions.", exceptions: ["ALLOCATE_ENDPOINT_KIND"] },
  "Usage:Responsibility": { outcome: "`allocate A to B` in A's block", how: "Same as allocate.", exceptions: ["ALLOCATE_ENDPOINT_KIND"] },
  Realisation: { outcome: "`perform` (part to action), `allocate` (part to requirement or part to part)", how: "By endpoint kind; any other pair is a review row.", exceptions: ["REALISATION_ENDPOINT_KIND"] },
  "Realisation:deriveReqt": { outcome: "`dependency from a to b; // derivedFrom`", how: "Requirement to requirement only. Provisional until the derivation form is chosen.", exceptions: ["DERIVE_ENDPOINT_KIND"] },
  "Dependency:deriveReqt": { outcome: "`dependency from a to b; // derivedFrom`", how: "Requirement to requirement only.", exceptions: ["DERIVE_ENDPOINT_KIND"] },
  "Dependency:RecoveryRequirement": { outcome: "`dependency from a to b; // derivedFrom`", how: "Requirement to requirement only.", exceptions: ["DERIVE_ENDPOINT_KIND"] },
  "Abstraction:Derive": { outcome: "`dependency from a to b; // derivedFrom`", how: "Requirement to requirement only.", exceptions: ["DERIVE_ENDPOINT_KIND"] },
  "Dependency:refine": { outcome: "`dependency from a to b; // refines`", how: "Both ends definitions. The kind is carried by the trailing comment until a metadata form is chosen.", exceptions: ["DEPENDENCY_ENDPOINT_KIND"] },
  "Abstraction:Refine": { outcome: "`dependency from a to b; // refines`", how: "Same as refine.", exceptions: ["DEPENDENCY_ENDPOINT_KIND"] },
  "Dependency:trace": { outcome: "`dependency from a to b; // trace`", how: "Both ends definitions.", exceptions: ["DEPENDENCY_ENDPOINT_KIND"] },
  "Abstraction:trace": { outcome: "`dependency from a to b; // trace`", how: "Both ends definitions.", exceptions: ["DEPENDENCY_ENDPOINT_KIND"] },
  Dependency: { outcome: "`dependency from a to b; // dependsOn`", how: "Both ends definitions.", exceptions: ["DEPENDENCY_ENDPOINT_KIND"] },
  Usage: { outcome: "`dependency from a to b; // uses`", how: "Both ends definitions. Stronger evidence (allocate, satisfy) is not inferred.", exceptions: ["DEPENDENCY_ENDPOINT_KIND"] },
  Association: { outcome: "Review row", how: "Connectivity cannot be proven from an association. No ConnectionUsage is written.", exceptions: ["ASSOCIATION_CONNECTIVITY_NOT_PROVEN"] },
  Connector: { outcome: "`connect a to b` (same owner) or `connect partA.port to partB.port` (in the owning assembly)", how: "Port-to-port only. For ports on different definitions, the one part def that owns exactly one part usage of each end's type holds the connection.", exceptions: ["PORT_CONNECTION_NEEDS_COMMON_OWNER", "PORT_CONNECTION_AMBIGUOUS_OWNER", "CONNECTOR_ENDPOINT_NOT_PORT"] },
  ControlFlow: { outcome: "`succession first a then b` in the owning action def", how: "Both ends action, fork or join usages with the same owner. Guards stay in the Source section.", exceptions: ["FLOW_ENDPOINT_NOT_USAGE", "FLOW_DIFFERENT_OWNERS"] },
  StateFlow: { outcome: "`transition first a then b` in the owning state def", how: "Both ends state usages with the same owner. Trigger, guard and effect stay in the Source section.", exceptions: ["FLOW_ENDPOINT_NOT_USAGE", "FLOW_DIFFERENT_OWNERS"] },
  "UseCase:include": { outcome: "`include use case` in the including use case", how: "Both ends use case defs.", exceptions: ["INCLUDE_ENDPOINT_KIND"] },
  "UseCase:extend": { outcome: "Optional `use case x : Ext[0..1]` in the base use case", how: "Source is the extending case, destination the base. Both use case defs.", exceptions: ["EXTEND_ENDPOINT_KIND"] },
  Nesting: { outcome: "Evidence only", how: "Nesting is organizational. Ownership of usages comes from the parent id, not this connector.", exceptions: ["ORGANIZATIONAL_ONLY"] },
  NoteLink: { outcome: "`describes` YAML link on the Info note", how: "One end must be an Info note.", exceptions: ["NOTELINK_ENDPOINT_NOT_INFO_NOTE"] },
  Sequence: { outcome: "Ledger row only", how: "Reference only; diagrams are out of scope.", exceptions: ["REFERENCE_ONLY"] },
};

/** Every diagnostic code the importer can write, with what it means and what to do. Codes with a `:suffix` match by prefix. */
export const CODES: Record<string, { meaning: string; action: string }> = {
  UNKNOWN_FAMILY: { meaning: "Type/stereotype is not in the mapping file.", action: "Add the family to the mapping or confirm it is out of scope." },
  NO_CLASS_FOR_FAMILY: { meaning: "Family resolves but no MDSE class exists for it.", action: "Fix classify() or classes.json." },
  ATTACHMENT_BYTES_NOT_FOUND: { meaning: "No t_document content for this Artifact element.", action: "The Artifact note exists without a file; attach it in EA or the vault." },
  ATTACHMENT_TOO_LARGE: { meaning: "Attachment over 25 MB was not written.", action: "Add it to the vault by hand." },
  FORK_JOIN_AMBIGUOUS: { meaning: "Synchronization node is neither a fork nor a join by flow count.", action: "Check the control flows in EA." },
  TRIGGER_RECORDED_ON_OWNER: { meaning: "Trigger recorded as a line on its state def.", action: "None." },
  PORT_CONNECTION_AMBIGUOUS_OWNER: { meaning: "More than one assembly (or more than one part of a type) could hold this connection.", action: "Pick the owning assembly by hand." },
  EXTEND_ENDPOINT_KIND: { meaning: "extend needs two use case defs.", action: "Review the EA link." },
  REFERENCE_ONLY: { meaning: "Family is kept as evidence only.", action: "None." },
  BOUNDARY_GROUPED: { meaning: "Boundary is a line in the shared Boundaries note.", action: "None." },
  UNHANDLED_DISPOSITION: { meaning: "Mapping disposition the importer has no code for.", action: "Importer bug or new disposition; fix run.ts." },
  FORK_JOIN_CONTROL_FLOW_EVIDENCE: { meaning: "Fork/join nodes are not translated.", action: "Needs the flow evidence named in the mapping." },
  LEGAL_TRANSITION_CONTEXT: { meaning: "Trigger nodes are not translated.", action: "Needs a legal transition context." },
  CONDITIONAL_REVIEW: { meaning: "Conditional family without a named evidence code.", action: "Review." },
  DIRECTION_EVIDENCE_MISSING: { meaning: "Flow item has no usable `direction` tag (in, out, inout).", action: "Set the direction in EA or in the note." },
  FLOW_OWNER_NOT_PORT_DEF: { meaning: "Flow item is not inside a port definition.", action: "Move it under the port definition in EA." },
  UNRESOLVED_FLOW_TYPE: { meaning: "Flow item has no Signal/item definition to type it.", action: "Set the EA Classifier. Item is written untyped." },
  USAGE_WITHOUT_NOTE_OWNER: { meaning: "Usage's parent is not a definition note.", action: "Check the parent in EA." },
  USAGE_OWNER_KIND_MISMATCH: { meaning: "Usage kind does not fit its owner (e.g. a state in a part def).", action: "Check the parent in EA." },
  UNRESOLVED_PART_TYPE: { meaning: "Part usage has no resolvable block in PDATA1.", action: "Usage is written untyped with a flagLink." },
  UNRESOLVED_PORT_TYPE: { meaning: "Port has no interface/port definition as its PDATA1 type.", action: "Usage is written untyped with a flagLink." },
  MERGED_INTO_BLOCK_PORT: { meaning: "A Port under a Part is the same port as one on the Part's block.", action: "None; connectors use the block port." },
  PORT_ADDED_TO_BLOCK: { meaning: "A Port under a Part matched no port on its block (no PDATA3 target, no unique same name).", action: "Review the port added to the block." },
  UNRESOLVED_ACTION_TYPE: { meaning: "Action has no action definition as Classifier.", action: "Usage is written untyped with a flagLink." },
  MULTIPLICITY_UNPARSED: { meaning: "Multiplicity text is not a number or range.", action: "Fix the EA multiplicity; written without it." },
  ENDPOINT_MISSING_IN_SOURCE: { meaning: "Connector end points at an object that is not in t_object.", action: "Source model is inconsistent." },
  NOTELINK_ENDPOINT_NOT_INFO_NOTE: { meaning: "NoteLink does not touch an Info note.", action: "None; kept as evidence." },
  ORGANIZATIONAL_ONLY: { meaning: "Nesting connector carries no model meaning.", action: "None." },
  NATIVE_EMISSION_DISABLED: { meaning: "Run option turned native SysML off.", action: "Re-run with native emission on." },
  GENERALIZATION_ENDPOINT_KIND: { meaning: "Generalization ends are not the same kind of definition.", action: "Review the EA link." },
  USAGE_WINS: { meaning: "An owned part usage already covers this aggregation; aggregation merged into it.", action: "None." },
  AGGREGATION_BOTH_ENDS_AGGREGATE: { meaning: "Both ends are marked as the whole.", action: "Fix the EA aggregation kind." },
  AGGREGATION_WHOLE_NOT_EVIDENCED: { meaning: "Neither end is marked as the whole.", action: "Fix the EA aggregation kind." },
  AGGREGATION_ENDPOINT_KIND: { meaning: "Aggregation ends are not both part defs.", action: "Review the EA link." },
  SATISFY_ENDPOINT_KIND: { meaning: "satisfy needs a requirement on one end and a part, action or state def on the other.", action: "Review the EA link." },
  VERIFY_ENDPOINT_KIND: { meaning: "verify needs a verification def and a requirement def.", action: "Review the EA link." },
  ALLOCATE_ENDPOINT_KIND: { meaning: "allocate needs two definitions.", action: "Review the EA link." },
  REALISATION_ENDPOINT_KIND: { meaning: "Realisation pair has no perform/allocate reading.", action: "Review the EA link." },
  DERIVE_ENDPOINT_KIND: { meaning: "Derivation needs two requirement defs.", action: "Review the EA link." },
  DEPENDENCY_ENDPOINT_KIND: { meaning: "Dependency needs two definition notes.", action: "Review the EA link." },
  ASSOCIATION_CONNECTIVITY_NOT_PROVEN: { meaning: "An association is not evidence of a connection.", action: "Model the connection as a Connector between ports if it is one." },
  PORT_CONNECTION_NEEDS_COMMON_OWNER: { meaning: "Ports belong to different definitions and no assembly owns a part of each.", action: "Add the assembly or make the connection by hand." },
  CONNECTOR_ENDPOINT_NOT_PORT: { meaning: "Connector end is not a port usage.", action: "Review the EA link." },
  FLOW_ENDPOINT_NOT_USAGE: { meaning: "Flow end is not an action/state usage the importer wrote.", action: "Control nodes and unwritten usages cannot be linked." },
  FLOW_DIFFERENT_OWNERS: { meaning: "Flow ends sit in different owners.", action: "A succession/transition must stay inside one owner." },
  INCLUDE_ENDPOINT_KIND: { meaning: "include needs two use case defs.", action: "Review the EA link." },
  NATIVE_EMISSION_NOT_IMPLEMENTED: { meaning: "Relationship family with no translation code.", action: "Importer gap; see TRANSLATION.md." },
  EXCEPTION: { meaning: "The importer threw while handling this row. See Error Log.", action: "Fix the importer; the row was skipped, not lost." },
  NO_DISPOSITION: { meaning: "A source row ended the run with no outcome.", action: "Importer bug." },
  SUBTYPE_DEFAULTED_ENGINEERING: { meaning: "Requirement subtype not evidenced by package path.", action: "Review subtype." },
  SUBTYPE_DEFAULTED_WHAT: { meaning: "Use case subtype defaulted.", action: "Review subtype." },
  SUBTYPE_DEFAULTED_PART: { meaning: "Object subtype defaulted to part.", action: "Review subtype." },
  AUTHOR_FALLBACK: { meaning: "EA author blank or unusable; fallback code used.", action: "Map the author." },
  AUTHOR_DERIVED: { meaning: "Author code derived from the EA name.", action: "Register the person." },
  UID_TIME_FALLBACK: { meaning: "EA created time missing; fallback time used.", action: "None." },
  UID_COLLISION_SHIFTED: { meaning: "uid collided and was shifted by a millisecond.", action: "None." },
  REVIEW: { meaning: "Conditional evidence named by the mapping was not checked.", action: "Review per the code after the colon." },
  UNVERIFIED_SYNTAX: { meaning: "Statement written in SysML form not yet confirmed by the parser gate.", action: "Run the parser gate; fix the form if it rejects it." },
};
export const codeBase = (c: string): string => c.split(":")[0]!.replace(/_TARGET_IS$/, "");

/** The dependency-like relationships side by side. They differ in meaning and direction, so each has its own entry. Direction is as drawn in EA: source is where the statement is written. */
export const DEPENDENCY_KINDS: Array<{ kind: string; families: string[]; written: string; direction: string; ends: string; meaning: string }> = [
  { kind: "derivedFrom", families: ["Realisation:deriveReqt", "Dependency:deriveReqt", "Dependency:RecoveryRequirement", "Abstraction:Derive"], written: "`dependency from new to informing; // derivedFrom`", direction: "From the new (derived) requirement to the informing requirement. Written in the new note.", ends: "requirement def to requirement def", meaning: "The new requirement exists because of the informing one." },
  { kind: "refines", families: ["Dependency:refine", "Abstraction:Refine"], written: "`dependency from refining to refined; // refines`", direction: "From the refining element to the refined one. Written in the refining note.", ends: "any two definitions", meaning: "Adds precision to the target; the target stays valid on its own." },
  { kind: "trace", families: ["Dependency:trace", "Abstraction:trace"], written: "`dependency from a to b; // trace`", direction: "As drawn. Written in the source note.", ends: "any two definitions", meaning: "A related-to link with no stronger meaning." },
  { kind: "dependsOn", families: ["Dependency"], written: "`dependency from client to supplier; // dependsOn`", direction: "From the dependent (client) to what it depends on (supplier).", ends: "any two definitions", meaning: "A change to the supplier can break the client." },
  { kind: "uses", families: ["Usage"], written: "`dependency from user to used; // uses`", direction: "From the user to the used element.", ends: "any two definitions", meaning: "Generic use. Stronger evidence (allocate, satisfy) is not inferred from it." },
  { kind: "allocate", families: ["Abstraction:allocate", "Usage:Responsibility"], written: "`allocate A to B;`", direction: "From the allocated element to where it is allocated. Written in the source note.", ends: "any two definitions", meaning: "A real SysML allocation, not a dependency." },
  { kind: "satisfy", families: ["Dependency:satisfy"], written: "`satisfy Req;`", direction: "Written in the satisfier; direction is normalized so the requirement is the target.", ends: "requirement def with part, action or state def", meaning: "A real SysML satisfy, not a dependency." },
  { kind: "verify", families: ["Dependency:verify"], written: "`objective { verify Req; }`", direction: "Written in the verification def; direction normalized.", ends: "verification def with requirement def", meaning: "A real SysML verify, not a dependency." },
  { kind: "realises", families: ["Realisation"], written: "`perform action x : A;` or `allocate`", direction: "From the realising part to the action, requirement or part.", ends: "part def to action, requirement or part def", meaning: "By endpoint kind; other pairs are review rows." },
];

/** Rule for an element entry. */
export function elementRule(e: { family?: string; disposition: string; native_kind: string | null }): Rule | null {
  if (e.family && ELEMENT_RULES[e.family]) return ELEMENT_RULES[e.family]!;
  if (e.native_kind && ELEMENT_RULES[e.native_kind]) return ELEMENT_RULES[e.native_kind]!;
  return ELEMENT_RULES[e.disposition] ?? null;
}

/** Generated document. Never edited by hand; `npm run build:importer` rewrites it, CI checks it is current. */
export function renderTranslationDoc(m: FamilyMapping): string {
  const out: string[] = ["# Translation table", "", "Generated from `governance/schemas/ea-family-mapping.json` and `src/translation.ts`. Do not edit. Provisional until OD-01 and OD-03 close (D-0016).", "",
    "Every EA row ends in the Ledger with one disposition: `native`, `alias_merged`, `evidence_only`, `deferred_review`, `excluded_by_policy` or `error`. A family not listed below is `deferred_review` with `UNKNOWN_FAMILY`.", "",
    "## Elements", "", "| EA family | Mapping disposition | Becomes | How | Exceptions |", "|---|---|---|---|---|"];
  for (const e of m.elements) { const r = elementRule(e); out.push(`| \`${e.family}\` | ${e.disposition} | ${r?.outcome ?? "**NO RULE**"} | ${r?.how ?? ""} | ${(r?.exceptions ?? []).map((x) => "`" + x + "`").join(", ")} |`); }
  out.push("", "## Relationships", "", "| EA family | Mapping disposition | Becomes | How | Exceptions |", "|---|---|---|---|---|");
  for (const e of m.relationships) { const r = RELATIONSHIP_RULES[e.family]; out.push(`| \`${e.family}\` | ${e.disposition} | ${r?.outcome ?? "**NO RULE**"} | ${r?.how ?? ""} | ${(r?.exceptions ?? []).map((x) => "`" + x + "`").join(", ")} |`); }
  out.push("", "## Dependency kinds", "", "These look alike in EA but mean different things. Each keeps its own kind in the model text and in the Source section.", "", "| Kind | EA families | Written as | Direction | Ends | Meaning |", "|---|---|---|---|---|---|");
  for (const d of DEPENDENCY_KINDS) out.push(`| ${d.kind} | ${d.families.map((f) => "`" + f + "`").join(", ")} | ${d.written} | ${d.direction} | ${d.ends} | ${d.meaning} |`);
  out.push("", "Statements marked `UNVERIFIED_SYNTAX` in the ledger (satisfy, verify, allocate, perform, dependency, include, succession, transition, connect, item) are written in the SysML v2 form we expect; the parser gate decides.", "", "## Exception codes", "", "| Code | Meaning | What to do |", "|---|---|---|");
  for (const [k, v] of Object.entries(CODES)) out.push(`| \`${k}\` | ${v.meaning} | ${v.action} |`);
  return out.join("\n") + "\n";
}
