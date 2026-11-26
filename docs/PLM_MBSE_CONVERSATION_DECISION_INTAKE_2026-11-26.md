# PLM + MBSE decision intake — consolidated conversation baseline

**Captured:** 2026-11-26  
**Source:** PLM+MBSE architecture and workflow discussion, 2026-11-02 through 2026-11-03, with subsequent clarifications in the same conversation.  
**Status:** Owner-stated decisions collected for reconciliation; **not a replacement for** `governance/DECISIONS.md`, `governance/RULESET.md`, or later decisions.  
**Scope:** Proposed system architecture, information model, PLM/MBSE bridge, release governance, manufacturing mapping, Workbench UX, and WF-01 investigation.  
**Implementation authority:** `governance/README.md` precedence applies; changes in meaning require matching D-number decisions, rules and schema edits under `CONTRIBUTING.md`. Do not implement conflicts as though resolved.

> This file intentionally contains no real product data, CAD content, customer data, or imported BOM. Part identifiers below are illustrative references given in discussion; no real model records are included.

## A. Decision register from the discussion

| Key | Owner decision / instruction | Implementation consequence | Reconciliation |
|---|---|---|---|
| PLM-C-01 | Build an Obsidian-centered platform providing PLM release/BOM functions and SysML v2 MBSE relationships, with SolidWorks/PDM, Altium ZIPs and NetSuite retained. | One accessible engineering interface; respect authorities of external systems. | Align with current toolchain. |
| PLM-C-02 | **Final selection: entirely Markdown and Git**, not a PostgreSQL/transactional data store. A prior hybrid option was explicitly replaced. | Vault Markdown/YAML and Git govern engineering data; indices are rebuildable. | Check latest vault/SharePoint/Git policies. |
| PLM-C-03 | **At the time selected: Markdown records with generated SysML v2**, replacing an earlier native-text-as-source proposal. Strict SysML v2 syntax and semantics required; non-SysML extensions in YAML. | Source/generator and validator would need explicit contract. | **CONFLICT:** Current MDSE_v2 D-0003 / MOD-117 and README say the note's native `## SysML v2` block is authoritative. Later repository policy may supersede this conversation proposal; owner reconciliation required before coding. |
| PLM-C-04 | Begin with **one shared vault**; later split only after single-vault use and stable identity. | Single-vault-first architecture. | Consistent with D-0011. |
| PLM-C-05 | UID format: `yyyyMMddHHmmssSSSauthornameuse`; 17-digit timestamp followed by 13 characters representing last name then first name; total 30. | Immutable identity independent of filename, revision, or path. | **UNRESOLVED:** author normalization/padding, timezone, collisions, and interpretation of `authornameuse` must be matched with existing author/UID schema; do not invent a binding convention. |
| PLM-C-06 | SysML v2 relationships must be strictly standard; any deviation or extension belongs in YAML. | Never synthesize nonstandard SysML relationships. | Align to D-0003 and classify YAML-only PLM relations under OD-01. |
| PLM-C-07 | Do not require automatic workflow transitions between tools. Engineering team owns ensuring changes are made, reviewed and validated. | No mandatory Jira/Git/ERP automation. Manual checks and traceable records are sufficient unless later decided. | Align with current ECO governance. |
| PLM-C-08 | Git changes occur in a branch; Jira holds stakeholder approval; completed approved branch is merged. | Engineer documents Jira reference and verifies approval before merge. | Current D-0110/D-0154 and OD-24/OD-25 may provide newer details; do not modify branch policy silently. |
| PLM-C-09 | Release package goes to project manager for NetSuite import and/or lead engineer for CM distribution. | Human handoff, manifest and acknowledgement evidence; no assumed automated ERP write. | Align PLM-004; current distribution process may have evolved. |
| PLM-C-10 | Keep **MBSE model and PLM/BOM records separate**, linked by identity and surfaced as one contextual view. | Independent revision, modeling, BOM and lifecycle responsibilities. | Align current Part/Object separation decisions D-0115 onward. |
| PLM-C-11 | **Usage-level link is the principal MBSE→PLM bridge.** Definition-level candidate mappings optional/advisory. | Connect contextual SysML Part Usage to PLM part identity, not automatically every definition or BOM row. | Current OD-30 explicitly defers usage-level implementation until stable usage identities (OD-03). |
| PLM-C-12 | BOM/revision note naming: part number concatenated with change level, e.g. `5913495D`, next `5913495E`; YAML also retains `partNumber: "5913495"` and change level separately. | Human name encodes specific revision, stable family key in YAML. | **CONFLICT/DETAIL:** Current repo D-0115 says filename `<PN> <CL1>` (space); D-0123 defines CL1 letter and CL2 number. Confirm actual active scheme before rewriting importers or filenames. |
| PLM-C-13 | A modeled usage can link to the base part family (`5913495`) or to a specific revision (`5913495E`); SysML redefinition is distinct from PLM revision selection. | Separate PLM selector from valid SysML `redefines`. | Tie to current revision-note and usage syntax policy. |
| PLM-C-14 | **No mandatory one-to-one or even any link**: BOM parts need not have model elements; model elements need not have parts. Multiple mappings allowed where meaningful. | Do not auto-create counterpart records or fail normal validation solely because no counterpart exists. | Check any later coverage policy (e.g. MOD-187) as a potential scoped exception. |
| PLM-C-15 | Architecture and manufacturing are different views of one product; avoid requiring node-by-node structural equality. | EBOM and optional MBOM/transformation view preserve appropriate design/manufacturing differences. | Current PLM-004 defines export; MBOM transform behavior may be unapproved. |
| PLM-C-16 | Manufacturing-only items may be unmodeled; architectural usages may be implemented by a multi-part assembly, with decomposition in BOM. | Allow zero/many PLM mapping, quantity and occurrence resolution separately. | Reconcile with existing BOM rules. |
| PLM-C-17 | A Workbench focused on engineering **goals and workflows**, not independent tool views. Do not force switching Workbench modes during work on a topic. | Context persists while central panel changes representation. | Compare current four-workflow Document/Define/Structure/Verify UX; do not replace it without owner decision. |
| PLM-C-18 | Workbench tools and workflow changes stay in tool panel/popout; notes/canvases/bases open their own Obsidian tabs and remain revisit-able. | Distinguish tool navigation from engineering artifact editors. | Consistent with later November Workbench direction; verify current implementation. |
| PLM-C-19 | First fully specified workflow: **WF-01 Find and Investigate Engineering Information**. | Shared search, identity, relation traversal and context-preserving navigation underpin other workflows. | Review against current Workbench search/lens behavior. |

