# MDSE toolset — as-built baseline against current repository

**Captured:** 2026-10-21, cleanup branch `mdse_v2_cleanup`.  
**Source-of-truth for this snapshot:** exact code and test paths in `spencerskelly/MDSE_v2`; initial parent commit `54f7448d3dd5`.  
**Assessment method:** GitHub source, test and build-configuration inspection. **No test execution or actual Obsidian session took place for this review.**

## Why we are starting here

Before defining more requirements or inventing new functional implementations, map the software that already exists onto the sixteen Engineering Knowledge Base use cases and six proposed logical functions. Preserve approved decisions and test-backed work. Do not mistake a test's existence for its execution or treat a proposal as implemented.

## Actual code architecture

| Existing component | Location and implementation | Key capability in source | Test definitions present | Acceptance evidence |
|---|---|---|---|---|
| [[OBJ-00001 - MDSE Importer]] | `tools/importer/` JavaScript/TypeScript + offline HTML | QEAX and BOM source handling; mapping, identities, ledger, flags, new ZIP and add-to-folder; toolset update | `importer.test.ts`, `bom.test.ts`, `preflight.test.ts`, `vault_update.test.ts`, browser oracle | Real QEAX/BOM and full parser acceptance not established by this review |
| [[OBJ-00002 - MDSE Core]] | `tools/core/src/mdse_core.js` | Parsing, note validation, SysML sections, ZIP, UID lookup and legacy merge | `mdse_core.test.mjs`, independent format cross-check | Conflict with newer importer merge; TypeScript governance not yet met |
| [[OBJ-00003 - MDSE Workbench]] | `tools/workbench/src/`; HTML + Obsidian plugin | Index, structure, functional/requirements traces, viewpoints, tables, canvas, edits, flags, alias/merge | `workbench.test.ts`, `edit.test.ts`, `edit_rel.test.ts`, `merge.test.ts`, plugin oracle | Real Obsidian acceptance not established; missing specific requested searches/queries |
| [[OBJ-00004 - MDSE Base Vault]] | `tools/base-vault/src/base_vault.ts` | Vault skeleton, plugin payload/lock, templates, configured assets | Bootstrap payload tests, vault-update tests | Readme contains contradictory status; first-open acceptance not established |
| [[OBJ-00005 - MDSE Bootstrap]] | `tools/bootstrap/src/main.js` | Plugin hash verification, activation/config repair, author registration | `bootstrap.test.mjs` | Tested with stand-in Obsidian API, not accepted in actual Obsidian |

**CI caveat:** The current `.github/workflows/ci.yml` automatic jobs run core, build consistency, Python oracles, synthetic fixtures and data policy. They do **not** include the importer TypeScript, Workbench or Bootstrap test suites, even though `npm test` includes those suites. The independent SysML parser job requires manual dispatch with its parser input enabled, and the push trigger covers `main` only—not this cleanup branch. No recent green CI assertion is made here.

## Functional coverage against the six logical functions

| Function | Existing implementation reuse | Key unproven or missing behavior |
|---|---|---|
| [[BEH-00002 - Ingest and Reconcile Engineering Sources]] | QEAX reader, EA family mapping, part/port/flow translation, BOM layouts, preflight, identity, ledger and merge | PDF/word/image source adapters; real full-data acceptance; shared conflict/merge contract |
| [[BEH-00003 - Discover and Resolve Model Elements]] | Workbench search by ID/title/SysML symbol/body, note index and alias/merge operations | **Name/alias search:** `views.search()` omits aliases, SysML block and arbitrary YAML properties |
| [[BEH-00004 - Query and Traverse Model Relationships]] | Typed edge index, where-used, traversal profiles, depth and cap, structure and verification | **Shared linked elements from 2+ seeds** not found; large-scale semantic acceptance |
| [[BEH-00005 - Generate Engineering Model Viewpoints]] | Profiles, tables, canvas preview/saved views, requirements/functional/structure displays, flags | General document-form/outline perspectives, real Obsidian usability |
| [[BEH-00006 - Compose and Exchange Engineering Knowledge]] | CSV exports and Obsidian-native `![[...]]` transclusion | Governed composition and customer/supplier publication/export workflows |
| [[BEH-00007 - Maintain and Improve Model Knowledge]] | Create/edit element and relations; flag review; controlled importer merge; alias/survivor merge | **Legacy core automatic overwrite** contradicts importer approval-first behavior; approvals and closure end-to-end |

