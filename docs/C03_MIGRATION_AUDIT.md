# C03 — Migration Completeness Audit (first evidence pass)

**Branch:** `mdse_v2_cleanup`  
**Baseline:** 2026-10-21; read-only examination of the branch's decisions, rules, schema and selected implementations.  
**Status:** Preliminary evidence-backed findings. Not a declaration that every historical decision has been fully reconciled.

## Principles

- No renumbering, rewriting or automatic retirement of any existing rule.
- A rule may survive as historical evidence without being binding on V2.
- Distinguish **conflicting authority**, **code drift**, **documentation drift**, and **unverified capability**.
- Tool tests must demonstrate behaviors, not merely the presence of functions.
- The 386-row proposal register is an inventory; its empty evidence fields are not findings of missing code.

## Confirmed findings / evidence

| ID | Severity | Area | Evidence | Finding | Required action |
|---|---|---|---|---|---|
| MIG-001 | High | SysML relationship authority | D-0003 says native SysML relationships live *only* in the SysML block; `governance/schemas/relationships.yaml` at version 1.36 still defines `subtypeOf/supertypeOf` and persisted inverse fields. OD-01 acknowledges this. | Accepted authority decision and active schema conflict. | Classify every schema field into SysML native versus MDSE metadata, then migrate schema and consumers together after decision. |
| MIG-002 | High | Merge owner | `tools/core/src/mdse_core.js` contains `mergeNote` logic that refreshes EA-owned fields and replaces Source: EA/SysML. `tools/importer/src/merge.ts` separately implements approval-only, additive `planMerge` (D-0014). | Core is not the only maintained implementation of merge semantics, and the two code paths differ. | Decide canonical merge API and move normalized behavior into shared core with regression tests; do not remove either until caller coverage is proven. |
| MIG-003 | High | Governance consistency | GOV-005 gives MDSE_v2 sole tool authority; GOV-006 still prescribes direct pushes to Test_Vault_ as an Active rule with a note explaining supersession by GOV-001. | Historical repository behavior remains binding in literal wording despite newer decision. | Explicitly mark legacy implementation clause as superseded through an approved rule decision. |
| MIG-004 | High | Build handover | Root `README.md` / `docs/HANDOVER.md` claim Workbench/Bootstrap/QEAX-to-notes are not built; tool READMEs and `CHANGELOG.md` document implemented features, with package version 0.9.0. | Team handover understates capabilities and may cause repeated development. | Rewrite status from verified code, tests, and releases; make one current-state source. |
| MIG-005 | High | Workbench edit contract | `tools/workbench/README.md` describes Edit lens and SysML writes but also calls Workbench read-only, says 'never edits SysML', and lists 'editing ... not done'. | Internally contradictory tool specification, high chance of a new team implementing wrong scope. | Split released, implemented-but-unverified, and future editing capabilities; reconcile with actual tests. |
| MIG-006 | Medium | Identity and portability | OD-03 and REG-265 still require verification of stable SysML usage short-name tokens. | No completed independent parser acceptance evidence established in this pass. | Verify syntax against pinned parser, then link test and decision. |
| MIG-007 | High | Re-import | OD-04/C-11/C-15 describe incompatible import-state and add-on requirements; `tools/importer/src/merge.ts` already supports add-on merge planning. | Documented block may not match current implementation; run-level transaction state not proven here. | Test actual destination and state handling; decide and update rules/implementation consistently. |
| MIG-008 | Medium | Old V1 semantics | `MOD` Local Model subsection contains 13 Unreviewed entries. D-0003 and OD-08 anticipate native v2 usages instead. | Historical Local Model requirements coexist with V2 rules and need explicit compatibility/retirement disposition. | Review every Local Model entry; preserve historical lineage, retire only through decision. |
| MIG-009 | Medium | Documentation provenance | `docs/HISTORY.md` documents the carried snapshot `4a2b154` and excludes many research tools. `DECISIONS.md` D-0004 explicitly carries only tested code. | Earlier work absent from production is not automatically lost; some was intentionally left as archived evidence. | Cross-check excluded material for unique accepted decisions and tests, not blanket-import archived code. |
| MIG-010 | Medium | Real-data acceptance | `testing/REAL_DATA_TEST_LOG.md` has no entries while a separate generated private vault includes real import ledgers and flags. | No consolidated index of observed real-data issues within tool governance; does not prove the runs never happened. | Add sanitized run references and issue summaries without copying private model data. |
| MIG-011 | Medium | Release evidence | `tools/base-vault/README.md` simultaneously says plugins are shipped and that payload/release manifest work remains unbuilt. | Release documentation is inconsistent and integration/first-open proof is uncertain. | Verify actual bundle and release manifest, clean up documentation based on evidence. |
| MIG-012 | Medium | V1 rule conflicts | `governance/OPEN_DECISIONS.md` already enumerates C-1 through C-18, including legacy path policy, Boundary interpretation, Dataview and folder limits. | Conflicts already documented must not disappear in the proposed reorganization. | Retain stable crosswalk linking C-items to rule IDs and closure decisions. |

## Immediate interpretation

The first audit confirms that migration debt is not just missing files. It includes:
1. **Authority drift** — accepted decisions not applied consistently to schemas.
2. **Implementation duplication** — alternate merge logic in core and importer.
3. **Status drift** — handover documentation lags actual tool development.
4. **Unresolved legacy rules** — migrated V1 clauses still visible and sometimes Active.
5. **Test-evidence gaps** — large generated output does not establish full parser or runtime acceptance.

## Next evidence pass (C03 continuation)

1. Match each `GOV`, `MOD`, `IMP`, `BOM`, `BAS`, `BOO`, `WKB`, `AIP`, `TST` rule to concrete implementation/test locations.
2. Extract all decisions and changed-rule IDs in D-0000 onward; flag dangling and outdated references.
3. Compare archived approved translation families to current `ea-family-mapping.json` with specific examples.
4. Review reader/writer semantics for duplicate storage of native SysML meaning.
5. Reconcile parser, Obsidian first-open, and re-import tests against actual run evidence.
6. Update `rules-cleanup-proposal.csv` with dispositions only when justified by specific evidence.

## No-action safeguards

This pass makes **no** semantic changes to `RULESET.md`, `DECISIONS.md`, schemas or tools. It does not alter private engineering sources or the generated vault.
