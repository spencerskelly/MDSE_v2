# Workbench optional pop-out — integration review

Status: **Implementation candidate; not yet accepted or released**  
Source: experimental branch `experiment/workbench-popout-window`, selectively integrated against `main` on 2026-11-19.

## Intent
Allow the MDSE Workbench panel to be opened in a separate Obsidian pop-out window while the notes, tables and canvases stay in the editor area. This is an optional presentation mode. The normal right-panel behavior remains the default.

## Implementation scope
- Workbench setting `popout`, default false; `Open MDSE Workbench` follows the setting.
- Explicit `Open MDSE Workbench in a pop-out window` command does not persistently change the setting.
- Existing panel is reused when already in the requested location; an incompatible panel leaf is detached before creating the replacement.
- If the Obsidian API does not support pop-outs, the panel falls back to the sidebar with a Notice.
- No model semantics, YAML properties, SysML text, canvas generation or import behavior are changed.
- Older experiment's decision `D-0161` and rule `WKB-074` **must not** be imported: those identifiers already belong to different, accepted topics on current `main`.

## Verification required
1. Build the Workbench with the repository's prescribed npm build; verify the distributable `tools/workbench/dist/plugin/main.js` matches changed source.
2. Run `testing/oracles/test_workbench_plugin.py` (including new pop-out migration test) and the standard Workbench test suites; capture CI evidence.
3. Run in **real Obsidian**, not only the fake Obsidian API: open from sidebar; request pop-out; use the toggle; reopen and return to sidebar; verify no duplicate panel.
4. Check note selection, search, table/canvas actions, focus, menus, and shortcuts across windows.
5. Confirm the pop-out API unavailable path, plugin disable/re-enable and session restoration.
6. Assign a fresh **unused** governance decision/rule number only after acceptance. Do not reuse any number from the experimental branch.
7. Synchronize a **validated built plugin** to MDSE_v2_live; do not deploy source-only changes.

## Known limitations
The fake Obsidian UI does not prove multi-window focus, owner-document propagation or runtime API compatibility. A code-only review cannot certify those interactions. The experimental branch's unrelated document importer prototype and stale generated importer/plugin artifacts are explicitly excluded.

## Disposition
Review as a feature PR. Do not merge into main or retire the original experiment until tests and real Obsidian acceptance are recorded.
