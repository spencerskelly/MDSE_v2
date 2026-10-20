# importer

Turns source files into an MDSE vault. Phase 1: EA `.qeax`. Phase 2: product BOMs. Shipped to users as **one offline HTML file** (`dist/mdse_importer.html`): double-click, no install, no network.

**Specification:** [SPEC.md](SPEC.md). **Rules:** RULESET.md sections IMP and BOM, plus MOD.

## Owns

Reading sources, mapping by `governance/schemas/ea-family-mapping.json`, identity allocation, writing notes (new vault as ZIP, or onto an existing vault folder), the source ledger, the changelog and import flags.

## Does not own

Editing after import, review decisions, plugin management, the note format itself (that is `tools/core`).

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
| BOM reader | **Not built** (P2) | — |
| Run on real QEAX | **Never run** from this repository | — |

## Run

```bash
npm run build:importer   # after any change to src/ or tools/core/src/
npm run check:importer   # what CI runs
```

Browser support: writing into an existing folder needs the File System Access API (Chrome, Edge). Firefox and Safari can only build ZIPs.

## Next

M2 in [SPEC.md](SPEC.md#milestones).