### Superseded proposals from the same conversation (not current owner decisions)

- Hybrid storage (PostgreSQL + immutable artifact store): superseded by all-Markdown + Git.
- Native SysML source as the selected *new system* architecture: in that conversation superseded by Markdown records with generated SysML, **but note current MDSE_v2 has a later/independent native SysML authority**.
- A release process with automated transitions or mandatory automated Jira/ERP synchronization: owner clarified no automatic handoffs are required.
- Merging model notes and BOM parts: superseded by separate records and usage-level links.
- Definition-only or BOM-occurrence-only as principal bridge: superseded by usage-level associations.
- Per-function tool views: superseded by contextual workflow-first Workbench.

## B. Canonical data concepts for implementation review

### B1. Identity (proposed contract pending reconciliation)

- `uid`: permanent 30-character owner-defined timestamp-and-author token; immutable across renames, paths and revisions.
- `partNumber`: family/base PN, e.g. `5913495`, a business identifier distinct from UID.
- `changeLevel`: revision identifier, e.g. `D` or `E`; do not assume numeric sorting or infer a revision from the filename without YAML confirmation.
- `revisionKey`: display form `partNumber + changeLevel`, e.g. `5913495E`. Current repository may require a different actual filename format—see PLM-C-12.
- Separate Part Usage UID, part/family identity and revision-note UID. A stable model reference must not point to an Obsidian filename alone.
- Keep author-code uniqueness, collision detection, UTC/local timestamp convention and batch allocation as open checks.

