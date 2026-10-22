---
type: Object
subtype: software
id: OBJ-00003
uid: 20261022025900002skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_OBJ_00003::MDSEWorkbench
---
# MDSE Workbench

> [!note] Existing source component — as-built observation, draft
> This note records implemented repository structure. It is not a new tool proposal, formal system allocation, or a claim of completed acceptance.

## Existing component purpose

Engineer-facing Obsidian plugin and offline viewer with model indexing, relationship views, review queue, canvases and selected editing actions.

## Source code

- `tools/workbench/src/index.ts`
- `tools/workbench/src/views.ts`
- `tools/workbench/src/plugin.ts`

## Related test definitions

- `tools/workbench/test/workbench.test.ts`
- `tools/workbench/test/edit.test.ts`
- `tools/workbench/test/merge.test.ts`

## Candidate function relevance

- BEH-00003
- BEH-00004
- BEH-00005
- BEH-00006
- BEH-00007

## Significant gap or conflict

Primary search does not index aliases or scoped SysML text; no confirmed multi-seed shared-connection query; real Obsidian acceptance unverified.

## Verification and review

Code and test definitions were inspected in GitHub. Dedicated suites were not executed for this baseline; runtime/engineering acceptance and native SysML connections remain unverified.

## SysML v2

> Draft model definition only; independent parser and semantic trace checking have not been run.

```sysml
package MDSE_OBJ_00003 {
    part def MDSEWorkbench {
        doc /* Engineer-facing Obsidian plugin and offline viewer with model indexing, relationship views, review queue, canvases and selected editing actions. */
    }
}
```
