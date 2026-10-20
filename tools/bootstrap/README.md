# bootstrap

Obsidian plugin that makes a released vault ready for a person, every time it opens.

**Rules:** RULESET.md section BOO. **State: not built.** The V1 Bootstrap (0.3.x) is prior art.

## Owns

- Release integrity: verify every locked plugin's version and file hashes against `.obsidian/plugin-lock.yaml`, including governed settings.
- Safe activation repair after the user trusts the author: enable locked plugins that pass verification, enable required core plugins, disable prohibited ones. A plugin that fails verification stays disabled and is reported.
- Author registration: the person enters their name once; Bootstrap derives the 13-character author code by the fixed rule and creates their person note in `99_System/04_People`.
- Staged startup: light checks immediately, full verification in a quiet window with a bounded maximum delay; single-flight; safe across unload and reload.

## Does not own

Downloading or updating plugins, model content, engineering edits, Workbench behaviour.

## Next

1. Review the BOO rules (mostly Unreviewed).
2. Port the V1 plugin to TypeScript in this folder using `tools/core` for author codes, with unit tests.
3. First-open acceptance on Windows and macOS (Phase 1, step 4).

## Prior art (archive, read-only)

`Test_Vault_` at commit `4a2b154`: `100_Archive/V1/13_Bootstrap/` (Definition, Tools, Testing).
