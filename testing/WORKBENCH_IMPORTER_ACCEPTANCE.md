# Workbench and Importer — consolidated acceptance contract

**State:** merged source, pending real-vault release acceptance. **This document is an acceptance *specification*, not evidence that a manual test passed.**

**Source merges:** [PR #8](https://github.com/spencerskelly/MDSE_v2/pull/8) (`17098637222001302c9a36fed1e0a9a0a5f63b8b`), [PR #9](https://github.com/spencerskelly/MDSE_v2/pull/9) (`f0e0300a26dd1488cc3a9ee3c6b9cd41535b7812`). Both are in `main`; neither automatically installs tools into `MDSE_v2_live`.

**Preserved provenance (branch-only original documents):**
- `test/functional-prototype-20261120:testing/OBSIDIAN_PROTOTYPE_ACCEPTANCE_2026-11-20.md` (NAV-01–NAV-12).
- `prototype/workbench-importer-acceptance-20261120:testing/PROTOTYPE_ACCEPTANCE_2026-11-20.md` (WB-NAV-01–10, N01–N08, I01–I09, R01–R04).
- The original documents were written *before* merges #8/#9. Their directions not to merge them were historical staging constraints, not the current repository state. The detailed **test criteria** below are preserved; their old branch/version/status prose is not promoted.

## Build and deployment boundary

1. Build Workbench then importer from one exact current `main` SHA; save hashes of generated Workbench plugin, offline page and importer HTML.
2. Require generated files to match source and CI to pass. The source tests and browser fakes do **not** constitute real Obsidian validation.
3. Use a disposable copied vault for real Obsidian navigation; use copied vaults on real NTFS and APFS for importer write/rollback tests. Record every expected versus actual result, plugin and vault SHA, OS and Obsidian version.
4. Independently run the pinned SysML v2 parser on emitted model files. An independent parser job that is skipped or remains pending is **not** a pass.
5. Keep `MDSE_v2_live/main` and production engineering vaults unchanged until staged toolset-update approval. Base/Importer/Bootstrap/plugin-lock versions must be a coordinated release; branch cleanup does not change that gate.

## Original workbench navigation acceptance criteria

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

## Real-Obsidian interaction script

## Manual acceptance cases — record Pass / Fail / Blocked with screenshot and notes

| ID | Action | Expected |
| --- | --- | --- |
| NAV-01 | Select Dashboard → Tables → Structure → Requirements → Review from the function menu | Same Workbench panel changes in place. **Zero** new editor tabs and zero new Workbench leaves. |
| NAV-02 | Run `Show MDSE table in Workbench…` and choose Structure | Existing Workbench shows the Structure lens; no `mdse-table` editor tab. |
| NAV-03 | Click Open note for note A, then open note B from Workbench | Both notes are available as independently addressable editor tabs; Workbench stays in its panel. |
| NAV-04 | Open note A again using Workbench | Focus note A's existing tab; do not duplicate it. |
| NAV-05 | From A, choose Canvas in main window, then generate a second canvas | Two distinct canvas editor tabs; first canvas remains revisitable and retains edits/positions. |
| NAV-06 | Save a preview canvas, select another tab, then reopen that saved canvas | Saved canvas opens/focuses without overwriting either canvas or model notes. |
| NAV-07 | Generate a structure table with over 25 entries | Workbench panel displays page controls; next/previous page work; CSV export covers the complete table. |
| NAV-08 | Switch tool lenses after editing an opened canvas | Workbench changes, canvas remains open and unchanged; no implicit canvas writes. |
| NAV-09 | Use explicit `Open MDSE Workbench in a pop-out window` | One logical Workbench in the pop-out; tool selection does not create Obsidian editor tabs. |
| NAV-10 | Repeat NAV-02, NAV-04, NAV-05 with the pop-out active | Same results as sidebar, and all artifacts remain in their editor workspace. |
| NAV-11 | Switch pop-out setting off; reopen Workbench; disable/re-enable plugin | No duplicate Workbenches or lost artifacts; any restoration limitations recorded. |
| NAV-12 | Import a synthetic model through `mdse_importer.html` into a new throwaway vault, then inspect its notes in Workbench | Stable note identity; Workbench displays imported relationships; no warning is concealed. |

## Failure evidence

Record: case ID, exact Obsidian version/OS, plugin/source SHA, reproduction steps, expected vs actual behavior, affected note/canvas paths, screenshot or Obsidian Developer Tools console error, and whether files were modified. If failure involves edits, preserve before/after file hashes.

## Review sequence

## Review order (one change per acceptance checkpoint)

1. Workbench stays in panel or popout for every workflow/lens action.
2. Notes/canvases/Bases open or focus separate editor tabs; no accidental overwrites.
3. Stable canvas identity, Save/Open/Refresh, tab persistence.
4. QEAX import and model validity, re-import safety.
5. BOM revision import/update and PLM link integrity.
6. End-to-end import → Workbench search → inspect → edit → verify.
7. Rebuild, regression, parser checks and staged live-vault installation.

## Additional release-critical regression cases

- **NAV-13 (model safety):** Changing a workflow, selecting/dismissing Canvas discovery candidates or opening a Base must not write SysML. Draw-to-relate must require preview, valid native direction, and explicit Apply.
- **NAV-14 (Base gap):** Verify Base editor artifact tab creation, existing Base tab reuse, and retention when opening notes and canvases. If Base navigation is unsupported in the installed Workbench, record **Blocked**, not Pass.
- **IMP-OS-01:** Verify on actual Windows NTFS and macOS APFS that existing-vault update and existing QEAX/BOM import reject stale previews, case/Unicode/path collisions and refused permissions; backups precede mutations; readback verifies output; interrupted writes leave recoverable before-images. See [Cross-platform importer acceptance](../docs/CROSS_PLATFORM_IMPORT_ACCEPTANCE.md).
- **IMP-OS-02:** Re-run unchanged import/update and verify no unexpected changes, duplicate notes or lost user-owned data. Best-effort rollback is not a disk transaction: a full pre-test vault backup is mandatory.
- **GATE-01:** Record exact `main` source SHA; `npm run build`, Workbench/importer/core/bootstrap tests, deterministic checks, oracles, native Windows/macOS matrix and independent parser separately.
- **GATE-02:** Verify imported child revision usage and where-used paths against the source BOM; do not infer that CL1/CL2 multi-revision support is correct simply because generic importer tests pass.

## No automatic release certification

A branch may be deleted once its unique changes, tests and decisions are incorporated into `main` and their history is retained through GitHub PR/commits. **Deleting a branch does not certify** Obsidian acceptance, parser conformance, real engineering source coverage or safe live deployment.
