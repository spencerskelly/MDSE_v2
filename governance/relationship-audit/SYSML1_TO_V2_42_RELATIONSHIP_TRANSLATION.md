# SysML v1 / EA relationship to SysML v2 disposition — 42-row inventory

> [!important] Initial complete inventory reconciliation; individual EA connector families require source-specific evidence and parser/Workbench tests. This document does not override approved `governance/RULESET.md` or select unresolved semantics.

Source: attached workbook `SysML_v1_v2_MDSE_Complete_Inventory_and_Relationship_Matrix.xlsx`, `SysML1 Relationships` (42 rows). Actual EA resolver: `governance/schemas/ea-family-mapping.json` (30 keyed connector families); current emitter: `tools/importer/src/run.ts`. The workbook is a language-level taxonomy, not the raw EA type/stereotype list.

| SysML v1 relationship | Candidate native SysML v2 form / disposition | Mandatory meaning check |
|---|---|---|
| Package containment | `folder placement; source provenance` | not SysML package mapping by default |
| Owned attribute | `attribute usage : Type;` | explicit typed attribute, property and unit if evidenced |
| Composite aggregation | `owned typed part/action/state/requirement usage` | whole owner, child role, multiplicity |
| Shared aggregation | `ref part or referenced usage` | no implicit ownership transfer; validate reference |
| Association | `conditional review` | connector between ports or use-case participation only with evidence |
| Generalization | `definition specialization :>` | direction specific → general |
| Property typing | `feature usage : Type;` | usage of reusable definition |
| Connector | `connect a.p to b.p;` | common owning context and port compatibility |
| Connector end | `end feature / connector end` | role, multiplicity and ownership preserved |
| Item flow | `flow of Payload from a to b;` | transfer requires actual material/item/data evidence |
| Binding connector | `bind a = b;` | equality, not signal flow or physical connection |
| Nested connector end | `qualified endpoint e.g. part.port` | validate occurrence path |
| Association block | `connection def / interface def` | context-specific; no automatic synonym |
| deriveReqt | `#derivation connection` | original and derived endpoints correct |
| satisfy | `satisfy requirement (native)` | satisfier and target requirement type correct |
| verify | `objective { verify requirement; }` | verification definition/usage, result separate |
| refine | `#refinement dependency` | refining points to refined; not derivation |
| copy | `alias if identity established; else flagLink` | do not merge distinct meanings |
| trace | `explicit dependency if justified; else flagLink` | no provisional tracesTo YAML |
| containment | `nested requirement usage` | not automatically deriveReqt |
| Control flow | `succession first a then b;` | shared owner, ordered action endpoints |
| Object flow | `flow of Item from a to b;` | item/payload and direction evidenced |
| Transition | `transition first a accept t if g do e then b;` | state-context trigger, guard, effect |
| Trigger | `accept event/trigger inside transition` | not arbitrary triggeredBy YAML |
| Call behavior | `action usage / perform action` | behavior action owning context |
| Call operation | `action usage` | operation semantics must be demonstrated |
| Send signal | `send item/message` | send-capable actor/action context |
| Accept event | `accept event/item` | triggered behavior or transition |
| Include | `include use case x : X;` | required include |
| Extend | `optional use case x : X[0..1];` | MDSE-approved approximation, not semantic identity |
| Message | `message of Payload from a to b;` | message endpoint and payload semantics |
| Occurrence specification | `occurrence usage` | time/event occurrence, not automatically item |
| Activity parameter binding | `bind / parameter direction` | identity and ownership of parameter features |
| allocate | `allocate A to B;` | roles and source direction preserved |
| Dependency | `dependency from A to B;` | specific meaning required; non-native tags segregated |
| Realization | `perform / allocate / other depending on endpoints` | no generic realization conversion |
| Abstraction | `semantic review; refinement or dependency if supported` | no mechanical blanket translation |
| «conform» | `viewpoint conformance review` | exact SysML v2 semantics/parser test needed |
| «expose» | `expose in view` | view/context owner and target scope |
| Information flow | `flow of Payload from a to b;` | material/data transfer needs evidence |
| Usage | `typed feature usage (part, action, state, etc.)` | ownership, ref and multiplicity distinct |
| Interface realization | `interface/port usage as compatible` | review classifier/port intent |

## Translation invariants

- One EA connector always receives a ledger disposition. If endpoint type or ownership evidence is insufficient, retain GUID/direction/end identities in a `flagLink`; never manufacture a SysML relationship.
- **Containment vs typing vs specialization vs allocation** are separate. A composite aggregation is owned usage; a type/reference is distinct; `:>`, `:>>`, `::>` cannot be interchanged.
- `ControlFlow` and `StateFlow` need a valid SysML owned succession/transition. The current cross-owner YAML `precedes` fallback needs review.
- `Association` must not be treated as an electrical connection. Resolve Port and common owner before emitting `connect`, and issue/review other associations.
- Derivation, refinement, decomposition, satisfaction and verification preserve distinct orientations and target roles. No derived relationship is inferred merely from folder location or note links.
- Cross-version source provenance may be retained in `## Source: EA`, but no native SysML construct is duplicated in YAML.
- A tested native parser example, Workbench structural/visual representation and round trip are required before a row can be marked implemented.

## Audit coordination

- [OD-01 forward-field table](OD_01_29_FIELD_NATIVE_SYNTAX_CROSSWALK.md)
- [SysML v2 52-row catalog crosswalk](SYSML2_52_RELATIONSHIP_INVENTORY_COVERAGE.md)
- Native specification: https://www.omg.org/spec/SysML/2.0/Language/PDF
- Actual EA connector family resolver: `governance/schemas/ea-family-mapping.json`; approved 30-families map requires separate runnable fixture disposition and review flags.
