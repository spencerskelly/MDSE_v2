# Governance

Every file that decides what MDSE is and what its tools must do lives in this folder, and nowhere else.

## Files

| File | Answers | Changes when |
|---|---|---|
| [MDSE_DEFINITION.md](MDSE_DEFINITION.md) | What MDSE is, why, scope, phases, principles, user scenario | The owner changes purpose or scope |
| [RULESET.md](RULESET.md) | Every rule, by tool and function, with status and phase | A decision creates, changes or retires a rule |
| [DECISIONS.md](DECISIONS.md) | What was decided, when, why, and which rules it touched | The owner decides something |
| [OPEN_DECISIONS.md](OPEN_DECISIONS.md) | What is not decided, and what it blocks | A question is raised or resolved |
| [ROADMAP.md](ROADMAP.md) | Phases, steps, milestones, acceptance gates | Plans change (plans are not rules) |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Tools, what each owns, shared contracts, data flow | Tool boundaries change (needs a decision) |
| [schemas/](schemas/README.md) | Machine-readable model contract: classes, relationships, authors, EA family mapping | A decision changes the contract |
| [ai/](ai/README.md) | Instructions for AI tools working inside a vault, and AI process files | A process is added or changed |
| [register/](register/) | `rules-register.csv`, generated from RULESET.md for spreadsheet review | Automatically, by `npm run rules:write` |

## Precedence

When two files disagree:

1. **DECISIONS.md** (newest decision wins) over
2. **RULESET.md** over
3. **schemas/** over
4. **MDSE_DEFINITION.md**, ARCHITECTURE.md, ROADMAP.md over
5. anything outside `governance/` (tool READMEs, specs, code comments).

A disagreement is a defect: record it in OPEN_DECISIONS.md and fix it in the next commit that touches either file.

Archived repositories (`Test_Vault_`, `MDSE_Workbench`) have no precedence at all (GOV-005).

## Rule status

| Status | Binding? | Meaning |
|---|---|---|
| Active | Yes | Approved by the owner, or carried from an approved source and confirmed |
| Check | Yes, with the note | Owner-reviewed, but a later decision changed part of it; the note says what |
| Proposed | No | Written, not approved |
| Unreviewed | No | Carried from the 2026-10-19 register; the owner has not reviewed it (GOV-003) |

Review progress at handover: rules from register rows REG-001 to REG-079 are owner-reviewed; the rest are Unreviewed unless the owner approved them in conversation on 2026-10-19.

## Changing governance

1. Write the decision in DECISIONS.md (next `D-nnnn`), naming every rule ID it creates, changes or retires.
2. Edit RULESET.md. New rules take the next free number in their section. A retired rule moves to "Retired rules" with the decision ID; its number is never reused.
3. `npm run rules:write`, then `npm test`.
4. Commit all of it together.
