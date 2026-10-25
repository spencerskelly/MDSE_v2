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

## D-0041 — Workbench views, import checks, toolset version, usage naming

2026-10-21 · Spencer · Accepted (code changes); open items are his

Workbench: structure, design types, internal structure, function, states and requirements are separate views, so a state machine is not mixed into a parts tree and design subtypes are not mixed into composition (WKB-022). Sections and list groups fold (WKB-023). A measured quantity printed `NaN` for its unit because of a stray `+`; fixed.

Importer: a check that runs the whole translation in memory and lists the flags before anything is written (IMP-125); a version table of the vault's toolset against the importer's, with a tick box to update or not (IMP-126). The repo had no version, so every vault said `0.0.0-dev`; the release is now `0.9.0` and the Workbench `0.9.0`.

Naming, from reading the MDSE_v2_02git output: `+3.3VDC` and `3.3VDC` both became `_33VDC`, an unnamed `1` became `_1`, and the two ports called `a` on a wire became `a` and `a_2` with nothing to say which was the jacket and which the conductor (IMP-124). Quoted SysML names (`'+3.3VDC'`) would keep the name exactly but every Workbench reader and edit form matches plain identifiers, so they were not used.

Open for the owner: PDATA2 redefinitions (about 20 on the PT4 circuit alone) are still written as a second port beside the inherited one, because IMP-060 says redefinition is never inferred. The EA data is explicit, not inferred, so `port x :> parent.port` could be written where PDATA2 names the redefined port; that reverses IMP-060 and IMP-121 for this one case and is his decision.

Rules: IMP-124, IMP-125, IMP-126, WKB-022, WKB-023.

## D-0042 — Voltage names, unnamed parts, port naming still open

2026-10-21 · Spencer · Accepted (voltage, parts, objects); ports open

Voltages: V goes at the decimal point and the sign is a letter, `P` for plus and `N` for minus (option A): `+3.3VDC` is `P3V3DC`, `-3.3VDC` is `N3V3DC`. An unsigned voltage that starts a name also takes `P`. Unnamed parts: type plus index, `wire1`. Objects: the full title is kept.

Counts correction: the figures given on 2026-10-21 for untyped usages (1,178 ports, 2,929 parts) counted `part def` and `port def` lines as usages. The right figures from the MDSE_v2_02git output are 757 untyped of 2,928 ports (332 have no EA name, 420 are named) and 99 untyped of 2,384 parts.

Open: the port standard (flow and type in the name) and a bulk rename and retype sheet.

Rules: IMP-124, IMP-127.


## D-0043 — Workbench: draw a line on the canvas to add a relationship

2026-10-22 · Spencer · Accepted (owner request, chat)

1. **Gesture.** On the canvas preview, drag a line from one note card to another. After a moment the Workbench opens a dialog: a drop-down of the relationship kinds the two notes allow, the inputs that kind takes (name, quantity, direction), and the diff. Apply writes it; Cancel removes the line.
2. **Direction.** The line runs from the note that holds the relationship to the note it points at, as in the Edit lens: from a part to a requirement it satisfies. A line drawn backwards is not refused, because the generic kinds (allocated to, refines, traces to, depends on) work both ways; the dialog says which kinds would fit if it were drawn the other way.
3. **Same safety as the Edit lens.** The write is the Edit lens plan (WKB-009): previewed, applied on a click, refused if the file changed, undoable. The relationship goes into the source note's `## SysML v2` block (D-0003). A line is a picture and never becomes model meaning by itself.
4. **Refused lines.** A line that touches a card that is not a note in the vault (free text, a group card, a "not in vault" card), two ends on one note, or a pair with no kind that can be written now, is removed with the reason shown.
5. **Where it works.** The preview canvas only (the one scratch file). A saved canvas is an ordinary canvas.
6. **After Apply.** The line stays, labelled with the kind. It has no edit handle until the preview is opened again, because that is when the lines get their relationship references.
7. **Not yet verified.** Tested against the fake Obsidian API only. Removing or labelling a line is done by editing the canvas file while the canvas is open; real Obsidian may keep its own copy of the line and write it back.

Rules: WKB-024.


## D-0044 — Language catalog: corrections, standard-library concepts, modeling patterns, support levels

2026-10-23 · Spencer · Accepted (owner request, chat, from a language coverage review)

1. **Three groups.** Every catalog entry has a `category`: `language` (a construct of the SysML v2 textual language, 109), `library` (a concept from the SysML v2 standard library, written with those constructs, not a keyword, 12; each names its `library`) or `pattern` (a rule of use that decides which construct to pick, adds no syntax, 2; each lists the constructs it `recognizedAs`).
2. **New library concepts.** Conditional succession (a language construct, added to the language group), requirement derivation, causation, multicausation, trade study, verdict kinds, verification methods, quantities and units, rationale, issue, status and refinement metadata, shape items. Patterns: requirement decomposition, ownership versus reference.
3. **Corrections.** Succession: simple and guarded (`if`, `else`) are told apart. Use case: SysML v2 has no `extend`; MDSE writes an optional include (`[0..1]`) as a convention and the note says so. Individual definition and usage: `individual` is a prefix on an occurrence definition or usage, metaclass shown as `OccurrenceDefinition (isIndividual = true)`. The review's claim that `individual def` is not a construct was wrong: the grammar allows it.
4. **Four support levels.** Each note states, separately: documented, recognized by the Workbench scanner (tested), written by the importer (measured), accepted by a SysML v2 parser. The last is not established for any entry, because the pinned parser (IMP-068) has not been run on the examples. A listed construct is not a supported one.
5. **Model output.** Unchanged in this decision; derivation and refinement forms were settled in D-0045 (OD-09 closed).
6. **Confidence.** Examples were written from the specification grammar and library files as read through a summarizing fetch. Causation, multicausation, trade study subject, and verification method usage are the least certain forms. Treat them as unchecked until the parser has run.
7. **Not done.** Geometry beyond shape items, and the spec section number per entry, are not in the catalog. The live vault gets these notes when MDSE_v2_live next syncs from the base vault.

Rules: MOD-165, MOD-166.


## D-0045 — Native SysML v2 forms wherever they exist; the `live` rule tag

2026-10-23 · Spencer · Accepted (owner request, chat)

1. **Principle.** The language MDSE writes is as close to native SysML v2 as possible: a keyword, a standard-library element or standard metadata where one exists. A comment tag or MDSE convention is used only where SysML v2 has none. (MOD-168)
2. **OD-09 closed, option C.** Requirement derivation is written `#derivation connection derive_<original> { end #original ::> <original>; end #derive ::> <derived>; }` in the derived requirement's note. Refinement is written `#refinement dependency from <refining> to <refined>;`. (MOD-169, IMP-128, WKB-025)
3. **Old forms.** `dependency … // derivedFrom` and `// refines` are still read, so existing notes and vaults load. They are replaced by the native form when the relationship is edited in the Workbench; nothing rewrites them in bulk.
4. **Exceptions, each because SysML v2 has no native form.** `dependency … // trace`, `// dependsOn` and `// uses` (a trailing comment tag; the dependency itself is native). An optional use case written `use case x : Y[0..1]` where SysML v1 had `extend`. Provisional `tracesTo` links. These stay until a native form is found.
5. **Unverified.** The library names (`#derivation`, `#original`, `#derive`, `#refinement`) and the connection-with-two-ends layout come from the specification and library files as read through a summarizing fetch. The pinned parser (IMP-068) has not been run on them. If it rejects a form, the form changes here.
6. **`live` tag.** A rule line may carry `· live` after its Phase. It marks rules new or changed since the live vault's documentation was last updated, so the documentation updates can be found; the register CSV has a Live column. It does not change whether a rule binds. Applied to WKB-024, MOD-165, MOD-166 and the rules added here. The tag is removed once the live documentation is updated.

Rules: MOD-168, MOD-169, IMP-128, WKB-025.


## D-0046 — BOM import: findings from the real BOM set, two fixes made, data decisions opened

2026-10-23 · Spencer · Accepted (owner request, chat: "make sure this data can be brought in clean")

The importer's BOM path was run on the five workbooks in the Engineering_Data repository (four redlines and the 172,454-row flat export) in a scratch folder. Nothing from that data was added to this repository.

1. **Redlines.** All four import with no blocking error. Remaining findings: lines with no line number (about 5 per file), quantity 0 lines (6 to 43 per file), and one part number whose revision cannot be told. The same shared sub-assembly appears in two redlines with different quantities (for example wire lengths), so a second redline is left as it is with `EXISTING_DIFFERS`; that is correct, and the people who own the BOMs must reconcile the numbers.
2. **Flat export.** 12,076 parts and 30,699 usages import, but 2,513 parts are held back: 1,259 assemblies have more than one revision with lines (COMPETING_BOMS), 1,254 parts are pinned at different child revisions (REV_UNDETERMINED), and 748 lines are refused as duplicates (DUP_LINE). The export is an effectivity history, not a single BOM: 19,104 parent-revision-line keys repeat with different child revisions and From/To dates; for 77 % of them exactly one row has an open-ended To.
3. **Fixed now.** The export ends with a row of `x` in every column; it became a part note named `x`. It is now skipped (END_MARKER). `partNumber` was written unquoted for numeric part numbers and quoted otherwise; it is now always a string. Uid allocation was quadratic for BOM runs (every part shares one fallback stamp): the flat export took 189 s, now 64 s, with identical output.
4. **Not fixed, needs a decision (OD-10 to OD-13).** Scope of what comes in; how the current row and current revision are chosen; unit and state vocabularies; quantity differences between products.
5. **Data facts for those decisions.** Units differ by source: the flat export uses codes (ea, M, ML, ZST, Null, x), the redlines use words (Piece, Meter, Milliliters, "Piece (ZST)"). 39,033 flat rows carry a numeric child state (20, 30, 40, 50) instead of a name. Dates are text in mixed locales (for example `Mrz` for March) and `2/Jan/00` appears to be a default. The flat export holds older revisions of the four product roots than the redlines do, so the redlines are newer than the flat data for the same products.

