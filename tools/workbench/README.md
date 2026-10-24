# workbench

Viewer for an MDSE vault (read-only except two Review actions, D-0025). One TypeScript core, two shells: an offline HTML page and an Obsidian plugin.

**Rules:** RULESET.md section WKB, plus MOD. **State: built (version 0.8.0); edits: Review actions (D-0025) and the Edit lens (D-0030, D-0031).** D-0019 records the design.

## Run it

- **Page:** `npm run build:workbench`, then open `tools/workbench/dist/mdse_workbench.html`. Choose "Open vault folder" (Chromium browsers), "Choose folder (any browser)", or "Open MDSE.zip", or drop a folder or zip on the page. Nothing leaves the browser.
- **Obsidian, new or existing vault:** the importer ships this plugin in the base vault and its "Update vault configuration" step installs or upgrades it in an existing vault without a data source (D-0024).
- **Obsidian, by hand:** copy `tools/workbench/dist/plugin/` (`main.js`, `manifest.json`, `styles.css`) to `<vault>/.obsidian/plugins/mdse-workbench/`, enable it, then use the ribbon icon or the command "Open MDSE Workbench (right panel)". The plugin is tested in Chromium against a fake Obsidian API (`testing/oracles/test_workbench_plugin.py`); it has not been run in real Obsidian yet.

## In Obsidian: right panel, main-window table and canvas

There is no Workbench browser. Obsidian's file explorer picks the note; the Workbench is a panel in the **right sidebar** that shows the note you have open and follows it as you click through the vault (untick "follow the selected note" in the main-window table to pin one). Tables and canvases open in the **main window** for the selected note and lens.

- **Lenses (buttons at the top of the panel):** Dashboard (vault counts and bars), Note (metadata, flags, relationships, SysML), Tables, Structure trace, Functional trace, Requirements trace, Review.
- **Table in main window:** opens the lens as a full-width table (Tables: relationships, usages, all notes; Structure trace: part tree, rolled-up parts list, where used; Functional trace: each behavior with its performer, actions, requirements, verification, allocation and gaps; Requirements trace: satisfied-by, verified-by, derivations, gaps). Scope is "around the selected note" or "everything in the vault". All export to CSV.
- **Canvas in main window (temporary view):** Structure, Functional and Requirements trace and Tables each have a canvas profile. It is written to ONE scratch file, `99_System/22_Views/Workbench Preview.canvas`, and opened in the main area. Every preview overwrites that file, it is deleted when the plugin loads or unloads, and Git ignores the folder. Cards are the real notes; a reference whose note is not in the vault is a red text card. Also the command "Preview canvas from current note" and the file right-click menu.
- **Cards (D-0081):** a note card shows the note's name, else its description, with its part number, else its id, in small type underneath. It is a text card whose first line links the note.
- **Pick notes (canvas from a search):** the Pick notes lens lists every note whose name, description, id, part number or alias holds all the words typed (optionally one type), 500 at most. Tick some or all and choose Place on canvas: the ticked notes (up to 200) go to the same scratch canvas as above, in a grid, in one labelled box for each note type (unless "group by type" is unticked), with the relationships between them drawn unless unticked. Save canvas… keeps it. D-0078.
- **Saved view:** nothing is kept until you choose "Save canvas…" (panel button, or the command "Save preview canvas…"). The default folder `99_System/23_Saved_Views` (setting "Default folder for saved canvases") is offered first, then the last folder you used, then every other folder. The saved file is a copy of the preview as you left it and never overwrites (a counter is added).
- **Canvas settings** (in the panel): connections away (hops), max notes, relationships followed, note types and statuses shown, folder, and a classifier that groups notes sharing a type, subtype, status, folder or EA type at the same distance into one card with merged edge counts. Notes hidden by a filter are not traversed through. Settings are per session; a canvas saved from non-default settings gets a short code in its suggested file name.
- **Edit (D-0030, D-0031):** Relationships tab lists the selected note's SysML relationships with Edit and Remove; Edit changes the target, dependency kind, name, quantity, direction, ordered/nonunique, description and free attributes (an "Add property" drop-down of the options that relationship has, plus "Other attribute…" where allowed). A relationship can also be opened from the Edit button on a relationship table row, from the canvas (select a line, command "Edit the relationship selected on the canvas", or right-click the line), and a "?" beside every option shows a short definition with a link to the language note. Add relationship (kind drop-down limited to what the selected note's definition allows; searchable, folder-grouped target browser showing id, type and requirement text; preview diff; Apply; Undo), Add element (class and subtype drop-downs, folder search, name, text), Requirement text. Kinds: has part/port/action/state/item, satisfies, verifies, allocated to, performs, derived from, refines, traces to, depends on, specializes, includes, extended by.
- **Draw a relationship (D-0043, WKB-024):** on the canvas preview, drag a line from one note card to another. A dialog offers the relationship kinds the two notes allow (a drop-down, plus name, quantity or direction where the kind takes them) and shows the diff; Apply writes it into the source note's SysML block with an Undo, Cancel removes the line. Lines to a card that is not a note, to the same note, or with no writable kind are removed with the reason. A line drawn the wrong way (a requirement to the part that satisfies it) is told which kinds fit the other way. Works on the preview only; the line stays, labelled, after Apply. Not yet run in real Obsidian.
- **Review (updates issues):** flags, unresolved links, untyped usages, duplicate ids, parser status, and every Issue note not Retired. Two buttons write to a note, each on your click, each with an Undo: a status picker on an Issue note, and "Resolve" on a flag (removes that one flag callout from the user zone). Nothing else edits a note, and the Workbench never edits the `## SysML v2` block.
- The index is shared by the panel and the tables and rebuilds a moment after a note is saved, created, renamed or deleted.

