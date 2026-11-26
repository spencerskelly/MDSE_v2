# MDSE — Markdown Systems Engineering

MDSE is one linked engineering model kept as plain Markdown and YAML in an Obsidian vault. SysML v2 text in each note is the authoritative definition of structure and relationships. The files work without any tool; the tools are importers and views over those files.

This repository holds the rules, schemas and every tool that builds and serves an MDSE vault. It does **not** hold a model. Real engineering data never enters it ([DAT-002](governance/RULESET.md#dat--data-and-security)).

**New to the project? Read [docs/HANDOVER.md](docs/HANDOVER.md) first.** For an exact build and safe staging/live vault update, follow [docs/TOOLSET_UPDATE.md](docs/TOOLSET_UPDATE.md). The merged Workbench/importer implementation and outstanding runtime gates are recorded in [docs/BRANCH_CONSOLIDATION_2026-11-21.md](docs/BRANCH_CONSOLIDATION_2026-11-21.md) and [testing/WORKBENCH_IMPORTER_ACCEPTANCE.md](testing/WORKBENCH_IMPORTER_ACCEPTANCE.md).

## Where things are

| Path | What it is | Owner of |
|---|---|---|
| [`governance/`](governance/README.md) | Every governing file: definition, ruleset, decisions, open decisions, roadmap, architecture, schemas, AI instructions | What is true and what is decided |
| [`tools/core/`](tools/core/README.md) | Shared library: note format, identity, SysML block handling | One implementation of the model contract |
| [`tools/importer/`](tools/importer/README.md) | EA (`.qeax`) importer, later BOM, shipped as one offline HTML file | Turning source files into notes |
| [`tools/base-vault/`](tools/base-vault/README.md) | Builds the released Obsidian vault and its release manifest | What users receive |
| [`tools/bootstrap/`](tools/bootstrap/README.md) | Obsidian plugin: release check, plugin activation, author registration | Getting a person ready to work |
| [`tools/workbench/`](tools/workbench/README.md) | Obsidian plugin: navigate and (Phase 3) edit the model | The engineer's interface |
| [`testing/`](testing/README.md) | Oracles, synthetic fixtures, real-data test log | Proof that the tools follow the rules |
| [`docs/`](docs/) | Handover, history | Orientation |
| [`scripts/`](scripts/) | Repository checks | Keeping governance consistent |

## Status

| Phase | Scope | State |
|---|---|---|
| **P1** | EA import, Base Vault and Bootstrap, Workbench | Importer, Base Vault payload, Bootstrap and Workbench are implemented in source; full parser, real-vault acceptance, controlled release lock and first-open gates remain open. |
| P2 | BOM import, merge and approval | BOM importer and partial update scan exist; real-data acceptance and full approval flow remain open. |
| P3 | Workbench editing | Existing model editing and governed relationship actions are implemented, with synthetic tests; real Obsidian validation and release acceptance remain open. |
| **Four-workflow Workbench** | Document / Define / Structure / Verify; Canvas discovery; independent note and canvas editor tabs | Source and paired build merged through PR #8. Staging/live runtime acceptance still open; see [toolset update and acceptance](docs/TOOLSET_UPDATE.md).
| **PLM flows** | Flow drop-down beside the work areas; eleven flows with Submitted sections saved to `_ops/Flows` (D-0169) | Source, unit and fake-API browser tests on `main`; real Obsidian acceptance open. |

Details and milestones: [governance/ROADMAP.md](governance/ROADMAP.md).

## Run the checks

Requirements: Node 22 (`.nvmrc`), Python 3.12+ with `pip install -r testing/requirements.txt`, and Chromium for the browser smoke test (`python -m playwright install chromium`).

```bash
npm test                 # everything CI runs, except the parser gate (Java; CI runs it on every push to main)
npm run check:rules      # ruleset format and generated register
npm run build            # rebuild Workbench, then importer (the importer bundles the generated Workbench)
npm run check:workbench  # verify committed Workbench HTML and Obsidian plugin match source
npm run check:importer   # verify importer HTML and generated translation reference match source
```

## How work is done here

- Rules change only through [governance/DECISIONS.md](governance/DECISIONS.md) and [governance/RULESET.md](governance/RULESET.md), in the same commit.
- Workbench integration [PR #8](https://github.com/spencerskelly/MDSE_v2/pull/8) and importer safety [PR #9](https://github.com/spencerskelly/MDSE_v2/pull/9) were merged to `main`. Do not confuse source merge with a validated deployment to a live vault. Governance for normal `main` changes remains in [CONTRIBUTING.md](CONTRIBUTING.md).
- See [CONTRIBUTING.md](CONTRIBUTING.md).

## History

This repository replaces `spencerskelly/Test_Vault_` and `spencerskelly/MDSE_Workbench`, which are now read-only archives. What came across, and from where, is in [docs/HISTORY.md](docs/HISTORY.md).
