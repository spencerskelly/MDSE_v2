# core

The one implementation of the MDSE model contract. Every tool that reads or writes a note calls this library; none re-implement it (ARCHITECTURE.md, shared contract 3).

**Rules:** RULESET.md section MOD.

## Owns

- Note parsing and serialization: frontmatter keys and order, user zone, `## Source: EA`, `## SysML v2` (last, one fenced block).
- Note validation against `governance/schemas/element-types.yaml` (via `src/classes.json`).
- Replacing the SysML block while returning everything above it byte-for-byte.
- Merging an incoming note onto an existing one (`mergeNote`). **Its current behaviour follows ADR-V2-07 and must change** to the approval-only merge rules (IMP section, "Merge, rerun and conflicts"): EA-owned keys and `## SysML v2` are no longer refreshed without approval, and same-UID/different-type becomes a `flagConflict`.
- ZIP writing (stored, no compression) for the new-vault output.

## Does not own

UI, file-system access, network, plugin APIs. Inputs and outputs are strings and bytes.

## State

| Part | State | Evidence |
|---|---|---|
| `src/mdse_core.js` | Carried, working, **JavaScript** | 13 unit tests (`test/`), cross-checked against the Python oracle on 20 mutated notes |
| `src/classes.json` | Generated from `element-types.yaml` | `testing/oracles/test_core_crosscheck.py` fails if stale |
| TypeScript port | Not started | First task (GOV-002) |
| UID/id allocation, flag callouts, changelog model | Not built | Needed for importer M2 |

## Run

```bash
npm run test:core        # unit tests
npm run test:oracles     # cross-checks with testing/oracles/mdse_note_format.py
```

## Next

1. Port to TypeScript (`src/*.ts`, extend `../../tsconfig.base.json`), keeping the existing tests green and the importer build working.
2. Change `mergeNote` to the approval-only rules, with tests for each merge rule in MDSE_DEFINITION.md.
3. Add UID/id allocation (MOD, Identity), flag callout read/write (MOD, Flags) and the changelog entry model.
