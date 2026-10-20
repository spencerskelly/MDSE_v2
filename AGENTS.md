# Instructions for AI agents working in this repository

You are working on the MDSE toolchain repository, not on an engineering vault.

1. Read [governance/README.md](governance/README.md), then the parts of [governance/RULESET.md](governance/RULESET.md) that cover the tool you are changing.
2. Follow [CONTRIBUTING.md](CONTRIBUTING.md). In particular: a change in meaning needs a `D-nnnn` decision and a ruleset edit in the same commit, and `npm test` must pass before you push.
3. Rules with status `Unreviewed` are not binding. Do not build on them without the owner's review.
4. Never add real engineering data (DAT-002). Use the synthetic fixtures in `testing/fixtures/`.
5. Do not resolve items in [governance/OPEN_DECISIONS.md](governance/OPEN_DECISIONS.md) yourself. Prepare options; the owner decides.

Instructions for AI tools working **inside a generated vault** are a different file: [governance/ai/AI_INSTRUCTIONS.md](governance/ai/AI_INSTRUCTIONS.md). It ships into every vault.
