# Open decisions and conflicts

Owner decisions needed. Each one names what it blocks. When decided, record the outcome in `DECISIONS.md`, update `RULESET.md`, and delete the item here.

## New (2026-10-19, from repo set-up)

| ID | Phase | Area | Decision needed |
|---|---|---|---|
| OD-01 | P1 | Model | Classify every field in `governance/schemas/relationships.yaml` as SysML-defined (moves to SysML v2 text, removed from YAML) or MDSE-only (stays in YAML). Proposed split below. Blocks the note writer (M2/M3). |
| OD-02 | P1 | Rovo | With relationships only in SysML text (D-0003), Rovo cannot answer "what satisfies REQ-x" from YAML. Choose: generate a read-only, Rovo-indexable relationship index per release (recommended), or accept that Rovo reads SysML text. Related: ADR-V2-06 Q6 (does Rovo index Markdown on SharePoint at all). |
| OD-03 | P1 | Model | Stable identity tokens for usages inside SysML text (ADR-V2-06 Q1). Needs a pinned-parser test of SysML short names before adoption. |
| OD-04 | P1 | Importer | Import State (W-371) rejects a second import into a vault; add-onto import (ADR-V2-07, Phase 2) needs a defined Import State for add-onto runs. Blocks Phase 2. |
| OD-05 | P1 | Repo | License for a public repository. Without one, the code is "all rights reserved" and others may not reuse it. Options: proprietary notice, MIT, Apache-2.0, or make the repo private. |
| OD-06 | P1 | Repo | Repository visibility: public requires synthetic-only content (DAT-002). Private removes that constraint for fixtures but not for real data, which never goes in any repo. |
| OD-08 | P1 | Model | `local-model.yaml` was not carried. Confirm Local Model is V1-only and replaced by SysML usages, then retire the MOD Local Model rules. |

### OD-01 proposed split of relationships.yaml

| Field (forward) | Proposed home | SysML v2 construct |
|---|---|---|
| subtypeOf | SysML | specialization `:>` |
| hasPart | SysML | owned part usage |
| hasChild | SysML | owned member / nested usage |
| hasState | SysML | state usage |
| includes | SysML | include use case / reference usage |
| copyOf | SysML | alias (when identity proven) |
| dependsOn | SysML | dependency |
| derivedFrom | SysML | `#derivation` |
| refines | SysML | refinement dependency |
| precedes | SysML | succession |
| triggeredBy | SysML | transition trigger |
| performs | SysML | perform action |
| satisfies | SysML | satisfy |
| verifies | SysML | verify |
| appliesTo | SysML | requirement subject |
| realizedBy | SysML | perform / allocation (by endpoint) |
| optionOf | SysML | extend (optional case usage) |
| participants | SysML | actor / subject usage in a use case |
| initialState, finalState | SysML | entry/done transitions |
| hasDesign | Check | no direct construct; propose YAML |
| describes | YAML | MDSE-only |
| references | YAML | MDSE-only |
| drives | YAML | MDSE-only (causation is not SysML succession) |
| affects | YAML | MDSE-only (issues, failure modes) |
| supersedes | YAML | MDSE-only |
| conflictsWith | YAML | MDSE-only |

## Carried conflicts between sources