### B2. Illustrative YAML-only implementation bridge

This is an **intake example for discussion, not an approved schema**. It must NOT be copied into `schemas/relationships.yaml` or emitted by tools until the authority conflict and OD-03/OD-01 are resolved.

```yaml
recordType: PartUsage
uid: "<30-char-usage-uid>"
extensions:
  plm:
    implementation:
      partNumber: "5913495"
      revisionPolicy: release_resolve
```

Explicit revision selection:

```yaml
extensions:
  plm:
    implementation:
      partNumber: "5913495"
      changeLevel: "E"
      revisionPolicy: fixed
```

Meaning:
- `release_resolve`: selects a specific approved, compatible revision for the applicable product configuration **during engineer-led release review**; never silently take the newest.
- `fixed`: pins a specific revision.
- A model redefinition must remain a valid SysML v2 redefinition and is not implied by changing YAML `changeLevel`.
- Reverse relationships/search results are generated from source; do not maintain duplicated inverse YAML manually unless governance explicitly requires it.
- Allow no mapping, one mapping or appropriately structured many-to-many mappings. Distinguish alternatives by configuration, selected physical assembly and quantity.
- Any optional definition-level candidate associations are advisory, not the authority for a selected usage's implementation.

### B3. Part-revision illustrative record

```yaml
uid: "<30-char-revision-uid>"
recordType: PartRevision
partNumber: "5913495"
changeLevel: "E"
name: "5913495E"
```

A part-family lookup resolves `5913495`; an exact-revision lookup resolves `5913495E`. A release snapshot records exact selected revision IDs, not only a family or the last observed active revision.

### B4. Model / PLM correspondence cardinality

| Source | Target | Cardinality / enforcement |
|---|---|---|
| SysML Part Definition | PLM candidates | 0..many, advisory only |
| SysML Part Usage | PLM part family or exact revision | 0..many, contextual, selected mapping where relevant |
| PLM part/revision | SysML Part Usages | 0..many, derived reverse query |
| BOM line occurrence | PLM part/revision | Each valid BOM line resolves its part; released line pins applicable revision |
| BOM line occurrence | SysML usage | 0..many optional, never forced |
| Architectural function | Physical implementation | Use formal SysML relations (e.g. valid performance/allocation), not an invented BOM correspondence |
| Manufacturing-only material | SysML | May be unmapped |

Potentially many physical items implementing one usage should preferably be represented by a selected assembly plus BOM decomposition; more complex mappings require explicit configuration and review.

## C. Architecture versus manufacturing differences

Architecture answers **what the system is/does, and how its components interact**. Engineering BOM answers **what the design specifies**. Manufacturing BOM or package answers **what and how it is built**. These structures are related, but not identical.

Recognized differences:
1. **Abstraction:** a modeled controller corresponds to a controller assembly containing PCBA, display and cable.
2. **Manufacturing regrouping:** a model item and a production kit/batch have different hierarchical boundaries.
3. **Manufacturing-only items:** packaging, labeling, adhesives, consumables, tooling-related records that have no reason to exist as modeled parts.
4. **Alternative implementations:** approved revisions/variants selected per configuration.
5. **Physical decomposition below model interest:** resistors, fasteners, PCB-level items remain in BOM without corresponding SysML notes.

Proposed transformation record (YAML extension, *not SysML*), for any situation requiring explicit EBOM→MBOM reconciliation:

```yaml
recordType: BOMMapping
uid: "<30-char-mapping-uid>"
source:
  bomView: engineering
  occurrenceUid: "<engineering-bom-occurrence-uid>"
target:
  bomView: manufacturing
  occurrenceUids:
    - "<manufacturing-occurrence-uid>"
mapping:
  type: split # equivalent | grouped | split | manufacturingOnly | excluded | substituted | phantom
  reason: manufacturing_sequence
  jiraRef: "<issue-key>"
```

