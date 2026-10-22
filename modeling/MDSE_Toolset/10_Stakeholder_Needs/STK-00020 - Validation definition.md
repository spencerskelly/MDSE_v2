---
type: Requirement
subtype: stakeholder
id: STK-00020
uid: 20261021181500008skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_STK_00020::ValidationDefinition
---
# Validation definition

> [!note] Stakeholder capability need — draft definition
> The **title** was supplied by the MDSE owner on 2026-10-21. The interpretation, stakeholders, outcomes and tool impact below are proposals for review, not approved requirements.

## Need

Define test objectives, verification or validation cases, conditions, procedures and acceptance evidence linked to the engineering intent they address.

## Stakeholders (proposed)

Verification engineers; validation engineers; requirement owners

## Desired outcome (proposed)

For a requirement, locate the planned verification or validation method, acceptance criteria and result evidence.

## Candidate use case

Define verification and validation evidence

## Impact on toolset (preliminary)

Core; Workbench; Testing

## Existing coverage (preliminary)

Verification Case mapping exists; comprehensive trace-to-execution remains unverified.

## Candidate trace

- Use case, function, system requirements, architecture allocation and verification: not yet traced; fill after need review.

## Review questions

- Is this the intended stakeholder problem and desired outcome?
- Which outputs or decisions are in scope, and which are not?
- What existing functions, rules, implementations and tests should be reused?

## SysML v2

> Draft SysML definition, not parser-certified. Formal cross-element relationships will be added after native syntax/endpoint review; this note is not a release requirement.

```sysml
package MDSE_STK_00020 {
    requirement def ValidationDefinition {
        doc /* Define test objectives, verification or validation cases, conditions, procedures and acceptance evidence linked to the engineering intent they address. */
    }
}
```
