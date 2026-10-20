# Handover

For the engineering team taking over the MDSE toolset. Read this, then `governance/README.md`. About an hour in total.

## In one paragraph

MDSE turns an Enterprise Architect SysML v1 model (and later product BOMs) into an Obsidian vault: one Markdown note per model element, YAML for classification and provenance, and a final `## SysML v2` block that is the authoritative model text. Five tools do this: a shared **core** library, a single-file offline HTML **importer**, a **base-vault** builder, and two Obsidian plugins, **bootstrap** and **workbench**. The rules are settled enough to start; most of the code is not written.

## What is true today

| Area | State |
|---|---|
| Governance | One ruleset (327 rules). 100 Active, 221 Unreviewed (not binding until the owner reviews them), a few Proposed/Check. Decisions D-0000 to D-0014. |
| Proven code | Core note library (JS), QEAX reader, importer page shell and build, ZIP writer. 47 tests green. |
| Not built | QEAX-to-notes, SysML v2 writer, UID/id allocation, changelog, Base Vault build, Bootstrap, Workbench, BOM import |
| Real data | Never run from this repository. The owner runs real imports privately |

## Set up

```bash
nvm use                     # Node 22
pip install -r testing/requirements.txt && python -m playwright install chromium
npm test                    # must be green before you push
```

## Ground rules (from CONTRIBUTING.md)

- Push to `main`; keep CI green.
- A change in meaning needs a decision (`governance/DECISIONS.md`) and a ruleset edit in the same commit.
- Unreviewed rules are not binding. Ask the owner before building on one.
- No real engineering data, ever. This repository is public.
- TypeScript for tools; Python and Java only in `testing/`.

## First work, in order

| # | Task | Blocked by | Folder |
|---|---|---|---|
| 1 | Owner decides OD-01 (relationship split), OD-03 (usage identity), OD-05/06 (license, visibility) | Owner | governance |
| 2 | Owner reviews Unreviewed P1 rules in MOD and IMP | Owner | governance |
| 3 | Port `tools/core` to TypeScript; tests stay green; importer build consumes the compiled output | — | tools/core, tools/importer |
| 4 | Change `mergeNote` to the approval-only merge rules; one test per merge rule | — | tools/core |
| 5 | UID/id allocation, flag callouts, changelog model in core | — | tools/core |
| 6 | Importer M2: QEAX to notes with ledger and changelog; Python oracle for the expected notes | 1, 2 | tools/importer, testing |
| 7 | Importer M3: SysML v2 writer; wire the parser job to run on generated output | 1 (OD-01, OD-03) | tools/importer, testing |
| 8 | Base Vault build and release manifest | Folder skeleton and templates decided | tools/base-vault |
| 9 | Bootstrap port | 8 | tools/bootstrap |
| 10 | Read-only Workbench | OD-02 (OD-09 closed by D-0019) | tools/workbench |

Tasks 3 and 4 can start immediately.

## Things that will surprise you

- **`mergeNote` currently refreshes EA-owned fields and replaces the SysML block on re-import.** The owner has since ruled that every change to existing content needs approval. Task 4 fixes it.
- **`relationships.yaml` is half-obsolete.** SysML-defined relationships move into SysML text (D-0003). Do not build on those fields until OD-01 is decided.
- **The mapping file cites archived paths.** `ea-family-mapping.json` dispositions are current; its `approved_source` fields point into the Test_Vault_ archive.
- **Many rules come from V1** (Local Model, YAML relationships, EA field dispositions). Their notes say "likely affected by D-0003". Expect the owner's review to retire many of them.
- **The parser gate is manual** and its pin is not final.

## How the owner works

Spencer (Director of Engineering) owns every decision. He prefers short, direct exchanges, one question at a time, and wants to be told when there is a more efficient way to work. Bring options with a recommendation; do not decide open items yourself.

## Where to look

| Question | File |
|---|---|
| What are we building and why? | `governance/MDSE_DEFINITION.md` |
| What must the tool do? | `governance/RULESET.md` (your tool's section), then `tools/<tool>/README.md` |
| What is undecided? | `governance/OPEN_DECISIONS.md` |
| In what order? | `governance/ROADMAP.md` |
| Who owns what? | `governance/ARCHITECTURE.md` |
| Where did this come from? | `docs/HISTORY.md` |