## Sixteen-use-case mapping

[Machine-readable as-built use-case evidence](AS_BUILT_USE_CASE_EVIDENCE.csv) captures each `UC-00001`–`UC-00016` with source files, exact named test files, observed capabilities and gaps. Classification is:

- **source-and-tests:** implementation and corresponding test *definitions* found; tests not executed in this review.
- **partial:** some requested behavior exists, but the use case is broader than the current implementation.
- **conflict:** two current implementations prescribe incompatible semantics.
- **native-platform-only:** an underlying Obsidian capability exists, not a demonstrated MDSE workflow.
- **no-implementation-evidence:** no matching implementation located in inspected current files; absence is not mathematically proven.

## Source implementation details worth preserving

### Import and core

- The importer page accepts `.qea/.qeax/.sqlite/.db` for EA and `.xlsx/.xlsm/.csv/.tsv/.txt` for BOM input. The old `.xls` path is refused. **These are the advertised accepted files, not a generic document/image adapter.**
- The QEAX source reader includes objects, connectors, packages, object tags and `t_document` attachments; it intentionally excludes EA diagrams. An attached document **inside a QEAX** is not proof of standalone PDF/DOCX import.
- Importer tests name row disposition, assembled symbol references, flags, nested structural usage, the preservation of attachments and repeated-import behavior.
- BOM tests address flat/redline layouts, one definition per part number, owner usages, revisions, alternates, and import conflicts. EA/BOM possible matches are **reported**; the test explicitly states no automatic link is created.
- Preflight groups flags before writing. The vault update path preserves personal content while replacing managed configuration with backups where appropriate.
- The importer `merge.ts` requires preapproval before changing existing SysML or nonempty fields, but `core/mdse_core.js` still has legacy `mergeNote` that refreshes them. This conflict is backed by both sets of tests.

### Workbench

- The index uses `byName` keyed by the **filename stem**, while `views.search()` scores ID, title, SysML symbol and body. The current search implementation **does not search aliases** (even though `merge_ops.ts` can create `aliasOf` links and record former names during a merge).
- `views.traverse(ix, start, profile, depth, cap, spec)` accepts **one start node**; it supports hops, filters and caps. Multi-seed intersection was not found.
- Visual profiles exist for Structure, Where used, Requirements, Verification, Behavior, Interfaces, Allocation, Dependencies, Documentation, Functional/Requirements traces and Everything.
- Table views and CSV export, previews and saved Obsidian Canvas are implemented in source. A generalized document/narrative viewpoint builder was not established.
- The review queue, flagged-only table filters, issue-status and flag-removal edits are present; resolving a callout is not proof that a model inconsistency was corrected.
- Editing, relationship amendments, port/interface editing and alias-driven note merge code and tests exist. The current Workbench README contradicts itself on whether editing is implemented.

## Three immediate preservation / correctness risks

1. **Do not replace existing QEAX/BOM import and Workbench views with new designs** until the current code paths and test behavior have been reconciled with the approved semantics.
2. **Fix the split merge authority before relying on reimport/edit correctness.** Also correct the importer page help text describing automatic refresh, which conflicts with the approval-only merge implementation.
3. **Bring existing test suites into the actual CI gate** and record parser/real-Obsidian acceptance separately. Merely having unit-test source is not a release gate.

## Recommended next engineering step

Review one actual implemented capability at a time. Start with **Existing Source Import — As Built**: source-format handlers, normalization, identity, family mapping, ledger, merge and output, with current code/test references. Then derive only missing requirements, reuse existing behavioral definitions, and close contradictions. Follow with the same treatment for model search, graph traversals and views.

**This audit changes no normative rule, production source, model decision or tests.** Native SysML relationships among tool notes remain proposals until verified with the independent parser.
