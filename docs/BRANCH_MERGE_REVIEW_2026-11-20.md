# MDSE_v2 branch consolidation and four-workflow integration review

Date: 2026-11-20 / 2026-11-21 (America/Los_Angeles). Scope: tools repository only. This review does not authorize rollout to MDSE_v2_live.

## Branch inventory (as inspected against main at 72939840)

| Branch | Ahead of main | Recommendation |
| --- | ---: | --- |
| main | 0 | Remains released baseline until acceptance |
| ux/pass08-workarea-prototype-20261119 | 137 | Source of Document / Define / Structure / Verify, workflow-specific creation, related-item discovery, Follow/Pin, member connections, quick create; do not merge original tab-opening behavior |
| prototype/connection-discovery-20261120 | 137 | Identical SHA to UX branch; no second merge |
| hardening/cross-platform-import-update-20261120 | 172 | Descends from UX (35 additional commits): import/update transaction and Windows/macOS checks; separate integration after UX navigation acceptance |
| test/functional-prototype-20261120 | 14 | Useful note/canvas editor-tab policy and in-panel table navigation/pagination; cherry-pick intent into UX rather than merge its older core shell wholesale |
| prototype/workbench-importer-acceptance-20261120 | 1 | Documentation-only acceptance contract |

## Approved UI target for proposed PR #8

- Exactly one MDSE Workbench UI: sidebar by default, optional pop-out.
- Four persistent navigation areas: Document, Define, Structure, Verify. Switching tools, tables, workflows or related-item context updates this panel *in place*.
- No `mdse-workflow-tab` registration, no Workbench "new tab" action and no workflow opening-mode switch. A one-time detachment of legacy experimental workflow tabs on plugin load is allowed.
- Notes, Canvases and eventually Bases are independent Obsidian engineering artifacts. The note/canvas opener focuses an already-open editor tab when possible. A new canvas preview is a distinct temporary file; Save creates a persistent artifact.
- Large tables in Workbench expose pagination and CSV, rather than forcing a tool into the main editing area.
- SysML v2 text remains authoritative; view switching never implicitly writes the model.

## Build and acceptance gates

1. Workbench/importer generated distributions must both match the source branch and pass deterministic checks.
2. Run Workbench, importer, core, bootstrap and browser oracle suites; preserve actual run links and fix any failure. Cross-platform importer hardening is a separate PR and should not be mistaken for the four-workflow navigation gate.
3. Run real Obsidian sidebar/pop-out and document/canvas tab acceptance before non-draft main release.
4. Confirm importer-generated plugin content matches reviewed source and that updater does not deploy stale Workbench. No automatic MDSE_v2_live modification.
5. Keep original UX PR #4, testing PR #7, hardening PR #5, and acceptance PR #6 unmerged until each is closed or superseded deliberately.

## Known scope boundaries

- Full real .qeax imports, BOM revision/update reconciliation and independent SysML parser validation remain separate importer gates.
- Verify is currently verification/requirements *navigation*; complete test execution and evidence lifecycle are not implied by its name.
- Do not merge all branches blindly: UX is already included in hardening; connection-discovery is a duplicate pointer.