Mappings are keyed by **occurrence** rather than part number, because the same part may be used in multiple locations. Do not require an independently replicated MBOM unless actual manufacturing structure differs. Keep one engineering product structure as the starting point. A release exception should capture rationale, responsible engineer and approval reference.

Release validation checks: BOM completeness; valid part and revision targets; valid *existing* model/PLM links; exact release selection; disposition of required EBOM occurrences in manufacturing structure; reasonable quantity/unit reconciliation; explicit exception records; and accountable engineering review. An unmapped noncritical model element or ordinary manufacturing-only BOM item is not automatically an error.

## D. External system boundaries and release ownership

| System | Owns | MDSE interaction |
|---|---|---|
| SolidWorks PDM | Native mechanical design versions, drawings and working design file history | References and controlled exports; no claim to replace PDM |
| Altium | Schematics, PCB layouts, packaged native projects and fabrication/assembly deliverables | Retain ZIP package and attach provenance/manifest |
| Vault / Git | Engineering records and source history, branch review and merged engineering baseline | Repo history is evidence; approvals remain separate |
| Jira | Stakeholder ECO approval | Engineer records issue and checks actual approval; not an automated transition requirement |
| NetSuite | ERP item/manufacturing transactions | Project manager imports supplied approved release package |
| Contract manufacturer | Receives approved manufacturing package | Lead engineer performs handoff; retain package/version and delivery evidence |

**Human-driven ECO and release sequence:**
1. Engineer creates/works on a branch associated with the relevant Jira ECO.
2. Engineering updates model records, BOM/revision records, documentation and verification as appropriate; not every ECO requires every type of edit.
3. Engineer reviews affected links and revisions, and runs available validation.
4. Stakeholders approve in Jira; responsible person verifies that approval against the intended branch/change.
5. Authorized merge occurs when ECO is complete and approval verified.
6. Engineering produces a reproducible release package from the approved merged baseline, identifying exact revisions, files and their hashes where available.
7. Package delivered to project manager for manual NetSuite import and/or lead engineer for CM distribution.
8. Handoff/import confirmation is documented by accountable engineers; do not infer completion solely from package creation or Git merge.

Later MDSE_v2 decisions may prescribe a different precise ECO note, role approvers, branch naming, main protection or release procedure. Resolve via the existing governance mechanism.

## E. Workflow-first Workbench contract

### E1. Goal → workflow → functions → records

The end-user interaction begins with the engineer's **subject and goal**, not a subsystem's technical tool name. Workbench supports one persistent topic context, with contextual functions exposed in-place.

Seven conceptual engineering workflows:
1. Product discovery and definition — needs, requirements, scope.
2. Architecture and design — SysML structures, interfaces, behaviors, constraints.
3. Physical product definition — engineering parts, revisions, BOMs, CAD mappings.
4. Verification and validation — cases, results, evidence.
5. Change management — investigation, impact, revision, validation, Jira disposition.
6. Release and manufacturing handoff — approved configuration, package, external human handoff.
7. **Find and investigate information** — search, identify, traverse, compare, document findings.

These are user goals; they are not a mandate to add seven separate plugin screens. The currently implemented four-workflow Workbench (Document/Define/Structure/Verify) is an existing later policy/design; the alignment must be explicitly decided.

### E2. Persistent regions

- Context header: active product/topic, branch/revision, investigation root and scope.
- Navigation: results, breadcrumbs, recent/pinned records and history.
- Central area: dynamic document/table/graph/hierarchy/comparison without losing context.
- Detail/actions: selected record properties, provenance, valid operations.
- Status/findings: validation, broken links, unresolved flags, stale indexes and Git state.

Tool workflows and option changes stay inside the Workbench panel/popout; actual notes, canvases or bases open in independent, revisit-able Obsidian tabs. Changing presentation is not switching tools. Operations are filtered by record kind and lifecycle; semantic edits follow correct underlying authority.

Reusable functions include: UID/name/alias/property search, part-family/revision resolution, relation traversal and reverse lookup, common neighbors, BOM where-used, revision comparison, graph/lens/table view, provenance display, flag/exception review, investigation capture, validation and export.

