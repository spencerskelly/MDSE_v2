# Workbench optional pop-out — integration review

Status: **Merged into main; owner-confirmed functional acceptance in real Obsidian (2026-11-19); broader regression/release acceptance remains open**  
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

## Recorded verification
- **2026-11-19 — Owner functional acceptance:** The owner reports testing the pop-out in real Obsidian and confirms that it works as planned. This is direct user-reported acceptance of intended pop-out behavior, not a recorded exhaustive test matrix.
- **CI #199:** Applicable CI jobs passed for the integrated PR, including Python oracle/browser smoke, core/importer build consistency, and data-policy checks. Independent SysML parser gate was skipped for the PR run.
- **Merged:** PR #3 into `main` at `1e5f915b7ab8631e53e03d292f3c9edc0578d97c`.

## Remaining verification / release tasks
1. Build the Workbench with the repository's prescribed npm build; verify the distributable `tools/workbench/dist/plugin/main.js` matches changed source.
2. Run `testing/oracles/test_workbench_plugin.py` (including new pop-out migration test) and the standard Workbench test suites; capture CI evidence.
3. **Functional owner test completed.** Detailed evidence for sidebar migration, toggle, reopen, and duplicate-panel behavior was not individually enumerated; retain these as regression cases.
4. Check note selection, search, table/canvas actions, focus, menus, and shortcuts across windows.
5. Confirm the pop-out API unavailable path, plugin disable/re-enable and session restoration.
6. Assign a fresh **unused** governance decision/rule number only after acceptance. Do not reuse any number from the experimental branch.
7. Synchronize a **validated built plugin** to MDSE_v2_live; do not deploy source-only changes.

## Known limitations
The fake Obsidian UI does not prove multi-window focus, owner-document propagation or runtime API compatibility. A code-only review cannot certify those interactions. The experimental branch's unrelated document importer prototype and stale generated importer/plugin artifacts are explicitly excluded.

## Disposition
Feature merged into `main`. Original experimental PR #2 is closed and the old branch archived/deleted. Owner reports successful real-Obsidian functional behavior on 2026-11-19. Keep pop-out opt-in until remaining regression/release gates are explicitly closed; this is not a claim of exhaustive acceptance.
