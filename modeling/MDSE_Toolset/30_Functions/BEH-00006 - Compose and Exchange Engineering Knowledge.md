---
type: Behavior
subtype: function
id: BEH-00006
uid: 20261021195900005skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_BEH_00006::ComposeEngineeringKnowledge
---
# Compose and Exchange Engineering Knowledge

> [!note] Logical function — draft from stakeholder use cases
> Describes what MDSE does, not which software component owns it. Cross-element links and acceptance remain provisional.

## Purpose

Assemble existing notes and sections into documents or presentations with native Obsidian ![[...]] transclusion and produce governed exports.

## Inputs

Authoritative notes, sections and views; intended audience; output constraints.

## Outputs

Composed notes, rendered documents or presentations; source links; warnings.

## Functional decomposition candidates

- Select reusable model content and intended audience
- Compose transclusions or derived viewpoints without copying semantic authority
- Resolve embedded references and reveal missing/cyclic transclusions
- Produce an inspected document or export where supported

## Function boundary

Transclusion is presentation reuse, not SysML part ownership. Customer/supplier publication controls remain separate.

## Use cases depending on this function

- [[UC-00006 - View and Export Engineering Information]]
- [[UC-00011 - Display Linked Elements in Document Viewpoints]]
- [[UC-00015 - Compose Documentation from Embedded Notes]]

## Candidate verification outcome

A composed document embeds a source without changing it; missing embeds are discoverable; exports retain provenance.

## Existing implementation evidence — not certification

Partial: native Obsidian embed support and Workbench table/CSV exports; full composition/export workflow unverified.

## Proposed subfunctions

- Note and section transclusion
- composition
- export

## Trace status

- [[STK-00013 - Engineering Knowledge Base]]
- Derived system requirements, component allocations, verification cases and run results: pending
- No native SysML relationship has yet been parser-certified for this trace.

## SysML v2

> Draft standalone action definition; parser acceptance and typed relationship declarations remain to be verified.

```sysml
package MDSE_BEH_00006 {
    action def ComposeEngineeringKnowledge {
        doc /* Assemble existing notes and sections into documents or presentations with native Obsidian ![[...]] transclusion and produce governed exports. */
    }
}
```
