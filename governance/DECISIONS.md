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

## D-0031 — Change and remove relationships, relationship properties, and "?" help

2026-10-20 · Spencer · Accepted

1. **Selecting.** A relationship opens in the Edit lens from the Relationships tab (the selected note's list), the Edit button on a relationship table row (panel or main window), or the canvas: a canvas edge's id carries its location, so the command "Edit the relationship selected on the canvas" (and the line's right-click menu, where Obsidian offers one) opens it. The canvas is a disposable preview; regenerate it after an edit.
2. **Change.** Target (searchable browser, eligible notes only), dependency kind, and properties. Remove deletes the relationship and everything written inside it. Both show a diff first, are undoable and refused if the file changed (WKB-009).
3. **Properties ("attributes").** Written inside the relationship in SysML: `doc` (description), `attribute name = value;` for free attributes, quantity, direction, `ordered`, `nonunique`, name. A drop-down offers the options that relationship has; "Other attribute…" takes a typed name and value only where allowed (owned usages, satisfy, allocate, perform, include, extend, dependency kinds; not specializes or verifies). Values that are not a number or simple text are stored in a `doc` inside the attribute, so text such as `;`, `}` or `*/` cannot break the block.
4. **Scanner.** Attributes and docs inside a usage or statement are kept on it as properties, not as usages of the definition; `ordered` / `nonunique` are read; a `// kind` tag after a closing brace is read, so a dependency keeps its kind when it has a description.
5. **"?" help.** A button beside each option opens a popover with a one-sentence definition, up to three option lines and a link to the full note in `99_System/04_Language`. The text is bundled (no lookup, no delay); a test checks every linked note exists and every topic is concise.
6. **Form state.** The Edit lens keeps a form being filled when the index refreshes; it is reset after an applied edit, a lens change or a different selected note.
7. **Not yet.** Changing a relationship's kind across groups (for example satisfy to allocate), reordering, connections between ports, transitions and flows, members with more than one definition per note (the index reads the first definition of a note, as before).

Rules: WKB-011, WKB-012, WKB-013.

## D-0032 — Importer builds the full vault: plugins, Bootstrap, name prompt, BOM

2026-10-20 · Spencer · Accepted

1. **Vault contents.** The base vault now ships Bootstrap 0.1.0, the Workbench, and unmodified releases of Templater 2.25.0, Advanced Canvas 7.1.0 and Obsidian Git 2.40.0 (files kept in `tools/base-vault/vendor`, hashed in `plugin-lock.yaml`). Fileclass and Breadcrumbs (BOO-001 "provisional") are not shipped.
2. **Settings.** Templater and Obsidian Git start from the V1 vault's values with two changes: Obsidian Git does not pull on boot (a new vault has no remote, so every start would raise an error), and Templater keeps `trigger_on_file_creation_mode: none` so imported notes are never templated. Advanced Canvas runs on its defaults. The settings are seeded into `data.json` and written into the lock; Bootstrap merges them back at each start. This differs from BOO-005's "data.json is hash-locked": a hash lock would reject any change the person makes through the plugin's own settings page.
3. **Licences.** Templater is AGPL-3.0 and Advanced Canvas is GPL-3.0. They are shipped unmodified with source links in `99_System/THIRD_PARTY_NOTICES.md`. If a vault is given to other people, those licences apply to what is given.
4. **Trust.** Obsidian's "Trust author and enable plugins" choice cannot be set by a vault file. The page says so, and Bootstrap acts after it.
5. **Page.** Name prompt first; stage progress bar; sources (QEAX and/or BOM); destination; build; Obsidian steps. A BOM alone builds a vault with the BOM notes; a QEAX alone behaves as before.
6. **BOM.** Flat and redline layouts, `.xlsx` (in-page reader that keeps struck-out runs), `.csv`, `.tsv`. Latest revision only (ADR-V2-08). Mapping and findings per BOM-015..017.
7. **Not yet.** No real BOM workbook has been run; the redline layout is inferred. The EA key for a part number is undecided, so EA to BOM matching is a report. A part number already in the vault is not refreshed from a newer BOM. A replaced part number (struck in a redline) is recorded as text, not as a `supersedes` link, because the old number has no note. The pages and plugins have not been run in a real Obsidian.

Rules: IMP-099, IMP-100, BAS-012, BOO-007, BOO-008, BOM-015, BOM-016, BOM-017.

## D-0033 — Ports in full SysML v2 (first tranche)

2026-10-20 · Spencer · Accepted

1. **Scope.** The EA model comes into v2 with its functionality. This tranche covers ports and their connections: port definition features, conjugated and counted port usages, interface ends, connections in three forms, flows and bindings. Language: SysML v2 as pinned; the real parser gate runs in CI only.
2. **Workbench.** The scanner reads all of it; the Interfaces view shows ports (with conjugation and directed features seen from the owner), ends, connections, flows and bindings; the Edit lens has a Ports tab (WKB-014..016).
3. **Importer.** Port multiplicity, conjugation from an `isConjugated` tag, and no interface-typed ports (IMP-101). EA stores port conjugation in a way not yet seen in a real model; only the tag is read.
4. **BOM filenames.** A BOM note is named by its part number alone; the part number is also the title of the note's file. This corrects BOM-016.
5. **Not yet.** InformationFlow to `flow of Signal from a.x to b.y` (needs the conveyed items from t_xref, layout unverified); attributes from t_attribute; the assembly merge tool (alias, then merge); dependency kind as real metadata instead of a comment tag.

Rules: IMP-101, WKB-014, WKB-015, WKB-016, BOM-016.

## D-0034 — Alias, then merge (one note per part)

2026-10-20 · Spencer · Accepted

1. **Two steps.** A note that is the same part as another is first marked `aliasOf` the one that stays (MOD-167). Merge acts only on aliases, so each match is reviewed before anything is combined.
2. **Finding matches.** The EA part number line (`- PN:` / `- Part Number:`) equal to the BOM number; then the BOM number inside the EA title; then a close name (never pre-ticked). Only a single candidate, not claimed by another BOM part, is ticked. Hundreds of parts become one reviewed batch plus a manual remainder (WKB-017).
3. **Merge.** The BOM note stays by default, because its file name is the part number. Content is combined without loss (WKB-018): conflicts are kept apart under a heading, the removed id and uid are under Former ids, and every link and SysML symbol that named the removed note is rewritten (WKB-019). Undo restores the removed notes.
4. **Generic and specific parts.** Merge is for an EA element that is the part. An EA element that is a generic design a part number realizes stays separate; use Specializes (the part number's definition specializes the generic one).
5. **Not yet.** Re-importing EA after a merge: the removed note's uid is only in Former ids, so the importer would see a new element. Canvases that show a removed note are not updated. Notes with more than one definition are refused. Matching when the EA part number is absent and the name differs is manual.

Rules: MOD-167, WKB-017, WKB-018, WKB-019.

## D-0035 — Names the folder writer refuses

2026-10-21 · Spencer · Accepted

A full EA import translated all 23,112 notes and then stopped at the folder write: `getFileHandle … Name is not allowed`, with no path in the message. The name rules covered a whole name equal to a device name but not `Con.pdf` (attachments add an extension after the name is made safe), nor invisible or bidi characters. Names are now made safe at the source so links stay consistent (IMP-102), the page lists every unwritable path before it writes, and a write error carries its path.

Rules: IMP-102.

## D-0036 — Path length and write retries

2026-10-21 · Spencer · Accepted

The same EA import built a ZIP that Windows would not extract, and a folder write that stopped with `InvalidStateError`. A folder path shortener was tried and removed: it broke the standing rule that no name is cut for path length (the limit is 400 characters and shortening is a post-import task), and it spelled one folder several ways (`00 Abstracts`, `00 Abst~1pt`, `00 A~1pt`). The importer keeps full names; only IMP-102 safety changes apply. The write retry stays: a file is tried up to six times with a growing delay on the browser's state errors, and an error carries the file path (a DOMException message cannot be edited, so a new Error is thrown). The cause of the state error (antivirus, OneDrive or the indexer touching a new file) is diagnosed, not confirmed.

Rules: IMP-103.

## D-0037 — Parts, ports and connectors follow the EA fields V1 proved

2026-10-21 · Spencer · Accepted

A real EA run came in with every Part usage (1,824) and every Port usage (2,337) untyped, 2,100 Ports and 746 flow pins deferred, and Part-level connectors lost. Cause (confirmed against the vault output and V1 evidence W-44, W-113, W-114, W-120): PDATA1 holds a GUID, which was read as a number; a Port's type is its PDATA1, not Classifier; EA interface Classes were written as `interface def` although ports are typed by them; and Ports under Parts, the V1 instance ports, were not merged into the block's port. Changes: IMP-104 to IMP-109 and IMP-111. Not changed: the approved family mapping file still names `InterfaceDefinition` for the interface stereotypes; the importer writes them as `port def`. Open: PDATA2 (port redefinition) is not yet written as `:>>`; `isReference` Parts are not yet `ref part`; Ports under an Object and ports on nested Parts still follow the older owner rule. Not run on the real `.qeax`.

Also: usage names keep an acronym's case (IMP-112). The Engineering_Data mini `.qeax` holds 7 Parts and 16 Ports (the full model 3,134 and 4,790), so these changes are tested on the synthetic fixture only, not on real Part and Port rows.

Rules: IMP-101, IMP-104, IMP-105, IMP-106, IMP-107, IMP-108, IMP-109, IMP-111, IMP-112.

## D-0038 — Relationships follow the approved Test_Vault_ policies

2026-10-21 · Spencer · Accepted

The 2026-10-17 approved decision docs in Test_Vault_ `24_Workbench/docs` (aggregation by kind, repeated aggregations as distinct usages, nested states, activities and requirements, ownership cycles, generated usage names, multiplicity, realisation, association) were not in V2. They are now: IMP-113 to IMP-118. On the mini model the connectors left for review fall from about 1,700 to 370. What is still open and needs a decision: Association between components (no connectivity evidence), Generalization from an interface to a part, flows touching StateNode, Synchronization or Decision nodes that have no owner, PDATA2 redefinition, `isReference` Parts, Part data on the assembly, and the provisional `tracesTo` for Issue and Change links.

Rules: IMP-113, IMP-114, IMP-115, IMP-116, IMP-117, IMP-118, IMP-119.

## D-0039 — Families found only in the full model, and what stays open

2026-10-21 · Spencer · Accepted (the mapping rows follow existing approvals; the open items are his to decide)

The full EA model has 12 element families and 4 connector families that the reduced QEAX (60/26) does not contain. They are in `ea-family-mapping.json` now, so the first full-model run flags nothing as UNKNOWN_FAMILY by accident:

- Requirement:Regulatory Requirement and Requirement:physicalRequirement are requirement defs (REG-289). Port:ProxyPort, Port:FullPort, Signal:Environmental Effect, Class:Environmental Interface, State:Fault State and StateMachine follow their base family. Artifact:CustomDocument is an attachment.
- ActivityPartition, ActionPin and ActivityParameter have no approved rule and are review rows (grouping is not ownership; pins have no rule).
- Connector:BindingConnector (`bind`) and InformationFlow:itemFlow (`flow`) are IMP-120. Dependency:ASILDecompose has no rule and is a review row. Realisation:refine follows Dependency:refine.

Settled by searching the earlier work: PDATA2 is not applied (REG-189); isReference is `ref part` (REG-293); ports under an Object already work because an Object is a part def, and ports under a Part are IMP-106; Decision nodes are MDSE notes with `precedes` links; a StateNode or Synchronization with no owner stays deferred; an Association between components stays a review row, with no generic fallthrough (REG-189).

Still open for the owner: Association between components (about 106 on the mini model); Generalization from an interface to a part (44, flagged exception); whether `tracesTo` stays provisional; owner-less control nodes (about 134 flows); ASILDecompose, ActionPin and ActivityPartition rules; a full-model Part and Port export to validate the nested-usage output.

Every deferred row now leaves a flag in the vault (IMP-123). The holding note needed a modelCheck subtype, so `Review` was added to the class in `element-types.yaml` (MOD-056 says blank, but the validator rejects a blank subtype and the other subtypes are EA types). On the mini model that is 370 flags for 14,688 connectors and 11,447 elements.

Rules: IMP-120, IMP-121, IMP-122, IMP-123.

## D-0040 — The BOM files, and what the product assembly is missing

2026-10-21 · Spencer · Accepted (code changes); open items are his

The four real BOMs in Engineering_Data (`BOMs/`) were run through the importer for the first time. Only the Power Station file was readable: the DVS 330 IP55, DVS 400 and MVS 800 sheets were refused (header below a preamble or on row 2, no header on the level columns, `Part Number`, `UOM`, `Unit` used as the quantity). All four now parse (about 2,575 lines, 3 layouts). BOM-015 and BOM-017 say what is accepted.

Checked on the Power Station import: the tree is complete: 495 distinct parent-child pairs read straight from the sheet against 490 in the vault, and the differences are struck-out or replaced part numbers and drawing lines. It is 8 levels deep (0 to 7). The Workbench rolled-up parts list was wrong: it counted every BOM child twice because the YAML `hasPart` and the SysML usage both became edges, so quantities were multiplied by 2 at every level (22,774 against 1,361). Fixed (WKB-020), and measured material is now listed with its unit (WKB-021).

The four BOMs share 85 assemblies. In 9 of them the same part number and revision has different quantities or pinned child revisions (e.g. 5913558 rev A02 uses 1.232 m of 01798-009-M in one BOM and 1.029 m in another). The first import wins; the later file now reports `EXISTING_DIFFERS`. Which is right is an engineering question.

What the assembly is missing: nothing joins the BOM to the EA product structure. The EA model has no part numbers on its physical elements (PN tag: 6 values in the mini model, one of them `59xxxxxx`; EA alias holds a part number on 11 elements, mostly BMID). Of 310 Power Station BOM part numbers none appears in an EA name, alias or PN. The Workbench Merge tab (WKB-017) can only offer name matches. The EA side has the products (Power Station OBJ-00375, Power Server MVS 800 OBJ-02558, DVS 400, DVS 330 CE IP55) but a different decomposition from the BOM (EA: electrical, enclosure, PCBA, kits; BOM: 5913537, 5913538, ...).

Open for the owner: the PN for each EA product and major assembly; whether BOM parts should become the leaf definitions under the EA blocks or stay a separate manufacturing structure that is only linked at the top; and whether the 3 remaining BOMs and the full Ampure_all_BoMs history (172,454 lines, 16,472 part numbers, 95,773 lines archived) are in scope.

Rules: BOM-015, BOM-017, WKB-020, WKB-021.
