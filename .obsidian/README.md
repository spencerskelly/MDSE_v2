# MDSE developer vault — Obsidian plugins

This folder enables a **development test vault** when the `mdse_v2_cleanup` repository branch is opened directly in Obsidian.

- **MDSE Workbench 0.9.0** is installed and listed in `community-plugins.json`, subject to Obsidian's explicit Community Plugins trust/enable step.
- **MDSE Bootstrap 0.1.0** is installed but **not enabled**. The repository root lacks the generated `.obsidian/plugin-lock.yaml` and managed release payload expected by Bootstrap. Enable Bootstrap only in an actual generated Base Vault or after generating the lock; otherwise it will report the missing lock.
- Source files are in `tools/workbench/` and `tools/bootstrap/`. The runtime copies in this folder are derived development assets; do not edit them directly.
- Obsidian user preferences and workspace state are excluded by the repository's `.gitignore`.
- This does not alter the release Base Vault or install anything on your computer automatically. Pull the branch, open this folder in Obsidian, and explicitly trust/enable community plugins.

After changing Workbench source, run `npm run build:workbench` and refresh these test-vault copies before assessing it in Obsidian. Plugin file changes may require reloading Obsidian.
