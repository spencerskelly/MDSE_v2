# Changelog

Notable changes to the toolchain and its governance. Newest first. Tool releases are also recorded in the release manifest once `tools/base-vault` exists.

## Unreleased

- Workbench (experiment branch only): the panel can open in a pop-out window. WKB-074, D-0161
- Governance: posts in a body section, tags as a property, variants not in the Product list, every view opens in a new tab. IMP-138, WKB-072, D-0160, OD-39, OD-40, OD-43, OD-44
- Governance: Product keeps Charger, BMID and Kit as categories; V1 behaviours replaced with SysML except discussion posts and text tags; old notes are re-imported. IMP-138, D-0159, OD-39, OD-42, OD-43
- Workbench: Open note and note links now open in a new tab. Governance: the sales ledger defines the top products. WKB-073, WKB-072, D-0158, OD-39, OD-40
- Governance: open decision for cache cost and unchecked generated SysML found in the Oct 22 audit chat (unverified here). OD-41
- Governance: Product is every sold product below the packaging; each Workbench view opens in a new main window (not built). WKB-072, D-0157, OD-39, OD-40
- Governance: product identity (Charger, BMID, Kit), shippable level optional, no new-product marker. D-0156, OD-39
- Governance: the Product category is positional (not built) and PLM maps of content are wanted. BOM-041 (changed), D-0155, OD-34, OD-39
- Governance: Workbench single-function icons in the right sidebar (not built) and approvers in Jira recorded. WKB-071, GOV-030 (changed), D-0154, OD-25
- Governance: Publisher decisions recorded (five outputs, scope, content rules). PLM-005 to PLM-008, D-0152, OD-37
- Governance: legacy test plans and drawing intake direction recorded; the intake proposal stays open. PLM-009, D-0153, OD-38
- Workbench: the indented BOM folds by assembly, with Expand all parts, Collapse all parts and Show to level; the table says how many parts it leaves out. WKB-069, D-0150
- Workbench: the Structure view walks 10 levels and 200 parts under one assembly (was 6 and 40), in the table and the offline Parts tree; the main-window table draws up to 5,000 rows (was 1,000). WKB-070, D-0151

## 2026-11-08 — Release 0.10.0: sales source, Product BOM report

