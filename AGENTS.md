# Instructions for AI agents working in this repository

You are working on the MDSE toolchain repository, not on an engineering vault.

1. Read [governance/README.md](governance/README.md), then the parts of [governance/RULESET.md](governance/RULESET.md) that cover the tool you are changing.
2. Follow [CONTRIBUTING.md](CONTRIBUTING.md). In particular: a change in meaning needs a `D-nnnn` decision and a ruleset edit in the same commit. When working on the approved four-workflow review branch, keep changes on that branch until explicit merge approval; do not claim release acceptance from source-only tests.
   **For Workbench, importer or Base Vault changes, read and update [docs/TOOLSET_UPDATE.md](docs/TOOLSET_UPDATE.md).** Rebuild the Workbench **then importer** with `npm run build`, run the matching check/test scripts, and keep committed generated artifacts synchronized before merging or distributing.
3. Rules with status `Unreviewed` are not binding. Do not build on them without the owner's review.
4. Never add real engineering data (DAT-002). Use the synthetic fixtures in `testing/fixtures/`.
5. Do not resolve items in [governance/OPEN_DECISIONS.md](governance/OPEN_DECISIONS.md) yourself. Prepare options; the owner decides.
6. The owner's latest decision wins. If a change you are asked to make conflicts with an existing rule, say so at once, naming both rules (GOV-033).

Instructions for AI tools working **inside a generated vault** are a different file: [governance/ai/AI_INSTRUCTIONS.md](governance/ai/AI_INSTRUCTIONS.md). It ships into every vault.
