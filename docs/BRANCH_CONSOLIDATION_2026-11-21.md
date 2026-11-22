# Branch consolidation and release acceptance — 2026-11-21

## Integration baseline
- PR #8 merged four-workflow persistent Workbench to main as commit `17098637222001302c9a36fed1e0a9a0a5f63b8b`. Tool functions and table lenses stay in the sidebar or optional pop-out. Notes and Canvases have independent artifact tabs; opening an existing artifact focuses its tab. Changes to a view do not silently write SysML.
- This branch starts **from that main** and carries only the unique importer transaction and Windows/macOS hardening changes from draft PR #5, rather than its earlier UX ancestry. Source files were compared by blob SHA with the original UX base and matched before carry-forward.
- The full Obsidian runtime and real NTFS/APFS acceptance remain open. A green GitHub CI job is *not* approval to deploy to MDSE_v2_live or a private engineering vault.

## Unique branches and dispositions
- PR #4 `ux/pass08-workarea-prototype-20261119`: content ancestor of PR #8, superseded; do not re-merge (old per-workflow tab behavior conflicts with current decision).
- `prototype/connection-discovery-20261120`: identical SHA/content to UX prototype, superseded by PR #8.
- PR #5 `hardening/cross-platform-import-update-20261120`: unique change is guarded folder imports and vault update Apply, pre-write backup, changed-since-preview checks, cross-platform path collision rejection, readback verification, best-effort rollback, and OS/browser regressions. This clean integration carries those changes.
- PR #6 `prototype/workbench-importer-acceptance-20261120`: documentation-only acceptance contract; its distinctive Cases for **Bases** and independent importer/parser testing remain explicit below.
- PR #7 `test/functional-prototype-20261120`: older tab-open test shell and acceptance plan. Its specific NAV-01–NAV-12 intent is covered by current Workbench/runtime acceptance below; do not port old plugin shell wholesale.
- PR #8 `integration/four-workflows-single-workbench-20261120`: merged.

## Mandatory staging acceptance (manual evidence, not assumed)
1. Document/Define/Structure/Verify, Tables, search, and contextual navigation all use the same Workbench panel or pop-out; zero new Workbench editor tabs.
2. Note A, note B and two distinct Canvas artifacts each keep separate editor tabs. Reopening an existing file focuses its original tab; saved canvases are not overwritten. Verify toolbar actions, Follow/Pin, mode restoration, and undo.
3. **Bases are separate editor artifacts:** open or create a Base, switch Workbench tools, return to Base; check support and report unsupported workflows explicitly. Base acceptance was documented in PR #6 but was not proven by PR #8.
4. Canvas selection/Keep/Dismiss/update/Refresh and draw-to-relate do not infer or commit relationships without explicit preview and Apply; generated edges never trigger false new-link prompts.
5. Import synthetic QEAX and BOM into a disposable vault, reimport unchanged sources, and verify note IDs, pins, source ledgers and no overwrites or duplicates.
6. On **native Windows NTFS and macOS APFS**, use a full vault copy. Preview then Apply update; verify backups of plugins, configs and schemas first, no changed engineering notes, personal settings and attachments intact, and no changes on repeat preview.
7. Induce destination changes after Preview, case/Unicode/path name collisions, permission errors and partial writes; verify refusal or recoverable rollback; keep a separate full-vault backup because rollback is not ACID.
8. Check imported SysML with independent pinned parser, audit real QEAX/BOM layouts only in private staging, and record exact SHA, Obsidian version, OS, screenshots and outcome.
9. Build Workbench **before** bundled importer in one paired build; match source commit, generated artifact SHA, plugin lock and loaded runtime before deploying to MDSE_v2_live.

## Release boundary
A merge into MDSE_v2/main makes reviewed tool source available. It **does not** authorize activation or replacement of installed plugins in MDSE_v2_live. Public tools CI remains synthetic. Real engineering data is never committed here.
