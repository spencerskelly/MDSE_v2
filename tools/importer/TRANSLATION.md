# Translation table

Generated from `governance/schemas/ea-family-mapping.json` and `src/translation.ts`. Do not edit. Provisional until OD-01 and OD-03 close (D-0016).

Every EA row ends in the Ledger with one disposition: `native`, `alias_merged`, `evidence_only`, `deferred_review`, `excluded_by_policy` or `error`. A family not listed below is `deferred_review` with `UNKNOWN_FAMILY`.

## Elements

| EA family | Mapping disposition | Becomes | How | Exceptions |
|---|---|---|---|---|
| `Requirement` | native_candidate | Note, `requirement def` | MDSE class Requirement. Subtype from the EA package path (standard, stakeholder, functional, design, else engineering). EA note text becomes the note body. | `SUBTYPE_DEFAULTED_ENGINEERING` |
| `Requirement:requirement` | native_candidate | Note, `requirement def` | MDSE class Requirement. Subtype from the EA package path (standard, stakeholder, functional, design, else engineering). EA note text becomes the note body. | `SUBTYPE_DEFAULTED_ENGINEERING` |
| `Requirement:designConstraint` | native_candidate | Note, `requirement def` | MDSE class Requirement. Subtype from the EA package path (standard, stakeholder, functional, design, else engineering). EA note text becomes the note body. | `SUBTYPE_DEFAULTED_ENGINEERING` |
| `Requirement:functionalRequirement` | native_candidate | Note, `requirement def` | MDSE class Requirement. Subtype from the EA package path (standard, stakeholder, functional, design, else engineering). EA note text becomes the note body. | `SUBTYPE_DEFAULTED_ENGINEERING` |
| `Requirement:extendedRequirement` | native_candidate | Note, `requirement def` | MDSE class Requirement. Subtype from the EA package path (standard, stakeholder, functional, design, else engineering). EA note text becomes the note body. | `SUBTYPE_DEFAULTED_ENGINEERING` |
| `Requirement:Functional` | native_candidate | Note, `requirement def` | MDSE class Requirement. Subtype from the EA package path (standard, stakeholder, functional, design, else engineering). EA note text becomes the note body. | `SUBTYPE_DEFAULTED_ENGINEERING` |
| `Requirement:Webasto Requirement` | native_candidate | Note, `requirement def` | MDSE class Requirement. Subtype from the EA package path (standard, stakeholder, functional, design, else engineering). EA note text becomes the note body. | `SUBTYPE_DEFAULTED_ENGINEERING` |
| `Requirement:performanceRequirement` | native_candidate | Note, `requirement def` | MDSE class Requirement. Subtype from the EA package path (standard, stakeholder, functional, design, else engineering). EA note text becomes the note body. | `SUBTYPE_DEFAULTED_ENGINEERING` |
| `Activity` | native_candidate | Note, `action def` | MDSE class Behavior (function when the stereotype ends in Function, else activity). |  |
| `Activity:System Function` | native_candidate | Note, `action def` | MDSE class Behavior (function when the stereotype ends in Function, else activity). |  |
| `Activity:Hardware Function` | native_candidate | Note, `action def` | MDSE class Behavior (function when the stereotype ends in Function, else activity). |  |
| `Activity:Software Function` | native_candidate | Note, `action def` | MDSE class Behavior (function when the stereotype ends in Function, else activity). |  |
| `Activity:Module Function` | native_candidate | Note, `action def` | MDSE class Behavior (function when the stereotype ends in Function, else activity). |  |
| `UseCase` | native_candidate | Note, `use case def` | MDSE class Use Case, subtype what. | `SUBTYPE_DEFAULTED_WHAT` |
| `State` | native_candidate | Note, `state def` | MDSE class Condition, subtype state. |  |
| `State:System State` | native_candidate | Note, `state def` | MDSE class Condition, subtype state. |  |
| `Class:Hardware Component` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Class:Physical Component` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Class:block` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Class:Module` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Class:Software Component` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Class:Software Unit` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Class:Platform` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Class:Physical System Variant` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Class:Business Line` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Class` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Class:System Partner` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Actor` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Object` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Class:Electrical & Material Interface` | native_candidate | Note, `port def` (IMP-104) | MDSE class Object, subtype interface. An EA interface Class is what ports are typed by, so it is written as a port definition (V1 W-120); it owns the flow items declared inside it. |  |
| `Class:Data Interface` | native_candidate | Note, `port def` (IMP-104) | MDSE class Object, subtype interface. An EA interface Class is what ports are typed by, so it is written as a port definition (V1 W-120); it owns the flow items declared inside it. |  |
| `Class:Mechanical Interface` | native_candidate | Note, `port def` (IMP-104) | MDSE class Object, subtype interface. An EA interface Class is what ports are typed by, so it is written as a port definition (V1 W-120); it owns the flow items declared inside it. |  |
| `Class:Generic Physical Interface` | native_candidate | Note, `port def` | MDSE class Object, subtype interface. Owns the flow items declared inside it. | `REVIEW:OWNING_PORT_USAGE_REVIEW` |
| `Signal:Logical Signal` | native_candidate | Note, `item def` | MDSE class Item Flow (material when the stereotype says physical, else information). This is the type a flow carries. |  |
| `Signal:Physical Signal` | native_candidate | Note, `item def` | MDSE class Item Flow (material when the stereotype says physical, else information). This is the type a flow carries. |  |
| `Signal:Software Parameter` | native_candidate | Note, `attribute def` | MDSE class Item Flow, subtype information. |  |
| `Activity:testCase` | native_candidate | Note, `verification def` | MDSE class Verification, subtype test. |  |
| `Constraint` | native_candidate | Note, `constraint def` | MDSE class Info. |  |
| `Event` | native_candidate | Note, `occurrence def` | MDSE class modelCheck, subtype Event. |  |
| `Class:Physical Context` | native_candidate | Note, `part def` | MDSE class Object (software when the stereotype says so, else part). Actor becomes class Actor. | `SUBTYPE_DEFAULTED_PART`, `REVIEW:OBJECT_CLASSIFIER_SPECIALIZATION_REVIEW`, `REVIEW:CONTEXT_KIND_EVIDENCE` |
| `Action` | native_candidate | `action` usage inside the owning action def | Typed by the EA Classifier when it is an action definition. | `USAGE_WITHOUT_NOTE_OWNER`, `USAGE_OWNER_KIND_MISMATCH`, `UNRESOLVED_ACTION_TYPE` |
| `Part` | native_candidate | `part` usage inside the owning definition's block | Owner is the parent definition. Typed by PDATA1, a GUID (IMP-105). Multiplicity from the EA Multiplicity field, `1` omitted. Inside an action or state definition a Part that points at another action or state is that action or state used there (IMP-107). | `USAGE_WITHOUT_NOTE_OWNER`, `USAGE_OWNER_KIND_MISMATCH`, `UNRESOLVED_PART_TYPE`, `MULTIPLICITY_UNPARSED` |
| `Port` | native_candidate | `port` usage inside the owning definition's block | Typed by PDATA1 (the EA interface Class, a port definition). A Port under a Part is the Part's block's own port: merged by PDATA3, else by a unique same name, else added to the block with a review flag (IMP-106). Connectors between such ports connect through the Parts. | `USAGE_WITHOUT_NOTE_OWNER`, `USAGE_OWNER_KIND_MISMATCH`, `UNRESOLVED_PORT_TYPE`, `MERGED_INTO_BLOCK_PORT`, `PORT_ADDED_TO_BLOCK` |
| `Part:FlowProperty` | native_candidate | `in` / `out` / `inout` `item` usage inside a port def | FlowProperty. Owner is the port definition (directly, or through the port usage it sits under). Direction comes from the EA tag `direction`. Typed by PDATA1 (a Signal item def). | `DIRECTION_EVIDENCE_MISSING`, `FLOW_OWNER_NOT_PORT_DEF`, `UNRESOLVED_FLOW_TYPE` |
| `StateNode` | native_candidate | `state` usage inside the owning state def | Untyped. | `USAGE_WITHOUT_NOTE_OWNER`, `USAGE_OWNER_KIND_MISMATCH` |
| `Synchronization` | conditional_review | `fork` or `join` usage in the owning action def | Fork when more than one control flow leaves it and at most one enters; join for the reverse. Control flows then connect to it like to an action. | `FORK_JOIN_AMBIGUOUS`, `USAGE_WITHOUT_NOTE_OWNER`, `USAGE_OWNER_KIND_MISMATCH` |
| `Trigger` | conditional_review | `- Trigger:` line in the owning state def's Source section | A trigger is recorded on the state definition it sits in. It is not wired to a particular transition (the EA data does not say which); the StateFlow name carries the trigger text. | `TRIGGER_RECORDED_ON_OWNER`, `LEGAL_TRANSITION_CONTEXT` |
| `Package` | folder_only | Folder | Package becomes a folder; root packages named in the run options are left out of the path. |  |
| `InformationItem` | mdse_note | Note, no SysML block | Info (Note, Text, InformationItem), Issue, or modelCheck (Change, Decision). Text stays in the body. |  |
| `Note` | mdse_note | Note, no SysML block | Info (Note, Text, InformationItem), Issue, or modelCheck (Change, Decision). Text stays in the body. |  |
| `Issue` | mdse_note | Note, no SysML block | Info (Note, Text, InformationItem), Issue, or modelCheck (Change, Decision). Text stays in the body. |  |
| `Change` | mdse_note | Note, no SysML block | Info (Note, Text, InformationItem), Issue, or modelCheck (Change, Decision). Text stays in the body. |  |
| `Decision` | mdse_note | Note, no SysML block | Info (Note, Text, InformationItem), Issue, or modelCheck (Change, Decision). Text stays in the body. |  |
| `Text` | mdse_note | Note, no SysML block | Info (Note, Text, InformationItem), Issue, or modelCheck (Change, Decision). Text stays in the body. |  |
| `Text:NavigationCell` | mdse_note | Note, no SysML block | Info (Note, Text, InformationItem), Issue, or modelCheck (Change, Decision). Text stays in the body. |  |
| `Artifact:Image` | attachment_link | Artifact note + file in `Attachments/` | Content is read from t_document (ElementID = the element GUID). Images are embedded in the note body. A file already in the vault is never overwritten. Files over 25 MB are skipped. | `ATTACHMENT_BYTES_NOT_FOUND`, `ATTACHMENT_TOO_LARGE` |
| `Artifact:Document` | attachment_link | Artifact note + file in `Attachments/` | Content is read from t_document (ElementID = the element GUID). Images are embedded in the note body. A file already in the vault is never overwritten. Files over 25 MB are skipped. | `ATTACHMENT_BYTES_NOT_FOUND`, `ATTACHMENT_TOO_LARGE` |
| `Sequence` | reference_only | Ledger row only | No note. The row is kept as evidence. | `REFERENCE_ONLY` |
| `ProxyConnector` | reference_only | Ledger row only | No note. The row is kept as evidence. | `REFERENCE_ONLY` |
| `Boundary` | aggregate_boundary_note | One shared note `Boundaries` | Every Boundary is a line in one aggregate note. | `BOUNDARY_GROUPED` |

## Relationships

| EA family | Mapping disposition | Becomes | How | Exceptions |
|---|---|---|---|---|
| `Generalization` | conditional_native_candidate | `:>` on the specific definition | Both ends must be the same kind of definition. | `GENERALIZATION_ENDPOINT_KIND` |
| `Abstraction:allocate` | conditional_native_candidate | `allocate A to B` in A's block; YAML link when an end is a note | Both ends definitions. A note end (Issue, Change, Info, Artifact) becomes `describes` (Info, Artifact, Document) or the provisional `tracesTo`. | `ALLOCATE_ENDPOINT_KIND` |
| `Aggregation` | conditional_native_candidate | Owned usage in the whole: `part`, `action`, `state`, `item`, `requirement`, `port` or `use case`, by the kinds of the two definitions; `hasChild` YAML link when an end is a note | Whole is the end marked composite or shared. Every connector is its own usage (named from the end role, else the child, with _2 suffixes); an EA Part or nested element of the same type is matched to one connector and not duplicated (alias_merged). Role names and multiplicity come from the child end; no multiplicity is invented. A connector in an ownership cycle is left out. | `USAGE_WINS`, `AGGREGATION_BOTH_ENDS_AGGREGATE`, `AGGREGATION_WHOLE_NOT_EVIDENCED`, `AGGREGATION_ENDPOINT_KIND`, `AGGREGATION_PART_IN_INTERFACE`, `OWNERSHIP_CYCLE` |
| `Dependency:satisfy` | conditional_native_candidate | `satisfy` in the satisfier's block | One end a requirement def; the other a part, action or state def. Direction is normalized. | `SATISFY_ENDPOINT_KIND` |
| `Realisation` | conditional_native_candidate | `perform` (part to action), `allocate` (requirement to part, or part to part) | The part is found by element type, not by arrow direction. A note end becomes a YAML link. Any other pair is a review row. | `REALISATION_ENDPOINT_KIND` |
| `Dependency:refine` | conditional_native_candidate | `dependency from a to b; // refines` | Both ends definitions. The kind is carried by the trailing comment until a metadata form is chosen. | `DEPENDENCY_ENDPOINT_KIND` |
| `Dependency` | conditional_native_candidate | `dependency from a to b; // dependsOn`; `dependsOn` YAML link when an end is a note | Both ends definitions. | `DEPENDENCY_ENDPOINT_KIND` |
| `Dependency:trace` | conditional_native_candidate | `dependency from a to b; // trace`; YAML link when an end is a note | Both ends definitions. A note end becomes `describes` (Info, Artifact, Document) or the provisional `tracesTo`. | `DEPENDENCY_ENDPOINT_KIND` |
| `Association` | conditional_native_candidate | `actor` usage in the use case (Actor), `participants` YAML link on the use case (other part def), otherwise a review row | An association between a use case and a part is participation. Between anything else it is not evidence of a connection, so no ConnectionUsage is written. | `ASSOCIATION_CONNECTIVITY_NOT_PROVEN`, `USAGE_WINS` |
| `UseCase:extend` | conditional_native_candidate | Optional `use case x : Ext[0..1]` in the base use case | Source is the extending case, destination the base. Both use case defs. | `EXTEND_ENDPOINT_KIND` |
| `ControlFlow` | conditional_native_candidate | `succession first a then b` in the owning definition; `precedes` YAML link between notes with no shared owner | Both ends action, fork or join usages (or definitions nested in the same owner) give a succession. Two notes that share no owner give a `precedes` link with the guard as a Source line. | `FLOW_ENDPOINT_NOT_USAGE` |
| `Dependency:deriveReqt` | conditional_native_candidate | `dependency from a to b; // derivedFrom` | Requirement to requirement only. | `DERIVE_ENDPOINT_KIND` |
| `NoteLink` | reference_only | `describes` YAML link on the Info note | One end must be an Info note. | `NOTELINK_ENDPOINT_NOT_INFO_NOTE` |
| `UseCase:include` | conditional_native_candidate | `include use case` in the including use case | Both ends use case defs. | `INCLUDE_ENDPOINT_KIND` |
| `Sequence` | reference_only | Ledger row only | Reference only; diagrams are out of scope. | `REFERENCE_ONLY` |
| `StateFlow` | conditional_native_candidate | `transition first a then b` in the owning state def; `precedes` YAML link between notes with no shared owner | Both ends state usages (or state definitions nested in the same owner) give a transition. Two notes that share no owner give a `precedes` link with trigger, guard and effect as a Source line. | `FLOW_ENDPOINT_NOT_USAGE` |
| `Nesting` | conditional_native_candidate | Evidence only | Nesting is organizational. Ownership of usages comes from the parent id, not this connector. | `ORGANIZATIONAL_ONLY` |
| `Usage` | conditional_native_candidate | `dependency from a to b; // uses` | Both ends definitions. Stronger evidence (allocate, satisfy) is not inferred. | `DEPENDENCY_ENDPOINT_KIND` |
| `Dependency:verify` | conditional_native_candidate | `objective { verify }` in the verification def | One end a verification def, the other a requirement def. | `VERIFY_ENDPOINT_KIND` |
| `Dependency:RecoveryRequirement` | conditional_native_candidate | `dependency from a to b; // derivedFrom` | Requirement to requirement only. | `DERIVE_ENDPOINT_KIND` |
| `Connector` | conditional_native_candidate | `connect a to b` (same owner) or `connect partA.port to partB.port` (in the owning assembly) | Port-to-port only. For ports on different definitions, the one part def that owns exactly one part usage of each end's type holds the connection. | `PORT_CONNECTION_NEEDS_COMMON_OWNER`, `PORT_CONNECTION_AMBIGUOUS_OWNER`, `CONNECTOR_ENDPOINT_NOT_PORT` |
| `Abstraction:Derive` | conditional_native_candidate | `dependency from a to b; // derivedFrom` | Requirement to requirement only. | `DERIVE_ENDPOINT_KIND` |
| `Abstraction:trace` | conditional_native_candidate | `dependency from a to b; // trace` | Both ends definitions. | `DEPENDENCY_ENDPOINT_KIND` |
| `Usage:Responsibility` | conditional_native_candidate | `allocate A to B` in A's block | Same as allocate. | `ALLOCATE_ENDPOINT_KIND` |
| `Abstraction:Refine` | conditional_native_candidate | `dependency from a to b; // refines` | Same as refine. | `DEPENDENCY_ENDPOINT_KIND` |
| `Realisation:deriveReqt` | conditional_native_candidate | `dependency from a to b; // derivedFrom` | Requirement to requirement only. Provisional until the derivation form is chosen. | `DERIVE_ENDPOINT_KIND` |

