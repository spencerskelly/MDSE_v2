# Decisions

One entry per owner decision. Newest last. Each entry names the rules it creates (+), changes (~) or retires (−). A decision is never edited after the fact; a later decision supersedes it and says so.

Entry format:

```
## D-nnnn — Title
Date · Decided by · Status (Accepted | Superseded by D-nnnn)
Decision. Why. Rules: +ID ~ID −ID.
```

---

## D-0000 — Baseline from the Rules Register

2026-10-19 · Spencer · Accepted

The ruleset starts from the owner-reviewed MDSE Rules Register of 2026-10-19, which consolidated Ruleset 1.23, the Workspace Decision Log (W-01 to W-398), the V2 ADRs and contracts, and the owner's merge rules. Those sources are archived in `Test_Vault_` at commit `4a2b1540fd69d86c6953ae34139a02f8a983de25`. Their W-, V2-, R- and REG- identifiers remain valid as origins in RULESET.md and nowhere else.

Rules: + all rules in RULESET.md not created by D-0001 to D-0014.

## D-0001 — One repository: MDSE_v2

2026-10-19 · Spencer · Accepted

MDSE_v2 is the single home for MDSE rules, schemas and tools. `Test_Vault_` and `MDSE_Workbench` become read-only archives. Why: the old repository mixed V1 and V2, held decisions in five places, and could not be tidied without breaking links and workflows.

Rules: +GOV-005. −REG-039 (old tool-authority split). Resolves C-16, DEC-1, DEC-4.

## D-0002 — Workbench lives in this repository

2026-10-19 · Spencer · Accepted

Workbench is developed in `tools/workbench/` alongside the other tools, under one release manifest. Why: importer, Base Vault and Workbench must move in lockstep; two repositories drifted.

Rules: none directly; ARCHITECTURE.md updated. Affects BAS-002 (candidate/pin split may disappear).

## D-0003 — SysML defines it, SysML holds it

2026-10-19 · Spencer · Accepted

Anything SysML v2 can define is written only in the note's `## SysML v2` block. Everything else is written in YAML frontmatter. Nothing is written in both places. There is no YAML mirror of SysML relationships. Why: one authority per fact; the V1 relationship fields duplicated SysML meaning.

Consequences: `relationships.yaml` shrinks to MDSE-only relationships (OD-01). Rovo cannot read SysML relationships from YAML (OD-02).

Rules: +MOD-117. −REG-023, −REG-025, −REG-026 (V1 relationship endpoint rules). Resolves C-19 and ADR-V2-06 Q2.

## D-0004 — Carry proven code with its tests

2026-10-19 · Spencer · Accepted

From `Test_Vault_`, only code with passing tests comes across: core note library, QEAX reader, importer build, note-format oracle, cross-check and browser tests, Golden Charger and Sample Instrument fixtures, the parser gate. Everything else is specification. See docs/HISTORY.md.

Rules: +TST-001.

## D-0005 — Direct push to main

2026-10-19 · Spencer · Accepted

Changes are pushed directly to `main`; CI must stay green. No pull-request gate. Why: small team, fast iteration; CI is the gate.

Rules: +GOV-001. GOV-006 (W-07) continues under this decision.

## D-0006 — One ruleset file

2026-10-19 · Spencer · Accepted

`governance/RULESET.md` is the only ruleset. The register CSV is generated from it. Why: rules were spread across Ruleset 1.23, the Decision Log, ADRs, contracts and schemas.

Rules: +GOV-004. −REG-044 (shared-contract list that named multiple rule sources).

## D-0007 — TypeScript everywhere

2026-10-19 · Spencer · Accepted

All tools are TypeScript sharing `tools/core`. Python and Java are CI oracles and the parser gate only. Carried JavaScript is ported first.

Rules: +GOV-002.

## D-0008 — Unreviewed rules are carried but not binding

2026-10-19 · Spencer · Accepted

Register rows the owner has not reviewed (REG-080 onward, except rules the owner approved in conversation) enter RULESET.md as `Unreviewed`. No build work depends on them until reviewed.

Rules: +GOV-003.

## D-0009 — Requirement ids keep STD and STK prefixes