| ID | Tool | Conflict | Sources | Proposed resolution | Blocks |
|---|---|---|---|---|---|
| C-1 | Importer | EA-owned fields replaced on rerun | 1.23 §16.4, W-317 vs R-4.5 (your rule: change needs approval) | Your rule replaces it. Amend 1.23 §16.4 and note W-317 as partly superseded. | P1 |
| C-2 | Importer | Removed EA relationships are removed on rerun | 1.23 §16.4 vs R-4.9 (flagImport, never delete) | Your rule replaces it. Amend 1.23 §16.4. | P2 |
| C-3 | Importer | Same uid with different type: reported, nothing written | ADR-V2-07 vs R-4.7 (flagConflict in body) | Content conflicts use flagConflict. Identity conflicts: see C-13. | P2 |
| C-4 | Importer | subtype, eaType, sourceRole, primarySymbol refreshed from EA | ADR-V2-07, ADR-V2-06 vs R-4.5 | Approval only. Amend both ADRs. | P2 |
| C-5 | Importer | ## SysML v2 and ## Source: EA replaced on each rerun | ADR-V2-07, ADR-V2-06 vs R-4.5, R-9.3 | Approval only. Amend both ADRs. | P2 |
| C-6 | BOM | Superseded revisions not imported; mismatch reported as conflict | ADR-V2-08 vs R-6.6, R-6.7 | Parent is flagged, child body lists the older-revision usage. Close the ADR-V2-08 open question. | P2 |
| C-7 | Model rules | Template keeps all properties vs empty non-template fields not written | AI_INSTRUCTIONS.md step 1 vs R-2.3 | Confirm R-2.2 and R-2.3 scope (imported notes only, or hand-made notes too). | P1 |
| C-8 | Governance | Translator Definition §10 is cited but the file is not in the repo | 1.23 §14 | Create it or remove the citation. The 100 table dispositions live in the source profile (W-393, W-394). | P1 |
| C-9 | Model rules | Stable tokens for usages once Local Model is gone | ADR-V2-06 Q1 vs R-8.5 | Open. Needs a pinned-parser test of SysML short names. | P1 |
| C-10 | Model rules | Ruleset 1.23 is behind the Decision Log (W-320 to W-398) | 1.23 §3–§7, §15.7 vs W-384, W-398, current schemas | Re-derive class, relationship and Local Model rules from the schemas, not 1.23. | P1 |
| C-11 | Importer | "Never run over an existing vault / never re-import" vs add-onto and BOM import | W-36, W-37, W-62 vs ADR-V2-07, R-4.2 | Record a new W-decision that names W-36, W-37 and W-62 as superseded. | P2 |
| C-12 | Importer | Path length: 212, then 400 hard stop, then none, then 400 report-only | W-318, W-324, W-382, ADR-V2-06 Q5 | W-382 is the latest accepted (no limit). Confirm whether to add a 400-character report for SharePoint. | P1 |
| C-13 | Importer | Identity conflicts are hard errors vs flagConflict | W-317 vs R-4.7 | Keep hard error for identity; flagConflict for content. Confirm. | P2 |
| C-14 | Base and Bootstrap | Dataview removed in W-370 but still named in older docs | W-370 vs project notes, older docs | W-370 governs. Search templates and AI_INSTRUCTIONS for Dataview dependencies. | P1 |
| C-15 | Importer | A destination that already holds Import State.json is rejected for another semantic import | W-371 (and W-389) vs add-onto import (ADR-V2-07, Phase 2 BOM) | Needs a decision: how Import State records an add-onto run. Blocks Phase 2 unless amended. | P2 |
| C-17 | Model rules | AI_INSTRUCTIONS line 56 keeps folders at or below 75 files and allows folder_N | AI_INSTRUCTIONS.md vs W-382 (no file-count limits, no folder_N) | AI_INSTRUCTIONS.md is stale. Amend. | P1 |
| C-18 | Importer | Boundary: removed from the model vs one aggregate Boundary note vs per-element modelCheck/Boundary | 60-family reconciliation, STEP-00 2, element-types.yaml modelCheck | STEP-00 2 (aggregate note) is latest. Update the mapping docs and the modelCheck subtype list. | P1 |

## Carried open questions

