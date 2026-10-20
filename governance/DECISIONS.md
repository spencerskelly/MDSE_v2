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

## D-0022 — Canvas views are transient previews; a canvas is kept only when the user saves it

2026-10-19 · Spencer · Accepted

Replaces the file-per-view behaviour of D-0020. The Workbench writes a canvas preview to one scratch file (`99_System/12_Views/Preview/Workbench Preview.canvas`) that each preview overwrites and that is deleted when the plugin loads or unloads. Obsidian can only open a canvas that is a file, so one scratch file is the smallest footprint. A canvas is kept only when the user chooses Save: the folder is the configured default (`99_System/12_Views` unless changed), the last folder used, or any project folder picked from the vault's folders. Saving copies the preview as the user left it and never overwrites. The indexer ignores `99_System`, so previews and saved canvases in it are not model notes; a canvas saved to a project folder is not a note either (the indexer reads only `.md`).

Rules: none edited. Caveat: if the vault is synced or committed while a preview is open, the scratch file may be captured; it is overwritten or removed on the next load.

## D-0023 — View folders, vault .gitignore, Workbench tool rules, and decisions confirmed this session

2026-10-19 · Spencer · Accepted

1. **Folders (supersedes the folder names in D-0020 and D-0022).** Temporary views go to `99_System/22_Views/` (one scratch file, `Workbench Preview.canvas`). Saved views default to `99_System/23_Saved_Views/`; the user can save into any folder, including a project folder. Both folders ship with a README from the base vault.
2. **`.gitignore`.** The repository `.gitignore` and a vault `.gitignore` shipped in the base vault list the files users keep local without committing: Obsidian workspace, layout and per-user settings (`workspace*.json`, `workspaces.json`, `appearance.json`, `hotkeys.json`, `graph.json`, `cache`), plugin `data.json`, the temporary-views folder (its README is kept so the folder exists), and OS, editor and sync leftovers. Committed on purpose: controlled files (`app.json`, `core-plugins.json`, `community-plugins.json`, `plugin-lock.yaml`), plugin builds, saved views, and `99_System/11_Import` (review items must resolve from the vault alone, IMP-042). The ignore list for per-user Obsidian files is the proposed default and the owner may change it.
3. **Workbench rules are written into the tool documentation.** The twelve rules in `tools/workbench/README.md` ("Rules this tool follows") are the agreed behaviour: read-only on the model, disposable index, relationships from SysML text, no invented ends, views hold no meaning, previews are temporary, saved only on user action and never overwritten, filters hide and do not connect through, indexer reads only `.md`, per-user settings stay local, honest parser status, staged startup. They are not entered in RULESET.md; the WKB rules there stay Unreviewed.
4. **Confirmed by the owner this session:** D-0019 (one core, page and plugin shells, read-only), D-0020 (table and Obsidian Canvas, unresolved sources kept as unresolved edges), D-0021 (view settings and the classifier as grouping), D-0022 (transient previews, saved on request).
5. **Other decisions taken this session and recorded here:** "canvas" means an Obsidian Canvas file generated from a view profile; "table" means the Workbench tables with CSV export; a filtered note is hidden and not traversed through (a pass-through option is not built); a classifier groups notes at the same distance once more than N share a class (default 6); the AI instructions treat both view folders as pictures, not sources.

Rules: none edited.

## D-0024 — The importer can update an existing vault's configuration without a data source; the base vault bundles the Workbench

2026-10-19 · Spencer · Accepted

With a vault folder chosen and no source, the importer previews and applies a vault update: the Workbench plugin, schemas, templates, AI instructions and governed Obsidian settings are brought up to the importer's release. Nothing is written by the preview; nothing is deleted; notes, attachments, plugin `data.json` and workspace files are never read or changed. Per file class: AI, schemas, templates and `plugin-lock.yaml` are replaced when different with the old copy saved under `99_System/11_Import/Update <date>/Replaced/`; plugin builds are replaced; `community-plugins.json` and `core-plugins.json` gain the shipped entries and keep the user's; `app.json` has its governed keys set and keeps the rest; `.gitignore` gains missing lines; `.vault.yaml` keeps identity and updates `mdse_release` and `schema`; `README.md`, the view-folder READMEs and anything else are created if missing and never overwritten; malformed JSON is left alone and reported. A folder with no vault gets the whole base vault. A `Vault Update <date>.md` note records every change. The base vault now bundles the Workbench plugin and lists its SHA-256 in `plugin-lock.yaml` (status PARTIAL); the third-party plugins stay `not_bundled`. Because the importer embeds the Workbench build, `npm run build` builds the Workbench first.

Rules: none edited. Open: whether a hand-edited template should block replacement instead of being saved aside (a locally-modified check needs a stored hash of each shipped file); replaced copies accumulate under `11_Import` until the user deletes them.

## D-0025 — The Workbench is a right-sidebar panel that follows the selected note; Review may update issues

