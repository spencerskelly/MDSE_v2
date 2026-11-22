# MDSE tool and release versioning

The versions in the tool UI must represent **real progression**, not just repeated rebuilds of a stale version. This policy applies to MDSE_v2 source and shipped tool artifacts.

## Independent semantic versions

| Version | Source of truth | When it changes |
|---|---|---|
| **Importer** | `tools/importer/version.json` | Any source/UI/translation change to the Importer **or any bundled component** (Workbench, Bootstrap, Base Vault, shared Core, governed schemas or pinned third-party payload). Every different packaged HTML must have a new Importer version |
| **Workbench** | `tools/workbench/manifest.json` | Workbench source, shell or build behavior changes |
| **Bootstrap** | `tools/bootstrap/manifest.json` | Bootstrap source/runtime behavior changes |
| **Coordinated toolset** | root `package.json` | Any change in a shipped component, source schema/template, pinned plugin or Base Vault payload |
| **Third-party Obsidian plugins** | vendor manifests, validated by generated `plugin-lock.yaml` | Only when a specific pinned dependency changes; retain upstream version |

Version numbers use **MAJOR.MINOR.PATCH** (e.g. 0.11.0): PATCH for a compatible fix, MINOR for a user-visible feature or workflow increment, MAJOR for breaking migration/incompatibility. Pre-1.0 may change minor for incompatible behavior. **Never reuse a version for different shipped code**; on an intentional hotfix, increase PATCH. No nightly date-based versioning.

A source change must update its own component version **and** the coordinated toolset version in the same PR. `scripts/check-versions.mjs` compares implementation changes to the PR base or prior main commit and fails CI when a required component version was not increased. Docs/test-only changes need no bump. A tag is an approved release only after staged runtime acceptance.

## Status and version identification

- The single offline Importer HTML displays **Importer vX.Y.Z • toolset vX.Y.Z • build <content-hash>** in the header. The build hash changes with packaged bytes; it is not a human-facing release number.
- The Workbench Obsidian plugin manifest displays its independently versioned release; Bootstrap likewise.
- The importer’s existing **Toolset version check** shows the selected vault’s installed release plus installed Workbench/Bootstrap versions and file drift. A vault can be behind, ahead or have changed files despite matching version labels.
- An importer is an **offline file**. It cannot know the latest GitHub release without explicit comparison or opening a newer downloaded file; never claim automatic online updating. Check the version and build hash against a known approved release record before installing.
- When the selected vault's toolset is newer than the bundled Importer release, updating it would be a **downgrade**. Leave the updater unticked and require an explicit reviewed decision.
- A source merge and a built artifact are not automatically a released or deployed tool. A deployed vault must record a validated artifact SHA, release, operator and target configuration.

## Release process

1. Define the change and its effect on Importer, Workbench, Bootstrap, Base Vault, shared Core and schemas.
2. Increase affected component versions and toolset version; update `CHANGELOG.md`.
3. Rebuild **in order** with `npm run build` (Workbench followed by Importer), commit paired `dist` outputs, plugin manifests and updated lock payload. Never rebuild only Workbench when Importer embeds it.
4. Run `npm run check:versions`, full unit/browser/native CI, generated-artifact freshness checks and independent parser gates as applicable. The PR-specific version gate examines diff from base.
5. Stage exact built artifacts in a disposable Obsidian/NTFS/APFS vault; compare installed versions and SHA, verify undo/restore.
6. After approved acceptance, record the release in the changelog and create a matching Git tag such as `mdse-v0.11.0`; include artifact SHA256 and relevant acceptance evidence.
7. Deploy through Importer’s **Preview vault update → Apply** and authorized Bootstrap lock. Verify the after-state. The active live vault has separate approval and no-branch governance.

## Initial explicit Importer baseline

The Importer previously inherited root `package.json` `0.10.0`, while the page also displayed a ten-character content hash. **v0.11.0 is the first separately tracked Importer version**, introduced with this versioning policy; it is a candidate build until staging acceptance. Workbench remains v0.10.0 and Bootstrap remains v0.1.0 because their source code has not changed in this versioning increment. The coordinated toolset advances to v0.11.0 to reflect the new Importer packaging.

No existing vault was silently upgraded, and no prior importer version history beyond the inherited release/build hash is reconstructed or asserted.
