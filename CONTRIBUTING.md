# Contributing

## The rules of this repository

1. **Rules first.** If a change alters what the model means or what a tool must do, it needs a decision. Add a `D-nnnn` entry to [governance/DECISIONS.md](governance/DECISIONS.md), edit [governance/RULESET.md](governance/RULESET.md), and run `npm run rules:write`, all in one commit. Implementation-only changes need no decision.
2. **Every file has a home.** Each top-level folder has a README that says what it owns. A file that fits no folder is a sign the change is wrong, not that a new top-level folder is needed. New top-level folders need a decision.
3. **Code comes with tests in CI** (TST-001). No test, no merge.
4. **Push to `main` only when `npm test` passes locally.** CI runs the same checks. A red `main` is fixed before anything else (GOV-001).
5. **No real data** (DAT-002). No `.qeax`, BOM spreadsheets, real product names, customers or generated real model content, in any commit, branch, issue or CI artifact. Real-data runs happen on a private machine; issues are logged in [testing/REAL_DATA_TEST_LOG.md](testing/REAL_DATA_TEST_LOG.md) by file name only.
6. **Unreviewed rules are not binding** (GOV-003). If your work depends on one, ask the owner to review it first.

## Commits

- Imperative subject, 72 characters or fewer: `importer: write Source: EA section after user zone`.
- Prefix with the folder you changed: `governance:`, `core:`, `importer:`, `base-vault:`, `bootstrap:`, `workbench:`, `testing:`, `docs:`, `ci:`.
- Reference rule or decision IDs in the body when they apply: `Implements IMP-034. Refs D-0003.`

## Code standards

- TypeScript, strict mode, extending [tsconfig.base.json](tsconfig.base.json) (GOV-002). Carried JavaScript in `tools/core` and `tools/importer` is ported to TypeScript as the first piece of work (see [docs/HANDOVER.md](docs/HANDOVER.md)).
- Tools never embed model semantics privately. They read `governance/schemas/` and implement `governance/RULESET.md`.
- The importer stays one offline HTML file: no network request, no install, no runtime dependency.
- Python and Java appear only in `testing/` as oracles and the parser gate.

## Changing a schema

1. Decision in `DECISIONS.md`.
2. Edit the file in `governance/schemas/`.
3. Regenerate anything derived from it (for example `tools/core/src/classes.json` from `element-types.yaml`). CI fails if they differ.
4. Rules refer to "the latest version"; only the release manifest pins versions (MOD-146).

## Reviewing rules

The owner reviews rules in [governance/RULESET.md](governance/RULESET.md) or in the generated [governance/register/rules-register.csv](governance/register/rules-register.csv). Edits to the CSV are not read back; make them in `RULESET.md`.