2026-10-19 · Spencer (request) · Proposed: owner to confirm the write scope and the status list

1. **Layout.** No separate Workbench browser: Obsidian's file explorer selects the note. The Workbench opens in the right sidebar and reflects the open note. Lenses: Dashboard, Note, Tables, Structure trace, Functional trace, Requirements trace, Review. A lens's table or canvas opens in the main window for the selected note. The standalone page keeps its own browser because it has no Obsidian.
2. **Write scope (amends D-0019 rule 1, "read-only on the model").** Review needs to update issues, so two narrow writes are allowed, each started by a click and each undoable (the undo is refused if the note has changed since): set an Issue note's `status`; resolve (remove) one flag callout in the user zone. The `## SysML v2` block is never edited. AI agents still must not remove flags: resolving a flag is the engineer's decision, and the button is the engineer acting.
3. **Open.** The status vocabulary is not defined in the schema. The picker offers the statuses in use in the vault plus Draft and Retired; define the Issue lifecycle (for example Open, In review, Resolved, Retired) in the schema and the picker will follow it. Whether "Resolve" should instead stamp the flag as resolved and keep it (an audit trail) is undecided; removal is what the format check already tolerates.

Rules: none edited. Caveat: tested only against a fake Obsidian API in Chromium; main-area placement of a view opened from a sidebar is not verified in real Obsidian.

## D-0026 — The V1 EA tag and field dispositions are brought into v2; no GUIDs on Source: EA lines; unnamed usages take their type's name

2026-10-19 · Spencer · Accepted

1. **One list, already decided.** `governance/schemas/ea-tag-dispositions.json` (121 tags: 80 drop, 38 body, 3 structure) and `ea-field-dispositions.json` (element, connector, package and diagram fields) are the V1 files from Test_Vault_ (`99_System/03_Schemas`), converted to JSON without changing a disposition. The importer reads the tag list. The eight tags the owner named (Priority-Trace, Responsible, Special Characteristic, Special Characteristic Comment, Special Characteristic-Trace, Supporting, Target, Target-Trace) were already `drop` under W-29. v2 had only a seven-name subset hard-coded, so the rest leaked into notes as `unassigned` lines.
2. **Placeholders** (`unassigned`, `<memo>`, empty) are never written. A tag missing from the list is kept and reported under Warnings in the Import Run note, so a new tag cannot pass unseen.
3. **GUIDs.** `## Source: EA` keeps one `EA GUID` line, the note's own: re-import matches notes by it (uid can shift on a collision and the `primarySymbol` is not stable), so removing it would break merges and the "Missing from source" flag. All other lines name the target note instead. Flag callouts keep the connector GUID, the handle to the ledger row. Overturn this if you accept re-import by uid and path only.
4. **Unnamed usages** take the typed element's name (IMP-095).
5. **Not ported from V1 (the importer has no code for them):** State entry/do/exit actions (`t_operation`), `t_xref` links (Represents, Target pin, Entry/Do action), connector Name/Notes lines, `text`/`SysML1.4::text` as normal text under the Note, comment tags as normal text (W-104), discussion posts, `quantity of` lines (SysML multiplicity may replace), Class `Attribute:` lines, NoteLink bodies, the Import State transaction file, and the source-count check (IMP-046). Each needs a decision: port, replace by SysML, or drop. See the session notes.

Rules: IMP-093, IMP-094, IMP-095 added (Active). IMP-003 and IMP-005 are now implemented but stay Unreviewed until the owner reviews them.

## D-0027 — SysML v2 defines structure and links; Source: EA is reduced to what is stored nowhere else

2026-10-19 · Spencer · Accepted

1. **Boundary.** Structure, linking, quantities and multiplicity are defined by the SysML v2 block. Relationships SysML v2 cannot express, and the identifying properties, stay in the YAML. Nothing is written twice.
2. **Removed from `## Source: EA`:** the Usage, Flow, Control node, Aggregation, Specializes, Satisfies, Verifies, Allocated to, Realises, Performs, Derived from, Dependency, Connection, Includes, Extended by and Link-describes lines (all restate a SysML statement or a YAML link); EA type, stereotype, author, created and package (uid carries author and date, `eaType` carries type and stereotype, the folder follows the package).
3. **Kept:** the EA GUID (re-import identity, D-0026), `Name` when the file name differs, alias, tags with a `body` disposition, trigger lines, succession and transition lines that carry a guard or trigger text, unresolved connector lines, attachments.
4. **Consequence for re-import.** The merge is additive, so notes already imported keep their old lines; a fresh import writes the short form.
5. **Open.** Guard and trigger text has no SysML form in the block today. SysML v2 has `accept` and `if`; moving them there is a separate change.

Rules: IMP-096 added (Active).

## D-0028 — The SysML v2 language is defined once, one note per construct, and the Workbench recognizes all of it

2026-10-20 · Spencer · Accepted