Rules: IMP-129.


## D-0047 — BOM import: the owner's decisions on scope, revisions, units, dates, states and duplicates

2026-10-23 · Spencer · Accepted (owner, chat, after D-0046)

1. **Scope (OD-10).** Every part gets a note, for all products. (BOM-022)
2. **Latest revision (OD-11).** The latest revision is the active one; older revisions and old part numbers named in the BOM are identified in the part note, and the assembly note identifies the older revision it pins. The owner did not give an order for revisions; BOM-018 is an assumption (placeholders lowest, then letters, then the number) and every choice it makes is listed as `REV_BY_ORDER`. Lifecycle states are ignored (BOM-021).
3. **Replaced part numbers.** The new part number gets the note, with a `## Replaces` section naming the old one. The importer can only see this where a redline strikes out the old number; the flat export has no such marker. (BOM-023)
4. **Names and merging.** The file name is the part number. The part description is the `description` YAML property. The EA element is matched to its BOM part later and by hand: the two notes are joined with `aliasOf` and merged with the existing Workbench alias and merge operation (D-0034, MOD-167). Nothing new is built for that.
5. **Vocabularies (OD-12).** Units: BOM-019. Dates: BOM-020, text only. States: ignored.
6. **Different values (OD-13).** First imported is kept; the other is added as a `flagValue` callout for review (BOM-024, MOD-163). Within one file this is done in the assembly note. Across two files (the same assembly in two redlines) the first file's note stays untouched, so the difference is listed in the findings note as `EXISTING_DIFFERS`, not as a callout; writing a callout into an existing note is not done.
7. **Result on the real BOM set** (scratch run, nothing committed): the flat export now imports 14,539 parts and 50,200 usages with none held back (was 12,076 parts with 2,513 held back). 16,074 repeated lines are flagged for review. The four redlines import with the same findings as before plus the unit and date changes.
8. **Known weakness.** First-imported is not always the current row: in the flat export the first of a repeated line has no end date in only 18 % of cases (all revisions counted). The flag shows both so a person can choose, but a rule such as "prefer the row with no end date, else the first" would keep the right row far more often. Not adopted; the owner decides.

Closes OD-10, OD-11, OD-12, OD-13. Rules: BOM-009, BOM-016, BOM-017 (changed); BOM-018 to BOM-024 (new); MOD-163 (flagValue).


## D-0048 — BOM import: SysML relationships, manufacturer properties, import order and efficiency

2026-10-23 · Spencer · Accepted (owner, chat, after D-0047)

1. **Repeats.** Repeated lines in one assembly are treated as differing values: the first stays, the others are `flagValue` callouts for review (BOM-024, unchanged). The "prefer the row with no end date" change was not adopted.
2. **Order.** The newest BOMs go in first: the Power Station, DVS and MVS redlines, then `Ampure_all_BoMs.xlsx`. Because the first note written wins, the redlines take precedence over the history export. (BOM-029)
3. **Efficiency.** A part number already in the vault is skipped without per-line findings; findings in the findings note are capped at 40 rows per code. (BOM-026, BOM-027)
4. **All relationships in SysML.** The `hasPart` and `references` YAML properties are no longer written on BOM notes, because the SysML usages say the same thing (the Workbench already counted each once). A drawing is a `ref item` usage typed by an `item def` in the drawing note, which now carries a small SysML block. A renumbered part is `dependency from new to old; // supersedes` (replaces the `## Replaces` section of D-0047). The Workbench reads a `ref` usage as a `references` edge (it was `hasFlow` for items) and `supersedes` as an edge kind. `supersedes` joins the comment-tag exceptions of D-0045, because SysML v2 has no replaces relationship. (BOM-025)
5. **Manufacturer data.** YAML properties `manufacturer1`, `mfgPn1`, `manufacturer2`, `mfgPn2`, and so on. (BOM-028)
6. **Unverified.** `ref item x : Type;` and the `item def` in a Document note have not been run through the pinned SysML parser. A renumbered part's `supersedes` dependency points at an unqualified `P_<old>` when the old part has no note yet; it is not rewritten when that note is imported later (the flat export), so a second pass or a Workbench fix is needed for those.

Rules: BOM-016, BOM-023 (changed); BOM-025 to BOM-029 (new).


## D-0049 — BOM import: stub notes for replaced part numbers, and the BOM sample is parser-gated

2026-10-23 · Spencer · Accepted (owner, chat, after D-0048)

1. **Stub notes.** A part number named as the previous number of another part, but listed in no BOM, still gets a note (no revision, head line says no BOM lists it). Otherwise the `supersedes` dependency of the new part would point at nothing. (BOM-030)
2. **Parser gate.** CI assembles a synthetic redline plus flat BOM through the real importer into one `.sysml` file and runs the pinned validator on it (`testing/fixtures/bom-sample`). This covers `part def`, usages with multiplicity and quantity, `ref item`, `item def` in Document notes, `#derivation`, `#refinement` and `supersedes`. Run 40040942222: accepted, all jobs successful. The parser job stays manual (`workflow_dispatch`, `parser=true`); run it again whenever the importer's SysML output changes.
3. **Still unconfirmed.** The revision order (BOM-018) against the PLM; cross-file differing values (findings only, no callouts); the 14.5k notes in one folder and the 1.2 GB Workbench index heap on the real set; the browser handling of the 48 MB file.

Rules: BOM-030 (new).


## D-0050 — BOM import: every note carries an import stamp, so later updates can be scanned without rewriting notes

2026-10-23 · Spencer · Accepted (owner, chat, after D-0049)

1. **Why.** The owner wants to re-run imports later to update parts and assemblies, with a scan, a list of changes, and approval by category or one at a time. For that the importer must know what it wrote last time; otherwise it cannot tell a changed BOM from a note edited by hand. The stamp has to exist when the notes are created, or about 16,000 notes would have to be rewritten later.
2. **The stamp.** Three YAML properties at the end of the frontmatter: `importSource` (the file name), `importedOn` (`YYYY-MM-dd`) and `importHash` (16 hex digits of the SHA-256 of the importer-owned content). (BOM-031)
3. **What the hash covers.** The `description`, `manufacturerN` and `mfgPnN` properties and the SysML block. Prose, callouts, `status`, `tags` and anything else a person edits are not covered. A later scan recomputes the hash from the note in the vault.
4. **How a scan will use it** (not built yet). Note hash equals stamp and the new BOM differs: proposed update. Note hash differs from stamp: a person changed it, so it is a conflict, never applied automatically. Categories, approval and apply are a separate piece of work and need no further format change.
5. **Limits.** The stamp says nothing about notes the importer did not write. Moving or renaming a note does not break it. Merging an EA note into a BOM note (D-0034) keeps the BOM properties and the SysML block, so the hash still matches unless the merge changed them. **Corrected in D-0052:** this was not true. The merge dropped the BOM properties and added the EA members to the same block.

Rules: BOM-031 (new).


## D-0051 — BOM import: update scan with approval by category or by item

2026-10-23 · Spencer · Accepted (owner, chat, after D-0050)

1. **What it does.** A later BOM file is read against the vault and the differences are listed without writing anything. The owner ticks a whole category or single items, and only those are written. It lives in the Importer, in a card of its own, next to the build step.
2. **Categories.** New part; new revision of an assembly; part description; manufacturer data; part source or drawing location; assembly line added; assembly line no longer listed; assembly line changed; drawing reference added or removed; new part number replaces an old one. Nothing is ticked by default. (BOM-032)
3. **Left alone, and listed.** A note whose owned content no longer matches its stamp (edited since the last import), a note with no stamp, and an assembly for which the file's latest revision is older than the vault's. These are never proposed. (BOM-033)
4. **Scope of removals.** A line is "no longer listed" only for an assembly that the file has lines for, at the revision the vault holds. A file that names a part only as a child removes nothing. Applying a removal deletes the line from the note's SysML block; the report note records it. A new revision of an assembly is one item that replaces the whole block, and the note keeps a line naming the replaced revision. (BOM-034)
5. **Apply.** An approved line that points at a new part brings that part's note with it. The stamp of a changed note is set to the hash of the merged content, so anything not ticked is offered again at the next scan. A report note `99_System/11_Import/BOM Update <date>` lists every applied change. There is no undo in the Importer; the report and the vault's own history (Obsidian Git) are the way back.
6. **Checked on the real BOM set** (scratch): the flat export imported as 16,472 notes; scanning the same file again proposed 0 changes and left 0 notes alone (16,472 unchanged). The scan takes about the same time as the import (one to two minutes on this machine).
7. **Not covered.** Values that differ within one file (the first-wins `flagValue` rule) are decided at import and not re-decided by the scan. Notes merged with an EA note are compared only on the BOM-owned content. Rename or move of a note is handled (the scan finds it by part number inside the note), but a note renamed to a different part number is a different part.

Rules: BOM-032, BOM-033, BOM-034 (new). BOM-029 (newest first, first wins) applies to the first load; the scan is how later files are brought in.


## D-0052 — BOM updates after the EA merge: the importer owns its own members, the model owns the rest

2026-10-23 · Spencer · Accepted (owner, chat, after D-0051)

