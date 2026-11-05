---
type: Object
subtype: software
id: OBJ-00005
uid: 20261022025900004skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_OBJ_00005::MDSEBootstrap
---
# MDSE Bootstrap

> [!note] Existing source component — as-built observation, draft
> This note records implemented repository structure. It is not a new tool proposal, formal system allocation, or a claim of completed acceptance.

## Existing component purpose

Obsidian startup and repair plugin for plugin integrity, governed settings, core plugin activation and author registration.

## Source code

- `tools/bootstrap/src/main.js`

## Related test definitions

- `tools/bootstrap/test/bootstrap.test.mjs`

## Candidate function relevance

- BEH-00007

## Significant gap or conflict

Bootstrap is JavaScript despite TypeScript governance; simulated tests exist, but real first-open testing and staged startup acceptance are unverified.

## Verification and review

Code and test definitions were inspected in GitHub. Dedicated suites were not executed for this baseline; runtime/engineering acceptance and native SysML connections remain unverified.

## SysML v2

> Draft model definition only; independent parser and semantic trace checking have not been run.

```sysml
package MDSE_OBJ_00005 {
    part def MDSEBootstrap {
        doc /* Obsidian startup and repair plugin for plugin integrity, governed settings, core plugin activation and author registration. */
    }
}
```