1. **Catalog.** `governance/language/catalog.json` lists 108 constructs: 25 definition kinds with their usages, the relationships (specialization, typing, subsetting, redefinition, reference subsetting, cross subsetting, conjugation, dependency, import, alias, allocate, satisfy, verify, perform, exhibit, include, connect, interface, bind, flow, succession flow, message, succession, transition, expose), behaviour statements (accept, send, assign, control nodes, if, loops, terminate, entry/do/exit), annotations (comment, doc, metadata, textual representation), and structure words (package, visibility, modifiers, multiplicity, value, parameters, return, expression, variation). Keywords checked against the Pilot Implementation grammar (`SysML.xtext`).
2. **Notes.** `node scripts/build-language.mjs --write` writes one note per construct and an index into `governance/language/sysml-v2/`. Each note has: description, eligible from, eligible to, what separates it from the most similar construct, an example, and whether the importer writes it and whether the Workbench draws it. The importer column is measured (the importer runs on the synthetic model), not stated.
3. **Use levels.** Every construct is available. Each is marked Everyday (28), Common (38), Occasional (27) or Rare (15), so the index leads with the handful engineers use most.
4. **Shipped.** The notes ship in the base vault under `99_System/04_Language` and are updated by the vault update like schemas and templates. `99_System` is skipped by the Workbench index, so they are not model notes. The AI instructions send AI tools there first and forbid constructs that are not in the notes.
5. **Integration.** The Workbench scanner classifies every construct in the catalog by keyword (`sysml_lang.ts`) and walks the nested members of any construct. A test scans every catalog example and requires the right construct and no warnings. Constructs the Workbench draws as relationships are marked in each note; the rest are recognized and kept, not drawn.
6. **Limits.** The scanner classifies by keyword; it is not a parser, and the pinned parser gate remains the conformance check. Eligibility lists are written from the specification's metamodel and are Draft until the owner reviews them.

Rules: MOD-165 and MOD-166 added (Active).


## D-0029 — Requirement text is the definition's `doc`; transition triggers, guards and effects follow SysML v2

2026-10-20 · Spencer · Accepted

1. **Requirement text.** A `requirement def` carries its wording as `doc /* … */`: the EA Note, plus any `text` / `SysML1.x::text` tag (the wording sits in the tag's Notes column when Value is `<memo>`; the reader now takes it). The text is no longer repeated in the note body. `*/` inside the text is written as `* /`.
2. **Display.** Wherever the Workbench shows a requirement it shows name, subtype and text: Requirements trace and the traceability page (Requirement, Subtype, Text columns), canvas cards (name link, subtype, text), Note lens and panel.
3. **Transitions.** EA connector PDATA1 / PDATA2 / PDATA3 are trigger, guard and effect (V1 decision). A StateFlow becomes `transition first a accept <trigger> if <guard> do <effect> then b;`; a ControlFlow becomes `succession first a if <guard> then b;`. Free text cannot be an expression, so each part is a small helper usage in the same definition (`item trigger…`, `constraint guard…`, `action effect…`) whose `doc` holds the wording. A connector with only a name uses it as the guard (ControlFlow) or the trigger (StateFlow).
4. **Source: EA.** The `- Succession` / `- Transition` lines are gone; the Workbench reads the wording from the SysML block ("Triggers, guards and effects" table).
5. **Not yet.** StateMachine, ActivityPartition, ActionPin, ActivityParameter, InformationFlow and the t_xref / t_operation / t_attribute tables have no path yet; `governance/schemas/EA_TO_V2_PATHS.md` lists them.

Rules: IMP-097, IMP-098.

## D-0030 — Workbench Edit lens: add relationships, elements and requirement text

2026-10-20 · Spencer · Accepted

1. **Where.** A new Edit lens in the right panel (hidden when the host cannot write). Three tabs: Add relationship, Add element, Requirement text.
2. **Relationships.** Drop-down of kinds eligible for the selected note's definition: has part/port/action/state/item (typed, with name and quantity), satisfies, verifies, allocated to, performs, derived from, refines, traces to, depends on, specializes, includes, extended by. The target is chosen in a browser with search, a type filter and folder groups; each entry shows id, type and, for requirements, the text. The statement is inserted in the source note's SysML block with the same forms the importer writes. Repeats and ineligible pairs are refused.
3. **Elements.** Class and subtype drop-downs, name, text, folder (searchable list or a new path). The note gets uid, id, status Draft and a one-definition SysML block (requirement text becomes `doc`). Classes with no SysML form become plain notes.
4. **Safety.** Preview diff, apply on click, stale-file check, all-or-nothing write, undo (WKB-009). Nothing is renamed or deleted by an edit except undoing a note the edit created.
5. **Not yet.** Removing or changing a relationship, connections between ports, transitions and flows, renaming, moving a note, editing a usage's quantity. Eligibility follows the importer's endpoint rules, not a full SysML type check; the parser gate remains the conformance check.

Rules: WKB-008, WKB-009, WKB-010.