1. **The scenario.** BOM and EA are imported, the EA note is merged into the BOM note, and later a new BOM arrives with new revisions or data. The update must not alter model data.
2. **What was wrong.** Tested on the synthetic vault: (a) the Workbench merge dropped the survivor's `description`, `manufacturerN`, `mfgPnN` and the import stamp; (b) the stamp covered the whole SysML block, which after a merge also holds the EA ports, `satisfy`, `connect`, `bind` and the specialization, so every merged part would have been "edited since the last import". Nothing was damaged (the scan held such notes back), but no merged part could be updated.
3. **Ownership by field, not by note.** The importer owns, inside a BOM part note: the properties `description`, `manufacturerN`, `mfgPnN` and the stamp; and in the SysML block the attributes `partNumber`, `revision`, `source` and `drawingLocation`, the part usages that carry `childRevision`, the `ref item` drawings and the `// supersedes` dependencies. Everything else (ports, satisfy, connect, bind, other dependencies, specializations, other attributes and usages, prose, callouts, `status`, `tags`) belongs to the model. (BOM-035)
4. **Stamp.** `importHash` now covers only the importer-owned properties and members, so it survives a merge. A person's change to an owned member or property is a conflict and is held back; a change to anything else is invisible to the update. (BOM-031, changed)
5. **Update.** A scan compares and an apply changes only owned members. A new revision replaces the owned members as a set, at the place of the first one, and leaves every other member where it is. A new usage cannot take a name the model already uses in that definition. A block the importer cannot read member by member (comments spanning lines, members not at the usual indent) is held back whole.
6. **Merge.** The surviving note keeps its plain properties; plain properties only the removed note has are carried over; the import stamp of the removed note never is. (WKB-026)
7. **Revisions are text.** `revision` and `childRevision` are always written as strings. A revision such as `-199` was written as a number before, losing its meaning; part number, source, reference designator, notes and dates are text too. Quantity and line stay numbers.
8. **Open.** OD-14: which composition is authoritative when the EA part and the BOM both describe an assembly's parts.

Rules: BOM-031 (changed), BOM-035, WKB-026 (new).


## D-0053 — Merge: the owner of each area is chosen at the merge, and recorded for later BOM updates

2026-10-23 · Spencer · Accepted (owner, chat, after D-0052). Closes OD-14.

1. **The owner's rule.** The BOM owns structure; the model owns how a part connects to other notes, its behavior and its requirements. At a merge that is the recommendation, and the owner can change it per area.
2. **Seven areas.** Part facts; Structure; Properties; Interfaces and connections; Behavior; Requirements; Other relationships. Part facts and Structure are the two a BOM can own. Each member of the SysML block belongs to one area by its keyword (`port`, `connect`, `bind`, `allocate` are interfaces; `state`, `action`, `transition` are behavior; `satisfy`, `verify`, `requirement`, `constraint`, `#derivation`, `#refinement` are requirements; `part` and `ref item` and `// supersedes` are structure; other dependencies and specializations are other relationships; the rest are properties). (BOM-035, changed)
3. **The chooser.** Choosing Merge on an alias pair shows the seven areas with the number of members each note has, and a selector per area: the surviving note, the removed note, or keep both. The recommendation is preselected: the BOM note for the two BOM areas, the EA note for the other five unless the BOM note already has members there (then keep both). With no BOM note in the pair, every area is "keep both", as before. "Merge all" uses the recommendations without asking. (WKB-027)
4. **What a choice does.** The owner's members and properties are kept. The other note's members of that area are not dropped: they are listed under `## Not carried over from <title>` in the merged note, as SysML text (and the properties as yaml), with the name of the owner. The EA note's own part usages therefore stay out of a BOM-owned structure and can be moved back by hand. Specializations of the removed note are added unless Other relationships is given to the surviving note.
5. **Recorded on the note.** If the BOM no longer owns Part facts or Structure, the merged note carries `bomOwns: [facts]`, `[structure]` or `[]`. No property means both. A BOM update compares and changes only the areas listed: with `[]` the note is listed as "the model owns every area" and left alone. (BOM-036)
6. **The stamp.** The merge recomputes `importHash` for what the BOM still owns, but only if the stamp matched before the merge; a note edited before the merge stays a conflict.
7. **Closes OD-14.** The composition question is answered by the owner's choice per merge; the default is that the BOM note owns structure.

Rules: BOM-035 (changed), BOM-036, WKB-027 (new).


## D-0054 — BOM updates: a hand edit marks the items instead of holding the note

2026-10-23 · Spencer · Accepted (owner, chat, after D-0053). Changes D-0051 item on edited notes and D-0053 item 6.

Reason (owner): people are not always right. A hand edit to BOM-owned content must not park the note, because a later BOM can be the correct value.

1. **What changes.** A note whose BOM-owned content no longer matches its `importHash` is no longer held with `CONFLICT`. It is scanned like any other note, against its current content.
2. **Marker.** Every item for such a note carries `edited: true` and the text `[edited since last import]` in its summary. Applying the item replaces the edit; for a new revision that is every BOM-owned member of the note. Nothing is ticked by default (BOM-032), so no edit is replaced without the owner's tick.
3. **The file's value is offered back.** An edited note is compared even when the file is unchanged since the import, so the BOM value is offered in place of the edit on every scan until it is applied or the note is brought in line. This is deliberate and will repeat for edits the owner wants to keep.
4. **Unchanged.** A note without a stamp (`NO_BASELINE`), an older revision in the file (`OLDER_IN_FILE`), `bomOwns: []` (`NOT_OWNED`) and a SysML block the importer cannot read (`CONFLICT`, now only for this case) are still left alone.
5. **D-0053 item 6.** A merge still recomputes `importHash` only if the stamp matched before the merge. A note edited before the merge is therefore scanned and marked, not a conflict.
6. **Not decided.** Whether an engineer can keep an edit without seeing it offered again (a re-stamp or an ownership change, the other options discussed) is left open.

Rules: BOM-031, BOM-033 (changed).

## D-0055 — BOM import: a part number named two ways is flagged, not silently resolved

2026-10-23 · Spencer · Accepted (owner, chat, after D-0054)

1. **Problem.** When one part number at one revision appeared with different names on several rows, the first row's name was used and the others were dropped without a word. The part note then showed one name with no sign that the file disagreed with itself.
2. **Decision.** The first name is still used (D-0047 is unchanged), and the importer raises one `NAME_CONFLICT` warning per part number, revision and side, naming the first name with its row and the other names with their row counts. The warning is for review; nothing in the note changes.
3. **What is not a conflict.** Names that differ only in case or spacing. A part's name as a parent is not compared with its name as a child, because the two columns follow different conventions.
4. **Part numbers already in the vault.** An import leaves such a part as it is (BOM-026) and raises nothing. An update scan reports it, because the scan compares the file with the vault.
5. **Not decided.** Whether the warning should offer a choice of name, and whether parent-side and child-side names should ever be compared. Both would need real BOM files to judge; none was used here.

Rules: BOM-037 (new).

## D-0056 — Data is added by default; a drop is decided at import, never silent

2026-10-23 · Spencer · Accepted (owner, chat, after D-0055)

Owner: "We are collecting data from multiple sources, we should not be dropping data unless decided during import. When importing new data or merging existing notes, the default should be to add data to the vault. Having the option to change the outcome for types of information and info on certain items will be important." The owner also asked for rules to be retired or rewritten as needed.

1. **Principle.** Data is added by default. An outcome that leaves data out or replaces it is a choice made at import, for a type of information or for a single item, and the importer counts every such choice. Where the importer leaves data out without a choice, it says so by name.
2. **Done in this decision.** The lines a file gives for an assembly at a revision older than its latest are kept in the part note body, not dropped (BOM-038). A `drop` option exists in the importer code and counts what it skips; it has no control in the page yet.
3. **Rules changed.** BOM-002 is retired: it said competing BOMs block interpretation, which D-0047 had already replaced. BOM-006 is rewritten, because "superseded revisions are not imported" dropped data. BOM-038 and BOM-039 are new.
4. **Still dropping or leaving out data, found by reading the importer** (not yet changed, each to be made a visible default-add or a choice):
   - A part number already in the vault is left as it is (BOM-026): new lines, other revisions' lines and manufacturer data in a later file are only listed as findings, not added.
   - The update scan ticks nothing by default (BOM-032); the principle asks for additions to be offered ticked and changes unticked.
   - Rows skipped as `ROW_NO_CHILD`, `ROW_NO_PARENT` and `ALT_NO_PRIMARY` keep only their row number in the finding; the row's content is not kept.
   - A redline row struck out with no replacement (`LINE_REMOVED`) is reported but its content is not kept.
   - Manufacturer data comes from the first line that uses a part; other lines' manufacturers and alternates are not read. **Confirmed with a probe and fixed the same day:** manufacturer data from every line that uses the part is now added, exact repeats once (BOM-028).
   - Lifecycle states are ignored by decision (BOM-021, D-0047); that is a decided drop and stays unless the owner changes it.
   - The `drop` option for earlier-revision lines, and the choice per type and per item generally, have no control in the page.
5. **Not decided.** The shape of the per-type and per-item choice in the page (a list of information types, each with add or leave out, and a per-item override in the scan).

Rules: BOM-002 (retired), BOM-006 (rewritten), BOM-038, BOM-039 (new).

## D-0057 — BOM update scan: additions are ticked by default

2026-10-23 · Spencer · Accepted (owner, chat, after D-0056). Changes D-0051 ("nothing ticked by default") and BOM-032.