## Dependency kinds

These look alike in EA but mean different things. Each keeps its own kind in the model text and in the Source section.

| Kind | EA families | Written as | Direction | Ends | Meaning |
|---|---|---|---|---|---|
| derivedFrom | `Realisation:deriveReqt`, `Dependency:deriveReqt`, `Dependency:RecoveryRequirement`, `Abstraction:Derive` | `dependency from new to informing; // derivedFrom` | From the new (derived) requirement to the informing requirement. Written in the new note. | requirement def to requirement def | The new requirement exists because of the informing one. |
| refines | `Dependency:refine`, `Abstraction:Refine` | `dependency from refining to refined; // refines` | From the refining element to the refined one. Written in the refining note. | any two definitions | Adds precision to the target; the target stays valid on its own. |
| trace | `Dependency:trace`, `Abstraction:trace` | `dependency from a to b; // trace` | As drawn. Written in the source note. | any two definitions | A related-to link with no stronger meaning. |
| dependsOn | `Dependency` | `dependency from client to supplier; // dependsOn` | From the dependent (client) to what it depends on (supplier). | any two definitions | A change to the supplier can break the client. |
| uses | `Usage` | `dependency from user to used; // uses` | From the user to the used element. | any two definitions | Generic use. Stronger evidence (allocate, satisfy) is not inferred from it. |
| allocate | `Abstraction:allocate`, `Usage:Responsibility` | `allocate A to B;` | From the allocated element to where it is allocated. Written in the source note. | any two definitions | A real SysML allocation, not a dependency. |
| satisfy | `Dependency:satisfy` | `satisfy Req;` | Written in the satisfier; direction is normalized so the requirement is the target. | requirement def with part, action or state def | A real SysML satisfy, not a dependency. |
| verify | `Dependency:verify` | `objective { verify Req; }` | Written in the verification def; direction normalized. | verification def with requirement def | A real SysML verify, not a dependency. |
| realises | `Realisation` | `perform action x : A;` or `allocate` | From the realising part to the action, requirement or part. | part def to action, requirement or part def | By endpoint kind; other pairs are review rows. |

