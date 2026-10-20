# bootstrap

Obsidian plugin that makes a released vault ready for a person, every time it opens.

**Rules:** RULESET.md section BOO. **State: 0.1.0 built (D-0032), plain JavaScript in `src/main.js`, tested against a stand-in for Obsidian only; never run in real Obsidian.** The V1 Bootstrap (0.3.x) is prior art.

Does today: lock check (SHA-256), enable verified plugins, merge governed settings into `data.json`, core plugin repair, author prompt when `.vault.yaml` has none, a "Check and repair this vault" command. Not yet: staged startup with a quiet window (BOO-006), `authors.yaml` registration, TypeScript port.

## Owns

- Release integrity: verify every locked plugin's version and file hashes against `.obsidian/plugin-lock.yaml`, including governed settings.
- Safe activation repair after the user trusts the author: enable locked plugins that pass verification, enable required core plugins, disable prohibited ones. A plugin that fails verification stays disabled and is reported.
- Author registration: the person enters their name once; Bootstrap derives the 13-character author code by the fixed rule and creates their person note in `99_System/04_People`.
- Staged startup: light checks immediately, full verification in a quiet window with a bounded maximum delay; single-flight; safe across unload and reload.

## Does not own

Downloading or updating plugins, model content, engineering edits, Workbench behaviour.

## Next

1. First-open acceptance in real Obsidian on Windows and macOS (Phase 1, step 4).
2. Review the BOO rules (mostly Unreviewed).
3. Staged startup (BOO-006) and a TypeScript port using `tools/core` for author codes.

## Prior art (archive, read-only)

`Test_Vault_` at commit `4a2b154`: `100_Archive/V1/13_Bootstrap/` (Definition, Tools, Testing).
