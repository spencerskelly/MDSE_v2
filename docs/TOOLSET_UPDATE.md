# MDSE toolset update and Workbench acceptance

**Status:** review-branch procedure; not an approved release. Updated 2026-11-20 for the four-workflow UX prototype. **The paired Workbench/importer distributions were synchronized at commit `5735b195`**; see the [PR #4 staging acceptance ledger](STAGING_VALIDATION_PR4.md) for exact evidence and pending real-Obsidian checks. This file is the canonical update procedure for `MDSE_v2` tool builders and the `MDSE_v2_live` integration vault.

## Repository responsibility and release boundary

- `MDSE_v2` owns the tool source, governance, build outputs and importer release payload.
- `MDSE_v2_live` is the main-only engineering-definition and integration vault. Its installed `.obsidian/plugins/mdse-workbench/` files are **built runtime artifacts**, not source code. Do not push experimental source or unvalidated plugin builds to live `main`.
- The current UX prototype is on `ux/pass08-workarea-prototype-20261119`, draft [PR #4](https://github.com/spencerskelly/MDSE_v2/pull/4); `MDSE_v2/main` does not receive prototype changes until review and merge approval.
- `package.json` may still report 0.10.0 on the review branch. A successful branch build is **not** a new pinned release or a verified Bootstrap lock. Never describe the branch as deployed to live.
- Engineering data stays out of the public tools repository (DAT-002). Run real-vault checks only in the private/live vault; do not upload private model content to tool CI.

## Step 1 — Choose and record the exact source

In a local `MDSE_v2` checkout, fetch the branch chosen for evaluation; use `main` for a released toolset and the review branch only for an isolated pilot:

```sh
git fetch origin
git switch ux/pass08-workarea-prototype-20261119
git pull --ff-only
git status --short
git rev-parse HEAD
node --version
```

Require a clean working tree before regenerating tracked outputs. Node **22** is the repository baseline (`.nvmrc`). Record the exact SHA, branch, date and intended target vault. Do not assume the tool source in a separate local checkout matches GitHub.

## Step 2 — Rebuild *both* dependent distributions

At the `MDSE_v2` repository root:

```sh
npm run build
npm run test:workbench
npm run check:workbench
npm run check:importer
npm test
git status --short
```

`npm run build` is the required order: `build:workbench` then `build:importer`. The importer builds its Base Vault payload using `tools/workbench/dist/plugin/`. A Workbench-only rebuild leaves the committed importer HTML **stale**, so do not distribute a mixed-version pair.

Expected generated deliverables:

| Output | Purpose |
|---|---|
| `tools/workbench/dist/plugin/main.js` | Obsidian Workbench runtime |
| `tools/workbench/dist/plugin/manifest.json` and `styles.css` | Runtime metadata and styling |
| `tools/workbench/dist/mdse_workbench.html` | Offline Workbench page |
| `tools/importer/dist/mdse_importer.html` | Single-file offline importer, including controlled Base Vault/plugin payload |
| `tools/importer/TRANSLATION.md` | Importer-generated translation reference |

Review the generated diff and commit **source, tests, documentation and generated outputs** before requesting merge. The CI `check:workbench` and `check:importer` gates compare committed artifacts byte-for-byte to current source. A source build may pass while CI remains red for stale committed outputs.

`npm test` additionally requires the repository's Python/browser oracle prerequisites described in the root README. A green synthetic suite is not proof of Obsidian runtime, independent SysML parser, or real vault acceptance. Record each gate separately.

## Step 3 — Deploy to a *staging copy* of the vault first

**Recommended controlled update:** Build a paired importer and Workbench as above. Open `tools/importer/dist/mdse_importer.html` in a Chromium browser (Chrome/Edge), select the staging vault folder, then use the importer's **Step 4: Preview vault update** and inspect its exact file changes. Only then choose **Apply**.

The updater replaces controlled schemas, templates, plugin lock/config and Workbench runtime as documented in [importer/README](../tools/importer/README.md). It preserves model notes, attachments and user plugin `data.json`; the managed configuration replaced by the updater is archived in `99_System/11_Import/Update <date>/Replaced/` where applicable. The update produces a `Vault Update <date>.md` record. Inspect the preview carefully: managed settings **can** change.

**Manual Workbench-only pilot (not a full toolset update):** after closing Obsidian or disabling the Workbench, back up the staging vault's `.obsidian/plugins/mdse-workbench/`, then copy the three files from `tools/workbench/dist/plugin/` into that folder. Reopen Obsidian and enable/reload the plugin. This does *not* synchronize schemas, templates, importer, release metadata or plugin lock. If Bootstrap's controlled plugin hash check is enabled, a manual swap can fail verification. **Do not bypass, forge, or hand-edit `plugin-lock.yaml`; use the paired controlled update instead.** In `MDSE_v2_live` the historical baseline records Bootstrap as disabled pending release-lock acceptance; recheck the present state before deployment.

For `MDSE_v2_live`, keep its no-branches policy: first validate with an isolated local clone or test vault. Do not replace runtime files in live `main` or modify its model files merely because CI compiled. Deploy to live only after explicit approval, with a reproducible artifact-to-source record. If using a Git-tracked vault, stage and review only intended configuration/runtime updates.

## Step 4 — Runtime acceptance in Obsidian

On the staging vault, verify **without changing any model semantics**:

1. Open Document / Define / Structure / Verify; switching tools defaults to a **new Workbench tab**, with an explicit option to reuse the current Workbench. Existing editor, Canvas and Workbench tabs retain their contents.
2. Test **Follow / Pin** independently in two Workbench tabs; a pinned or actively edited item does not change when another note or Canvas selection changes. Check session restore. Pop-out behavior remains optional.
3. From a governed note, use **Open in MDSE workflow…** on the file context menu and **Open item in new workflow tab…** in the Workbench header. Check all four destinations, correct selected item, and no change to the originating tab. Also inspect the **Relates to / Related from**, **Find similar**, and **Common related** result lists: each resolved related element has an **↗ Workflow…** selector. Opening a result in a chosen workflow must carry the *result element*, not the original selection, and must not change the original tab's selected item, lens or Pin state.
4. Open **Find shared terms** from Find. Confirm the disposable index builds without freezing Obsidian, common terms show unique note counts and the number of element types, and searches match full tokens (e.g. `battery cooling` requires both) across names, aliases, descriptions, note bodies and SysML. Verify Requirement and Verification results are grouped with exact type counts, matching-field excerpts and type filtering. Select individual hits or **Select displayed**, then **New grouped Canvas**; it must preserve existing tabs and draw *only real pre-existing model links*. Test the separate **Add to current Canvas** action only in an explicitly disposable scratch/saved staging Canvas, because it can modify that file. The search must never create model relationships. The behavior and limitations are defined in [Shared-Term Discovery](TERM_CONNECTION_DISCOVERY.md).
5. Select one and several governed Canvas cards. Verify common neighbors rank N-of-N down to 1-of-N, each selected source counted once. Open discovery with an appropriate workflow filter, then use **All relationships** to inspect the unrestricted set.
6. On the scratch discovery Canvas, ensure temporary candidates are distinct from kept cards. **Keep selected**, **Dismiss selected**, and save: only kept cards and valid edges may survive. Select different kept cards to refresh candidates; selecting a temporary candidate must not destroy the opportunity to Keep it.
7. Draw a proposed relationship and ensure the governed editor validates/commits the SysML text transactionally, or cancels and removes the line. Canvas-only Keep is **not** a SysML relationship edit. Check ordinary saved Canvases remain unaffected by discovery refresh. In the **Note** lens open **Members and explicit connections**: inspect a typed part/port/action usage, its individual declaration, actual type definition, multiplicity, subsets/redefinitions and its explicit `connect`, `bind` and `flow` endpoints. Missing ports and external endpoints must stay visible as unresolved, never silently map to a sibling note. The **↗ Workflow…** action on a type definition should open a separate tab without changing the parent usage view. Each expanded usage also offers **Canvas connections**: verify it opens a *new scratch Canvas tab* and shows the owning note as one genuine file card, the selected usage as a distinct visual card, and only explicit `connect`, `bind`, `flow` lines. Directed `flow` arrows must retain source/target direction; `connect` and `bind` must be undirected. Missing ports and unknown external endpoints must remain labeled unresolved. Repeated statements may share an endpoint card but must not be merged into one line. Verify the default 24-connection cap, no new SysML/member notes, no edits to the original Canvas or parent Workbench, and that optional Save merely captures a static visual snapshot. Verify member filtering, 40-at-a-time pagination and retained expanded detail on Show next, including on a large synthetic note. This inspector and Canvas are read-only model projections and must not scan the full vault.
8. From each workflow use **+ New…**. Document offers Daily, Meeting, Transcript and Engineering Note as **plain Markdown** plus a governed Document; Define, Structure and Verify offer only currently supported governed element classes/subtypes. Confirm the modal requires **Preview** before **Create**. A plain note must have no UID, class, status or SysML block; a governed note must use the existing `planAddElement` writer for an authoritative ID/UID and native SysML when applicable. Confirm creation opens a new tab without changing the original Workbench context, rejects duplicate files and provides an undoable file write.
9. Verify that the Base Vault ships `Template - Daily note.md`, `Template - Meeting note.md`, `Template - Transcript.md` and `Template - Engineering note.md` under `99_System/05_Templates`. The quick-create dialog and those stored template files use the same sections. Their absence in an older installed vault means it has **not** received the latest paired importer update.
10. Create a governed note while another governed element is selected. After the first **Preview**, the dialog must show **Potential relationships — preview only**, with eligible directions evaluated using a **two-note in-memory index** (selected source and exact hypothetical new-file content), not a complete vault re-index, and specific native kinds before generic dependencies. Changing Name, Folder, or Text must clear the stale creation and relationship preview; no note or relationship may be written at this stage. Verify that plain Markdown never shows a native model relationship proposal. The Create action must write only the new note (no automatically inferred relationship). Where SysML allows a relationship in either direction, the creation modal offers a **Review relationship…** follow-up, but **Done — leave unlinked** must preserve the standalone new note. The second dialog must show eligible native relationships, their written direction, and an actual SysML diff. **Apply relationship** is a separate, explicitly approved transaction with its own Undo. Canceling must leave both notes unchanged. Try Verification Case from Requirement and confirm `verify` is written from the verification case to the requirement, not the reverse. Plain Markdown must not offer model links. The original Workbench/Canvas must remain in place.
11. Verify the existing importer preview is idempotent on a second run and does not overwrite model notes or personal state.

For live-vault index integrity, the existing `MDSE_v2_live/scripts/check-live-workbench.mjs` imports Workbench sources from a separately checked-out exact tool commit via `MDSE_TOOLS_ROOT`. Run it only where both repositories are available; it verifies model relationships and synthetic deduplication, **not** the Obsidian GUI or parser. The live vault also has separate independent SysML parser/lineage validation. Record their evidence independently.

## Step 5 — Release and traceability gate

Do **not** merge or deploy solely because source tests pass. Before promoting the UX branch, require:

- Source and generated files match at the **same SHA**; complete CI including artifact checks is green.
- No unexpected changes to template/schema/base-vault settings or engineering notes.
- Obsidian manual UX test evidence for tab focus, Follow/Pin, discovery/Keep/Save and pop-out.
- A recorded version/payload SHA and, when a governed release is made, matching Bootstrap lock/release metadata.
- Approved merge to tool `main`, followed by a separately authorized update to `MDSE_v2_live/main`.

Record the source SHA, test run URL, artifact hashes, deployed files, target vault commit (if deployed), observed Obsidian version and operator's acceptance. If a test fails, restore the backed-up plugin files or staging vault; preserve the failure report and do not declare the release complete.

## Prototype capabilities, limitations and documentation

Implemented in *review-branch source* (not yet runtime-accepted): a **Find shared terms** view for cross-type term frequency, grouped governed-note matches and Canvas placement (no inferred links); contextual **+ New…** menus in all four workflows, preview-first creation, ordinary Markdown templates without model identity and governed creation through the existing identity/SysML planner, plus an in-memory **Potential relationships** preview before creation, a separate optional **Review relationship…** and **Apply relationship** transaction for a newly created governed element, and a read-only member-level inspector and scratch Canvas for explicit `connect`/`bind`/`flow` endpoints and resolved/unresolved usage references; four work areas; global model-note search; workflow-filtered neighbor discovery and unrestricted override; ranked multi-selection; scratch-Canvas temporary / kept / dismissed candidates; automatic neighbor refresh on selecting kept cards; separate workflow tabs by default; Follow/Pin with editing protection; contextual **Open in workflow** from selected items, note menus and individual related-result rows.

Not yet validated or complete: real Obsidian UX/focus/session behavior; broader multi-hop/cross-context member-level discovery beyond the explicit owner-local connection Canvas; generalized ordinary-Markdown search; full editable template-creation customization; Verify test-execution forms; Document publishing; bundled/signed release and controlled live deployment. Class templates and the four ordinary Markdown templates are generated under `99_System/05_Templates` by Base Vault. More specialized form-based creation and document publishing remain separate work.

Related documentation: [Shared-Term Discovery](TERM_CONNECTION_DISCOVERY.md), [PR #4 staging acceptance ledger](STAGING_VALIDATION_PR4.md), [Workbench](../tools/workbench/README.md), [Importer](../tools/importer/README.md), [Base Vault](../tools/base-vault/README.md), [handover](HANDOVER.md), [pop-out acceptance](../tools/workbench/POPOUT_ACCEPTANCE.md), [live-vault baseline](https://github.com/spencerskelly/MDSE_v2_live/blob/main/LIVE_BASELINE.md).