## Rules this tool follows

Agreed 2026-10-19 (D-0023). These are tool documentation; they are not registered in RULESET.md, whose WKB rules stay Unreviewed.

1. **Edits are few, previewed and undoable (D-0025, D-0030).** The Workbench never renames or deletes a model note. Review: set an Issue's `status`, resolve one flag. Edit lens: add a relationship (written into the source note's `## SysML v2` block), add an element (a new note with uid, id, status and its block), set a requirement's text. Each edit shows a diff first, is applied only on a click, is refused if the file changed since the preview, and has an Undo.
2. **Disposable index.** It is rebuilt from the files on every load and holds no meaning of its own.
3. **Relationships come from the SysML v2 text** (D-0003) plus MDSE-only YAML links. It never guesses a link; what it cannot resolve is shown as unresolved and listed in Review.
4. **A missing end is never invented.** An `allocate` or `dependency` whose source note is absent is kept as an unresolved edge on the note that has it, never as a self-loop. Typed parts whose definition is absent are listed as "not in vault".
5. **Views hold no model meaning.** Graphs, canvases and tables are pictures; deleting one loses nothing and regenerating it gives the same picture.
6. **Temporary views are temporary.** A canvas preview is one scratch file in `99_System/22_Views/`, overwritten by each preview, deleted on load and unload, and ignored by Git. Previews never accumulate.
7. **A view is kept only when the user saves it.** Saving is always the user's action, writes exactly one named file, goes to `99_System/23_Saved_Views/` by default or any folder the user picks, copies the preview as the user left it, and never overwrites an existing file. There is no auto-save.
8. **Filters hide, they do not connect through.** A note hidden by a type, status or folder filter is not traversed through. Caps are always reported ("capped"). Grouping (the classifier) merges notes and edges and shows counts.
9. **The indexer reads only `.md` notes** and skips `99_System/` and `.obsidian`, so views and system files are never mistaken for model notes.
10. **Per-user settings stay local.** The default and last save folders live in the plugin's `data.json`, which Git ignores and AI tools never edit.
11. **Honest parser status.** SysML blocks show "unchecked" unless `99_System/11_Import/Parser Check.md` says `Status: **PASSED**` or `**FAILED**`.
12. **Staged startup.** Nothing touches the model until Obsidian's layout is ready; indexing yields so the window stays usable.

## Views

| View | Answers |
|---|---|
| Dashboard | What is in the vault: counts by type, status, flag, relationship kind, folder |
| Notes | Filterable table of every note; CSV export |
| Note | One note: metadata, flags, source, SysML block, in/out relationships |
| Structure | Part tree with ports and flows, plus a rolled-up parts list (quantities multiplied down the tree) |
| Where used | What owns, specializes or performs a note, and every other reference |
| Traceability | Requirements against satisfied by, verified by, derived from, derives; gaps flagged |
| Behavior | Actions and states as a flow (succession, transition, fork, join, triggers) |
| Interfaces | Ports, interface definitions and the items that flow |
| Graph | Radial graph from a note using a profile (Structure, Requirements, Verification, Behavior, Interfaces, Allocation, Dependencies, Documentation, Everything), depth and node cap |
| Relationships | Every relationship, filterable by kind |
| Review | Flags, unresolved links, untyped usages, duplicate ids, parser status |

## How it reads the model

- The index is built from files and thrown away; it is never a second store of model meaning.
- SysML-defined content is read only from the `## SysML v2` block (D-0003). `src/sysml_scan.ts` recognizes the subset the importer emits. It is not a parser; statements it does not know are kept as warnings. Blocks show "unchecked" unless `99_System/11_Import/Parser Check.md` says `Status: **PASSED**` or `**FAILED**`.
- Startup is staged: the build is async and yields, so the UI stays usable on large vaults. A 6,000-note check runs in CI.

## OD-09: what came from V1

Ported (as concepts, rewritten for SysML text): view profiles, staged startup, where-used. Not carried: Local Model, editing, the semantic cache, runtime health. The index is cheap to rebuild, so no cache until measured scale needs one.

## Prior art (read-only)

`spencerskelly/MDSE_Workbench` (V1 plugin) and `Test_Vault_` at `4a2b154` (`24_Workbench/v2-workbench.html`).

## Not done

Editing (Phase 3), saved views, real-Obsidian testing, parser-backed conformance in the viewer, canvas for a whole folder or query.