2026-10-19 · Spencer · Accepted

Standard requirements take `STD-NNNNN`, stakeholder requirements `STK-NNNNN`, other requirements `REQ-NNNNN`. External designators never go in `id`; they are kept as a `Designator` line in `## Source: EA`.

Rules: ~MOD-016, ~MOD-017. −REG-065, −REG-066. Schema change done in D-0015.

## D-0010 — flagLink replaces tracesTo

2026-10-19 · Spencer · Accepted

There is no provisional relationship field. An unresolved link is a `flagLink`.

Rules: +MOD-073. −REG-024.

## D-0011 — One vault in Phase 1

2026-10-19 · Spencer · Accepted

Phase 1 delivers one vault with no cross-vault links. A later phase will likely add cross-vault support.

Rules: ~GOV-017.

## D-0012 — Rules say "latest version"

2026-10-19 · Spencer · Accepted

Rules and documentation name schemas and tools without version numbers. Exact pins live only in the release manifest.

Rules: +MOD-146. ~BAS-002, ~BAS-004, ~MOD-147.

## D-0013 — Register review edits (REG-001 to REG-079)

2026-10-19 · Spencer · Accepted

- Workbench scale smoke uses 10,000 notes, not 60,000 (~TST-002).
- Public repositories hold synthetic content only; the `v2_test` reference is removed (~DAT-002).
- A translated note *includes* a `## Source: EA` section; it is not necessarily last, because `## SysML v2` is last (~MOD-034).
- Obsidian-native-first is kept as a principle; its Local Model block-ID clause is dropped (~GOV-009).
- GOV-010 (Current State registry) is to be checked for use.
- REG-038 (documentation clean-up) retired as having no value as a rule; REG-041 and REG-042 moved to ROADMAP.md as plans.

## D-0014 — Owner merge and import rules

2026-10-19 · Spencer · Accepted

Import is mechanical and additive. Empty YAML may be filled; changing an existing value needs pre-approval (field selection at Start, for the whole run) or review approval. Conflicts are listed in the body with `flagConflict`; an engineer resolves them. Missing source records get `flagImport` and are never deleted. One dated changelog per run, linking each changed file. Re-importing the same input changes nothing and writes no changelog. A parent pinning an older child revision is flagged; the child body lists that usage. Template fields are always present; empty non-template source fields are not written. Flag types are `flagImport`, `flagConflict`, `flagLink`, `flagNote`; only an engineer removes a flag.

Rules: carried as Active in the IMP (Merge, rerun and conflicts), BOM and MOD (Flags, Note format) sections. Full text: MDSE_DEFINITION.md, Merge rules.

## D-0015 — STD is regulatory, STK is customer or internal business

2026-10-19 · Spencer · Accepted

Requirement subtype `standard` is any regulatory or standards requirement and takes `STD-NNNNN`. Subtype `stakeholder` is any customer or internal business need and takes `STK-NNNNN`. Every other Requirement subtype keeps `REQ-NNNNN`. `element-types.yaml` declares this with `prefix_by_subtype`; core and the Python oracle check the prefix against the subtype. Closes OD-07.

Rules: ~MOD-017.

## D-0016 — Build the importer on provisional rules to find where they break

2026-10-19 · Spencer · Accepted

M2 and M3 are built now, before OD-01 (relationship split) and OD-03 (usage identity) are closed. The importer follows the Unreviewed MOD and IMP rules as written and takes these provisional choices, each reported on the ledger or in the run record:

- Native SysML is limited to definitions, owned part, port, action and state usages, specialization, and composite or shared aggregation. Every other connector family is a `flagLink` and a `deferred_review` ledger row.
- The importer overrides `emission_enabled: false` in `ea-family-mapping.json` with a run option (default on). Blocks written this way are reported "not parser-checked"; the pinned parser gate runs in CI, not in the page.
- Package name per note comes from the note id; definition and usage identifiers are derived from the EA name.
- The importer is tested on a synthetic QEAX generated at test time with `node:sqlite`; no QEAX is committed.
- When the output folder holds no vault, the base vault is written with the notes. The plugin payload is not bundled yet (`plugin-lock.yaml` says `NOT_BUNDLED`).

