# workbench

Read-only viewer for an MDSE vault. One TypeScript core, two shells: an offline HTML page and an Obsidian plugin. Phase 1 is read-only; Phase 3 adds editing.

**Rules:** RULESET.md section WKB, plus MOD. **State: built (version 0.5.0), read-only.** D-0019 records the design.

## Run it

- **Page:** `npm run build:workbench`, then open `tools/workbench/dist/mdse_workbench.html`. Choose "Open vault folder" (Chromium browsers), "Choose folder (any browser)", or "Open MDSE.zip", or drop a folder or zip on the page. Nothing leaves the browser.
- **Obsidian:** copy `tools/workbench/dist/plugin/` (`main.js`, `manifest.json`, `styles.css`) to `<vault>/.obsidian/plugins/mdse-workbench/`, enable it, then use the ribbon icon or the command "Open MDSE Workbench". The plugin is tested in Chromium against a fake Obsidian API (`testing/oracles/test_workbench_plugin.py`); it has not been run in real Obsidian yet.

## In Obsidian: table and canvas

- **Table:** the Workbench tab (ribbon icon, or command "Open MDSE Workbench"). The Notes tab is a filterable table of every note; Relationships, Traceability and the parts list are tables too. All export to CSV.
- **Canvas preview (temporary view):** "Open as Canvas" (Structure, Where used and Graph tabs; also the command "Preview canvas from current note" and the file right-click menu) writes the view to ONE scratch file, `99_System/22_Views/Workbench Preview.canvas`, and opens it. Every preview overwrites that file, it is deleted when the plugin loads or unloads, and Git ignores the folder. Cards are the real notes (click through, hover to preview); a reference whose note is not in the vault becomes a red text card.
- **Saved view:** nothing is kept until you choose "Save canvas…" (button on the tab, or the command "Save preview canvas…"). You pick a folder: the default `99_System/23_Saved_Views` (setting "Default folder for saved canvases") is offered first, then the last folder you used, then every other folder, so a project folder is one pick away. The saved file is a copy of the preview as it is now, including anything you rearranged, and never overwrites an existing file (a counter is added). In the browser page the same button downloads a `.canvas` file.
- **View settings** (Graph tab; the canvas uses the same settings): connections away (hops), max notes, relationships followed (none ticked = the profile's own), note types shown, status shown, limit to a folder, and a classifier. The classifier groups notes that share a type, subtype, status, folder or EA type at the same distance into one card ("Requirement/engineering ×30") once more than N share it, with merged edge counts ("allocatedTo ×30"). On a canvas the group card lists member links. Notes hidden by a filter are not traversed through. Settings are per session; a canvas saved from non-default settings gets a short code in its suggested file name.
- "Show current note in MDSE Workbench" (command and right-click) jumps straight to a note.

## Rules this tool follows

Agreed 2026-10-19 (D-0023). These are tool documentation; they are not registered in RULESET.md, whose WKB rules stay Unreviewed.

1. **Read-only on the model.** The Workbench never creates, edits, renames or deletes a model note.
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
