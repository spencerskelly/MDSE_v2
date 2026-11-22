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

## Pre-1.0 development policy (engineering decision, 2026-11-21)

**The MDSE toolset is not released for use and must remain in development/test status throughout the 0.x.x series. The next development baseline is 0.11.0. Version 1.0.0 is reserved for the first explicitly approved release for use, after the agreed acceptance and readiness gates.** A successful source merge, CI run, new version or distributable build is *not* that approval.

Version numbers use **MAJOR.MINOR.PATCH**. For development, use:

| Change | Version progression | Treatment |
|---|---|---|
| Next integrated development baseline | `0.11.0` | Candidate/testing, not live |
| Small fix, refinement or incremental improvement | `0.11.0 → 0.11.1 → 0.11.2` | Increment PATCH; document effect in history |
| Meaningful new feature, workflow or integration | `0.11.x → 0.12.0` | Increment MINOR and reset PATCH |
| Significant architectural or compatibility break before 1.0 | e.g. `0.12.x → 0.13.0` | Advance MINOR with an explicit breaking/migration warning; **do not call it 1.0.0** |
| First formally approved release for use | `1.0.0` | Requires explicit readiness/acceptance decision and a controlled release record |

Once `1.0.0` is formally approved, use conventional semantic versioning: PATCH for compatible fixes, MINOR for backward-compatible capabilities, MAJOR for incompatible changes. **Never reuse a version for different shipped code**. No nightly date-based versioning. Component versions and the bundled Importer/toolset versions may differ because they represent different independently maintained software, but every changed distributable has an increased, traceable version.

A source change must update its own component version **and** the coordinated toolset version in the same PR. `scripts/check-versions.mjs` compares implementation changes to the PR base or prior main commit and fails CI when a required component version was not increased. Docs/test-only changes need no bump. A source merge, version bump or Git tag is never sufficient evidence of release approval; any optional pre-1.0 test tag must be clearly identified as a development candidate, and a release-for-use tag is reserved for the approved 1.0.0 milestone.

## Status and version identification

- The single offline Importer HTML displays **Importer vX.Y.Z • toolset vX.Y.Z • build <content-hash>** in the header. Its expanded **Importer version history** is bundled from `tools/importer/version.json` and shows known version notes even with no network. The newest entry must match the current Importer version. This is local history, not live online freshness detection. The build hash changes with packaged bytes; it is not a human-facing release number.
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
6. For **0.x development candidates**, retain version history, source SHA, built-artifact hash, test evidence and explicit status **candidate / internal testing only**. No version increment or successful CI result authorizes a released-for-use tag or production deployment.
7. Only after an **explicit go-live decision** and completed acceptance/readiness gates, advance to **1.0.0**, document release approval and artifact SHA256, and create the approved release tag (for example, `mdse-v1.0.0`). Then deploy through Importer **Preview vault update → Apply** and an authorized Bootstrap lock, separately approving any change to `MDSE_v2_live`. Until then, test in disposable/staging vault copies.

## Initial explicit Importer baseline

The Importer previously inherited root `package.json` `0.10.0`, while the page also displayed a ten-character content hash. **v0.11.0 is the first separately tracked Importer version**, introduced with this versioning policy; it is a candidate build until staging acceptance. Workbench remains v0.10.0 and Bootstrap remains v0.1.0 because their source code has not changed in this versioning increment. The coordinated toolset advances to v0.11.0 to reflect the new Importer packaging.

No existing vault was silently upgraded, and no prior importer version history beyond the inherited release/build hash is reconstructed or asserted.
