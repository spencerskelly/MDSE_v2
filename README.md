# MDSE — Markdown Systems Engineering

MDSE is one linked engineering model kept as plain Markdown and YAML in an Obsidian vault. SysML v2 text in each note is the authoritative definition of structure and relationships. The files work without any tool; the tools are importers and views over those files.

This repository holds the rules, schemas and every tool that builds and serves an MDSE vault. It does **not** hold a model. Real engineering data never enters it ([DAT-002](governance/RULESET.md#dat--data-and-security)).

**New to the project? Read [docs/HANDOVER.md](docs/HANDOVER.md) first.**

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
| **P1** | EA import, Base Vault and Bootstrap, read-only Workbench | In progress. QEAX reader, note format, merge and ZIP writer are built and tested. QEAX-to-notes, SysML writer, Bootstrap and Workbench are not built. |
| P2 | BOM import, merge and approval | Rules drafted, blocked by [OD-04](governance/OPEN_DECISIONS.md) |
| P3 | Workbench editing | Not started |

Details and milestones: [governance/ROADMAP.md](governance/ROADMAP.md).

## Run the checks

Requirements: Node 22 (`.nvmrc`), Python 3.12+ with `pip install -r testing/requirements.txt`, and Chromium for the browser smoke test (`python -m playwright install chromium`).

```bash
npm test                 # everything CI runs, except the parser gate (Java; CI runs it on every push to main)
npm run check:rules      # ruleset format and generated register
npm run build:importer   # rebuild tools/importer/dist/mdse_importer.html after changing tools/core or tools/importer
```

## How work is done here

- Rules change only through [governance/DECISIONS.md](governance/DECISIONS.md) and [governance/RULESET.md](governance/RULESET.md), in the same commit.
- Changes go straight to `main`; CI must stay green ([GOV-001](governance/RULESET.md#governance)).
- See [CONTRIBUTING.md](CONTRIBUTING.md).

## History

This repository replaces `spencerskelly/Test_Vault_` and `spencerskelly/MDSE_Workbench`, which are now read-only archives. What came across, and from where, is in [docs/HISTORY.md](docs/HISTORY.md).
