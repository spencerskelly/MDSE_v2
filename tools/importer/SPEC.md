# Importer specification

This file is the importer's definition (GOV-008). It describes what the tool does; the rules it must obey are in RULESET.md sections IMP, BOM and MOD, and they win if this file disagrees.

## Users and environment

- An engineer or model owner on Windows or macOS, offline, with Chrome or Edge (Firefox and Safari: ZIP output only).
- One HTML file, opened by double-click. No install, no network request, no runtime dependency. A browser test fails on any non-`file:` request.

## Modes

| Mode | Output | Deletes? |
|---|---|---|
| **New vault** | A ZIP containing the Base Vault payload plus generated notes, ledger and changelog | n/a |
| **Add to existing vault** | Writes into a folder the user selects | Never |

## Steps (user view)

1. **Start.** Select the source file; choose complete or partial import (package slice); choose the output (new ZIP or existing folder); select **pre-approved fields** (changes to these fields are applied for every note in this run).
2. **Run.** Progress, warnings, and a completion message. Fatal problems stop the run before any write.
3. **Validate.** Completion summary, counts reconciled to the source, folder check, link to the run's changelog.

## Processing (system view)

1. **Preflight (read-only).** SQLite header and integrity; WAL-mode files rejected; SHA-256 fingerprint of the whole file; table counts checked against the source profile; destination is a valid Base Vault with an initialized vault identity.
2. **Source graph.** Read `t_object`, `t_connector`, `t_package` (diagrams excluded). Every row gets exactly one ledger disposition: `native`, `alias_merged`, `evidence_only`, `deferred_review`, `excluded_by_policy`, `error`.
3. **Mapping.** Resolve each element and connector family through `governance/schemas/ea-family-mapping.json`. Unknown families are flagged, never mapped by fallback. Per-connector eligibility is checked even when the family is approved.
4. **Identity.** Match existing notes by UID (EA re-import) or PartNumber (BOM). New notes get a UID from EA created time and author, and an id continuing from the highest existing id per prefix (including retired notes and former ids).
5. **Write plan.** For every note: created, unchanged, added-to, pre-approved change, change awaiting review, conflict, or missing-from-source. Shown before anything is written.
6. **Write.** Through `tools/core`. Transactional: an Import State record before the first write; a failure leaves an explicit failed state, never a silent partial vault.
7. **Changelog.** Exactly one dated changelog per run, linking every changed file. No changelog when nothing changed.

## Merge behaviour (add to existing vault, and every re-import)

| Part of a note | Behaviour |
|---|---|
| Matched note | By UID (or PN), even if the user moved or renamed it |
| `id`, `uid` | Never change |
| User zone (text above the managed sections) | Never touched |
| Empty YAML property | Filled (addition) |
| Filled YAML property, including `subtype`, `eaType` and other EA-owned keys | Changed only if pre-approved or review-approved; otherwise a `flagConflict` in the body |
| `## Source: EA` body lines | New lines added; contradicting lines listed as conflicts |
| `## SysML v2` | Changed only by an approved change |
| Same UID, different type | Open: hard error (nothing written) or `flagConflict` (C-13) |
| Source record no longer present | `flagImport`; never deleted |
| Identical input | No change, no changelog |

This table replaces the ADR-V2-07 add-onto table; `tools/core` `mergeNote` still implements the old one (see tools/core/README.md).

## Milestones

| | Scope | Done when |
|---|---|---|
| **M2** | QEAX to notes: family resolver, typed relationship gates, UID/id allocation, notes in the ADR-V2-06 layout, ledger, changelog | Output equals the Python oracle on synthetic QEAX; an add-onto run twice is a no-op |
| **M3** | SysML v2 text from the canonical graph, one block per note; parser-check report format | The pinned parser accepts every generated block in CI; the report lists each note |
| **M4** | New-vault ZIP includes Base Vault, Bootstrap and Workbench builds | The extracted vault starts Bootstrap on first open |
| **M5** | Reduced QEAX, then full QEAX, run privately | Phase 1 gate (ROADMAP.md) |

## Unresolved MDSE-note connectors (D-0070)

An EA connector involving an MDSE-only note is converted to a descriptive YAML relation only if a current explicit mapping supports that meaning (`describes`, `affects`, `dependsOn`, or a non-SysML `hasChild`). When the meaning remains ambiguous, the importer creates a `flagLink` callout on the owning note (or the Unplaced Review Items holder), a Source: EA review line and a `deferred_review` ledger row with `PROVISIONAL_LINK`. The record retains the EA connector GUID and endpoints. **No new `tracesTo` YAML field or invented native SysML relationship is written.**

Pre-existing `tracesTo` YAML is historical data; it is not deleted or automatically migrated by this importer change. OD-01 remains open for the full legacy field inventory and round-trip behavior. Synthetic regression: `tools/importer/test/importer.test.ts` (IMP-115). The authoritative policy is `IMP-115` and `MOD-073` in `governance/RULESET.md`.

## Known gaps and open decisions

- OD-01 remains open for classification and migration of all legacy YAML relationship fields. D-0069/D-0070 already prohibit YAML copies of native SysML semantics and provisional `tracesTo` on new imports; other field-by-field decisions still block complete M2 semantic acceptance.
- OD-03 (usage identity inside SysML text) blocks stable re-import of usages.
- OD-04 (Import State for add-onto runs) blocks Phase 2.
- C-12 (path-length policy), C-13 (identity conflicts).
- Source profile (expected table counts per EA snapshot) and the EA field/tag dispositions were not carried; see governance/schemas/README.md.

## Prior art (archive, read-only)

`Test_Vault_` at commit `4a2b154`: V1 importer v0.8.19 (`100_Archive/V1/11_Importer`), Python reference algorithms (`21_Importer/v2_step03*.py`), approved mapping rationale (`24_Workbench/docs/GOLDEN_IMPORT_*`).