- Workbench: Structure lens button "Export Product BOM report (CSV)": an indented BOM of the selected note from the vault notes, with level, part number, description, quantity per parent, revision, category, make/buy and manufacturer and part number, as a CSV for Excel. WKB-068, D-0148
- BOM import: `CATEGORY_CONFLICT` finding when one part number has different categories on different BOM lines (filed under the latest line's, as before). BOM-062, D-0149
- BOM import: an optional NetSuite sales-actuals file. Each BOM part gets `salesRole` (product, spare, PIA); a sold part gets `avgSalePrice` and `annualVolume` over the whole file; a sold top-level part is filed under its family (Charger, BMID, Kit); a sold part number in no BOM gets a spare note. Customer columns are never read. The update scan adds the values to existing notes. `properties.json` 1.4. BOM-067, BOM-041 and BOM-062 (exceptions), D-0147
- Workbench: Keywords view for Uncategorized BOM parts, with a preview of each word and an undoable Apply to the category list and the parts. WKB-066, WKB-067, D-0146
- BOM import: a first import writes `99_System/06_Config/BOM Categories.md` when the vault has none (`CATEGORY_RULES_WRITTEN`). BOM-044, D-0145
- BOM categories: the built-in table uses the owner's categories (Panel, Lid and Door are ME Part), the word nearest the start of the description decides, and a table line `- Category also: Name, Name` names a category's other names. BOM-041, BOM-044, BOM-063 (changed), D-0144
- Workbench panel: views chosen from one grouped drop-down instead of a button column; Edit tasks in a drop-down; All and None on every ticked list. WKB-033 (changed), WKB-065, D-0143
- BOM update scan reads and writes revision notes: a BOM added to a vault with parts adds new part numbers, new CL1 notes, new CL2 values, lines, manufacturers, descriptions and categories, and removes nothing. BOM-066 (built), D-0142
- BOM import: a category the BOM names is used as written (new `CATEGORY_NEW` and `CATEGORY_WORDS` findings replace `CATEGORY_UNKNOWN`). Workbench Structure view: Parts by category. BOM-062 (changed), WKB-064, D-0141
- Workbench: every canvas view opens a new preview canvas; canvas lines are labelled with the relationship only and coloured by relationship kind. WKB-061, WKB-062, WKB-063, WKB-038 (changed), D-0140
- BOM import: the `Part Name` column is read as the description; blank-number manufacturer rows are no longer also listed as skipped; the line 1xx alternate rule is withdrawn and `ALT_BY_LINE` is gone. BOM-003, D-0138
- Workbench shows a note by its description with the part number in smaller type beneath. WKB-060, D-0139
- BOM import (first import only): the part number's note has no structure; each CL1 revision a BOM names has its own note `<PN> <CL1>` that specializes it and holds the description, manufacturers, revision and structure, with a section for each CL2 value when there are several; usages are typed by the pinned revision's note. The update scan still uses the old shape, so build a vault fresh for now. New property `revision` (`properties.json` 1.3). BOM-017, BOM-048, BOM-049, D-0134, D-0135, D-0136
- Workbench ECO tab (Edit lens): writes one ECO note with reason, description, owner, ECR date, Jira link and the changed parts (generated `drives` list, responsible person per part); shows where the parts are used; blocks a part already driven by an unapproved ECO note in the same vault. No branch handling, no approval, no new parts. WKB-059, D-0131, D-0133
- Properties `reason`, `owner`, `ecrDate` added for ECO notes; `properties.json` 1.2. No ECO tag (D-0132). GOV-026, MOD-175, BOM-051, D-0131
- Workbench Revisions section in the Note lens: every note of a part number in revision order with what changed from the one before. WKB-058, D-0130
- Workbench Part and links tab and Part, Implements and Implemented by sections in the Note lens; `implementedBy` is not counted as a second relationship. WKB-053, WKB-054, MOD-185, MOD-186, D-0128
- Rule change, importer not yet changed: every revision a BOM defines becomes a note; an old revision called by an old BOM is that revision's note; the `earlierRevisions` keep/drop option and the `EARLIER_REV_*` findings are to go; each revision note gets a "Changes from" section; a revision no BOM defines gets no note. This replaces the "latest revision only" entry below. BOM-006, BOM-007, BOM-017, BOM-038, BOM-046, BOM-048, BOM-065, D-0129
- BOM import: `REV_SCHEME` finding when a part's revisions break the scheme (letter and two digits, a rising number, no rollover past Z or 99). BOM-018, D-0126
- BOM import: new part notes go to `BOM/Parts/<Product|Assembly|Part>/<category>/<PN>.md` and carry `level`, `makeBuy` and `bomCategory`; an optional `category` column outranks the word table; `ENCL` and `PNL` map to Enclosures and mechanical, `BRKT` to Brackets; findings `CATEGORY_UNKNOWN` and `MAKEBUY_OTHER`. Update scan does not yet add the new properties to existing notes. BOM-041, BOM-061, BOM-062, BOM-063, D-0125
- Schemas: `properties.json` 1.1 (`level`, `sourcing`, `makeBuy`, `businessLine` with governed values) and `relationships.yaml` 1.37 (`implements` / `implementedBy`, YAML only). D-0124
- Rules only: revision scheme A01, B02, B03, C04 with CL1 as the letter and CL2 as the number; prototype part numbers `<base>#NN` held in one `<base> PROTO` note; PDM sets part number and revision and the engineer types them until a feed exists; ECO process starts at A01; archive of documents in git. BOM-018, BOM-064, PLM-001, GOV-025, MOD-181, D-0123
- EA import: relationships in the SysML block are also YAML link properties (hasPart, specializes, satisfies, performs, allocatedTo and the rest); requirement wording is also the first lines of the body; notes that say the same thing are listed in `Review - Possible Merges.csv`. IMP-136, IMP-137, IMP-097 (changed), D-0108
- BOM import: the latest revision only. Earlier revisions of an assembly are not written unless asked for; a part called at an older revision is one line in the assembly's body. BOM-046, BOM-038 (changed), D-0107
- EA import: parts and ports are named from their name, type, a flow, or just `part`/`port`; untyped usages, ports added from an assembly and elements that could not be placed are lines above the SysML block, not flags. IMP-134, IMP-132 (retired), D-0106
- EA import: a short EA login takes the full 13-letter code of the person it fits. IMP-135, D-0105
- Workbench Compare notes: parts and assemblies only one of two assemblies has, shown as the path down to each unique part, as a table and as a canvas. WKB-051, D-0104
- Workbench colors: one hex color per kind of note on every canvas, graph and page (was missing for many kinds, two kinds shared one, presets mixed with hex); interface objects darker; ports, retired and missing links reserved; inherited cards a lighter mix. WKB-050, D-0103
- Workbench automatic placement: notes go in rows by kind, top to bottom: actor, use case, requirement, functions (states and tests beside), interface objects, objects; issues, info, documents and other kinds in a right-hand column. Auto-layout, Add to canvas and generated canvases. WKB-049, WKB-038 (changed), D-0102
- Workbench: Internal structure can also show ports and parts inherited from general, specific, parent assembly and child parts (four switches, specialization and assembly in separate tables, each member marked with its direction and source note); the internal canvas draws them purple on the note's edge and inside it. WKB-047, WKB-048, D-0101
- EA import: a Part or Port inside a Part usage is written on the block that Part points at, so no part or port is held only by a usage (`PUSHED_UP_TO_BLOCK`). IMP-133, D-0100
- EA import: untyped usages, ports added from an assembly and unmapped elements are one flag per kind per note, listing each item (was one flag each). Expected 1,819 → 415 flags on the test vault; every item keeps its ledger row. IMP-132, D-0099
- BOM import: identical repeated lines are dropped and counted; effectivity dates are not imported (an update can bring them back); a used part's revision property is its latest revision, older revisions in use are listed in the assembly body and raise no flag. Expected to remove about 21,000 of 24,453 flags on the test vault. BOM-012, BOM-024, BOM-045, D-0098
- Workbench internal canvas: port cards are larger (260×56, was 180×40) so port name and type fit. D-0097
- Workbench fix: a table (or panel) opened after the vault index was built stayed on "Reading notes…" until the next rebuild. A view is now handed the index when it opens, and a failed read shows the reason. Regression check added to the plugin test.
- Workbench Internal structure canvas: the note is one large card with its parts inside it and its ports on the edge of each card; wires join port cards. An object with no port shows a placeholder port (nothing written); the Dashboard and Review count objects without a port. Cards are skipped by Refresh and Auto-layout so they can be moved by hand, and Save canvas offers the object's own folder first. WKB-045, WKB-046, D-0097
- Workbench canvas spacing: cards of related notes stay three card widths or heights apart; cards of unrelated notes are one apart (a row of parts is tight, the row sits three heights under its assembly). Applies to every canvas view, Pick notes, Add to canvas, Add children and Auto-layout. WKB-030, D-0096
- Workbench canvas: Collapse layer, Expand layer, Collapse all and Expand all for the chosen cards (panel buttons and commands). Expand all stops at 200 cards on the canvas. WKB-044, D-0095
- Workbench canvas: collapse and expand note cards. A collapsed card hides its parts (and their parts) and shows "▸ +N hidden"; expand puts the direct parts back one layer at a time. Panel button and command "Collapse or expand the selected canvas cards". WKB-043, D-0094
- Workbench merge: choose the owner of each area. Merge shows seven areas (part facts, structure, properties, interfaces and connections, behavior, requirements, other relationships) with the recommended owner preselected; the other note's members go under "Not carried over". The choice is saved as `bomOwns` so later BOM updates change only what the BOM still owns. BOM-035 (changed), BOM-036, WKB-027, D-0053; OD-14 closed.
- BOM updates after an EA merge: the importer owns only its own members and properties inside a part note and never reads or changes what the model added; the Workbench merge keeps the BOM description, manufacturer data and import stamp; revisions are always written as text. BOM-031 (changed), BOM-035, WKB-026, OD-14, D-0052.
- Importer: "Update an existing vault from a BOM". A later BOM file is scanned against the vault, changes are listed by category, and the owner ticks a category or single items; only those are written, with a report note. Edited and unstamped notes are left alone. BOM-032 to BOM-034, D-0051.
- BOM import: every BOM note carries an import stamp (`importSource`, `importedOn`, `importHash`) so later update scans can tell a changed BOM from a hand edit without rewriting notes. BOM-031, D-0050.
- BOM import: replaced part numbers that no BOM lists get a stub note, so `supersedes` always resolves; CI parser job now also accepts a generated BOM sample model (run 40040942222 passed). BOM-030, D-0049.
- BOM import: all relationships are SysML text (no `hasPart`/`references` YAML; drawings as `ref item`; renumbered parts as `dependency … // supersedes`); manufacturer data as `manufacturer1`, `mfgPn1`, `manufacturer2`, … YAML; assemblies already in the vault are not re-read; findings note capped at 40 rows per code; import order written down. D-0048, BOM-025 to BOM-029.
- BOM import follows the owner's decisions: every part of every product gets a note; the latest revision is chosen by a stated order (no part is held back); standard units, `YYYY-MM-dd` dates, no lifecycle state, the part name as a `description` property, a Replaces section for renumbered parts, and a `flagValue` callout when one assembly line has two sets of values. D-0047, BOM-018 to BOM-024. Closes OD-10 to OD-13.
- BOM import: tested on the real BOM set. The `x` end-of-data row no longer becomes a part, `partNumber` is always a string, and uid allocation is no longer quadratic (172,000-row export: 189 s to 64 s). Data decisions opened as OD-10 to OD-13. D-0046, IMP-129.
- Language reference: 123 notes in three groups (109 language constructs, 12 standard-library concepts, 2 modeling patterns). Adds conditional succession, derivation, causation, multicausation, trade study, verdicts, verification methods, quantities and units, rationale/issue/status/refinement metadata, shape items. Corrects the succession, use case and individual notes. Each note separates documented, recognized, written by the importer, and parser-accepted (not established). D-0044, MOD-165, MOD-166. 
- Native SysML v2 forms: requirement derivation is written `#derivation connection` and refinement `#refinement dependency`, by the importer and the Workbench Edit lens; the old comment-tag forms are still read. Rules can be tagged `live` to find documentation updates. D-0045, MOD-168, MOD-169, IMP-128, WKB-025. Closes OD-09.
- Workbench: draw a line between two note cards on the canvas preview, pick the relationship kind from a drop-down, review the diff and apply (undoable). WKB-024, D-0043. Tested against the fake Obsidian API only.

## 2026-10-21 — Release 0.9.0: Workbench views, import checks, toolset version, usage naming

- Workbench 0.9.0: separate Structure, Design types, Internal, Function, States and Requirements views; every section and list group folds; Notes list can be grouped; measured quantities print their unit (was `NaN`). WKB-022, WKB-023.
- Importer: "Check for flags first" (dry run, verdict, grouped flag list, CSV); version table of the vault's toolset against the importer's with an update on/off tick box; usage and definition names keep `+`, `-`, decimals and numbers, and same-named ports are told apart by type. IMP-124, IMP-125, IMP-126.
- First real version: the repository and the vault release were `0.0.0-dev`; both are now `0.9.0`. D-0041.

## 2026-10-19 — Repository established

- Created from the owner-reviewed Rules Register and the proven parts of `Test_Vault_` (see [docs/HISTORY.md](docs/HISTORY.md)).
- `governance/RULESET.md` is the single ruleset: 327 rules (100 Active, 3 Proposed, 3 Check, 221 Unreviewed) and 38 retired.
- Carried with their tests: core note-format library, QEAX reader, single-file importer build, Python oracles, Golden Charger and Sample Instrument fixtures, schemas, EA family mapping, AI-CR-01.
- Decisions D-0000 to D-0014 recorded.