1. **Each item has a kind.** An addition puts data in the note that it lacks (a new part, a new line, a new drawing reference, a replaced-part dependency, a part attribute the note did not have, a description the note did not have, manufacturer data that only gains pairs). A change replaces a value (a changed quantity, a new name over an old one, a new revision). A removal takes a line out.
2. **Defaults.** In the page, additions are ticked and changes and removals are not. A category whose items are all additions is ticked as a whole, so items beyond the 200 shown are included. In a category that mixes kinds, only the shown additions are ticked. Applying still needs the button and the confirmation, and nothing is written by the scan.
3. **Unchanged.** A hand-edited note still marks its items (D-0054); an addition to it is ticked, and the file's value offered back over the edit is a change and is not.
4. **Removals stay unticked** (working default set 2026-10-24 under D-0056, "the default is to add data": taking a line out is not an addition, and a redline strike is only one of the ways a line stops being listed). The owner can reverse this; it is one setting in `bom_update.ts`/the page. The per-type and per-item choice in D-0056 item 5 is not decided.

Rules: BOM-032 (changed).

## D-0058 — Earlier-revision lines reach existing notes through the update scan

2026-10-24 · Spencer · Accepted (owner, chat: "finish C2"). Extends D-0056 item 4 and BOM-038.

1. **New category `EARLIER_REVISIONS`.** The update scan compares the "Earlier revisions of this assembly" block the file would produce with the block in the vault note. Lines the note lacks are one addition per note, ticked by default (D-0057). Lines match on revision, line and child; the row number and wording after the child do not count.
2. **Replaced revision kept.** Applying `NEW_REVISION` writes the lines of the revision it replaces into the same block (as data, marked with the date and file), so they are not lost from the vault. A line already in the block is not repeated.
3. **Ownership.** The block is body text outside the import hash, so editing it never marks a note as edited. A note whose structure area is model-owned (`bomOwns` without `structure`) gets no such items.
4. **Unchanged.** Dropping earlier-revision lines remains an import-time choice (BOM-038). The EA tag, field and table drops stay as they are (owner, 2026-10-24).

Rules: BOM-032, BOM-038 (changed).

## D-0059 — Skipped BOM rows keep their content

2026-10-24 · Spencer · Accepted (owner, chat: "1", the first still-dropping case of D-0056 item 4). Applies D-0056.

1. **Kept, not counted.** Each row the BOM reader skips (`ROW_NO_PARENT`, `ROW_NO_CHILD`, `ROW_NO_LEVEL`, `ALT_NO_PRIMARY`, and a redline line removed with no replacement, `LINE_REMOVED`) is written with its cell text to a `Skipped rows` table in the BOM findings note, uncapped. A struck-out value is shown as struck. The findings table above it keeps its 40-row cap per code (BOM-027).
2. **Where.** The findings note under `99_System/11_Import`, not a part note, because a skipped row has no part to belong to. It is a report; a person can move the content into a note.
3. **Not covered.** END_MARKER rows (no data). Whether a skipped row should be offered back later by the update scan is not decided. Remaining D-0056 item 4 case: BOM-026 additions to parts already in the vault.

Rules: BOM-040 (new), BOM-027 (changed).

## D-0060 — BOM update apply keeps Source lines it did not write

2026-10-24 · Spencer · Accepted (owner, chat: "y", audit of BOM-026 data). Applies D-0056.

1. **Found.** Applying any item to a note replaced the whole `Source: EA` section with the generated one, so a line from an EA merge or one a person added there was lost. A note's body above the section was already kept.
2. **Rule.** Only the importer's own Source lines are refreshed (part number, name, BOM source, revision, source, revisions in the BOM, drawing location, alternates, previous part number, usage tags, replaced-revision lines). Any other line or paragraph in the section stays, after the importer's lines.
3. **Audit result, not changed.** Part and parent **lifecycle states** are read but written nowhere (BOM-021, D-0047), so a change in them is neither listed nor kept. Every other column tested (names, source, SSC, reference designator, notes, from, to, amount, unit, line, revision pin, manufacturer, alternates) produces an update item. Owner decision 2026-10-24 ("state can be dropped"): lifecycle states stay dropped; BOM-021 stands.

Rules: BOM-032 (changed).

## D-0061 — MDSE engineering model discipline

2026-10-24 · Spencer · Accepted (owner confirmation in MDSE_v2_live definition review)

The MDSE toolset is developed as an engineering model of itself rather than as a collection of notes. The six principles govern all current and future tool definitions: model before documentation; one semantic authority per reusable definition; only native SysML v2 relationships for SysML semantics; justified rather than artificial traceability; independent model/implementation/verification maturity; and MDSE's own model as a first-class user-validation case. A record may be Draft while the governing principles are Active. These principles add no new SysML relationship type and do not waive existing independent parser or acceptance gates.

Rules: +GOV-019 +GOV-020 +GOV-021 +GOV-022 +GOV-023 +GOV-024.

## D-0062 — Update scan page: tick by type

2026-10-24 · Spencer · Accepted (owner, chat: option "Per type, update scan only"). Settles D-0056 item 5 for the update scan; import-time and per-item choices before the first import are not built.

1. **Type boxes.** Above the categories the page shows Additions, Changes and Removals with their counts. A box ticks or unticks every item of that type, including items past the 200 shown. Additions start ticked, the others not (D-0057), unless the person's last choice says otherwise.
2. **Remembered.** The last choice of type boxes is kept in the browser (a convenience; the page works without it).
3. **Unchanged.** Category and per-item ticks still work and can override a type box; applying still needs the button and the confirmation (BOM-032).
4. **Not built.** An import-time choice per type (earlier-revision lines and skipped rows keep/drop on the page; `earlierRevisions: "drop"` is still an option of the reader only), and per-item choices before an import writes. Asking again if needed.

Rules: BOM-032 (changed).

## D-0063 — Review of BOM-001, 003, 004, 005; no assembly data in a child note

2026-10-24 · Spencer · Accepted (owner, chat review).

1. **BOM-001 approved, reworded.** A child part note holds no data about the assemblies above it. All usage data is in the parent. The importer no longer writes "Used at an older revision" into a child; the pin stays on the parent's usage (`childRevision`) and in the parent's `flagConflict` callout. BOM-011 is retired and the definition (MDSE_DEFINITION.md, BOM import, revision) is changed to match. Notes already written with that section keep it until a person removes it; the update scan does not touch it.
2. **BOM-003 approved.** Open point from the owner: an alternate was at one time recorded on its own line number (line 1xx beside line xx). The importer recognises an alternate only when its part number is blank and a manufacturer part number is given; a row with a part number is read as an ordinary line and would count its quantity. This is **not verified** against real data: no BOM with the pattern was available. Needs a sample file. **Settled by D-0064.**
3. **BOM-004 retired.** Order-independence is handled by defined rules and responses.
4. **BOM-005 retired.** Variants will be modelled with SysML v2 syntax; the proposal files are not in this repository.

5. **BOM-013 retired** (owner, 2026-10-24): it repeated BOM-003.

Rules: BOM-001, BOM-003 (now Active); BOM-004, BOM-005, BOM-011, BOM-013 (retired).

## D-0064 — Alternates on line 1xx beside line xx

2026-10-24 · Spencer · Accepted (owner, chat: "a common practice in our BOMs", option "Alternate of line xx"). Extends BOM-003; closes the open point in D-0063 item 2.

1. **Rule.** A row on line 101 to 199 whose line (number minus 100) exists under the same parent and revision is an alternate of that line, whether or not it has a part number. It is not a usage, adds no quantity and has no note of its own. Lines 1xx with no line xx stay ordinary lines.
2. **Kept.** The alternate is listed on the base line's `Alternates for line` entry in the Source section: part number, revision, name, manufacturer data, quantity and unit, its line and row.
3. **Reported.** Each case raises an `ALT_BY_LINE` warning, because a BOM that numbers genuinely past 100 would be misread. The shape of the habit was not verified against a real BOM (none was available).
4. **Existing vaults.** A note written earlier with such a row as a usage gets a "line no longer listed" item from the update scan (unticked, D-0057).

Rules: BOM-003 (changed); BOM-013 (retired, D-0063).

## D-0065 — File names, `name`, `aliases` and `partNumber`

2026-10-24 · Spencer · Accepted (owner, chat: `aliases` "as normally defined", `partNumber` kept, "Name is perfect"); folder depth Proposed. Reverses the V1 rule that ids never appear in file names.

