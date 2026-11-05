---
type: Object
subtype: software
id: OBJ-00002
uid: 20261022025900001skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_OBJ_00002::MDSECore
---
# MDSE Core

> [!note] Existing source component — as-built observation, draft
> This note records implemented repository structure. It is not a new tool proposal, formal system allocation, or a claim of completed acceptance.

## Existing component purpose

Shared note and SysML block parsing, note validation, serialization helpers and model identity lookups.

## Source code

- `tools/core/src/mdse_core.js`

## Related test definitions

- `tools/core/test/mdse_core.test.mjs`

## Candidate function relevance

- BEH-00002
- BEH-00003
- BEH-00004
- BEH-00007

## Significant gap or conflict

The currently retained core mergeNote refreshes existing SysML/source fields without approval, conflicting with importer merge policy.

## Verification and review

Code and test definitions were inspected in GitHub. Dedicated suites were not executed for this baseline; runtime/engineering acceptance and native SysML connections remain unverified.

## SysML v2

> Draft model definition only; independent parser and semantic trace checking have not been run.

```sysml
package MDSE_OBJ_00002 {
    part def MDSECore {
        doc /* Shared note and SysML block parsing, note validation, serialization helpers and model identity lookups. */
    }
}
```
