# MDSE toolchain handover

**Orientation — 2026-11-26 (toolset 0.13.x).** This describes the as-built toolset on `MDSE_v2/main` and distinguishes source implementation, distributable output and live-vault runtime acceptance. Everything below is merged source with automated tests; none of it has passed real-Obsidian or real-data acceptance yet. Original decisions and milestones remain in governance.

## Start here

1. Read [the canonical toolset build/update and acceptance instructions](TOOLSET_UPDATE.md) **before rebuilding, replacing a plugin, or updating an existing vault**.
2. Read [governance/README.md](../governance/README.md), then the relevant active decisions, [RULESET.md](../governance/RULESET.md), [OPEN_DECISIONS.md](../governance/OPEN_DECISIONS.md) and [ARCHITECTURE.md](../governance/ARCHITECTURE.md). Approval/status takes precedence over historical handover language.
3. Inspect the exact source branch and SHA. Do not assume the source, committed `dist/` artifacts, installed plugin and `MDSE_v2_live` modeled definition are synchronized.
4. Validate independently: unit tests, committed build consistency, parser/synthetic checks, real-vault index integrity, Obsidian runtime interaction and approval/release.

## Repositories and authority

| Repository | Responsibility |
|---|---|
| `spencerskelly/MDSE_v2` | Tool code, build distributions, controlled Base Vault payload, governance and tests |
| `spencerskelly/MDSE_v2_live` | **Main-only** engineering definition and integration vault; model and installed runtimes are not sources for tool code |
| `Test_Vault_` and `MDSE_Workbench` | Historical/archived reference only |

SysML v2 text is authoritative for native model semantics. Markdown and YAML provide context/provenance; generated Canvas views are not semantic authorities. Do not import real engineering data into the public tools repository (DAT-002).

## Actual implementation areas

| Area | Current source implementation | Open acceptance |
|---|---|---|
| Shared core | Markdown/YAML and engineering model support | Reconcile known legacy merge paths and current rules before assuming all edits share one contract |
| Importer | Offline HTML; QEAX and BOM intake; merge/update flows; controlled vault-update Step 4 | Real-source/approval acceptance, parser and release synchronization |
| Base Vault | Vault scaffold, governed templates, pinned vendor plugin payloads, Workbench/Bootstrap payload | Controlled release hash/lock and cross-platform first-open acceptance |
| Bootstrap | Obsidian lock check, governed settings and plugin activation support | First-open real-Obsidian and release lock acceptance |
| Workbench | Viewer, trace tables, Canvas, editing, review and exports; Document / Define / Structure / Verify work areas; **Flow** drop-down with eleven PLM flows (D-0169), their guides (D-0171) and a local flow database (`.mdse/workbench.db`, D-0170) | Obsidian new-tab/focus selection, flows, save, editing and pop-out regression acceptance |
| Testbench | Separate desktop plugin (D-0170): Plan and Run, evidence by phone (QR), capture inbox or file, run reports in `Test Reports/`, local index `.mdse/testbench.db` | Real Obsidian, phone capture on the company network, base vault and plugin lock |
| Core | Note format, identity, SysML block; SQLite layer (`mdse_db.ts`, vendored sql.js) shared by both plugins | TypeScript port of `mdse_core.js` (GOV-002) |

The older "Workbench not built" and "Phase 3 editing not started" descriptions are no longer valid as a description of source; they do **not** imply production release acceptance.

## Four-workflow UX being developed