| ID | Phase | Area | Question | Origin |
|---|---|---|---|---|
| REG-239 | P1 | Local Model (V1) / usages (V2) | Local Model usages are SysML usages in v2. Stable tokens for v2 usages are an open question (ADR-V2-06 Q1). | R-8.5 (Ruleset 2.0 draft) |
| REG-262 | P1 | Open decisions | Inverse-field regenerate script: language, location, when it runs; whether Nodian is removed (W-275, W-287). | OPEN-01 |
| REG-263 | P1 | Open decisions | Bootstrap must implement author registration: the first-use popup saves a code locally but does not create the person note; install-time name entry should create .obsidian/author-code.txt by the same rule as the snippet; where the Bootstrap source lives. | OPEN-05 |
| REG-264 | P1 | Open decisions | What makes a vault ready for finishing touches (golden definition). | OPEN-09 |
| REG-265 | P1 | Open decisions | Where do the stable 30-character tokens for usages live in SysML text? Recommendation: SysML short names, part <'2026...'> controller : Controller; must be accepted by the pinned parser first (not verified). | OPEN-V2-Q1 (ADR-V2-06) |
| REG-267 | P1 | Open decisions | Adopt sourceRole and primarySymbol as governed v2 property names? Recommendation: yes. | OPEN-V2-Q4 (ADR-V2-06) |
| REG-268 | P1 | Open decisions | Reinstate a blocking path-length report (never shortening) for SharePoint, and at what limit? Recommendation: 400 decoded characters plus a sync-root budget. (C-12) | OPEN-V2-Q5 (ADR-V2-06) |
| REG-269 | P1 | Open decisions | How will Rovo read the model? The Atlassian SharePoint connector lists Word, Excel, PowerPoint, PDF and web pages, not Markdown. Confirm with Atlassian; if .md is not indexed, generate a Rovo-readable projection. | OPEN-V2-Q6 (ADR-V2-06) |
| REG-307 | P2 | Open decisions | Standards content in the vault: whether third-party standards content may stay (Post-Import Tasks Task 2); second edition of a standard; STD and STK prefixes in element-types.yaml; the Stakeholder ID tag holds clause numbers, not stakeholder IDs. | OPEN-06 |
| REG-308 | P2 | Open decisions | Only Object_Type and Stereotype are decided as frontmatter; 38 EA tags are Source: EA body lines (PN, MFG PN, Brand, Quantity, Piece Cost, Current Max). Which become frontmatter or SysML attributes? Recommendation: promote the Identity group (id, SysML1.4::id, PN, MFG PN, Brand). | OPEN-V2-Q3 (ADR-V2-06) |
| REG-337 | Later | Open decisions | relationships.yaml still carries a crossVault guidance entry (W-263/W-265). | OPEN-02 |
| REG-338 | Later | Open decisions | Diagram handling: how Ports are drawn, selection beyond type, drawn objects with no note, reading the Review Changes Log (W-62, W-73). | OPEN-03 |
| REG-339 | Later | Open decisions | Which note keeps its id when a sweep finds duplicates; whether original EA modified dates are kept; which status values mean a person must still review AI-created notes; whether a stamping script computes uid and id mechanically; backfilling uid and id on existing notes. | OPEN-04 |
| REG-340 | Later | Open decisions | Post-import tasks (Tasks 1 to 8 in Post-Import Tasks.md): flow-connector moves, containment specificity, directional pair replacing equals, properties from body lines, multi-line tag values, relationship field order and empty-field writing (W-126). | OPEN-07 |
| REG-341 | Later | Open decisions | Handoff package EA_Native_Translator_Handoff_2026-09-28 is to be reviewed one topic at a time; nothing adopted yet. Methodology notes (rules, decisions, canvases, bases) and 99 canvas nodes pointing at non-existent paths await a decision. | OPEN-08 |
| REG-342 | Later | Open decisions | Freestyle.md template: whether to add a uid line; Port.md default subtype; modelCheck and legacy folder values in element-types.yaml versus W-04; unused types.json properties (18). | OPEN-10 |
| DEC-2 | P2 | Decision | BOM list and GSE charger BOM timing | DEC-2 |
| DEC-3 | P1 | Decision | Where private real-data evidence is stored | DEC-3 |
| DEC-5 | P1 | Decision | Scope of the empty-field rule (imported notes only, or hand-made notes too) | DEC-5 |

## Resolved on 2026-10-19

- C-16: D-0001, D-0002: MDSE_v2 holds Workbench.
- C-19: D-0003: SysML-defined content only in SysML v2 text; no YAML mirror.
- OPEN-V2-Q2 (ADR-V2-06): D-0003
- DEC-1: Moot: the old documents are archived and RULESET.md carries the owner merge rules (D-0001)
- DEC-4: D-0001 (the definition is governance/MDSE_DEFINITION.md)
- OD-14: D-0053: the owner of each area is chosen at the merge; the BOM owns structure by default.
