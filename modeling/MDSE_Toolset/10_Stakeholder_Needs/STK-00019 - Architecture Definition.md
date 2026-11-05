---
type: Requirement
subtype: stakeholder
id: STK-00019
uid: 20261021181500007skellyspencer
status: Draft
tags: []
sourceRole: authoritative-model
primarySymbol: MDSE_STK_00019::ArchitectureDefinition
---
# Architecture Definition

> [!note] Stakeholder capability need — draft definition
> The **title** was supplied by the MDSE owner on 2026-10-21. The interpretation, stakeholders, outcomes and tool impact below are proposals for review, not approved requirements.

## Need

Define product structure, interfaces, behavior, allocations, ownership and reusable component definitions in a consistent system model.

## Stakeholders (proposed)

Systems architects; hardware/software engineers; integration leads

## Desired outcome (proposed)

Inspect part hierarchy, interfaces, behavior and allocations and identify the impact of architectural change.

## Candidate use case

Build and inspect a system architecture

## Impact on toolset (preliminary)

Core; Importer; Workbench

## Existing coverage (preliminary)

Part/port/interface/behavior translation and Workbench views have synthetic coverage.

## Candidate trace

- Use case, function, system requirements, architecture allocation and verification: not yet traced; fill after need review.

## Review questions

- Is this the intended stakeholder problem and desired outcome?
- Which outputs or decisions are in scope, and which are not?
- What existing functions, rules, implementations and tests should be reused?

## SysML v2

> Draft SysML definition, not parser-certified. Formal cross-element relationships will be added after native syntax/endpoint review; this note is not a release requirement.

```sysml
package MDSE_STK_00019 {
    requirement def ArchitectureDefinition {
        doc /* Define product structure, interfaces, behavior, allocations, ownership and reusable component definitions in a consistent system model. */
    }
}
```
