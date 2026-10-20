# importer

Turns source files into an MDSE vault. Phase 1: EA `.qeax`. Phase 2: product BOMs. Shipped to users as **one offline HTML file** (`dist/mdse_importer.html`): double-click, no install, no network.

**Specification:** [SPEC.md](SPEC.md). **Rules:** RULESET.md sections IMP and BOM, plus MOD.

## Owns

Reading sources, mapping by `governance/schemas/ea-family-mapping.json`, identity allocation, writing notes (new vault as ZIP, or onto an existing vault folder), the source ledger, the changelog and import flags.

## Does not own

Editing after import, review decisions, choosing which plugins exist (the base vault does; the importer only installs what it ships), the note format itself (that is `tools/core`).

## Layout

| Path | What |
|---|---|
| `src/qeax_reader.js` | Streaming read-only SQLite reader for `.qea`/`.qeax`. No SQL engine, no writes |
| `src/importer.template.html` | Page shell: Start, analyse source, check a vault, report issues |
| `build.mjs` | Inlines `src/` and `../core/src/` into one HTML file |
| `dist/mdse_importer.html` | The built tool. Committed; CI fails if it is stale |

## State

| Part | State | Evidence |
|---|---|---|
| QEAX reader | Working | Rows identical to `sqlite3` on overflow pages, NULLs, Unicode, blobs, large integers; non-SQLite input rejected (`testing/oracles/test_qeax_reader.py`) |
| Page shell, offline check, ZIP output | Working | Chromium smoke test (`testing/oracles/test_importer_browser.py`) |
| QEAX to notes (M2) | **Built on provisional rules (D-0016)**; synthetic data only | `tools/importer/test/importer.test.ts`: validates every note, ids/uids unique, re-import is a no-op, add-onto is additive |
| SysML v2 writer (M3) | **Built, blocks not parser-checked** (parser gate runs in CI only; report says "NOT RUN") | same tests; assembled-reference check |
| Vault update (no source) | Working | `tools/importer/test/vault_update.test.ts`, browser test `VaultUpdateBrowser`. Step 4 of the page |
| BOM reader | **Not built** (P2) | — |
| Run on real QEAX | **Never run** from this repository | — |

## Update an existing vault (no source needed)

Step 4 of the page. Choose a vault folder in step 2, press **Preview vault update**, read the table, then **Apply**. Nothing is written by the preview. It brings the vault's configuration up to this importer's release (D-0024):

| Files | What happens |
|---|---|
| `99_System/02_AI`, `03_Schemas`, `05_Templates`, `.obsidian/plugin-lock.yaml` | Replaced when different. The old copy is saved first under `99_System/11_Import/Update <date>/Replaced/`. |
| `.obsidian/plugins/mdse-workbench/` (`main.js`, `manifest.json`, `styles.css`) | Replaced when different (the release is reproducible, so no copy). |
| `.obsidian/community-plugins.json`, `core-plugins.json` | Shipped entries added; your other entries kept. |
| `.obsidian/app.json` | The governed keys are set; your other settings kept. |
| `.gitignore` | Missing shipped lines appended; nothing removed. |
| `.vault.yaml` | Vault identity kept; only `mdse_release` and `schema` update. |
| `README.md`, view-folder READMEs, anything else | Created if missing, never overwritten. |
| Notes, attachments, plugin `data.json`, workspace files, anything not shipped | Not read, not touched. Nothing is deleted. |

A folder with no vault gets the whole base vault. A `Vault Update <date>.md` note in `99_System/11_Import` lists every change. A malformed JSON config is left alone and reported. Running it again changes nothing.

## Run

```bash
npm run build            # workbench, then importer (the importer embeds the Workbench plugin build)
npm run build:importer   # after any change to src/ or tools/core/src/
npm run check:importer   # what CI runs
```

Browser support: writing into an existing folder needs the File System Access API (Chrome, Edge). Firefox and Safari can only build ZIPs.

## Next

M2 in [SPEC.md](SPEC.md#milestones).
