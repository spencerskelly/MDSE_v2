# OD-01 relationship field crosswalk — syntax-first, not approved

> [!warning] Informative assessment, not a replacement for D-0003, D-0069, D-0070 or a closure of OD-01. The 29 source fields remain in `governance/schemas/relationships.yaml` pending semantic and migration review.

## Rules of interpretation

1. Native SysML semantics are defined exclusively in the final `## SysML v2` text; no YAML copy or authoritative inverse.
2. One legacy field can require several different native constructs depending on endpoint kind and ownership. `split` is a review condition, not a recognized native type.
3. If a field cannot be mapped without inference, preserve the source and use `flagLink` plus the source ledger. Never silently turn an unresolved relationship into `dependency` or `trace`.
4. Markdown/YAML-only descriptive relations may remain only where SysML 2.0 has no equivalent and OD-01 approves the exact semantics.
5. These are syntax **cues**; no line in this table is claimed independently pinned-parser-certified. Use qualified names and a valid owning definition in real models.

## All 29 current legacy forward fields

| Forward field | Candidate disposition | SysML v2 / MDSE cue | Endpoint and meaning condition |
|---|---|---|---|
| `subtypeOf` | native | `:> (specializes)` | definition → general definition; no YAML mirror |
| `hasPart` | native | `part x : X;` | typed owned part usage, multiplicity on usage |
| `hasChild` | split | `typed owned usage / YAML descriptive` | SysML feature ownership vs nonmodel note hierarchy |
| `hasState` | native | `state x : X; / exhibit state` | nested state ≠ exhibited state |
| `includes` | split | `include use case x : X; / ref usage` | only real use-case inclusion is include |
| `copyOf` | review | `alias Short for Original;` | alias only when one identity established |
| `dependsOn` | split | `dependency from A to B; / YAML` | model dependencies vs nonmodel prerequisites |
| `derivedFrom` | native | `#derivation connection ...` | #original→source requirement; #derive→derived |
| `refines` | native | `#refinement dependency from A to B;` | refining→refined; not derivation |
| `drives` | review | `#causation connection ... / descriptive` | native causation vs loose influence |
| `references` | split | `ref ... / ::> / YAML describes` | feature reference differs from document citation |
| `precedes` | split | `succession first a then b;` | cross-owner flows currently YAML; review |
| `triggeredBy` | native | `transition first a accept t then b;` | state transition trigger, guard/effect distinct |
| `supersedes` | MDSE | `dependency from New to Old; // supersedes` | comment tag is non-native; distinguish from aliasOf |
| `describes` | MDSE | `YAML describes` | Info/Artifact/Document descriptive metadata |
| `tracesTo` | retired | `flagLink + deferred_review` | D-0010/D-0070; no new provisional edge |
| `performs` | native | `perform action x : Action;` | part/action behavioral performance |
| `hasDesign` | review | `exhibit state x : Design; / YAML` | design-as-state needs contextual meaning |
| `appliesTo` | split | `subject subj : System;` | requirement subject vs arbitrary applicability |
| `satisfies` | native | `satisfy Requirement by Element;` | native satisfaction; endpoints need validation |
| `verifies` | native | `objective { verify Requirement; }` | case objective; execution separate |
| `realizedBy` | split | `perform / allocate / other native form` | choose from semantic endpoint roles |
| `optionOf` | review | `use case x : X[0..1];` | optional use case ≠ every extend relationship |
| `affects` | MDSE | `YAML affects` | Issue/FailureMode descriptive effect; causation separately |
| `conflictsWith` | MDSE | `YAML conflictsWith` | mutual evidence, no demonstrated writer |
| `participants` | split | `actor x : X; / subject / MDSE link` | UseCase to actor/subject/part/document distinction |
| `initialState` | native | `initial state / first / entry semantics` | state machine context; validate grammar |
| `finalState` | native | `state final / terminate / done semantics` | terminal state context; validate grammar |
| `aliasOf` | MDSE | `YAML aliasOf` | temporary merge marker D-0034; not native alias |

**Candidate totals:** native 11; split 8; review 4; MDSE 5; retired 1. These are working review categories, not approved migration totals.

## Defects to correct in source tools after impact review

- **IMP-116:** when a ControlFlow/StateFlow has no common owner, importer emits YAML `precedes`; this is not a validated native succession/transition. Either establish a valid native owner or emit a review flag.
- **IMP-118:** some Use Case associations to parts emit YAML `participants` although SysML offers actor and subject roles; distinguish the roles and the non-native document case.
- **Workbench:** `ED_RELS` still offers `trace` described as an unchosen relationship; D-0010/D-0070 require `flagLink` for unresolved meaning. Explicit modeled dependency `// trace` must not be confused with a provisional guess.
- **Schema:** historical `tracesTo` explanatory text still says tools may write new provisional fields; header supersedes it. Move the obsolete text into a legacy glossary during schema migration.
- **MOD-012 / OD-03 / OD-08:** distinguish stable identity of native usages from obsolete Local Model records before altering ownership and reference syntax.

## Native syntax distinctions that the Workbench must preserve

`A :> B` specializes a definition; a *usage* may subset with `:>`; `: T` types a feature; `:>>` redefines; `::>` reference-subsets; `=>` cross-subsets. These are distinct SysML/KerML constructs, not synonyms for an Obsidian link. See OMG SysML v2.0, Part 1, §8.2.2.1.2, https://www.omg.org/spec/SysML/2.0/Language/PDF.

### Per-relationship acceptance template

Record exact source/target metaclasses, owning context, direction, multiplicity, native syntax, provenance, importer disposition, Workbench scanner/index/edit/visual behavior, pinned parser result, semantic validation, and round-trip reimport. If evidence is missing: `not verified`, not `supported`.

**Related sources:** `governance/language/catalog.json`, `governance/schemas/ea-family-mapping.json`, `tools/importer/src/run.ts`, `tools/workbench/src/edit.ts`; attached workbook `SysML_v1_v2_MDSE_Complete_Inventory_and_Relationship_Matrix.xlsx`.