Statements marked `UNVERIFIED_SYNTAX` in the ledger (satisfy, verify, allocate, perform, dependency, include, succession, transition, connect, item) are written in the SysML v2 form we expect; the parser gate decides.

## Exception codes

| Code | Meaning | What to do |
|---|---|---|
| `UNKNOWN_FAMILY` | Type/stereotype is not in the mapping file. | Add the family to the mapping or confirm it is out of scope. |
| `NO_CLASS_FOR_FAMILY` | Family resolves but no MDSE class exists for it. | Fix classify() or classes.json. |
| `ATTACHMENT_BYTES_NOT_FOUND` | No t_document content for this Artifact element. | The Artifact note exists without a file; attach it in EA or the vault. |
| `ATTACHMENT_TOO_LARGE` | Attachment over 25 MB was not written. | Add it to the vault by hand. |
| `FORK_JOIN_AMBIGUOUS` | Synchronization node is neither a fork nor a join by flow count. | Check the control flows in EA. |
| `TRIGGER_RECORDED_ON_OWNER` | Trigger recorded as a line on its state def. | None. |
| `PORT_CONNECTION_AMBIGUOUS_OWNER` | More than one assembly (or more than one part of a type) could hold this connection. | Pick the owning assembly by hand. |
| `EXTEND_ENDPOINT_KIND` | extend needs two use case defs. | Review the EA link. |
| `REFERENCE_ONLY` | Family is kept as evidence only. | None. |
| `BOUNDARY_GROUPED` | Boundary is a line in the shared Boundaries note. | None. |
| `UNHANDLED_DISPOSITION` | Mapping disposition the importer has no code for. | Importer bug or new disposition; fix run.ts. |
| `FORK_JOIN_CONTROL_FLOW_EVIDENCE` | Fork/join nodes are not translated. | Needs the flow evidence named in the mapping. |
| `LEGAL_TRANSITION_CONTEXT` | Trigger nodes are not translated. | Needs a legal transition context. |
| `CONDITIONAL_REVIEW` | Conditional family without a named evidence code. | Review. |
| `DIRECTION_EVIDENCE_MISSING` | Flow item has no usable `direction` tag (in, out, inout). | Set the direction in EA or in the note. |
| `FLOW_OWNER_NOT_PORT_DEF` | Flow item is not inside a port definition. | Move it under the port definition in EA. |
| `UNRESOLVED_FLOW_TYPE` | Flow item has no Signal/item definition to type it. | Set the EA Classifier. Item is written untyped. |
| `USAGE_WITHOUT_NOTE_OWNER` | Usage's parent is not a definition note. | Check the parent in EA. |
| `USAGE_OWNER_KIND_MISMATCH` | Usage kind does not fit its owner (e.g. a state in a part def). | Check the parent in EA. |
| `UNRESOLVED_PART_TYPE` | Part usage has no resolvable block in PDATA1. | Usage is written untyped with a flagLink. |
| `UNRESOLVED_PORT_TYPE` | Port has no interface/port definition as its PDATA1 type. | Usage is written untyped with a flagLink. |
| `MERGED_INTO_BLOCK_PORT` | A Port under a Part is the same port as one on the Part's block. | None; connectors use the block port. |
| `PORT_ADDED_TO_BLOCK` | A Port under a Part matched no port on its block (no PDATA3 target, no unique same name). | Review the port added to the block. |
| `UNRESOLVED_ACTION_TYPE` | Action has no action definition as Classifier. | Usage is written untyped with a flagLink. |
| `MULTIPLICITY_UNPARSED` | Multiplicity text is not a number or range. | Fix the EA multiplicity; written without it. |
| `ENDPOINT_MISSING_IN_SOURCE` | Connector end points at an object that is not in t_object. | Source model is inconsistent. |
| `NOTELINK_ENDPOINT_NOT_INFO_NOTE` | NoteLink does not touch an Info note. | None; kept as evidence. |
| `ORGANIZATIONAL_ONLY` | Nesting connector carries no model meaning. | None. |
| `NATIVE_EMISSION_DISABLED` | Run option turned native SysML off. | Re-run with native emission on. |
| `GENERALIZATION_ENDPOINT_KIND` | Generalization ends are not the same kind of definition. | Review the EA link. |
| `USAGE_WINS` | An EA Part, nested element or actor already covers this connector; the connector is merged into that usage. | None. |
| `OWNERSHIP_CYCLE` | Whole and part own each other through the aggregation and the usages already written. | Resolve the cycle in EA; the connector is left out of the model. |
| `AGGREGATION_PART_IN_INTERFACE` | A part is the child of an interface. Approved as an exception, not as a mapping. | Inspect the EA source and decide the construct. |
| `PROVISIONAL_LINK` | tracesTo is written because the connector fits no stronger relationship (W-288). | Replace tracesTo with the right relationship. |
| `AGGREGATION_BOTH_ENDS_AGGREGATE` | Both ends are marked as the whole. | Fix the EA aggregation kind. |
| `AGGREGATION_WHOLE_NOT_EVIDENCED` | Neither end is marked as the whole. | Fix the EA aggregation kind. |
| `AGGREGATION_ENDPOINT_KIND` | Aggregation ends are not the same kind of definition (part/part, action/action, state/state, item/item, use case/use case, requirement/requirement, part/port). | Review the EA link. |
| `SATISFY_ENDPOINT_KIND` | satisfy needs a requirement on one end and a part, action or state def on the other. | Review the EA link. |
| `VERIFY_ENDPOINT_KIND` | verify needs a verification def and a requirement def. | Review the EA link. |
| `ALLOCATE_ENDPOINT_KIND` | allocate needs two definitions. | Review the EA link. |
| `REALISATION_ENDPOINT_KIND` | Realisation pair has no perform/allocate reading. | Review the EA link. |
| `DERIVE_ENDPOINT_KIND` | Derivation needs two requirement defs. | Review the EA link. |
| `DEPENDENCY_ENDPOINT_KIND` | Dependency needs two definition notes. | Review the EA link. |
| `ASSOCIATION_CONNECTIVITY_NOT_PROVEN` | An association is not evidence of a connection. | Model the connection as a Connector between ports if it is one. |
| `PORT_CONNECTION_NEEDS_COMMON_OWNER` | Ports belong to different definitions and no assembly owns a part of each. | Add the assembly or make the connection by hand. |
| `CONNECTOR_ENDPOINT_NOT_PORT` | Connector end is not a port usage. | Review the EA link. |
| `FLOW_ENDPOINT_NOT_USAGE` | Flow end is not an action/state usage the importer wrote. | Control nodes and unwritten usages cannot be linked. |
| `FLOW_DIFFERENT_OWNERS` | No longer written: flow ends in different owners now become a precedes link. | None. |
| `INCLUDE_ENDPOINT_KIND` | include needs two use case defs. | Review the EA link. |
| `NATIVE_EMISSION_NOT_IMPLEMENTED` | Relationship family with no translation code. | Importer gap; see TRANSLATION.md. |
| `EXCEPTION` | The importer threw while handling this row. See Error Log. | Fix the importer; the row was skipped, not lost. |
| `NO_DISPOSITION` | A source row ended the run with no outcome. | Importer bug. |
| `SUBTYPE_DEFAULTED_ENGINEERING` | Requirement subtype not evidenced by package path. | Review subtype. |
| `SUBTYPE_DEFAULTED_WHAT` | Use case subtype defaulted. | Review subtype. |
| `SUBTYPE_DEFAULTED_PART` | Object subtype defaulted to part. | Review subtype. |
| `AUTHOR_FALLBACK` | EA author blank or unusable; fallback code used. | Map the author. |
| `AUTHOR_DERIVED` | Author code derived from the EA name. | Register the person. |
| `UID_TIME_FALLBACK` | EA created time missing; fallback time used. | None. |
| `UID_COLLISION_SHIFTED` | uid collided and was shifted by a millisecond. | None. |
| `REVIEW` | Conditional evidence named by the mapping was not checked. | Review per the code after the colon. |
| `UNVERIFIED_SYNTAX` | Statement written in SysML form not yet confirmed by the parser gate. | Run the parser gate; fix the form if it rejects it. |
