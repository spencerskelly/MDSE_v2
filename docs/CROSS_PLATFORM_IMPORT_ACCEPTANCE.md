# MDSE importer: Windows / macOS update and import hardening

**Status:** review branch `hardening/cross-platform-import-update-20261120`, draft PR #5 against the connection-discovery prototype. **Not yet accepted on real NTFS and APFS vaults.** Do not merge or deploy to MDSE_v2_live until the native staging tests below pass and the owner authorizes promotion.

## Build and automated validation evidence

- Paired artifact sync: [Actions 44860243055](https://github.com/spencerskelly/MDSE_v2/actions/runs/44860243055) — passed, artifact commit `a182afce77767b26b40395b364432e835ae840b3`. The generated importer HTML now includes the OS hardening code.
- Native platform regression: [Windows/macOS Actions 44860224606](https://github.com/spencerskelly/MDSE_v2/actions/runs/44860224606) — passed on both operating systems. A separate latest-source run is also part of PR #5.
- Browser failure-injection regression: latest PR CI run must pass with the exact generated importer HTML. **Do not mark this accepted until confirmed.**
- Physical Windows NTFS / macOS APFS folder update and Obsidian runtime: **not yet performed**.

## Supported browser / folder workflow

Use current **Chrome or Edge** on Windows or macOS. File System Access directory writes require a supported browser and the user's explicit permission. Safari and Firefox are for *new-vault ZIP export only*. The importer is self-contained HTML and does not require installing Node or Python on the engineer's PC.

**Vault preparation:** Quit Obsidian; duplicate the entire original vault to a short, nonsynchronized local path (Windows example `C:\\MDSE_Test`, macOS example `~/MDSE_Test`). Keep the original as the immutable recovery source. Do not run from iCloud Drive, OneDrive, Dropbox, a network mount, Downloads, or a vault that another process may edit during the test. Record a tree/file count and backup checksum outside the vault.

## Controlled toolset update (Maintenance; no QEAX/BOM necessary)

1. In the **paired** hardening-branch distribution, open `tools/importer/dist/mdse_importer.html` in Chrome/Edge.
2. Choose **the copied vault root**, not `.obsidian` or a parent folder. Confirm the displayed name and that the importer recognizes an existing vault.
3. Choose **Maintenance → Preview vault update**; verify each file, reason and replacement count. This creates no files.
4. Apply only to the staging copy. The hardening code must reject a changed source, changed destination, missing read permission, already-occupied report/backup path, unsafe Windows/macOS filename, path length or case/Unicode collision. The user must be asked again before mutation.
5. **All old plugin, schema, template, lock, and merged config versions** must be archived under `99_System/11_Import/Update <timestamp>/Replaced/` *before* any original is changed. Every resulting file is read back and checked.
6. A stopped update attempts to restore changed original files and delete newly added target files, leaving recovery archives. **This is best-effort rollback, not an ACID transaction**; a crash/power loss can interrupt rollback. A complete pre-test vault copy remains mandatory.
7. Preview again: expect no additional changes. Start Obsidian, open Workbench, use Find shared terms, inspect existing Requirements/Verification elements, and confirm no engineering notes or attachments were altered.

## Importing QEAX or BOM into an existing vault

1. Select the data source, **your author identity**, and the staging vault folder; run flags/preflight where offered.
2. Inspect conflicts, deferred/untyped elements, source counts, duplicate identifiers and Windows filename/path warnings.
3. Use **Write to chosen folder** after previewing the stated planned output. The guarded import will compare notes to the disk snapshot, reject an externally changed note, back up existing target file bytes (including binary attachments) before overwriting, skip byte-identical outputs, and read back written bytes.
4. If an interrupted operation occurs, inspect the error and `99_System/11_Import/Import <timestamp>/Replaced/`. The importer attempts rollback of changed targets and leaves the backups.
5. Reopen the staging vault and compare note counts, UID/ID uniqueness, sample source relationships and BOM structure. Repeat identical input; it should not overwrite user changes or produce duplicate model notes. Do not use a failed or partial import for engineering release.

## Platform-specific validation ledger (must be run locally on BOTH OSes)

| Test | Windows NTFS | macOS APFS |
|---|---|---|
| Existing vault Preview then Apply; second Preview no changes | Not tested | Not tested |
| Existing note, attachments, plugin `data.json`, Obsidian workspace preserved | Not tested | Not tested |
| Replaced plugin/settings backed up and read back before modification | Not tested | Not tested |
| Change `.obsidian/app.json` after preview; Apply refuses without overwrite | Not tested | Not tested |
| Case collision (`TEST.md` vs `test.md`) and Unicode-equivalent name refused | Not tested | Not tested |
| Windows device name / trailing dot/space / non-ASCII overlong path refused | Not tested | Not tested |
| Interrupt a write to `.obsidian/community-plugins.json`; originals restored, backup retained | Not tested | Not tested |
| Import synthetic QEAX twice and BOM twice, no duplicate notes or lost edits | Not tested | Not tested |
| Heavy import (several thousand notes), no UI hang or partial write; recover from interrupted run | Not tested | Not tested |
| Obsidian Workbench opens; shared-term discovery and Canvas views work | Not tested | Not tested |

**Automated tests are necessary but not sufficient.** GitHub CI runs browser File System Access against simulated Origin Private File System storage, not real NTFS/APFS. The native OS CI matrix runs the importer and Workbench Node tests and checks deterministic distribution builds; neither simulates OneDrive/iCloud, antivirus locks, Windows long-path policy, or force-quitting a production Obsidian vault. Those require local staging tests before primary-vault use.

## Boundaries

- Only existing-file updates and folder imports receive the hardening behavior; ZIP generation remains non-mutating.
- `safeImportWrite` and the update Apply do not claim ACID semantics: failure recovery is best-effort and may need restoring the full pre-test vault copy.
- File System Access does not expose the full selected path; the importer limits the vault-relative path conservatively, but the operator must choose a short physical vault root.
- Managed configuration keys may change (as declared by the importer's preview). Bootstrap/plugin lock may require reloading Obsidian.
- Import validity and SysML v2 semantic correctness still require independent model review and parser tests.

[Toolset update guide](TOOLSET_UPDATE.md) · [Importer README](../tools/importer/README.md) · [Draft hardening PR #5](https://github.com/spencerskelly/MDSE_v2/pull/5)