Rules: none edited. Revisit when OD-01 and OD-03 close.

## D-0017 — Part usage wins over aggregation; relationship translations; error log

2026-10-19 · Spencer · Accepted

An EA Part usage wins over an Aggregation to the same part: when the whole already owns a part usage typed by that part, the aggregation is `alias_merged` (`USAGE_WINS`) and adds nothing. An aggregation with no matching usage still becomes an owned part usage. Flows are translated: FlowProperty to `in`/`out`/`inout` item usages in the port definition (direction from the EA tag `direction`, else `DIRECTION_EVIDENCE_MISSING`); ControlFlow to `succession` and StateFlow to `transition` inside one owner. The remaining relationship families are translated per connector by endpoint kind, or deferred with a named code. `tools/importer/TRANSLATION.md` is generated from the mapping and the code and lists every family and every exception code; CI fails if it is stale. A row that throws is skipped, written to the Error Log in `99_System/11_Import`, and shown in the ledger as `error`; a failure that stops the run produces a downloadable report naming the stage.

Rules: none edited. Statement forms marked `UNVERIFIED_SYNTAX` await the parser gate.

## D-0018 — Everything except diagrams is translated; dependency kinds are listed; derivedFrom runs new to informing

2026-10-19 · Spencer · Accepted

Added to the importer: attachments (Artifact note plus file in `Attachments/`, read from `t_document`, never overwritten), fork and join nodes, triggers (recorded on the owning state), `extend` as an optional use case, and port connections across parts through the owning assembly. Dependency-like relationships are listed as separate kinds in `tools/importer/TRANSLATION.md` (derivedFrom, refines, trace, dependsOn, uses, allocate, satisfy, verify, realises). `derivedFrom` is written in the new note and points at the informing note. Still not translated: diagrams, Sequence (interaction diagram content), Association (no proof of connectivity), unknown families.

Rules: none edited.

## D-0019 — Workbench v2: one core, page and plugin shells, read-only, built from SysML text

2026-10-19 · Spencer · Accepted

The V2 Workbench is a single TypeScript core (scanner, index, views, UI) with two shells, an offline HTML page and an Obsidian plugin, both produced by `tools/workbench/build.mjs`. It is read-only (Phase 1). Relationships are derived from the SysML block text plus MDSE-only YAML links such as `describes` (D-0003); the index is disposable. Views: dashboard, notes, note, structure with parts list, where used, traceability, behavior, interfaces, graph with profiles, relationships, review. From V1 it carries the view-profile idea, staged startup and where-used. It does not carry Local Model, editing, the semantic cache or runtime health. This closes OD-09.

Rules: none edited. The plugin is not yet tested in real Obsidian; the base-vault plugin payload stays `NOT_BUNDLED` until it is.

## D-0020 — Workbench shows data as table or Obsidian Canvas; canvases are generated files in 99_System/12_Views

2026-10-19 · Spencer · Accepted

The Obsidian plugin presents the model as tables (Notes, Relationships, Traceability, parts list) and as an Obsidian Canvas generated from any view profile around a note. A canvas has file cards for notes in the vault and text cards for references whose note is missing. Canvases are written to `99_System/12_Views/`, overwritten on regeneration, ignored by the indexer, and carry no model meaning; they are the only files the Workbench writes, and no model note is touched (D-0019 stays read-only). An allocate or dependency whose source note is missing is kept as an unresolved edge on the target note, never a self-loop; Structure lists typed parts whose definition is not in the vault.

Rules: none edited.

## D-0021 — Workbench view settings and classifier grouping

2026-10-19 · Spencer · Accepted

The Graph tab and the canvas share one set of view settings: connections away, max notes, relationships followed, note types and statuses shown, a folder limit, and a classifier. A classifier (type, subtype, status, folder or EA type) groups notes that share a class at the same distance from the selected note into one card once more than N do; edges between groups are merged with a count. Filters hide a note and do not traverse through it. Settings are presentation only and not stored in the model. Interpretation of "classifier" is mine; the owner may redefine it (for example as a stored tag or a named view).

Rules: none edited.
