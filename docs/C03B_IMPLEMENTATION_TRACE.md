# C03B — Implementation and Test Traceability

**Status:** Evidence pass against `mdse_v2_cleanup` (2026-10-21). **Not a successful test execution**: tests were inspected in GitHub, not run by this audit.  
**Authoritative rule file:** `governance/RULESET.md`; the C02 mapping is provisional.

## Evidence matrix: current implementation and test files

| Domain / representative rules | Implementation evidence | Test evidence | Assessment |
|---|---|---|---|
| UID / author codes (MOD-002, MOD-013, MOD-019) | `tools/importer/src/identity.ts`, `tools/bootstrap/src/main.js` | `tools/bootstrap/test/bootstrap.test.mjs` checks Bootstrap–Importer author-code agreement; `tools/workbench/test/edit.test.ts` checks UIDs on new notes | Direct tests exist; complete identity namespace across all entrypoints not verified |
| IDs / new notes (MOD-005, MOD-020) | `tools/importer/src/identity.ts`, `tools/workbench/src/edit.ts` | `tools/workbench/test/edit.test.ts` checks next sequential IDs and UID uniqueness | Direct evidence for new-note path; historic ID migration needs review |
| QEAX read + disposition (IMP rules; TST) | `tools/importer/src/ea_source.ts`, `run.ts`, `ea_mapping.ts` | `tools/importer/test/importer.test.ts` asserts `ledger.length == packages + elements + connectors` and each row has disposition | Synthetic row accounting tested; this does not establish zero semantic loss on real QEAX |
| EA naming / symbol normalization (IMP-124) | `tools/importer/src/naming.ts` | `tools/importer/test/preflight.test.ts` directly tests signed voltages, decimals and duplicate port-name handling | Direct synthetic tests |
| Source conflict & import merge (IMP; merge decisions) | `tools/importer/src/merge.ts` | `tools/importer/test/importer.test.ts` and merge behavior source inspection | Present, but conflicts with legacy core merge contract |
| Legacy merge implementation (previous V1 rule) | `tools/core/src/mdse_core.js` `mergeNote` | `tools/core/test/mdse_core.test.mjs`: test expressly asserts rerun *refreshes* SysML and Source | **Confirmed test-backed contradiction:** obsolete behavior remains encoded and defended by a test |
| BOM part definitions / usage / quantities (BOM) | `tools/importer/src/bom.ts`, `xlsx_reader.js` | `tools/importer/test/bom.test.ts` verifies a unique part per number, parent-owned usages, revisions, multiplicity and measured units | Direct tests for synthetic layouts; heterogeneous new BOMs not proven |
| Bootstrap author and package integrity (BOO, BAS) | `tools/bootstrap/src/main.js`, `tools/base-vault/src/base_vault.ts` | `tools/bootstrap/test/bootstrap.test.mjs` verifies plugin hashes, manifest and author code | Automated checks exist; no real Obsidian startup acceptance established here |
| Workbench index / relationship semantics (WKB) | `tools/workbench/src/index.ts`, `sysml_scan.ts`, `views.ts` | `tools/workbench/test/workbench.test.ts` verifies relationships, provenance of SysML scanner, parts roll-up and parser not-run status | Synthetic checks exist; scanner is not independent SysML parser |
| Workbench editing (WKB) | `tools/workbench/src/edit.ts`, `edit_rel.ts`, `edit_port.ts` | `tools/workbench/test/edit.test.ts`, `edit_rel.test.ts`, `edit_port.test.ts` | More implemented than older README claims; real plugin integration still unverified |
| Workbench package (BAS/WKB) | `tools/workbench/src/plugin.ts` | `testing/oracles/test_workbench_plugin.py` | Fake Obsidian API integration test exists; does not prove first-open in actual Obsidian |
| Parser acceptance (MOD/TST) | Import run explicitly documents 'parser not checked' status | `tools/workbench/test/workbench.test.ts` expects `parser = not-run`; independent parser gate in CI | Honest status behavior tested, but these tests do not mean a real imported vault is parser-certified |

## Priority dispositions

1. **MIG-002 — CONFIRMED CONFLICT:** Shared core `mergeNote` rerun overwrites EA-owned source and SysML text, and its tests assert this refresh. Current importer `planMerge` instead requires preapproval to replace existing SysML and logs conflicts. Locate every callsite, nominate one canonical merge contract, and rewrite the redundant implementation and test only after owner approval. This is a **semantic risk**, not merely duplicate code.
2. **MIG-001 — CONFIRMED CONFLICT:** D-0003 mandates native SysML authority while `relationships.yaml` continues to declare persisted YAML inverse relationships (acknowledged OD-01). Decide field-by-field before changing schema.
3. **MIG-005 — CONFIRMED DOC DRIFT:** Workbench source/test files implement edits, whereas README calls editing both present and absent. Reconcile versions and claims with tests and release payload.
4. **MIG-007 — PARTIAL EVIDENCE:** `planMerge` exists but does not establish full vault Import State add-on behavior. Need integrated tests with persisted state.
5. **MIG-010 — TEST/REPORT GAP:** The importer marks parser blocks as unchecked and Workbench exposes the condition correctly. Real imported SysML conformance still requires an independent, pinned parser run.
6. **MIG-011 — PARTIAL EVIDENCE:** Base Vault hash/payload tests exist, but actual installation and plugin activation should be tested in Obsidian.

## Why the first-pass 'not carried' concern should be treated carefully

- A missing old source file can be intentional retirement, not lost work.
- A current test can *prove* outdated behavior remains in the product or library; more tests are not automatically better.
- A build artifact containing tool code is legitimate when generated from MDSE_v2, but any independent hand-maintained copy is not.
- Use `confirmed`, `partial`, `unverified`, `historical` and `conflict` separately rather than one blanket 'missing' status.

## Follow-up traceability work

The audit must still visit **each of the 386 rules individually** and provide exact corresponding implementation/test locations or explicit `not applicable` / `no evidence located`. C02 rows have not yet been individually verified. The review priorities are: model semantic authority, duplicate implementations, EA directional connectors and omissions, BOM merges/revisions, identifier stability, transactional editing, and parser results.

No rules, code, schema, private data, or generated production vault were changed by C03B.