## F. WF-01 — Find and investigate engineering information

**Goal:** Given any starting clue, find the correct authoritative engineering records; understand their connections, status, revisions and source; preserve investigation context throughout.

**Starting contexts:**
- Exact part family (`5913495`) or part revision (`5913495E`).
- UID, SysML element name/qualified name, alias.
- Requirement, interface, function, BOM, drawing/document identifier.
- Jira issue, Git branch/commit/change note, source file/metadata.
- Selected note, relationship graph node, BOM cell or Workbench search result.

**User activities:**
1. **Find** by exact ID, text, name/alias, PN/revision and typed properties.
2. **Identify** candidate types and disambiguate family vs revision, definition vs usage, same-name records.
3. **Investigate** typed SysML edges, YAML-only PLM links, BOM parent/child occurrences, CAD/provenance, where-used and histories.
4. **Analyze** side-by-side revisions, common neighbors, indirect impact, issues/flags, and different baselines.
5. **Document** optional investigation note with cited records, recorded source commit/revision, queries, findings, questions and conclusions. Browsing itself is read-only.

**Record interactions:** stable UID resolution; exact revision and version-scoped lookup; native SysML semantics from the accepted authoritative source; PLM extensions via approved YAML; derived reverse indexes and presentation-only wikilinks; historical Git references; no inferred semantic edges. Broken or ambiguous references are explicitly shown rather than guessed.

**Expected outputs:** resolved authoritative record; filtered graph/hierarchy/table; BOM or part revision comparison; source/provenance and configuration; optional saved investigation with bookmarks and findings.

**Completion criteria:** user can determine what was found, why it is the correct record, which branch/revision/baseline it represents, how it is connected, and where the source of authority resides, without leaving the Workbench tool context. Opening a note/canvas/base in its own editor tab does not destroy investigation state.

### WF-01 acceptance-test catalog (proposal; not claimed executed)

| ID | Acceptance test | Pass condition |
|---|---|---|
| WF01-01 | Exact UID lookup | Correct record returned despite path rename |
| WF01-02 | PN family lookup | Family and revision choices distinguishable |
| WF01-03 | Exact PN+revision lookup | `5913495E` resolves exactly, not D or latest |
| WF01-04 | Ambiguous name | Multiple candidates displayed with disambiguating type/context |
| WF01-05 | Alias lookup | Canonical record found without identity duplication |
| WF01-06 | Property search | Matching fields and record types shown accurately |
| WF01-07 | Model definition vs usage | Not conflated |
| WF01-08 | SysML relationship traversal | Only validated standard semantics reported |
| WF01-09 | PLM implementation link | Family vs fixed revision distinguished |
| WF01-10 | Missing MBSE counterpart | BOM item still navigable; no false error |
| WF01-11 | Missing PLM counterpart | Abstract usage still navigable; no false error |
| WF01-12 | Many-to-many associations | Multiple valid links survive indexing and browsing |
| WF01-13 | Where-used | All matching BOM occurrences displayed, not merely PN |
| WF01-14 | Broken UID reference | Visible unresolved finding; never silently mapped |
| WF01-15 | Source provenance | Native CAD/ERP/Jira/Git references distinguished by authority |
| WF01-16 | Revision comparison | Add/remove/quantity/revision changes reported |
| WF01-17 | Historical baseline | Released result does not silently follow current head/latest CL |
| WF01-18 | Shared neighbors | Common link targets correct and deduplicated in views |
| WF01-19 | Multi-hop traversal | Direction, edge kind and filters retained |
| WF01-20 | Search to graph | Investigation root/context retained |
| WF01-21 | Graph to table | Selection and scope retained |
| WF01-22 | Open note in separate tab | Workbench context preserved |
| WF01-23 | Open canvas in separate tab | Workbench context preserved |
| WF01-24 | Workbench panel/popout | Tool actions remain in tool UI; no unintended tab spawning |
| WF01-25 | Browser history | Return to previous selected record and view state |
| WF01-26 | Index rebuild | Same result set from authoritative files |
| WF01-27 | Stale index | Staleness indicated; source not misrepresented |
| WF01-28 | Working branch state | Current working files distinguished from approved baseline |
| WF01-29 | Investigation note | Explicit action creates one note with source references |
| WF01-30 | Read-only browsing | No authoritative record changes |
| WF01-31 | Invalid generated SysML | Flag semantic/parser errors, never render as valid |
| WF01-32 | Nested BOM | Quantity and child-revision occurrence context retained |
| WF01-33 | Missing external file | Referenced-but-unavailable status shown |
| WF01-34 | Empty query / no matches | Clear user feedback without fabricated result |
| WF01-35 | Representative scale | Performance measured against agreed vault fixture; target is provisional, not evidence of passing |