- **Document:** engineering note and content investigation; the first contextual **+ New…** launcher now supports ordinary Daily, Meeting, Transcript and Engineering Note templates without SysML identity, plus governed Document creation. Full ordinary-Markdown search and publishing remain open.
- **Define:** needs, requirements, behavior/functions and semantic trace/editing.
- **Structure:** parts, BOMs, configurations, interfaces, ports and connections.
- **Verify:** requirement coverage and verification relationships; test-plan/execution workflow remains to be built.
- **Connection discovery:** Find → Find shared terms creates a disposable, incrementally built word index over governed notes, surfaces common terms and type-grouped Requirement/Verification/other hits, and places selected candidates on a new Canvas with no inferred model links. See [workflow specification](TERM_CONNECTION_DISCOVERY.md).
- **Member-level navigation:** the Note view has a read-only expandable member inspector that differentiates a usage from its typing definition, maps explicit port/part endpoints and `connect`/`bind`/`flow` only, flags unresolved endpoints and retains the parent working tab. Each usage offers an isolated scratch **Canvas connections** projection without new notes or automatic model edits.
- **Shared interaction:** workflow-specific **+ New…** menus for model records (using the validated element planner) and plain documentation (no UID/SysML); selected item and global governed-note search; ranked shared-neighbor discovery from N-of-N to 1-of-N; temporary/kept/dismissed candidates on scratch Canvases, workflow filters and All relationships; explicit modeled relationship editing.
- **Workspace preservation:** the four workflows and tools change inside a single Workbench sidebar or optional pop-out, never opening a Workbench editor tab. Follow / Pin controls selection; Edit pins the item. Model notes and Canvas remain independent, focusable editor artifacts.

All of these statements concern review-branch **source**, not an installed or runtime-accepted release. See [Workbench README](../tools/workbench/README.md) and [update and acceptance checklist](TOOLSET_UPDATE.md).

## Developer build and evidence

```sh
# Node 22; at the exact source commit selected for testing
npm ci                    # once: the pinned TypeScript compiler for the type check
npm run build             # Workbench, Testbench, then importer
npm run test:workbench
npm run check:workbench
npm run check:importer
npm test
```

The importer bundles the Workbench plugin distribution into its managed Base Vault payload. Updating a Workbench TypeScript file but not rebuilding and committing `tools/workbench/dist` **and** `tools/importer/dist` will fail build-freshness checks and must not be distributed. CI's check and build jobs are separate; a passing build does not prove committed outputs are current.

Deploy first to a staging clone, choose the controlled importer's **Preview vault update** and inspect changes, or use an intentionally isolated manual Workbench-only pilot with backups and no Bootstrap lock mismatch. The production/live vault should only be updated after explicit owner approval.

The `MDSE_v2_live/scripts/check-live-workbench.mjs` test is an actual model-index smoke test against an exact tool source checkout; it is not a graphical Obsidian test, a parser certificate or a release.

## Working rules and next increments

- Use [AGENTS.md](../AGENTS.md) and [CONTRIBUTING.md](../CONTRIBUTING.md). Model-semantic or tool-contract changes require owner decisions and corresponding rules/schema updates; implementation-only UX refinements do not themselves imply a new SysML construct.
- Work on a short-lived branch, open a pull request, merge to `main` when CI is green and the owner wants it tested. Delete the branch after the merge.
- Bump versions with `npm run bump -- patch "summary"` (or `minor`): it raises only the components whose source changed, writes the Importer history and the CHANGELOG entry, and rebuilds the paired outputs. Then `npm test`.
- `npm test` includes the TypeScript type check (`npm run check:types`, needs `npm ci` once).
- Next increments, in the owner's order: a first real-Obsidian pass in a staging vault (both plugins, one flow, one Testbench run with a phone photo); Change flow writing the ECO note through the existing ECO planner; Testbench in the base vault and plugin lock; review of the Unreviewed P1 rules.
- After a coherent feature set, validate on real Obsidian in a staging vault, collect release evidence and obtain the owner's promotion decision.

## Governing sources

| Topic | Canonical reference |
|---|---|
| Current approved rules and decisions | `governance/DECISIONS.md` and `governance/RULESET.md` |
| Open issues/gates | `governance/OPEN_DECISIONS.md`, `governance/ROADMAP.md` |
| Tool boundaries | `governance/ARCHITECTURE.md` |
| Build and safe deployment | [TOOLSET_UPDATE.md](TOOLSET_UPDATE.md) |
| Workbench UX source and usage | [Workbench README](../tools/workbench/README.md) |
| Importer update behavior | [Importer README](../tools/importer/README.md) |
| Live integration baseline | [MDSE_v2_live LIVE_BASELINE.md](https://github.com/spencerskelly/MDSE_v2_live/blob/main/LIVE_BASELINE.md) |
