# MDSE prototype — first real Obsidian acceptance test

**Scope:** `test/functional-prototype-20261120` only. No release sign-off yet. Do not copy or sync into `MDSE_v2_live`, `main`, or a production engineering vault during this test.

## Build provenance — fill in before installation

- Branch SHA: (paste exact commit from GitHub)
- Source/build version: 0.10.0 (confirm current package and plugin manifest)
- Build workflow run URL:
- `npm run test:workbench` result:
- `npm run test:importer` result:
- `npm run check:workbench` / `npm run check:importer` results:
- CI browser/oracle result:
- SHA256 of `tools/workbench/dist/plugin/main.js`:
- SHA256 of `tools/importer/dist/mdse_importer.html`:

**Block installation if the distributables or their test results are unverified.** Browser oracle tests use a stand-in Obsidian API; the steps below are the real integration gate.

## Preparation

1. Use a disposable Obsidian vault, not the live self-model, with a known working Obsidian version. Back up its `.obsidian/` folder. Create two simple Markdown notes with distinct filenames and a relation between them in the supported v2 model format.
2. Check out the named testing branch at the recorded SHA; use Node 22. Run `npm run build`, `npm run test:workbench`, `npm run test:importer`, and the two build checks, or use the exact verified GitHub build artifacts. If a real QA environment is available, run the browser oracles as well.
3. Copy `tools/workbench/dist/plugin/main.js`, `manifest.json`, and `styles.css` into `<test vault>/.obsidian/plugins/mdse-workbench/`. Enable it in Obsidian Community Plugins; acknowledge the normal third-party plugin trust prompt. Leave Bootstrap disabled unless it has separate release acceptance.
4. Start with the right-side Workbench, using the ribbon icon or command `Open MDSE Workbench`. Keep the editor tab strip visible.

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

## Boundaries

- The previous CI's browser failure was caused by an obsolete main-window-table assertion; tests were changed to assert in-panel behavior. This does not prove real Obsidian acceptance.
- SysML v2 independent-parser acceptance, full real QEAX data, existing-BOM update/revision reconciliation, and Bases artifact navigation are distinct gates and are **not certified** by navigation testing.
- Do not promote to a release, merge into main, or synchronize into MDSE_v2_live until the appropriate test results and owner acceptance exist.