Earlier WF-01 proposal specified a 50,000-note exact-ID lookup p95 target of one second after indexing. The present toolchain uses a 10,000-note smoke baseline (D-0013); treat the larger benchmark as a **proposed target**, not an approved replacement.

## G. Required conflict reconciliation before implementation

**This documentation captures intent, not a runnable contract.** The following items must be reconciled with active later decisions before writing schema, importer or Workbench code:

1. **SysML authority:** conversation's generated-SysML selection vs D-0003/MOD-117 and all current toolchain assumptions that native SysML v2 text is authoritative. Do not create a parallel source of truth.
2. **UID author convention:** owner-prescribed 30-character format vs current `authors.yaml`, identity allocator and OD-03 usage identity; exact 13-character encoding remains unresolved.
3. **Revision filename:** `5913495E` vs D-0115 `<PN> <CL1>`, and CL2 handling from D-0123.
4. **Usage-level `implements` mapping:** optional and many-to-many owner intent vs current `implements`/`implementedBy` properties and OD-30 implementation status. Avoid undocumented inverse-writing and new SysML constructs.
5. **No mandatory MBSE↔BOM coverage:** check impact on MOD-187 or other later coverage rules; prefer product-scoped release checks rather than universal one-to-one.
6. **Workflow UX:** seven user goals and persistent context vs implemented four-workflow Document/Define/Structure/Verify modes. Map capabilities before restructuring the interface.
7. **Git+Jira ECO flow:** human approval/merge/handoff vs later ECO template/approver-property/branch protections and OD-24/OD-25.
8. **EBOM/MBOM mappings:** proposed `BOMMapping` needs a new approved schema and acceptance tests; not currently shown to exist as authoritative model semantics.
9. **Scope/security:** `MDSE_v2` is public toolchain; real vault/product data must never be committed here (DAT-002); use only synthetic fixtures and specs.
10. **Parallel development:** new changes must compare with latest main and other active branches; avoid edits to existing governing rules until owner/maintainer resolves conflicts.

## H. Next implementation actions (not automatically authorized)

1. Review this intake alongside `governance/DECISIONS.md`, `governance/RULESET.md`, `governance/OPEN_DECISIONS.md`, current tool code and live-vault model.
2. Create a reconciliation matrix mapping PLM-C keys to existing D/rule IDs and marking confirmed / superseded / open.
3. For confirmed semantic changes, add a new `D-nnnn` and matching `RULESET.md` and schema changes in a **single governed change**, update generated registers and run tests.
4. Convert WF-01 into reusable behavior-level functions/tests without overwriting the active four-workflow Workbench.
5. Exercise synthetic part-family/revision/use-case fixtures and compile/test (including independent SysML parser gate).
6. Record staging Obsidian validation separately; repository source merge is not a production release or successful live-vault deployment.

## I. Historical specification references

The discussion produced conceptual specification revisions 0.1 (hybrid), 0.2 (Markdown+Git), 0.3 (UID/SysML/Jira), 0.4 (usage-level link), and WF-01 Find/Investigate v0.1. **Those are prior chat deliverables, not authoritative repository specifications.** This consolidated document carries their discussed decisions into the current repository's review process without assuming the old chat file downloads were committed or currently match the implemented toolset.