1. **File name is the citation key.** A note is named by its `partNumber` when it has one, otherwise by its `id` (MOD-170). Reason: a BOM-first and an EA-first import write the same file, and manufacturing and requirement documents already cite these keys.
2. **`name`** is the current name; **`aliases`** keeps its normal meaning, other names only; **`partNumber`** is the query property for part numbers (MOD-171 to MOD-173). Tools show name, then description, then file name.
3. **BOM data is not renamed.** The BOM name column stays the `description` property (BOM-016); a BOM-only part has no `name` until a model element matches it.
4. **Folders.** The model's deep folder tree is reduced to a depth cap, with the full package path kept in the note (MOD-174, Proposed). The cap value is decided after the preflight histogram.
5. **Rules.** MOD-170 to MOD-174 added; MOD-036, MOD-031, MOD-107, IMP-015 rewritten; MOD-100 and MOD-109 retired. Unreviewed MOD-037 and MOD-040 (body `## Aliases` block) and MOD-108 (EA Alias) are to be aligned when the EA translator is changed.
6. **Not decided.** Whether the SysML `partNumber` attribute is dropped later (D-0003 says nothing is stored twice); the cap value.
7. **Build order.** Property dictionary and contract test (done: `schemas/properties.json`, `contract.test.ts`), BOM importer `partNumber` (done, with an update-scan addition for older notes), Workbench display (done, WKB-028), preflight depth report (done, in the page's check step), EA translator.

Rules: MOD-170 to MOD-174, WKB-028 (new); MOD-036, MOD-031, MOD-107, IMP-015 (changed); MOD-100, MOD-109 (retired).

## D-0066 — Step 03 reconcile obsolete Active governance statements

2026-10-24 · Spencer (Step 03 model-reconciliation instruction) · Accepted, limited to prior approved authority and removal of obsolete clauses

This reconciles five older source rules against D-0001 (MDSE_v2 tool authority), D-0003 (native SysML authority), D-0005 (direct main policy), D-0061 (self-model engineering discipline), current MDSE_v2_live scope, and the completed Step 02 independent SysML parsing baseline. It is a governance-document correction, **not** a new requirement approval, parser certification, or a decision on the proposed folder depth (MOD-174).

1. **Retire GOV-006.** The original Active wording authorized direct pushes to `Test_Vault_`; that repo is now historical. D-0005 explicitly continued the valid portion as GOV-001. The remaining single-topic review advice is historical process guidance, not a separate binding engineering requirement. Original REG-033/W-07 text is retained verbatim in the retired register and at the pinned live source reference.
2. **Retire GOV-018.** Its EA-package-folder mandate and historical empty-folder cleanup do not define the current SysML-v2 engineering vault. The managed `99_System` support requirement is carried by the clarified GOV-017. The exact model folder depth stays Proposed under MOD-174, not silently approved. The original REG-050/W-04 text remains in the retired register and pinned live reference.
3. **Rewrite DAT-002, preserving the security constraint.** Public source and the public MDSE self-model may exist, but protected customer/product source data and private real imported models may not. Replace the trailing claim that `Test_Vault_` is tooling authority with the already-accepted GOV-005/`MDSE_v2` boundary. The original REG-053/V2-25 wording is preserved in the historical live reference and in this decision's cited source snapshot.
4. **Clarify GOV-017.** Retain phase-one single-vault scope and deferral of cross-vault relationships; remove Test_Vault_ workspace status as a present-tense operating instruction. Preserve `99_System` managed support without turning the self-model into governance/tool-source authority.
5. **Clarify DAT-001.** Extend its public-repository restriction explicitly to current public repositories. Limit claims of independent parsing to syntax and reference-resolution acceptance, not complete engineering semantic or verification acceptance.

Historical authoritative source for all five preceding Active wordings: [RULESET.md at bcdb25a11efa](https://github.com/spencerskelly/MDSE_v2/blob/bcdb25a11efa3ea14ba343949b01f797553c044d/governance/RULESET.md). Live `70_Rule_References` and `71_Rule_Analysis` retain separate pinned snapshots. Existing `REQ-31011`, `REQ-31012`, `REQ-31028`, `REQ-31029`, `REQ-31030` and `REQ-31036` remain historical Draft candidates with no new positive verification targets; no SysML semantic relationships are manufactured. Historical original status does not indicate current binding authority.

Rules: −GOV-006, −GOV-018; ~DAT-002, ~GOV-017, ~DAT-001. No other rule changes are made. MOD-075/MOD-076 and other stale active V1 relationship wording remain separate scoped review items, not silently modified by this governance-only reconciliation.

## D-0067 — Model folder depth cap of 6

2026-10-24 · Spencer · Accepted (owner, chat: "Let's place the cap at 6 folders deep. After import, I might perform some manual changes"). Settles MOD-174 and the cap value left open in D-0065.

1. **Cap.** The EA translator writes model notes at most 6 folders deep (`folderCap`, default 6, 0 = no cap). A deeper note sits in its ancestor folder at depth 6.
2. **Nothing lost.** A note whose package path is cut gets a `- Package: A / B / C / …` line in `Source: EA`. An element with children keeps its own folder only while that stays within the cap; the parent link is in the SysML and links, not the folder.
3. **Re-import.** A note already in the vault keeps its path (existing path wins), so manual moves after the import are kept.
4. **Not covered.** The source ledger's `target_file` for Package rows still shows the uncapped folder. The report's depth table counts a cut note at its package depth; element nesting beyond the package is not counted. Not checked against the real model: the cap was chosen without the preflight histogram.

Rules: MOD-174 (Active).

## D-0068 — Superseded part numbers are aliases

2026-10-24 · Spencer · Accepted (owner, chat: "aliases will remain as a method of including alternate names for this note, it could also be used for superceded part numbers, allowing a historical number to be identified"). Confirms D-0065 and extends MOD-172.

1. **Aliases.** When a BOM shows a part number replacing an earlier one (struck-through number in a redline), the new part's `aliases` lists the old number. The old number's own stub note stays, as before (BOM-023).
2. **Update scan.** Approving a SUPERSEDES item also adds the old number to the note's `aliases`. Names already in `aliases` are kept; none are removed.
3. **Confirmed unchanged.** BOM note file name is the part number; a model note's file name is its id; `name` comes from the model element name and a BOM note has none; the Workbench shows `name`, else `description`, else the file name (MOD-170, MOD-171, WKB-028).
4. **Workbench (built).** Canvases and every view already take their text from the shown name (name, description, heading, file name). Search and the table filter now also match the file name, part number and aliases. New notes made in the Workbench are named by id, with the typed title stored as `name`.
5. **Not covered here.** A note imported before this decision gets the alias only when a SUPERSEDES item is approved again; that case and the update path are not covered by an end-to-end test (no redline fixture in the update tests).

6. **EA translator (built).** A translated note's file is its id. `name` is the exact EA name, `aliases` holds the EA alias when it differs from the name, `partNumber` comes from the EA tag `PN` or `Part Number`. `- Name:` and `- EA alias:` lines are no longer written; the PN tag line stays in Source for WKB-017. Links in Source lines and in properties are written `[[id|name]]`. The package rows of the source ledger now show the capped folder.
7. **Model notes keep the id even with a part number.** MOD-170 and MOD-173 are narrowed: only BOM parts are named by part number, so a model note and a BOM part for one part do not clash; the merge in WKB-017 joins them.
8. **Not covered.** Whether the tag is really called `PN` or `Part Number` in the real model (taken from WKB-017, not verified). The Boundaries and Unplaced Review Items notes are still named by title. A vault already imported keeps its old file names; re-import offers `name`/`aliases`/`partNumber` as changes, and that path was only exercised by the existing update tests. Rules MOD-037, MOD-040 and MOD-108 are reworded here but remain Unreviewed.

Rules: MOD-037, MOD-040, MOD-108, MOD-170, MOD-173, IMP-015, WKB-010, WKB-028, MOD-172.

## D-0069 — Step 03: scope relationship endpoint and inverse rules to the SysML v2 authority boundary

2026-10-24 · Spencer (continuation of the Step 03 governance-reconciliation instruction) · Accepted — clarification of already approved D-0003/D-0061; OD-01 classification remains open

1. **MOD-075 rewritten.** Its 2026-10-22 Active source wording made every relationship endpoint subject to the V1 `relationships.yaml` catalog. That cannot govern SysML v2 definitions, typings, owned usages or connections. Native SysML semantics and the accepted parser/model validation govern their endpoints. Only explicitly approved MDSE-only YAML relationship kinds may use YAML from/to restrictions. The existing `relationships.yaml` inventory contains V1 entries and remains under revision until OD-01 is decided. No individual legacy field is accepted merely because it appears in the file.
2. **MOD-076 rewritten.** SysML v2 relationships cannot have a second forward/inverse record in YAML; Workbench must derive reverse navigation from native model text/index projections. For non-SysML MDSE-only relationships, historical forward/source authority and optional derived inverse maintenance remain applicable **only after that relationship has been classified in OD-01**. No broad prohibition or approval of MDSE-only inverse storage is inferred. The old Nodian attribution is historical and not a current separate writer.
3. **History preserved.** The original MOD-075 (REG-021/W-272) and MOD-076 (REG-022/W-275) wordings are retained in `MDSE_v2_live/70_Rule_References` at the pinned `bcdb25a11efa` ruleset snapshot; analyses, Draft `REQ-31102`–`REQ-31104`, and `VER-31053`/`VER-31054` keep their identifiers and original clauses as history, not new authoritative requirements.
4. **Limits.** No new native SysML relationship form is introduced. `governance/schemas/relationships.yaml` is not pruned in this decision: OD-01 still requires a field-by-field owner disposition and importer/Workbench compatibility checks. `IMP-115` provisional `tracesTo` versus D-0010 `flagLink`, and MOD-028 relationship-field ordering versus D-0003, require follow-up. Do not silently rewrite these mappings under this decision. No engineering verification case is executed.

Rules: ~MOD-075, ~MOD-076. OD-01 remains open. (D-0003, D-0010, D-0061)

## D-0070 — Step 03: flagLink, not provisional tracesTo, for unresolved MDSE-note relationships

2026-10-24 · Spencer (continuation of the accepted Step 03 reconciliation plan) · Accepted — implements earlier D-0010 and clarifies the D-0045 exception

1. **Resolve the inconsistency.** D-0010 expressly retired the provisional `tracesTo` relationship field (REG-024) in favor of `flagLink` evidence. D-0038/D-0039 left the specific Issue/Change connector mapping open and IMP-115 later introduced an active importer fallback to `tracesTo`. D-0045 section 4 carried that provisional relation as a permitted MDSE exception. **That final `tracesTo` exception is superseded for new writes by this decision; the other D-0045 exceptions are unchanged.** Historical decisions are not edited.
2. **Importer behavior.** A connector from or to a non-SysML MDSE note emits `describes`, `affects`, `dependsOn` or non-SysML `hasChild` only when the approved current mapping determines its meaning. If it does not, the importer writes **no `tracesTo` YAML and no native SysML relationship**. Instead it creates a `flagLink` callout linked to the original EA connector GUID, endpoints and family, with a Source: EA review line, and one `deferred_review` ledger row with `PROVISIONAL_LINK`. Nothing is silently dropped or falsely marked native.
3. **Legacy data are not destroyed.** Older generated vaults may contain `tracesTo`. Existing values remain readable as historical evidence; no bulk deletion/conversion is authorized here. Their remediation must identify the original source and choose a correct native relation, a justified MDSE-only relation, or a retained unresolved `flagLink`. OD-01 still governs the complete field inventory, schema removal and round-trip migration.
4. **MOD-028 scoped.** Historical ordering of `relationships.yaml` fields is only applicable to explicitly approved MDSE-only YAML fields. It cannot govern SysML-native relationships or a legacy field that OD-01 has not classified. This is a clarification of D-0003/MOD-117 rather than a field-by-field OD-01 decision.
5. **Tests and acceptance boundary.** Importer synthetic tests must distinguish an approved descriptive YAML relation from an unresolved connector; check that no `tracesTo` is emitted, that its connector is a persistent `flagLink` and `deferred_review` record, and that existing accepted note links remain. This does not approve arbitrary Issue/Change endpoint relationships, execute verification cases or modify the 583 native SysML model definitions in `MDSE_v2_live`.

Rules: ~IMP-115, ~MOD-028. MOD-073 remains Active, REG-024 remains Retired. D-0045 is superseded only for its provisional `tracesTo` exception. OD-01 remains open.

## D-0071 — The importer page re-reads the vault and refuses to replace a different note

2026-10-24 · Spencer · Accepted (owner, chat: the folder was left on its first selection and the page still believed there was no vault). Fixes the cause of the duplicate ids found in the first real BOM import.

1. **Cause.** The page decided "vault or no vault" once, when the folder was picked. A folder that was empty then stayed "no vault" after the first write, so later runs built a new vault: ids restarted at 1, base files and `vault_uid` were rewritten, and notes for parts already present were replaced. In the first real import this gave 381 ids shared by 1,075 notes and 705 unresolved child references.
2. **Re-read.** The page reads the folder again before each check, import, update scan and update preview, and after each write (IMP-130).
3. **Refuse.** A write is refused as a whole when a note would replace a different note on the same path or reuse an id held by another note. Nothing is written in that case.
4. **Not covered.** The vault already imported is not repaired by this; it needs a clean re-import. A vault-wide duplicate-id check in the Workbench review queue is still to be done. Merging "Add to existing vault" and the BOM update scan into one flow is still a proposal.

Rules: IMP-130 (Active).

## D-0072 — BOM parts are sorted by description words, child lines and make or buy

2026-10-24 · Spencer · Accepted (owner, chat: "let's bring in categories to help organize"; sort order "description words, has children, make/buy"; property named `bomCategory`). Settles the layout of `BOM/Parts` after the first real import put 14,229 parts in one folder.

1. **Sort order.** `BOM/Parts/<category>/<Assemblies|Parts>/<buy|make|other>/<PN>.md`. Drawings stay in `BOM/Drawings`.
2. **Category.** An ordered table of 15 categories, each with description words, first match wins, whole words only; no match is `Uncategorized`. On the 14,229 parts of the first import the table placed 84% (measured before this build, on the draft table). The table lives in `tools/importer/src/bom_category.ts`; a vault-owned copy the owner can edit is a later step.
3. **Properties.** `bomCategory` and `bomRole` (final, sub, part, unused) are written on every BOM part note and listed in the property dictionary. Neither is in the ownership hash.
4. **Updates.** The update scan offers them as one CATEGORY item. `bomRole` is only ever added, never changed, because one BOM file cannot know every parent. An existing note keeps its path.
5. **Findings.** The Findings note gives the count per category and the count left in `Uncategorized`.
6. **Not covered.** What `ssc` (A, B, C) means, and whether number ranges like 35xxxxx mean a kind of part, are unknown and not used. The categories have not been checked by a person against the real parts. `bomRole` for a part used only in BOMs not yet read says `final` or `unused` until they are read. A finalASM folder was not made; `bomRole: final` is the way to list them.

Rules: BOM-016, BOM-041, BOM-042 (Active).

## D-0073 — Step 05: native ownership for behavioral sequencing and no provisional Workbench trace creation

2026-10-24 · Spencer (continued approved v2 relationship mapping) · Accepted — implementation correction under D-0003, D-0010, D-0069, D-0070; outstanding endpoint roles remain under OD-01

1. **IMP-116 native ownership.** For EA ControlFlow/StateFlow, a shared typed owning context permits the already-approved native `succession`/`transition` syntax with trigger, guard and effect. Without proven owner/compatible endpoints, a YAML `precedes` link would duplicate or invent SysML-native temporal meaning. Instead, the importer retains the original connector as `flagLink` and `deferred_review` (`FLOW_NO_COMMON_OWNER` when both definition notes exist, otherwise `FLOW_ENDPOINT_NOT_USAGE`), preserves the connector GUID and endpoints in its ledger/callout, and copies any trigger, guard and effect into Source: EA review evidence. This supersedes only the historical YAML fallback clause of IMP-116; do not delete old imported `precedes` values without an explicit migration review.
2. **Workbench provisional trace choice.** The choice previously labeled `traces to` was described as a relationship with no selected meaning. That is exactly the case D-0010/D-0070 require to remain a `flagLink`; new model-editing operations must not manufacture a `dependency … // trace` for unknown semantics. Mark this choice historical/read-only for new add/draw/edit operations and prevent direct API bypass; preserve scanning, display and deletion of existing explicit or historical trace statements. This does not prohibit an independently justified, explicit SysML dependency with real semantics.
3. **No wider OD-01 claim.** Existing native `dependsOn` modeled dependency, approved nonmodel `hasChild` and current use-case `participants` remain as inherited; those fields still require endpoint-specific classification, code tests and an owner decision where ambiguous. No arbitrary EA Association is converted to a port connector or native use-case subject. No Workbench simulation or full real QEAX round trip is claimed.
4. **Tests.** Importer fixture asserts that the cross-owner flow leaves `flagLink`, no new `precedes` YAML, `deferred_review` with GUID, and guard evidence. Workbench tests refuse new provisional trace and refuse retagging another dependency as provisional, while preserving legacy scanned statements.

Rules: ~IMP-116. Related: MOD-073, MOD-117, IMP-098, IMP-115. OD-01 remains open.

## D-0074 — A redline update does not clear dates or categories it has no data for

2026-10-24 · Spencer · Accepted (owner, chat: the first redline scan after a clean import proposed to remove the categories). Applies D-0056 (add data, do not drop it) to the redline layout.

1. **Cause.** The first redline scan proposed 1,153 changes. 441 turned a category into `Uncategorized` because the sheet gives no name for those parts and the category was worked out from nothing. 294 turned an `effectiveFrom` date into blank because the redline has no date columns.
2. **Category.** `bomCategory` is offered only when the file gives a description for the part (BOM-043).
3. **Dates.** In a redline update the dates the vault holds for a line are carried into the line the update writes, so they stay even when other changes to the line are applied.
4. **Not covered.** About 150 "new revision" items are in the same scan; at least three of them (`06905`, `08459`, `08459-52`) differ only by a leading dash (`-F01` against `F01`). What the dash means is not known to me, so revisions are still compared as written. The "Manufacturer data changed" group mixes additions and changes under one title; only the Tick by type boxes tell them apart. Whether the 249 manufacturer items are correct is not checked.

Rules: BOM-043 (Active).

## D-0075 — The category table has a second tier of abbreviations that only places parts the first tier did not

2026-10-24 · Spencer · Accepted (owner, chat: "let's make improvements to the toolset"; the words were proposed from the Uncategorized descriptions of the reviewed import). Extends D-0072.

1. **Second tier.** Seven rules are added after the 15 of D-0072: CAP RES UF (Electronic components), H07V (Wire), LFLEX (Cables and harnesses), LIST SPARES (Documents), RELIEF RING GUIDE RAIL (Enclosures and mechanical), J1772 (Connectors and terminals), CHARGE CONTROLLER SYSTEM GSE (Chargers and systems).
2. **Order.** They sit last, so a part a first-tier word already places keeps its category. Measured on the 14,199 reviewed descriptions (not stored here): Uncategorized falls from 2,182 to 1,636, and no other category loses a part.
3. **Not covered.** The reading of each word is a guess from the descriptions and has not been checked against the real parts by a person. QMM, DBU, HZ, VAC, KW and AC were not used (QMM and DBU are not understood; the others are ratings, not part kinds). A vault-owned rules file is still a later step.

Rules: BOM-041 (Active).


## D-0076 — The category list is a note in the vault that the owner edits

2026-10-24 · Spencer · Accepted (owner, chat: "let's make improvements to the toolset … start at the top"; the first item was the vault-owned rules file named in D-0072 item 2 and D-0075 item 3).

1. **File.** `99_System/06_Config/BOM Categories.md`, one rule per line written `- Category name: WORD WORD`. Order is priority; the first rule with a word in the description wins; the same category may repeat. It ships in the Base Vault with the built-in table, so a new vault has it. It is a seed file (D-0024): a vault update adds it when missing and never overwrites it.
2. **Use.** Each BOM run reads the file from the vault (or from the files the same run is about to write) and uses it in place of the built-in table. A vault without the file uses the built-in table. The BOM update scan inherits it, so its CATEGORY items follow the file.
3. **Bad file.** One unusable line (a category that cannot be a folder name, no words, a word under two characters or starting with a digit, a rule for `Uncategorized`) means none of the file is used. The built-in table applies and a `CATEGORY_RULES_BAD` warning names the lines. A partly read file could silently move parts.
4. **Not covered.** Editing the file does not move notes already in the vault; the update scan offers their new `bomCategory`. No Workbench screen edits the list; it is an ordinary note. The built-in table is still the default and still lives in `tools/importer/src/bom_category.ts`.

Rules: BOM-041, BOM-044 (Active).

## D-0077 — The write check reads ids and uids from the frontmatter only

2026-10-24 · Spencer · Accepted (owner, chat: pasted log of an EA import into the review vault that stopped with "id REQ-00042 already belongs to 99_System/02_AI/AI_INSTRUCTIONS.md").

1. **Cause.** The clash check added in D-0071 (IMP-130) took the first `id:` line anywhere in a vault file. `AI_INSTRUCTIONS.md` shows an example `id: REQ-00042` in a code block, so the real note REQ-00042 looked like a duplicate and the whole write was refused. Nothing was written.
2. **Fix.** An `id` or `uid` counts only inside the frontmatter block at the top of a file. A file without frontmatter holds none.
3. **Not covered.** Other places that read `id:` with a line pattern (the BOM reader looks only at notes that carry a BOM part number) were not changed. Only this check was seen to fail.

Rules: IMP-130 (Active).

## D-0078 — The Workbench can search for notes and place the ticked ones on a canvas

2026-10-24 · Spencer · Accepted (owner, chat: "a workbench function to add elements from a search … search a word or phrase and all elements with that in the name or description would list. I could then select some or all to place on a canvas").

1. **Lens.** A "Pick notes" lens in the panel, and a "Pick for canvas" tab in the standalone Workbench. It takes a word or phrase and an optional type. A note is listed when every word is found in its name, description, id, part number or aliases (not case sensitive). Up to 500 are listed; the count of all matches is shown.
2. **Choosing.** Each row has a tick box; "Tick all listed", "Untick listed" and "Clear all" act on the list. Ticks survive a new search, so a canvas can gather notes from several searches.
3. **Canvas.** "Place on canvas" writes the ticked notes to the same single scratch preview as every other canvas (the preview and Save canvas… behave as for the other canvases). Cards are in a grid, at most 6 across and 200 in all; a requirement shows its wording as on other canvases (IMP-097). Relationships that run between two ticked notes are drawn unless the person unticks "draw relationships". Nothing is added to the model; the canvas is disposable (D-0003).
4. **Not covered.** No fuzzy matching or ranking by closeness. No "also add the neighbours of the ticked notes". The scratch canvas holds one view at a time, so a second Place on canvas replaces the first until it is saved.

Rules: WKB-029 (Active).

## D-0079 — Cards on a canvas are spaced three card sizes apart

2026-10-24 · Spencer · Accepted (owner, chat: "spacing between elements should default to triple the width or height of the notes on the canvas").

1. **Spacing.** On every canvas the Workbench writes (a view from a note, and a canvas from Pick notes), the space between neighbouring cards is three card widths across and three card heights down. A card is 280 by 90; the gaps are 840 across and 270 down. Before this the gaps were 120 and 40.
2. **Taller cards.** A requirement or group card is taller than 90. The gap stays 270 below it; it is based on the standard card, not on that card, so the spacing is the same everywhere.
3. **Default.** It is a default, kept as one constant (`SPACING` in `canvas.ts`). There is no setting for it yet; a canvas the person rearranges keeps their layout.
4. **Not covered.** A setting in the panel to change the multiple. Canvases already saved keep their old spacing.

Rules: WKB-030 (Active).

## D-0080 — Notes picked for a canvas are boxed by type

2026-10-24 · Spencer · Accepted (owner, chat: "when notes are added to the canvas, can they be grouped according to their supertype? They show up in a giant line and it's difficult to navigate").

1. **Reading of "supertype".** The note's `type` (Object, Requirement, Behavior …), of which `subtype` is the finer kind. The specialization hierarchy (a note that `specializes` another) was not used. If that is what was meant, say so.
2. **Layout.** Canvas from Pick notes: one labelled group box per type, labelled `<type> (<count>)` and coloured like the type's cards. Boxes are in type order and stacked top to bottom, so the canvas grows down, not across. Inside a box the cards are a grid at most 4 across, in subtype then name order, spaced as in D-0079. At most 200 cards in all, as before.
3. **Switch.** "group by type" is ticked by default; unticked gives the single grid of D-0078 (at most 6 across).
4. **Not covered.** Other canvases (a view from a note) are laid out by distance from that note and are not boxed. No grouping by subtype, folder or specialization. Dragging a card out of its box does not change the note.

Rules: WKB-029 (Active).

## D-0081 — A canvas card is named by the name or description, with the part number or id small beneath

2026-10-24 · Spencer · Accepted (owner, chat: "the elements [should] be named by the name or description field, in that priority order. the part numbers are not so useful for users (part number or ID in smaller font under the name, in that priority order)").

1. **Card text.** Every note card on a canvas the Workbench writes shows the note's name, else its description (the shown title of WKB-028, cut at 90 characters), in bold, and under it in small type its `partNumber`, else its `id`. A line is left off when it would repeat the name. A requirement card keeps its subtype and wording (IMP-097) under the same two lines.
2. **Text cards, not file cards.** To show a name that is not the file name, a note card is a text card whose first line is a link to the note (`**[[path|name]]**`). The link opens the note; the Workbench reads which note a card stands for from that link (as it already did for requirements), so a line drawn between two cards still becomes a relationship. A person can still add Obsidian file cards by hand; they are read as before.
3. **Height.** A card grows to fit a long name; spacing between cards stays based on the standard card (D-0079).
4. **Not covered.** I could not look at the canvas in Obsidian from here. The small type is written as `<small>` in the card text; whether Obsidian shows it smaller than the name in a canvas card is not verified. A file card showed a live preview of the note's text; a text card does not.

Rules: WKB-031 (Active).

## D-0082 — Choosing a note card on a canvas selects it; related notes can be added to the canvas

2026-10-24 · Spencer · Accepted (owner, chat: "when i select a note in the canvas, workbench should switch to viewing that note. when a note is selected, I'd like the ability to add related notes to the canvas").

1. **Selection follows the canvas.** After a click or key press in a canvas, if exactly one card is chosen and it stands for a note in the index (a text card whose first line links the note, or a file card), that note becomes the Workbench's selected note and the panel shows it. Obsidian has no event for canvas selection, so the plugin looks a moment after each click or key press; it reads the canvas's own `selection`, an internal that Obsidian does not document. Not verified in Obsidian from here; the test uses a stand-in with the same shape that the existing line-editing already reads.
2. **Related notes.** The Note lens has a section "Add related notes to the canvas" listing every note joined to the selected one by a resolved relationship in either direction, with the kinds that join them. A "+" adds one; "Add all N related to canvas" adds them all.
3. **Placement.** New cards go in columns to the right of the selected note's card, with a gap of three card widths (D-0079), at most 8 to a column, and move right until they overlap no card. A note already on the canvas is not added again. When the selected note's card is not on the canvas the cards go below everything. Lines are drawn between each new card and every note on the canvas it relates to, and are marked as the Workbench's own so they are not mistaken for lines the person drew.
4. **No preview open.** The selected note and the chosen ones make a new preview canvas.
5. **Not covered.** Only the temporary preview canvas is changed; a canvas the person saved or made by hand is not. Relatives of relatives (more than one step) are added by selecting a new card and adding again. A card removed from the canvas is not removed from the model.

Rules: WKB-032 (Active).

## D-0083 — Adding notes to a canvas leaves the cards that are there and puts related notes together

2026-10-24 · Spencer · Accepted (owner, chat: "when notes are added to a canvas, the existing notes remain where they are. when notes are added that have relationships, they should be placed near each other").

1. **Nothing moves.** Adding notes never moves, resizes or removes a card already on the canvas. Pick notes' "Place on canvas" now adds to the open preview instead of replacing it; a new button "New canvas" replaces it (boxed by type as in D-0080 when that is ticked). The boxes by type apply to a new canvas only. With no preview open, "Place on canvas" makes one.
2. **Placement by relationship.** Each new note is placed beside a note it relates to, one step (a card plus the gap of D-0079) away, to the right first, then below, above and left, and outward when those are taken. It goes beside that note's card when the note is on the canvas, else beside the new note it relates to, so a chain or tree of new notes spreads outward from where it joins the old cards. A note related to several placed notes takes the free place nearest to all of them. A new note related to nothing placed goes in free space below the existing cards, one cluster of related notes after another, six places across. Nothing overlaps.
3. **Lines.** Replaces the column placement of D-0082 item 3; lines are as there, and are left off when "draw relationships" is unticked.
4. **Not covered.** A note with very many relations fills the places around it, so some of its relations are a few steps away (the test allows five). Placement is by relationship only, not by type or name. The first note placed decides where a cluster goes; the layout is not optimised as a whole.

Rules: WKB-032 (Active).

## D-0084 — Three menus in the panel; the cards chosen on a canvas drive it; common related notes

2026-10-24 · Spencer · Accepted (owner, chat: "When I select a note in the canvas, the workbench pane still remains on a single element. I need to be able to select a note and perform functions from it. I also want to be able to select two or more elements and show a list of common related elements. I'd like different ways to view the note details under one drop-down, and ways to view model details under another drop-down. methods of editing the canvas should be under another drop-down").

1. **Three menus** replace the row of lens buttons: **Note** (Note, Structure, Design types, Internal structure, Function, States, Requirements, Edit), **Model** (Dashboard, Tables, Review) and **Canvas** (Pick notes, Common related). The menu holding the current view shows its name and is highlighted.
2. **Reading the canvas.** D-0082 looked for the chosen cards only after a click or key press, which in your Obsidian did not switch the panel (the cause is not known; I could not run Obsidian). The plugin now also looks every 300 ms at the last canvas that was in front, so choosing a card works even when the click is missed and when the panel itself has been clicked since. It reads the canvas's `selection`, an undocumented Obsidian internal. If it still does not follow, the internal differs in your version and I need to see what it exposes.
3. **One card** chosen: that note is selected and the panel shows it in the Note or other Note-menu view you were in, with all its functions, including Add related notes to the canvas. **Two or more**: the panel opens the Common related lens, listing the chosen notes, the notes related to all of them, and (with three or more chosen) those related to at least two, each with the kinds that join it to each chosen note. "+" and "Add all" put them on the canvas, between the chosen cards (D-0083). A new single choice leaves the Common related lens for the Note lens.
4. **Not done.** The pop-up over a chosen card that was offered "if it helps in separation". The menus and the Common related lens cover the separation; a pop-up needs Obsidian's canvas internals for its position and I cannot test it here. Say if you still want it.
5. **Not covered.** Choosing edges or groups. The standalone Workbench page keeps its own tabs. The Edit lens edits the model, so it sits under Note, not Canvas.

Rules: WKB-033 (Active).

## D-0085 — Direct parts or full tree; add shown notes to the canvas; placement by what the notes are

2026-10-24 · Spencer · Accepted (owner, chat: "two options to show structure of an element, one with a full tree, one with only direct parts. When structure, behavior, requirements, states tab is open, there should be the option to add some or all elements shown to the canvas. When adding elements to a canvas: parts should be placed under the assembly; specialized elements should be under the general element; requirements should be under use cases; functions should be under requirements; objects should be under functions; test cases should be under requirements").

1. **Structure.** A menu on the Structure view: "Full tree" (the default, as before) or "Direct parts only" (the parts the note owns itself, one level). The rolled-up parts list and where-used tables are not changed by it.
2. **Add to canvas.** On the Structure, Function, States, Requirements, Design types and Internal structure views each table row that stands for a note has a tick box. "Add ticked to canvas" puts the ticked notes on the canvas preview; "Add all N shown to canvas" puts every note the tables list there (the selected note included, so it is the top of what is added). The notes shown in other columns of a row (what satisfies it, who performs it) are not added unless they have a row of their own. At most 200 at a time. Ticks clear when the view or the selected note changes.
3. **Placement by direction.** Added to D-0083's rule that a new note goes beside a note it relates to, and nothing already there moves: where the pair is joined decides which side.
   - A part goes under its assembly; an element a note owns (a child, action, state, owned requirement) goes under its owner (`hasPart`, `hasChild`, `hasAction`, `hasState`, `hasRequirement`).
   - A specialized element goes under the general one (`specializes`).
   - Otherwise by kind of note, top first: Use Case, then Requirement, then Behavior (function) and Verification (test case), then Object. A requirement goes under a use case, a function and a test case under a requirement, an object under a function. Two notes of the same tier, or of a kind not in the list, sit side by side.
   - Siblings fan out in a row beneath (or above) their parent, nearest the parent first, then the next row. A note that relates to several placed notes takes the place nearest all of them, kept on the right side of each where it can be. When a canvas is started from nothing, the note with nothing above it is placed first, so the hierarchy hangs from the top.
4. **No preview open.** Adding from these views starts a new preview with the same placement.
5. **Not covered.** Ports, flows, allocations and other kinds do not set a direction. A note that must be under two others at different heights is placed under the lower. Existing canvases are not re-arranged. The rule is by kind of note, so an Actor, Document or Issue has no tier and sits beside what it relates to.

Rules: WKB-032, WKB-034 (Active).

## D-0086 — Merge has its own entry points; a BOM part is the note that stays

2026-10-24 · Spencer · Accepted (owner, chat: "It seems we lost a merge button. I'd like to test what happens when I merge a BOM element and a model element")

The Merge tab was not removed; D-0084's menus put it under Note > Edit > Merge, two steps from the note. Added direct routes:

1. Note menu: "Merge notes" (opens Edit on the Merge tab).
2. Note view of an Object note: "Merge with another note…".
3. Common related, with exactly two Object notes chosen: "Merge these two…", with the other note already picked.
4. Which note stays: when exactly one of the pair carries `eaType: BOM`, that note is the survivor by default (as the "Find matches" suggestions already did). The owners table can still be changed before Preview.

Nothing changes in how a merge is previewed, applied or undone.

Rules: WKB-033, WKB-035 (Active).

## D-0087 — A merge keeps everything from both notes in the surviving note

2026-10-25 · Spencer · Accepted (owner, chat: "when elements are merged, all relationships should be added to the kept note. the remaining note should have all yaml, body text, v2 definition of both merged elements. ... The key is that parts, generalizations, ports, etc should be moved into the one element.")

Replaces the recommendation in D-0053/WKB-027 (BOM note owns part facts and structure, the other note owns the rest; the other note's members go under "Not carried over").

1. Every area defaults to Keep both. Parts, ports, generalizations, requirements, behavior and relationship links of the removed note are inserted into the surviving note's SysML v2 block; plain properties, body text and source lines are carried over.
2. A member or property both notes have with different values: the surviving note's value is kept in place and the removed note's is written out under `## Not carried over from <title>` (members as `sysml`, properties as `yaml`). This now includes `status`, `eaType`, `subtype` and `sourceRole`, which were previously dropped without a trace.
3. The owners table stays as an optional prompt: choosing one note for an area still leaves the other's members out of the block, under "Not carried over".
4. Unchanged: which note survives (BOM part by default), link and symbol rewriting in other notes, `## Former ids`, preview, undo.
5. A BOM update after a keep-both merge changes only the description and revision and leaves the model's parts in the block (tested in `merge.test.ts`).

Rules: WKB-027, WKB-036 (Active).

## D-0088 — A canvas for each view; structure canvases in two sizes; parent-to-child lines bottom to top

2026-10-25 · Spencer · Accepted (owner, chat: "For each note view, I'd like the ability to create a canvas focused on that view. For structure, ... direct parts and complete bom ... the note selected with the parent assemblies it is in directly above it and a row of child elements below it, with the links connected to the bottom of the assembly and the tops of the parts. The default view of structure should show the relationships in this way")

1. Structure view: "Canvas: direct parts" and "Canvas: complete BOM", each a new canvas replacing the preview. Direct parts: the note, the assemblies that directly own it in a row above, its direct parts in a row below. Complete BOM: every layer of parts under it, one row per layer.
2. Line sides (every canvas the Workbench draws, including notes added by D-0083/D-0085): a line between cards at least one card-height apart vertically leaves the bottom of the upper card and enters the top of the lower; otherwise side to side. Before, the horizontal offset decided first.
3. Other views (Function, States, Requirements, Design types, Internal structure): "Canvas of this view", the note plus the notes the view lists, placed by D-0085. Note view: "Canvas of this note and its related notes".
4. Layout: the parts of an assembly sit in a row in name order; an assembly is centred over its first and last part; spacing is three card widths (D-0079). A part in several assemblies is placed under the first that reaches it, with a line from each. Up to 200 cards.

Not done: Internal structure has no ports-and-connections diagram; the standalone Workbench page has none of these buttons.

Rules: WKB-037 (Active).

## D-0089 — Add to the open canvas; a separate Auto-layout action

2026-10-25 · Spencer · Accepted (owner, chat: "when selecting any add to canvas option, the notes should be added to the canvas open and selected in the main window. Any addition to a canvas should not perform a new canvas layout, only add the elements. A separate auto-layout button should be added to allow the user to apply the layout rules assigned, including the parent on top of child, use case to the left of a requirement, test below a requirement, etc.")

1. Target: the canvas file of the last canvas leaf that was in front (the same leaf the selection polling follows), else the preview if it is open, else a new preview. Before, additions went only to the preview file. The canvas view is asked to save first, so a card just moved by hand is not overwritten; the file is then changed in place.
2. An addition only places the new cards (D-0083, D-0085 placement near related notes); existing cards are never moved. The "Canvas of this view" and structure buttons (D-0088) remain explicit new canvases.
3. Auto-layout (Canvas menu > Auto-layout, and a button beside the add buttons) moves the note cards of the open canvas by the rules in WKB-038. Cards that are not notes and groups stay. Use case left of requirement is new in this rule; D-0085's placement of a new requirement under a use case is unchanged for additions.
4. Not verified in Obsidian: that an open canvas view reloads when its file is changed this way. If it does not, close and reopen the canvas.
5. Not done: the added cards are not selected on the canvas; groups made by "Pick notes" are not resized by Auto-layout.

Rules: WKB-038 (Active).

## D-0090 — Direct parts means direct parts everywhere; children go in a row below the parent

2026-10-25 · Spencer · Accepted (owner, chat: "direct children is still showing children of children. I need it to be direct children only. I'd like to be able to add some or all children to the canvas. when added, they should be placed in a row below the parent")

1. Cause of the complaint: D-0085's Direct parts option limited only the Structure tree. The rolled-up parts list (all layers) and Where used (all layers upward) stayed full, and "Add all shown" took them to the canvas. With Direct parts only, the parts list is depth 1 and Where used lists direct assemblies only.
2. "Add all N children to canvas" on Structure; "Add ticked" and "Add all shown" send the note's direct parts through the same row placement.
3. Row placement (`addChildren`): below the parent by one row gap, centred under it, name order, spacing three card widths; skips slots other cards hold; never moves a card; lines bottom to top. This is for adding to a canvas that has the parent on it; nothing re-lays out (D-0089).
4. Not changed: Full tree keeps every layer; other views keep D-0085 placement.

Rules: WKB-039 (Active).
