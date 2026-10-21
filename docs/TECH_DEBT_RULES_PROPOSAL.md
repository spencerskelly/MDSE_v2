# MDSE v2 Cleanup — Rules Architecture Proposal

**Status:** Proposal for owner review  
**Branch:** `mdse_v2_cleanup`  
**Baseline date:** 2026-10-21  
**Authority:** Current `governance/RULESET.md`; this proposal changes no rule meanings, numbers, or statuses.

## Goal

Make MDSE understandable and implementable by a new software engineering team without requiring the team to reconstruct years of conversation or rely on archived repositories. Identify decisions, behavior, code and tests that did not carry forward during the V1-to-V2 migration.

## Repository boundaries

| Repository | Responsibility | Write policy |
|---|---|---|
| MDSE_v2 | Sole authority for tools, rules, schemas, tests, builds, documentation | Cleanup proposal and subsequent reviewed changes happen here |
| Engineering_Data | Variable, private engineering source inputs: EA exports, BOMs, reference datasets | Read-only for MDSE work; no assumptions that any given QEAX or BOM must exist |
| MDSE_v2_02git | Historical generated import and quality evidence | Preserve as comparison until a new import is accepted; never maintain tools independently |

Shipped plugin binaries, schemas, templates and configuration inside generated vaults are *reproducible release copies*, not competing tool authority.

## Rules organization (logical sections only)

Existing IDs (`GOV-xxx`, `MOD-xxx`, `IMP-xxx`, etc.), original texts, decision links and statuses remain unchanged until explicitly reviewed. The new headings are navigational classification, not new identifiers.

### 00 — Product definition and governance
- 00.01 Purpose, users, scope
- 00.02 System boundary, inputs, outputs, repositories
- 00.03 Authority, precedence, lifecycle
- 00.04 Tool ownership and shared contracts
- 00.05 Change control, decisions, compatibility
- 00.06 Confidentiality and real-data separation
- 00.07 Supported platforms and environments

### 10 — Canonical model contract
- 10.01 Entities, definitions and usages
- 10.02 Model type system and classification
- 10.03 Immutable identity, authors, source identity
- 10.04 Definition/usage semantics and ownership
- 10.05 Relationship types and endpoint legality
- 10.06 Containment, nested usages, reference usages
- 10.07 Ports, interfaces, connectors and flows
- 10.08 Requirements, verification and allocation
- 10.09 Actions, states, transitions and succession
- 10.10 Attributes, calculations, constraints and analysis
- 10.11 SysML v2 authoritative representation
- 10.12 Unsupported constructs and controlled deferrals

### 20 — Storage and data integrity
- 20.01 Note sections and managed/user content boundaries
- 20.02 Frontmatter definitions, order, defaults
- 20.03 Naming, folders, paths and collisions
- 20.04 Source provenance and revisions
- 20.05 Status, retirement and lifecycle
- 20.06 Merge, add-on imports and review approval
- 20.07 Transactional persistence and failure recovery
- 20.08 Flags, conflicts and review evidence
- 20.09 Derived relationships, indexes and where-used
- 20.10 Attachments and ownership

### 30 — Source adapters and translation
- 30.01 Shared import pipeline and dispositions
- 30.02 EA/QEAX reader, typed graph, family mapping
- 30.03 BOM reader, part/revision/usage translation
- 30.04 Row-level traceability and reconciliation
- 30.05 Planning, dry-run and import reporting

### 40 — Vault and runtime
- 40.01 Base Vault skeleton and defaults
- 40.02 Plugin payloads and integrity
- 40.03 Bootstrap, first-open and author registration
- 40.04 Updates, compatibility and preferences
- 40.05 Offline distribution and packaging
- 40.06 Release manifest and repeatable builds

### 50 — Engineer and AI interactions
- 50.01 Navigation and search
- 50.02 Element inspection and definitions panel
- 50.03 Structure and internal views
- 50.04 Behavior and functional views
- 50.05 Requirements/verification traceability
- 50.06 Edit preview, apply, undo, and validation
- 50.07 Flags, conflict and issue reviews
- 50.08 Personal settings and saved views
- 50.09 AI operations and review workflows

