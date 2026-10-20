# workbench

Read-only viewer for an MDSE vault. One TypeScript core, two shells: an offline HTML page and an Obsidian plugin. Phase 1 is read-only; Phase 3 adds editing.

**Rules:** RULESET.md section WKB, plus MOD. **State: built (version 0.2.0), read-only.** D-0019 records the design.

## Run it

- **Page:** `npm run build:workbench`, then open `tools/workbench/dist/mdse_workbench.html`. Choose "Open vault folder" (Chromium browsers), "Choose folder (any browser)", or "Open MDSE.zip", or drop a folder or zip on the page. Nothing leaves the browser.
- **Obsidian:** copy `tools/workbench/dist/plugin/` (`main.js`, `manifest.json`, `styles.css`) to `<vault>/.obsidian/plugins/mdse-workbench/`, enable it, then use the ribbon icon or the command "Open MDSE Workbench". The plugin has not been run in real Obsidian yet; only the page is browser-tested.

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

Editing (Phase 3), saved views, real-Obsidian testing, parser-backed conformance in the viewer.
