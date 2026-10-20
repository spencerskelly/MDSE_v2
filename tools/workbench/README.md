# workbench

Obsidian plugin: the engineer's interface to the model. Phase 1 is read-only. Phase 3 adds editing.

**Rules:** RULESET.md section WKB, plus MOD. **State: not built for V2.** Workbench moves into this repository (D-0002); the V1 plugin (`spencerskelly/MDSE_Workbench`, release 0.1.18) and the V2 browser prototype are prior art.

## Owns

- A disposable index of the vault built from note frontmatter and SysML v2 text (through `tools/core`); never a second store of model meaning.
- Navigation, note view, SysML structure view, where-used, flags and review queue, saved views.
- Showing whether each note's SysML block passed the parser check; marking the report stale when a block changes.
- Phase 3: transactional edits that rewrite the owning note's SysML block, validated before save, with undo; a stale view freezes and asks for refresh.

## Does not own

Model semantics, importer mapping, release packaging, Git.

## Specification (Phase 1, read-only)

- Usable on a vault of real-model size; startup does no model I/O before Obsidian's metadata is resolved; heavy work is staged and yields to the user (WKB rules carried from V1, Unreviewed).
- Canvas and layout are presentation only.
- Shows definition versus usage, provenance (`## Source: EA`), and every flag.
- Scale smoke test: 10,000 notes in CI (TST-002).

## Decisions needed before building

- OD-09: which V1 subsystems (semantic cache, staged startup, runtime health) are ported and which are rebuilt. Needs read access to `MDSE_Workbench`.
- OD-02: how relationships are queried now that they live only in SysML text (affects the index and Rovo).

## Prior art (read-only)

- `spencerskelly/MDSE_Workbench` (V1 plugin, TypeScript, with CI and scale benchmarks).
- `Test_Vault_` at commit `4a2b154`: `24_Workbench/v2-workbench.html` (read-only browser prototype over SysML text), `24_Workbench/docs/` (approved mapping rationale).
