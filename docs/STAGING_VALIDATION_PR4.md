# PR #4 — Workbench staging acceptance record

**As of 2026-11-20 (America/Los_Angeles):** Build synchronized; real-Obsidian acceptance **not yet performed**. Do not treat these checked boxes as an approved release.

## Immutable build evidence

| Item | Evidence |
|---|---|
| Tool source branch | `ux/pass08-workarea-prototype-20261119` in `spencerskelly/MDSE_v2` |
| Paired generated-output commit | `5735b19513f1ccc71152d630731ffcc39c2883c1` |
| Build and artifact-sync workflow | [Actions run 44848981129](https://github.com/spencerskelly/MDSE_v2/actions/runs/44848981129), successful |
| Workbench artifact | `tools/workbench/dist/plugin/main.js` and `manifest.json` / `styles.css` |
| Optional offline Workbench | `tools/workbench/dist/mdse_workbench.html` |
| Paired controlled updater | `tools/importer/dist/mdse_importer.html` |
| Importer generated build ID | `7165b2684e` (from paired build log) |
| Workbench unit tests | 207 passed, zero failed |
| Importer unit tests | 140 passed, zero failed |
| Core unit tests | 15 passed, zero failed |
| Bootstrap unit tests | 5 passed, zero failed |
| Real Obsidian / live vault acceptance | **Not performed** |
| Merge / live deployment | **Not authorized; not performed** |

The build job regenerated both outputs *at the same source SHA*, verified `check:workbench` and `check:importer`, ran the above tests, and committed only three changed distribution files. Subsequent documentation or smoke-test changes do not alter the embedded runtime. Full CI and Python/browser-oracle evidence must be checked separately.

## Stage the build without changing live

1. In a local `MDSE_v2` checkout, `git fetch origin`, then `git switch ux/pass08-workarea-prototype-20261119` and `git pull --ff-only`. Record `git rev-parse HEAD`; it must contain commit `5735b195` as an ancestor. Run `npm run check:workbench && npm run check:importer`. Do not install from `main`.
2. Make an *isolated local copy* of the engineering vault or a synthetic test vault. Do not attach this pilot to `MDSE_v2_live/main`; do not commit new runtime files to live `main`. Back up the staging vault's `.obsidian/plugins/mdse-workbench/`, `.obsidian/plugins/mdse-bootstrap/` and controlled `99_System` settings. Record the original vault revision and Obsidian version.
3. For **full managed-toolset staging**, open the paired `tools/importer/dist/mdse_importer.html` in a supported Chromium browser, select the staging vault, use Step 4 **Preview vault update**, inspect every changed setting/template/plugin file, and only then Apply. Confirm Bootstrap's plugin lock remains consistent. Do not skip a lock failure.
4. For an **isolated Workbench-only UX pilot**, close/disable the plugin in the staging vault, copy `main.js`, `manifest.json`, and `styles.css` from `tools/workbench/dist/plugin/` to the staging vault's `.obsidian/plugins/mdse-workbench/`, then reopen Obsidian. This is *not* a full importer/Base Vault/schema update; it may be rejected by active Bootstrap lock enforcement. Do not forge or bypass the lock.
5. Preserve the original vault and full backup for rollback. Keep source branch, distributed file hashes and any resulting staging-vault commit associated with the test report.

## Interactive acceptance ledger

Mark each row **Pass / Fail / Not tested**, record a screenshot or log on failures, and note any model-file diff. The test deliberately separates read-only navigation from governed writes.

| Test | Expected behavior | Result |
|---|---|---|
| Initial plugin load | Workbench starts, model index loads, no JavaScript error or unintended model edits | Not tested |
| Switch work areas/functions | By default opens a **new Workbench tab**; original note, Canvas, open edit form and tab remain unchanged; “current Workbench” option works only when selected | Not tested |
| Follow / Pin | Each tab independently follows or holds selection; entering Edit pins the source; reopened tabs restore own state | Not tested |
| Contextual navigation | From note/menu/related-result, opening the target in Document, Define, Structure or Verify retains the originating tab and targets the correct note | Not tested |
| Search | Governed-note search resolves name/alias/ID; no unwanted navigation or tab replacement | Not tested |
| Shared-term discovery | Full-token queries and multi-term AND across requirement/test/model text, common words by type count, grouped type facets, matching excerpts, and type-aware selection; Canvas contains only selected note cards and existing governed links; unrelated editor tabs unchanged | Not tested |
| New plain note | Document creates Markdown without model UID or SysML, in a new tab; duplicate/path validation, Preview, Create and Undo work | Not tested |
| New governed element | Preview shows exact ID/UID/SysML content; new note is created alone; optional relationship is a distinct second preview/approval; cancellation leaves it unlinked | Not tested |
| Member inspector | A usage remains distinct from its type definition; explicit endpoints, missing ports, inherited typing, filtering and pagination are correct | Not tested |
| Member Canvas | **Canvas connections** opens a new scratch Canvas; one owner file card, usage/endpoint visual cards, explicit connector/binding/flow only; flow directions correct, unresolved marked, no model-file changes | Not tested |
| Neighbor discovery | Filtered and unrestricted candidates are temporary; selection/Keep/Dismiss/Save preserve kept cards and never silently create relationships | Not tested |
| User-drawn connection | Proposed line is either validated and committed via governed SysML editor after explicit approval, or rejected/removed; never treated as a model link just because drawn | Not tested |
| Persistence / rollback | Saving a visualization does not write SysML; closing/restarting keeps other tabs and notes intact; backups restore previous plugin/config | Not tested |
| Controlled importer update | Preview lists all changes; Apply updates only intended managed files, retains model notes and user preferences where promised, second Preview shows no unintended edits | Not tested |

## CI and approval disposition

- **Generated outputs:** synchronized at `5735b195` with the paired build and distribution checks passing.
- **Synthetic unit tests:** 207 Workbench + 140 importer + 15 core + 5 Bootstrap passing at the same build.
- **Browser/oracle smoke:** use the latest pull-request CI; this does not substitute for real Obsidian.
- **Independent SysML parser / real-vault index check:** separately required if relevant to the release scope; not certified by the source build.
- **Release decision:** **Hold.** Do not merge PR #4 or promote into `MDSE_v2_live` until actual Obsidian staging acceptance is recorded and the owner explicitly authorizes deployment.

If a staging test fails: record failure and exact SHA, restore backed-up plugin/configuration, retain the failing staging copy for diagnosis, and do not advance the live vault.

[Full toolset build/update instructions](TOOLSET_UPDATE.md) · [Workbench implementation notes](../tools/workbench/README.md) · [PR #4](https://github.com/spencerskelly/MDSE_v2/pull/4)
