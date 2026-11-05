---
type: Behavior
subtype: function
id: BEH-00007
uid: 20261021195900006skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_BEH_00007::MaintainModelKnowledge
---
# Maintain and Improve Model Knowledge

> [!note] Logical function — draft from stakeholder use cases
> Describes what MDSE does, not which software component owns it. Cross-element links and acceptance remain provisional.

## Purpose

Create and correct engineering knowledge, review flags and conflicting changes, and preserve identity, approval, provenance and model integrity.

## Inputs

Engineer input, model state, source changes, flags and permissions.

## Outputs

New or corrected model notes, review evidence, conflict dispositions and residual issues.

## Functional decomposition candidates

- Find or reuse an existing concept before adding a new one
- Preview added/changed model meaning and potential linked impacts
- Validate/apply allowed changes or retain conflicts for review
- Display, investigate and disposition flags with evidence
- Preserve accepted engineer changes during re-import

## Function boundary

Flag visibility is separate from review authority; deleting a callout alone is not proof of correctness.

## Use cases depending on this function

- [[UC-00001 - Import an Engineering Model]]
- [[UC-00007 - Add Engineering Knowledge]]
- [[UC-00008 - Correct or Complete Knowledge]]
- [[UC-00009 - Review and Resolve Flagged Model Items]]
- [[UC-00016 - Display Flagged Model Data]]

## Candidate verification outcome

A correction preserves UID; unapproved source changes do not overwrite engineer edits; flags remain visible until disposition.

## Existing implementation evidence — not certification

Partial: tools/workbench/src/edit.ts and edit_rel.ts; tools/importer/src/merge.ts. Core mergeNote behavior conflicts with newer approval policy.

## Proposed subfunctions

- Creation/reuse
- controlled edits
- flag review
- integrity

## Trace status

- [[STK-00013 - Engineering Knowledge Base]]
- Derived system requirements, component allocations, verification cases and run results: pending
- No native SysML relationship has yet been parser-certified for this trace.

## SysML v2

> Draft standalone action definition; parser acceptance and typed relationship declarations remain to be verified.

```sysml
package MDSE_BEH_00007 {
    action def MaintainModelKnowledge {
        doc /* Create and correct engineering knowledge, review flags and conflicting changes, and preserve identity, approval, provenance and model integrity. */
    }
}
```
