# MDSE importer + Workbench prototype acceptance — 2026-11-20

Status: **release candidate definition; NOT a certified or published release**.

Baseline: MDSE_v2 0.10.0 on main; see package.json and tools/workbench/manifest.json. All implementation changes belong in MDSE_v2. Do not auto-sync into MDSE_v2_live until validated. The live vault remains model/test authority and stays on main.

## Mandatory navigation contract (owner update 2026-11-20)

- WB-NAV-01: Exactly one logical Workbench interface per chosen panel/popout; no tool-mode tabs.
- WB-NAV-02: Selecting tool lenses/workflows changes the contents of the *same* Workbench.
- WB-NAV-03: Opening a different note, canvas or Base opens a distinct Obsidian editor tab.
- WB-NAV-04: Previously opened artifact tabs remain available and unmodified.
- WB-NAV-05: Workbench retains active workflow, filters and context when artifact focus changes, except where a user explicitly resets them.
- WB-NAV-06: Opening an already open artifact focuses its existing tab rather than duplicating it.
- WB-NAV-07: Explicit Create/Open Canvas is an artifact operation, not a lens switch. A new canvas must not overwrite an earlier canvas required for ongoing editing.
- WB-NAV-08: Sidebar and optional popout use identical navigation behavior. On API fallback, report the fallback.
- WB-NAV-09: Viewing another lens must not silently write a canvas or change source SysML.
- WB-NAV-10: Documented temporary previews may be disposable, but persistent canvases must have independent identities and non-overwriting save behavior.

## Release gate matrix

| Test | Expected behavior | Evidence needed |
| --- | --- | --- |
| N01 | Workbench lens buttons, menu and workflow changes stay in one panel/popout | Real Obsidian screen interaction |
| N02 | Open note A then B; separate tabs remain | Real Obsidian |
| N03 | With A selected, create canvas C; A and C remain individually addressable | Real Obsidian |
| N04 | Create canvas D; C unchanged and still editable | File SHA/content before/after |
| N05 | Reopen C; focus existing editor tab | Real Obsidian |
| N06 | Open Base; retains note and canvas tabs | Real Obsidian, Base installed |
| N07 | Repeat N01–N06 in popout; no Workbench view tabs | Real Obsidian |
| N08 | Disable/re-enable plugin, restore workspace, move sidebar/popout | Real Obsidian |
| I01 | Import synthetic QEAX into empty vault, validate note identifiers, SysML syntax, source ledger | Automated + parser |
| I02 | Import same QEAX twice; idempotent, no existing edits lost | Before/after hashes |
| I03 | Add-on import into edited vault; preview conflicts, preserve manual and evidence fields | Automated + real vault |
| I04 | Import supported BOM formats including revisions/CL1, verify parent-child usages | Automated + real BOM |
| I05 | Update existing BOM, prove revision diff and no silent loss | Real revision pair |
| I06 | Preview/apply vault configuration on existing vault, preserve personal settings | Automated + real Obsidian |
| I07 | Importer-produced Workbench plugin loads and browses imported model | End-to-end real Obsidian |
| I08 | Reject malformed sources safely, with intelligible diagnostics | Negative test suite |
| I09 | Check native SysML v2 output against independent pinned parser | Parser acceptance job |
| R01 | npm run build; npm test; build checks; browser smoke | CI links and commit SHA |
| R02 | Workbench dist plugin and importer HTML correspond to same source SHA/version | Build manifest/hash |
| R03 | Publish *candidate* with direct artifact links, version, checksums and known limits | Release record |
| R04 | Stage update into backup/copy of MDSE_v2_live; do not overwrite model notes | Diff + approval |

## Known blockers at document creation

- Importer README explicitly reports no full real QEAX run from this repository and synthetic-only validation for some translations.
- Importer README documents incomplete existing-BOM update handling and revision comparison; fresh vault recommended until corrected.
- Independent SysML parser gate must be shown as passed, not inferred from other CI.
- Popout was owner-tested in Obsidian 2026-11-19 (tools/workbench/POPOUT_ACCEPTANCE.md); broader navigation regressions not yet demonstrated.
- Opening editor artifacts in new tabs needs code and real Obsidian verification. Do not mark the navigation requirement implemented from documentation alone.

## Review order (one change per acceptance checkpoint)

1. Workbench stays in panel or popout for every workflow/lens action.
2. Notes/canvases/Bases open or focus separate editor tabs; no accidental overwrites.
3. Stable canvas identity, Save/Open/Refresh, tab persistence.
4. QEAX import and model validity, re-import safety.
5. BOM revision import/update and PLM link integrity.
6. End-to-end import → Workbench search → inspect → edit → verify.
7. Rebuild, regression, parser checks and staged live-vault installation.

For each change record: commit SHA, initial failing reproduction, fix, automated test, manual test result, open defects, and owner acceptance. Do not claim 'fully functional' until all required gates pass.
