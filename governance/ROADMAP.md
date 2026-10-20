# Roadmap

Plans, sequence and acceptance gates. Plans are not rules: a change here needs no decision unless it changes scope (MDSE_DEFINITION.md) or a rule (RULESET.md).

## Phase 1 — EA import, Base Vault and Bootstrap, read-only Workbench

**Gate:** the real EA model is imported with every source row dispositioned and counts reconciled; re-import of the same input changes nothing; a fresh vault opens on Windows and macOS with plugins active and no installs; the Workbench shows the real model's SysML v2 structure, checked against the source.

Work in this order. Each step lists the ruleset rules it implements; filter `rules-register.csv` by Phase = P1.

| Step | Work | Rules | Done when |
|---|---|---|---|
| 0 | Owner decisions that block P1 | [OPEN_DECISIONS.md](OPEN_DECISIONS.md) items marked P1, first OD-01, OD-03, OD-07 | Each decided and recorded in DECISIONS.md |
| 0 | Owner review of Unreviewed P1 rules | MOD and IMP sections, status Unreviewed | P1 rules are Active, Check or retired |
| 1 | Model contract in `tools/core` (TypeScript) | MOD | Core library implements note format, identity, flags, SysML block handling; oracle cross-check passes |
| 2 | EA importer: QEAX to notes (milestone M2) | IMP, MOD | JS/TS output equals the Python oracle on synthetic QEAX; add-onto run twice is a no-op |
| 3 | SysML v2 writer and parser report (M3) | MOD (SysML v2 authority), TST | The pinned parser accepts every generated block in CI; report lists each note |
| 4 | Base Vault build and Bootstrap (M4) | BAS, BOO | Extracted vault starts Bootstrap on first open in Obsidian, Windows and macOS |
| 5 | Read-only Workbench | WKB | Navigation, note view, SysML structure view and saved views work on the synthetic vault |
| 6 | Real QEAX acceptance (M5) | TST | Phase 1 gate met on the reduced QEAX, then the full QEAX, run privately; issues logged in `testing/REAL_DATA_TEST_LOG.md` |

## Phase 2 — BOM import, merge and approval

**Gate:** each BOM imports with every row dispositioned; only additions, pre-approved and review-approved changes reach existing notes; conflicts are flagged in the body and listed in the changelog; parents with mismatched child revisions are flagged and the child bodies list the older-revision usage; empty source fields do not appear; exactly one changelog per run; re-import changes nothing; AI-CR-01 has run before an engineer reads the changelog.

Blocked by OD-04 (Import State for add-onto runs). BOM list: open decision DEC-2.

## Phase 3 — Workbench editing

**Gate:** Workbench edits are saved to the vault, follow the rules (invalid edits rejected), and survive re-import; a conflict resolved in review does not return on the next import.

## Later

Third-party documentation output; validation after editing is stable; GSE charger BOMs; EA diagrams (deferred until the golden import is accepted); cross-vault.

## Acceptance evidence

A gate is met only by evidence: a CI run for synthetic checks, and a private real-data run recorded by file name in `testing/REAL_DATA_TEST_LOG.md`. Synthetic results never satisfy a real-data gate. Syntax parsing, semantic validation, user-interface acceptance and release acceptance are separate gates.

## Program goals (carried plan)

Goals G01 to G12 from the V2 programme: G01 to G08 are Phase 1 (governance, SysML catalog, canonical graph and UID, EA translator, parser and note writer, Base Vault, read-only Workbench, CI and golden acceptance); G09 editing and re-import; G10 BOM; G11 Bootstrap and team updates; G12 cross-vault and distribution. Priority: canonical decisions first; then verified entrypoints, CI and pins; then one small approved EA slice end to end; then scale.
