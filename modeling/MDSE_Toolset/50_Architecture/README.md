# Current software tool architecture — implementation inventory

**Status:** Source-backed as-built notes, not verified release acceptance or formal SysML allocation.

Start with [As-built Capability Baseline](../AS_BUILT_CAPABILITY_BASELINE.md), then inspect the tool notes and the [16-use-case evidence register](../AS_BUILT_USE_CASE_EVIDENCE.csv).

- [[OBJ-00001 - MDSE Importer]] — engineering source intake, translation, disposition and vault update
- [[OBJ-00002 - MDSE Core]] — shared parsing/model contract, with legacy merge conflict
- [[OBJ-00003 - MDSE Workbench]] — search, linked views, graph, editing, flags and aliases
- [[OBJ-00004 - MDSE Base Vault]] — controlled vault and release/plugin payload
- [[OBJ-00005 - MDSE Bootstrap]] — startup repair, author registration and plugin verification

### Evidence standards

Code exists ≠ a particular requirement is completely implemented. A test case exists ≠ its suite was run. Synthetic tests passed ≠ real Obsidian, private QEAX/BOM, or parser-backed acceptance. This inventory is a basis for traceability; current `RULESET.md` and `DECISIONS.md` remain normative.

### Relations still to validate

Tool implementation facts are recorded here as plain documentation and source path references. Proposed function-to-tool allocations should be authored in native SysML and accepted with the pinned parser, not silently created from file ownership.