### 60 — Verification and acceptance
- 60.01 Rule-to-test traceability
- 60.02 Model integrity and consistency
- 60.03 SysML syntax and semantic checks
- 60.04 EA/BOM input-to-output reconciliation
- 60.05 Idempotency and merge/approval checks
- 60.06 Browser/Obsidian/OS acceptance
- 60.07 Scale, performance and resilience
- 60.08 Golden-import and release gates

## Required rule classification fields

The full index will preserve the existing rule text and ID, and add non-normative metadata:

| Field | Description |
|---|---|
| rule_id | Permanent existing rule identifier |
| original_family | Existing GOV/MOD/IMP/BOM/BAS/BOO/WKB/AIP/TST/DAT family |
| proposed_section | Proposed section/subsection above |
| status | Preserve existing Active/Check/Proposed/Unreviewed |
| phase | Preserve existing phase |
| applies_to | One or more of core, ea-importer, bom-importer, base-vault, bootstrap, workbench, testing, governance |
| origins | Existing REG/W/V2/R/D references |
| implementation_evidence | Code/test locations or unverified |
| migration_disposition | current, partial, missing, conflict, historical, needs-review |
| reviewer_decision | Blank until owner review |

**Do not** treat classifications or implementation evidence as changes to rule approval. One rule may apply to multiple components. Tool-specific specifications should be generated as views from one authoritative register, not manually maintained copies.

## Migration completeness audit

1. Inventory current rules, archived V1/V2 decisions, current schemas, implementation and tests.
2. Confirm migrated rule ancestry, including decisions approved after earlier snapshots.
3. Detect preserved decisions with missing code.
4. Detect previous approved behavior absent from current rules.
5. Detect active legacy wording inconsistent with later V2 decisions.
6. Detect duplicate prescriptions in separate families.
7. Produce review rows referencing exact existing IDs, code paths and decision evidence.
8. Propose dispositions; never silently retire, renumber or modify rules.

Initial review candidates (not pre-decided): `GOV-006`, `GOV-010`, `GOV-018`, `MOD-012`, `MOD-028`, `MOD-037`, `MOD-044`.

## Suggested reading/build sequence

1. **All engineers:** Product definition (00), canonical contract (10), persistence contract (20).
2. **Core team:** Implement/test sections 10 and 20 independently of any importer.
3. **Importer team:** Section 30; consume only shared core contracts and preserve source provenance.
4. **Runtime team:** Section 40; deliver deterministic base-vault, Bootstrap, and release artifacts.
5. **Workbench team:** Section 50; derived index and editors must respect the canonical model.
6. **QA team:** Section 60; tests independently verify the requirements, with real-data evidence private.

## Cleanup sequence and review deliverables

- **C01 — Baseline:** exact source commit, existing rules and status inventory.
- **C02 — Rule mapping:** all current rules mapped to sections, affected components, ancestry; no wording changes.
- **C03 — Migration audit:** preserved/missing/partial/conflicting decisions, code and tests.
- **C04 — Proposed structural rewrite:** navigable human-readable ordering plus component-filtered indexes.
- **C05 — Documentation unification:** eliminate contradictory implementation status and duplicate authority.
- **C06 — Verification:** check every rule ID/text/status retained, references resolve, rule register regenerates and tests pass.
- **C07 — Owner review:** accept/revise proposal prior to integrating it with `main`.

## Acceptance

- All existing rules accounted for exactly once in the canonical rule index.
- Original identifiers, text, history, phase and statuses unchanged absent explicit approval.
- Every rule has logical topic and component applicability.
- Known V1/V2 migration gaps appear as actionable findings, not guessed fixes.
- Only MDSE_v2 owns maintained tool source and normative governance.
- No changes to Engineering_Data or MDSE_v2_02git.
- `main` remains untouched until the proposal is reviewed and approved.

## Open feedback

1. Confirm the seven proposed sections and subsection order.
2. Confirm whether each rule should have one primary section with multiple component labels (recommended).
3. Review the first full rule mapping and migration findings before moving the normative RULESET text.
