# workbench

Read-only viewer for an MDSE vault. One TypeScript core, two shells: an offline HTML page and an Obsidian plugin. Phase 1 is read-only; Phase 3 adds editing.

**Rules:** RULESET.md section WKB, plus MOD. **State: built (version 0.4.0), read-only.** D-0019 records the design.

## Run it

- **Page:** `npm run build:workbench`, then open `tools/workbench/dist/mdse_workbench.html`. Choose "Open vault folder" (Chromium browsers), "Choose folder (any browser)", or "Open MDSE.zip", or drop a folder or zip on the page. Nothing leaves the browser.
- **Obsidian:** copy `tools/workbench/dist/plugin/` (`main.js`, `manifest.json`, `styles.css`) to `<vault>/.obsidian/plugins/mdse-workbench/`, enable it, then use the ribbon icon or the command "Open MDSE Workbench". The plugin is tested in Chromium against a fake Obsidian API (`testing/oracles/test_workbench_plugin.py`); it has not been run in real Obsidian yet.

## In Obsidian: table and canvas

- **Table:** the Workbench tab (ribbon icon, or command "Open MDSE Workbench"). The Notes tab is a filterable table of every note; Relationships, Traceability and the parts list are tables too. All export to CSV.
- **Canvas:** on the Structure, Where used and Graph tabs, "Open as Canvas" writes an Obsidian Canvas of that view and opens it. Cards are the real notes (click through, hover to preview); a reference whose note is not in the vault becomes a red text card. Also from the command palette ("Create canvas from current note", pick a profile) and the file right-click menu ("Create MDSE canvas").
- Canvases are generated and disposable: they go in `99_System/12_Views/`, are overwritten on regeneration, hold no model meaning, and the Workbench indexer ignores them. They are the only files the plugin writes (D-0020). In the browser page the same button downloads the `.canvas` file.
- **View settings** (Graph tab; the canvas uses the same settings): connections away (hops), max notes, relationships followed (none ticked = the profile's own), note types shown, status shown, limit to a folder, and a classifier. The classifier groups notes that share a type, subtype, status, folder or EA type at the same distance into one card ("Requirement/engineering ×30") once more than N share it, with merged edge counts ("allocatedTo ×30"). On a canvas the group card lists member links. Notes hidden by a filter are not traversed through. Settings are per session; a canvas generated with non-default settings gets a short code in its file name so it does not overwrite the default one.
- "Show current note in MDSE Workbench" (command and right-click) jumps straight to a note.

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
