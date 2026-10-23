# Changelog

Notable changes to the toolchain and its governance. Newest first. Tool releases are also recorded in the release manifest once `tools/base-vault` exists.

## Unreleased

- Language reference: 123 notes in three groups (109 language constructs, 12 standard-library concepts, 2 modeling patterns). Adds conditional succession, derivation, causation, multicausation, trade study, verdicts, verification methods, quantities and units, rationale/issue/status/refinement metadata, shape items. Corrects the succession, use case and individual notes. Each note separates documented, recognized, written by the importer, and parser-accepted (not established). D-0044, MOD-165, MOD-166. 
- Native SysML v2 forms: requirement derivation is written `#derivation connection` and refinement `#refinement dependency`, by the importer and the Workbench Edit lens; the old comment-tag forms are still read. Rules can be tagged `live` to find documentation updates. D-0045, MOD-168, MOD-169, IMP-128, WKB-025. Closes OD-09.
- Workbench: draw a line between two note cards on the canvas preview, pick the relationship kind from a drop-down, review the diff and apply (undoable). WKB-024, D-0043. Tested against the fake Obsidian API only.

## 2026-10-21 — Release 0.9.0: Workbench views, import checks, toolset version, usage naming

- Workbench 0.9.0: separate Structure, Design types, Internal, Function, States and Requirements views; every section and list group folds; Notes list can be grouped; measured quantities print their unit (was `NaN`). WKB-022, WKB-023.
- Importer: "Check for flags first" (dry run, verdict, grouped flag list, CSV); version table of the vault's toolset against the importer's with an update on/off tick box; usage and definition names keep `+`, `-`, decimals and numbers, and same-named ports are told apart by type. IMP-124, IMP-125, IMP-126.
- First real version: the repository and the vault release were `0.0.0-dev`; both are now `0.9.0`. D-0041.

## 2026-10-19 — Repository established

- Created from the owner-reviewed Rules Register and the proven parts of `Test_Vault_` (see [docs/HISTORY.md](docs/HISTORY.md)).
- `governance/RULESET.md` is the single ruleset: 327 rules (100 Active, 3 Proposed, 3 Check, 221 Unreviewed) and 38 retired.
- Carried with their tests: core note-format library, QEAX reader, single-file importer build, Python oracles, Golden Charger and Sample Instrument fixtures, schemas, EA family mapping, AI-CR-01.
- Decisions D-0000 to D-0014 recorded.
