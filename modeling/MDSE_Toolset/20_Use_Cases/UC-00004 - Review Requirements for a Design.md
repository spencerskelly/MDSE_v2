---
type: Use Case
subtype: what
id: UC-00004
uid: 20261021181501003skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_UC_00004::ReviewDesignRequirements
---
# Review Requirements for a Design

> [!note] Draft use case for Engineering Knowledge Base
> The user action comes from the owner. Process steps, actors and success outcomes are initial interpretations for review; not an approved software specification.

## Intent

Check which requirements are identified for a design.

## Primary actor

Design engineer; systems engineer; reviewer

## Trigger

A design is being defined, reviewed, or modified.

## Main scenario (proposed)

Select design; find explicitly related requirements; inspect source, status and verification; identify unmapped requirements.

## Successful outcome

Engineer can inspect traceable requirements and coverage gaps for the design.

## Alternative and review concern

No linked requirements is a coverage gap, not proof none apply.

## Candidate logical functions

Find requirement associations; display traces; report coverage gaps.

## Traceability

- Stakeholder need: [[STK-00013 - Engineering Knowledge Base]]
- Engineering requirements: not yet derived
- Test case and executed evidence: not yet established
- Formal SysML link to stakeholder need: pending independent parser validation

## SysML v2

> Draft use-case definition only; do not treat Markdown navigation as certified native SysML relationship semantics.

```sysml
package MDSE_UC_00004 {
    use case def ReviewDesignRequirements {
        doc /* Check which requirements are identified for a design. */
    }
}
```
