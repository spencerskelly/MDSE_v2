# History and provenance

## Before this repository

| Repository | Period | Now |
|---|---|---|
| `spencerskelly/Test_Vault_` | 2026-09 to 2026-10-19. V1 toolchain (importer v0.8.19, Base Vault v0.8, Bootstrap 0.3.x), then V2 research and pilot code | Read-only archive. Last commit carried from: `4a2b1540fd69d86c6953ae34139a02f8a983de25` |
| `spencerskelly/MDSE_Workbench` | V1 Workbench plugin to release 0.1.18 | Read-only archive |

The old repositories held decisions in five places (Ruleset 1.23, Workspace Decision Log W-01 to W-398, V2 ADRs and STEP notes, Workbench design notes, JSON registers) and mixed V1 and V2 work. On 2026-10-19 the owner consolidated every rule into one register, reviewed it in part, and started this repository (D-0000, D-0001).

## What came across

Only code with passing tests (D-0004), plus governing content.

| Here | From Test_Vault_ (commit `4a2b154`) | Change on arrival |
|---|---|---|
| `governance/RULESET.md` | MDSE Rules Register (owner-edited xlsx), built from Ruleset 1.23, Decision Log, V2 ADRs and contracts | Reorganised by tool and function; owner edits applied; new IDs; origins kept |
| `governance/MDSE_DEFINITION.md` | claude.ai Project doc `MDSE_Definition.md` | Paths updated; "documents to update" removed (moot) |
| `governance/OPEN_DECISIONS.md` | Register sheets "Conflicts" and "Open decisions" | Resolved items removed; OD-01 to OD-09 added |
| `governance/schemas/element-types.yaml`, `relationships.yaml`, `authors.yaml` | `99_System/03_Schemas/` | `relationships.yaml` marked under revision (D-0003) |
| `governance/schemas/ea-family-mapping.json` | `24_Workbench/registry/sysml_v2_approved_family_resolver.v0.1.json` | Renamed |
| `governance/ai/processes/AI-CR-01_Changelog_Review.md` | `99_System/02_AI/processes/AI_Process_Changelog_Review.md` | Renamed |
| `governance/ai/AI_INSTRUCTIONS.md` | `99_System/02_AI/AI_INSTRUCTIONS.md` | Rewritten for D-0003, D-0009, D-0010; stale lines removed (75-file folders, Local Model, YAML relationships) |
| `tools/core/src/mdse_core.js`, `classes.json` | `21_Importer/src/` | None |
| `tools/core/test/mdse_core.test.mjs` | `25_Testing/test_mdse_core.test.mjs` | Paths |
| `tools/importer/src/qeax_reader.js`, `importer.template.html` | `21_Importer/src/` | None |
| `tools/importer/build.mjs` | `21_Importer/build_importer_html.mjs` | Paths; output to `dist/mdse_importer.html` |
| `testing/oracles/mdse_note_format.py` | `21_Importer/mdse_note_format.py` | Schema path |
| `testing/oracles/test_*.py`, `cli/*.cjs` | `25_Testing/` (`test_v2_note_format.py`, `test_mdse_core_crosscheck.py`, `test_qeax_reader.py`, `test_importer_html_browser.py`, `mdse_core_cli.cjs`, `qeax_reader_cli.cjs`) | Paths |
| `testing/fixtures/golden-charger/` | `25_Testing/Fixtures/Golden Charger v2/` | Paths in README |
| `testing/fixtures/charger-connections/` | `25_Testing/Fixtures/Charger Connections v2/` | Header note |
| `testing/fixtures/sample-instrument/` | `20_Base Vault/Public Sample Vault/10_Model/Sample Instrument.md` | None |
| `testing/REAL_DATA_TEST_LOG.md` | `25_Testing/Real_Data_Test_Log.md` | None |
| `.github/workflows/ci.yml` parser job | `.github/workflows/v2-sysml-independent-parser.yml` | Paths; merged into one workflow |

Test results at carry-over: core 13/13, oracles 27/27, fixture pipeline 7/7, importer build current.

## What did not come across, and where it is

| Material | Archive location | Why not carried |
|---|---|---|
| V1 importer, Base Vault, Bootstrap, Workbench | `Test_Vault_/100_Archive/V1/`, `MDSE_Workbench` | V1 semantics (Local Model, YAML relationships); prior art for porting |
| Python V2 reference scripts (`v2_step03*.py`, phase 8/9 gates) | `Test_Vault_/21_Importer/`, `25_Testing/` | Research and gating code; not the product (ADR-V2-07) |
| Mapping rationale (approved family decisions) | `Test_Vault_/24_Workbench/docs/GOLDEN_IMPORT_*`, `99System/10_EA Native Translator/sysml-v2-decisions/` | Outcome carried in `ea-family-mapping.json` and RULESET.md; rationale stays as evidence |
| V1 EA mapping and disposition YAML, `local-model.yaml` | `Test_Vault_/99_System/03_Schemas/` | See `governance/schemas/README.md` |
| STEP, PASS, audit and recovery notes; 51 CI workflows | `Test_Vault_/26_Definitions/`, `29_SysMLv2_Translator_Workbench/`, `.github/` | Evidence of past runs, not rules |
| Workspace Decision Log | `Test_Vault_/55_Workspace/` | Its rules are in RULESET.md with W- origins |
