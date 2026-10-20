# base-vault

Builds the Obsidian vault that users receive, and the release manifest that pins every tool, schema and plugin.

**Rules:** RULESET.md section BAS. **State: not built.** No code has been carried; the V2 pilot scaffold in Test_Vault_ was not deployable.

## Owns

- Vault skeleton: folders, class templates, `99_System/` content copied from `governance/` (see ARCHITECTURE.md, "What ships into a vault").
- The controlled plugin payload: community plugins plus Bootstrap and Workbench builds, each pinned and hashed in `.obsidian/plugin-lock.yaml`, with governed settings hashed too.
- `.vault.yaml` with `mdse_release` and an uninitialized vault identity (the importer initializes it).
- The release manifest: the only place exact versions and hashes appear (MOD-146).
- A release check that rebuilds and compares byte for byte.

## Does not own

Model content, model semantics, author registration (Bootstrap).

## Specification (Phase 1)

| Requirement | Rule area |
|---|---|
| Deterministic build: same inputs give identical output | BAS |
| Plugins ship inside the vault; opening needs only "Trust author" | BAS, BOO |
| Plugin stack: Bootstrap, Workbench, Templater, Advanced Canvas, Obsidian Git essential; Fileclass, Breadcrumbs provisional; Dataview retired | BAS |
| OS metadata (`.DS_Store`, `Thumbs.db`) never enters a build | BAS |
| Initialization scripts pass `sh -n` | BAS |
| Each importer release is paired with one base release, checked before writing | BAS |

## Next

1. Decide the vault folder skeleton and templates (templates must match `element-types.yaml` and D-0003).
2. Port the V1 build and release check to TypeScript under this folder, with tests.
3. Define the release manifest format.

## Prior art (archive, read-only)

`Test_Vault_` at commit `4a2b154`: `100_Archive/V1/10_Base Vault/` (v0.8 controlled release, manifest, lock and hash strategy, `Tools/v0.8.0-r2/`), `20_Base Vault/` (V2 pilot scaffold and staged plugin payload).
